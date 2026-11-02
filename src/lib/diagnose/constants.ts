import type { LanguageDefinition } from "./types.ts";

export const IGNORED_DIRECTORIES = new Set([
  ".cache",
  ".agents",
  ".claude",
  ".codex",
  ".git",
  ".next",
  ".turbo",
  ".tox",
  ".venv",
  "bin",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "tmp",
  "vendor",
  ".vscode",
]);

export const LANGUAGE_DEFINITIONS: readonly LanguageDefinition[] = [
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "go", label: "Go" },
  { id: "javascript", label: "JavaScript" },
  { id: "proto", label: "Proto" },
  { id: "python", label: "Python" },
  { id: "shell", label: "Shell" },
  { id: "sql", label: "SQL" },
  { id: "typescript", label: "TypeScript" },
];

export const LANGUAGE_BY_EXTENSION = {
  ".bash": "shell",
  ".c": "c",
  ".cc": "cpp",
  ".cpp": "cpp",
  ".cjs": "javascript",
  ".cxx": "cpp",
  ".go": "go",
  ".h": "c",
  ".hpp": "cpp",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".proto": "proto",
  ".py": "python",
  ".sh": "shell",
  ".sql": "sql",
  ".ts": "typescript",
  ".tsx": "typescript",
} as const;

export const PACKAGE_MANAGER_BY_LOCKFILE: Record<string, string> = {
  "bun.lock": "bun",
  "bun.lockb": "bun",
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "go.mod": "go",
  "Pipfile.lock": "pipenv",
  "poetry.lock": "poetry",
  "uv.lock": "uv",
  "Cargo.lock": "cargo",
  Brewfile: "homebrew",
};

export const PACKAGE_MANAGER_BY_DECLARATION: Record<string, string> = {
  bun: "bun",
  npm: "npm",
  pnpm: "pnpm",
  yarn: "yarn",
};

export const TOOL_BY_CONFIG_FILENAME: Record<string, string> = {
  ".eslintrc": "eslint",
  ".eslintrc.cjs": "eslint",
  ".eslintrc.js": "eslint",
  ".eslintrc.json": "eslint",
  ".eslintrc.yaml": "eslint",
  ".eslintrc.yml": "eslint",
  "eslint.config.cjs": "eslint",
  "eslint.config.cts": "eslint",
  "eslint.config.js": "eslint",
  "eslint.config.mjs": "eslint",
  "eslint.config.mts": "eslint",
  "eslint.config.ts": "eslint",
  ".oxlintrc.json": "oxlint",
  ".oxlintrc.jsonc": "oxlint",
  "oxlint.config.mts": "oxlint",
  "oxlint.config.ts": "oxlint",
  ".golangci.json": "golangci-lint",
  ".golangci.toml": "golangci-lint",
  ".golangci.yaml": "golangci-lint",
  ".golangci.yml": "golangci-lint",
  ".ruff.toml": "ruff",
  ".ruff-legibility.toml": "ruff-legibility",
  "ruff-legibility.toml": "ruff-legibility",
  "ruff.toml": "ruff",
  ".shellcheckrc": "shellcheck",
  shellcheckrc: "shellcheck",
  ".sqlfluff": "sqlfluff",
};

export const PACKAGE_DEPENDENCY_TO_TOOL: Record<string, string> = {
  eslint: "eslint",
  "eslint-plugin-legibility": "eslint-plugin-legibility",
  oxlint: "oxlint",
  "oxlint-plugin-legibility": "oxlint-plugin-legibility",
};

export const SCRIPT_COMMAND_TO_TOOL: Record<string, string> = {
  "fs-lint": "fs-lint",
  "src-lint": "src-lint",
  "struct-lint": "struct-lint",
  eslint: "eslint",
  oxlint: "oxlint",
  "go-lint-legibility": "go-lint-legibility",
  ruff: "ruff",
  "ruff-legibility": "ruff-legibility",
  "shellcheck-legibility": "shellcheck-legibility",
  sqlfluff: "sqlfluff",
};

export const SCRIPT_COMMAND_PATTERN = new RegExp(
  `(?:^|[\\s;&|])(${Object.keys(SCRIPT_COMMAND_TO_TOOL).join("|")})(?=$|[\\s;&|])`,
  "gu",
);

export const PYPROJECT_TOOL_IDS = new Set(["ruff", "ruff-legibility", "sqlfluff"]);
export const PYPROJECT_PACKAGE_MANAGER_IDS = new Set(["uv", "poetry"]);
export const PYPROJECT_TOOL_SECTION_PATTERN = /^\s*\[tool\.([a-zA-Z0-9_-]+)/gmu;

export const TOOL_BY_LINTER_ID: Record<string, string> = {
  "shellcheck-legibility": "shellcheck",
  "golangci-lint-legibility": "golangci-lint",
};

export const GO_MODULE_TO_TOOL: Record<string, string> = {
  "github.com/yowainwright/go-lint-legibility": "go-lint-legibility",
};

export const OXLINT_CONFIG_FILENAMES = [
  ".oxlintrc.json",
  ".oxlintrc.jsonc",
  "oxlint.config.ts",
  "oxlint.config.mts",
] as const;

export const METADATA_FILENAMES = new Set(["package.json", "pyproject.toml", "go.mod"]);
export const METADATA_READ_CONCURRENCY = 8;

export const GIT_INVENTORY_ARGS = [
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "--deduplicate",
];
