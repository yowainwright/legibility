export type JsonObject = Record<string, unknown>;
export type Languages = string[] | Record<string, JsonObject>;

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
  brewFormula?: string;
};

export type HomebrewOutdatedFormula = {
  name: string;
  installedVersions: string[];
  currentVersion: string;
  pinned: boolean;
};

export type HomebrewLinterUpdate = HomebrewOutdatedFormula & {
  id: string;
  formula: string;
};

export type UpdateConfig = JsonObject & {
  enabled: boolean;
  manager: "brew";
  prompt: boolean;
};

export type DetectedLanguage = {
  id: string;
  label: string;
  count: number;
  files: string[];
};

export type Config = JsonObject & {
  linters: Record<string, Linter>;
  languages?: Languages;
  updates: UpdateConfig;
};

export type Source = {
  path: string;
  root: string;
  config: Config;
};

export type CommandAvailability = (command: string, root: string) => boolean;

export type CommandRunner = (command: string, args: string[], root: string) => Promise<number>;

export type RuleCoverage = {
  details: string;
  language: string;
  status: string;
};

export type RuleVariant = {
  anchor: string;
  coverage: RuleCoverage[];
  defaultState: "disabled" | "enabled" | "unknown";
  languages: string[];
  nativeRule: string;
  plugin: string;
  recommended?: unknown;
  settings: string;
};

export type RuleSearchRecord = {
  description: string;
  id: string;
  languages: string[];
  name: string;
  searchText: string;
  tags: string[];
  variants: RuleVariant[];
};

export type RuleCatalog = {
  contentType: "text/markdown";
  formatVersion: number;
  markdown: string;
  rules: RuleSearchRecord[];
  sourceRevision: string;
  topics: string[];
};

export type RuleRuntimeRecord = Omit<RuleSearchRecord, "searchText"> & { searchTerms: string };

export type RuleRuntimeCatalog = Omit<RuleCatalog, "markdown" | "rules"> & {
  rules: RuleRuntimeRecord[];
};

export type HomebrewFormulaPayload = {
  name: string;
  installed_versions: string[];
  current_version: string;
  pinned: boolean;
};

export type Options = {
  configPath?: string;
  dryRun: boolean;
  help: boolean;
  linters: string[];
  nativeArgs: string[];
  enable?: boolean;
  language?: string;
  plugin?: string;
  rule?: boolean;
  ruleId?: string;
  rules?: boolean;
  search?: string;
  styleguide: boolean;
  update: boolean;
  version: boolean;
  verbose: boolean;
};
