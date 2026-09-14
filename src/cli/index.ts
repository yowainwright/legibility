#!/usr/bin/env node

import {
  accessSync,
  constants as fsConstants,
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { basename, delimiter, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import {
  CONFIG_FILENAMES,
  HELP_TEXT,
  IGNORED_DIRECTORIES,
  LANGUAGE_BY_EXTENSION,
  LANGUAGE_DEFINITIONS,
  LINTER_DEFINITIONS,
  NO_SETUP_MESSAGE,
  SETUP_QUESTION,
  STYLEGUIDE_LANGUAGE_CHOICES,
  STYLEGUIDE_LINTER_CHOICES,
  STYLEGUIDE_TOUR_CHOICES,
  VERSION,
} from "./constants.ts";
import { logger as createLogger } from "../obs/index.ts";
import {
  commandLines,
  formatStyleguide,
  promptForLanguages,
  promptForLinterConfig,
  promptForLinters,
  reviewLines,
  saveSetupSource,
  setupSource,
} from "./utils.ts";
import {
  promptCheckbox,
  promptConfirm,
  promptInput,
  promptSelect,
  promptAnsi as ANSI,
} from "./prompts/index.ts";
import type {
  Config,
  DetectedLanguage,
  JsonObject,
  Linter,
  LinterDefinition,
  Options,
  Source,
} from "./types.ts";
import type { Logger } from "../obs/types.ts";

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
  return Object.assign({}, value, { enabled, args });
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
  return Object.assign({}, value, {
    languages: parseLanguages(value.languages),
    linters: Object.fromEntries(entries),
  });
};

export const readSource = (path: string): Source => {
  const parsed = readJson(path);
  const isPackage = basename(path) === "package.json";
  const value = isPackage && isObject(parsed) ? parsed.legibility : parsed;
  const isPackageConfigMissing = isPackage && value === undefined;
  if (isPackageConfigMissing) {
    throw new Error(`${path} does not contain a legibility object`);
  }
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
  const candidatePaths = CONFIG_FILENAMES.map((filename) => join(directory, filename));
  const configPaths = candidatePaths.filter((path) => existsSync(path));
  const direct = configPaths.map(readSource);
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
      verbose: { type: "boolean" },
    },
    strict: true,
    allowPositionals: false,
  });
  return {
    configPath: parsed.values.config as string | undefined,
    dryRun: Boolean(parsed.values["dry-run"]),
    help: Boolean(parsed.values.help),
    linters: linterNames(parsed.values.linter),
    nativeArgs: split.nativeArgs,
    styleguide: Boolean(parsed.values.styleguide),
    version: Boolean(parsed.values.version),
    verbose: Boolean(parsed.values.verbose),
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

const accessPath = (path: string): boolean => {
  try {
    accessSync(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
};

export const commandIsAvailable = (command: string, root: string): boolean => {
  const pathValue = process.env.PATH;
  const projectBin = join(root, "node_modules", ".bin", command);
  if (!pathValue) return accessPath(projectBin);
  const commandPaths = pathValue.split(delimiter).map((directory) => join(directory, command));
  const windowsPaths =
    process.platform === "win32" ? commandPaths.map((path) => `${path}.exe`) : [];
  return [projectBin].concat(commandPaths, windowsPaths).some((path) => accessPath(path));
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

const runCommand = (command: string, args: string[], root: string, log: Logger): Promise<number> =>
  new Promise((resolveExitCode) => {
    const projectBin = join(root, "node_modules", ".bin");
    const pathValue = process.env.PATH ?? "";
    const env = Object.assign({}, process.env, {
      PATH: [projectBin, pathValue].filter(Boolean).join(delimiter),
    }) as Record<string, string>;
    const child = spawn(command, args, { cwd: root, stdio: "inherit", env });
    child.on("error", (error: Error) => {
      log.fail(`Error: could not run ${command}: ${error.message}`);
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
  const log = createLogger({ file: "index.ts", isLogging: options.verbose });
  log.debug(`Running ${linters.length} linter(s); dryRun=${options.dryRun}`, "runLinters");
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
      log.debug(`Previewing ${definition.id}`, "runLinters");
      log.print(formatCommand(command, args));
      continue;
    }
    const startedAt = Date.now();
    log.debug(`Starting ${definition.id} (${command})`, "runLinters");
    const exitCode = await runCommand(command, args, source.root, log);
    const durationMs = Date.now() - startedAt;
    log.debug(
      `Finished ${definition.id}; exitCode=${exitCode}; durationMs=${durationMs}`,
      "runLinters",
    );
    const isFirstFailure = firstFailure === 0 && exitCode !== 0;
    if (isFirstFailure) firstFailure = exitCode;
  }
  return firstFailure;
};

const printDemoTitle = (log: Logger, title: string): void => {
  log.print(
    `\n${ANSI.GRAY}────────────────────────────────────────────────────────────────────${ANSI.RESET}`,
  );
  log.print(`${ANSI.BOLD}${ANSI.CYAN}${title}${ANSI.RESET}`);
};

const printDemoResult = (log: Logger, label: string, value: string): void => {
  log.print(`${ANSI.GRAY}Result${ANSI.RESET} · ${label}: ${value}`);
};

const runWelcomeDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Welcome confirmation");
  const answer = await promptConfirm("Demo · Set up Legibility for this project?", false);
  printDemoResult(log, "setup", answer ? "yes" : "no");
};

const runLanguagesDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Detect languages");
  const selected = await promptCheckbox(
    "Demo · Which languages should Legibility check?",
    STYLEGUIDE_LANGUAGE_CHOICES,
  );
  printDemoResult(log, "languages", selected.join(", ") || "none");
};

const runLintersDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Select available linters");
  const selected = await promptCheckbox(
    "Demo · Which linters should run?",
    STYLEGUIDE_LINTER_CHOICES,
    true,
  );
  printDemoResult(log, "linters", selected.join(", "));
};

const runArgumentsDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Configure native arguments");
  const answer = await promptInput(
    "Demo · Arguments for oxlint-plugin-legibility (optional)",
    "--deny-warnings",
  );
  printDemoResult(log, "arguments", answer || "none");
};

const runReviewDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Review configuration");
  reviewLines().forEach((line) => log.print(line));
  await promptConfirm("Demo · Continue from this configuration?", true);
};

const runPreviewDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Preview commands");
  commandLines().forEach((line) => log.print(line));
  await promptConfirm("Demo · Continue to execution approval?", true);
};

const runExecutionDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Approve execution");
  const answer = await promptConfirm("Demo · Run these linters now?", false);
  printDemoResult(log, "execution", answer ? "approved" : "not approved");
};

const runCancellationDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Cancellation");
  try {
    await promptCheckbox("Demo · Press Esc to cancel this prompt", [
      { name: "A safe demo choice", value: "safe" },
    ]);
    printDemoResult(log, "cancellation", "not exercised — press Esc next time");
  } catch (error: unknown) {
    const wasCancelled = error instanceof Error && error.name === "PromptCancelled";
    if (!wasCancelled) throw error;
    printDemoResult(log, "cancellation", "handled");
  }
};

const runDemo = async (selection: string, log: Logger): Promise<void> => {
  if (selection === "welcome") return await runWelcomeDemo(log);
  if (selection === "languages") return await runLanguagesDemo(log);
  if (selection === "linters") return await runLintersDemo(log);
  if (selection === "arguments") return await runArgumentsDemo(log);
  if (selection === "review") return await runReviewDemo(log);
  if (selection === "preview") return await runPreviewDemo(log);
  if (selection === "execution") return await runExecutionDemo(log);
  if (selection === "cancellation") return await runCancellationDemo(log);
};

