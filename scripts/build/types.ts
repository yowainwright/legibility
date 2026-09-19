export type BuildLogger = {
  fail: (message: string) => void;
  print: (message: string) => void;
};

export type RuntimePackageManifest = {
  main: string;
  name: string;
  type: "commonjs";
  types: string;
  version: string;
};
