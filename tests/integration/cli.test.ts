import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import test from "node:test";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";
import { parse as parseJsonc } from "jsonc-parser";
import { commandIsAvailable, readSource, runLinters } from "../../src/cli/index.ts";
import type { Options, Source } from "../../src/cli/types.ts";

const cliPath = join(process.cwd(), "bin", "js", "legibility");

const oxlintPath = join(process.cwd(), "node_modules", ".bin", "oxlint");

const enableRuleArgs = [
  "rule",
  "LEG038",
  "--language",
  "javascript",
  "--plugin",
  "oxlint",
  "--enable",
];

const checkHookPolicy = (hooks: unknown, event: string, expected: string | undefined): void => {
  const fixture = createFixture();
  try {
    createFakeLinter(fixture.root, "fs-lint");
    writeConfig(fixture.root, { hooks, linters: { "fs-lint": { args: ["check"] } } });
    const result = invokeHook(fixture.root, event);
    assert.equal(result.status, 0, result.stderr);
    const response = JSON.parse(result.stdout);
    assert.equal(response.decision, expected);
    if (expected) assert.match(response.reason, /fs-lint/);
    if (hooks === undefined) assert.deepEqual(response, {});
    const isAdvisory = event === "PostToolUse" && hooks;
    if (isAdvisory) assert.match(response.hookSpecificOutput.additionalContext, /fs-lint/);
  } finally {
    fixture.cleanup();
  }
};

test("hook defaults return Codex advisory feedback after edits", () => {
  checkHookPolicy({ enabled: true }, "PostToolUse", undefined);
});

test("hook defaults block completion on a native failure", () => {
  checkHookPolicy({ enabled: true }, "Stop", "block");
});

test("existing configurations do not run hooks", () => {
  checkHookPolicy(undefined, "Stop", undefined);
});

test("hook rejects invalid input with structured feedback", () => {
  const fixture = createFixture();
  try {
    const result = invokeHook(fixture.root, "PreToolUse");
    const response = JSON.parse(result.stdout);
    assert.equal(result.status, 0);
    assert.equal(response.decision, "block");
    assert.match(response.reason, /PostToolUse or Stop/);
  } finally {
    fixture.cleanup();
  }
});

const createHookRuleFixture = (hooks: unknown) => {
  const fixture = createFixture();
  const root = fixture.root;
  writeHookRuleSource(root);
  const linter = { args: ["index.js"], rules: { LEG038: { hooks } } };
  const config = { hooks: { enabled: true }, linters: { "oxlint-plugin-legibility": linter } };
  writeConfig(root, config);
  const directory = join(root, "node_modules", ".bin");
  mkdirSync(directory, { recursive: true });
  symlinkSync(oxlintPath, join(directory, "oxlint"));
  return fixture;
};

