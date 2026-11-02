export type BuildLogger = {
  fail: (message: string) => void;
  print: (message: string) => void;
};
