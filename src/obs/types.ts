export type DebugLogFunc = (message: string, caller: string, ...args: unknown[]) => void;
export type PrintFunc = (message: string) => void;
export type ItemFunc = (index: number, message: string) => void;

export type Logger = {
  debug: DebugLogFunc;
  error: DebugLogFunc;
  fail: PrintFunc;
  warn: DebugLogFunc;
  print: PrintFunc;
  line: PrintFunc;
  indent: PrintFunc;
  item: ItemFunc;
};

export type LoggerOptions = {
  file: string;
  isLogging?: boolean;
};
