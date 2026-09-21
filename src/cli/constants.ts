import packageJson from "../../package.json" with { type: "json" };
import type { DetectedLanguage, LinterDefinition } from "./types.ts";
import type { PromptChoice } from "./prompts/types.ts";

export const VERSION = packageJson.version;

export const CONFIG_FILENAMES = [".legibilityrc", "legibility.json"] as const;

export const ANSI = {
  BOLD: "\x1b[1m",
  CYAN: "\x1b[36m",
  GRAY: "\x1b[90m",
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  RESET: "\x1b[0m",
  HIDE_CURSOR: "\x1b[?25l",
  SHOW_CURSOR: "\x1b[?25h",
} as const;

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
    brewFormula: "fs-lint",
  },
  {
    id: "src-lint",
    command: "src-lint",
    kind: "standalone",
    description: "import boundary policy",
    languages: ["javascript", "typescript", "python", "go", "proto"] as const,
    brewFormula: "src-lint",
  },
  {
    id: "struct-lint",
    command: "struct-lint",
    kind: "standalone",
    description: "declaration and function order",
    languages: ["*"] as const,
    brewFormula: "struct-lint",
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
    brewFormula: "shellcheck-legibility",
  },
  {
    id: "sqlfluff-plugin-legibility",
    command: "sqlfluff",
    kind: "hosted",
    description: "SQL and Jinja comment policy",
    languages: ["sql"] as const,
  },
];

export const STYLEGUIDE_PREVIEW_MARK = "◆";
export const STYLEGUIDE_CANCEL_MARK = "✗";

export const STYLEGUIDE_DETECTED_LANGUAGES: DetectedLanguage[] = [
  {
    id: "typescript",
    label: "TypeScript",
    count: 28,
    files: ["src/cli/index.ts", "src/cli/utils.ts", "src/cli/constants.ts"],
  },
];

export const STYLEGUIDE_LANGUAGE_CHOICES: PromptChoice[] = [
  {
    name: "TypeScript",
    value: "typescript",
    description: "28 files · src/cli/index.ts, src/cli/utils.ts, …",
    checked: true,
  },
  { name: "JavaScript", value: "javascript", description: "not detected" },
  { name: "Python", value: "python", description: "not detected" },
  { name: "Go", value: "go", description: "not detected" },
];

export const STYLEGUIDE_LINTER_CHOICES: PromptChoice[] = [
  {
    name: "oxlint-plugin-legibility",
    value: "oxlint-plugin-legibility",
    description: "JavaScript and TypeScript readability · oxlint",
    checked: true,
  },
  {
    name: "eslint-plugin-legibility",
    value: "eslint-plugin-legibility",
    description: "JavaScript and TypeScript readability · eslint",
    disabled: "not installed",
  },
  {
    name: "src-lint",
    value: "src-lint",
    description: "import boundary policy · src-lint",
    disabled: "not installed",
  },
];

export const STYLEGUIDE_UPDATE_CHOICES: PromptChoice[] = [
  {
    name: "fs-lint",
    value: "fs-lint",
    description: "0.2.1 → 0.2.2 · brew upgrade fs-lint",
    checked: true,
  },
  {
    name: "src-lint",
    value: "src-lint",
    description: "0.1.0 → 0.1.1 · brew upgrade src-lint",
    checked: true,
  },
];

export const STYLEGUIDE_TOUR_CHOICES: PromptChoice[] = [
  {
    name: "Full setup flow",
    value: "full",
    description: "welcome through dry-run and execution approval",
  },
  { name: "Welcome confirmation", value: "welcome", description: "yes/no default handling" },
  {
    name: "Detect languages",
    value: "languages",
    description: "checkboxes, Space toggle, and Enter confirm",
  },
  {
    name: "Select available linters",
    value: "linters",
    description: "multiple circles with disabled and preselected choices",
  },
  {
    name: "Configure native arguments",
    value: "arguments",
    description: "text input and defaults",
  },
  { name: "Review configuration", value: "review", description: "read-only configuration preview" },
  { name: "Preview commands", value: "preview", description: "dry-run output" },
  { name: "Approve execution", value: "execution", description: "final yes/no gate" },
  {
    name: "Update Homebrew linters",
    value: "update",
    description: "select outdated linters and approve upgrades",
  },
  { name: "Cancellation", value: "cancellation", description: "Esc cleanup and exit code" },
  { name: "Exit styleguide", value: "exit", description: "return to the shell" },
];

export const SETUP_QUESTION = "Set up Legibility for this project?";

export const NO_SETUP_MESSAGE =
  "okay! if you already have `legibility`, but we somehow we missed the path, just run `legibility --config <path>`, eg `legibility --config ./package.json`. Otherwise, it'll be there for ya. Run `legibility --help` for help";

export const HELP_TEXT = `Usage: legibility [command] [options] [-- native-args]

Run the enabled linters from the discovered Legibility configuration.

Commands:
  update               Check and update outdated Homebrew linters

Options:
  -c, --config <path>  Use a JSON config or package.json
      --dry-run        Print commands without running them
  -h, --help           Show this help
      --linter <name>  Run one configured linter; repeat for several
      --styleguide     Show visual examples of the guided setup
  -v, --version        Show the version
      --verbose        Show local diagnostic logs on stderr
`;
