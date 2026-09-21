import { chmodSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import packageJson from "../../package.json" with { type: "json" };
import { logger as createLogger } from "../../src/obs/index.ts";
import {
  BIN_BUNDLE_BANNER,
  BIN_BUNDLE_FILE,
  BIN_ENTRY_FILE,
  BIN_OUTPUT_FILE,
  BIN_RUNTIME_DIR,
  BIN_RUNTIME_ENTRY_FILE,
  BIN_RUNTIME_PACKAGE_FILE,
  BIN_RUNTIME_TYPES_FILE,
  BUILD_SCRIPT_LABEL,
  CLI_ENTRY_FILE,
  CLI_ONLY_FLAG,
  CLI_OUTPUT_DIR,
  NATIVE_RELEASE_FLAG,
  RUNTIME_PACKAGE_NAME,
  nativeReleaseOutputFile,
} from "./constants.ts";
import type { RuntimePackageManifest } from "./types.ts";
import { runCommand } from "./utils.ts";

const log = createLogger({ file: BUILD_SCRIPT_LABEL, isLogging: true });

const runBuildCommand = (command: string, args: readonly string[]): void =>
  runCommand(command, args, log);

const renderRuntimeEntry = (): string =>
  [
    'import { runWithPrompt } from "../src/cli/index.ts";',
    "",
    "export { runWithPrompt };",
    "",
  ].join("\n");

const renderCliEntry = (): string =>
  [
    "#!/usr/bin/env node",
    "",
    'import { run } from "../src/cli/index.ts";',
    "",
    "const exitCode = await run(process.argv.slice(2));",
    "process.exit(exitCode);",
    "",
  ].join("\n");

const renderPromptLine = (): string =>
  [
    "const promptLine = (message: string): Promise<string> =>",
    "  new Promise((resolve) => {",
    "    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });",
    "    rl.question(message, (answer) => {",
    "      rl.close();",
    "      resolve(answer);",
    "    });",
    "  });",
  ].join("\n");

const renderPromptKey = (): string =>
  [
    "",
    "const readKey = (): Promise<string> =>",
    "  new Promise((resolve) => {",
    "    process.stdin.setRawMode(true);",
    '    process.stdin.once("data", (chunk: Uint8Array) => {',
    "      process.stdin.setRawMode(false);",
    "      resolve(new TextDecoder().decode(chunk));",
    "    });",
    "  });",
  ].join("\n");

const renderCommandRunner = (): string =>
  [
    "",
    "const runCommand = (command: string, args: string[], root: string): Promise<number> =>",
    "  new Promise((resolve) => {",
    '    const localCommand = join(root, "node_modules", ".bin", command);',
    "    const executable = existsSync(localCommand) ? localCommand : command;",
    '    const child = spawn(executable, args, { cwd: root, stdio: "inherit" });',
    '    child.on("error", (error: Error) => {',
    "      process.stderr.write(`Error: could not run ${command}: ${error.message}\\n`);",
    "      resolve(2);",
    "    });",
    '    child.on("exit", (code) => resolve(code ?? 2));',
    "  });",
  ].join("\n");

const renderBinaryEntry = (): string =>
  [
    'import { runWithPrompt } from "legibility-runtime";',
    'import { existsSync } from "node:fs";',
    'import { spawn } from "node:child_process";',
    'import * as readline from "node:readline";',
    'import { join } from "node:path";',
    "",
    renderPromptLine(),
    renderPromptKey(),
    renderCommandRunner(),
    "",
    "const main = async (): Promise<void> => {",
    "  const exitCode = await runWithPrompt(process.argv.slice(2), promptLine, runCommand, readKey);",
    "  process.exit(exitCode);",
    "};",
    "",
    "void main();",
    "",
  ].join("\n");

const renderRuntimePackage = (): string => {
  const manifest: RuntimePackageManifest = {
    main: "index.js",
    name: RUNTIME_PACKAGE_NAME,
    type: "commonjs",
    types: "index.d.ts",
    version: packageJson.version,
  };
  return JSON.stringify(manifest);
};

const renderRuntimeTypes = (): string =>
  [
    "export type PromptLine = (message: string) => Promise<string>;",
    "export type PromptKeyReader = () => Promise<string>;",
    "export type CommandRunner = (command: string, args: string[], root: string) => Promise<number>;",
    "export declare function runWithPrompt(args: string[], promptLine: PromptLine, commandRunner?: CommandRunner, promptKey?: PromptKeyReader): Promise<number>;",
    "",
  ].join("\n");

const writeBinarySources = (): void => {
  mkdirSync(BIN_RUNTIME_DIR, { recursive: true });
  writeFileSync(BIN_ENTRY_FILE, renderBinaryEntry());
  writeFileSync(BIN_RUNTIME_ENTRY_FILE, renderRuntimeEntry());
  writeFileSync(BIN_RUNTIME_PACKAGE_FILE, renderRuntimePackage());
  writeFileSync(BIN_RUNTIME_TYPES_FILE, renderRuntimeTypes());
};

const writeCliEntry = (): void => {
  mkdirSync(CLI_OUTPUT_DIR, { recursive: true });
  writeFileSync(CLI_ENTRY_FILE, renderCliEntry());
  chmodSync(CLI_ENTRY_FILE, 0o755);
};

const bundleRuntime = (): void => {
  runBuildCommand("rolldown", [
    BIN_RUNTIME_ENTRY_FILE,
    "--file",
    BIN_BUNDLE_FILE,
    "--platform",
    "node",
    "--format",
    "cjs",
    "--banner",
    BIN_BUNDLE_BANNER,
  ]);
};

const compileBinary = (outputFile: string): void => {
  runBuildCommand("scriptc", [
    "build",
    BIN_ENTRY_FILE,
    "--out",
    outputFile,
    "--dynamic",
    "--no-keep-c",
  ]);
};

const printBinarySize = (outputFile: string): void => {
  const sizeInMb = (statSync(outputFile).size / 1024 / 1024).toFixed(1);
  log.print(`Built ${outputFile} (${sizeInMb}MB)`);
};

const buildBinary = (): void => {
  const buildArguments = new Set(process.argv.slice(2));
  writeCliEntry();
  if (buildArguments.has(CLI_ONLY_FLAG)) return;
  const isReleaseBuild = buildArguments.has(NATIVE_RELEASE_FLAG);
  const outputFile = isReleaseBuild ? nativeReleaseOutputFile() : BIN_OUTPUT_FILE;
  writeBinarySources();
  bundleRuntime();
  compileBinary(outputFile);
  printBinarySize(outputFile);
};

try {
  buildBinary();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  log.fail(message);
  process.exitCode = 1;
}
