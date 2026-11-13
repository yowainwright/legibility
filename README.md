# Legibility

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

Legibility is a CLI that configures and runs legibility linters on code, folder structure, and text for humans and agents.
The goal is a set of minimal tools making programming easier to reason about for all giving a little joy back to programming.

You’ll see the word “joy” a lot here. That’s intentional.

---

### 3 sentences for why you might want to use Legibility

Each Legibility linter runs on its own, and each plugin works with its corresponding linter. Use the CLI once to choose your tools and save their arguments. Keep using it to run those checks.

### Why Legibility was built

> Legibility’s goal is to make agentic programming more enjoyable.

Although, agentic coding and large language models have solved many programming problems and sped it up generally, it has also created new problems. These new problems require new solutions. Or, in the case of Legibility, a new way of defining what high quality joyous programs look like.

---

## Preface

As agents write more code, skills help enforce clear patterns. Linters and plugins check those patterns automatically. The goal is to make code easier to read, write, and compile, even when working with thousands of lines a day.

This README documents the initial CLI contract.

---

## Install

For stable releases, install with Homebrew:

```sh
brew install yowainwright/tap/legibility
```

Or install the npm package:

```sh
npm install legibility -g
```

Homebrew installs a native binary and does not require Node.js. The npm package requires Node.js 24 or newer.

---

## Run

From a project directory, start guided setup or run the discovered configuration.

Setup detects project languages, offers supported linters, previews commands, and asks before saving `legibility.json` or running checks. It requires a terminal; non-interactive runs need an existing configuration.

Hosted linters like ESLint and Oxlint stay project-managed dependencies. Setup can use Homebrew to install Legibility's native linters.

---

### Example

**1. Command**

```sh
legibility
```

---

**2. Generated output**

Select TypeScript and an available Oxlint integration, then approve the save. Legibility writes:

```text
my-project/
└── legibility.json
```

For example, entering `--deny-warnings` as the Oxlint arguments produces:

```json
{
  "languages": ["typescript"],
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

---

### Preview

Preview configured commands without running linters:

```sh
legibility --dry-run
```

**Output**

```text
"oxlint" "--deny-warnings"
```

---

<!-- generated:available-tools:start -->

## Available linters and plugins

### Linters

| Name                          | Command       | Languages                                 | What it checks                 |
| ----------------------------- | ------------- | ----------------------------------------- | ------------------------------ |
| [`fs-lint`](#fs-lint)         | `fs-lint`     | All detected languages                    | file and path policy           |
| [`src-lint`](#src-lint)       | `src-lint`    | JavaScript, TypeScript, Python, Go, Proto | import boundary policy         |
| [`struct-lint`](#struct-lint) | `struct-lint` | All detected languages                    | declaration and function order |

### Plugins

| Name                                                        | Command                 | Languages              | What it checks                               |
| ----------------------------------------------------------- | ----------------------- | ---------------------- | -------------------------------------------- |
| [`eslint-plugin-legibility`](#eslint-plugin-legibility)     | `eslint`                | JavaScript, TypeScript | JavaScript and TypeScript readability policy |
| [`oxlint-plugin-legibility`](#oxlint-plugin-legibility)     | `oxlint`                | JavaScript, TypeScript | JavaScript and TypeScript readability policy |
| [`go-lint-legibility`](#go-lint-legibility)                 | `go-lint-legibility`    | Go                     | Go readability policy                        |
| [`ruff-legibility`](#ruff-legibility)                       | `ruff-legibility`       | Python                 | Python readability policy                    |
| [`shellcheck-legibility`](#shellcheck-legibility)           | `shellcheck-legibility` | Shell                  | Shell readability policy                     |
| [`sqlfluff-plugin-legibility`](#sqlfluff-plugin-legibility) | `sqlfluff`              | SQL                    | SQL and Jinja comment policy                 |

<!-- generated:available-tools:end -->

---

## CLI API

Full reference: run `legibility --help`.
The examples below assume `legibility` is on `PATH`.

### `legibility`

> Type: **`command`**

Runs the project's enabled linters. With no configuration, interactive runs start guided setup. Setup previews commands and asks before saving `legibility.json` or running a linter. Non-interactive runs require an existing configuration.

```sh
legibility
legibility --dry-run
```

Use `--dry-run` to inspect selected linter commands before execution.

---

### `legibility update`

> Type: **`command`**

Refreshes Homebrew metadata and offers updates for supported Homebrew-backed linters.
An eligible interactive run also checks for Homebrew linter updates before linting.

```sh
legibility update
```

Use this to update linters without running the project's checks. See [`updates` configuration](#updates) for prompt and enablement behavior.

Set `updates.prompt` to `false` to make eligible updates non-interactive:

```diff
 "updates": {
   "enabled": true,
   "manager": "brew",
-  "prompt": true
+  "prompt": false
 }
