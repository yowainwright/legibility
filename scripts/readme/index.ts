import { readFileSync, writeFileSync } from "node:fs";
import { format } from "oxfmt";
import { LANGUAGE_DEFINITIONS, LINTER_DEFINITIONS } from "../../src/cli/constants.ts";
import type { LinterDefinition } from "../../src/cli/types.ts";

const README_FILE = "README.md";

const START_MARKER = "<!-- generated:available-tools:start -->";

const END_MARKER = "<!-- generated:available-tools:end -->";

const languageLabel = (id: string): string => {
  if (id === "*") return "All detected languages";
  const language = LANGUAGE_DEFINITIONS.find((definition) => definition.id === id);
  return language?.label ?? id;
};

const renderToolRow = ({ id, command, languages, description }: LinterDefinition): string => {
  const label = `\`${id}\``;
  const link = `[${label}](#${id})`;
  return `| ${link} | \`${command}\` | ${renderLanguages(languages)} | ${description} |`;
};

const renderLanguages = (ids: readonly string[]): string => ids.map(languageLabel).join(", ");

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const generateReadme = async (checkOnly: boolean): Promise<void> => {
  const source = readFileSync(README_FILE, "utf8");
  const updated = replaceToolsTable(source);
  const formatted = await formatReadme(updated);
  const current = checkOnly ? await formatReadme(source) : source;
  if (formatted === current) return;
  if (checkOnly) {
    throw new Error("README tools table is out of date; run pnpm run readme:generate");
  }
  writeFileSync(README_FILE, formatted);
};

const formatReadme = async (readme: string): Promise<string> => {
  const result = await format(README_FILE, readme);
  if (result.errors.length > 0) {
    throw new Error(result.errors.map(({ message }) => message).join("; "));
  }
  return result.code;
};

const replaceToolsTable = (readme: string): string => {
  const pattern =
    /<!-- generated:available-tools:start -->[\s\S]*?<!-- generated:available-tools:end -->/;
  const match = readme.match(pattern);
  const missingMarkers = match === null || match.index === undefined;
  if (missingMarkers) throw new Error("README is missing the available tools markers");
  const generatedBlock = `${START_MARKER}\n\n${renderToolsTable()}\n\n${END_MARKER}`;
  const before = readme.slice(0, match.index);
  const after = readme.slice(match.index + match[0].length);
  return `${before}${generatedBlock}${after}`;
};

const renderToolsTable = (): string =>
  [
    "## Available linters and plugins",
    "",
    renderToolTable("Linters", "standalone"),
    "",
    renderToolTable("Plugins", "hosted"),
  ].join("\n");

const renderToolTable = (title: string, kind: LinterDefinition["kind"]): string => {
  const definitions = LINTER_DEFINITIONS.filter((definition) => definition.kind === kind);
  const rows = definitions.map(renderToolRow);
  return [
    `### ${title}`,
    "",
    "| Name | Command | Languages | What it checks |",
    "| --- | --- | --- | --- |",
  ]
    .concat(rows)
    .join("\n");
};

try {
  await generateReadme(process.argv.includes("--check"));
} catch (error: unknown) {
  process.stderr.write(`${errorMessage(error)}\n`);
  process.exitCode = 1;
}
