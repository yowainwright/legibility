# Legibility

Legibility cli exposes linters with rules that normalize code for legiblity in the era of agentic coding.

Reading massive amounts of code everyday is not sustainable. Grokking prompts vs text vs contexts is not sustainable. Legbility linters and rules are built to normalize software across language and architecture for human legiblity.

## Install

The npm package requires Node 24 or newer:

```sh
npm install --global legibility
```

The npm package installs the JavaScript CLI. Native binaries are published as
GitHub release assets for macOS arm64 and amd64, and Linux arm64 and amd64.
Homebrew installation is available after the formula is published:

```sh
brew tap yowainwright/tap
brew install legibility
```

## Use

Run Legibility from a project directory:

```sh
legibility
```

The guided flow detects project languages, offers to install missing
Homebrew-backed native linters (all or individually), shows the supported
linters that are installed, collects native arguments, previews commands, and
asks before writing `legibility.json` or running a linter. Hosted integrations
such as ESLint and Oxlint remain project-managed dependencies. Detection skips
common generated and dependency directories such as `.git`, `node_modules`,
`dist`, `build`, `coverage`, `tmp`, and `vendor`.

Use the styleguide to exercise every prompt without changing a project:

```sh
legibility --styleguide
```

With an existing configuration, preview commands before execution:

```sh
legibility --dry-run
```

To pass arguments to one selected linter, separate them from Legibility options:

```sh
legibility --linter oxlint-plugin-legibility -- --deny-warnings
```

Non-interactive runs must use an existing configuration. Legibility does not create project configuration when no terminal is available.

## api

### `legibility`

Runs the enabled linters from the discovered configuration. If no configuration exists, the interactive setup flow detects languages, selects available linters, collects arguments, previews commands, and asks before saving or executing. Interactive runs also check configured Homebrew-backed linters for updates.

```text
"oxlint" "--deny-warnings"
```

```sh
legibility
```

Use `--dry-run` when you want to see the commands without running them. Use `--config` when the configuration is not in the current directory or its parents.

### `update`

Refreshes Homebrew metadata, finds outdated configured Homebrew-backed linters, and asks which ones to upgrade. It does not run project linters.

```text
All selected Homebrew linters are up to date.
```

```sh
legibility update
```

Use this when you want to check or update linters without running the project. The update flow is enabled by default and can be disabled with `updates.enabled: false`.

### `--config <path>` · `-c <path>`

Reads a JSON configuration file or a `package.json` containing a `legibility` object.

```text
"fs-lint" "check"
```

```sh
legibility --config packages/app/legibility.json --dry-run
```

Use this when the configuration is not discoverable from the current directory. Legibility rejects ambiguous parent and child configurations.

### `--dry-run`

Prints the selected linter commands without running them or changing update state.

```text
"fs-lint" "check"
"oxlint" "--deny-warnings"
```

```sh
legibility --dry-run
```

Use this before execution approval, in CI diagnostics, or when reviewing a new configuration.

### `--help` · `-h`

Prints the command and option reference.

```text
Usage: legibility [command] [options] [-- native-args]
```

```sh
legibility --help
```

Use this to inspect the installed CLI surface.

### `--linter <name>`

Runs only the named configured linter. Repeat the option to select multiple configured linters.

```text
"oxlint" "--deny-warnings"
```

```sh
legibility --linter oxlint-plugin-legibility --dry-run
legibility --linter fs-lint --linter src-lint
```

Use one selected linter when passing native arguments after `--`. Legibility rejects native arguments when several linters are selected because their option sets may differ.

### `--styleguide`

Opens the interactive CLI styleguide. It exercises the prompts without saving configuration, installing tools, updating Homebrew, or running linters.

```text
Legibility CLI Styleguide

Interactive tour. Nothing is saved and no linter runs.
```

```sh
legibility --styleguide
```

Use arrow keys and Enter to choose a flow. In checkbox prompts, use Space to toggle, `a` to select all, `n` to select none, and Esc to cancel.

### `--version` · `-v`

Prints the installed Legibility version.

```text
legibility version 0.0.0
```

```sh
legibility --version
```

Use this to verify which CLI release a script or agent is running.

### `--verbose`

Prints diagnostic logs to stderr while preserving normal linter output.

```text
Legibility:[index.ts][runLinters] Running 1 linter(s); dryRun=true
```

```sh
legibility --verbose --dry-run
```

Use this to inspect configuration discovery, update checks, command selection, and execution timing.

### `--` [native arguments]

Passes the remaining arguments directly to one selected native linter.

```text
"oxlint" "--deny-warnings"
```

```sh
legibility --linter oxlint-plugin-legibility -- --deny-warnings
```

Use this for a one-off native linter argument without changing `legibility.json`. The configured arguments run first, followed by these arguments.

## Exit status

- `0` — setup, update, dry-run, or linter execution succeeded.
- A linter's non-zero exit status — at least one selected linter failed.
- `2` — CLI arguments, configuration, update setup, or command execution failed.
- `130` — an interactive prompt was cancelled.

## Configuration

Legibility discovers one of these files from the current directory or its parents:

- `.legibilityrc`
- `legibility.json`
- `package.json` with a `legibility` object

Example:

```json
{
  "$schema": "https://unpkg.com/legibility/src/schema.json",
  "languages": {
    "typescript": {}
  },
  "linters": {
    "oxlint-plugin-legibility": {
      "enabled": true,
      "args": ["--deny-warnings"]
    }
  },
  "updates": {
    "enabled": true,
    "manager": "brew",
    "prompt": true
  }
}
```

The CLI registry currently supports these linter IDs:

| Linter                       | Languages                                 | Command                 |
| ---------------------------- | ----------------------------------------- | ----------------------- |
| `fs-lint`                    | all                                       | `fs-lint`               |
| `src-lint`                   | JavaScript, TypeScript, Python, Go, Proto | `src-lint`              |
| `struct-lint`                | all                                       | `struct-lint`           |
| `eslint-plugin-legibility`   | JavaScript, TypeScript                    | `eslint`                |
| `oxlint-plugin-legibility`   | JavaScript, TypeScript                    | `oxlint`                |
| `golangci-lint-legibility`   | Go                                        | `golangci-lint`         |
| `ruff-legibility`            | Python                                    | `ruff`                  |
| `shellcheck-legibility`      | Shell                                     | `shellcheck-legibility` |
| `sqlfluff-plugin-legibility` | SQL                                       | `sqlfluff`              |

## Updates

The first release updates Homebrew-backed linters only. With updates enabled (the default), an interactive `legibility` run checks configured Homebrew-backed linters before execution and asks before upgrading them:

```sh
legibility update
```

The explicit command refreshes Homebrew metadata, shows outdated configured linters, and asks before upgrading them. Set `updates.enabled` to `false` to disable update checks, or `updates.prompt` to `false` for an explicitly non-interactive update policy. Dry runs do not update anything.

## Agent skill

The npm package includes `skills/legibility-workflow/SKILL.md`. Agent integrations can install that file as a project skill; it routes setup and execution through the CLI so the agent does not duplicate detection or linter-selection rules.

## Development

Use Node 26 and pnpm for local development. The published npm package supports
Node 24 and newer:

```sh
pnpm install
pnpm run check
pnpm run test
pnpm run test:e2e
```