```

With the default `updates.prompt: true`, `legibility update` requires an interactive terminal. Setting it to `false` refreshes Homebrew metadata and applies all eligible updates without prompting.

---

### `legibility rules [--search <terms>]`

> Type: **`command`**

Searches the shared rule catalog. Search terms use AND matching across rule content and mappings.

```sh
legibility rules --search "function length"
```

Use this to find a rule by ID, name, description, example, language, or tool.
The [shared rule catalog](docs/rules.md) documents rule mappings and coverage.

The [LEG038 example](docs/rules.md#leg038-javascript-typescript-oxlint) illustrates a refactor under a three-line limit:

```diff
- function renderTitle(value) {
-   const title = value.trim();
-   return title;
- }
+ function renderTitle(value) {
+   return value.trim();
+ }
```

---

#### `--search <terms>`

> Type: **`string option`**

Filters `rules` results. Every space-separated term must match; matching is case-insensitive. Without this option, Legibility prints the rule count and a search hint.

```sh
legibility rules --search "function length"
```

Search only reports matching rules; it does not change files. After finding LEG038, you can enable its Oxlint mapping with the `legibility rule` command:

```sh
legibility rule LEG038 --language javascript --plugin oxlint --enable
```

For an existing `.oxlintrc.jsonc`, enabling the mapping changes the rule setting like this:

```diff
   "rules": {
-    "max-lines-per-function": "off",
+    "max-lines-per-function": [
+      "warn",
+      {
+        "max": 40,
+        "skipBlankLines": true,
+        "skipComments": true,
+        "IIFEs": true
+      }
+    ],
     "no-debugger": "warn"
   }
```

---

### `legibility rule <id>`

> Type: **`command`**

Shows rule details and a language/plugin mapping. Add `--language` or `--plugin` to select a mapping. Add `--enable` to enable a supported Oxlint mapping; use `--dry-run` to preview the edit.

```sh
legibility rule LEG038 --language javascript --plugin oxlint
```

Example output with no project Legibility config or Oxlint config:

```text
LEG038 — max-function-lines
Limit functions to a focused line budget.
Topics: functions, complexity

JavaScript · Oxlint · native rule: max-lines-per-function
  Coverage: JavaScript: Provided by native linter
  Default: disabled
  Settings: max: number; skipBlankLines: boolean; skipComments: boolean; IIFEs: boolean; Preset
  Recommended: warn {"max":40,"skipBlankLines":true,"skipComments":true,"IIFEs":true}
  Project: disabled (no Oxlint config; documented default)
  Legibility runner: not configured
  Docs: https://github.com/yowainwright/legibility/blob/main/docs/rules.md#leg038-javascript-typescript-oxlint
