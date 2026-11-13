import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import test, { type TestContext } from "node:test";
import { fileURLToPath } from "node:url";

const project = process.env.LEGIBILITY_SANDBOX_PROJECT ?? "";
const binary = process.env.LEGIBILITY_SANDBOX_CLI ?? "legibility";
const fixtures = fileURLToPath(new URL("./fixtures/typescript/", import.meta.url));
const scenarioFiles = ["legibility.json", "oxlint.config.ts", "src/index.ts"];
const projectBin = join(project, "node_modules", ".bin");
const environment = Object.assign({}, process.env, {
  PATH: [projectBin, process.env.PATH].filter(Boolean).join(delimiter),
});

test("sandbox: real native lint agrees with direct Oxlint", (t) => {
  prepareScenario(t);
  const direct = runSandbox("oxlint", ["."]);
  const wrapped = runSandbox(binary, []);
  assert.equal(direct.status, 1, direct.stderr);
  assert.equal(wrapped.status, direct.status, wrapped.stderr);
  assert.match(wrapped.stdout, /hoist-if-operators/);
  assert.equal(runSandbox(binary, ["--help"]).status, 0);
  assert.equal(runSandbox(binary, ["--dry-run"]).status, 0);
});

test("sandbox: default edit feedback and blocking completion", (t) => {
  prepareScenario(t);
  const edit = replayHook("PostToolUse");
  assert.equal(edit.decision, undefined);
  assert.match(edit.hookSpecificOutput.additionalContext, /hoist-if-operators/);
  const stop = replayHook("Stop");
  assert.equal(stop.decision, "block");
  assert.match(stop.reason, /hoist-if-operators/);
});

test("sandbox: rule policy overrides its linter and project", (t) => {
  prepareScenario(t);
  const config = readScenarioConfig();
  const linter = config.linters["oxlint-plugin-legibility"];
  linter.hooks = { blocking: true };
  linter.rules = { LEG002: { hooks: { Stop: { blocking: false } } } };
  saveScenarioConfig(config);
  const edit = replayHook("PostToolUse");
  const stop = replayHook("Stop");
  assert.equal(edit.decision, "block");
  assert.equal(stop.decision, undefined);
  assert.match(stop.systemMessage, /hoist-if-operators/);
});

test("sandbox: disabled rule and clean source are silent", (t) => {
  prepareScenario(t);
  const config = readScenarioConfig();
  config.linters["oxlint-plugin-legibility"].rules = { LEG002: { hooks: { enabled: false } } };
  saveScenarioConfig(config);
  assert.deepEqual(replayHook("Stop"), {});
  config.linters["oxlint-plugin-legibility"].rules = {};
  saveScenarioConfig(config);
  writeFileSync(join(project, "src/index.ts"), "export const count = 1;\n");
  assert.equal(runSandbox(binary, []).status, 0);
  assert.deepEqual(replayHook("Stop"), {});
});

const prepareScenario = (t: TestContext): void => {
  assert.ok(project, "Set LEGIBILITY_SANDBOX_PROJECT to a prepared TypeScript sandbox.");
  const manifest = JSON.parse(readFileSync(join(project, "package.json"), "utf8"));
  assert.equal(
    manifest.name,
    "legibility-typescript-walkthrough",
    "Refusing to alter another project.",
  );
  const originals = scenarioFiles.map((name) => ({
    name,
    content: readFileSync(join(project, name)),
  }));
  t.after(() =>
    originals.forEach(({ name, content }) => writeFileSync(join(project, name), content)),
  );
  scenarioFiles.forEach((name) => {
    const content = readFileSync(join(fixtures, name));
    writeFileSync(join(project, name), content);
  });
};

const replayHook = (event: string) => {
  const payload = { cwd: project, hook_event_name: event, stop_hook_active: true };
  const result = runSandbox(binary, ["hook"], JSON.stringify(payload));
  assert.equal(result.status, 0, result.stderr);
  const response = JSON.parse(result.stdout);
  return response;
};

const runSandbox = (command: string, args: string[], input?: string) =>
  spawnSync(command, args, {
    cwd: project,
    encoding: "utf8",
    env: environment,
    input,
    timeout: 30000,
  });

const readScenarioConfig = () => JSON.parse(readFileSync(join(project, "legibility.json"), "utf8"));

const saveScenarioConfig = (config: unknown): void => {
  const content = `${JSON.stringify(config, null, 2)}\n`;
  writeFileSync(join(project, "legibility.json"), content);
};
