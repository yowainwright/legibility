import { LOG_INDENT } from "./types.ts";
import type { DebugLogFunc, Logger, LoggerOptions } from "./types.ts";

const LOG_PREFIX = "Legibility:";

const formatArgs = (args: unknown[]): string => {
  if (args.length === 0) return "";
  return ` ${args.map(String).join(" ")}`;
};

const writeLine = (stream: NodeJS.WriteStream, message: string): void => {
  stream.write(`${message}\n`);
};

const createDebugMethod =
  (stream: NodeJS.WriteStream, isLogging: boolean, file: string): DebugLogFunc =>
  (message, caller, ...args) => {
    if (!isLogging) return;
    const prefix = `${LOG_PREFIX}[${file}][${caller}]`;
    writeLine(stream, `${prefix} ${message}${formatArgs(args)}`);
  };

const createWarnMethod =
  (file: string): DebugLogFunc =>
  (message, caller, ...args) => {
    const prefix = `${LOG_PREFIX}[${file}][${caller}]`;
    writeLine(process.stderr, `${prefix} ${message}${formatArgs(args)}`);
  };

export const logger = ({ file, isLogging = false }: LoggerOptions): Logger => ({
  debug: createDebugMethod(process.stderr, isLogging, file),
  error: createDebugMethod(process.stderr, isLogging, file),
  fail: (message) => writeLine(process.stderr, message),
  warn: createWarnMethod(file),
  print: (message) => writeLine(process.stdout, message),
  line: (message) => writeLine(process.stdout, `\n${message}`),
  indent: (message) => writeLine(process.stdout, `${LOG_INDENT}${message}`),
  item: (index, message) => writeLine(process.stdout, `${LOG_INDENT}${index}. ${message}`),
});
