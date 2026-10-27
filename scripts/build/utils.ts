import { spawnSync } from "node:child_process";
import { BIN_OUTPUT_DIR } from "./constants.ts";
import type { BuildLogger } from "./types.ts";

export const runCommand = (command: string, args: readonly string[], logger: BuildLogger): void => {
  const result = spawnSync(command, Array.from(args), { encoding: "utf8" });
  if (result.status === 0) return;
  printOutput(logger, result.stdout, result.stderr);
  if (result.error) throw result.error;
  throw new Error(`${command} exited with status ${result.status ?? 1}`);
};

export const nativeReleaseOutputFile = (): string => {
  const architecture = process.arch === "x64" ? "amd64" : process.arch;
  return `${BIN_OUTPUT_DIR}/legibility-${process.platform}-${architecture}`;
};

const printOutput = (logger: BuildLogger, stdout?: string, stderr?: string): void => {
  const output = stdout?.trim();
  const errorOutput = stderr?.trim();
  if (output) logger.print(output);
  if (errorOutput) logger.fail(errorOutput);
};