```

Automatic edits support simple Oxlint JSON and JSONC configs. Inherited, overridden, nested, and TypeScript configs are reported as unsupported.

---

#### `--language <name>`

> Type: **`string option`**

Filters rule details to a language mapping. Use a language ID or label.

```sh
legibility rule LEG038 --language typescript
```

---

#### `--plugin <name>`

> Type: **`string option`**

Filters rule details to a plugin mapping.

```sh
legibility rule LEG038 --plugin oxlint
```

---

#### `--enable`

> Type: **`boolean option`**
> Default: **`false`**

Enables the selected supported rule mapping in a simple Oxlint JSON or JSONC configuration. Requires both `--language` and `--plugin`. Use `--dry-run` to preview the edit.

```sh
legibility rule LEG038 --language javascript --plugin oxlint --enable --dry-run
```

---

### `--config <path>`, `-c`

> Type: **`string option`**
> Default: **discover config from the current directory and parents; start setup if none is found in a terminal**

Reads a JSON Legibility config or a `package.json` with a `legibility` object. Legibility reports an error if automatic discovery finds more than one config.

```sh
legibility --config packages/app/legibility.json --dry-run
```

Use this when a config is outside the current directory's parent chain, or to select one explicitly.

---

### `--linter <id>`

> Type: **`string[] option`**
> Default: **all enabled linters in the config**

Selects configured linters. Repeat the option to select more than one.

```sh
legibility --linter oxlint-plugin-legibility --dry-run
legibility --linter fs-lint --linter src-lint
```

With the [quick-start config](#example), the first command prints:

```text
"oxlint" "--deny-warnings"
```

---

### `-- <native-args>`

> Type: **`string[] argument`**

Passes remaining arguments to one selected linter, after its configured arguments. Legibility rejects native arguments when multiple linters are selected.

```sh
legibility --linter oxlint-plugin-legibility --dry-run -- src
```

With the [quick-start config](#example), this appends the path after the saved arguments:

```text
"oxlint" "--deny-warnings" "src"
```

---

### `--dry-run`

> Type: **`boolean option`**
> Default: **`false`**

Prints selected linter commands or previews a supported rule edit without running linters or writing the edit. Also skips the automatic Homebrew update check. `legibility update --dry-run` is not supported.

```sh
legibility --dry-run
```

---

### `--help`, `-h`, `--version`, `-v`

> Type: **`boolean options`**

Prints the CLI reference or installed version.

```sh
legibility --help
legibility --version
```

---

### `--verbose`

> Type: **`boolean option`**
> Default: **`false`**

Prints diagnostic logs to stderr while leaving native linter output on its original streams.

```sh
legibility --verbose
```

---

### `--styleguide`

> Type: **`boolean option`**

Opens an interactive tour of the setup prompts. Does not save configuration, install tools, update Homebrew, or run linters.

```sh
legibility --styleguide
```

---

## Configuration

[Try features in an E2E sandbox](tests/e2e/README.md), using the same real-linter fixtures as automated verification.

Legibility reads JSON configuration from a file or from `package.json#legibility`.
The field examples below are excerpts. Combine them in one config with at least one enabled linter.

