import {
  accessSync,
  constants,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, delimiter, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { spawn } from "node:child_process";
import {
  CONFIG_FILENAMES,
  LANGUAGE_BY_EXTENSION,
  LANGUAGE_DEFINITIONS,
  LINTER_DEFINITIONS,
  NO_SETUP_MESSAGE,
  SETUP_QUESTION,
} from "./constants.ts";
import { promptCheckbox, promptConfirm, promptInput } from "./prompt.ts";
import type {
  Config,
  DetectedLanguage,
  JsonObject,
  Linter,
  LinterDefinition,
  Options,
  Source,
} from "./types.ts";

const IGNORED_DIRECTORIES = new Set([
  ".cache",
  ".agents",
  ".claude",
  ".codex",
  ".git",
  ".next",
  ".turbo",
  ".tox",
  ".venv",
  "bin",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "tmp",
  "vendor",
  ".vscode",
]);

const isObject = (value: unknown): value is JsonObject => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return !Array.isArray(value);
};

const readJson = (path: string): unknown => {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`could not read ${path}: ${message}`);
  }
};

const isStringArray = (value: unknown): value is string[] => {
  if (!Array.isArray(value)) return false;
  return value.every((item) => typeof item === "string");
};

const parseLinter = (name: string, value: unknown): Linter => {
  if (!isObject(value)) throw new Error(`linters.${name} must be an object`);
  const enabledValue = value.enabled;
  const enabled = enabledValue === undefined ? true : enabledValue;
  if (typeof enabled !== "boolean") {
    throw new Error(`linters.${name}.enabled must be a boolean`);
  }
  const argsValue = value.args;
  const args = argsValue === undefined ? [] : argsValue;
  if (!isStringArray(args)) throw new Error(`linters.${name}.args must be an array of strings`);
  return { enabled, args };
};

const parseLanguages = (value: unknown): Record<string, JsonObject> => {
  if (value === undefined) return {};
  if (!isObject(value)) throw new Error("languages must be an object");
  const entries = Object.keys(value).map((name) => {
    const language = value[name];
    if (!isObject(language)) throw new Error(`languages.${name} must be an object`);
    return [name, language] as const;
  });
  return Object.fromEntries(entries);
};

const parseConfig = (value: unknown): Config => {
  if (!isObject(value)) throw new Error("configuration must be an object");
  if (!isObject(value.linters)) {
    throw new Error("configuration must contain a linters object");
  }
  const rawLinters = value.linters as JsonObject;
  const entries = Object.keys(rawLinters).map(
    (name) => [name, parseLinter(name, rawLinters[name])] as const,
  );
  return { languages: parseLanguages(value.languages), linters: Object.fromEntries(entries) };
};

export const readSource = (path: string): Source => {
  const parsed = readJson(path);
  const isPackage = basename(path) === "package.json";
  const value = isPackage && isObject(parsed) ? parsed.legibility : parsed;
  const hasNoPackageConfig = isPackage && value === undefined;
  if (hasNoPackageConfig) throw new Error(`${path} does not contain a legibility object`);
  return { path, root: dirname(path), config: parseConfig(value) };
};

const embeddedPackage = (directory: string): Source | undefined => {
  const path = join(directory, "package.json");
  if (!existsSync(path)) return undefined;
  const parsed = readJson(path);
  if (!isObject(parsed)) return undefined;
  if (parsed.legibility === undefined) return undefined;
  return { path, root: directory, config: parseConfig(parsed.legibility) };
};

const readDirectorySources = (directory: string): Source[] => {
  const direct = CONFIG_FILENAMES.map((filename) => join(directory, filename))
    .filter((path) => existsSync(path))
    .map(readSource);
  const embedded = embeddedPackage(directory);
  if (embedded === undefined) return direct;
  return direct.concat([embedded]);
};

const collectSources = (directory: string): Source[] => {
  const current = readDirectorySources(directory);
  const parent = dirname(directory);
  if (parent === directory) return current;
  return current.concat(collectSources(parent));
};

export const discoverConfig = (): Source | undefined => {
  const matches = collectSources(resolve(process.cwd()));
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  const paths = matches.map((match) => match.path).join(", ");
  throw new Error(`multiple Legibility configurations found: ${paths}`);
};

const nativeArguments = (args: string[]): { cliArgs: string[]; nativeArgs: string[] } => {
  const separator = args.indexOf("--");
  if (separator < 0) return { cliArgs: args, nativeArgs: [] };
  return { cliArgs: args.slice(0, separator), nativeArgs: args.slice(separator + 1) };
};

const linterNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  if (!value.every((item) => typeof item === "string")) {
    throw new Error("--linter values must be strings");
  }
  return value as string[];
};