export const runStyleguide = async (log: Logger): Promise<number> => {
  log.print(
    [
      `${ANSI.BOLD}${ANSI.CYAN}Legibility CLI Styleguide${ANSI.RESET}`,
      "Interactive tour. Nothing is saved and no linter runs.",
      `${ANSI.GRAY}Use ↑/↓ and Enter to choose a demo. Esc exits.${ANSI.RESET}`,
    ].join("\n\n"),
  );
  while (true) {
    try {
      const selected = await promptSelect("Choose a flow to exercise", STYLEGUIDE_TOUR_CHOICES);
      if (selected === "exit") return 0;
      await runDemo(selected, log);
      await promptConfirm("Return to the styleguide menu?", true);
    } catch (error: unknown) {
      const wasCancelled = error instanceof Error && error.name === "PromptCancelled";
      if (!wasCancelled) throw error;
      log.print("\nStyleguide closed.");
      return 0;
    }
  }
};

const readSourceAfterSave = (source: Source, log: Logger): Source => {
  const path = saveSetupSource(source);
  log.print(`Saved ${path}`);
  return readSource(path);
};

const setupProject = async (log: Logger, verbose: boolean): Promise<number> => {
  const root = resolve(process.cwd());
  const detected = detectLanguages(root);
  const languages = await promptForLanguages(detected);
  log.debug(`Languages: ${languages.join(",") || "none"}`, "setupProject");
  const names = await promptForLinters(languages, root, commandIsAvailable);
  if (!names) {
    log.fail("No supported Legibility linter is installed.");
    log.debug("No linters available", "setupProject");
    return 2;
  }
  log.debug(`Linters: ${names.join(",")}`, "setupProject");
  const linters = await promptForLinterConfig(names);
  const initialSource = setupSource(root, languages, linters);
  const shouldSave = await promptConfirm("Save this configuration to legibility.json?", true);
  log.debug(`Configuration saved=${shouldSave}`, "setupProject");
  const source = shouldSave ? readSourceAfterSave(initialSource, log) : initialSource;
  const configPath = source.path === "interactive" ? undefined : source.path;
  const options: Options = {
    configPath,
    dryRun: true,
    help: false,
    linters: names,
    nativeArgs: [],
    styleguide: false,
    version: false,
    verbose,
  };
  log.print("\nPreview — no linters will run:");
  const dryRunExit = await runLinters(source, options);
  if (dryRunExit !== 0) return dryRunExit;
  const shouldRun = await promptConfirm("Run these linters now?", false);
  log.debug(`Execution approved=${shouldRun}`, "setupProject");
  if (!shouldRun) return 0;
  return runLinters(source, Object.assign({}, options, { dryRun: false }));
};

const promptForSetup = async (options: Options): Promise<number> => {
  const log = createLogger({ file: "index.ts", isLogging: options.verbose });
  if (!process.stdin.isTTY) {
    log.fail("Error: no Legibility configuration found; use --config <path>");
    return 2;
  }
  try {
    const isSetup = await promptConfirm(SETUP_QUESTION, false);
    if (!isSetup) {
      log.debug("Setup declined", "promptForSetup");
      log.print(NO_SETUP_MESSAGE);
      return 0;
    }
    log.debug("Setup accepted", "promptForSetup");
    return await setupProject(log, options.verbose);
  } catch (error: unknown) {
    const isPromptExit = error instanceof Error && error.name === "PromptCancelled";
    if (!isPromptExit) throw error;
    log.debug("Setup cancelled", "promptForSetup");
    log.print("\nSetup cancelled.");
    return 130;
  }
};

export { formatStyleguide, promptForSetup };

export const run = async (args: string[]): Promise<number> => {
  const baseLog = createLogger({ file: "index.ts" });
  let options: Options;
  try {
    options = parseOptions(args);
  } catch (error: unknown) {
    baseLog.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
  const log = createLogger({ file: "index.ts", isLogging: options.verbose });
  if (options.help) {
    log.print(HELP_TEXT);
    return 0;
  }
  if (options.styleguide) return await runStyleguide(log);
  if (options.version) {
    log.print(`legibility version ${VERSION}`);
    return 0;
  }
  try {
    const source = options.configPath
      ? readSource(resolve(process.cwd(), options.configPath))
      : discoverConfig();
    if (!source) return promptForSetup(options);
    return await runLinters(source, options);
  } catch (error: unknown) {
    log.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
};
