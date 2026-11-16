import type { LoggerOptions } from "./types.ts";

const LOG_PREFIX = "Legibility:";

export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: (message: string, caller: string): void => {
    if (!isLogging) return;
    const prefix = `${LOG_PREFIX}[${file}][${caller}]`;
    process.stderr.write(`${prefix} ${message}\n`);
  },
  fail: (message: string): void => {
    process.stderr.write(`${message}\n`);
  },
  print: (message: string): void => {
    process.stdout.write(`${message}\n`);
  },
});