export const parseOptions = (args: string[]): Options => {
  const split = nativeArguments(args);
  const parsed = parseArgs({
    args: split.cliArgs,
    options: {
      config: { type: "string", short: "c" },
      "dry-run": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      linter: { type: "string", multiple: true },
      styleguide: { type: "boolean" },
      version: { type: "boolean", short: "v" },
    },
    strict: true,
    allowPositionals: false,
  });
  return {
    configPath: parsed.values.config as string | undefined,
    dryRun: parsed.values["dry-run"] === true,
    help: parsed.values.help === true,
    linters: linterNames(parsed.values.linter),
    nativeArgs: split.nativeArgs,
    styleguide: parsed.values.styleguide === true,
    version: parsed.values.version === true,
  };
};

const readFiles = (directory: string, prefix = ""): string[] => {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const relativePath = join(prefix, entry.name);
    if (!entry.isDirectory()) {
      if (entry.isFile()) return [relativePath];
      return [];
    }
    if (IGNORED_DIRECTORIES.has(entry.name)) return [];
    return readFiles(join(directory, entry.name), relativePath);
  });
};

export const detectLanguages = (root: string): DetectedLanguage[] => {
  const files = readFiles(root);
  const matchesByLanguage = Object.fromEntries(
    LANGUAGE_DEFINITIONS.map(({ id }) => [id, [] as string[]]),
  );
  files.forEach((file) => {
    const extension = extname(file).toLowerCase();
    const hasLanguage = Object.hasOwn(LANGUAGE_BY_EXTENSION, extension);
    if (!hasLanguage) return;
    const languageId = LANGUAGE_BY_EXTENSION[extension as keyof typeof LANGUAGE_BY_EXTENSION];
    if (languageId) matchesByLanguage[languageId] = matchesByLanguage[languageId].concat(file);
  });
  return LANGUAGE_DEFINITIONS.map((definition) => {
    const matches = matchesByLanguage[definition.id];
    return {
      id: definition.id,
      label: definition.label,
      count: matches.length,
      files: matches.slice(0, 3),
    };
  }).filter(({ count }) => count > 0);
};

const languageDescription = (language: DetectedLanguage | undefined): string => {
  if (!language) return "not detected";
  const fileSample = language.files.join(", ");
  const hasMoreFiles = language.files.length < language.count;
  const suffix = hasMoreFiles ? ", …" : "";
  const fileCount = language.count === 1 ? "1 file" : `${language.count} files`;
  if (!fileSample) return fileCount;
  return `${fileCount} · ${fileSample}${suffix}`;
};

const promptForLanguages = (detected: DetectedLanguage[]): Promise<string[]> => {
  const detectedById = new Map(detected.map((language) => [language.id, language] as const));
  const choices = LANGUAGE_DEFINITIONS.map((definition) => {
    const language = detectedById.get(definition.id);
    return {
      name: `${definition.label} (${definition.id})`,
      value: definition.id,
      description: languageDescription(language),
      checked: language !== undefined,
    };
  });
  return promptCheckbox("Which languages should Legibility check?", choices);
};