const createFixture = (): { root: string; cleanup: () => void } => {
  const root = mkdtempSync(join(tmpdir(), "legibility-test-"));
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

const invokeHook = (root: string, event: string, extra: Record<string, unknown> = {}) => {
  const payload = Object.assign({ cwd: root, hook_event_name: event }, extra);
  return spawnSync(process.execPath, [cliPath, "hook", "--config", join(root, "legibility.json")], {
    cwd: process.cwd(),
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: Object.assign({}, process.env, {
      LEGIBILITY_TEST_EXIT: "1",
      LEGIBILITY_TEST_LOG: join(root, "calls"),
    }),
  });
};

const writeHookRuleSource = (root: string): void => {
  writeFileSync(
    join(root, ".oxlintrc.json"),
    JSON.stringify({ rules: { "max-lines-per-function": ["error", { max: 2 }] } }),
  );
  writeFileSync(
    join(root, "index.js"),
    "function example() {\n  let count = 0;\n  count += 1;\n  return count;\n}\nexample();\n",
  );
};

test("rule hook policy isolates real Oxlint diagnostics from parent blocking policy", () => {
  const fixture = createHookRuleFixture({ Stop: { blocking: false } });
  try {
    const result = invokeHook(fixture.root, "Stop", { stop_hook_active: true });
    const response = JSON.parse(result.stdout);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(response.decision, undefined, result.stdout);
    assert.match(response.systemMessage, /max-lines-per-function/);
  } finally {
    fixture.cleanup();
  }
});

test("a specific rule can block edit feedback and stay blocking on repeated Stop", () => {
  const fixture = createHookRuleFixture({ PostToolUse: { blocking: true } });
  try {
    const edit = JSON.parse(invokeHook(fixture.root, "PostToolUse").stdout);
    const stop = JSON.parse(invokeHook(fixture.root, "Stop", { stop_hook_active: true }).stdout);
    assert.equal(edit.decision, "block");
    assert.equal(stop.decision, "block");
    assert.match(edit.reason, /max-lines-per-function/);
    assert.match(edit.reason, /Maximum allowed is 2/);
  } finally {
    fixture.cleanup();
  }
});

test("disabled rule feedback and clean source produce silent hook responses", () => {
  const fixture = createHookRuleFixture({ enabled: false });
  try {
    assert.deepEqual(JSON.parse(invokeHook(fixture.root, "Stop").stdout), {});
    writeFileSync(join(fixture.root, "index.js"), "export const count = 1;\n");
    assert.deepEqual(JSON.parse(invokeHook(fixture.root, "Stop").stdout), {});
  } finally {
    fixture.cleanup();
  }
});

test("a rule explicitly enables feedback below disabled parent hook policy", () => {
  const fixture = createHookRuleFixture({ enabled: true });
  try {
    const path = join(fixture.root, "legibility.json");
    const config = JSON.parse(readFileSync(path, "utf8"));
    config.hooks.enabled = false;
    writeConfig(fixture.root, config);
    const response = JSON.parse(invokeHook(fixture.root, "Stop").stdout);
    assert.equal(response.decision, "block");
    assert.match(response.reason, /max-lines-per-function/);
  } finally {
    fixture.cleanup();
  }
});

test("linter event policy overrides the project default", () => {
  const fixture = createHookRuleFixture({});
  try {
    const path = join(fixture.root, "legibility.json");
    const config = JSON.parse(readFileSync(path, "utf8"));
    config.linters["oxlint-plugin-legibility"].hooks = { Stop: { blocking: false } };
    writeConfig(fixture.root, config);
    const response = JSON.parse(invokeHook(fixture.root, "Stop").stdout);
    assert.equal(response.decision, undefined);
    assert.match(response.systemMessage, /max-lines-per-function/);
  } finally {
    fixture.cleanup();
  }
});

test("invalid hook policy produces an actionable blocking error", () => {
  const fixture = createHookRuleFixture({ enabled: "yes" });
  try {
    const response = JSON.parse(invokeHook(fixture.root, "PostToolUse").stdout);
    assert.equal(response.decision, "block");
    assert.match(response.reason, /rules.LEG038.hooks.enabled must be a boolean/);
  } finally {
    fixture.cleanup();
  }
});

const createFakeBrew = (root: string): string => {
  const directory = join(root, "fake-bin");
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
  return directory;
};

const testPath = (directory: string): string =>
  [directory, process.env.PATH].filter(Boolean).join(delimiter);

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

const runConfiguredCli = (root: string, args: string[], environment: Record<string, string>) =>
  spawnSync(process.execPath, ["--experimental-strip-types", cliPath].concat(args), {
    cwd: root,
    encoding: "utf8",
    env: Object.assign({}, process.env, environment),
  });

const assertRuleCatalogAccess = (root: string): void => {
  assertRuleSearchOutput(root);
  assertRuleDetailsOutput(root);
  assert.equal(existsSync(join(root, "legibility.json")), false);
};

const assertRuleDetailsOutput = (root: string): void => {
  const details = runCli(root, [
    "rule",
    "LEG038",
    "--language",
    "javascript",
    "--plugin",
    "oxlint",
  ]);
  const detailOutput = `${details.stdout}\n${details.stderr}`;
  assert.equal(details.status, 0, detailOutput);
  assert.match(detailOutput, /Project: disabled/);
  assert.ok(
    detailOutput.includes(
      "Docs: https://github.com/yowainwright/legibility/blob/main/docs/rules.md#leg038-javascript-typescript-oxlint",
    ),
  );
};

const assertRuleSearchOutput = (root: string): void => {
  const search = runCli(root, ["rules", "--search", "function length"]);
  const searchOutput = `${search.stdout}\n${search.stderr}`;
  assert.equal(search.status, 0, searchOutput);
  assert.match(searchOutput, /2 of 62 rules match/);
  assert.ok(
    searchOutput.includes(
      "Details: https://github.com/yowainwright/legibility/blob/main/docs/rules.md#leg038",
    ),
  );
};

const assertRuleEnableDryRun = (root: string, configPath: string, original: string): void => {
  const dryRun = runCli(root, enableRuleArgs.concat("--dry-run"));
  const dryRunOutput = `${dryRun.stdout}\n${dryRun.stderr}`;
  assert.equal(dryRun.status, 0, dryRunOutput);
  assert.match(dryRunOutput, /Would set \.oxlintrc\.jsonc rules\.max-lines-per-function/);
  assert.equal(readFileSync(configPath, "utf8"), original);
};

const assertRuleEnableSettings = (configPath: string): string => {
  const updated = readFileSync(configPath, "utf8");
  const configuration = parseJsonc(updated) as { rules: Record<string, unknown> };
  assert.match(updated, /\/\/ keep this comment/);
  assert.equal(configuration.rules["no-debugger"], "warn");
  assert.deepEqual(configuration.rules["max-lines-per-function"], [
    "warn",
    { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
  ]);
  return updated;
};

const assertRuleLineBudget = (root: string): void => {
  const atLimit = runNativeLineBudget(root, 40);
  assert.equal(atLimit.status, 0, `${atLimit.stdout}\n${atLimit.stderr}`);
  const overLimit = runNativeLineBudget(root, 41);
  const overLimitOutput = `${overLimit.stdout}\n${overLimit.stderr}`;
  assert.equal(overLimit.status, 1, overLimitOutput);
  assert.match(overLimitOutput, /max-lines-per-function/);
};

const runNativeLineBudget = (root: string, lineCount: number) => {
  const functionBody = Array.from({ length: lineCount - 2 }, () => "  void 1;").join("\n");
  const sourcePath = join(root, "src", "index.js");
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(sourcePath, `function measure() {\n${functionBody}\n}\nmeasure();\n`);
  return spawnSync(oxlintPath, ["--deny", "max-lines-per-function", "src/index.js"], {
    cwd: root,
    encoding: "utf8",
  });
};

const assertRuleEnableIsIdempotent = (root: string, configPath: string, updated: string): void => {
  const repeated = runCli(root, enableRuleArgs);
  assert.equal(repeated.status, 0, `${repeated.stdout}\n${repeated.stderr}`);
  assert.equal(readFileSync(configPath, "utf8"), updated);
};

const runCli = (root: string, args: string[]) => {
  const cliArguments = ["--experimental-strip-types", cliPath].concat(args);
  return spawnSync(process.execPath, cliArguments, { cwd: root, encoding: "utf8" });
};

const restoreEnvironment = (previousValues: Record<string, string | undefined>): void => {
  Object.entries(previousValues).forEach(([name, value]) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  });
};

const assertConfiguredRun = (
  result: ReturnType<typeof spawnSync>,
  brewLogPath: string,
  linterLogPath: string,
): void => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(
    readFileSync(brewLogPath, "utf8"),
    "update\noutdated --json=v2 --formula\nupgrade fs-lint\n",
  );
  assert.equal(readFileSync(linterLogPath, "utf8"), "check\n");
};

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
  assert.deepEqual(loaded.config.languages, { typescript: { futureLanguageField: "kept" } });
  assert.deepEqual(loaded.config.linters["future-linter"].futureLinterField, { mode: "kept" });
});

