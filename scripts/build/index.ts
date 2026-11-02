import { chmodSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { logger as createLogger } from "../../src/obs/index.ts";
import {
  BIN_CONFIG,
  BIN_CONFIG_FILE,
  BIN_ENTRY_FILE,
  BIN_OUTPUT_DIR,
  BIN_OUTPUT_FILE,
  BUILD_SCRIPT_LABEL,
  CLI_BUNDLE_BANNER,
  CLI_ENTRY_FILE,
  CLI_ONLY_FLAG,
  CLI_OUTPUT_DIR,
  CLI_SOURCE_FILE,
  NATIVE_RELEASE_FLAG,
} from "./constants.ts";
import { nativeReleaseOutputFile, runCommand } from "./utils.ts";

const log = createLogger({ file: BUILD_SCRIPT_LABEL, isLogging: true });

const buildBinary = async (): Promise<void> => {
  const buildArguments = new Set(process.argv.slice(2));
  generateRuleCatalog();
  if (buildArguments.has(CLI_ONLY_FLAG)) {
    writeCliEntry();
    await bundleCli();
    return;
  }
  const isReleaseBuild = buildArguments.has(NATIVE_RELEASE_FLAG);
  const outputFile = isReleaseBuild ? nativeReleaseOutputFile() : BIN_OUTPUT_FILE;
  writeBinarySources();
  compileBinary(outputFile);
  printBinarySize(outputFile);
};

const writeBinarySources = (): void => {
  mkdirSync(BIN_OUTPUT_DIR, { recursive: true });
  writeFileSync(BIN_ENTRY_FILE, renderBinaryEntry());
  writeFileSync(BIN_CONFIG_FILE, JSON.stringify(BIN_CONFIG));
};

const renderBinaryEntry = (): string =>
  [
    'import { runWithPrompt } from "../../src/cli/index.ts";',
    'import { createInterface } from "node:readline/promises";',
    "",
    renderPromptLine(),
    renderPromptKey(),
    renderBinaryMain(),
    "",
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

const renderBinaryMain = (): string =>
  [
    "const main = async (): Promise<void> => {",
    "  const exitCode = await runWithPrompt(process.argv.slice(2), promptLine, undefined, readKey);",
    "  process.exit(exitCode);",
    "};",
    "void main();",
  ].join("\n");

const renderPromptLine = (): string =>
  [
    "const promptLine = async (message: string): Promise<string> => {",
    "  const rl = createInterface({ input: process.stdin, output: process.stdout });",
    "  try {",
    "    return await rl.question(message);",
    "  } finally {",
    "    rl.close();",
    "  }",
    "};",
  ].join("\n");

const writeCliEntry = (): void => {
  mkdirSync(CLI_OUTPUT_DIR, { recursive: true });
  writeFileSync(CLI_SOURCE_FILE, renderCliEntry());
};

const renderCliEntry = (): string =>
  [
    'import { run } from "../../src/cli/index.ts";',
    "",
    "const exitCode = await run(process.argv.slice(2));",
    "process.exit(exitCode);",
    "",
  ].join("\n");

const bundleCli = async (): Promise<void> => {
  const { rolldown } = await import("rolldown");
  const bundle = await rolldown({
    input: CLI_SOURCE_FILE,
    platform: "node",
    resolve: { mainFields: ["module", "main"] },
  });
  try {
    await bundle.write({ banner: CLI_BUNDLE_BANNER, file: CLI_ENTRY_FILE, format: "esm" });
  } finally {
    await bundle.close();
  }
  chmodSync(CLI_ENTRY_FILE, 0o755);
};

const compileBinary = (outputFile: string): void => {
  runBuildCommand("scriptc", [
    "build",
    BIN_ENTRY_FILE,
    "--out",
    outputFile,
    "--npm-static",
    "auto",
    "--node-islands",
    "off",
    "--no-keep-llvm",
    "--strip",
  ]);
};

const printBinarySize = (outputFile: string): void => {
  const sizeInMb = (statSync(outputFile).size / 1024 / 1024).toFixed(1);
  log.print(`Built ${outputFile} (${sizeInMb}MB)`);
};

const generateRuleCatalog = (): void =>
  runBuildCommand(process.execPath, ["--experimental-strip-types", "scripts/rules/index.ts"]);

const runBuildCommand = (command: string, args: readonly string[]): void =>
  runCommand(command, args, log);

try {
  await buildBinary();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  log.fail(message);
  process.exitCode = 1;
}
