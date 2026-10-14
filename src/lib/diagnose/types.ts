export type LanguageDefinition = {
  id: string;
  label: string;
};

export type DetectedLanguage = LanguageDefinition & {
  count: number;
  files: string[];
};

export type PackageManagerEvidence = {
  kind: "declaration" | "lockfile" | "manifest";
  count: number;
  paths: string[];
};

export type DetectedPackageManager = {
  id: string;
  evidence: PackageManagerEvidence[];
};

export type LinterEvidence = {
  kind: "config" | "dependency" | "invocation";
  count: number;
  paths: string[];
};

export type DetectedTool = {
  id: string;
  evidence: LinterEvidence[];
};

export type ProjectDiagnosis = {
  languages: DetectedLanguage[];
  packageManagers: DetectedPackageManager[];
  tools: DetectedTool[];
};

export type GitOutputReader = (
  root: string,
  args: string[],
  consume: (chunk: Uint8Array) => Promise<void>,
  registerCancel: (cancel: () => void) => void,
) => Promise<number>;