test("reads language lists and allows omitted languages", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const configPath = writeConfig(fixture.root, {
    languages: ["typescript"],
    linters: {},
  });

  assert.deepEqual(readSource(configPath).config.languages, ["typescript"]);
  writeConfig(fixture.root, { languages: [], linters: {} });
  assert.deepEqual(readSource(configPath).config.languages, []);
  writeConfig(fixture.root, { linters: {} });
  assert.equal(readSource(configPath).config.languages, undefined);
  writeConfig(fixture.root, { languages: ["typescript", false], linters: {} });
  assert.throws(() => readSource(configPath), /languages must be an array of strings or an object/);
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

test("does not resolve Homebrew from the project bin", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  createFakeLinter(fixture.root, "brew");
  const emptyPath = join(fixture.root, "empty-bin");
  mkdirSync(emptyPath, { recursive: true });
  const previousPath = process.env.PATH;
  process.env.PATH = emptyPath;
  t.after(() => {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
  });

  assert.equal(commandIsAvailable("brew", fixture.root), false);
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

test("searches and inspects rules without starting project setup", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  assertRuleCatalogAccess(fixture.root);
});

test("inspects namespaced Legibility Oxlint rules", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  writeFileSync(
    join(fixture.root, ".oxlintrc.json"),
    JSON.stringify({ rules: { "legibility/require-filename-matches-dirname": "warn" } }),
  );

  const result = runCli(fixture.root, [
    "rule",
    "LEG025",
    "--language",
    "javascript",
    "--plugin",
    "oxlint",
  ]);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /native rule: legibility\/require-filename-matches-dirname/);
  assert.match(result.stdout, /Project: enabled \(native rule setting\)/);
});

test("enables LEG038 in JSONC and its settings change Oxlint's line budget", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const configPath = join(fixture.root, ".oxlintrc.jsonc");
  const original =
    '{\n  // keep this comment\n  "rules": {\n    "max-lines-per-function": "off",\n    "no-debugger": "warn"\n  }\n}\n';
  writeFileSync(configPath, original);
  assertRuleEnableDryRun(fixture.root, configPath, original);
  const enabled = runCli(fixture.root, enableRuleArgs);
  assert.equal(enabled.status, 0, `${enabled.stdout}\n${enabled.stderr}`);
  const updated = assertRuleEnableSettings(configPath);
  assertRuleLineBudget(fixture.root);
  assertRuleEnableIsIdempotent(fixture.root, configPath, updated);
});

