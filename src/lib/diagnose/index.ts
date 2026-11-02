import { createReadStream } from "node:fs";
import { basename, extname, join } from "node:path";
import { addAbortSignal } from "node:stream";
import { buffer } from "node:stream/consumers";
import {
  LANGUAGE_BY_EXTENSION,
  LANGUAGE_DEFINITIONS,
  GO_MODULE_TO_TOOL,
  METADATA_FILENAMES,
  METADATA_READ_CONCURRENCY,
  PACKAGE_DEPENDENCY_TO_TOOL,
  PACKAGE_MANAGER_BY_DECLARATION,
  PACKAGE_MANAGER_BY_LOCKFILE,
  PYPROJECT_PACKAGE_MANAGER_IDS,
  PYPROJECT_TOOL_SECTION_PATTERN,
  PYPROJECT_TOOL_IDS,
  SCRIPT_COMMAND_PATTERN,
  SCRIPT_COMMAND_TO_TOOL,
  TOOL_BY_CONFIG_FILENAME,
} from "./constants.ts";
import type {
  DetectedLanguage,
  LinterEvidence,
  PackageManagerEvidence,
  ProjectDiagnosis,
} from "./types.ts";
import { forEachPath, languageFilePaths, projectFilePaths } from "./utils.ts";
export { setGitOutputReader } from "./utils.ts";

type LanguageCount = {
  count: number;
  files: string[];
};

type EvidenceKind = PackageManagerEvidence["kind"] | LinterEvidence["kind"];

type EvidenceCount = {
  count: number;
  paths: string[];
};

type DiagnosisAccumulator = {
  languages: Map<string, LanguageCount>;
  packageManagers: Map<string, Map<PackageManagerEvidence["kind"], EvidenceCount>>;
  tools: Map<string, Map<LinterEvidence["kind"], EvidenceCount>>;
};

export const diagnose = async (root: string): Promise<ProjectDiagnosis> => {
  const accumulator = createAccumulator();
  const controller = new AbortController();
  const paths = projectFilePaths(root, controller.signal);
  const metadata = metadataPaths(paths, accumulator);
  const inspect = (path: string, signal: AbortSignal) =>
    inspectMetadataFile(root, path, accumulator, signal);
  await forEachPath(metadata, inspect, { controller, concurrency: METADATA_READ_CONCURRENCY });
  return diagnosisResult(accumulator);
};

export const detectLanguages = (root: string): DetectedLanguage[] => {
  const accumulator = createAccumulator();
  for (const path of languageFilePaths(root)) recordLanguage(path, accumulator);
  return detectedLanguages(accumulator);
};

const createAccumulator = (): DiagnosisAccumulator => ({
  languages: new Map(),
  packageManagers: new Map(),
  tools: new Map(),
});

const metadataPaths = async function* (
  paths: AsyncGenerator<string>,
  accumulator: DiagnosisAccumulator,
): AsyncGenerator<string> {
  for await (const path of paths) {
    if (inspectProjectPath(path, accumulator)) yield path;
  }
};

const inspectProjectPath = (path: string, accumulator: DiagnosisAccumulator): boolean => {
  const name = basename(path);
  if (!hasCandidateSignal(path)) return false;
  recordPathSignals(path, accumulator);
  return METADATA_FILENAMES.has(name);
};

const inspectMetadataFile = async (
  root: string,
  path: string,
  accumulator: DiagnosisAccumulator,
  signal: AbortSignal,
): Promise<void> => {
  try {
    const stream = createReadStream(join(root, path));
    addAbortSignal(signal, stream);
    const bytes = await buffer(stream);
    recordMetadataContent(bytes.toString("utf8"), path, accumulator);
  } catch (error) {
    if (!isMissingFileError(error)) throw error;
  }
};

const diagnosisResult = (accumulator: DiagnosisAccumulator): ProjectDiagnosis => ({
  languages: detectedLanguages(accumulator),
  packageManagers: detectedEntries(accumulator.packageManagers),
  tools: detectedEntries(accumulator.tools),
});

const hasCandidateSignal = (path: string): boolean => {
  const name = basename(path);
  const extension = extname(path).toLowerCase();
  const isLanguage = Object.hasOwn(LANGUAGE_BY_EXTENSION, extension);
  const hasKnownName =
    Object.hasOwn(PACKAGE_MANAGER_BY_LOCKFILE, name) ||
    Object.hasOwn(TOOL_BY_CONFIG_FILENAME, name) ||
    METADATA_FILENAMES.has(name);
  return isLanguage || hasKnownName;
};

