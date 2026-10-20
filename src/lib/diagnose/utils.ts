import { existsSync, readFileSync, readdirSync, type Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { dirname, join, relative, resolve, sep } from "node:path";
import * as Stream from "effect/Stream";
import * as Effect from "effect/Effect";
import * as Queue from "effect/Queue";
import ignore from "ignore";
import { IGNORED_DIRECTORIES } from "./constants.ts";
import type { GitOutputReader } from "./types.ts";

type IgnoreLayer = {
  base: string;
  matcher: ignore.Ignore;
  parent?: IgnoreLayer;
};

type GitOutputRequest = {
  root: string;
  args: string[];
  queue: Queue.Queue<Uint8Array, unknown>;
  signal: AbortSignal;
};

let nativeGitOutputReader: GitOutputReader | undefined;

export const setGitOutputReader = (reader: GitOutputReader | undefined): void => {
  nativeGitOutputReader = reader;
};

export const projectFilePaths = (root: string): Stream.Stream<string, unknown> =>
  Stream.fromAsyncIterable(iterateProjectFiles(root), (error) => error);

export const languageFilePaths = (root: string): Generator<string> => {
  const absoluteRoot = resolve(root);
  return walkDirectorySync(absoluteRoot, absoluteRoot, ignoreLayer(absoluteRoot));
};

const iterateProjectFiles = async function* (root: string): AsyncGenerator<string> {
  const deletedPaths = await readDeletedGitPaths(root);
  if (deletedPaths) {
    const inventoryArgs = [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--deduplicate",
    ];
    for await (const path of gitPaths(root, inventoryArgs)) {
      if (!deletedPaths.has(path)) yield path;
    }
    return;
  }
  const absoluteRoot = resolve(root);
  yield* walkDirectory(absoluteRoot, absoluteRoot, ignoreLayer(absoluteRoot));
};

const readDeletedGitPaths = async (root: string): Promise<Set<string> | undefined> => {
  if (!hasGitMetadata(root)) return undefined;
  try {
    return await collectPaths(gitPaths(root, ["ls-files", "--deleted"]));
  } catch (error) {
    if (isGitUnavailable(error)) return undefined;
    throw error;
  }
};

const isGitUnavailable = (error: unknown): boolean => {
  const isObject = typeof error === "object" && error !== null;
  if (!isObject) return false;
  if (!("code" in error)) return false;
  const isMissingExecutable = error.code === "ENOENT";
  const isCommandNotFound = error.code === 127;
  return isMissingExecutable || isCommandNotFound;
};

const hasGitMetadata = (root: string): boolean => {
  let directory = resolve(root);
  while (true) {
    if (existsSync(join(directory, ".git"))) return true;
    const parent = dirname(directory);
    if (parent === directory) return false;
    directory = parent;
  }
};

const collectPaths = async (paths: AsyncGenerator<string>): Promise<Set<string>> => {
  const collectedPaths = new Set<string>();
  for await (const path of paths) collectedPaths.add(path);
  return collectedPaths;
};

const gitPaths = async function* (root: string, args: string[]): AsyncGenerator<string> {
  const gitArguments = args.concat("-z", "--", ".");
  const chunks = gitOutputChunks(root, gitArguments);
  yield* gitPathStream(Stream.toAsyncIterable(chunks));
};

const gitOutputChunks = (root: string, args: string[]): Stream.Stream<Uint8Array, unknown> => {
  const reader = nativeGitOutputReader ?? readGitOutput;
  return Stream.callback<Uint8Array, unknown>(
    (queue) => {
      const work = Effect.tryPromise({
        try: (signal) => consumeGitOutput(reader, { root, args, queue, signal }),
        catch: (error) => error,
      }).pipe(
        Effect.flatMap((code) => Effect.sync(() => assertGitExit({ code }))),
        Effect.flatMap(() => Queue.end(queue)),
        Effect.catchCause((cause) => Queue.failCause(queue, cause)),
        Effect.forkScoped,
      );
      return work;
    },
    { bufferSize: 2 },
  );
};

const consumeGitOutput = async (
  reader: GitOutputReader,
  request: GitOutputRequest,
): Promise<number> => {
  const { root, args, queue, signal } = request;
  let cancel = () => {};
  const registerCancel = (stop: () => void): void => {
    cancel = stop;
    signal.addEventListener("abort", stop, { once: true });
    if (signal.aborted) stop();
  };
  const consume = (chunk: Uint8Array) =>
    Effect.runPromise(Queue.offer(queue, chunk), { signal }).then(() => {});
  try {
    return await reader(root, args, consume, registerCancel);
  } finally {
    signal.removeEventListener("abort", cancel);
  }
};

const readGitOutput: GitOutputReader = async (root, args, consume, registerCancel) => {
  const child = spawn("git", args, { cwd: root, stdio: ["ignore", "pipe", "ignore"] });
  const exit = gitExit(child);
  registerCancel(() => {
    child.kill();
  });
  try {
    if (!child.stdout) throw new Error("Git inventory did not provide stdout");
    for await (const chunk of child.stdout) await consume(chunk);
    const result = await exit;
    if (result.error) throw result.error;
    return result.code;
  } finally {
    if (child.exitCode === null) child.kill();
    await exit;
  }
};

const gitExit = (child: ChildProcess): Promise<{ code: number; error?: Error }> =>
  new Promise((resolveExit) => {
    child.once("error", (error: Error) => resolveExit({ code: -1, error }));
    child.once("close", (code) => resolveExit({ code: code ?? 1 }));
  });

const assertGitExit = (result: { code: number; error?: Error }): void => {
  if (result.error) throw result.error;
  if (result.code === 0) return;
  const error = new Error(`Git inventory exited with code ${result.code}`);
  throw Object.assign(error, { code: result.code });
};

const gitPathStream = async function* (output: AsyncIterable<Uint8Array>): AsyncGenerator<string> {
  const decoder = new StringDecoder("utf8");
  let remainder = "";
  for await (const chunk of output) {
    const parts = `${remainder}${decoder.write(chunk as Buffer)}`.split("\0");
    remainder = parts.at(-1) ?? "";
    yield* validGitPaths(parts.slice(0, -1));
  }
  const finalPath = `${remainder}${decoder.end()}`;
  const shouldYieldFinalPath = Boolean(finalPath) && !matchesIgnoredDirectory(finalPath);
  if (shouldYieldFinalPath) yield finalPath;
};

const validGitPaths = function* (paths: string[]): Generator<string> {
  for (const path of paths) {
    const isIgnored = matchesIgnoredDirectory(path);
    if (!isIgnored) yield path;
  }
};

const walkDirectory = async function* (
  root: string,
  directory: string,
  layer: IgnoreLayer,
): AsyncGenerator<string> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    const isDirectory = entry.isDirectory();
    const relativePath = toPosixPath(relative(root, absolutePath));
    if (matchesIgnoredDirectory(relativePath, isDirectory)) continue;
    if (ignoreDecision(absolutePath, isDirectory, layer)) continue;
    if (!isDirectory) {
      if (entry.isFile()) yield relativePath;
      continue;
    }
    yield* walkDirectory(root, absolutePath, ignoreLayer(absolutePath, layer));
  }
};

