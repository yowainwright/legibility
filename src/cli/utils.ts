import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  LANGUAGE_DEFINITIONS,
  LINTER_DEFINITIONS,
  STYLEGUIDE_CANCEL_MARK,
  STYLEGUIDE_INSTALL_CHOICES,
  STYLEGUIDE_LANGUAGE_CHOICES,
  STYLEGUIDE_LINTER_CHOICES,
  STYLEGUIDE_PREVIEW_MARK,
  TOOL_BY_LINTER_ID,
} from "./constants.ts";
import {
  formatCheckboxDemo,
  formatConfirmDemo,
  formatInputDemo,
  promptAnsi as ANSI,
} from "./prompts/index.ts";
import { promptCheckbox, promptConfirm, promptInput } from "./prompts/index.ts";
import type {
  CommandAvailability,
  DetectedLanguage,
  Linter,
  LinterDefinition,
  Source,
} from "./types.ts";
import type { DetectedTool } from "../lib/diagnose/types.ts";
export { commandLines, reviewLines };

export const promptForLanguages = (detected: DetectedLanguage[]): Promise<string[]> => {
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

export const promptForLinterInstall = async (
  languages: string[],
  root: string,
  isAvailable: CommandAvailability,
): Promise<string[]> => {
  const candidates = installableLinters(languages, root, isAvailable);
  if (candidates.length === 0) return [];
  const hasHomebrew = isAvailable("brew", root);
  if (!hasHomebrew) return [];
  const installAll = await promptConfirm("Install all available native linters?", true);
  if (installAll) return candidates.map(({ id }) => id);
  const choices = candidates.map((definition) => ({
    name: definition.id,
    value: definition.id,
    description: installDescription(definition),
    checked: true,
  }));
  return promptCheckbox("Which native linters should be installed?", choices);
};

export const promptForLinters = (
  languages: string[],
  root: string,
  isAvailable: CommandAvailability,
  tools: DetectedTool[] = [],
): Promise<string[] | undefined> => {
  const candidates = candidateLinters(languages);
  const available = candidates.filter(({ command }) => isAvailable(command, root));
  if (available.length === 0) return Promise.resolve(undefined);
  const availableIds = new Set(available.map(({ id }) => id));
  const choices = linterChoices(candidates, availableIds, tools);
  return promptCheckbox("Which linters should run?", choices, true);
};

export const promptForLinterConfig = async (names: string[]): Promise<Record<string, Linter>> => {
  const linters: Record<string, Linter> = {};
  for (const name of names) {
    const answer = await promptInput(`Arguments for ${name} (optional)`);
    linters[name] = { enabled: true, args: parseNativeArgs(answer) };
  }
  return linters;
};

export const setupSource = (
  root: string,
  languages: string[],
  linters: Record<string, Linter>,
): Source => ({ path: "interactive", root, config: setupConfig(languages, linters) });

export const saveSetupSource = (source: Source): string => {
  const path = join(source.root, "legibility.json");
  writeFileSync(path, `${JSON.stringify(source.config, null, 2)}\n`, "utf8");
  return path;
};

export const formatStyleguide = (): string => {
  const { languageFrame, linterFrame, installFrame } = styleguideFrames();
  const cancellationLine = `${ANSI.RED}${STYLEGUIDE_CANCEL_MARK}${ANSI.RESET} Which linters should run?: cancelled`;
  const title = `${ANSI.BOLD}${ANSI.CYAN}Legibility CLI Styleguide${ANSI.RESET}`;
  const startSections = welcomeSections(languageFrame, installFrame);
  const middleSections = selectionSections(linterFrame);
  const endSections = cancellationSections(cancellationLine);
  const sections = startSections.concat(middleSections, endSections);
  const separator = `${ANSI.GRAY}────────────────────────────────────────────────────────────────────${ANSI.RESET}`;
  const keyboard = `${ANSI.GRAY}Keyboard: ↑/↓ navigate · Space toggle · a all · n none · Enter confirm · Esc cancel${ANSI.RESET}`;
  return [
    title,
    "A visual tour of the guided project setup. No files are written and no linters run.",
    separator,
  ]
    .concat(sections, separator, keyboard)
    .join("\n\n");
};

const reviewLines = (): string[] => [
  `${ANSI.BOLD}Configuration preview${ANSI.RESET}`,
  "  languages: typescript",
  "  linters:",
  "    oxlint-plugin-legibility:",
  "      enabled: true",
  "      args: []",
  "  updates:",
  "    enabled: true",
  "    manager: brew",
  "    prompt: true",
];

const commandLines = (): string[] => [
  `${ANSI.GREEN}${STYLEGUIDE_PREVIEW_MARK} Preview — no linters will run${ANSI.RESET}`,
  "  $ oxlint . --config oxlint.config.ts --deny-warnings",
];

const languageDescription = (language: DetectedLanguage | undefined): string => {
  if (!language) return "not detected";
  const fileSample = language.files.join(", ");
  const hasMoreFiles = language.files.length < language.count;
  const suffix = hasMoreFiles ? ", …" : "";
  const fileCount = language.count === 1 ? "1 file" : `${language.count} files`;
  if (!fileSample) return fileCount;
  return `${fileCount} · ${fileSample}${suffix}`;
};

const supportsLanguages = (languages: string[], supported: readonly string[]): boolean => {
  const supportedLanguages = new Set(supported);
  const hasAnySupportedLanguage = languages.some((language) => supportedLanguages.has(language));
  if (supportedLanguages.has("*")) return true;
  return hasAnySupportedLanguage;
};

const isInstallableLinter = (
  definition: LinterDefinition,
): definition is LinterDefinition & { brewFormula: string } =>
  definition.kind === "standalone" && definition.brewFormula !== undefined;

const installDescription = (definition: LinterDefinition & { brewFormula: string }): string =>
  `${definition.description} · brew install ${definition.brewFormula}`;

const linterDisabledState = (isInstalled: boolean): boolean | string => {
  if (isInstalled) return false;
  return "not installed";
};

const installableLinters = (
  languages: string[],
  root: string,
  isAvailable: CommandAvailability,
): Array<LinterDefinition & { brewFormula: string }> =>
  candidateLinters(languages)
    .filter(isInstallableLinter)
    .filter(({ command }) => !isAvailable(command, root));

const matchesLinter = (
  tool: DetectedTool,
  id: string,
  command: string,
  alias?: string,
): boolean => {
  const matchesId = tool.id === id;
  const matchesCommand = tool.id === command;
  const matchesAlias = tool.id === alias;
  if (matchesId) return true;
  if (matchesCommand) return true;
  return matchesAlias;
};

const evidenceDescription = (evidence: DetectedTool["evidence"][number]): string => {
  const { kind, count, paths } = evidence;
  const suffix = count > 1 ? ` (+${count - 1} more)` : "";
  return `${evidenceLabel(kind)} in ${paths[0]}${suffix}`;
};

const evidenceLabel = (kind: DetectedTool["evidence"][number]["kind"]): string => {
  if (kind === "config") return "config found";
  if (kind === "dependency") return "dependency declared";
  return "script invokes";
};

const linterEvidence = (id: string, command: string, tools: DetectedTool[]): string => {
  const evidence = matchingLinterEvidence(id, command, tools);
  if (evidence.length === 0) return "matches detected languages";
  const details = evidence.map(evidenceDescription);
  const visibleDetails = details.slice(0, 2).join("; ");
  const extraCount = details.length - 2;
  const suffix = extraCount > 0 ? `; +${extraCount} more` : "";
  return `${visibleDetails}${suffix}`;
};

const matchingLinterEvidence = (
  id: string,
  command: string,
  tools: DetectedTool[],
): DetectedTool["evidence"] => {
  const alias = TOOL_BY_LINTER_ID[id];
  const matchingTools = tools.filter((tool) => matchesLinter(tool, id, command, alias));
  return matchingTools.flatMap(({ evidence }) => evidence);
};

const linterChoices = (
  candidates: LinterDefinition[],
  availableIds: Set<string>,
  tools: DetectedTool[],
) =>
  candidates.map(({ id, command, description }) => {
    const isInstalled = availableIds.has(id);
    const evidence = linterEvidence(id, command, tools);
    return {
      name: id,
      value: id,
      description: `${description} · ${command} · ${evidence}`,
      checked: isInstalled,
      disabled: linterDisabledState(isInstalled),
    };
  });

const candidateLinters = (languages: string[]): LinterDefinition[] =>
  LINTER_DEFINITIONS.filter(({ languages: supported }) => supportsLanguages(languages, supported));

const parseNativeArgs = (answer: string): string[] => {
  const trimmed = answer.trim();
  if (trimmed === "") return [];
  return trimmed.split(/\s+/);
};

const setupConfig = (languages: string[], linters: Record<string, Linter>): Source["config"] => {
  return {
    languages,
    linters,
    updates: {
      enabled: true,
      manager: "brew",
      prompt: true,
    },
  };
};

const welcomeSections = (languageFrame: string[], installFrame: string[]): string[] => [
  section("01  Welcome", [formatConfirmDemo("Set up Legibility for this project?", false)]),
  section("02  Detect languages", languageFrame),
  section(
    "03  Install native linters",
    [formatConfirmDemo("Install all available native linters?", true)].concat(installFrame),
  ),
];

const selectionSections = (linterFrame: string[]): string[] => [
  section("04  Select available linters", linterFrame),
  section("05  Configure native arguments", [
    formatInputDemo("Arguments for oxlint-plugin-legibility (optional)", "--deny-warnings"),
  ]),
  section("06  Review and save", reviewLines()),
  section("07  Preview commands", commandLines()),
  section("08  Approve execution", [formatConfirmDemo("Run these linters now?", false)]),
];

const cancellationSections = (cancellationLine: string): string[] => [
  section("09  Cancellation", [cancellationLine]),
];

const section = (title: string, lines: string[]): string =>
  [`${ANSI.BOLD}${ANSI.CYAN}${title}${ANSI.RESET}`].concat(lines).join("\n");

const styleguideFrames = () => {
  const languageFrame = formatCheckboxDemo(
    "Which languages should Legibility check?",
    STYLEGUIDE_LANGUAGE_CHOICES,
  );
  const linterFrame = formatCheckboxDemo("Which linters should run?", STYLEGUIDE_LINTER_CHOICES);
  const installFrame = formatCheckboxDemo(
    "Which native linters should be installed?",
    STYLEGUIDE_INSTALL_CHOICES,
  );
  return { languageFrame, linterFrame, installFrame };
};
