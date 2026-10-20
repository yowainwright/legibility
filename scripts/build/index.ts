import { chmodSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { rolldown } from "rolldown";
import packageJson from "../../package.json" with { type: "json" };
import { logger as createLogger } from "../../src/obs/index.ts";
import {
  BIN_BUNDLE_BANNER,
  BIN_BUNDLE_FILE,
  BIN_ENTRY_FILE,
  BIN_OUTPUT_FILE,
  BIN_RUNTIME_DIR,
  BIN_RUNTIME_ENTRY_FILE,
  BIN_RUNTIME_PACKAGE_FILE,
  BIN_RUNTIME_TYPES_FILE,
  BUILD_SCRIPT_LABEL,
  CLI_BUNDLE_BANNER,
  CLI_ENTRY_FILE,
  CLI_ONLY_FLAG,
  CLI_OUTPUT_DIR,
  CLI_SOURCE_FILE,
  NATIVE_RELEASE_FLAG,
  RUNTIME_PACKAGE_NAME,
} from "./constants.ts";
import type { RuntimePackageManifest } from "./types.ts";
import { nativeReleaseOutputFile, runCommand } from "./utils.ts";

const log = createLogger({ file: BUILD_SCRIPT_LABEL, isLogging: true });

const runBuildCommand = (command: string, args: readonly string[]): void =>
  runCommand(command, args, log);

const renderRuntimeEntry = (): string =>
  [
    'import { runWithPrompt } from "../../src/cli/index.ts";',
    "",
    "export { runWithPrompt };",
    'export { setGitOutputReader } from "../../src/lib/diagnose/index.ts";',
    "",
  ].join("\n");

const renderCliEntry = (): string =>
  [
    'import { run } from "../../src/cli/index.ts";',
    "",
    "const exitCode = await run(process.argv.slice(2));",
    "process.exit(exitCode);",
    "",
  ].join("\n");

const renderPromptLine = (): string =>
  [
    "const promptLine = (message: string): Promise<string> =>",
    "  new Promise((resolve) => {",
    "    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });",
    "    rl.question(message, (answer) => {",
    "      rl.close();",
    "      resolve(answer);",
    "    });",
    "  });",
  ].join("\n");

const renderPromptKey = (): string =>
  [
    "",
    "const readKey = (): Promise<string> =>",
    "  new Promise((resolve) => {",
    "    process.stdin.setRawMode(true);",
    '    process.stdin.once("data", (chunk: Uint8Array) => {',
    "      process.stdin.setRawMode(false);",
    "      resolve(new TextDecoder().decode(chunk));",
    "    });",
    "  });",
  ].join("\n");

const renderCommandRunner = (): string =>
  [
    "",
    "const runCommand = (command: string, args: string[], root: string): Promise<number> =>",
    "  new Promise((resolve) => {",
    '    const localCommand = join(root, "node_modules", ".bin", command);',
    "    const executable = existsSync(localCommand) ? localCommand : command;",
    '    const child = spawn(executable, args, { cwd: root, stdio: "inherit" });',
    '    child.on("error", (error: Error) => {',
    "      process.stderr.write(`Error: could not run ${command}: ${error.message}\\n`);",
    "      resolve(2);",
    "    });",
    '    child.on("exit", (code) => resolve(code ?? 2));',
    "  });",
  ].join("\n");

const renderGitOutputPipe = (): string =>
  [
    "const pipeGitOutput = (child: ChildProcess, consume: any): Promise<void> =>",
    "  new Promise((resolve, reject) => {",
    '    child.on("error", (error: Error) => reject(error));',
    "    const output = child.stdout;",
    '    if (!output) { reject(new Error("Git inventory did not provide stdout")); return; }',
    '    output.once("end", resolve);',
    "    // Scriptc pauses pipe reads between data listeners; reattach after consume settles.",
    "    const next = (): void => {",
    '      output.once("data", (chunk: Uint8Array) => {',
    "        consume(chunk).then(next).catch((error: any) => reject(new Error(String(error))));",
    "      });",
    "    };",
    "    next();",
    "  });",
  ].join("\n");

const renderGitOutputReader = (): string =>
  [
    "const readGitOutput = async (root: string, args: string[], consume: any, registerCancel: any): Promise<number> => {",
    '  const child = spawn("git", args, { cwd: root, stdio: ["ignore", "pipe", "ignore"] });',
    "  const exit = new Promise<number>((resolve) => {",
    '    child.on("error", () => resolve(127));',
    '    child.on("exit", (code) => resolve(code ?? 1));',
    "  });",
    "  registerCancel(() => { child.kill(); });",
    "  try {",
    "    await pipeGitOutput(child, consume);",
    "    return await exit;",
    "  } catch (error) {",
    "    process.stderr.write(`Git inventory failed: ${String(error)}\\n`);",
    "    return 127;",
    "  } finally {",
    "    child.kill();",
    "  }",
    "};",
  ].join("\n");

const renderBinaryMain = (): string =>
  [
    "const main = async (): Promise<void> => {",
    "  setGitOutputReader(readGitOutput);",
    "  try {",
    "    const exitCode = await runWithPrompt(process.argv.slice(2), promptLine, runCommand, readKey);",
    "    process.exit(exitCode);",
    "  } finally {",
    "    setGitOutputReader(undefined);",
    "  }",
    "};",
    "void main();",
  ].join("\n");

const renderBinaryEntry = (): string =>
  [
    'import { runWithPrompt, setGitOutputReader } from "legibility-runtime";',
    'import { existsSync } from "node:fs";',
    'import { spawn, type ChildProcess } from "node:child_process";',
    'import * as readline from "node:readline";',
    'import { join } from "node:path";',
    "",
    renderPromptLine(),
    renderPromptKey(),
    renderCommandRunner(),
    renderGitOutputPipe(),
    renderGitOutputReader(),
    renderBinaryMain(),
    "",
  ].join("\n");

const renderRuntimePackage = (): string => {
  const manifest: RuntimePackageManifest = {
    main: "index.js",
    name: RUNTIME_PACKAGE_NAME,
    type: "commonjs",
    types: "index.d.ts",
    version: packageJson.version,
  };
  return JSON.stringify(manifest);
};

const renderRuntimeTypes = (): string =>
  [
    "export type PromptLine = (message: string) => Promise<string>;",
    "export type PromptKeyReader = () => Promise<string>;",
    "export type CommandRunner = (command: string, args: string[], root: string) => Promise<number>;",
    "export declare function setGitOutputReader(reader: ((root: string, args: string[], consume: (chunk: Uint8Array) => Promise<void>, registerCancel: (cancel: () => void) => void) => Promise<number>) | undefined): void;",
    "export declare function runWithPrompt(args: string[], promptLine: PromptLine, commandRunner?: CommandRunner, promptKey?: PromptKeyReader): Promise<number>;",
    "",
  ].join("\n");

const writeBinarySources = (): void => {
  mkdirSync(BIN_RUNTIME_DIR, { recursive: true });
  writeFileSync(BIN_ENTRY_FILE, renderBinaryEntry());
  writeFileSync(BIN_RUNTIME_ENTRY_FILE, renderRuntimeEntry());
  writeFileSync(BIN_RUNTIME_PACKAGE_FILE, renderRuntimePackage());
  writeFileSync(BIN_RUNTIME_TYPES_FILE, renderRuntimeTypes());
};

const writeCliEntry = (): void => {
  mkdirSync(CLI_OUTPUT_DIR, { recursive: true });
  writeFileSync(CLI_SOURCE_FILE, renderCliEntry());
};

const bundleCli = async (): Promise<void> => {
  const bundle = await rolldown({
    input: CLI_SOURCE_FILE,
    platform: "node",
    resolve: { mainFields: ["module", "main"] },
  });
  try {
    await bundle.write({ banner: CLI_BUNDLE_BANNER, file: CLI_ENTRY_FILE, format: "esm" });
  } finally {
    await bundle.close();
  }
  chmodSync(CLI_ENTRY_FILE, 0o755);
};

const bundleRuntime = async (): Promise<void> => {
  const bundle = await rolldown({
    input: BIN_RUNTIME_ENTRY_FILE,
    platform: "node",
    resolve: { mainFields: ["module", "main"] },
  });
  try {
    await bundle.write({ banner: BIN_BUNDLE_BANNER, file: BIN_BUNDLE_FILE, format: "cjs" });
  } finally {
    await bundle.close();
  }
};

const compileBinary = (outputFile: string): void => {
  runBuildCommand("scriptc", [
    "build",
    BIN_ENTRY_FILE,
    "--out",
    outputFile,
    "--dynamic",
    "--no-keep-c",
  ]);
};

const printBinarySize = (outputFile: string): void => {
  const sizeInMb = (statSync(outputFile).size / 1024 / 1024).toFixed(1);
  log.print(`Built ${outputFile} (${sizeInMb}MB)`);
};

const generateRuleCatalog = (): void =>
  runBuildCommand(process.execPath, ["--experimental-strip-types", "scripts/rules/index.ts"]);

const buildBinary = async (): Promise<void> => {
  const buildArguments = new Set(process.argv.slice(2));
  generateRuleCatalog();
  writeCliEntry();
  await bundleCli();
  if (buildArguments.has(CLI_ONLY_FLAG)) return;
  const isReleaseBuild = buildArguments.has(NATIVE_RELEASE_FLAG);
  const outputFile = isReleaseBuild ? nativeReleaseOutputFile() : BIN_OUTPUT_FILE;
  writeBinarySources();
  await bundleRuntime();
  compileBinary(outputFile);
  printBinarySize(outputFile);
};

try {
  await buildBinary();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  log.fail(message);
  process.exitCode = 1;
}