const recordPathSignals = (path: string, accumulator: DiagnosisAccumulator): void => {
  const name = basename(path);
  recordLanguage(path, accumulator);
  const packageManager = Object.hasOwn(PACKAGE_MANAGER_BY_LOCKFILE, name)
    ? PACKAGE_MANAGER_BY_LOCKFILE[name]
    : undefined;
  if (packageManager) {
    const isManifest = name === "go.mod" || name === "Brewfile";
    const kind = isManifest ? "manifest" : "lockfile";
    recordPackageManager(packageManager, kind, path, accumulator);
  }
  const tool = Object.hasOwn(TOOL_BY_CONFIG_FILENAME, name)
    ? TOOL_BY_CONFIG_FILENAME[name]
    : undefined;
  if (tool) recordTool(tool, "config", path, accumulator);
};

const recordMetadataContent = (
  content: string,
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  const name = basename(path);
  if (name === "package.json") recordPackageJson(content, path, accumulator);
  if (name === "pyproject.toml") recordPyproject(content, path, accumulator);
  if (name === "go.mod") recordGoModules(content, path, accumulator);
};

const isMissingFileError = (error: unknown): boolean => {
  const hasCode = isObject(error) && Object.hasOwn(error, "code");
  if (!hasCode) return false;
  return error.code === "ENOENT";
};

const detectedLanguages = (accumulator: DiagnosisAccumulator): DetectedLanguage[] =>
  LANGUAGE_DEFINITIONS.flatMap((definition) => {
    const match = accumulator.languages.get(definition.id);
    if (!match) return [];
    const detected: DetectedLanguage = Object.assign({}, definition, {
      count: match.count,
      files: match.files,
    });
    return [detected];
  });

const detectedEntries = <K extends EvidenceKind>(
  entries: Map<string, Map<K, EvidenceCount>>,
): Array<{ id: string; evidence: Array<{ kind: K; count: number; paths: string[] }> }> => {
  const sortedEntries = Array.from(entries.entries()).toSorted(([left], [right]) =>
    comparePaths(left, right),
  );
  return sortedEntries.map(([id, evidence]) => ({ id, evidence: detectedEvidence(evidence) }));
};

const recordPackageJson = (
  content: string,
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  const manifest = parsePackageJson(content);
  if (!manifest) return;
  recordDeclaredPackageManager(manifest.packageManager, path, accumulator);
  const dependencies = [
    manifest.dependencies,
    manifest.devDependencies,
    manifest.optionalDependencies,
    manifest.peerDependencies,
  ];
  recordDependencies(dependencies, path, accumulator);
  recordPackageScripts(manifest.scripts, path, accumulator);
};

const recordPyproject = (
  content: string,
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  const foundSections = pyprojectSections(content);
  for (const tool of PYPROJECT_TOOL_IDS) {
    if (foundSections.has(tool)) recordTool(tool, "config", path, accumulator);
  }
  for (const manager of PYPROJECT_PACKAGE_MANAGER_IDS) {
    if (foundSections.has(manager)) recordPackageManager(manager, "declaration", path, accumulator);
  }
};

const recordGoModules = (
  content: string,
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  const tools = new Set(content.split(/\r?\n/u).map(goModuleInLine));
  for (const tool of tools) {
    if (tool) recordTool(tool, "dependency", path, accumulator);
  }
};

const parsePackageJson = (content: string): Record<string, unknown> | undefined => {
  try {
    const manifest: unknown = JSON.parse(content);
    if (isObject(manifest)) return manifest;
  } catch {
    return undefined;
  }
  return undefined;
};

const recordDeclaredPackageManager = (
  value: unknown,
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  if (typeof value !== "string") return;
  const managerName = value.split("@", 1)[0]?.toLowerCase();
  const manager =
    managerName && Object.hasOwn(PACKAGE_MANAGER_BY_DECLARATION, managerName)
      ? PACKAGE_MANAGER_BY_DECLARATION[managerName]
      : undefined;
  if (manager) recordPackageManager(manager, "declaration", path, accumulator);
};

