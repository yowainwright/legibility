# Legibility

[![CI](https://github.com/yowainwright/legibility/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/yowainwright/legibility/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/release/yowainwright/legibility?label=version)](https://github.com/yowainwright/legibility/releases/latest)
[![License: MIT](https://img.shields.io/github/license/yowainwright/legibility)](LICENSE)

Legibility is a group of CLI tools for helping agents and humans write more readable code. All plugins and linters in the Legibility stack can be used standalone or via this CLI.

## Preface

Over the last year, code has largely shifted from human-written to AI-written. Agentic skills help enforce clear patterns, but another way is small linters and plugins. The goal of the rules in these tools is to stay hands-off – enforcing rules that make it easier to read thousands of lines of code a day, maybe 10s of PRs.

---

This README documents the initial CLI contract for the Legibility CLI, which helps set up legibility tools as a group of linters and plugins, or each tool on its own. This project is new. Commands and configuration will change, but backwards compatibility is a priority. We'll try to reserve major releases for big changes.

## Install

For stable releases, install with Homebrew:

```sh
brew install yowainwright/tap/legibility
```

Or, via a JS distro:

```sh
npm install legibility -g
```

Homebrew installs a native binary and does not require Node.js. The npm package requires Node.js 24 or newer.

## Run

From a project directory, start guided setup or run the discovered configuration:

```sh
legibility
```

In a terminal, setup detects project languages, offers supported linters, previews selected commands, and asks before saving `legibility.json` or running them. Without a terminal, provide an existing configuration.

Preview configured commands without running linters:

```sh
legibility --dry-run
```

Hosted linters like ESLint and Oxlint stay project-managed dependencies. Setup can offer Homebrew installation for supported native linters.

## CLI API

Full reference: run `legibility --help`.

The examples below assume `legibility` is on `PATH`.

### `legibility`

> Type: **`command`**

Runs enabled linters from the discovered project configuration. If no configuration is found in a terminal, Legibility starts guided setup, previews the selected commands, and asks before saving `legibility.json` or running a linter. Without a terminal, provide a configuration explicitly.

```sh
legibility
legibility --dry-run
```

Use `--dry-run` to inspect selected linter commands before execution.

### `legibility update`

> Type: **`command`**

Refreshes Homebrew metadata and offers updates for supported Homebrew-backed linters. An eligible interactive run also checks for Homebrew linter updates before linting.

```sh
legibility update
```

Use this to update linters without running the project's checks. See [`updates` configuration](#updates) for prompt and enablement behavior.

With the default `updates.prompt: true`, `legibility update` requires an interactive terminal. Set [`updates.prompt`](#updatesprompt) to `false` for non-interactive updates.

### `legibility rules [--search <terms>]`

> Type: **`command`**

Searches the shared rule catalog. Search terms use AND matching across rule content and mappings.

```sh
legibility rules --search "function length"
```

Use this to find a rule by ID, name, description, example, language, or tool. The [shared rule catalog](docs/rules.md) documents rule mappings and coverage.

#### `--search <terms>`

> Type: **`string option`**

Filters `rules` results. Every space-separated term must match; matching is case-insensitive. Without this option, Legibility prints the rule count and a search hint.

```sh
legibility rules --search "function length"
```

### `legibility rule <id>`

> Type: **`command`**

Shows rule details and a language/plugin mapping. Add `--language` or `--plugin` to select a mapping. Add `--enable` to enable a supported Oxlint mapping; use `--dry-run` to preview the edit.

```sh
legibility rule LEG038 --language javascript --plugin oxlint
legibility rule LEG038 --language javascript --plugin oxlint --enable --dry-run
```

Automatic edits support simple Oxlint JSON and JSONC configs. Inherited, overridden, nested, and TypeScript configs are reported as unsupported.

#### `--language <name>`

> Type: **`string option`**

Filters rule details to a language mapping. Use a language ID or label.

```sh
legibility rule LEG038 --language typescript
```

#### `--plugin <name>`

> Type: **`string option`**

Filters rule details to a plugin mapping.

```sh
legibility rule LEG038 --plugin oxlint
```

#### `--enable`

> Type: **`boolean option`**
> Default: **`false`**

Enables the selected supported rule mapping in a simple Oxlint JSON or JSONC configuration. Requires both `--language` and `--plugin`. Use `--dry-run` to preview the edit.

```sh
legibility rule LEG038 --language javascript --plugin oxlint --enable --dry-run
```

### `--config <path>`, `-c`

> Type: **`string option`**
> Default: **discover config from the current directory and parents; start setup if none is found in a terminal**

Reads a JSON Legibility config or a `package.json` with a `legibility` object. Legibility reports an error if automatic discovery finds more than one config.

```sh
legibility --config packages/app/legibility.json --dry-run
```

Use this when a config is outside the current directory's parent chain, or to select one explicitly.

### `--linter <id>`

> Type: **`string[] option`**
> Default: **all enabled linters in the config**

Selects configured linters. Repeat the option to select more than one.

```sh
legibility --linter oxlint-plugin-legibility --dry-run
legibility --linter fs-lint --linter src-lint
```

### `-- <native-args>`

> Type: **`string[] argument`**

Passes remaining arguments to one selected linter, after its configured arguments. Legibility rejects native arguments when multiple linters are selected.

```sh
legibility --linter oxlint-plugin-legibility -- --deny-warnings
```

### `--dry-run`

> Type: **`boolean option`**
> Default: **`false`**

Prints selected linter commands or previews a supported rule edit without running linters or writing the edit. Also skips the automatic Homebrew update check. `legibility update --dry-run` is not supported.

```sh
legibility --dry-run
```

### `--help`, `-h`, `--version`, `-v`

> Type: **`boolean options`**

Prints the CLI reference or installed version.

```sh
legibility --help
legibility --version
```

### `--verbose`

> Type: **`boolean option`**
> Default: **`false`**

Prints diagnostic logs to stderr while leaving native linter output on its original streams.

```sh
legibility --verbose
```

### `--styleguide`

> Type: **`boolean option`**

Opens an interactive tour of the setup prompts. Does not save configuration, install tools, update Homebrew, or run linters.

```sh
legibility --styleguide
```

## Configuration

Legibility reads JSON configuration from a file or from `package.json#legibility`.

### Config Files

> Type: **`.legibilityrc` | `legibility.json` | `package.json#legibility`**

Legibility searches the current directory and its parents. It stops with an error if it finds more than one config. Use `--config` to select a file explicitly.

### `$schema`

> Type: **`string`**

Points editors to Legibility's JSON Schema.

```json
{
  "$schema": "https://unpkg.com/legibility/src/schema.json"
}
```

### `version`

> Type: **`integer`**
> Default: **`1`**

Identifies the configuration format version.

### `languages`

> Type: **`object`**
> Default: **`{}`**

Stores language IDs detected during guided setup. The CLI currently uses configured linter IDs to decide what runs.

### `linters`

> Type: **`object`**
> Required: **yes**

Maps supported linter IDs to their settings. A run needs at least one enabled linter.

### `linters.<id>.enabled`

> Type: **`boolean`**
> Default: **`true`**

Runs the configured linter unless set to `false`.

### `linters.<id>.args`

> Type: **`string[]`**
> Default: **`[]`**

Passes these native arguments to the linter unchanged.

### `updates`

> Type: **`object`**
> Default: **`{"enabled":true,"manager":"brew","prompt":true}`**

Controls Homebrew-backed linter updates. See the fields below for current behavior.

### `updates.enabled`

> Type: **`boolean`**
> Default: **`true`**

Allows automatic checks and the explicit `legibility update` command. Set to `false` to skip both.

### `updates.manager`

> Type: **`"brew"`**
> Default: **`"brew"`**

Selects the package manager for native linter updates. Homebrew is the only supported manager.

### `updates.prompt`

> Type: **`boolean`**
> Default: **`true`**

Asks before refreshing metadata and selecting or applying updates. Set to `false` to allow eligible checks to update without prompts.

Example `legibility.json`:

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

## Linters

These standalone Legibility commands are registered by the CLI. Configure each ID under `linters`.

### `fs-lint`

> Command: **`fs-lint`** – Languages: **all detected languages**

Checks file and path policy.

### `src-lint`

> Command: **`src-lint`** – Languages: **JavaScript, TypeScript, Python, Go, Proto**

Checks import boundary policy.

### `struct-lint`

> Command: **`struct-lint`** – Languages: **all detected languages**

Checks declaration and function order.

## Plugins

These plugin integrations are registered by the CLI. Configure each ID under `linters`; the command listed is the host linter Legibility invokes.

### `eslint-plugin-legibility`

> Command: **`eslint`** – Languages: **JavaScript, TypeScript**

Provides readability rules for [ESLint](https://github.com/yowainwright/eslint-plugin-legibility).

### `oxlint-plugin-legibility`

> Command: **`oxlint`** – Languages: **JavaScript, TypeScript**

Provides readability rules for [Oxlint](https://github.com/yowainwright/oxlint-plugin-legibility).

### `golangci-lint-legibility`

> Command: **`golangci-lint`** – Languages: **Go**

Provides readability analyzers for [golangci-lint](https://github.com/yowainwright/golangci-lint-legibility).

### `ruff-legibility`

> Command: **`ruff`** – Languages: **Python**

Provides readability rules for [Ruff](https://github.com/yowainwright/ruff-legibility).

### `shellcheck-legibility`

> Command: **`shellcheck-legibility`** – Languages: **Shell**

Provides Shell readability checks ([project](https://github.com/yowainwright/shellcheck_legibility)).

### `sqlfluff-plugin-legibility`

> Command: **`sqlfluff`** – Languages: **SQL**

Checks SQL and Jinja comment policy ([project](https://github.com/yowainwright/sqlfluff-plugin-legibility)).

Rule mappings and language coverage are in the [shared rule catalog](docs/rules.md).

## Performance targets

Measurements below are from one local environment – not performance guarantees. The configurable behavior in this section is agreed work for a later CLI iteration and is not in the current API.

### CLI startup

> Current: **20–30 ms in the measured environment**

Startup is already quick. Lazy loading the rule catalog is not a release target unless later measurements show it matters.

### Setup scan

> Current: **6–14 seconds** in large directories
> Target: **under 3 seconds** on a representative large repository

Language detection currently copies a language's path array for every matched file and does not read `.gitignore` ([`recordLanguageFile`](src/cli/index.ts#L393), [`readFiles`](src/cli/index.ts#L375)). The target is linear counting, retaining only the count and a few sample paths, while respecting Git ignores and existing generated-directory exclusions.

### Homebrew check

> Current: **5.5 seconds** before linting in the measured interactive run
> Target: **check at most once a week by default**

The current check runs before linting on eligible interactive runs ([`checkForUpdates`](src/cli/index.ts#L593)). The weekly interval should be configurable in project config and via a CLI option. No interval setting or CLI option exists yet; the current `updates` config controls enablement, manager, and prompting only.

### Linter concurrency

> Current: **sequential**
> Target: **a small bounded parallel limit by default**

The current run waits for each linter before starting the next ([`runLinters`](src/cli/index.ts#L811)). The limit should be adjustable in project config and via a CLI option. No concurrency setting exists yet, and the numeric default is still undecided.

### Run feedback

> Current: **per-linter duration is visible with `--verbose`**
> Target: **compact per-linter progress and a clear summary, using pastels**

Legibility currently forwards native linter output directly. The agreed summary and pastel progress output are not part of the current CLI yet.

## Exit status

> Type: **process exit status**

- `0` – successful setup, update, preview, or linter run.
- `2` – CLI, configuration, or process-start error.
- `130` – interactive prompt cancelled.
- The first non-zero linter status passes through unchanged. Setup and explicit update commands may also return child-process statuses.

Because child statuses pass through, a linter may also return `2`; the exit status alone does not always identify whether Legibility or a linter failed.

## Agent skill

The npm package includes [`skills/legibility-workflow/SKILL.md`](skills/legibility-workflow/SKILL.md). Agent integrations can install it as a project skill to route setup and check execution through the CLI.

## Development

Use Node.js 26 and pnpm for development. The package supports Node.js 24 and newer.

```sh
pnpm install
pnpm run check
pnpm test
pnpm run test:e2e
```
