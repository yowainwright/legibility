import { LOG_INDENT } from "./types.ts";
import type { DebugLogFunc, Logger, LoggerOptions } from "./types.ts";

const LOG_PREFIX = "Legibility:";

const formatArgs = (args: unknown[]): string => {
  if (args.length === 0) return "";
  return ` ${args.map(String).join(" ")}`;
};

const writeStderr = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const writeStdout = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const createDebugMethod =
  (isLogging: boolean, file: string): DebugLogFunc =>
  (message, caller, ...args) => {
    if (!isLogging) return;
    const prefix = `${LOG_PREFIX}[${file}][${caller}]`;
    writeStderr(`${prefix} ${message}${formatArgs(args)}`);
  };

const createWarnMethod =
  (file: string): DebugLogFunc =>
  (message, caller, ...args) => {
    const prefix = `${LOG_PREFIX}[${file}][${caller}]`;
    writeStderr(`${prefix} ${message}${formatArgs(args)}`);
  };

export const logger = ({ file, isLogging = false }: LoggerOptions): Logger => ({
  debug: createDebugMethod(isLogging, file),
  error: createDebugMethod(isLogging, file),
  fail: (message) => {
    process.stderr.write(`${message}\n`);
  },
  warn: createWarnMethod(file),
  print: (message) => {
    process.stdout.write(`${message}\n`);
  },
  line: (message) => writeStdout(`\n${message}`),
  indent: (message) => writeStdout(`${LOG_INDENT}${message}`),
  item: (index, message) => writeStdout(`${LOG_INDENT}${index}. ${message}`),
});
