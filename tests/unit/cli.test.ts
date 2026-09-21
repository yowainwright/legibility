import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";
import { homebrewLinterUpdates, parseHomebrewOutdated, parseOptions } from "../../src/cli/index.ts";
import { STYLEGUIDE_TOUR_CHOICES } from "../../src/cli/constants.ts";
import { promptCheckbox, setPromptLine } from "../../src/cli/prompts/index.ts";
import type { JsonObject } from "../../src/cli/types.ts";

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

test("parses CLI options separately from native linter arguments", () => {
  const parsed = parseOptions([
    "--linter",
    "fs-lint",
    "--linter",
    "src-lint",
    "--dry-run",
    "--",
    "--format",
    "json",
  ]);

  assert.deepEqual(parsed, {
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
    description: "welcome through dry-run and execution approval",
  });
});

test("parses Homebrew outdated formula data for supported linters", () => {
  assert.deepEqual(parseHomebrewOutdated(homebrewPayload), [
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
  ]);
  assert.deepEqual(homebrewLinterUpdates(homebrewPayload, ["fs-lint", "src-lint"]), [
    {
      name: "fs-lint",
      installedVersions: ["0.2.1"],
      currentVersion: "0.2.2",
      pinned: false,
      id: "fs-lint",
      formula: "fs-lint",
    },
  ]);
});

test("keeps linter IDs open in the published schema", () => {
  const schema = JSON.parse(
    readFileSync(join(process.cwd(), "src/schema.json"), "utf8"),
  ) as JsonObject;
  const properties = schema.properties as JsonObject;
  const linters = properties.linters as JsonObject;

  assert.equal(schema.additionalProperties, true);
  assert.equal(linters.propertyNames, undefined);
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
