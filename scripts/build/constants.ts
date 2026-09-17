export const BUILD_SCRIPT_LABEL = "scripts/build/index.ts";
export const BIN_OUTPUT_DIR = "artifacts";
export const BIN_OUTPUT_FILE = `${BIN_OUTPUT_DIR}/legibility`;
export const NATIVE_RELEASE_FLAG = "--release";
export const BIN_ENTRY_FILE = `${BIN_OUTPUT_DIR}/legibility-entry.ts`;
export const BIN_RUNTIME_DIR = `${BIN_OUTPUT_DIR}/node_modules/legibility-runtime`;
export const BIN_RUNTIME_ENTRY_FILE = `${BIN_OUTPUT_DIR}/legibility-runtime-entry.ts`;
export const BIN_RUNTIME_PACKAGE_FILE = `${BIN_RUNTIME_DIR}/package.json`;
export const BIN_BUNDLE_FILE = `${BIN_RUNTIME_DIR}/index.js`;
export const BIN_BUNDLE_BANNER = "// @ts-nocheck";
export const RUNTIME_PACKAGE_NAME = "legibility-runtime";

export const nativeReleaseOutputFile = (): string => {
  const architecture = process.arch === "x64" ? "amd64" : process.arch;
  return `${BIN_OUTPUT_DIR}/legibility-${process.platform}-${architecture}`;
};
