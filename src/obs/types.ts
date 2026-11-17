import type { logger } from "./logger.ts";

export type Logger = ReturnType<typeof logger>;

export type LoggerOptions = {
  file: string;
  isLogging?: boolean;
};