test("preserves saved Oxlint rule options when enabling a disabled rule", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const configPath = join(fixture.root, ".oxlintrc.json");
  writeFileSync(
    configPath,
    JSON.stringify({ rules: { "max-lines-per-function": ["off", { max: 80 }] } }),
  );

  const enabled = runCli(fixture.root, enableRuleArgs);
  assert.equal(enabled.status, 0, `${enabled.stdout}\n${enabled.stderr}`);
  const configuration = parseJsonc(readFileSync(configPath, "utf8")) as {
    rules: Record<string, unknown>;
  };
  assert.deepEqual(configuration.rules["max-lines-per-function"], ["warn", { max: 80 }]);
});

test("refuses to enable a rule through file overrides", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const configPath = join(fixture.root, ".oxlintrc.json");
  const original = JSON.stringify({ overrides: [{ files: ["src/**"], rules: {} }], rules: {} });
  writeFileSync(configPath, original);
  const result = runCli(fixture.root, enableRuleArgs);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 2);
  assert.match(output, /does not edit Oxlint configs with extends or file overrides/);
  assert.equal(readFileSync(configPath, "utf8"), original);
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
  const brewDirectory = createFakeBrew(fixture.root);
  const logPath = join(fixture.root, "brew-calls.log");
  const configPath = writeConfig(fixture.root, {
    updates: { enabled: true, manager: "brew", prompt: false },
    linters: { "fs-lint": { enabled: true, args: [] } },
  });
  const result = runConfiguredCli(fixture.root, ["update", "--config", configPath], {
    LEGIBILITY_TEST_BREW_LOG: logPath,
    PATH: testPath(brewDirectory),
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(
    readFileSync(logPath, "utf8"),
    "update\noutdated --json=v2 --formula\nupgrade fs-lint\n",
  );
});

test("checks for updates before a normal configured run", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const brewDirectory = createFakeBrew(fixture.root);
  createFakeLinter(fixture.root, "fs-lint");
  const brewLogPath = join(fixture.root, "brew-calls.log");
  const linterLogPath = join(fixture.root, "linter-calls.log");
  const configPath = writeConfig(fixture.root, {
    updates: { enabled: true, manager: "brew", prompt: false },
    linters: { "fs-lint": { enabled: true, args: ["check"] } },
  });
  const result = runConfiguredCli(fixture.root, ["--config", configPath], {
    LEGIBILITY_TEST_BREW_LOG: brewLogPath,
    LEGIBILITY_TEST_LOG: linterLogPath,
    PATH: testPath(brewDirectory),
  });
  assertConfiguredRun(result, brewLogPath, linterLogPath);
});

test("runs a configured linter from the project bin and returns its exit code", async (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  createFakeLinter(fixture.root, "fs-lint");
  const logPath = join(fixture.root, "calls.log");
  const previousEnvironment = {
    LEGIBILITY_TEST_LOG: process.env.LEGIBILITY_TEST_LOG,
    LEGIBILITY_TEST_EXIT: process.env.LEGIBILITY_TEST_EXIT,
  };
  process.env.LEGIBILITY_TEST_LOG = logPath;
  process.env.LEGIBILITY_TEST_EXIT = "7";
  t.after(() => restoreEnvironment(previousEnvironment));

  const exitCode = await runLinters(
    source(fixture.root, { "fs-lint": { enabled: true, args: ["check"] } }),
    options({ linters: ["fs-lint"], nativeArgs: ["--staged"] }),
  );

  assert.equal(exitCode, 7);
  assert.equal(readFileSync(logPath, "utf8"), "check\n--staged\n");
});

test("runs legacy Go configs through golangci-lint with saved arguments", async (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  createFakeLinter(fixture.root, "golangci-lint");
  const logPath = join(fixture.root, "calls.log");
  const previousEnvironment = { LEGIBILITY_TEST_LOG: process.env.LEGIBILITY_TEST_LOG };
  process.env.LEGIBILITY_TEST_LOG = logPath;
  t.after(() => restoreEnvironment(previousEnvironment));
  const configPath = writeConfig(fixture.root, {
    linters: {
      "golangci-lint-legibility": { enabled: true, args: ["run", "./..."] },
    },
  });

  const exitCode = await runLinters(readSource(configPath), options());

  assert.equal(exitCode, 0);
  assert.equal(readFileSync(logPath, "utf8"), "run\n./...\n");
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