const accessPath = (path: string): boolean => {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const commandIsAvailable = (command: string, root: string): boolean => {
  const pathValue = process.env.PATH;
  const projectBin = join(root, "node_modules", ".bin", command);
  if (!pathValue) return accessPath(projectBin);
  const commandPaths = pathValue.split(delimiter).map((directory) => join(directory, command));
  const windowsPaths =
    process.platform === "win32" ? commandPaths.map((path) => `${path}.exe`) : [];
  return [projectBin].concat(commandPaths, windowsPaths).some((path) => {
    return accessPath(path);
  });
};

const supportsLanguages = (languages: string[], supported: readonly string[]): boolean => {
  const supportedLanguages = new Set(supported);
  return (
    supportedLanguages.has("*") || languages.some((language) => supportedLanguages.has(language))
  );
};

const promptForLinters = (languages: string[], root: string): Promise<string[] | undefined> => {
  const candidates = LINTER_DEFINITIONS.filter(({ languages: supported }) =>
    supportsLanguages(languages, supported),
  );
  const available = candidates.filter(({ command }) => commandIsAvailable(command, root));
  if (available.length === 0) {
    console.error("No supported Legibility linter is installed.");
    return Promise.resolve(undefined);
  }
  const availableIds = new Set(available.map(({ id }) => id));
  const choices = candidates.map(({ id, command, description }) => {
    const isAvailable = availableIds.has(id);
    return {
      name: id,
      value: id,
      description: `${description} · ${command}`,
      checked: isAvailable,
      disabled: isAvailable ? false : "not installed",
    };
  });
  return promptCheckbox("Which linters should run?", choices, true);
};

const parseNativeArgs = (answer: string): string[] =>
  answer.trim() === "" ? [] : answer.trim().split(/\s+/);

const promptForLinterConfig = async (names: string[]): Promise<Record<string, Linter>> => {
  const name = names[0];
  if (!name) return {};
  const answer = await promptInput(`Arguments for ${name} (optional)`);
  const linter = { enabled: true, args: parseNativeArgs(answer) };
  const remaining = await promptForLinterConfig(names.slice(1));
  return Object.assign({ [name]: linter }, remaining);
};

const setupSource = (
  root: string,
  languages: string[],
  linters: Record<string, Linter>,
): Source => ({
  path: "interactive",
  root,
  config: {
    languages: Object.fromEntries(languages.map((language) => [language, {} as JsonObject])),
    linters,
  },
});

const saveSetupSource = (source: Source): Source => {
  const path = join(source.root, "legibility.json");
  writeFileSync(path, `${JSON.stringify(source.config, null, 2)}\n`, "utf8");
  console.log(`Saved ${path}`);
  return readSource(path);
};

const setupProject = async (): Promise<number> => {
  const root = resolve(process.cwd());
  const detected = detectLanguages(root);
  const languages = await promptForLanguages(detected);
  const names = await promptForLinters(languages, root);
  if (!names) return 2;
  const linters = await promptForLinterConfig(names);
  const initialSource = setupSource(root, languages, linters);
  const shouldSave = await promptConfirm("Save this configuration to legibility.json?", true);
  const source = shouldSave ? saveSetupSource(initialSource) : initialSource;
  const configPath = source.path === "interactive" ? undefined : source.path;
  const options: Options = {
    configPath,
    dryRun: true,
    help: false,
    linters: names,
    nativeArgs: [],
    styleguide: false,
    version: false,
  };
  console.log("\nPreview — no linters will run:");
  const dryRunExit = await runLinters(source, options);
  if (dryRunExit !== 0) return dryRunExit;
  const shouldRun = await promptConfirm("Run these linters now?", false);
  if (!shouldRun) return 0;
  return runLinters(source, Object.assign({}, options, { dryRun: false }));
};

export const promptForSetup = async (): Promise<number> => {
  if (!process.stdin.isTTY) {
    console.error("Error: no Legibility configuration found; use --config <path>");
    return 2;
  }
  try {
    const isSetup = await promptConfirm(SETUP_QUESTION, false);
    if (!isSetup) {
      console.log(NO_SETUP_MESSAGE);
      return 0;
    }
    return await setupProject();
  } catch (error: unknown) {
    const isPromptExit = error instanceof Error && error.name === "PromptCancelled";
    if (!isPromptExit) throw error;
    console.log("\nSetup cancelled.");
    return 130;
  }
};

const selectedLinters = (
  config: Config,
  names: string[],
): ReadonlyArray<readonly [LinterDefinition, Linter]> => {
  const selected = names.length > 0 ? names : Object.keys(config.linters);
  const definitions = new Map(LINTER_DEFINITIONS.map((item) => [item.id, item] as const));
  const entries = selected.map((id) => {
    const linter = config.linters[id];
    if (!linter) throw new Error(`linter is not configured: ${id}`);
    const definition = definitions.get(id);
    if (!definition) throw new Error(`linter is not supported: ${id}`);
    return [definition, linter] as const;
  });
  const enabled = entries.filter(([, linter]) => linter.enabled);
  if (enabled.length === 0) throw new Error("configuration enables no linters");
  return enabled;
};

const runCommand = (command: string, args: string[], root: string): Promise<number> =>
  new Promise((resolveExitCode) => {
    const projectBin = join(root, "node_modules", ".bin");
    const pathValue = process.env.PATH ?? "";
    const env = Object.assign({}, process.env, {
      PATH: [projectBin, pathValue].filter(Boolean).join(delimiter),
    });
    const child = spawn(command, args, { cwd: root, stdio: "inherit", env });
    child.on("error", (error: Error) => {
      console.error(`Error: could not run ${command}: ${error.message}`);
      resolveExitCode(2);
    });
    child.on("exit", (code) => resolveExitCode(code ?? 2));
  });

const formatCommand = (command: string, args: string[]): string =>
  [command]
    .concat(args)
    .map((part) => JSON.stringify(part))
    .join(" ");

export const runLinters = async (source: Source, options: Options): Promise<number> => {
  const linters = selectedLinters(source.config, options.linters);
  const hasMultipleLinters = linters.length > 1;
  const hasNativeArgs = options.nativeArgs.length > 0;
  const nativeArgsAreAmbiguous = hasMultipleLinters && hasNativeArgs;
  if (nativeArgsAreAmbiguous) {
    throw new Error("native arguments after -- require one selected linter");
  }
  let firstFailure = 0;
  for (const [definition, linter] of linters) {
    const command = definition.command;
    const args = linter.args.concat(options.nativeArgs);
    if (options.dryRun) {
      console.log(formatCommand(command, args));
      continue;
    }
    const exitCode = await runCommand(command, args, source.root);
    const hasNoFailure = firstFailure === 0;
    const commandFailed = exitCode !== 0;
    const isFirstFailure = hasNoFailure && commandFailed;
    if (isFirstFailure) firstFailure = exitCode;
  }
  return firstFailure;
};
