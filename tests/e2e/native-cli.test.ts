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
import { delimiter, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test, { type TestContext } from "node:test";
import { nativeReleaseOutputFile } from "../../scripts/build/utils.ts";

const nativeTestEnabled = process.env.LEGIBILITY_NATIVE_E2E === "1";
const nativeBinary = resolve(nativeReleaseOutputFile());
const expectBinary = ["/usr/bin/expect", "/usr/local/bin/expect", "/opt/homebrew/bin/expect"].find(
  existsSync,
);
const cleanPath = ["/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(delimiter);

const checkNativeSetup = (t: TestContext, withGit: boolean, path = cleanPath): void => {
  assert.ok(expectBinary, "expect is required for the native E2E test");
  assert.ok(existsSync(nativeBinary), "build the release binary before running native E2E");
  const root = createFixture(t, withGit);
  const logPath = join(root, "runs.log");
  assertNativeFlow(root, logPath, runNativeFlow(root, logPath, path));
};

const createFixture = (t: TestContext, withGit: boolean): string => {
  const root = mkdtempSync(join(tmpdir(), "legibility-native-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const binDirectory = join(root, "node_modules", ".bin");
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(binDirectory, { recursive: true });
  writeFileSync(join(root, "src", "index.ts"), "export const answer = 42;\n");
  ["eslint", "oxlint"].forEach((command) => writeFakeLinter(binDirectory, command));
  if (withGit) {
    const result = spawnSync("git", ["init", "--quiet", root], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  return root;
};

const writeFakeLinter = (directory: string, command: string): void => {
  const path = join(directory, command);
  const script = [
    "#!/bin/sh",
    'printf "ran:' + command + '\\n" >> "$LEGIBILITY_NATIVE_E2E_LOG"',
    'if [ "$#" -gt 0 ]; then',
    '  printf "arg:%s\\n" "$@" >> "$LEGIBILITY_NATIVE_E2E_LOG"',
    "fi",
    "exit 0",
    "",
  ].join("\n");
  writeFileSync(path, script);
  chmodSync(path, 0o755);
};

const assertNativeFlow = (
  root: string,
  logPath: string,
  result: ReturnType<typeof runNativeFlow>,
): void => {
  assertNativeOutput(logPath, result);
  assertNativeConfiguration(root);
};

const runNativeFlow = (
  root: string,
  logPath: string,
  path = cleanPath,
): ReturnType<typeof spawnSync> =>
  spawnSync(expectBinary as string, ["-c", expectScript()], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: Object.assign({}, process.env, {
      LEGIBILITY_NATIVE_E2E_BINARY: nativeBinary,
      LEGIBILITY_NATIVE_E2E_LOG: logPath,
      LEGIBILITY_NATIVE_E2E_ROOT: root,
      PATH: path,
    }),
    timeout: 20_000,
  });

const expectScript = (): string =>
  expectSetupPrompts()
    .concat(
      expectLanguagePrompt(),
      expectLinterSelection(),
      expectConfigurationPrompts(),
      expectExecution(),
    )
    .join("\n");

const expectSetupPrompts = (): string[] => [
  "set timeout 10",
  "cd $env(LEGIBILITY_NATIVE_E2E_ROOT)",
  "spawn -noecho $env(LEGIBILITY_NATIVE_E2E_BINARY)",
  'expect "Set up Legibility for this project?"',
  'send "y\\r"',
];

const expectLanguagePrompt = (): string[] => [
  'expect "Which languages should Legibility check?"',
  'send "\\r"',
];

const expectLinterSelection = (): string[] => [
  'expect "Which linters should run?"',
  'send "n"',
  'expect "0 selected"',
  'send " "',
  'expect "1 selected"',
  'send "\\033\\[B"',
  'expect "\\033\\[1m\\033\\[36m› □ oxlint-plugin-legibility"',
  'send " "',
  'expect "2 selected"',
  'send "\\r"',
];

const expectConfigurationPrompts = (): string[] => [
  'expect "Arguments for eslint-plugin-legibility"',
  'send "\\r"',
  'expect "Arguments for oxlint-plugin-legibility"',
  'send -- "--deny-warnings\\r"',
  'expect "Save this configuration"',
  'send "y\\r"',
  'expect "Run these linters now?"',
  'send "y\\r"',
];

const expectExecution = (): string[] => [
  'expect "ran:eslint"',
  'expect "ran:oxlint"',
  "expect eof",
  "set status [wait]",
  "exit [lindex $status 3]",
];

const assertNativeOutput = (logPath: string, result: ReturnType<typeof runNativeFlow>): void => {
  const output = (result.stdout ?? "") + "\n" + (result.stderr ?? "");
  assert.equal(result.status, 0, output);
  assert.match(output, /Selected: eslint-plugin-legibility, oxlint-plugin-legibility/);
  assert.match(output, /Preview — no linters will run/);
  assert.equal(readFileSync(logPath, "utf8"), "ran:eslint\nran:oxlint\narg:--deny-warnings\n");
};

const assertNativeConfiguration = (root: string): void => {
  const config = JSON.parse(readFileSync(join(root, "legibility.json"), "utf8")) as {
    languages: string[];
    linters: Record<string, { args: string[] }>;
  };
  assert.deepEqual(config.languages, ["typescript"]);
  assert.deepEqual(Object.keys(config.linters), [
    "eslint-plugin-legibility",
    "oxlint-plugin-legibility",
  ]);
  assert.deepEqual(config.linters["oxlint-plugin-legibility"]?.args, ["--deny-warnings"]);
};

test("runs native setup in a Git project", { skip: !nativeTestEnabled }, (t) => {
  checkNativeSetup(t, true);
});

test("runs native setup in a non-Git project", { skip: !nativeTestEnabled }, (t) => {
  checkNativeSetup(t, false);
});

test(
  "runs native setup with Git metadata but no Git executable",
  { skip: !nativeTestEnabled },
  (t) => {
    checkNativeSetup(t, true, join(tmpdir(), "legibility-no-git"));
  },
);
