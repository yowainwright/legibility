import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
import { readSource, runLinters } from "../../src/cli/index.ts";
import type { Options, Source } from "../../src/cli/types.ts";

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

const createFakeBrew = (root: string): void => {
  const directory = join(root, "node_modules", ".bin");
  const path = join(directory, "brew");
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path,
    [
      "#!/bin/sh",
      'printf "%s\\n" "$*" >> "$LEGIBILITY_TEST_BREW_LOG"',
      'if [ "$1" = "outdated" ]; then',
      '  printf \'{"formulae":[{"name":"fs-lint","installed_versions":["0.2.1"],"current_version":"0.2.2","pinned":false}]}\'',
      "fi",
      "exit 0",
      "",
    ].join("\n"),
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

test("handles update without a project configuration", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const cliPath = join(process.cwd(), "bin", "js", "legibility");
  const result = spawnSync(process.execPath, ["--experimental-strip-types", cliPath, "update"], {
    cwd: fixture.root,
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.equal(result.status, 2);
  assert.match(output, /legibility update requires an interactive terminal/);
  assert.doesNotMatch(output, /configuration must be an object/);
});

test("runs the packaged JavaScript entrypoint for help and version", () => {
  const cliPath = join(process.cwd(), "bin", "js", "legibility");
  const help = spawnSync(process.execPath, ["--experimental-strip-types", cliPath, "--help"], {
    encoding: "utf8",
  });
  const version = spawnSync(
    process.execPath,
    ["--experimental-strip-types", cliPath, "--version"],
    {
      encoding: "utf8",
    },
  );

  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: legibility/);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /legibility version \d+\.\d+\.\d+/);
});

test("rejects ambiguous parent and child configurations", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const child = join(fixture.root, "packages", "app");
  mkdirSync(child, { recursive: true });
  writeConfig(fixture.root, { linters: { "fs-lint": { enabled: true, args: [] } } });
  writeFileSync(
    join(child, "package.json"),
    JSON.stringify({ legibility: { linters: { "src-lint": { enabled: true, args: [] } } } }),
  );
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", join(process.cwd(), "bin", "js", "legibility"), "--dry-run"],
    { cwd: child, encoding: "utf8" },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.equal(result.status, 2);
  assert.match(output, /multiple Legibility configurations found/);
});

test("updates configured Homebrew linters without prompting when policy allows it", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  createFakeBrew(fixture.root);
  const logPath = join(fixture.root, "brew-calls.log");
  const configPath = writeConfig(fixture.root, {
    updates: { enabled: true, manager: "brew", prompt: false },
    linters: { "fs-lint": { enabled: true, args: [] } },
  });
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      join(process.cwd(), "bin", "js", "legibility"),
      "update",
      "--config",
      configPath,
    ],
    {
      cwd: fixture.root,
      encoding: "utf8",
      env: Object.assign({}, process.env, { LEGIBILITY_TEST_BREW_LOG: logPath }),
    },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(
    readFileSync(logPath, "utf8"),
    "update\noutdated --json=v2 --formula\nupgrade fs-lint\n",
  );
});

test("checks for updates before a normal configured run", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  createFakeBrew(fixture.root);
  createFakeLinter(fixture.root, "fs-lint");
  const brewLogPath = join(fixture.root, "brew-calls.log");
  const linterLogPath = join(fixture.root, "linter-calls.log");
  const configPath = writeConfig(fixture.root, {
    updates: { enabled: true, manager: "brew", prompt: false },
    linters: { "fs-lint": { enabled: true, args: ["check"] } },
  });
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      join(process.cwd(), "bin", "js", "legibility"),
      "--config",
      configPath,
    ],
    {
      cwd: fixture.root,
      encoding: "utf8",
      env: Object.assign({}, process.env, {
        LEGIBILITY_TEST_BREW_LOG: brewLogPath,
        LEGIBILITY_TEST_LOG: linterLogPath,
      }),
    },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(
    readFileSync(brewLogPath, "utf8"),
    "update\noutdated --json=v2 --formula\nupgrade fs-lint\n",
  );
  assert.equal(readFileSync(linterLogPath, "utf8"), "check\n");
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