const walkDirectorySync = function* (
  root: string,
  directory: string,
  layer: IgnoreLayer,
): Generator<string> {
  const entries = readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) yield* walkSyncEntry(root, directory, entry, layer);
};

const walkSyncEntry = function* (
  root: string,
  directory: string,
  entry: Dirent,
  layer: IgnoreLayer,
): Generator<string> {
  const absolutePath = join(directory, entry.name);
  const relativePath = toPosixPath(relative(root, absolutePath));
  const isDirectory = entry.isDirectory();
  const isIgnoredDirectory = matchesIgnoredDirectory(relativePath, isDirectory);
  if (isIgnoredDirectory) return;
  if (isDirectory) {
    if (ignoreDecision(absolutePath, true, layer)) return;
    yield* walkDirectorySync(root, absolutePath, ignoreLayer(absolutePath, layer));
    return;
  }
  const isIgnoredFile = ignoreDecision(absolutePath, false, layer);
  const shouldYieldFile = entry.isFile() && !isIgnoredFile;
  if (shouldYieldFile) yield relativePath;
};

const ignoreLayer = (directory: string, parent?: IgnoreLayer): IgnoreLayer => {
  let contents = "";
  try {
    contents = readFileSync(join(directory, ".gitignore"), "utf8");
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const canReuseParent = contents.length === 0 && parent !== undefined;
  if (canReuseParent) return parent;
  return { base: directory, matcher: ignore().add(contents), parent };
};

const ignoreDecision = (path: string, isDirectory: boolean, layer: IgnoreLayer): boolean => {
  const inheritedDecision = layer.parent ? ignoreDecision(path, isDirectory, layer.parent) : false;
  const relativePath = toPosixPath(relative(layer.base, path));
  const matchPath = isDirectory ? `${relativePath}/` : relativePath;
  const match = layer.matcher.test(matchPath);
  if (match.ignored) return true;
  if (match.unignored) return false;
  return inheritedDecision;
};

const toPosixPath = (path: string): string => path.split(sep).join("/");

const matchesIgnoredDirectory = (path: string, isDirectory = false): boolean => {
  const pathParts = path.split("/");
  const directoryParts = isDirectory ? pathParts : pathParts.slice(0, -1);
  return directoryParts.some((part) => IGNORED_DIRECTORIES.has(part));
};
