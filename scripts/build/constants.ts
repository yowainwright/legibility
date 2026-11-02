export const BUILD_SCRIPT_LABEL = "scripts/build/index.ts";
export const CLI_OUTPUT_DIR = "bin/js";
export const CLI_SOURCE_FILE = `${CLI_OUTPUT_DIR}/legibility-entry.ts`;
export const CLI_ENTRY_FILE = `${CLI_OUTPUT_DIR}/legibility`;
export const CLI_BUNDLE_BANNER = "#!/usr/bin/env node";
export const CLI_ONLY_FLAG = "--cli-only";
export const BIN_OUTPUT_DIR = "bin/native";
export const BIN_OUTPUT_FILE = `${BIN_OUTPUT_DIR}/legibility`;
export const NATIVE_RELEASE_FLAG = "--release";
export const BIN_ENTRY_FILE = `${BIN_OUTPUT_DIR}/legibility-entry.ts`;
export const BIN_CONFIG_FILE = `${BIN_OUTPUT_DIR}/tsconfig.json`;
export const BIN_CONFIG = {
  compilerOptions: {
    allowImportingTsExtensions: true,
    module: "esnext",
    moduleResolution: "bundler",
    target: "esnext",
    lib: ["esnext", "dom", "dom.iterable"],
    types: ["node"],
    strict: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    noEmit: true,
  },
  files: ["legibility-entry.ts"],
};
