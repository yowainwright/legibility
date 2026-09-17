import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import test from "node:test";
import { join } from "node:path";
import {
  homebrewLinterUpdates,
  parseHomebrewOutdated,
  parseOptions,
  readSource,
  runLinters,
} from "../src/cli/index.ts";
import { STYLEGUIDE_TOUR_CHOICES } from "../src/cli/constants.ts";
import type { JsonObject, Options, Source } from "../src/cli/types.ts";

const createFixture = (): { root: string; cleanup: () => void } => {
  const root = mkdtempSync(join(process.cwd(), "tmp", "legibility-test-"));
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
};

const writeConfig = (root: string, config: unknown): string => {
  const path = join(root, "legibility.json");
  writeFileSync(path, `${JSON.stringify(config)}\n`);
  return path;
};

const createFakeLinter = (root: string, name: string): void => {
  const directory = join(root, "node_modules", ".bin");
  const path = join(directory, name);
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path,
    '#!/bin/sh\nprintf "%s\\n" "$@" >> "$LEGIBILITY_TEST_LOG"\nexit "${LEGIBILITY_TEST_EXIT:-0}"\n',
  );
  chmodSync(path, 0o755);
};

const options = (overrides: Partial<Options> = {}): Options =>
  Object.assign(
    {
      dryRun: false,
      help: false,
      linters: [],
      nativeArgs: [],
      styleguide: false,
      update: false,
      version: false,
      verbose: false,
    },
    overrides,
  );

const source = (root: string, linters: Source["config"]["linters"]): Source => ({
  path: join(root, "legibility.json"),
  root,
  config: {
    languages: {},
    linters,
    updates: { enabled: true, manager: "brew", prompt: true },
  },
});

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

test("preserves unknown config and linter fields", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const configPath = writeConfig(fixture.root, {
    version: 1,
    futureProjectField: { enabled: true },
    languages: { typescript: { futureLanguageField: "kept" } },
    linters: {
      "future-linter": {
        enabled: true,
        args: [],
        futureLinterField: { mode: "kept" },
      },
    },
  });

  const loaded = readSource(configPath);

  assert.deepEqual(loaded.config.futureProjectField, { enabled: true });
  assert.deepEqual(loaded.config.languages.typescript.futureLanguageField, "kept");
  assert.deepEqual(loaded.config.linters["future-linter"].futureLinterField, { mode: "kept" });
});

test("defaults project updates to enabled Homebrew prompts", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const configPath = writeConfig(fixture.root, {
    linters: { "fs-lint": { enabled: true, args: [] } },
  });

  const loaded = readSource(configPath);

  assert.deepEqual(loaded.config.updates, {
    enabled: true,
    manager: "brew",
    prompt: true,
  });
});

test("preserves an explicit project update policy", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const configPath = writeConfig(fixture.root, {
    updates: { enabled: false, manager: "brew", prompt: false },
    linters: { "fs-lint": { enabled: true, args: [] } },
  });

  const loaded = readSource(configPath);

  assert.deepEqual(loaded.config.updates, {
    enabled: false,
    manager: "brew",
    prompt: false,
  });
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

test("runs a configured linter from the project bin and returns its exit code", async (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  createFakeLinter(fixture.root, "fs-lint");
  const logPath = join(fixture.root, "calls.log");
  const previousLog = process.env.LEGIBILITY_TEST_LOG;
  const previousExit = process.env.LEGIBILITY_TEST_EXIT;
  process.env.LEGIBILITY_TEST_LOG = logPath;
  process.env.LEGIBILITY_TEST_EXIT = "7";
  t.after(() => {
    if (previousLog === undefined) delete process.env.LEGIBILITY_TEST_LOG;
    else process.env.LEGIBILITY_TEST_LOG = previousLog;
    if (previousExit === undefined) delete process.env.LEGIBILITY_TEST_EXIT;
    else process.env.LEGIBILITY_TEST_EXIT = previousExit;
  });

  const exitCode = await runLinters(
    source(fixture.root, { "fs-lint": { enabled: true, args: ["check"] } }),
    options({ linters: ["fs-lint"], nativeArgs: ["--staged"] }),
  );

  assert.equal(exitCode, 7);
  assert.equal(readFileSync(logPath, "utf8"), "check\n--staged\n");
});

test("does not spawn a linter during a dry run", async (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  createFakeLinter(fixture.root, "fs-lint");
  const logPath = join(fixture.root, "calls.log");
  const previousLog = process.env.LEGIBILITY_TEST_LOG;
  process.env.LEGIBILITY_TEST_LOG = logPath;
  t.after(() => {
    if (previousLog === undefined) delete process.env.LEGIBILITY_TEST_LOG;
    else process.env.LEGIBILITY_TEST_LOG = previousLog;
  });

  const exitCode = await runLinters(
    source(fixture.root, { "fs-lint": { enabled: true, args: ["check"] } }),
    options({ linters: ["fs-lint"], dryRun: true }),
  );

  assert.equal(exitCode, 0);
  assert.equal(existsSync(logPath), false);
});

test("rejects native arguments when several linters are selected", async () => {
  const fixture = createFixture();

  await assert.rejects(
    runLinters(
      source(fixture.root, {
        "fs-lint": { enabled: true, args: [] },
        "src-lint": { enabled: true, args: [] },
      }),
      options({ nativeArgs: ["--format", "json"] }),
    ),
    /native arguments after -- require one selected linter/,
  );

  rmSync(fixture.root, { recursive: true, force: true });
});
