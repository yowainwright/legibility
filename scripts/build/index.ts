import { mkdirSync, statSync, writeFileSync } from "node:fs";
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
  BUILD_SCRIPT_LABEL,
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
    'import { run } from "../src/cli/index.ts";',
    "",
    "const main = async (): Promise<void> => {",
    "  const exitCode = await run(process.argv.slice(2));",
    "  process.exit(exitCode);",
    "};",
    "",
    "void main();",
    "",
  ].join("\n");

const renderBinaryEntry = (): string => 'import "legibility-runtime";\n';

const renderRuntimePackage = (): string => {
  const manifest: RuntimePackageManifest = {
    main: "index.js",
    name: RUNTIME_PACKAGE_NAME,
    type: "commonjs",
    version: packageJson.version,
  };
  return JSON.stringify(manifest);
};

const writeBinarySources = (): void => {
  mkdirSync(BIN_RUNTIME_DIR, { recursive: true });
  writeFileSync(BIN_ENTRY_FILE, renderBinaryEntry());
  writeFileSync(BIN_RUNTIME_ENTRY_FILE, renderRuntimeEntry());
  writeFileSync(BIN_RUNTIME_PACKAGE_FILE, renderRuntimePackage());
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
  const isReleaseBuild = process.argv.includes(NATIVE_RELEASE_FLAG);
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