[Codex hooks](docs/README.md#codex-hooks) provide feedback after edits and block completion on unresolved failures. Hooks are opt-in, with project → linter → rule overrides.

### Config Files

> Type: **`.legibilityrc` | `legibility.json` | `package.json#legibility`**

Legibility searches the current directory and its parents. It stops with an error if it finds more than one config. Use `--config` to select a file explicitly.

Choose one configuration file. For example:

```text
my-project/
├── .legibilityrc
└── src/
    └── index.ts
```

```sh
legibility --config .legibilityrc --dry-run
```

---

### `$schema`

> Type: **`string`**

Points editors to Legibility's JSON Schema.

```json
{
  "$schema": "https://unpkg.com/legibility/src/schema.json"
}
```

---

### `version`

> Type: **`integer`**
> Default: **`1`**

Identifies the configuration format version.

```json
{
  "version": 1
}
```

---

### `languages`

> Type: **`string[]` or an object keyed by language ID**
> Optional

Records the languages selected during setup. Setup writes a string array when there are no per-language settings. The object form reserves space for those settings; none currently affect execution. Configured linter IDs determine which tools run.

```json
{
  "languages": ["typescript", "go"]
}
```

---

### `linters`

> Type: **`object`**
> Required: **yes**

Maps supported linter IDs to their settings. A run needs at least one enabled linter.

```json
{
  "linters": {
    "oxlint-plugin-legibility": {
      "args": ["src", "--deny-warnings"]
    }
  }
}
```

---

### `linters.<id>.enabled`

> Type: **`boolean`**
> Default: **`true`**

Runs the configured linter unless set to `false`.

```diff
 "linters": {
   "oxlint-plugin-legibility": {
-    "enabled": true,
+    "enabled": false,
     "args": ["src"]
   }
 }
```

---

### `linters.<id>.args`

> Type: **`string[]`**
> Default: **`[]`**

Passes these native arguments to the linter unchanged.

```json
{
  "linters": {
    "struct-lint": {
      "args": ["--profile", "ci", "src"]
    }
  }
}
```

```sh
legibility --linter struct-lint --dry-run
```

```text
"struct-lint" "--profile" "ci" "src"
```

---

### `updates`

> Type: **`object`**
> Default: **`{"enabled":true,"manager":"brew","prompt":true}`**

Controls Homebrew update checks and prompts.

```json
{
  "updates": {
    "enabled": true,
    "manager": "brew",
    "prompt": true
  }
}
```

---

### `updates.enabled`

> Type: **`boolean`**
> Default: **`true`**

Allows automatic checks and the explicit `legibility update` command. Set to `false` to skip both.

```diff
 "updates": {
-  "enabled": true
+  "enabled": false
 }
```

---

### `updates.manager`

> Type: **`"brew"`**
> Default: **`"brew"`**

Selects the package manager for native linter updates. Homebrew is the only supported manager.

```json
{
  "updates": {
    "manager": "brew"
  }
}
```

---

### `updates.prompt`

> Type: **`boolean`**
> Default: **`true`**

Asks before refreshing metadata and selecting or applying updates. Set to `false` to allow eligible checks to update without prompts.

Example `legibility.json`:

```json
{
  "$schema": "https://unpkg.com/legibility/src/schema.json",
  "languages": ["typescript"],
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

---

## Linters

These standalone Legibility commands are registered by the CLI. Configure each ID under `linters`.
Each Legibility config below is a complete `.legibilityrc`. The commands preview the invocation; remove `--dry-run` to execute it with the underlying tool installed.

### `fs-lint`

> Command: **`fs-lint`** – Languages: **all detected languages**

Checks file and path policy. Define the native policy in `fs-lint.json` ([reference](https://github.com/yowainwright/fs-lint#configuration)):

```json
{
  "version": 1,
  "newFiles": {
    "default": "deny",
    "allow": ["src/**"]
  }
}
```

In `.legibilityrc`, select staged additions and rename destinations:

```json
{
  "linters": {
    "fs-lint": {
      "args": ["check", "--staged"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter fs-lint --dry-run
```

Preview output:

```text
"fs-lint" "check" "--staged"
```

---

### `src-lint`

> Command: **`src-lint`** – Languages: **JavaScript, TypeScript, Python, Go, Proto**

Checks import boundary policy.

Check a `services/` directory using the tool's [default boundaries](https://github.com/yowainwright/src-lint#what-it-checks):

```json
{
  "linters": {
    "src-lint": {
      "args": ["check", "services", "--strict"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter src-lint --dry-run
```

Preview output:

```text
"src-lint" "check" "services" "--strict"
```

---

### `struct-lint`

> Command: **`struct-lint`** – Languages: **all detected languages**

Checks declaration and function order.

Use the [CI profile](https://github.com/yowainwright/struct-lint#usage) to report ordering violations as errors:

```json
{
  "linters": {
    "struct-lint": {
      "args": ["--profile", "ci", "src"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter struct-lint --dry-run
```

Preview output:

```text
"struct-lint" "--profile" "ci" "src"
```

---

## Plugins

Configure these integrations under `linters`. Each entry lists the command Legibility invokes.
Each Legibility config below is a complete `.legibilityrc`. Install the integration and configure its native rules before executing checks.

### `eslint-plugin-legibility`

> Command: **`eslint`** – Languages: **JavaScript, TypeScript**

Provides readability rules for [ESLint](https://github.com/yowainwright/eslint-plugin-legibility).

Load the plugin in `eslint.config.js`:

```js
import legibility from "eslint-plugin-legibility";

export default [legibility.configs["flat/recommended"]];
```

Then configure the invocation in `.legibilityrc`:

```json
{
  "linters": {
    "eslint-plugin-legibility": {
      "args": ["src", "--max-warnings", "0"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter eslint-plugin-legibility --dry-run
```

Preview output:

```text
"eslint" "src" "--max-warnings" "0"
```

---

### `oxlint-plugin-legibility`

> Command: **`oxlint`** – Languages: **JavaScript, TypeScript**

Provides readability rules for [Oxlint](https://github.com/yowainwright/oxlint-plugin-legibility).

Load a rule in `.oxlintrc.json`:

```json
{
  "jsPlugins": [{ "name": "legibility", "specifier": "oxlint-plugin-legibility" }],
  "rules": {
    "legibility/no-quadratic-patterns": "error"
  }
}
```

Then configure the invocation in `.legibilityrc`:

```json
{
  "linters": {
    "oxlint-plugin-legibility": {
      "args": ["src", "--deny-warnings"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter oxlint-plugin-legibility --dry-run
```

Preview output:

```text
"oxlint" "src" "--deny-warnings"
```

---

### `go-lint-legibility`

> Command: **`go-lint-legibility`** – Languages: **Go**

Provides Go readability rules through the [Go module](https://github.com/yowainwright/go-lint-legibility).

Install and run the standalone command:

```sh
go install github.com/yowainwright/go-lint-legibility/cmd/go-lint-legibility@latest
go-lint-legibility ./...
```

To run the same check through Legibility, save this `.legibilityrc`:

```json
{
  "linters": {
    "go-lint-legibility": {
      "args": ["./..."]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter go-lint-legibility --dry-run
```

Preview output:

```text
"go-lint-legibility" "./..."
```

The module also supports an optional `golangci-lint` plugin build; see its [setup instructions](https://github.com/yowainwright/go-lint-legibility#golangci-lint-plugin).

---

### `ruff-legibility`

> Command: **`ruff-legibility`** – Languages: **Python**

Checks Python readability with [ruff-legibility](https://github.com/yowainwright/ruff-legibility), a separate tool run alongside Ruff.

Configure the separate checker in `.legibilityrc`:

```json
{
  "linters": {
    "ruff-legibility": {
      "args": ["check", "src"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter ruff-legibility --dry-run
```

Preview output:

```text
"ruff-legibility" "check" "src"
```

---

### `shellcheck-legibility`

> Command: **`shellcheck-legibility`** – Languages: **Shell**

Provides Shell readability checks ([project](https://github.com/yowainwright/shellcheck_legibility)).

Check shell files in `scripts/` with this `.legibilityrc`:

```json
{
  "linters": {
    "shellcheck-legibility": {
      "args": ["check", "scripts"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter shellcheck-legibility --dry-run
```

Preview output:

```text
"shellcheck-legibility" "check" "scripts"
```

---

### `sqlfluff-plugin-legibility`

> Command: **`sqlfluff`** – Languages: **SQL**

Checks SQL and Jinja comment policy ([project](https://github.com/yowainwright/sqlfluff-plugin-legibility)).

SQLFluff discovers the installed plugin. Select its rules in `.sqlfluff`, using the dialect appropriate for your project:

```ini
[sqlfluff]
dialect = ansi
rules = Legibility_L001, Legibility_L002
```

Configure the invocation in `.legibilityrc`:

```json
{
  "linters": {
    "sqlfluff-plugin-legibility": {
      "args": ["lint", "queries"]
    }
  }
}
```

```sh
legibility --config .legibilityrc --linter sqlfluff-plugin-legibility --dry-run
```

Preview output:

```text
"sqlfluff" "lint" "queries"
```

Rule mappings and language coverage are in the [shared rule catalog](docs/rules.md).

---

## Performance targets

Measurements are from one local environment and are not guarantees. Targets describe planned work for a later CLI iteration.

### CLI startup

> Current: **20–30 ms in the measured environment**

Startup is already quick. Lazy loading the rule catalog is not a release target unless later measurements show it matters.

---

### Setup scan

> Target: **under 3 seconds** on a representative large repository

Setup uses an ignore-aware file inventory, fixed filename and extension lookups, bounded path samples, and up to eight concurrent manifest reads ([diagnosis](src/lib/diagnose/index.ts), [file inventory](src/lib/diagnose/utils.ts)). Git projects use Git's file inventory; non-Git projects apply local `.gitignore` rules during traversal. The earlier 6–14 second measurement predates this implementation.

---

### Homebrew check

> Current: **5.5 seconds** before linting in the measured interactive run
> Target: **check at most once a week by default**

Eligible interactive runs check for updates before linting ([`checkForUpdates`](src/cli/index.ts#L593)). The planned weekly interval will be configurable in project config and via a CLI option. No interval setting or option exists yet; `updates` currently controls enablement, manager, and prompting.

---

### Linter concurrency

> Current: **sequential**
> Target: **a small bounded parallel limit by default**

Linters run one at a time ([`runLinters`](src/cli/index.ts#L811)). The planned parallel limit will be adjustable in project config and via a CLI option. Concurrency is not configurable yet, and the default limit is undecided.

---

### Run feedback

> Current: **per-linter duration is visible with `--verbose`**
> Target: **compact per-linter progress and a clear summary, using pastels**

Legibility currently forwards native linter output directly. The agreed summary and pastel progress output are not part of the current CLI yet.

---

## Exit status

> Type: **process exit status**

- `0` – successful setup, update, preview, or linter run.
- `2` – CLI, configuration, or process-start error.
- `130` – interactive prompt cancelled.
- The first non-zero linter status passes through unchanged. Setup and explicit update commands may also return child-process statuses.

Because child statuses pass through, a linter may also return `2`; the exit status alone does not always identify whether Legibility or a linter failed.

---

## Agent skill

The npm package includes [`skills/legibility-workflow/SKILL.md`](skills/legibility-workflow/SKILL.md). Agent integrations can install it as a project skill to route setup and check execution through the CLI.

---

## Development

Use Node.js 26 and pnpm for development. The package supports Node.js 24 and newer.

```sh
pnpm install
pnpm run check
pnpm test
pnpm run test:e2e
```

---

## License

This project is licensed under the [MIT License](LICENSE).
