import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  LANGUAGE_DEFINITIONS,
  LINTER_DEFINITIONS,
  STYLEGUIDE_CANCEL_MARK,
  STYLEGUIDE_LANGUAGE_CHOICES,
  STYLEGUIDE_LINTER_CHOICES,
  STYLEGUIDE_PREVIEW_MARK,
} from "./constants.ts";
import {
  formatCheckboxDemo,
  formatConfirmDemo,
  formatInputDemo,
  promptAnsi as ANSI,
} from "./prompts/index.ts";
import { promptCheckbox, promptInput } from "./prompts/index.ts";
import type { CommandAvailability, DetectedLanguage, JsonObject, Linter, Source } from "./types.ts";

const languageDescription = (language: DetectedLanguage | undefined): string => {
  if (!language) return "not detected";
  const fileSample = language.files.join(", ");
  const hasMoreFiles = language.files.length < language.count;
  const suffix = hasMoreFiles ? ", …" : "";
  const fileCount = language.count === 1 ? "1 file" : `${language.count} files`;
  if (!fileSample) return fileCount;
  return `${fileCount} · ${fileSample}${suffix}`;
};

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

const supportsLanguages = (languages: string[], supported: readonly string[]): boolean => {
  const supportedLanguages = new Set(supported);
  return (
    supportedLanguages.has("*") || languages.some((language) => supportedLanguages.has(language))
  );
};

export const promptForLinters = (
  languages: string[],
  root: string,
  isAvailable: CommandAvailability,
): Promise<string[] | undefined> => {
  const candidates = LINTER_DEFINITIONS.filter(({ languages: supported }) =>
    supportsLanguages(languages, supported),
  );
  const available = candidates.filter(({ command }) => isAvailable(command, root));
  if (available.length === 0) return Promise.resolve(undefined);
  const availableIds = new Set(available.map(({ id }) => id));
  const choices = candidates.map(({ id, command, description }) => {
    const isInstalled = availableIds.has(id);
    return {
      name: id,
      value: id,
      description: `${description} · ${command}`,
      checked: isInstalled,
      disabled: isInstalled ? false : "not installed",
    };
  });
  return promptCheckbox("Which linters should run?", choices, true);
};

const parseNativeArgs = (answer: string): string[] => {
  const trimmed = answer.trim();
  if (trimmed === "") return [];
  return trimmed.split(/\s+/);
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
): Source => {
  const configuredLanguages = Object.fromEntries(
    languages.map((language) => [language, {} as JsonObject]),
  );
  return {
    path: "interactive",
    root,
    config: {
      languages: configuredLanguages,
      linters,
      updates: {
        enabled: true,
        manager: "brew",
        prompt: true,
      },
    },
  };
};

export const saveSetupSource = (source: Source): string => {
  const path = join(source.root, "legibility.json");
  writeFileSync(path, `${JSON.stringify(source.config, null, 2)}\n`, "utf8");
  return path;
};

const section = (title: string, lines: string[]): string =>
  [`${ANSI.BOLD}${ANSI.CYAN}${title}${ANSI.RESET}`].concat(lines).join("\n");

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

export const formatStyleguide = (): string => {
  const languageFrame = formatCheckboxDemo(
    "Which languages should Legibility check?",
    STYLEGUIDE_LANGUAGE_CHOICES,
  );
  const linterFrame = formatCheckboxDemo("Which linters should run?", STYLEGUIDE_LINTER_CHOICES);
  const cancellationLine = `${ANSI.RED}${STYLEGUIDE_CANCEL_MARK}${ANSI.RESET} Which linters should run?: cancelled`;
  return [
    `${ANSI.BOLD}${ANSI.CYAN}Legibility CLI Styleguide${ANSI.RESET}`,
    "A visual tour of the guided project setup. No files are written and no linters run.",
    `${ANSI.GRAY}────────────────────────────────────────────────────────────────────${ANSI.RESET}`,
    section("01  Welcome", [formatConfirmDemo("Set up Legibility for this project?", false)]),
    section("02  Detect languages", languageFrame),
    section("03  Select available linters", linterFrame),
    section("04  Configure native arguments", [
      formatInputDemo("Arguments for oxlint-plugin-legibility (optional)", "--deny-warnings"),
    ]),
    section("05  Review and save", reviewLines()),
    section("06  Preview commands", commandLines()),
    section("07  Approve execution", [formatConfirmDemo("Run these linters now?", false)]),
    section("08  Cancellation", [cancellationLine]),
    `${ANSI.GRAY}────────────────────────────────────────────────────────────────────${ANSI.RESET}`,
    `${ANSI.GRAY}Keyboard: ↑/↓ navigate · Space toggle · a all · n none · Enter confirm · Esc cancel${ANSI.RESET}`,
  ].join("\n\n");
};

export { commandLines, reviewLines };
