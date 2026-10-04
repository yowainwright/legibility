#!/usr/bin/env node

import {
  accessSync,
  constants as fsConstants,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, delimiter, dirname, extname, join, relative, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import ruleCatalogJson from "../rules/search.json" with { type: "json" };
import {
  applyEdits,
  modify,
  parse as parseJsonc,
  printParseErrorCode,
  type ParseError,
} from "jsonc-parser";
import {
  CONFIG_FILENAMES,
  HELP_TEXT,
  IGNORED_DIRECTORIES,
  LANGUAGE_BY_EXTENSION,
  LANGUAGE_DEFINITIONS,
  LINTER_DEFINITIONS,
  NO_SETUP_MESSAGE,
  OXLINT_CONFIG_FILENAMES,
  SETUP_QUESTION,
  STYLEGUIDE_DETECTED_LANGUAGES,
  STYLEGUIDE_INSTALL_CHOICES,
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
  promptForLinterInstall,
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
import type { PromptKeyReader, PromptLine } from "./prompts/types.ts";
import type {
  Config,
  CommandRunner,
  DetectedLanguage,
  HomebrewFormulaPayload,
  HomebrewLinterUpdate,
  HomebrewOutdatedFormula,
  JsonObject,
  Linter,
  LinterDefinition,
  Options,
  RuleRuntimeCatalog,
  RuleRuntimeRecord,
  RuleVariant,
  Source,
  UpdateConfig,
} from "./types.ts";
import type { Logger } from "../obs/types.ts";

export type { CommandRunner } from "./types.ts";

let nativeCommandRunner: CommandRunner | undefined;

const setCommandRunner = (commandRunner: CommandRunner | undefined): void => {
  nativeCommandRunner = commandRunner;
};

const RULE_CATALOG = ruleCatalogJson as RuleRuntimeCatalog;

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

type CliCommand = "rule" | "rules" | "update" | undefined;
const COMMAND_NAMES = new Set(["rule", "rules", "update"]);

const unexpectedPositionals = (command: CliCommand): never => {
  if (command === "rule") throw new Error("rule requires a rule ID");
  throw new Error("unexpected command arguments");
};

const isCliCommand = (command: string | undefined): command is CliCommand =>
  command === undefined || COMMAND_NAMES.has(command);

const parseCommand = (positionals: string[]): CliCommand => {
  const command = positionals[0];
  if (!isCliCommand(command)) throw new Error(`unknown command: ${positionals.join(" ")}`);
  let expectedPositionals = 1;
  if (command === undefined) expectedPositionals = 0;
  if (command === "rule") expectedPositionals = 2;
  const hasWrongPositionals = positionals.length !== expectedPositionals;
  if (hasWrongPositionals) return unexpectedPositionals(command);
  const requiresRuleId = command === "rule";
  const hasValidRuleId = /^LEG\d{3}$/iu.test(positionals[1] ?? "");
  const hasInvalidRuleId = requiresRuleId && !hasValidRuleId;
  if (hasInvalidRuleId) throw new Error("rule ID must use the form LEG038");
  return command;
};

type CatalogOptions = {
  command: CliCommand;
  enable: boolean;
  language?: string;
  nativeArgs: string[];
  plugin?: string;
  search?: string;
};

const validateCatalogOptions = (options: CatalogOptions): void => {
  const hasSearchOutsideRules = options.search !== undefined && options.command !== "rules";
  if (hasSearchOutsideRules) throw new Error("--search requires the rules command");
  const hasRuleFlags =
    options.language !== undefined || options.plugin !== undefined || options.enable;
  const hasRuleFlagsOutsideRule = hasRuleFlags && options.command !== "rule";
  if (hasRuleFlagsOutsideRule) {
    throw new Error("--language, --plugin, and --enable require the rule command");
  }
  const enableMissingLanguage = options.enable && options.language === undefined;
  const enableMissingPlugin = options.enable && options.plugin === undefined;
  const enableMissingVariant = enableMissingLanguage || enableMissingPlugin;
  if (enableMissingVariant) {
    throw new Error("--enable requires both --language and --plugin");
  }
  const isCatalogCommand = options.command === "rule" || options.command === "rules";
  const nativeArgsWithCatalogCommand = options.nativeArgs.length > 0 && isCatalogCommand;
  if (nativeArgsWithCatalogCommand) {
    throw new Error("native arguments after -- are not supported with rule commands");
  }
};

type CommandOptionValues = Pick<
  CatalogOptions,
  "command" | "enable" | "language" | "plugin" | "search"
> & { options: Options; positionals: string[] };

const appendCommandOptions = (values: CommandOptionValues): Options => {
  const { command, enable, language, options, plugin, positionals, search } = values;
  if (command === "rule") {
    const ruleOptions = Object.assign({}, options, {
      rule: true,
      ruleId: positionals[1]?.toUpperCase(),
    });
    if (language !== undefined) ruleOptions.language = language;
    if (plugin !== undefined) ruleOptions.plugin = plugin;
    if (enable) ruleOptions.enable = true;
    return ruleOptions;
  }
  if (command !== "rules") return options;
  const rulesOptions = Object.assign({}, options, { rules: true });
  if (search !== undefined) rulesOptions.search = search;
  return rulesOptions;
};

export const parseOptions = (args: string[]): Options => {
  const { parsed, split } = parseCliArguments(args);
  const command = parseCommand(parsed.positionals);
  const search = parsed.values.search as string | undefined;
  const language = parsed.values.language as string | undefined;
  const plugin = parsed.values.plugin as string | undefined;
  const enable = Boolean(parsed.values.enable);
  validateCatalogOptions({
    command,
    enable,
    language,
    nativeArgs: split.nativeArgs,
    plugin,
    search,
  });
  const options: Options = {
    configPath: parsed.values.config as string | undefined,
    dryRun: Boolean(parsed.values["dry-run"]),
    help: Boolean(parsed.values.help),
    linters: linterNames(parsed.values.linter),
    nativeArgs: split.nativeArgs,
    styleguide: Boolean(parsed.values.styleguide),
    update: command === "update",
    version: Boolean(parsed.values.version),
    verbose: Boolean(parsed.values.verbose),
  };
  return appendCommandOptions({
    command,
    enable,
    language,
    options,
    plugin,
    positionals: parsed.positionals,
    search,
  });
};

const parseCliArguments = (args: string[]) => {
  const split = nativeArguments(args);
  const parsed = parseArgs({
    args: split.cliArgs,
    options: {
      config: { type: "string", short: "c" },
      "dry-run": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      enable: { type: "boolean" },
      language: { type: "string" },
      linter: { type: "string", multiple: true },
      plugin: { type: "string" },
      search: { type: "string" },
      styleguide: { type: "boolean" },
      version: { type: "boolean", short: "v" },
      verbose: { type: "boolean" },
    },
    strict: true,
    allowPositionals: true,
  });
  return { parsed, split };
};

const readFiles = (directory: string, prefix = ""): string[] => {
  const entries = readdirSync(directory, { withFileTypes: true }).toSorted((left, right) =>
    left.name.localeCompare(right.name),
  );
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

const projectCommandIsAvailable = (command: string, projectBin: string): boolean => {
  if (command === "brew") return false;
  return accessPath(projectBin);
};

const windowsCommandPaths = (commandPaths: string[]): string[] => {
  if (process.platform !== "win32") return [];
  return commandPaths.map((path) => `${path}.exe`);
};

const commandSearchPaths = (
  command: string,
  projectBin: string,
  commandPaths: string[],
): string[] => {
  if (command === "brew") return commandPaths;
  return [projectBin].concat(commandPaths);
};

export const commandIsAvailable = (command: string, root: string): boolean => {
  const pathValue = process.env.PATH;
  const projectBin = join(root, "node_modules", ".bin", command);
  if (!pathValue) return projectCommandIsAvailable(command, projectBin);
  const commandPaths = pathValue.split(delimiter).map((directory) => join(directory, command));
  const windowsPaths = windowsCommandPaths(commandPaths);
  const searchPaths = commandSearchPaths(command, projectBin, commandPaths);
  const allPaths = searchPaths.concat(windowsPaths);
  return allPaths.some((path) => accessPath(path));
};

const commandEnvironment = (root: string, command: string): Record<string, string> => {
  const projectBin = join(root, "node_modules", ".bin");
  const pathValue = process.env.PATH ?? "";
  const pathEntries = command === "brew" ? [pathValue] : [projectBin, pathValue];
  return Object.assign({}, process.env, {
    PATH: pathEntries.filter(Boolean).join(delimiter),
  }) as Record<string, string>;
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
    env: commandEnvironment(root, "brew"),
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
    const env = commandEnvironment(root, command);
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

const hasHomebrewLinter = (id: string): boolean =>
  LINTER_DEFINITIONS.some(({ id: definitionId, brewFormula }) => {
    const isMatchingId = definitionId === id;
    const hasFormula = brewFormula !== undefined;
    return isMatchingId && hasFormula;
  });

const checkForUpdates = async (source: Source, options: Options, log: Logger): Promise<void> => {
  const shouldSkipUpdate = options.dryRun || !source.config.updates.enabled;
  if (shouldSkipUpdate) return;
  const shouldSkipPrompt = source.config.updates.prompt && !process.stdin.isTTY;
  if (shouldSkipPrompt) {
    log.debug("Skipping automatic update check without an interactive terminal", "update");
    return;
  }
  const ids = updateIds(source, options).filter(hasHomebrewLinter);
  if (ids.length === 0) return;
  if (!commandIsAvailable(source.config.updates.manager, source.root)) {
    log.debug("Homebrew is unavailable; skipping automatic update check", "update");
    return;
  }
  const exitCode = await updateHomebrewLinters(source.root, ids, source.config.updates, log);
  if (exitCode !== 0) log.debug(`Automatic update check exited with ${exitCode}`, "update");
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

const installHomebrewLinters = (root: string, ids: string[], log: Logger): Promise<number> => {
  const definitions = new Map(LINTER_DEFINITIONS.map((definition) => [definition.id, definition]));
  const formulas = ids.flatMap((id) => {
    const definition = definitions.get(id);
    if (definition === undefined) return [];
    const formula = definition.brewFormula;
    const hasFormula = formula !== undefined;
    if (!hasFormula) return [];
    return [formula];
  });
  if (formulas.length === 0) return Promise.resolve(0);
  log.print(`Installing native linters: ${ids.join(", ")}`);
  return runCommand("brew", ["install"].concat(formulas), root, log);
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
  let config: Config;
  if (source === undefined) config = parseConfig({ linters: {} });
  else config = source.config;
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
  let root: string;
  if (source === undefined) root = resolve(process.cwd());
  else root = source.root;
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
  let result = "no";
  if (answer) result = "yes";
  printDemoResult(log, "setup", result);
};

const runLanguagesDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Detect languages");
  const selected = await promptCheckbox(
    "Demo · Which languages should Legibility check?",
    STYLEGUIDE_LANGUAGE_CHOICES,
  );
  printDemoResult(log, "languages", selected.join(", ") || "none");
};

const runInstallDemo = async (log: Logger): Promise<void> => {
  printDemoTitle(log, "Install native linters");
  const installAll = await promptConfirm("Demo · Install all available native linters?", true);
  const selected = installAll
    ? STYLEGUIDE_INSTALL_CHOICES.map(({ value }) => value)
    : await promptCheckbox(
        "Demo · Which native linters should be installed?",
        STYLEGUIDE_INSTALL_CHOICES,
      );
  printDemoResult(log, "install", selected.join(", ") || "none");
  log.print("Demo · Homebrew install is not executed.");
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
  await runInstallDemo(log);
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
  if (selection === "install") return await runInstallDemo(log);
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
      const shouldReturnToMenu = await promptConfirm("Return to the styleguide menu?", true);
      if (!shouldReturnToMenu) return 0;
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

const setupOptions = (source: Source, names: string[], verbose: boolean): Options => {
  const configPath = source.path === "interactive" ? undefined : source.path;
  return {
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
};

const setupProject = async (log: Logger, verbose: boolean): Promise<number> => {
  const root = resolve(process.cwd());
  const detected = detectLanguages(root);
  const languages = await promptForLanguages(detected);
  log.debug(`Languages: ${languages.join(",") || "none"}`, "setupProject");
  const installIds = await promptForLinterInstall(languages, root, commandIsAvailable);
  const installExit = await installHomebrewLinters(root, installIds, log);
  if (installExit !== 0) return installExit;
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
  const options = setupOptions(source, names, verbose);
  log.print("\nPreview — no linters will run:");
  const dryRunExit = await runLinters(source, options);
  if (dryRunExit !== 0) return dryRunExit;
  const shouldRun = await promptConfirm("Run these linters now?", false);
  log.debug(`Execution approved=${shouldRun}`, "setupProject");
  if (!shouldRun) return 0;
  await checkForUpdates(source, Object.assign({}, options, { dryRun: false }), log);
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

const readRunSource = (options: Options): Source | undefined => {
  if (options.configPath) return readSource(resolve(process.cwd(), options.configPath));
  return discoverConfig();
};

type OxlintDocument = {
  config: JsonObject;
  content: string;
  existed: boolean;
  nestedConfigs: string[];
  path: string;
  supported: boolean;
};

type RuleProjectState = {
  reason: string;
  state: "disabled" | "enabled" | "unknown";
};

type RuleDetailsRequest = {
  language: string | undefined;
  log: Logger;
  root: string;
  rule: RuleRuntimeRecord;
  source: Source | undefined;
  variants: RuleVariant[];
};

type RuleVariantFormatRequest = {
  language: string | undefined;
  ruleId: string;
  source: Source | undefined;
  state: RuleProjectState;
  variant: RuleVariant;
};

type EnableRuleRequest = {
  log: Logger;
  options: Options;
  root: string;
  source: Source | undefined;
  variant: RuleVariant;
};

const oxlintConfigsIn = (directory: string): string[] =>
  OXLINT_CONFIG_FILENAMES.map((filename) => join(directory, filename)).filter(existsSync);

const isOxlintConfigFilename = (path: string): boolean =>
  OXLINT_CONFIG_FILENAMES.some((filename) => filename === basename(path));

const findOxlintConfig = (directory: string): string | undefined => {
  const configs = oxlintConfigsIn(directory);
  if (configs.length > 1) {
    throw new Error(`multiple Oxlint configurations found: ${configs.join(", ")}`);
  }
  if (configs.length === 1) return configs[0];
  const parent = dirname(directory);
  if (parent === directory) return undefined;
  return findOxlintConfig(parent);
};

const parseOxlintConfig = (path: string, content: string): JsonObject => {
  const errors: ParseError[] = [];
  const config = parseJsonc(content, errors, { allowTrailingComma: true }) as unknown;
  if (errors.length > 0) {
    const error = errors[0];
    if (error === undefined) throw new Error(`invalid Oxlint configuration: ${path}`);
    throw new Error(`${printParseErrorCode(error.error)} at offset ${error.offset} in ${path}`);
  }
  if (!isObject(config)) throw new Error(`Oxlint configuration must be an object: ${path}`);
  return config;
};

const readOxlintDocument = (root: string): OxlintDocument => {
  const existingPath = findOxlintConfig(root);
  const path = existingPath ?? join(root, OXLINT_CONFIG_FILENAMES[0]);
  const configFiles = readFiles(root).filter(isOxlintConfigFilename);
  const resolvedConfigs = configFiles.map((file) => resolve(root, file));
  const nestedConfigs = resolvedConfigs.filter((configPath) => configPath !== path);
  const isScriptConfig = [".ts", ".mts"].includes(extname(path));
  const isSupported = !isScriptConfig;
  if (!isSupported) {
    return { config: {}, content: "", existed: true, nestedConfigs, path, supported: false };
  }
  const existed = existsSync(path);
  const content = existed ? readFileSync(path, "utf8") : "{}\n";
  const config = parseOxlintConfig(path, content);
  return { config, content, existed, nestedConfigs, path, supported: true };
};

const DISABLED_RULE_SEVERITIES = new Set<unknown>(["off", 0]);
const ENABLED_RULE_SEVERITIES = new Set<unknown>(["warn", "error", 1, 2]);

const stateFromRuleSetting = (value: unknown): RuleProjectState["state"] => {
  const severity = Array.isArray(value) ? value[0] : value;
  const isDisabled = severity === undefined || DISABLED_RULE_SEVERITIES.has(severity);
  if (isDisabled) return "disabled";
  if (ENABLED_RULE_SEVERITIES.has(severity)) return "enabled";
  return "unknown";
};

const configScopeIsUncertain = (config: JsonObject): boolean => {
  const overrides = config.overrides;
  const hasInvalidOverrides = overrides !== undefined && !Array.isArray(overrides);
  const hasOverrides = Array.isArray(overrides) && overrides.length > 0;
  const hasUncertainScope = hasInvalidOverrides || hasOverrides || config.extends !== undefined;
  return hasUncertainScope;
};

const stateFromOxlintConfig = (
  document: OxlintDocument,
  nativeRule: string,
  defaultState: RuleVariant["defaultState"],
): RuleProjectState => {
  const isUnsupported = !document.supported;
  if (isUnsupported) return { state: "unknown", reason: "TypeScript configs are read-only" };
  const hasNestedConfigs = document.nestedConfigs.length > 0;
  if (hasNestedConfigs) {
    return { state: "unknown", reason: "nested Oxlint configs may change effective settings" };
  }
  const hasUncertainScope = configScopeIsUncertain(document.config);
  if (hasUncertainScope) {
    return { state: "unknown", reason: "the config uses extends or file overrides" };
  }
  const rules = document.config.rules;
  const rulesAreInvalid = rules !== undefined && !isObject(rules);
  if (rulesAreInvalid) {
    return { state: "unknown", reason: "the config rules field is not an object" };
  }
  const configuredRules = isObject(rules) ? rules : {};
  const configured = configuredRules[nativeRule];
  if (configured !== undefined) {
    return { state: stateFromRuleSetting(configured), reason: "native rule setting" };
  }
  const hasCategories = document.config.categories !== undefined;
  if (hasCategories) {
    return { state: "unknown", reason: "categories may enable the rule" };
  }
  const hasDocumentedDefault = defaultState !== "unknown";
  if (!hasDocumentedDefault) return { state: "unknown", reason: "no documented default" };
  let reason = "no Oxlint config; documented default";
  if (document.existed) reason = "documented default";
  return { state: defaultState, reason };
};

const oxlintArguments = (source: Source | undefined): string[] => {
  const definition = LINTER_DEFINITIONS.find(({ command }) => command === "oxlint");
  if (definition === undefined) return [];
  return source?.config.linters[definition.id]?.args ?? [];
};

const cliRuleState = (args: string[], nativeRule: string): RuleProjectState | undefined => {
  const severityByFlag = new Map<string, RuleProjectState["state"]>([
    ["--deny", "enabled"],
    ["--warn", "enabled"],
    ["--allow", "disabled"],
  ] as const);
  const overrides: RuleProjectState[] = args.flatMap((argument, index): RuleProjectState[] => {
    const [flag, inlineRule] = argument.split("=", 2);
    const state = severityByFlag.get(flag ?? "");
    if (state === undefined) return [];
    const target = inlineRule ?? args[index + 1];
    if (target === undefined) {
      return [{ state: "unknown", reason: `${flag} has no rule value` }];
    }
    const isTargetedRule = [nativeRule, `eslint/${nativeRule}`].includes(target);
    if (!isTargetedRule) return [{ state: "unknown", reason: "custom Oxlint rule arguments" }];
    return [{ state, reason: "Legibility native arguments" }];
  });
  if (overrides.length === 0) return undefined;
  const states = new Set(overrides.map(({ state }) => state));
  if (states.size > 1) return { state: "unknown", reason: "conflicting Oxlint rule arguments" };
  const result = overrides[0];
  if (result === undefined) return undefined;
  return { state: result.state, reason: result.reason };
};

const isSeparateConfigArgument = (argument: string): boolean =>
  argument === "--config" || argument === "-c";

const isOxlintConfigArgument = (argument: string): boolean =>
  argument.startsWith("--config=") || isSeparateConfigArgument(argument);

const hasOxlintConfigArgument = (args: string[]): boolean => args.some(isOxlintConfigArgument);

const ruleProjectState = (
  document: OxlintDocument,
  source: Source | undefined,
  variant: RuleVariant,
): RuleProjectState => {
  const args = oxlintArguments(source);
  if (hasOxlintConfigArgument(args)) {
    return { state: "unknown", reason: "the Legibility config selects another Oxlint config" };
  }
  const cliState = cliRuleState(args, variant.nativeRule);
  if (cliState !== undefined) return cliState;
  return stateFromOxlintConfig(document, variant.nativeRule, variant.defaultState);
};

const normalizeRuleLanguage = (value: string): string => {
  const normalized = value.toLowerCase();
  const definition = LANGUAGE_DEFINITIONS.find(
    ({ id, label }) => id.toLowerCase() === normalized || label.toLowerCase() === normalized,
  );
  return definition?.id ?? normalized;
};

const ruleVariantRoute = (ruleId: string, language: string, plugin: string): string =>
  `/docs/rules/${ruleId}/${normalizeRuleLanguage(language)}/${plugin.toLowerCase()}/`;

const normalizePlugin = (value: string): string =>
  value.toLowerCase().replace(/-(plugin-)?legibility$/u, "");

const pluginMatches = (selector: string, plugin: string): boolean => {
  const normalized = normalizePlugin(selector);
  if (normalized === plugin.toLowerCase()) return true;
  const definition = LINTER_DEFINITIONS.find(
    ({ command, id }) => command === normalized || id === selector.toLowerCase(),
  );
  return definition?.languages.includes(plugin.toLowerCase()) ?? false;
};

const selectRuleVariants = (options: Options, rule: RuleRuntimeRecord): RuleVariant[] =>
  rule.variants.filter((variant) => {
    const matchesLanguage = variantSupportsLanguage(variant, options.language);
    const matchesPlugin =
      options.plugin === undefined || pluginMatches(options.plugin, variant.plugin);
    return matchesLanguage && matchesPlugin;
  });

const variantSupportsLanguage = (variant: RuleVariant, language: string | undefined): boolean => {
  if (language === undefined) return true;
  const languageLabels = new Set(variant.languages.map(normalizeRuleLanguage));
  return languageLabels.has(normalizeRuleLanguage(language));
};

const formatRecommendedRule = (variant: RuleVariant): string | undefined => {
  if (variant.recommended === undefined) return undefined;
  if (!Array.isArray(variant.recommended)) return JSON.stringify(variant.recommended);
  const [severity, options] = variant.recommended;
  return `${String(severity)} ${JSON.stringify(options)}`;
};

const selectedVariantLanguages = (
  variant: RuleVariant,
  selectedLanguage: string | undefined,
): string[] => {
  if (selectedLanguage === undefined) return variant.languages;
  const selected = normalizeRuleLanguage(selectedLanguage);
  return variant.languages.filter((language) => normalizeRuleLanguage(language) === selected);
};

const formatVariantCoverage = (variant: RuleVariant, languages: string[]): string => {
  const entries = variant.coverage.filter(({ language }) => languages.includes(language));
  return entries.map(({ language, status }) => `${language}: ${status}`).join("; ");
};

const optionalRuleLine = (label: string, value: string | undefined): string[] => {
  if (value === undefined) return [];
  return [`  ${label}: ${value}`];
};

const formatRuleVariant = (request: RuleVariantFormatRequest): string => {
  const { language: selectedLanguage, ruleId, source, state, variant } = request;
  const languages = selectedVariantLanguages(variant, selectedLanguage);
  const language = languages.join(", ");
  const coverage = formatVariantCoverage(variant, languages);
  const recommended = formatRecommendedRule(variant);
  const baseLines = [
    `${language} · ${variant.plugin} · native rule: ${variant.nativeRule}`,
    `  Coverage: ${coverage}`,
    `  Default: ${variant.defaultState}`,
    `  Settings: ${variant.settings}`,
  ];
  const recommendedLine = optionalRuleLine("Recommended", recommended);
  const stateText = `${state.state} (${state.reason})`;
  const projectLine = optionalRuleLine("Project", stateText);
  const isOxlint = variant.plugin.toLowerCase() === "oxlint";
  const runnerText = isOxlint ? legibilityOxlintStatus(source) : undefined;
  const runnerLine = optionalRuleLine("Legibility runner", runnerText);
  const docsLinks = languages.map((selected) => ruleVariantRoute(ruleId, selected, variant.plugin));
  const docsLine = [`  Docs: ${docsLinks.join(", ")}`];
  return baseLines.concat(recommendedLine, projectLine, runnerLine, docsLine).join("\n");
};

const legibilityOxlintStatus = (source: Source | undefined): string => {
  const definition = LINTER_DEFINITIONS.find(({ command }) => command === "oxlint");
  if (definition === undefined) return "unsupported";
  const linter = source?.config.linters[definition.id];
  if (linter === undefined) return "not configured";
  return linter.enabled ? "enabled" : "disabled";
};

const projectStateForVariant = (
  document: OxlintDocument | undefined,
  source: Source | undefined,
  variant: RuleVariant,
  configError: string | undefined,
): RuleProjectState => {
  const isOxlint = variant.plugin.toLowerCase() === "oxlint";
  if (!isOxlint) return { state: "unknown", reason: "project inspection is currently Oxlint-only" };
  if (configError !== undefined) return { state: "unknown", reason: configError };
  if (document === undefined)
    return { state: "unknown", reason: "Oxlint config could not be loaded" };
  return ruleProjectState(document, source, variant);
};

const availableRuleVariants = (rule: RuleRuntimeRecord): string =>
  rule.variants.map(({ languages, plugin }) => `${languages.join("/")} · ${plugin}`).join("; ");

const runRule = (options: Options, log: Logger): number => {
  const rule = RULE_CATALOG.rules.find(({ id }) => id === options.ruleId);
  if (rule === undefined) {
    log.fail(
      `Error: unknown rule ${options.ruleId}; search with legibility rules --search <terms>`,
    );
    return 2;
  }
  const variants = selectRuleVariants(options, rule);
  if (variants.length === 0) {
    log.fail(`Error: no matching ${rule.id} mapping; available: ${availableRuleVariants(rule)}`);
    return 2;
  }
  const source = readRunSource(options);
  const root = source?.root ?? resolve(process.cwd());
  if (options.enable) {
    if (variants.length !== 1)
      throw new Error("select exactly one language and plugin variant to enable");
    const variant = variants[0];
    if (variant === undefined) throw new Error("no rule variant selected");
    return enableOxlintRule({ log, options, root, source, variant });
  }
  return printRuleDetails({
    language: options.language,
    log,
    root,
    rule,
    source,
    variants,
  });
};

const printRuleDetails = (request: RuleDetailsRequest): number => {
  const { language, log, root, rule, source, variants } = request;
  const hasOxlintVariant = variants.some(({ plugin }) => plugin.toLowerCase() === "oxlint");
  let document: OxlintDocument | undefined;
  let configError: string | undefined;
  if (hasOxlintVariant) {
    try {
      document = readOxlintDocument(root);
    } catch (error: unknown) {
      configError = error instanceof Error ? error.message : String(error);
    }
  }
  const header = [`${rule.id} — ${rule.name}`, rule.description, `Topics: ${rule.tags.join(", ")}`];
  const sections = variants.map((variant) => {
    const state = projectStateForVariant(document, source, variant, configError);
    return formatRuleVariant({ language, ruleId: rule.id, source, state, variant });
  });
  log.print(header.concat(sections).join("\n\n"));
  return 0;
};

const ruleConfiguration = (config: JsonObject): JsonObject | undefined => {
  const rules = config.rules;
  if (rules === undefined) return {};
  if (!isObject(rules)) throw new Error("Oxlint rules must be an object");
  return rules;
};

const ruleArgumentState = (args: string[], nativeRule: string): RuleProjectState | undefined => {
  if (hasOxlintConfigArgument(args)) {
    return { state: "unknown", reason: "the Legibility config selects another Oxlint config" };
  }
  return cliRuleState(args, nativeRule);
};

const displayConfigPath = (root: string, path: string): string =>
  relative(root, path) || basename(path);

const updateOxlintSource = (content: string, variant: RuleVariant): string => {
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const edits = modify(content, ["rules", variant.nativeRule], variant.recommended, {
    formattingOptions: { eol, insertSpaces: true, tabSize: 2 },
  });
  return applyEdits(content, edits);
};

const enableOxlintRule = (request: EnableRuleRequest): number => {
  const { log, root, source, variant } = request;
  const isSupported =
    variant.plugin.toLowerCase() === "oxlint" && variant.recommended !== undefined;
  if (!isSupported)
    throw new Error("automatic enablement is supported for documented Oxlint mappings only");
  const argumentsState = ruleArgumentState(oxlintArguments(source), variant.nativeRule);
  if (argumentsState?.state === "enabled") {
    log.print(`${variant.nativeRule} is already enabled by the Legibility Oxlint arguments.`);
    return 0;
  }
  if (argumentsState !== undefined)
    throw new Error(`cannot safely edit Oxlint config: ${argumentsState.reason}`);
  const document = readOxlintDocument(root);
  if (!document.supported) throw new Error(`automatic enablement cannot edit ${document.path}`);
  const configOutsideProject = relative(root, document.path).startsWith("..");
  if (configOutsideProject)
    throw new Error(`Oxlint config is above the project root: ${document.path}`);
  if (document.nestedConfigs.length > 0) {
    throw new Error("automatic enablement does not edit projects with nested Oxlint configs");
  }
  if (configScopeIsUncertain(document.config)) {
    throw new Error(
      "automatic enablement does not edit Oxlint configs with extends or file overrides",
    );
  }
  return writeOxlintRule(request, document);
};

const writeOxlintRule = (request: EnableRuleRequest, document: OxlintDocument): number => {
  const { log, options, root, source, variant } = request;
  const rules = ruleConfiguration(document.config);
  if (rules === undefined) throw new Error("could not read Oxlint rules");
  const existing = rules[variant.nativeRule];
  const categoriesMayEnableRule =
    existing === undefined && document.config.categories !== undefined;
  if (categoriesMayEnableRule) {
    throw new Error(
      "Oxlint categories may already enable this rule; inspect the effective config first",
    );
  }
  const currentState =
    existing === undefined ? variant.defaultState : stateFromRuleSetting(existing);
  if (currentState === "enabled") {
    log.print(`${variant.nativeRule} is already enabled; its existing settings were preserved.`);
    return 0;
  }
  if (currentState === "unknown") {
    throw new Error(`${variant.nativeRule} has no documented default; refusing to guess its state`);
  }
  const updated = updateOxlintSource(document.content, variant);
  const configPath = displayConfigPath(root, document.path);
  if (options.dryRun) {
    log.print(
      `Would set ${configPath} rules.${variant.nativeRule} = ${JSON.stringify(variant.recommended)}`,
    );
    return 0;
  }
  writeFileSync(document.path, updated, "utf8");
  log.print(`Enabled ${options.ruleId} in ${configPath}.`);
  if (legibilityOxlintStatus(source) === "enabled") {
    log.print("Run the configured checks with `legibility`.");
    return 0;
  }
  log.print("Run `oxlint .` from the project root after installing Oxlint.");
  return 0;
};

const queryMatchesSearchTerms = (searchText: string, terms: string[]): boolean => {
  const unmatched = terms.filter((term) => !searchText.includes(term));
  return unmatched.length === 0;
};

const searchRules = (query: string): RuleRuntimeCatalog["rules"] => {
  const terms = query.toLowerCase().split(/\s+/u).filter(Boolean);
  return RULE_CATALOG.rules.filter((rule) => queryMatchesSearchTerms(rule.searchTerms, terms));
};

const formatRule = (rule: RuleRuntimeRecord): string => {
  const detailsUrl = `/docs/rules/${rule.id}/`;
  return [
    `${rule.id} — ${rule.name}`,
    `  ${rule.description}`,
    `  Topics: ${rule.tags.join(", ")}`,
    `  Languages: ${rule.languages.join(", ")}`,
    `  Details: ${detailsUrl}`,
  ].join("\n");
};

const runRules = (options: Options, log: Logger): number => {
  if (!options.search?.trim()) {
    log.print(`Search ${RULE_CATALOG.rules.length} shared rules with --search <terms>.`);
    return 0;
  }
  const matches = searchRules(options.search);
  if (matches.length === 0) {
    log.print(`No rules match "${options.search}".`);
    return 0;
  }
  const heading = `${matches.length} of ${RULE_CATALOG.rules.length} rules match "${options.search}":`;
  const resultLines = [heading].concat(matches.map(formatRule));
  log.print(resultLines.join("\n\n"));
  return 0;
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
  if (options.rules) return runRules(options, log);
  try {
    if (options.rule) return runRule(options, log);
    if (options.update) return await runUpdate(options, log);
    const source = readRunSource(options);
    if (!source) return promptForSetup(options);
    await checkForUpdates(source, options, log);
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
