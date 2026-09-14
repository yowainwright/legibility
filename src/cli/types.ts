export type JsonObject = Record<string, unknown>;

export type Linter = JsonObject & {
  enabled: boolean;
  args: string[];
};

export type LinterDefinition = {
  id: string;
  command: string;
  kind: "hosted" | "standalone";
  description: string;
  languages: readonly string[];
};

export type DetectedLanguage = {
  id: string;
  label: string;
  count: number;
  files: string[];
};

export type Config = JsonObject & {
  linters: Record<string, Linter>;
  languages: Record<string, JsonObject>;
};

export type Source = {
  path: string;
  root: string;
  config: Config;
};

export type CommandAvailability = (command: string, root: string) => boolean;

export type Options = {
  configPath?: string;
  dryRun: boolean;
  help: boolean;
  linters: string[];
  nativeArgs: string[];
  styleguide: boolean;
  version: boolean;
  verbose: boolean;
};
