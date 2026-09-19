#!/usr/bin/env node

import {
  accessSync,
  constants as fsConstants,
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { basename, delimiter, dirname, extname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
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
  STYLEGUIDE_DETECTED_LANGUAGES,
  STYLEGUIDE_LANGUAGE_CHOICES,
  STYLEGUIDE_LINTER_CHOICES,
  STYLEGUIDE_TOUR_CHOICES,
  STYLEGUIDE_UPDATE_CHOICES,
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
  setPromptLine,
} from "./prompts/index.ts";
import type { PromptChoice } from "./prompts/types.ts";
import type { PromptKeyReader, PromptLine } from "./prompts/index.ts";
import type {
  Config,
  DetectedLanguage,
  HomebrewLinterUpdate,
  HomebrewOutdatedFormula,
  JsonObject,
  Linter,
  LinterDefinition,
  Options,
  Source,
  UpdateConfig,
} from "./types.ts";
import type { Logger } from "../obs/types.ts";

export type CommandRunner = (command: string, args: string[], root: string) => Promise<number>;

let nativeCommandRunner: CommandRunner | undefined;

const setCommandRunner = (commandRunner: CommandRunner | undefined): void => {
  nativeCommandRunner = commandRunner;
};

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

const parseUpdates = (value: unknown): UpdateConfig => {
  const rawUpdates = value === undefined ? {} : value;
  if (!isObject(rawUpdates)) throw new Error("updates must be an object");
  const enabledValue = rawUpdates.enabled;
  const enabled = enabledValue === undefined ? true : enabledValue;
  if (typeof enabled !== "boolean") throw new Error("updates.enabled must be a boolean");
  const managerValue = rawUpdates.manager;
  const hasUnsupportedManager = managerValue !== undefined && managerValue !== "brew";
  if (hasUnsupportedManager) throw new Error('updates.manager must be "brew"');
  const manager = "brew" as const;
  const promptValue = rawUpdates.prompt;
  const prompt = promptValue === undefined ? true : promptValue;
  if (typeof prompt !== "boolean") throw new Error("updates.prompt must be a boolean");
  return Object.assign({}, rawUpdates, { enabled, manager, prompt });
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
    updates: parseUpdates(value.updates),
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

const parseCommand = (positionals: string[]): boolean => {
  const command = positionals[0];
  const hasExtraPositionals = positionals.length > 1;
  const hasUnsupportedCommand = command !== undefined && command !== "update";
  const hasUnknownCommand = hasExtraPositionals || hasUnsupportedCommand;
  if (hasUnknownCommand) throw new Error(`unknown command: ${positionals.join(" ")}`);
  return command === "update";
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
    allowPositionals: true,
  });
  return {
    configPath: parsed.values.config as string | undefined,
    dryRun: Boolean(parsed.values["dry-run"]),
    help: Boolean(parsed.values.help),
    linters: linterNames(parsed.values.linter),
    nativeArgs: split.nativeArgs,
    styleguide: Boolean(parsed.values.styleguide),
    update: parseCommand(parsed.positionals),
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

const commandEnvironment = (root: string): Record<string, string> => {
  const projectBin = join(root, "node_modules", ".bin");
  const pathValue = process.env.PATH ?? "";
  return Object.assign({}, process.env, {
    PATH: [projectBin, pathValue].filter(Boolean).join(delimiter),
  }) as Record<string, string>;
};

type HomebrewFormulaPayload = {
  name: string;
  installed_versions: string[];
  current_version: string;
  pinned: boolean;
};

const isHomebrewFormula = (value: unknown): value is HomebrewFormulaPayload => {
  if (!isObject(value)) return false;
  const hasName = typeof value.name === "string";
  const hasVersions =
    isStringArray(value.installed_versions) && value.installed_versions.length > 0;
  const hasCurrentVersion = typeof value.current_version === "string";
  const hasPinnedValue = typeof value.pinned === "boolean";
  const hasValidIdentity = hasName && hasCurrentVersion;
  const hasValidDetails = hasVersions && hasPinnedValue;
  return hasValidIdentity && hasValidDetails;
};

export const parseHomebrewOutdated = (value: unknown): HomebrewOutdatedFormula[] => {
  if (!isObject(value)) return [];
  const formulae = value.formulae;
  if (!Array.isArray(formulae)) return [];
  return formulae.flatMap((formula) => {
    if (!isHomebrewFormula(formula)) return [];
    return [
      {
        name: formula.name,
        installedVersions: formula.installed_versions,
        currentVersion: formula.current_version,
        pinned: formula.pinned,
      },
    ];
  });
};

export const homebrewLinterUpdates = (value: unknown, ids: string[]): HomebrewLinterUpdate[] => {
  const selectedIds = new Set(ids);
  const formulas = new Map(parseHomebrewOutdated(value).map((formula) => [formula.name, formula]));
  return LINTER_DEFINITIONS.flatMap(({ id, brewFormula }) => {
    const isSelected = selectedIds.has(id);
    if (brewFormula === undefined) return [];
    if (!isSelected) return [];
    const formula = formulas.get(brewFormula);
    const isUpdateable = formula !== undefined && !formula.pinned;
    if (!isUpdateable) return [];
    return [Object.assign({}, formula, { id, formula: brewFormula })];
  });
};

const readHomebrewOutdated = (root: string, log: Logger): unknown | undefined => {
  const result = spawnSync("brew", ["outdated", "--json=v2", "--formula"], {
    cwd: root,
    encoding: "utf8",
    env: commandEnvironment(root),
  });
  if (result.error) {
    log.debug(`Could not inspect Homebrew: ${result.error.message}`, "update");
    return undefined;
  }
  if (result.status !== 0) {
    log.debug(`Homebrew outdated check exited with ${result.status ?? 1}`, "update");
    return undefined;
  }
  try {
    return JSON.parse(result.stdout) as unknown;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.debug(`Could not parse Homebrew output: ${message}`, "update");
    return undefined;
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

const runCommand = (
  command: string,
  args: string[],
  root: string,
  log: Logger,
): Promise<number> => {
  if (nativeCommandRunner) return nativeCommandRunner(command, args, root);
  return new Promise((resolveExitCode) => {
    const env = commandEnvironment(root);
    const child = spawn(command, args, { cwd: root, stdio: "inherit", env });
    child.on("error", (error: Error) => {
      log.fail(`Error: could not run ${command}: ${error.message}`);
      resolveExitCode(2);
    });
    child.on("exit", (code) => resolveExitCode(code ?? 2));
  });
};

const configuredUpdateIds = (source: Source | undefined): string[] => {
  if (!source) return LINTER_DEFINITIONS.map(({ id }) => id);
  return Object.entries(source.config.linters)
    .filter(([, linter]) => linter.enabled)
    .map(([id]) => id);
};

const updateIds = (source: Source | undefined, options: Options): string[] => {
  const ids = options.linters.length > 0 ? options.linters : configuredUpdateIds(source);
  const supported = new Set(LINTER_DEFINITIONS.map(({ id }) => id));
  const unsupported = ids.filter((id) => !supported.has(id));
  if (unsupported.length > 0) throw new Error(`linter is not supported: ${unsupported.join(", ")}`);
  return ids;
};

const updateChoices = (updates: HomebrewLinterUpdate[]): PromptChoice[] =>
  updates.map(({ id, installedVersions, currentVersion, formula }) => ({
    name: id,
    value: id,
    description: `${installedVersions.join(", ")} → ${currentVersion} · brew upgrade ${formula}`,
    checked: true,
  }));

const refreshHomebrew = async (
  root: string,
  shouldPrompt: boolean,
  log: Logger,
): Promise<number> => {
  const shouldRefresh =
    !shouldPrompt || (await promptConfirm("Refresh Homebrew formula data?", true));
  if (!shouldRefresh) return 0;
  return runCommand("brew", ["update"], root, log);
};

const chooseHomebrewUpdates = async (
  updates: HomebrewLinterUpdate[],
  shouldPrompt: boolean,
): Promise<HomebrewLinterUpdate[]> => {
  if (!shouldPrompt) return updates;
  const selectedIds = await promptCheckbox(
    "Which outdated linters should be updated?",
    updateChoices(updates),
  );
  return updates.filter(({ id }) => selectedIds.includes(id));
};

const upgradeHomebrew = async (
  root: string,
  updates: HomebrewLinterUpdate[],
  shouldPrompt: boolean,
  log: Logger,
): Promise<number> => {
  const formulas = updates.map(({ formula }) => formula);
  const labels = updates.map(({ id }) => id).join(", ");
  const shouldUpgrade = !shouldPrompt || (await promptConfirm(`Update ${labels} now?`, false));
  if (!shouldUpgrade) return 0;
  return runCommand("brew", ["upgrade"].concat(formulas), root, log);
};

const updateHomebrewLinters = async (
  root: string,
  ids: string[],
  config: UpdateConfig,
  log: Logger,
): Promise<number> => {
  const refreshExit = await refreshHomebrew(root, config.prompt, log);
  if (refreshExit !== 0) return refreshExit;
  const output = readHomebrewOutdated(root, log);
  if (output === undefined) {
    log.fail("Error: could not inspect Homebrew for outdated linters");
    return 2;
  }
  const updates = homebrewLinterUpdates(output, ids);
  if (updates.length === 0) {
    log.print("All selected Homebrew linters are up to date.");
    return 0;
  }
  const selected = await chooseHomebrewUpdates(updates, config.prompt);
  if (selected.length === 0) {
    log.print("No linter updates selected.");
    return 0;
  }
  return upgradeHomebrew(root, selected, config.prompt, log);
};

const readUpdateSource = (options: Options): Source | undefined => {
  if (options.configPath) return readSource(resolve(process.cwd(), options.configPath));
  return discoverConfig();
};

const runUpdate = (options: Options, log: Logger): Promise<number> | number => {
  if (options.dryRun) {
    throw new Error("--dry-run is not supported with update");
  }
  if (options.nativeArgs.length > 0) {
    throw new Error("native arguments after -- are not supported with update");
  }
  const source = readUpdateSource(options);
  const config = source?.config ?? parseConfig(undefined);
  if (!config.updates.enabled) {
    log.print("Project linter updates are disabled.");
    return 0;
  }
  if (config.updates.manager !== "brew") {
    throw new Error(`unsupported update manager: ${config.updates.manager}`);
  }
  const requiresInteractivePrompt = config.updates.prompt && !process.stdin.isTTY;
  if (requiresInteractivePrompt) {
    log.fail("Error: legibility update requires an interactive terminal");
    return 2;
  }
  const root = source?.root ?? resolve(process.cwd());
  if (!commandIsAvailable(config.updates.manager, root)) {
    log.fail("Error: Homebrew is not available; install it before updating native linters");
    return 2;
  }
  return updateHomebrewLinters(root, updateIds(source, options), config.updates, log);
};

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

const styleguideCommandAvailable = (): boolean => true;

const styleguideOptions = (linters: string[]): Options => ({
  configPath: undefined,
  dryRun: true,
  help: false,
  linters,
  nativeArgs: [],
  styleguide: false,
  update: false,
  version: false,
  verbose: false,
});

const previewFullSetup = async (log: Logger, source: Source, linters: string[]): Promise<void> => {
  printDemoTitle(log, "Preview commands");
  log.print("Demo · Preview — no linters will run:");
  await runLinters(source, styleguideOptions(linters));
};

const runFullSetupDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Full setup flow");
  const shouldSetup = await promptConfirm("Demo · Set up Legibility for this project?", false);
  if (!shouldSetup) {
    printDemoResult(log, "setup", "not started");
    return;
  }
  printDemoTitle(log, "Detect languages");
  const languages = await promptForLanguages(STYLEGUIDE_DETECTED_LANGUAGES);
  printDemoResult(log, "languages", languages.join(", ") || "none");
  printDemoTitle(log, "Select available linters");
  const names = await promptForLinters(languages, "styleguide", styleguideCommandAvailable);
  const hasSelectedLinters = names !== undefined && names.length > 0;
  if (!hasSelectedLinters) {
    printDemoResult(log, "linters", "none selected");
    return;
  }
  printDemoResult(log, "linters", names.join(", "));
  printDemoTitle(log, "Configure native arguments");
  const linters = await promptForLinterConfig(names);
  const source = setupSource("styleguide", languages, linters);
  printDemoTitle(log, "Review configuration");
  log.print(JSON.stringify(source.config, null, 2));
  const shouldSave = await promptConfirm(
    "Demo · Save this configuration? (nothing is written)",
    true,
  );
  printDemoResult(log, "save", shouldSave ? "approved · not written" : "skipped");
  await previewFullSetup(log, source, names);
  const shouldRun = await promptConfirm("Demo · Run these linters now? (never runs)", false);
  printDemoResult(log, "execution", shouldRun ? "approved · not executed" : "not approved");
};

const runUpdateDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Update Homebrew linters");
  const selected = await promptCheckbox(
    "Demo · Which outdated linters should be updated?",
    STYLEGUIDE_UPDATE_CHOICES,
  );
  printDemoResult(log, "linters", selected.join(", ") || "none");
  const shouldUpdate = await promptConfirm("Demo · Approve Homebrew upgrades?", false);
  printDemoResult(log, "updates", shouldUpdate ? "approved" : "not approved");
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
  if (selection === "full") return await runFullSetupDemo(log);
  if (selection === "welcome") return await runWelcomeDemo(log);
  if (selection === "languages") return await runLanguagesDemo(log);
  if (selection === "linters") return await runLintersDemo(log);
  if (selection === "arguments") return await runArgumentsDemo(log);
  if (selection === "review") return await runReviewDemo(log);
  if (selection === "preview") return await runPreviewDemo(log);
  if (selection === "execution") return await runExecutionDemo(log);
  if (selection === "update") return await runUpdateDemo(log);
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
    update: false,
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
    if (options.update) return await runUpdate(options, log);
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

export const runWithPrompt = async (
  args: string[],
  promptLine: PromptLine,
  commandRunner?: CommandRunner,
  promptKey?: PromptKeyReader,
): Promise<number> => {
  setPromptLine(promptLine, promptKey);
  setCommandRunner(commandRunner);
  try {
    return await run(args);
  } finally {
    setPromptLine(undefined);
    setCommandRunner(undefined);
  }
};
