import type { LinterDefinition } from "./types.ts";

export const VERSION = "0.0.0";

export const CONFIG_FILENAMES = [".legibilityrc", "legibility.json"] as const;

export const LANGUAGE_DEFINITIONS = [
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

export const LINTER_DEFINITIONS: LinterDefinition[] = [
  {
    id: "fs-lint",
    command: "fs-lint",
    kind: "standalone",
    description: "file and path policy",
    languages: ["*"] as const,
  },
  {
    id: "src-lint",
    command: "src-lint",
    kind: "standalone",
    description: "import boundary policy",
    languages: ["javascript", "typescript", "python", "go", "proto"] as const,
  },
  {
    id: "struct-lint",
    command: "struct-lint",
    kind: "standalone",
    description: "declaration and function order",
    languages: ["*"] as const,
  },
  {
    id: "eslint-plugin-legibility",
    command: "eslint",
    kind: "hosted",
    description: "JavaScript and TypeScript readability policy",
    languages: ["javascript", "typescript"] as const,
  },
  {
    id: "oxlint-plugin-legibility",
    command: "oxlint",
    kind: "hosted",
    description: "JavaScript and TypeScript readability policy",
    languages: ["javascript", "typescript"] as const,
  },
  {
    id: "golangci-lint-legibility",
    command: "golangci-lint",
    kind: "hosted",
    description: "Go readability policy",
    languages: ["go"] as const,
  },
  {
    id: "ruff-legibility",
    command: "ruff",
    kind: "hosted",
    description: "Python readability policy",
    languages: ["python"] as const,
  },
  {
    id: "shellcheck-legibility",
    command: "shellcheck-legibility",
    kind: "hosted",
    description: "Shell readability policy",
    languages: ["shell"] as const,
  },
  {
    id: "sqlfluff-plugin-legibility",
    command: "sqlfluff",
    kind: "hosted",
    description: "SQL and Jinja comment policy",
    languages: ["sql"] as const,
  },
];

export const SETUP_QUESTION = "Set up Legibility for this project?";

export const NO_SETUP_MESSAGE =
  "okay! if you already have `legibility`, but we somehow we missed the path, just run `legibility --config <path>`, eg `legibility --config ./package.json`. Otherwise, it'll be there for ya. Run `legibility --help` for help";

export const HELP_TEXT = `Usage: legibility [options] [-- native-args]

Run the enabled linters from the discovered Legibility configuration.

Options:
  -c, --config <path>  Use a JSON config or package.json
      --dry-run        Print commands without running them
  -h, --help           Show this help
      --linter <name>  Run one configured linter; repeat for several
      --styleguide     Show visual examples of the guided setup
  -v, --version        Show the version
`;
