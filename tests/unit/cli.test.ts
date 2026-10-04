import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";
import {
  detectLanguages,
  homebrewLinterUpdates,
  parseHomebrewOutdated,
  parseOptions,
} from "../../src/cli/index.ts";
import { LINTER_DEFINITIONS, STYLEGUIDE_TOUR_CHOICES } from "../../src/cli/constants.ts";
import { promptCheckbox, setPromptLine } from "../../src/cli/prompts/index.ts";
import { promptForLinterInstall, promptForLinters } from "../../src/cli/utils.ts";
import type { JsonObject } from "../../src/cli/types.ts";

const temporaryDirectory = (): string => {
  const directory = join(process.cwd(), "tmp");
  mkdirSync(directory, { recursive: true });
  return directory;
};

const homebrewPayload = {
  formulae: [
    {
      name: "fs-lint",
      installed_versions: ["0.2.1"],
      current_version: "0.2.2",
      pinned: false,
    },
    {
      name: "src-lint",
      installed_versions: ["0.1.0"],
      current_version: "0.1.1",
      pinned: true,
    },
  ],
};

const parseLinterOptions = () =>
  parseOptions([
    "--linter",
    "fs-lint",
    "--linter",
    "src-lint",
    "--dry-run",
    "--",
    "--format",
    "json",
  ]);

const parseRuleOptions = () => ({
  search: parseOptions(["rules", "--search", "function length"]),
  detail: parseOptions([
    "rule",
    "LEG038",
    "--language",
    "javascript",
    "--plugin",
    "oxlint",
    "--enable",
    "--dry-run",
  ]),
});

const expectedHomebrewOutdated = [
  {
    name: "fs-lint",
    installedVersions: ["0.2.1"],
    currentVersion: "0.2.2",
    pinned: false,
  },
  {
    name: "src-lint",
    installedVersions: ["0.1.0"],
    currentVersion: "0.1.1",
    pinned: true,
  },
];

const expectedHomebrewLinterUpdates = [
  {
    name: "fs-lint",
    installedVersions: ["0.2.1"],
    currentVersion: "0.2.2",
    pinned: false,
    id: "fs-lint",
    formula: "fs-lint",
  },
];

test("parses CLI options separately from native linter arguments", () => {
  assert.deepEqual(parseLinterOptions(), {
    configPath: undefined,
    dryRun: true,
    help: false,
    linters: ["fs-lint", "src-lint"],
    nativeArgs: ["--format", "json"],
    styleguide: false,
    update: false,
    version: false,
    verbose: false,
  });
});

test("parses rule search and language/plugin selection", () => {
  const { search, detail } = parseRuleOptions();
  assert.equal(search.rules, true);
  assert.equal(search.search, "function length");
  assert.equal(detail.rule, true);
  assert.equal(detail.ruleId, "LEG038");
  assert.equal(detail.language, "javascript");
  assert.equal(detail.plugin, "oxlint");
  assert.equal(detail.enable, true);
  assert.equal(detail.dryRun, true);
});

test("parses the Homebrew update command", () => {
  const parsed = parseOptions(["update", "--linter", "fs-lint"]);

  assert.equal(parsed.update, true);
  assert.deepEqual(parsed.linters, ["fs-lint"]);
});

test("includes the full setup flow in the styleguide", () => {
  const fullFlow = STYLEGUIDE_TOUR_CHOICES.find(({ value }) => value === "full");

  assert.deepEqual(fullFlow, {
    name: "Full setup flow",
    value: "full",
    description: "welcome through install, dry-run, and execution approval",
  });
});

test("parses Homebrew outdated formula data for supported linters", () => {
  assert.deepEqual(parseHomebrewOutdated(homebrewPayload), expectedHomebrewOutdated);
  assert.deepEqual(
    homebrewLinterUpdates(homebrewPayload, ["fs-lint", "src-lint"]),
    expectedHomebrewLinterUpdates,
  );
});

test("publishes every supported linter ID in the schema", () => {
  const schema = JSON.parse(
    readFileSync(join(process.cwd(), "src/schema.json"), "utf8"),
  ) as JsonObject;
  const properties = schema.properties as JsonObject;
  const linters = properties.linters as JsonObject;
  const propertyNames = linters.propertyNames as JsonObject;

  assert.equal(schema.additionalProperties, true);
  assert.deepEqual(
    propertyNames.enum,
    LINTER_DEFINITIONS.map(({ id }) => id),
  );
});

test("does not select disabled choices in an interactive checkbox", async (t) => {
  setPromptLine(
    () => Promise.resolve(""),
    () => Promise.resolve(" "),
  );
  t.after(() => setPromptLine(undefined));

  const selected = await promptCheckbox("Choose a disabled option", [
    { name: "Unavailable", value: "unavailable", disabled: "not installed" },
  ]);

  assert.deepEqual(selected, []);
});

test("preserves selections when Space and Enter arrive together", async (t) => {
  setPromptLine(
    () => Promise.resolve(""),
    () => Promise.resolve(" \r"),
  );
  t.after(() => setPromptLine(undefined));

  const selected = await promptCheckbox("Choose languages", [
    { name: "C", value: "c" },
    { name: "TypeScript", value: "typescript", checked: true },
  ]);

  assert.deepEqual(selected, ["c", "typescript"]);
});

test("offers individual Homebrew installation choices for native linters", async (t) => {
  setPromptLine(
    () => Promise.resolve("n"),
    () => Promise.resolve(" \r"),
  );
  t.after(() => setPromptLine(undefined));

  const selected = await promptForLinterInstall(
    ["typescript"],
    "fixture",
    (command) => command === "brew",
  );

  assert.deepEqual(selected, ["src-lint", "struct-lint"]);
});

test("filters linter choices by language and availability", async (t) => {
  setPromptLine(() => Promise.resolve("4"));
  t.after(() => setPromptLine(undefined));

  const selected = await promptForLinters(
    ["go"],
    "fixture",
    (command) => command === "golangci-lint",
  );

  assert.deepEqual(selected, ["golangci-lint-legibility"]);
});

test("detects languages in stable order and ignores generated directories", (t) => {
  const root = mkdtempSync(join(temporaryDirectory(), "legibility-detect-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(join(root, "dist"), { recursive: true });
  mkdirSync(join(root, "node_modules", "package"), { recursive: true });
  writeFileSync(join(root, "src", "index.ts"), "export {};");
  writeFileSync(join(root, "src", "app.js"), "export {};");
  writeFileSync(join(root, "dist", "generated.py"), "print(1)");
  writeFileSync(join(root, "node_modules", "package", "ignored.go"), "package ignored");

  assert.deepEqual(detectLanguages(root), [
    { id: "javascript", label: "JavaScript", count: 1, files: ["src/app.js"] },
    { id: "typescript", label: "TypeScript", count: 1, files: ["src/index.ts"] },
  ]);
});