const recordDependencies = (
  values: unknown[],
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  const groups = values.filter(isObject);
  const packageNames = new Set(groups.flatMap(Object.keys));
  for (const packageName of packageNames) {
    const tool = Object.hasOwn(PACKAGE_DEPENDENCY_TO_TOOL, packageName)
      ? PACKAGE_DEPENDENCY_TO_TOOL[packageName]
      : undefined;
    if (tool) recordTool(tool, "dependency", path, accumulator);
  }
};

const recordPackageScripts = (
  value: unknown,
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  if (!isObject(value)) return;
  const scripts = Object.values(value).filter((script) => typeof script === "string");
  const scriptText = scripts.join("\n");
  const commands = new Set(
    Array.from(scriptText.matchAll(SCRIPT_COMMAND_PATTERN), (match) => match[1]),
  );
  for (const command of commands) {
    const tool =
      command && Object.hasOwn(SCRIPT_COMMAND_TO_TOOL, command)
        ? SCRIPT_COMMAND_TO_TOOL[command]
        : undefined;
    if (tool) recordTool(tool, "invocation", path, accumulator);
  }
};

const pyprojectSections = (content: string): Set<string> => {
  const foundSections = new Set<string>();
  for (const match of content.matchAll(PYPROJECT_TOOL_SECTION_PATTERN)) {
    const section = match[1] ?? "";
    const matchEnd = (match.index ?? 0) + match[0].length;
    const boundary = content[matchEnd];
    const isSectionBoundary = boundary === "]" || boundary === ".";
    const isTool = PYPROJECT_TOOL_IDS.has(section);
    const isPackageManager = PYPROJECT_PACKAGE_MANAGER_IDS.has(section);
    const isSupportedSection = isTool || isPackageManager;
    const shouldRecordSection = isSectionBoundary && isSupportedSection;
    if (shouldRecordSection) foundSections.add(section);
  }
  return foundSections;
};

const goModuleInLine = (line: string): string | undefined => {
  const modulePath = line
    .split("//", 1)[0]
    ?.trim()
    .split(/\s+/u)
    .find((part) => Object.hasOwn(GO_MODULE_TO_TOOL, part));
  return modulePath ? GO_MODULE_TO_TOOL[modulePath] : undefined;
};

const recordLanguage = (path: string, accumulator: DiagnosisAccumulator): void => {
  const extension = extname(path).toLowerCase();
  const isLanguage = Object.hasOwn(LANGUAGE_BY_EXTENSION, extension);
  if (!isLanguage) return;
  const languageId = LANGUAGE_BY_EXTENSION[extension as keyof typeof LANGUAGE_BY_EXTENSION];
  if (!languageId) return;
  const current = accumulator.languages.get(languageId) ?? { count: 0, files: [] };
  current.count += 1;
  current.files = pathSample(current.files, path, 3);
  accumulator.languages.set(languageId, current);
};

const recordPackageManager = (
  id: string,
  kind: PackageManagerEvidence["kind"],
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  recordEvidence(accumulator.packageManagers, id, kind, path);
};

const recordTool = (
  id: string,
  kind: LinterEvidence["kind"],
  path: string,
  accumulator: DiagnosisAccumulator,
): void => {
  recordEvidence(accumulator.tools, id, kind, path);
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return !Array.isArray(value);
};

const detectedEvidence = <K extends EvidenceKind>(
  entries: Map<K, EvidenceCount>,
): Array<{ kind: K; count: number; paths: string[] }> => {
  const sortedEvidence = Array.from(entries.entries()).toSorted(([left], [right]) =>
    comparePaths(left, right),
  );
  return sortedEvidence.map(([kind, details]) => Object.assign({ kind }, details));
};

const recordEvidence = <K extends EvidenceKind>(
  entries: Map<string, Map<K, EvidenceCount>>,
  id: string,
  kind: K,
  path: string,
): void => {
  const kinds = entries.get(id) ?? new Map<K, EvidenceCount>();
  const evidence = kinds.get(kind) ?? { count: 0, paths: [] };
  evidence.count += 1;
  evidence.paths = pathSample(evidence.paths, path, 2);
  kinds.set(kind, evidence);
  entries.set(id, kinds);
};

const pathSample = (paths: string[], path: string, limit: number): string[] =>
  paths.includes(path) ? paths : paths.concat(path).toSorted(comparePaths).slice(0, limit);

const comparePaths = (left: string, right: string): number => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};
