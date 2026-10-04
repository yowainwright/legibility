# Legibility rules

Shared rule specification for the Legibility CLI, site, and package READMEs. Maintain this document in `legibility/docs/rules.md`.

Begun September 27, 2026; moved here October 1, 2026. Source links use reviewed revisions where available and a newer pinned commit for relocated public files. The source inventory records the original review. References marked unpublished are local evidence awaiting publication.

Linked tables: [all rules](#all-rules), [definitions by language](#rules-by-language), [coverage by language](#coverage-by-language), and [examples and types for each rule](#rule-details). Rule IDs connect the tables.

Go IDs and names are the baseline. Additional IDs begin at LEG054. LEG054–LEG069 reuse Clang's existing draft assignments; further IDs are proposed here in existing Python-then-Shell inventory order. These are documentation mappings, not changes already made to plugin selectors. Old names are intended compatibility aliases; conflicting old numeric IDs require migration.

One shared standard applies across languages: the same rule concept uses the same ID, name, and general description. Language-specific definitions, examples, native-linter mappings, and justified applicability differences belong in the linked language tables. Additional languages should reuse this catalog rather than establish independent rule names or numbering.

Default planning workflow: assign a new rule's shared ID and name in this catalog before adding it to a plugin. Exceptions are possible; this is a default practice, not an absolute prerequisite.

Each linter retains its own configuration schema. Types below describe existing rule-definition fields/options. Current values are source context, not agreed shared defaults. Database storage and default harmonization are deferred.

Scope: every custom rule listed by the seven plugin catalogs, plus Clang's registered comment check and documented native equivalents. Native checks covering a shared requirement appear in that requirement's existing rows. Other host checks remain in [Native companion checks](#native-companion-checks) with their native IDs. Coverage tables explicitly account for every rule in every listed language; unknown applicability is marked not yet assessed.

Topic tags use a shared vocabulary: `control-flow`, `expressions`, `functions`, `collections`, `naming`, `comments`, `files`, `side-effects`, `error-handling`, `testing`, `script-structure`, and `complexity`. Each rule has one or more tags in the all-rules table.

Clang evidence includes uncommitted local work. Native coverage was checked on September 29, 2026; see [versions, tests, and limits](#native-coverage-verification). Other implementation and gap labels remain based on local source and coverage notes. Examples are copied from source docs or fixtures, except labeled illustrations; only explicitly recorded tests have been rerun for this catalog.

## All rules

| ID                | Name                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            | Topics                                      | Languages / definitions                                                                                                                                                                                                                              |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [LEG001](#leg001) | `max-expression-operators`             | Limit operators inside a single expression.                                                                                                                                                                                                                                                                                                                                                                                                            | `expressions`, `complexity`                 | [C](#leg001-c-clang); [C++](#leg001-cplusplus-clang); [Go](#leg001-go-go); [JavaScript / TypeScript](#leg001-javascript-typescript-eslint); [Python](#leg001-python-python); [Shell](#leg001-shell-shell)                                            |
| [LEG002](#leg002) | `hoist-if-operators`                   | Prefer named booleans before operator-heavy conditions.                                                                                                                                                                                                                                                                                                                                                                                                | `control-flow`, `expressions`               | [C](#leg002-c-clang); [C++](#leg002-cplusplus-clang); [Go](#leg002-go-go); [JavaScript / TypeScript](#leg002-javascript-typescript-eslint); [Python](#leg002-python-python); [Shell](#leg002-shell-shell)                                            |
| [LEG003](#leg003) | `max-control-flow-depth`               | Limit nested control-flow depth.                                                                                                                                                                                                                                                                                                                                                                                                                       | `control-flow`, `complexity`                | [C](#leg003-c-clang); [C++](#leg003-cplusplus-clang); [Go](#leg003-go-go); [JavaScript / TypeScript](#leg003-javascript-typescript-eslint); [Python](#leg003-python-python); [Shell](#leg003-shell-shell)                                            |
| [LEG005](#leg005) | `no-quadratic-patterns`                | Flag likely quadratic nested loops.                                                                                                                                                                                                                                                                                                                                                                                                                    | `collections`, `complexity`                 | [C](#leg005-c-clang); [C++](#leg005-cplusplus-clang); [Go](#leg005-go-go); [JavaScript / TypeScript](#leg005-javascript-typescript-eslint); [Python](#leg005-python-python); [Shell](#leg005-shell-shell)                                            |
| [LEG006](#leg006) | `no-redundant-boolean-logic`           | Avoid redundant boolean comparisons.                                                                                                                                                                                                                                                                                                                                                                                                                   | `expressions`                               | [C](#leg006-c-clang); [C++](#leg006-cplusplus-clang); [Go](#leg006-go-go); [JavaScript / TypeScript](#leg006-javascript-typescript-eslint); [Python](#leg006-python-python)                                                                          |
| [LEG007](#leg007) | `prefer-positive-condition-names`      | Prefer positive condition names.                                                                                                                                                                                                                                                                                                                                                                                                                       | `naming`                                    | [C](#leg007-c-clang); [C++](#leg007-cplusplus-clang); [Go](#leg007-go-go); [JavaScript / TypeScript](#leg007-javascript-typescript-eslint); [Python](#leg007-python-python)                                                                          |
| [LEG008](#leg008) | `no-trivial-wrapper-functions`         | Avoid functions that only forward parameters to another call.                                                                                                                                                                                                                                                                                                                                                                                          | `functions`                                 | [C](#leg008-c-clang); [C++](#leg008-cplusplus-clang); [Go](#leg008-go-go); [JavaScript / TypeScript](#leg008-javascript-typescript-eslint); [Python](#leg008-python-python)                                                                          |
| [LEG009](#leg009) | `prefer-early-return`                  | Avoid else branches after a branch already exits.                                                                                                                                                                                                                                                                                                                                                                                                      | `control-flow`, `functions`                 | [C](#leg009-c-clang); [C++](#leg009-cplusplus-clang); [Go](#leg009-go-go); [JavaScript / TypeScript](#leg009-javascript-typescript-eslint); [Python](#leg009-python-python); [Shell](#leg009-shell-shell)                                            |
| [LEG010](#leg010) | `prefer-guard-clauses`                 | Prefer guard clauses over wrapping the main path in one large if block.                                                                                                                                                                                                                                                                                                                                                                                | `control-flow`, `functions`                 | [C](#leg010-c-clang); [C++](#leg010-cplusplus-clang); [Go](#leg010-go-go); [JavaScript / TypeScript](#leg010-javascript-typescript-eslint); [Python](#leg010-python-python); [Shell](#leg010-shell-shell)                                            |
| [LEG011](#leg011) | `max-array-chain-depth`                | Limit consecutive collection-style method chains.                                                                                                                                                                                                                                                                                                                                                                                                      | `collections`, `complexity`                 | [C++](#leg011-cplusplus-clang); [Go](#leg011-go-go); [JavaScript / TypeScript](#leg011-javascript-typescript-eslint); [Python](#leg011-python-python)                                                                                                |
| [LEG012](#leg012) | `no-computed-values`                   | Prefer named values before returning computed expressions.                                                                                                                                                                                                                                                                                                                                                                                             | `expressions`                               | [C](#leg012-c-clang); [C++](#leg012-cplusplus-clang); [Go](#leg012-go-go); [JavaScript / TypeScript](#leg012-javascript-typescript-eslint); [Python](#leg012-python-python)                                                                          |
| [LEG024](#leg024) | `prefer-object-lookup`                 | Prefer set or map lookups over long equality-or chains.                                                                                                                                                                                                                                                                                                                                                                                                | `collections`, `expressions`                | [C](#leg024-c-clang); [C++](#leg024-cplusplus-clang); [Go](#leg024-go-go); [JavaScript / TypeScript](#leg024-javascript-typescript-eslint); [Python](#leg024-python-python); [Shell](#leg024-shell-shell)                                            |
| [LEG025](#leg025) | `require-filename-matches-dirname`     | Opt-in. Require files in named subdirectories to match the directory name.                                                                                                                                                                                                                                                                                                                                                                             | `files`, `naming`                           | [Go](#leg025-go-go); [JavaScript / TypeScript](#leg025-javascript-typescript-eslint); [Python](#leg025-python-python); [Shell](#leg025-shell-shell)                                                                                                  |
| [LEG026](#leg026) | `no-mixed-filename-casing`             | Avoid filenames that mix casing conventions.                                                                                                                                                                                                                                                                                                                                                                                                           | `files`, `naming`                           | [C++](#leg026-cplusplus-clang); [Go](#leg026-go-go); [JavaScript / TypeScript](#leg026-javascript-typescript-eslint); [Python](#leg026-python-python); [Shell](#leg026-shell-shell)                                                                  |
| [LEG031](#leg031) | `no-deep-selector-chain`               | Avoid deep selector or index chains without named intermediate values.                                                                                                                                                                                                                                                                                                                                                                                 | `expressions`, `complexity`                 | [C](#leg031-c-clang); [C++](#leg031-cplusplus-clang); [Go](#leg031-go-go); [Python](#leg031-python-python)                                                                                                                                           |
| [LEG034](#leg034) | `prefer-switch-over-long-if-chain`     | Prefer switch over long if chains that compare the same value.                                                                                                                                                                                                                                                                                                                                                                                         | `control-flow`, `expressions`, `complexity` | [C](#leg034-c-clang); [C++](#leg034-cplusplus-clang); [Go](#leg034-go-go); [Shell](#leg034-shell-shell)                                                                                                                                              |
| [LEG035](#leg035) | `no-bool-literal-args`                 | Avoid boolean literals as call arguments.                                                                                                                                                                                                                                                                                                                                                                                                              | `functions`, `expressions`                  | [C](#leg035-c-clang); [C++](#leg035-cplusplus-clang); [Go](#leg035-go-go); [Shell](#leg035-shell-shell); [Python](#leg035-python-ruff)                                                                                                               |
| [LEG036](#leg036) | `no-complex-if-init`                   | Avoid combining an if initializer with an operator-heavy condition.                                                                                                                                                                                                                                                                                                                                                                                    | `control-flow`, `expressions`               | [C++](#leg036-cplusplus-clang); [Go](#leg036-go-go)                                                                                                                                                                                                  |
| [LEG037](#leg037) | `no-deep-composite-literal-arg`        | Avoid deeply nested composite literals as call arguments.                                                                                                                                                                                                                                                                                                                                                                                              | `functions`, `collections`, `complexity`    | [C++](#leg037-cplusplus-clang); [Go](#leg037-go-go)                                                                                                                                                                                                  |
| [LEG038](#leg038) | `max-function-lines`                   | Limit functions to a focused line budget.                                                                                                                                                                                                                                                                                                                                                                                                              | `functions`, `complexity`                   | [C](#leg038-c-clang); [C++](#leg038-cplusplus-clang); [Go](#leg038-go-go); [JavaScript / TypeScript](#leg038-javascript-typescript-eslint); [Shell](#leg038-shell-shell)                                                                             |
| [LEG039](#leg039) | `no-unmatched-comments`                | Policy opt-in. Reject comments without an allowed matcher or boundary identifier.                                                                                                                                                                                                                                                                                                                                                                      | `comments`                                  | [C](#leg039-c-clang); [C++](#leg039-cplusplus-clang); [Go](#leg039-go-go); [JavaScript / TypeScript](#leg039-javascript-typescript-eslint); [Python](#leg039-python-python); [SQL / Jinja](#leg039-sql-jinja-sqlfluff); [Shell](#leg039-shell-shell) |
| [LEG040](#leg040) | `no-automated-comment-attribution`     | Reject explicit automated source signatures in comments.                                                                                                                                                                                                                                                                                                                                                                                               | `comments`                                  | [C](#leg040-c-clang); [C++](#leg040-cplusplus-clang); [Go](#leg040-go-go); [JavaScript / TypeScript](#leg040-javascript-typescript-eslint); [Shell](#leg040-shell-shell)                                                                             |
| [LEG041](#leg041) | `prefer-line-comments`                 | Prefer `//` comments for ordinary multiline prose.                                                                                                                                                                                                                                                                                                                                                                                                     | `comments`                                  | [Go](#leg041-go-go)                                                                                                                                                                                                                                  |
| [LEG042](#leg042) | `no-getter-prefix`                     | Avoid the `Get` prefix on accessor names.                                                                                                                                                                                                                                                                                                                                                                                                              | `naming`, `functions`                       | [Go](#leg042-go-go)                                                                                                                                                                                                                                  |
| [LEG043](#leg043) | `no-underscore-names`                  | Prefer `MixedCaps` over underscores in declared names.                                                                                                                                                                                                                                                                                                                                                                                                 | `naming`                                    | [Go](#leg043-go-go)                                                                                                                                                                                                                                  |
| [LEG044](#leg044) | `prefer-initialism-casing`             | Keep initialisms such as `ID` and `URL` fully capitalized.                                                                                                                                                                                                                                                                                                                                                                                             | `naming`                                    | [Go](#leg044-go-go)                                                                                                                                                                                                                                  |
| [LEG045](#leg045) | `no-package-name-stutter`              | Avoid repeating the package name in exported names.                                                                                                                                                                                                                                                                                                                                                                                                    | `naming`                                    | [Go](#leg045-go-go)                                                                                                                                                                                                                                  |
| [LEG046](#leg046) | `no-generic-package-names`             | Avoid catch-all package names such as `util` or `common`.                                                                                                                                                                                                                                                                                                                                                                                              | `naming`                                    | [Go](#leg046-go-go)                                                                                                                                                                                                                                  |
| [LEG047](#leg047) | `prefer-range-loop`                    | Prefer a range clause over an index counter loop.                                                                                                                                                                                                                                                                                                                                                                                                      | `collections`, `control-flow`               | [C++](#leg047-cplusplus-clang); [Go](#leg047-go-go)                                                                                                                                                                                                  |
| [LEG048](#leg048) | `no-redundant-break`                   | Remove trailing `break` statements from case clauses.                                                                                                                                                                                                                                                                                                                                                                                                  | `control-flow`                              | [C](#leg048-c-clang); [C++](#leg048-cplusplus-clang); [Go](#leg048-go-go)                                                                                                                                                                            |
| [LEG049](#leg049) | `no-naked-returns`                     | Avoid naked returns outside short functions.                                                                                                                                                                                                                                                                                                                                                                                                           | `control-flow`, `functions`                 | [C](#leg049-c-clang); [C++](#leg049-cplusplus-clang); [Go](#leg049-go-go)                                                                                                                                                                            |
| [LEG050](#leg050) | `prefer-lowercase-error-strings`       | Prefer lowercase error strings without trailing punctuation.                                                                                                                                                                                                                                                                                                                                                                                           | `error-handling`                            | [Go](#leg050-go-go)                                                                                                                                                                                                                                  |
| [LEG051](#leg051) | `max-function-params`                  | Limit the number of parameters in a signature.                                                                                                                                                                                                                                                                                                                                                                                                         | `functions`, `complexity`                   | [C](#leg051-c-clang); [C++](#leg051-cplusplus-clang); [Go](#leg051-go-go); [JavaScript / TypeScript](#leg051-javascript-typescript-eslint); [Python](#leg051-python-ruff)                                                                            |
| [LEG052](#leg052) | `prefer-verb-function-names`           | Opt-in. Prefer action verbs at the start of function names.                                                                                                                                                                                                                                                                                                                                                                                            | `naming`, `functions`                       | [Go](#leg052-go-go)                                                                                                                                                                                                                                  |
| [LEG053](#leg053) | `prefer-boolean-prefixes`              | Opt-in. Prefer predicate or state prefixes for boolean names.                                                                                                                                                                                                                                                                                                                                                                                          | `naming`                                    | [Go](#leg053-go-go)                                                                                                                                                                                                                                  |
| [LEG054](#leg054) | `no-complex-ternaries`                 | Reject nested ternaries and operator-heavy ternaries.                                                                                                                                                                                                                                                                                                                                                                                                  | `expressions`, `control-flow`, `complexity` | [C](#leg054-c-clang); [C++](#leg054-cplusplus-clang); [JavaScript / TypeScript](#leg054-javascript-typescript-eslint); [Python](#leg054-python-python)                                                                                               |
| [LEG055](#leg055) | `no-hidden-side-effects`               | Keep mutations out of nested expressions and side-effect-free callbacks.                                                                                                                                                                                                                                                                                                                                                                               | `side-effects`                              | [C](#leg055-c-clang); [C++](#leg055-cplusplus-clang); [JavaScript / TypeScript](#leg055-javascript-typescript-eslint); [Python](#leg055-python-python)                                                                                               |
| [LEG056](#leg056) | `no-identity-array-callback`           | Reject `map` and `filter` callbacks that keep every item unchanged.                                                                                                                                                                                                                                                                                                                                                                                    | `collections`, `expressions`                | [C++](#leg056-cplusplus-clang); [JavaScript / TypeScript](#leg056-javascript-typescript-eslint); [Python](#leg056-python-python)                                                                                                                     |
| [LEG057](#leg057) | `no-repeated-collection-search`        | Flag repeated searches over the same collection in one scope.                                                                                                                                                                                                                                                                                                                                                                                          | `collections`, `complexity`                 | [C++](#leg057-cplusplus-clang); [JavaScript / TypeScript](#leg057-javascript-typescript-eslint); [Python](#leg057-python-python)                                                                                                                     |
| [LEG058](#leg058) | `no-single-use-renaming-alias`         | Avoid aliases that only rename another value for one use.                                                                                                                                                                                                                                                                                                                                                                                              | `naming`, `expressions`                     | [C](#leg058-c-clang); [C++](#leg058-cplusplus-clang); [JavaScript / TypeScript](#leg058-javascript-typescript-eslint); [Python](#leg058-python-python)                                                                                               |
| [LEG059](#leg059) | `no-small-collection-conversion`       | Avoid converting a statically small array or string into a `Map` or `Set` for one immediate lookup. Named collections, dynamic inputs, and literal inputs at the threshold are unchanged.                                                                                                                                                                                                                                                              | `collections`, `complexity`                 | [C++](#leg059-cplusplus-clang); [JavaScript / TypeScript](#leg059-javascript-typescript-eslint)                                                                                                                                                      |
| [LEG060](#leg060) | `no-standalone-array-mutations`        | Prefer explicit returned array composition over standalone array mutation statements.                                                                                                                                                                                                                                                                                                                                                                  | `collections`, `side-effects`               | [C++](#leg060-cplusplus-clang); [JavaScript / TypeScript](#leg060-javascript-typescript-eslint); [Python](#leg060-python-python)                                                                                                                     |
| [LEG061](#leg061) | `no-stacked-comments`                  | Reject comments on consecutive lines. A blank line between comments is allowed.                                                                                                                                                                                                                                                                                                                                                                        | `comments`                                  | [C](#leg061-c-clang); [C++](#leg061-cplusplus-clang); [JavaScript / TypeScript](#leg061-javascript-typescript-eslint); [Python](#leg061-python-python); [SQL / Jinja](#leg061-sql-jinja-sqlfluff); [Shell](#leg061-shell-shell)                      |
| [LEG062](#leg062) | `prefer-flat-map`                      | Prefer `flatMap` over `map(...).flat()`.                                                                                                                                                                                                                                                                                                                                                                                                               | `collections`                               | [C++](#leg062-cplusplus-clang); [JavaScript / TypeScript](#leg062-javascript-typescript-eslint)                                                                                                                                                      |
| [LEG063](#leg063) | `no-direct-bin-smoke`                  | Smoke-test the installed command instead of invoking its source entry point directly.                                                                                                                                                                                                                                                                                                                                                                  | `testing`, `script-structure`               | [JavaScript / TypeScript](#leg063-javascript-typescript-eslint); [Python](#leg063-python-python); [Shell](#leg063-shell-shell)                                                                                                                       |
| [LEG064](#leg064) | `no-redundant-nullish-fallback`        | Avoid `?? undefined` fallbacks. Static `void` operands are evaluated within a bounded BigInt budget. Expressions that could create unusually large BigInt values are ignored.                                                                                                                                                                                                                                                                          | `expressions`                               | [JavaScript / TypeScript](#leg064-javascript-typescript-eslint)                                                                                                                                                                                      |
| [LEG065](#leg065) | `require-jsdoc-multiline-comments`     | Require block comments spanning multiple lines to use `/** ... */` JSDoc syntax. Line comments and single-line block comments are unchanged. This formatting rule does not permit agents to add comments. During an agent session, `npx lint-changed --comments=forbid` rejects every added comment, including separated comments. Outside that session policy, ESLint and Oxlint can autofix this rule by adding the missing `*` to the block opener. | `comments`                                  | [JavaScript / TypeScript](#leg065-javascript-typescript-eslint)                                                                                                                                                                                      |
| [LEG066](#leg066) | `no-unnecessary-async`                 | Flag async functions that have no await, only return one awaited value, or only await Node filesystem operations with synchronous equivalents. Filesystem detection covers named and namespace imports from `node:fs/promises`, `fs/promises`, `node:fs`, and `fs`. Use the filesystem diagnostic for local tooling and scripts. Non-blocking filesystem I/O remains appropriate in request-serving code.                                              | `functions`, `files`                        | [JavaScript / TypeScript](#leg066-javascript-typescript-eslint)                                                                                                                                                                                      |
| [LEG067](#leg067) | `no-unnecessary-block-callback`        | Prefer expression-bodied arrow callbacks when the callback block only returns.                                                                                                                                                                                                                                                                                                                                                                         | `functions`                                 | [JavaScript / TypeScript](#leg067-javascript-typescript-eslint)                                                                                                                                                                                      |
| [LEG068](#leg068) | `prefer-concat-object-assign`          | Report array and object literals containing spread when a project prefers method-based composition: - Array literal spread is reported in favor of `Array#concat`. - Object literal spread is reported in favor of `Object.assign` with a new target. - Function-call spread and rest syntax are unchanged. This rule has no options or autofix. Enable it explicitly:                                                                                 | `collections`, `side-effects`               | [JavaScript / TypeScript](#leg068-javascript-typescript-eslint); [Python](#leg068-python-python)                                                                                                                                                     |
| [LEG069](#leg069) | `require-executable-shebang`           | Require configured CLI entry source files to include a Node, Bun, or Deno shebang. This rule is opt-in because a common source index is not necessarily executable. Enable it only for actual command entry paths.                                                                                                                                                                                                                                     | `files`, `script-structure`                 | [JavaScript / TypeScript](#leg069-javascript-typescript-eslint); [Python](#leg069-python-python); [Shell](#leg069-shell-shell)                                                                                                                       |
| [LEG071](#leg071) | `no-unnecessary-lambda`                | Avoid lambdas that only forward their parameters to another callable.                                                                                                                                                                                                                                                                                                                                                                                  | `functions`                                 | [Python](#leg071-python-python)                                                                                                                                                                                                                      |
| [LEG072](#leg072) | `prefer-flat-comprehension`            | Prefer a flat comprehension over map followed by flattening.                                                                                                                                                                                                                                                                                                                                                                                           | `collections`                               | [Python](#leg072-python-python)                                                                                                                                                                                                                      |
| [LEG073](#leg073) | `no-redundant-none-fallback`           | Avoid fallback expressions that only return None unchanged.                                                                                                                                                                                                                                                                                                                                                                                            | `expressions`                               | [Python](#leg073-python-python)                                                                                                                                                                                                                      |
| [LEG074](#leg074) | `no-identity-comprehension`            | Avoid comprehensions that keep every item unchanged.                                                                                                                                                                                                                                                                                                                                                                                                   | `collections`                               | [Python](#leg074-python-python)                                                                                                                                                                                                                      |
| [LEG075](#leg075) | `prefer-comprehension-over-map-filter` | Prefer comprehensions over map/filter calls with lambdas.                                                                                                                                                                                                                                                                                                                                                                                              | `collections`                               | [Python](#leg075-python-python)                                                                                                                                                                                                                      |
| [LEG076](#leg076) | `no-loop-append-comprehension`         | Prefer comprehensions over simple list-building append loops.                                                                                                                                                                                                                                                                                                                                                                                          | `collections`                               | [Python](#leg076-python-python)                                                                                                                                                                                                                      |
| [LEG077](#leg077) | `no-repeated-comprehension-filter`     | Avoid filtering the same collection with comprehensions multiple times in one scope.                                                                                                                                                                                                                                                                                                                                                                   | `collections`, `complexity`                 | [Python](#leg077-python-python)                                                                                                                                                                                                                      |
| [LEG078](#leg078) | `prefer-named-exception-context`       | Prefer named context when wrapping or logging broad exceptions.                                                                                                                                                                                                                                                                                                                                                                                        | `error-handling`                            | [Python](#leg078-python-python)                                                                                                                                                                                                                      |
| [LEG079](#leg079) | `no-boolean-parameter-name-drift`      | Avoid positive boolean names assigned from inverted expressions.                                                                                                                                                                                                                                                                                                                                                                                       | `functions`, `naming`                       | [Python](#leg079-python-python)                                                                                                                                                                                                                      |
| [LEG081](#leg081) | `prefer-functions`                     | Prefer named functions over top-level script logic.                                                                                                                                                                                                                                                                                                                                                                                                    | `functions`, `script-structure`             | [Shell](#leg081-shell-shell)                                                                                                                                                                                                                         |
| [LEG082](#leg082) | `use-defaults-in-functions`            | Use defaulted or guarded positional args in functions.                                                                                                                                                                                                                                                                                                                                                                                                 | `functions`, `script-structure`             | [Shell](#leg082-shell-shell)                                                                                                                                                                                                                         |

## Rules by language

### Go

Coverage: [Go](#coverage-go).

| ID                      | Name                               | Description for this language                                                     | Types / definition                                                                                                                                                                                                             | Plugin / current selector                       |
| ----------------------- | ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| [LEG001](#leg001-go-go) | `max-expression-operators`         | Limit operators inside a single expression.                                       | `max-expression-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                 | Go: `LEG001 / max-expression-operators`         |
| [LEG002](#leg002-go-go) | `hoist-if-operators`               | Prefer named booleans before operator-heavy conditions.                           | `max-if-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                         | Go: `LEG002 / hoist-if-operators`               |
| [LEG003](#leg003-go-go) | `max-control-flow-depth`           | Limit nested control-flow depth.                                                  | `max-control-flow-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                   | Go: `LEG003 / max-control-flow-depth`           |
| [LEG005](#leg005-go-go) | `no-quadratic-patterns`            | Flag likely quadratic nested loops.                                               | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG005 / no-quadratic-patterns`            |
| [LEG006](#leg006-go-go) | `no-redundant-boolean-logic`       | Avoid redundant boolean comparisons.                                              | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG006 / no-redundant-boolean-logic`       |
| [LEG007](#leg007-go-go) | `prefer-positive-condition-names`  | Prefer positive condition names.                                                  | `negative-condition-name-pattern: string`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                    | Go: `LEG007 / prefer-positive-condition-names`  |
| [LEG008](#leg008-go-go) | `no-trivial-wrapper-functions`     | Avoid functions that only forward parameters to another call.                     | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG008 / no-trivial-wrapper-functions`     |
| [LEG009](#leg009-go-go) | `prefer-early-return`              | Avoid else branches after a branch already exits.                                 | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG009 / prefer-early-return`              |
| [LEG010](#leg010-go-go) | `prefer-guard-clauses`             | Prefer guard clauses over wrapping the main path in one large if block.           | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG010 / prefer-guard-clauses`             |
| [LEG011](#leg011-go-go) | `max-array-chain-depth`            | Limit consecutive collection-style method chains.                                 | `max-array-chain-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                    | Go: `LEG011 / max-array-chain-depth`            |
| [LEG012](#leg012-go-go) | `no-computed-values`               | Prefer named values before returning computed expressions.                        | `max-computed-value-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                             | Go: `LEG012 / no-computed-values`               |
| [LEG024](#leg024-go-go) | `prefer-object-lookup`             | Prefer set or map lookups over long equality-or chains.                           | `min-object-lookup-chain-length: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                           | Go: `LEG024 / prefer-object-lookup`             |
| [LEG025](#leg025-go-go) | `require-filename-matches-dirname` | Opt-in. Require files in named subdirectories to match the directory name.        | `min-dirname-match-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                  | Go: `LEG025 / require-filename-matches-dirname` |
| [LEG026](#leg026-go-go) | `no-mixed-filename-casing`         | Avoid filenames that mix casing conventions.                                      | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG026 / no-mixed-filename-casing`         |
| [LEG031](#leg031-go-go) | `no-deep-selector-chain`           | Avoid deep selector or index chains without named intermediate values.            | `max-selector-chain-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                 | Go: `LEG031 / no-deep-selector-chain`           |
| [LEG034](#leg034-go-go) | `prefer-switch-over-long-if-chain` | Prefer switch over long if chains that compare the same value.                    | `min-switch-chain-length: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                  | Go: `LEG034 / prefer-switch-over-long-if-chain` |
| [LEG035](#leg035-go-go) | `no-bool-literal-args`             | Avoid boolean literals as call arguments.                                         | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG035 / no-bool-literal-args`             |
| [LEG036](#leg036-go-go) | `no-complex-if-init`               | Avoid combining an if initializer with an operator-heavy condition.               | `max-if-init-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                    | Go: `LEG036 / no-complex-if-init`               |
| [LEG037](#leg037-go-go) | `no-deep-composite-literal-arg`    | Avoid deeply nested composite literals as call arguments.                         | `max-composite-literal-arg-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                          | Go: `LEG037 / no-deep-composite-literal-arg`    |
| [LEG038](#leg038-go-go) | `max-function-lines`               | Limit functions to a focused line budget.                                         | `max-function-lines: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                       | Go: `LEG038 / max-function-lines`               |
| [LEG039](#leg039-go-go) | `no-unmatched-comments`            | Policy opt-in. Reject comments without an allowed matcher or boundary identifier. | `comment-matchers: string[]`; `comment-prefix-identifiers: string[]`; `comment-suffix-identifiers: string[]`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) | Go: `LEG039 / no-unmatched-comments`            |
| [LEG040](#leg040-go-go) | `no-automated-comment-attribution` | Reject explicit automated source signatures in comments.                          | `automated-comment-identifiers: string[]`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                    | Go: `LEG040 / no-automated-comment-attribution` |
| [LEG041](#leg041-go-go) | `prefer-line-comments`             | Prefer `//` comments for ordinary multiline prose.                                | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG041 / prefer-line-comments`             |
| [LEG042](#leg042-go-go) | `no-getter-prefix`                 | Avoid the `Get` prefix on accessor names.                                         | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG042 / no-getter-prefix`                 |
| [LEG043](#leg043-go-go) | `no-underscore-names`              | Prefer `MixedCaps` over underscores in declared names.                            | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG043 / no-underscore-names`              |
| [LEG044](#leg044-go-go) | `prefer-initialism-casing`         | Keep initialisms such as `ID` and `URL` fully capitalized.                        | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG044 / prefer-initialism-casing`         |
| [LEG045](#leg045-go-go) | `no-package-name-stutter`          | Avoid repeating the package name in exported names.                               | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG045 / no-package-name-stutter`          |
| [LEG046](#leg046-go-go) | `no-generic-package-names`         | Avoid catch-all package names such as `util` or `common`.                         | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG046 / no-generic-package-names`         |
| [LEG047](#leg047-go-go) | `prefer-range-loop`                | Prefer a range clause over an index counter loop.                                 | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG047 / prefer-range-loop`                |
| [LEG048](#leg048-go-go) | `no-redundant-break`               | Remove trailing `break` statements from case clauses.                             | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG048 / no-redundant-break`               |
| [LEG049](#leg049-go-go) | `no-naked-returns`                 | Avoid naked returns outside short functions.                                      | `max-naked-return-lines: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                   | Go: `LEG049 / no-naked-returns`                 |
| [LEG050](#leg050-go-go) | `prefer-lowercase-error-strings`   | Prefer lowercase error strings without trailing punctuation.                      | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG050 / prefer-lowercase-error-strings`   |
| [LEG051](#leg051-go-go) | `max-function-params`              | Limit the number of parameters in a signature.                                    | `max-function-params: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                      | Go: `LEG051 / max-function-params`              |
| [LEG052](#leg052-go-go) | `prefer-verb-function-names`       | Opt-in. Prefer action verbs at the start of function names.                       | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG052 / prefer-verb-function-names`       |
| [LEG053](#leg053-go-go) | `prefer-boolean-prefixes`          | Opt-in. Prefer predicate or state prefixes for boolean names.                     | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                    | Go: `LEG053 / prefer-boolean-prefixes`          |

### JavaScript / TypeScript

Coverage: [JavaScript](#coverage-javascript), [TypeScript](#coverage-typescript).

| ID                                             | Name                               | Description for this language                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Types / definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Plugin / current selector                                                                                      |
| ---------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [LEG001](#leg001-javascript-typescript-eslint) | `max-expression-operators`         | Limit operators inside one expression.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | - `{max: number}`: allowed weighted operators. Default: `4`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ESLint: `legibility/max-expression-operators`                                                                  |
| [LEG001](#leg001-javascript-typescript-oxlint) | `max-expression-operators`         | Limit operators inside one expression.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | - `{max: number}`: allowed weighted operators. Default: `4`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Oxlint: `legibility/max-expression-operators`                                                                  |
| [LEG002](#leg002-javascript-typescript-eslint) | `hoist-if-operators`               | Prefer a named boolean before an operator-heavy `if` condition.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | - `{max: number}`: allowed weighted operators in the condition. Default: `0`. - `{operators: string[]}`: operators to count. Default: `["&&", "\|\|", "??", "?:"]`. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ESLint: `legibility/hoist-if-operators`                                                                        |
| [LEG002](#leg002-javascript-typescript-oxlint) | `hoist-if-operators`               | Prefer a named boolean before an operator-heavy `if` condition.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | - `{max: number}`: allowed weighted operators in the condition. Default: `0`. - `{operators: string[]}`: operators to count. Default: `["&&", "\|\|", "??", "?:"]`. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Oxlint: `legibility/hoist-if-operators`                                                                        |
| [LEG003](#leg003-javascript-typescript-eslint) | `max-control-flow-depth`           | Limit nested branches and loops.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | - `{max: number}`: allowed nested control-flow depth. Default: `3`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ESLint: `legibility/max-control-flow-depth`                                                                    |
| [LEG003](#leg003-javascript-typescript-oxlint) | `max-control-flow-depth`           | Limit nested branches and loops.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | - `{max: number}`: allowed nested control-flow depth. Default: `3`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Oxlint: `legibility/max-control-flow-depth`                                                                    |
| [LEG005](#leg005-javascript-typescript-eslint) | `no-quadratic-patterns`            | Flag nested loops, nested array iteration, and collection searches inside loop bodies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | - `{iterationMethods: string[]}`: methods checked for nested iteration. - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ESLint: `legibility/no-quadratic-patterns`                                                                     |
| [LEG005](#leg005-javascript-typescript-oxlint) | `no-quadratic-patterns`            | Flag nested loops, nested array iteration, and collection searches inside loop bodies, repeated conditions, and updates. One-time loop initializers and iterable expressions are excluded. Known strings are excluded using the same checks as `no-repeated-collection-search`; array and unknown receivers remain checked.                                                                                                                                                                                                                                                                                                                                                                                 | - `{iterationMethods: string[]}`: methods checked for nested iteration. - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Oxlint: `legibility/no-quadratic-patterns`                                                                     |
| [LEG006](#leg006-javascript-typescript-eslint) | `no-redundant-boolean-logic`       | Avoid boolean comparisons and boolean-only ternaries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | - `{equalityOperators: string[]}`: operators checked for comparisons against `true` or `false`. Default: `["==", "===", "!=", "!=="]`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | ESLint: `legibility/no-redundant-boolean-logic`                                                                |
| [LEG006](#leg006-javascript-typescript-oxlint) | `no-redundant-boolean-logic`       | Avoid comparisons against booleans when the other expression is provably boolean. Simplify boolean-only ternaries with `!!condition` or `!condition` to preserve their result type.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | - `{equalityOperators: string[]}`: operators checked for comparisons against `true` or `false`. Default: `["==", "===", "!=", "!=="]`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Oxlint: `legibility/no-redundant-boolean-logic`                                                                |
| [LEG007](#leg007-javascript-typescript-eslint) | `prefer-positive-condition-names`  | Prefer positive boolean names over names like `isNotReady`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | - `{booleanOperators: string[]}`: binary operators that mark an initializer as boolean-like.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ESLint: `legibility/prefer-positive-condition-names`                                                           |
| [LEG007](#leg007-javascript-typescript-oxlint) | `prefer-positive-condition-names`  | Prefer positive boolean names over names like `isNotReady`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | - `{booleanOperators: string[]}`: binary operators that mark an initializer as boolean-like.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Oxlint: `legibility/prefer-positive-condition-names`                                                           |
| [LEG008](#leg008-javascript-typescript-eslint) | `no-trivial-wrapper-functions`     | Avoid wrappers that only forward their parameters to another call.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-trivial-wrapper-functions`                                                              |
| [LEG008](#leg008-javascript-typescript-oxlint) | `no-trivial-wrapper-functions`     | Avoid wrappers that only forward their parameters to another call.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-trivial-wrapper-functions`                                                              |
| [LEG009](#leg009-javascript-typescript-eslint) | `prefer-early-return`              | Avoid `else` branches after an `if` branch already exits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/prefer-early-return`                                                                       |
| [LEG009](#leg009-javascript-typescript-oxlint) | `prefer-early-return`              | Avoid `else` branches after an `if` branch already exits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/prefer-early-return`                                                                       |
| [LEG010](#leg010-javascript-typescript-eslint) | `prefer-guard-clauses`             | Prefer guard clauses over wrapping a whole function body in one branch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/prefer-guard-clauses`                                                                      |
| [LEG010](#leg010-javascript-typescript-oxlint) | `prefer-guard-clauses`             | Prefer guard clauses over wrapping a whole function body in one branch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/prefer-guard-clauses`                                                                      |
| [LEG011](#leg011-javascript-typescript-eslint) | `max-array-chain-depth`            | Limit chained array methods like `items.filter().map().some()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | - `{max: number}`: allowed chained items. Default: `2`. - `{iterationMethods: string[]}`: method names that count as chain items.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ESLint: `legibility/max-array-chain-depth`                                                                     |
| [LEG011](#leg011-javascript-typescript-oxlint) | `max-array-chain-depth`            | Limit chained array methods like `items.filter().map().some()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | - `{max: number}`: allowed chained items. Default: `2`. - `{iterationMethods: string[]}`: method names that count as chain items.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Oxlint: `legibility/max-array-chain-depth`                                                                     |
| [LEG012](#leg012-javascript-typescript-eslint) | `no-computed-values`               | Prefer named values before computed returns and object values.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | - `{max: number}`: allowed weighted operators in a computed value. Default: `1`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights. - `{objectValues: "computed" \| "named"}`: object value mode. Default: `"computed"`. - `{returnValues: "computed" \| "named"}`: return value mode. Default: `"computed"`. Use `"named"` mode to require a named identifier or literal before object construction and returns.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                         | ESLint: `legibility/no-computed-values`                                                                        |
| [LEG012](#leg012-javascript-typescript-oxlint) | `no-computed-values`               | Prefer named values before computed returns and object values.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | - `{max: number}`: allowed weighted operators in a computed value. Default: `1`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights. - `{objectValues: "computed" \| "named"}`: object value mode. Default: `"computed"`. - `{returnValues: "computed" \| "named"}`: return value mode. Default: `"computed"`. Use `"named"` mode to require a named identifier, literal, or `this` before object construction and returns. Destructuring bindings and their defaults are excluded; computed values inside an object created by a default are still checked.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                               | Oxlint: `legibility/no-computed-values`                                                                        |
| [LEG024](#leg024-javascript-typescript-eslint) | `prefer-object-lookup`             | Prefer `Set`, `Map`, or object lookups over long equality `\|\|` chains.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | - `{min: number}`: equality checks required before reporting. Default: `3`. - `{operators: string[]}`: equality operators that count. Default: `["==", "==="]`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ESLint: `legibility/prefer-object-lookup`                                                                      |
| [LEG024](#leg024-javascript-typescript-oxlint) | `prefer-object-lookup`             | Prefer `Set`, `Map`, or object lookups over long equality `\|\|` chains.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | - `{min: number}`: equality checks required before reporting. Default: `3`. - `{operators: string[]}`: equality operators that count. Default: `["==", "==="]`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Oxlint: `legibility/prefer-object-lookup`                                                                      |
| [LEG025](#leg025-javascript-typescript-eslint) | `require-filename-matches-dirname` | Require filenames to match an explicitly selected schema. The rule is not included in a preset because projects must choose `dirname`, `index`, or a custom schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | - `{schema: "dirname" \| "index" \| "custom"}`: required filename schema. - `{minDepth: number}`: minimum parent depth to check. Default: `3`. - `{allowedQualifiers: string[]}`: `dirname` schema suffixes. - `{allowedFilenames: string[]}`: `dirname` schema standalone basenames. - `{patterns: string[]}`: required exact basenames for a `custom` schema. Use `{dirname}` as the parent-directory placeholder. The rule ignores the final JavaScript or TypeScript extension, so the same schema covers `.js`, `.jsx`, `.ts`, and `.tsx` files.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                 | ESLint: `legibility/require-filename-matches-dirname`                                                          |
| [LEG025](#leg025-javascript-typescript-oxlint) | `require-filename-matches-dirname` | Require filenames to match an explicitly selected schema. The rule is not included in a preset because projects must choose `dirname`, `index`, or a custom schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | - `{schema: "dirname" \| "index" \| "custom"}`: required filename schema. - `{minDepth: number}`: minimum parent depth to check. Default: `3`. - `{allowedQualifiers: string[]}`: `dirname` schema suffixes. - `{allowedFilenames: string[]}`: `dirname` schema standalone basenames. - `{patterns: string[]}`: required exact basenames for a `custom` schema. Use `{dirname}` as the parent-directory placeholder. The rule ignores the final JavaScript or TypeScript extension, so the same schema covers `.js`, `.jsx`, `.ts`, and `.tsx` files.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                 | Oxlint: `legibility/require-filename-matches-dirname`                                                          |
| [LEG026](#leg026-javascript-typescript-eslint) | `no-mixed-filename-casing`         | Use one filename convention: kebab-case, camelCase, PascalCase, or snake_case. Leading dots and file extensions are ignored. This rule has no options. It rejects conventions mixed within one filename; it does not require every file in the project to use the same convention. For example, `user-profile.ts`, `userProfile.ts`, `UserProfile.ts`, and `user_profile.ts` are all valid.                                                                                                                                                                                                                                                                                                                 | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-mixed-filename-casing`                                                                  |
| [LEG026](#leg026-javascript-typescript-oxlint) | `no-mixed-filename-casing`         | Use one filename convention: kebab-case, camelCase, PascalCase, or snake_case. Leading dots and file extensions are ignored. This rule has no options. It rejects conventions mixed within one filename; it does not require every file in the project to use the same convention. For example, `user-profile.ts`, `userProfile.ts`, `UserProfile.ts`, and `user_profile.ts` are all valid.                                                                                                                                                                                                                                                                                                                 | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-mixed-filename-casing`                                                                  |
| [LEG038](#leg038-javascript-typescript-eslint) | `max-function-lines`               | Limit function length using the host linter's native rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `max: number`; `skipBlankLines: boolean`; `skipComments: boolean`; `IIFEs: boolean`; [Preset](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/index.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ESLint: [`max-lines-per-function`](https://eslint.org/docs/latest/rules/max-lines-per-function)                |
| [LEG038](#leg038-javascript-typescript-oxlint) | `max-function-lines`               | Limit function length using the host linter's native rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `max: number`; `skipBlankLines: boolean`; `skipComments: boolean`; `IIFEs: boolean`; [Preset](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/index.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Oxlint: [`max-lines-per-function`](https://oxc.rs/docs/guide/usage/linter/rules/eslint/max-lines-per-function) |
| [LEG039](#leg039-javascript-typescript-eslint) | `no-unmatched-comments`            | Allow only comments that match an explicit pattern, prefix, or suffix. With no options, the rule rejects every line and block comment. Executable shebangs are ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | - `matchers`: case-insensitive regular expressions matched against the comment body. - `prefixIdentifiers`: case-insensitive identifiers allowed at the start of a comment. - `suffixIdentifiers`: case-insensitive identifiers allowed at the end of a comment. All options accept string arrays and default to empty arrays. The three options are independent allow paths. Matching ignores comment delimiters, surrounding whitespace, and leading JSDoc stars. Invalid regular expressions and empty identifiers never match. The rule has no autofix.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                           | ESLint: `legibility/no-unmatched-comments`                                                                     |
| [LEG039](#leg039-javascript-typescript-oxlint) | `no-unmatched-comments`            | Allow only comments that match an explicit pattern, prefix, or suffix. With no options, the rule rejects every line and block comment. Executable shebangs are ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | - `matchers`: case-insensitive regular expressions matched against the comment body. - `prefixIdentifiers`: case-insensitive identifiers allowed at the start of a comment. - `suffixIdentifiers`: case-insensitive identifiers allowed at the end of a comment. All options accept string arrays and default to empty arrays. The three options are independent allow paths. Matching ignores comment delimiters, surrounding whitespace, and leading JSDoc stars. Invalid or potentially unsafe regular expressions and empty identifiers never match. Matcher lists accept at most 16 expressions, each at most 256 characters long; regex matching is limited to the first 1024 characters of a comment. The rule has no autofix.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) | Oxlint: `legibility/no-unmatched-comments`                                                                     |
| [LEG040](#leg040-javascript-typescript-eslint) | `no-automated-comment-attribution` | Reject comments that explicitly attribute authorship to an automated tool. The rule detects configured identifiers in attribution tags, `generated by <identifier>`, and `<identifier>-generated`. It does not classify unmarked prose.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | - `{identifiers: string[]}`: case-insensitive names treated as automated sources. Default: `ai`, `chatgpt`, `claude`, `codex`, `copilot`, `gemini`, `gpt`, `llm`, and `openai`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ESLint: `legibility/no-automated-comment-attribution`                                                          |
| [LEG040](#leg040-javascript-typescript-oxlint) | `no-automated-comment-attribution` | Reject comments that explicitly attribute authorship to an automated tool. The rule detects configured identifiers in attribution tags, `generated by <identifier>`, and `<identifier>-generated`. It does not classify unmarked prose.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | - `{identifiers: string[]}`: case-insensitive names treated as automated sources. Default: `ai`, `chatgpt`, `claude`, `codex`, `copilot`, `gemini`, `gpt`, `llm`, and `openai`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Oxlint: `legibility/no-automated-comment-attribution`                                                          |
| [LEG051](#leg051-javascript-typescript-eslint) | `max-function-params`              | Limit the inputs a function exposes. The rule checks both top-level parameters and the properties listed by each destructured object parameter. TypeScript ambient declarations and function types are checked. A leading TypeScript `this` parameter is ignored because callers do not supply it.                                                                                                                                                                                                                                                                                                                                                                                                          | - `{max: number}`: allowed top-level parameters. Default: `4`. - `{maxObjectProperties: number}`: allowed properties in one destructured object parameter. Default: `8`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ESLint: `legibility/max-function-parameters`                                                                   |
| [LEG051](#leg051-javascript-typescript-oxlint) | `max-function-params`              | Limit the inputs a function exposes. The rule checks both top-level parameters and the properties listed by each destructured object parameter. TypeScript ambient declarations and function types are checked. A leading TypeScript `this` parameter is ignored because callers do not supply it.                                                                                                                                                                                                                                                                                                                                                                                                          | - `{max: number}`: allowed top-level parameters. Default: `4`. - `{maxObjectProperties: number}`: allowed properties in one destructured object parameter. Default: `8`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Oxlint: `legibility/max-function-parameters`                                                                   |
| [LEG054](#leg054-javascript-typescript-eslint) | `no-complex-ternaries`             | Reject nested ternaries and operator-heavy ternaries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | - `{max: number}`: allowed weighted operators inside one ternary. Default: `2`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ESLint: `legibility/no-complex-ternaries`                                                                      |
| [LEG054](#leg054-javascript-typescript-oxlint) | `no-complex-ternaries`             | Reject nested ternaries and operator-heavy ternaries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | - `{max: number}`: allowed weighted operators inside one ternary. Default: `2`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Oxlint: `legibility/no-complex-ternaries`                                                                      |
| [LEG055](#leg055-javascript-typescript-eslint) | `no-hidden-side-effects`           | Keep mutations out of nested expressions and side-effect-free callbacks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | - `{mutatingMethods: string[]}`: method calls treated as mutations. - `{sideEffectFreeIterationMethods: string[]}`: callback methods expected to stay side-effect-free.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ESLint: `legibility/no-hidden-side-effects`                                                                    |
| [LEG055](#leg055-javascript-typescript-oxlint) | `no-hidden-side-effects`           | Keep mutations out of nested expressions and side-effect-free callbacks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | - `{mutatingMethods: string[]}`: method calls treated as mutations. - `{sideEffectFreeIterationMethods: string[]}`: callback methods expected to stay side-effect-free.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Oxlint: `legibility/no-hidden-side-effects`                                                                    |
| [LEG056](#leg056-javascript-typescript-eslint) | `no-identity-array-callback`       | Reject `map` and `filter` callbacks that keep every item unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-identity-array-callback`                                                                |
| [LEG056](#leg056-javascript-typescript-oxlint) | `no-identity-array-callback`       | Reject `map` and `filter` callbacks that keep every item unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-identity-array-callback`                                                                |
| [LEG057](#leg057-javascript-typescript-eslint) | `no-repeated-collection-search`    | Flag repeated searches over the same collection in one scope.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | ESLint: `legibility/no-repeated-collection-search`                                                             |
| [LEG057](#leg057-javascript-typescript-oxlint) | `no-repeated-collection-search`    | Flag repeated searches over the same collection in one scope. String literals, template literals, `const` bindings initialized with either, and bindings annotated as `string` are excluded. Substring searches cannot be replaced by array membership lookups.                                                                                                                                                                                                                                                                                                                                                                                                                                             | - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Oxlint: `legibility/no-repeated-collection-search`                                                             |
| [LEG058](#leg058-javascript-typescript-eslint) | `no-single-use-renaming-alias`     | Avoid aliases that only rename another value for one use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-single-use-renaming-alias`                                                              |
| [LEG058](#leg058-javascript-typescript-oxlint) | `no-single-use-renaming-alias`     | Avoid aliases that only rename another value for one use. A member value named for a direct return, such as `const value = item.value; return value;`, is allowed so this rule agrees with `no-computed-values`. Identifier renames and member aliases passed to other functions remain checked.                                                                                                                                                                                                                                                                                                                                                                                                            | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-single-use-renaming-alias`                                                              |
| [LEG059](#leg059-javascript-typescript-eslint) | `no-small-collection-conversion`   | Avoid converting a statically small array or string into a `Map` or `Set` for one immediate lookup. Named collections, dynamic inputs, and literal inputs at the threshold are unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | - `{min: number}`: minimum known input size before a lookup collection is useful. Default: `3`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ESLint: `legibility/no-small-collection-conversion`                                                            |
| [LEG059](#leg059-javascript-typescript-oxlint) | `no-small-collection-conversion`   | Avoid converting a statically small array or string into a `Map` or `Set` for one immediate lookup. Named collections, dynamic inputs, and literal inputs at the threshold are unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | - `{min: number}`: minimum known input size before a lookup collection is useful. Default: `3`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Oxlint: `legibility/no-small-collection-conversion`                                                            |
| [LEG060](#leg060-javascript-typescript-eslint) | `no-standalone-array-mutations`    | Prefer explicit returned array composition over standalone array mutation statements.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | - `{arrayMutatingMethods: string[]}`: array methods reported when used as standalone mutations. - `{mutatingMethods: string[]}`: mutation methods used to identify fresh mutation targets.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | ESLint: `legibility/no-standalone-array-mutations`                                                             |
| [LEG060](#leg060-javascript-typescript-oxlint) | `no-standalone-array-mutations`    | Prefer explicit returned array composition over standalone array mutation statements.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | - `{arrayMutatingMethods: string[]}`: array methods reported when used as standalone mutations. - `{mutatingMethods: string[]}`: mutation methods used to identify fresh mutation targets.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Oxlint: `legibility/no-standalone-array-mutations`                                                             |
| [LEG061](#leg061-javascript-typescript-eslint) | `no-stacked-comments`              | Reject comments on consecutive lines. A blank line between comments is allowed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-stacked-comments`                                                                       |
| [LEG061](#leg061-javascript-typescript-oxlint) | `no-stacked-comments`              | Reject comments on consecutive lines. A blank line between comments is allowed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-stacked-comments`                                                                       |
| [LEG062](#leg062-javascript-typescript-eslint) | `prefer-flat-map`                  | Prefer `flatMap` over `map(...).flat()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/prefer-flat-map`                                                                           |
| [LEG062](#leg062-javascript-typescript-oxlint) | `prefer-flat-map`                  | Prefer `flatMap` over `map(...).flat()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/prefer-flat-map`                                                                           |
| [LEG063](#leg063-javascript-typescript-eslint) | `no-direct-bin-smoke`              | Smoke-test installed package bins instead of direct `node src/index.js` execution.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | - `{entryPatterns: string[]}`: entry files that should be tested through the installed bin shim.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ESLint: `legibility/no-direct-node-bin-smoke`                                                                  |
| [LEG063](#leg063-javascript-typescript-oxlint) | `no-direct-bin-smoke`              | Smoke-test installed package bins instead of direct `node src/index.js` execution.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | - `{entryPatterns: string[]}`: entry files that should be tested through the installed bin shim.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Oxlint: `legibility/no-direct-node-bin-smoke`                                                                  |
| [LEG064](#leg064-javascript-typescript-eslint) | `no-redundant-nullish-fallback`    | Avoid `?? undefined` fallbacks. Static `void` operands are evaluated within a bounded BigInt budget. Expressions that could create unusually large BigInt values are ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-redundant-nullish-fallback`                                                             |
| [LEG064](#leg064-javascript-typescript-oxlint) | `no-redundant-nullish-fallback`    | Avoid `?? undefined` fallbacks only when the left expression is provably never `null`. Keep `value ?? undefined` when it normalizes a possible `null`, and preserve locally bound `undefined` values. Static `void` operands are evaluated within a bounded BigInt budget. Expressions that could create unusually large BigInt values are ignored.                                                                                                                                                                                                                                                                                                                                                         | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-redundant-nullish-fallback`                                                             |
| [LEG065](#leg065-javascript-typescript-eslint) | `require-jsdoc-multiline-comments` | Require block comments spanning multiple lines to use `/** ... */` JSDoc syntax. Line comments and single-line block comments are unchanged. This formatting rule does not permit agents to add comments. During an agent session, `npx lint-changed --comments=forbid` rejects every added comment, including separated comments. Outside that session policy, ESLint and Oxlint can autofix this rule by adding the missing `*` to the block opener.                                                                                                                                                                                                                                                      | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/require-jsdoc-multiline-comments`                                                          |
| [LEG065](#leg065-javascript-typescript-oxlint) | `require-jsdoc-multiline-comments` | Require block comments spanning multiple lines to use `/** ... */` JSDoc syntax. Line comments and single-line block comments are unchanged. This formatting rule does not permit agents to add comments. During an agent session, `pnpm exec lint-changed --comments=forbid` rejects every added comment, including separated comments. Outside that session policy, Oxlint can autofix this rule by adding the missing `*` to the block opener.                                                                                                                                                                                                                                                           | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/require-jsdoc-multiline-comments`                                                          |
| [LEG066](#leg066-javascript-typescript-eslint) | `no-unnecessary-async`             | Flag async functions that have no await, only return one awaited value, or only await Node filesystem operations with synchronous equivalents. Filesystem detection covers named and namespace imports from `node:fs/promises`, `fs/promises`, `node:fs`, and `fs`. Use the filesystem diagnostic for local tooling and scripts. Non-blocking filesystem I/O remains appropriate in request-serving code.                                                                                                                                                                                                                                                                                                   | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-unnecessary-async`                                                                      |
| [LEG066](#leg066-javascript-typescript-oxlint) | `no-unnecessary-async`             | Flag async functions that only return one awaited value outside a `try` statement, or only await Node filesystem operations with synchronous equivalents. Functions without an await are unchanged because `async` preserves promise and error-handling semantics. Filesystem detection covers named and namespace imports from `node:fs/promises`, `fs/promises`, `node:fs`, and `fs`. Use the filesystem diagnostic for local tooling and scripts whose callers can accept synchronous results and errors. Non-blocking filesystem I/O remains appropriate in request-serving code. For a redundant `return await`, keep `async` and consider whether the await improves stack traces before removing it. | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-unnecessary-async`                                                                      |
| [LEG067](#leg067-javascript-typescript-eslint) | `no-unnecessary-block-callback`    | Prefer expression-bodied arrow callbacks when the callback block only returns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/no-unnecessary-block-callback`                                                             |
| [LEG067](#leg067-javascript-typescript-oxlint) | `no-unnecessary-block-callback`    | Prefer expression-bodied arrow callbacks when the callback block only returns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/no-unnecessary-block-callback`                                                             |
| [LEG068](#leg068-javascript-typescript-eslint) | `prefer-concat-object-assign`      | Report array and object literals containing spread when a project prefers method-based composition: - Array literal spread is reported in favor of `Array#concat`. - Object literal spread is reported in favor of `Object.assign` with a new target. - Function-call spread and rest syntax are unchanged. This rule has no options or autofix. Enable it explicitly:                                                                                                                                                                                                                                                                                                                                      | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ESLint: `legibility/prefer-concat-object-assign`                                                               |
| [LEG068](#leg068-javascript-typescript-oxlint) | `prefer-concat-object-assign`      | Report array and object literals containing spread when a project prefers method-based composition: - Array literal spread is reported in favor of `Array#concat`. - Object literal spread is reported in favor of `Object.assign` with a new target. - Function-call spread and rest syntax are unchanged. This rule has no options or autofix. Enable it explicitly:                                                                                                                                                                                                                                                                                                                                      | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Oxlint: `legibility/prefer-concat-object-assign`                                                               |
| [LEG069](#leg069-javascript-typescript-eslint) | `require-executable-shebang`       | Require configured CLI entry source files to include a Node, Bun, or Deno shebang. This rule is opt-in because a common source index is not necessarily executable. Enable it only for actual command entry paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | - `{files: string[]}`: source files expected to be executable entries. - `{runtimes: string[]}`: accepted shebang runtimes. Default: `["bun", "deno", "node"]`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ESLint: `legibility/require-executable-shebang`                                                                |
| [LEG069](#leg069-javascript-typescript-oxlint) | `require-executable-shebang`       | Require configured CLI entry source files to include a Node, Bun, or Deno shebang. This rule is opt-in because a common source index is not necessarily executable. Enable it only for actual command entry paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | - `{files: string[]}`: source files expected to be executable entries. - `{runtimes: string[]}`: accepted shebang runtimes. Default: `["bun", "deno", "node"]`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Oxlint: `legibility/require-executable-shebang`                                                                |

### Python

Coverage: [Python](#coverage-python).

| ID                              | Name                                   | Description for this language                                                                                  | Types / definition                                                                                                                                                                                                          | Plugin / current selector                                                             |
| ------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [LEG001](#leg001-python-python) | `max-expression-operators`             | Limit readability operators inside a single expression.                                                        | `max-expression-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                          | Python: `LEG001 / max-expression-operators`                                           |
| [LEG002](#leg002-python-python) | `hoist-if-operators`                   | Prefer named booleans before operator-heavy conditions.                                                        | `max-if-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                  | Python: `LEG002 / hoist-if-operators`                                                 |
| [LEG003](#leg003-python-python) | `max-control-flow-depth`               | Limit nested control-flow depth.                                                                               | `max-control-flow-depth: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                            | Python: `LEG003 / max-control-flow-depth`                                             |
| [LEG005](#leg005-python-python) | `no-quadratic-patterns`                | Flag likely quadratic loops and repeated searches.                                                             | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG005 / no-quadratic-patterns`                                              |
| [LEG006](#leg006-python-python) | `no-redundant-boolean-logic`           | Avoid redundant boolean comparisons.                                                                           | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG006 / no-redundant-boolean-logic`                                         |
| [LEG007](#leg007-python-python) | `prefer-positive-condition-names`      | Prefer positive condition names.                                                                               | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG007 / prefer-positive-condition-names`                                    |
| [LEG008](#leg008-python-python) | `no-trivial-wrapper-functions`         | Avoid functions that only forward their parameters to another call.                                            | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG008 / no-trivial-wrapper-functions`                                       |
| [LEG009](#leg009-python-python) | `prefer-early-return`                  | Avoid else branches after a branch that already exits.                                                         | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG009 / prefer-early-return`                                                |
| [LEG010](#leg010-python-python) | `prefer-guard-clauses`                 | Prefer guard clauses over wrapping the main path in one large if block.                                        | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG010 / prefer-guard-clauses`                                               |
| [LEG011](#leg011-python-python) | `max-array-chain-depth`                | Limit consecutive collection-style method chains.                                                              | `max-array-chain-depth: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                             | Python: `LEG011 / max-array-chain-depth`                                              |
| [LEG012](#leg012-python-python) | `no-computed-values`                   | Prefer named values before returning computed expressions or building dict values.                             | `max-computed-value-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                      | Python: `LEG012 / no-computed-values`                                                 |
| [LEG024](#leg024-python-python) | `prefer-object-lookup`                 | Prefer set or dict lookups over long equality-or chains.                                                       | `min-object-lookup-chain-length: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                    | Python: `LEG024 / prefer-object-lookup`                                               |
| [LEG025](#leg025-python-python) | `require-filename-matches-dirname`     | Require files in named subdirectories to match the directory name.                                             | `min-dirname-match-depth: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                           | Python: `LEG025 / require-filename-matches-dirname`                                   |
| [LEG026](#leg026-python-python) | `no-mixed-filename-casing`             | Avoid filenames that mix casing conventions.                                                                   | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG026 / no-mixed-filename-casing`                                           |
| [LEG031](#leg031-python-python) | `no-deep-selector-chain`               | Avoid deep subscript chains without named intermediate values.                                                 | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG031 / no-deep-subscript-chain`                                            |
| [LEG039](#leg039-python-python) | `no-unmatched-comments`                | Reject comments that do not match the configured allow patterns. Matching and stacking will be separate rules. | `comment-matchers: string[]`; `comment-prefix-identifiers: string[]`; `comment-suffix-identifiers: string[]`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) | Python: `LEG034 / no-unmatched-comments`                                              |
| [LEG054](#leg054-python-python) | `no-complex-ternaries`                 | Avoid complex ternary expressions.                                                                             | `max-ternary-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                             | Python: `LEG004 / no-complex-ternary`                                                 |
| [LEG055](#leg055-python-python) | `no-hidden-side-effects`               | Avoid mutations and assignment expressions hidden inside expressions.                                          | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG013 / no-hidden-side-effects`                                             |
| [LEG056](#leg056-python-python) | `no-identity-array-callback`           | Avoid map/filter callbacks that keep every item unchanged.                                                     | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG022 / no-identity-array-callback`                                         |
| [LEG057](#leg057-python-python) | `no-repeated-collection-search`        | Avoid repeated scans over the same collection in one scope.                                                    | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG018 / no-repeated-collection-search`                                      |
| [LEG058](#leg058-python-python) | `no-single-use-renaming-alias`         | Avoid aliases that only rename another value for one use.                                                      | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG019 / no-single-use-renaming-alias`                                       |
| [LEG060](#leg060-python-python) | `no-standalone-array-mutations`        | Avoid standalone list mutation calls when an expression is clearer.                                            | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG014 / no-standalone-array-mutations`                                      |
| [LEG061](#leg061-python-python) | `no-stacked-comments`                  | Planned separate rule rejecting consecutive comment lines. A per-function comment limit is outside LEG061.     | Definition pending split; existing comment-policy fields are in [Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py).                                                     | Python: currently bundled under `LEG034 / no-unmatched-comments`                      |
| [LEG068](#leg068-python-python) | `prefer-concat-object-assign`          | Prefer explicit collection composition over starred literal unpacking.                                         | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG015 / prefer-concat-object-assign`                                        |
| [LEG069](#leg069-python-python) | `require-executable-shebang`           | Require configured executable Python source files to start with a shebang.                                     | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG016 / require-executable-shebang`                                         |
| [LEG063](#leg063-python-python) | `no-direct-bin-smoke`                  | Prefer smoke-testing installed Python package entry points.                                                    | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG017 / no-direct-python-bin-smoke`                                         |
| [LEG071](#leg071-python-python) | `no-unnecessary-lambda`                | Avoid lambdas that only forward their parameters to another callable.                                          | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG020 / no-unnecessary-lambda`                                              |
| [LEG072](#leg072-python-python) | `prefer-flat-comprehension`            | Prefer a flat comprehension over map followed by flattening.                                                   | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG021 / prefer-flat-comprehension`                                          |
| [LEG073](#leg073-python-python) | `no-redundant-none-fallback`           | Avoid fallback expressions that only return None unchanged.                                                    | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG023 / no-redundant-none-fallback`                                         |
| [LEG074](#leg074-python-python) | `no-identity-comprehension`            | Avoid comprehensions that keep every item unchanged.                                                           | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG027 / no-identity-comprehension`                                          |
| [LEG075](#leg075-python-python) | `prefer-comprehension-over-map-filter` | Prefer comprehensions over map/filter calls with lambdas.                                                      | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG028 / prefer-comprehension-over-map-filter`                               |
| [LEG076](#leg076-python-python) | `no-loop-append-comprehension`         | Prefer comprehensions over simple list-building append loops.                                                  | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG029 / no-loop-append-comprehension`                                       |
| [LEG077](#leg077-python-python) | `no-repeated-comprehension-filter`     | Avoid filtering the same collection with comprehensions multiple times in one scope.                           | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG030 / no-repeated-comprehension-filter`                                   |
| [LEG078](#leg078-python-python) | `prefer-named-exception-context`       | Prefer named context when wrapping or logging broad exceptions.                                                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG032 / prefer-named-exception-context`                                     |
| [LEG079](#leg079-python-python) | `no-boolean-parameter-name-drift`      | Avoid positive boolean names assigned from inverted expressions.                                               | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                 | Python: `LEG033 / no-boolean-parameter-name-drift`                                    |
| [LEG035](#leg035-python-ruff)   | `no-bool-literal-args`                 | Report boolean positional arguments; keyword arguments and native allowed calls are exempt.                    | `lint.flake8-boolean-trap.extend-allowed-calls: string[]`; [settings](https://docs.astral.sh/ruff/settings/)                                                                                                                | Ruff: [`FBT003`](https://docs.astral.sh/ruff/rules/boolean-positional-value-in-call/) |
| [LEG051](#leg051-python-ruff)   | `max-function-params`                  | Limit function parameters with Ruff; native exemptions apply.                                                  | `lint.pylint.max-args: integer` (default 5); [settings](https://docs.astral.sh/ruff/settings/)                                                                                                                              | Ruff: [`PLR0913`](https://docs.astral.sh/ruff/rules/too-many-arguments/)              |

### Shell

Coverage: [Shell](#coverage-shell).

| ID                            | Name                               | Description for this language                                              | Types / definition                                                                                                                                                                                               | Plugin / current selector                          |
| ----------------------------- | ---------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [LEG001](#leg001-shell-shell) | `max-expression-operators`         | Limit `&&`, `\|\|`, and pipeline-heavy shell expressions.                  | `max-expression-operators: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                          | Shell: `LEG001 / max-expression-operators`         |
| [LEG002](#leg002-shell-shell) | `hoist-if-operators`               | Prefer named checks before operator-heavy conditions.                      | `max-if-operators: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                  | Shell: `LEG002 / hoist-if-operators`               |
| [LEG003](#leg003-shell-shell) | `max-control-flow-depth`           | Limit nested control flow.                                                 | `max-control-flow-depth: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                            | Shell: `LEG003 / max-control-flow-depth`           |
| [LEG005](#leg005-shell-shell) | `no-quadratic-patterns`            | Flag nested loops.                                                         | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG005 / no-quadratic-patterns`            |
| [LEG009](#leg009-shell-shell) | `prefer-early-return`              | Avoid `else` after a branch exits.                                         | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG009 / prefer-early-return`              |
| [LEG010](#leg010-shell-shell) | `prefer-guard-clauses`             | Prefer guard clauses inside functions.                                     | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG010 / prefer-guard-clauses`             |
| [LEG024](#leg024-shell-shell) | `prefer-object-lookup`             | Prefer `case` or lookup-style flow over repeated equality checks.          | `min-object-lookup-chain-length: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                    | Shell: `LEG024 / prefer-object-lookup`             |
| [LEG025](#leg025-shell-shell) | `require-filename-matches-dirname` | Require files in named subdirectories to match the directory name.         | `min-dirname-match-depth: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                           | Shell: `LEG025 / require-filename-matches-dirname` |
| [LEG026](#leg026-shell-shell) | `no-mixed-filename-casing`         | Avoid filenames that mix casing conventions.                               | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG026 / no-mixed-filename-casing`         |
| [LEG034](#leg034-shell-shell) | `prefer-switch-over-long-if-chain` | Prefer `case` over long `elif` chains comparing the same value.            | `min-case-chain-length: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                             | Shell: `LEG034 / prefer-case-over-long-if-chain`   |
| [LEG035](#leg035-shell-shell) | `no-bool-literal-args`             | Avoid boolean literal arguments.                                           | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG035 / no-bool-literal-args`             |
| [LEG038](#leg038-shell-shell) | `max-function-lines`               | Keep shell functions within a focused line budget.                         | `max-function-lines: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                | Shell: `LEG038 / max-function-lines`               |
| [LEG039](#leg039-shell-shell) | `no-unmatched-comments`            | Policy opt-in. Reject comments without a configured matcher or identifier. | `comment-matchers: string[]`; `comment-prefix-identifiers: string[]`; `comment-suffix-identifiers: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go) | Shell: `LEG041 / no-unmatched-comments`            |
| [LEG040](#leg040-shell-shell) | `no-automated-comment-attribution` | Policy opt-in. Reject explicit automated attribution signatures.           | `automated-comment-identifiers: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                    | Shell: `LEG042 / no-automated-comment-attribution` |
| [LEG061](#leg061-shell-shell) | `no-stacked-comments`              | Policy opt-in. Reject comments stacked on consecutive lines.               | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG043 / no-stacked-comments`              |
| [LEG069](#leg069-shell-shell) | `require-executable-shebang`       | Require executable shell entries to have a shebang.                        | `executable-entry-patterns: string[]`; `executable-runtimes: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                       | Shell: `LEG016 / require-executable-shebang`       |
| [LEG063](#leg063-shell-shell) | `no-direct-bin-smoke`              | Prefer installed-command smoke tests over direct shell entry files.        | `direct-shell-entry-patterns: string[]`; `executable-runtimes: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                     | Shell: `LEG017 / no-direct-shell-bin-smoke`        |
| [LEG081](#leg081-shell-shell) | `prefer-functions`                 | Prefer named functions over top-level script logic.                        | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG039 / prefer-functions`                 |
| [LEG082](#leg082-shell-shell) | `use-defaults-in-functions`        | Use defaulted or guarded positional args in functions.                     | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                    | Shell: `LEG040 / use-defaults-in-functions`        |

### SQL / Jinja

Coverage: [SQL](#coverage-sql), [Jinja](#coverage-jinja).

| ID                                   | Name                    | Description for this language                                              | Types / definition                                                                                                                                                                                                                                                                                | Plugin / current selector                                      |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [LEG039](#leg039-sql-jinja-sqlfluff) | `no-unmatched-comments` | Reject SQL/Jinja comments unless allowed by the configured comment policy. | comment_matchers, comment_prefix_identifiers, comment_suffix_identifiers, directive_matchers: comma-separated strings; parser also accepts string lists.; [BaseRule definitions](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/src/sqlfluff_plugin_legibility/rules.py) | SQLFluff: `Legibility_L001 / legibility.no_unmatched_comments` |
| [LEG061](#leg061-sql-jinja-sqlfluff) | `no-stacked-comments`   | Reject consecutive physical SQL/Jinja comments.                            | No rule-specific options.; [BaseRule definitions](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/src/sqlfluff_plugin_legibility/rules.py)                                                                                                                                | SQLFluff: `Legibility_L002 / legibility.no_stacked_comments`   |

### C

Coverage: [C](#coverage-c).

| ID                        | Name                               | Description for this language                                                                                                                                                                                                                                                                                                                                                       | Types / definition                                                                                                                                                                                                                                                                                                     | Plugin / current selector                                                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [LEG001](#leg001-c-clang) | `max-expression-operators`         | Limit operators inside one expression, including initializers, returns, conditions, and call arguments. Built-in `&&`, `\|\|`, `!`, comparisons, and `?:` each count once. Arithmetic and overloaded C++ operators do not count. Macro expansions and unevaluated `sizeof`/`noexcept` operands are excluded; lambda bodies are checked independently of their enclosing expression. | - `MaxOperators: unsigned integer`: allowed operators per expression. Default: `4`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                 | Clang: `legibility-max-expression-operators`                                                                                                                                                                                                              |
| [LEG002](#leg002-c-clang) | `hoist-if-operators`               | Prefer a named boolean before an operator-heavy `if` condition. Built-in `&&`, `\|\|`, and `?:` each count once; comparisons and negation do not count. Macro expansions, unevaluated `sizeof`/`noexcept` operands, and lambda bodies are excluded from the enclosing condition's count. C++ overloaded operators and `if constexpr` conditions are excluded.                       | - `MaxOperators: unsigned integer`: allowed logical or conditional operators in an `if` condition. Default: `0`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                    | Clang: `legibility-hoist-if-operators`                                                                                                                                                                                                                    |
| [LEG003](#leg003-c-clang) | `max-control-flow-depth`           | Limit nested control-flow depth.                                                                                                                                                                                                                                                                                                                                                    | `NestingThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html)                                                                                                                                       |
| [LEG005](#leg005-c-clang) | `no-quadratic-patterns`            | Flag likely quadratic nested loops.                                                                                                                                                                                                                                                                                                                                                 | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-quadratic-patterns`                                                                                                                                                                                                                 |
| [LEG006](#leg006-c-clang) | `no-redundant-boolean-logic`       | Reject built-in `==` or `!=` comparisons with literal booleans and, optionally, ternaries with opposite literal boolean branches. Named macros and overloaded C++ comparisons are excluded.                                                                                                                                                                                         | - `CheckTernaries: boolean`: also reject `condition ? true : false` and `condition ? false : true`. Default: `true`. Parity tests use `true` for the ESLint profile and `false` for the Go profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp) | Clang: `legibility-no-redundant-boolean-logic`                                                                                                                                                                                                            |
| [LEG007](#leg007-c-clang) | `prefer-positive-condition-names`  | Prefer positive condition names.                                                                                                                                                                                                                                                                                                                                                    | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-positive-condition-names`                                                                                                                                                                                                       |
| [LEG008](#leg008-c-clang) | `no-trivial-wrapper-functions`     | Avoid functions that only forward parameters to another call.                                                                                                                                                                                                                                                                                                                       | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-trivial-wrapper-functions`                                                                                                                                                                                                          |
| [LEG009](#leg009-c-clang) | `prefer-early-return`              | Avoid else branches after a branch already exits.                                                                                                                                                                                                                                                                                                                                   | No catalog-specific settings.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                       | Clang: [`readability-else-after-return`](https://clang.llvm.org/extra/clang-tidy/checks/readability/else-after-return.html)                                                                                                                               |
| [LEG010](#leg010-c-clang) | `prefer-guard-clauses`             | Prefer guard clauses over wrapping the main path in one large if block.                                                                                                                                                                                                                                                                                                             | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-guard-clauses`                                                                                                                                                                                                                  |
| [LEG012](#leg012-c-clang) | `no-computed-values`               | Prefer named values before returning computed expressions.                                                                                                                                                                                                                                                                                                                          | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-computed-values`                                                                                                                                                                                                                    |
| [LEG024](#leg024-c-clang) | `prefer-object-lookup`             | Prefer set or map lookups over long equality-or chains.                                                                                                                                                                                                                                                                                                                             | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-object-lookup`                                                                                                                                                                                                                  |
| [LEG031](#leg031-c-clang) | `no-deep-selector-chain`           | Avoid deep selector or index chains without named intermediate values.                                                                                                                                                                                                                                                                                                              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-deep-selector-chain`                                                                                                                                                                                                                |
| [LEG034](#leg034-c-clang) | `prefer-switch-over-long-if-chain` | Prefer switch over long if chains that compare the same value.                                                                                                                                                                                                                                                                                                                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-switch-over-long-if-chain`                                                                                                                                                                                                      |
| [LEG035](#leg035-c-clang) | `no-bool-literal-args`             | Require named values instead of literal `true` or `false` arguments to functions, methods, and constructors. Named variables and macros remain allowed. Overloaded C++ operator calls are excluded.                                                                                                                                                                                 | None.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                                                                                               | Clang: `legibility-no-bool-literal-args`                                                                                                                                                                                                                  |
| [LEG038](#leg038-c-clang) | `max-function-lines`               | Limit functions to a focused line budget.                                                                                                                                                                                                                                                                                                                                           | `LineThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                   | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html)                                                                                                                                       |
| [LEG039](#leg039-c-clang) | `no-unmatched-comments`            | Policy opt-in. Reject comments without an allowed matcher or boundary identifier.                                                                                                                                                                                                                                                                                                   | `Matchers: string`; `PrefixIdentifiers: string`; `SuffixIdentifiers: string` (semicolon-separated lists); Check interface: `clang-tidy-legibility/src/NoUnmatchedCommentsCheck.h` (unpublished)                                                                                                                        | Clang: `legibility-no-unmatched-comments`                                                                                                                                                                                                                 |
| [LEG040](#leg040-c-clang) | `no-automated-comment-attribution` | Reject explicit automated source signatures in comments.                                                                                                                                                                                                                                                                                                                            | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-automated-comment-attribution`                                                                                                                                                                                                      |
| [LEG048](#leg048-c-clang) | `no-redundant-break`               | C/C++ switch breaks prevent fallthrough.                                                                                                                                                                                                                                                                                                                                            | Not applicable.                                                                                                                                                                                                                                                                                                        | Clang: `—`                                                                                                                                                                                                                                                |
| [LEG049](#leg049-c-clang) | `no-naked-returns`                 | C/C++ does not have Go-style named return values.                                                                                                                                                                                                                                                                                                                                   | Not applicable.                                                                                                                                                                                                                                                                                                        | Clang: `—`                                                                                                                                                                                                                                                |
| [LEG051](#leg051-c-clang) | `max-function-params`              | Limit declared parameters in definitions, declarations, methods, and function types. Implicit `this` and the variadic ellipsis do not count. Macro-generated signatures and C declarations without a parameter prototype are excluded.                                                                                                                                              | - `MaxParameters: unsigned integer`: allowed declared parameters. Default: `5`. Parity tests use `5` for the Go profile and `4` for the ESLint profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                             | Clang: `legibility-max-function-parameters`                                                                                                                                                                                                               |
| [LEG054](#leg054-c-clang) | `no-complex-ternaries`             | Reject nested ternaries and operator-heavy ternaries.                                                                                                                                                                                                                                                                                                                               | No rule-specific options; covers nesting only. Operator-budget check remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                         | Clang: [`readability-avoid-nested-conditional-operator`](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html)                                                                                               |
| [LEG055](#leg055-c-clang) | `no-hidden-side-effects`           | Keep mutations out of nested expressions and side-effect-free callbacks.                                                                                                                                                                                                                                                                                                            | Assertion option `CheckFunctionCalls: boolean` defaults to false; assignment-in-if has no rule-specific options. Broader policy remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                              | Clang: [`bugprone-assignment-in-if-condition`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-if-condition.html); [`bugprone-assert-side-effect`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assert-side-effect.html) |
| [LEG058](#leg058-c-clang) | `no-single-use-renaming-alias`     | Avoid aliases that only rename another value for one use.                                                                                                                                                                                                                                                                                                                           | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-single-use-renaming-alias`                                                                                                                                                                                                          |
| [LEG061](#leg061-c-clang) | `no-stacked-comments`              | Reject comments on consecutive lines. A blank line between comments is allowed.                                                                                                                                                                                                                                                                                                     | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-stacked-comments`                                                                                                                                                                                                                   |

### C++

Coverage: [C++](#coverage-cplusplus).

| ID                                | Name                               | Description for this language                                                                                                                                                                                                                                                                                                                                                       | Types / definition                                                                                                                                                                                                                                                                                                     | Plugin / current selector                                                                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [LEG001](#leg001-cplusplus-clang) | `max-expression-operators`         | Limit operators inside one expression, including initializers, returns, conditions, and call arguments. Built-in `&&`, `\|\|`, `!`, comparisons, and `?:` each count once. Arithmetic and overloaded C++ operators do not count. Macro expansions and unevaluated `sizeof`/`noexcept` operands are excluded; lambda bodies are checked independently of their enclosing expression. | - `MaxOperators: unsigned integer`: allowed operators per expression. Default: `4`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                 | Clang: `legibility-max-expression-operators`                                                                                                                                                                                                              |
| [LEG002](#leg002-cplusplus-clang) | `hoist-if-operators`               | Prefer a named boolean before an operator-heavy `if` condition. Built-in `&&`, `\|\|`, and `?:` each count once; comparisons and negation do not count. Macro expansions, unevaluated `sizeof`/`noexcept` operands, and lambda bodies are excluded from the enclosing condition's count. C++ overloaded operators and `if constexpr` conditions are excluded.                       | - `MaxOperators: unsigned integer`: allowed logical or conditional operators in an `if` condition. Default: `0`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                    | Clang: `legibility-hoist-if-operators`                                                                                                                                                                                                                    |
| [LEG003](#leg003-cplusplus-clang) | `max-control-flow-depth`           | Limit nested control-flow depth.                                                                                                                                                                                                                                                                                                                                                    | `NestingThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html)                                                                                                                                       |
| [LEG005](#leg005-cplusplus-clang) | `no-quadratic-patterns`            | Flag likely quadratic nested loops.                                                                                                                                                                                                                                                                                                                                                 | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-quadratic-patterns`                                                                                                                                                                                                                 |
| [LEG006](#leg006-cplusplus-clang) | `no-redundant-boolean-logic`       | Reject built-in `==` or `!=` comparisons with literal booleans and, optionally, ternaries with opposite literal boolean branches. Named macros and overloaded C++ comparisons are excluded.                                                                                                                                                                                         | - `CheckTernaries: boolean`: also reject `condition ? true : false` and `condition ? false : true`. Default: `true`. Parity tests use `true` for the ESLint profile and `false` for the Go profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp) | Clang: `legibility-no-redundant-boolean-logic`                                                                                                                                                                                                            |
| [LEG007](#leg007-cplusplus-clang) | `prefer-positive-condition-names`  | Prefer positive condition names.                                                                                                                                                                                                                                                                                                                                                    | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-positive-condition-names`                                                                                                                                                                                                       |
| [LEG008](#leg008-cplusplus-clang) | `no-trivial-wrapper-functions`     | Avoid functions that only forward parameters to another call.                                                                                                                                                                                                                                                                                                                       | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-trivial-wrapper-functions`                                                                                                                                                                                                          |
| [LEG009](#leg009-cplusplus-clang) | `prefer-early-return`              | Avoid else branches after a branch already exits.                                                                                                                                                                                                                                                                                                                                   | No catalog-specific settings.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                       | Clang: [`readability-else-after-return`](https://clang.llvm.org/extra/clang-tidy/checks/readability/else-after-return.html)                                                                                                                               |
| [LEG010](#leg010-cplusplus-clang) | `prefer-guard-clauses`             | Prefer guard clauses over wrapping the main path in one large if block.                                                                                                                                                                                                                                                                                                             | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-guard-clauses`                                                                                                                                                                                                                  |
| [LEG011](#leg011-cplusplus-clang) | `max-array-chain-depth`            | Limit consecutive collection-style method chains.                                                                                                                                                                                                                                                                                                                                   | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-max-array-chain-depth`                                                                                                                                                                                                                 |
| [LEG012](#leg012-cplusplus-clang) | `no-computed-values`               | Prefer named values before returning computed expressions.                                                                                                                                                                                                                                                                                                                          | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-computed-values`                                                                                                                                                                                                                    |
| [LEG024](#leg024-cplusplus-clang) | `prefer-object-lookup`             | Prefer set or map lookups over long equality-or chains.                                                                                                                                                                                                                                                                                                                             | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-object-lookup`                                                                                                                                                                                                                  |
| [LEG026](#leg026-cplusplus-clang) | `no-mixed-filename-casing`         | Avoid filenames that mix casing conventions.                                                                                                                                                                                                                                                                                                                                        | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-mixed-filename-casing`                                                                                                                                                                                                              |
| [LEG031](#leg031-cplusplus-clang) | `no-deep-selector-chain`           | Avoid deep selector or index chains without named intermediate values.                                                                                                                                                                                                                                                                                                              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-deep-selector-chain`                                                                                                                                                                                                                |
| [LEG034](#leg034-cplusplus-clang) | `prefer-switch-over-long-if-chain` | Prefer switch over long if chains that compare the same value.                                                                                                                                                                                                                                                                                                                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-switch-over-long-if-chain`                                                                                                                                                                                                      |
| [LEG035](#leg035-cplusplus-clang) | `no-bool-literal-args`             | Require named values instead of literal `true` or `false` arguments to functions, methods, and constructors. Named variables and macros remain allowed. Overloaded C++ operator calls are excluded.                                                                                                                                                                                 | None.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                                                                                               | Clang: `legibility-no-bool-literal-args`                                                                                                                                                                                                                  |
| [LEG036](#leg036-cplusplus-clang) | `no-complex-if-init`               | Avoid combining an if initializer with an operator-heavy condition.                                                                                                                                                                                                                                                                                                                 | `MaxOperators: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                    | Clang: `legibility-hoist-if-operators`                                                                                                                                                                                                                    |
| [LEG037](#leg037-cplusplus-clang) | `no-deep-composite-literal-arg`    | Avoid deeply nested composite literals as call arguments.                                                                                                                                                                                                                                                                                                                           | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-deep-composite-literal-arg`                                                                                                                                                                                                         |
| [LEG038](#leg038-cplusplus-clang) | `max-function-lines`               | Limit functions to a focused line budget.                                                                                                                                                                                                                                                                                                                                           | `LineThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                   | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html)                                                                                                                                       |
| [LEG039](#leg039-cplusplus-clang) | `no-unmatched-comments`            | Policy opt-in. Reject comments without an allowed matcher or boundary identifier.                                                                                                                                                                                                                                                                                                   | `Matchers: string`; `PrefixIdentifiers: string`; `SuffixIdentifiers: string` (semicolon-separated lists); Check interface: `clang-tidy-legibility/src/NoUnmatchedCommentsCheck.h` (unpublished)                                                                                                                        | Clang: `legibility-no-unmatched-comments`                                                                                                                                                                                                                 |
| [LEG040](#leg040-cplusplus-clang) | `no-automated-comment-attribution` | Reject explicit automated source signatures in comments.                                                                                                                                                                                                                                                                                                                            | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-automated-comment-attribution`                                                                                                                                                                                                      |
| [LEG047](#leg047-cplusplus-clang) | `prefer-range-loop`                | Prefer a range clause over an index counter loop.                                                                                                                                                                                                                                                                                                                                   | Native options retained.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                            | Clang: [`modernize-loop-convert`](https://clang.llvm.org/extra/clang-tidy/checks/modernize/loop-convert.html)                                                                                                                                             |
| [LEG048](#leg048-cplusplus-clang) | `no-redundant-break`               | C/C++ switch breaks prevent fallthrough.                                                                                                                                                                                                                                                                                                                                            | Not applicable.                                                                                                                                                                                                                                                                                                        | Clang: `—`                                                                                                                                                                                                                                                |
| [LEG049](#leg049-cplusplus-clang) | `no-naked-returns`                 | C/C++ does not have Go-style named return values.                                                                                                                                                                                                                                                                                                                                   | Not applicable.                                                                                                                                                                                                                                                                                                        | Clang: `—`                                                                                                                                                                                                                                                |
| [LEG051](#leg051-cplusplus-clang) | `max-function-params`              | Limit declared parameters in definitions, declarations, methods, and function types. Implicit `this` and the variadic ellipsis do not count. Macro-generated signatures and C declarations without a parameter prototype are excluded.                                                                                                                                              | - `MaxParameters: unsigned integer`: allowed declared parameters. Default: `5`. Parity tests use `5` for the Go profile and `4` for the ESLint profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                             | Clang: `legibility-max-function-parameters`                                                                                                                                                                                                               |
| [LEG054](#leg054-cplusplus-clang) | `no-complex-ternaries`             | Reject nested ternaries and operator-heavy ternaries.                                                                                                                                                                                                                                                                                                                               | No rule-specific options; covers nesting only. Operator-budget check remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                         | Clang: [`readability-avoid-nested-conditional-operator`](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html)                                                                                               |
| [LEG055](#leg055-cplusplus-clang) | `no-hidden-side-effects`           | Keep mutations out of nested expressions and side-effect-free callbacks.                                                                                                                                                                                                                                                                                                            | Assertion option `CheckFunctionCalls: boolean` defaults to false; assignment-in-if has no rule-specific options. Broader policy remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                              | Clang: [`bugprone-assignment-in-if-condition`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-if-condition.html); [`bugprone-assert-side-effect`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assert-side-effect.html) |
| [LEG056](#leg056-cplusplus-clang) | `no-identity-array-callback`       | Reject `map` and `filter` callbacks that keep every item unchanged.                                                                                                                                                                                                                                                                                                                 | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-identity-array-callback`                                                                                                                                                                                                            |
| [LEG057](#leg057-cplusplus-clang) | `no-repeated-collection-search`    | Flag repeated searches over the same collection in one scope.                                                                                                                                                                                                                                                                                                                       | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-repeated-collection-search`                                                                                                                                                                                                         |
| [LEG058](#leg058-cplusplus-clang) | `no-single-use-renaming-alias`     | Avoid aliases that only rename another value for one use.                                                                                                                                                                                                                                                                                                                           | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-single-use-renaming-alias`                                                                                                                                                                                                          |
| [LEG059](#leg059-cplusplus-clang) | `no-small-collection-conversion`   | Avoid converting a statically small array or string into a `Map` or `Set` for one immediate lookup. Named collections, dynamic inputs, and literal inputs at the threshold are unchanged.                                                                                                                                                                                           | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-small-collection-conversion`                                                                                                                                                                                                        |
| [LEG060](#leg060-cplusplus-clang) | `no-standalone-array-mutations`    | Prefer explicit returned array composition over standalone array mutation statements.                                                                                                                                                                                                                                                                                               | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-standalone-array-mutations`                                                                                                                                                                                                         |
| [LEG061](#leg061-cplusplus-clang) | `no-stacked-comments`              | Reject comments on consecutive lines. A blank line between comments is allowed.                                                                                                                                                                                                                                                                                                     | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-no-stacked-comments`                                                                                                                                                                                                                   |
| [LEG062](#leg062-cplusplus-clang) | `prefer-flat-map`                  | Prefer `flatMap` over `map(...).flat()`.                                                                                                                                                                                                                                                                                                                                            | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             | Clang: `legibility-prefer-flat-map`                                                                                                                                                                                                                       |

## Coverage by language

Each table lists every shared rule for one language. Rule IDs link to definitions; implementation links lead to examples and source. JavaScript/TypeScript and SQL/Jinja reuse their existing definition sections but have separate coverage tables.

Rows marked **not yet assessed** form the visible assessment backlog. They do not block completion of this documentation inventory and do not establish language support.

Missing inventory entries are marked **not yet assessed**. A known missing check is **not implemented**; confirmed language exclusions are **not applicable**.

Native rules provide checks we do not need to duplicate. **Provided** = enabled in our config; **partial** = enabled with gaps; **available** = requires setup. Follow the setup link for details.

<a id="coverage-go"></a>

### Go coverage

| ID                                               | Status           | Implementation / evidence  | Notes |
| ------------------------------------------------ | ---------------- | -------------------------- | ----- |
| <a id="coverage-go-leg001"></a>[LEG001](#leg001) | Implemented      | [Go](#leg001-go-go)        | —     |
| <a id="coverage-go-leg002"></a>[LEG002](#leg002) | Implemented      | [Go](#leg002-go-go)        | —     |
| <a id="coverage-go-leg003"></a>[LEG003](#leg003) | Implemented      | [Go](#leg003-go-go)        | —     |
| <a id="coverage-go-leg005"></a>[LEG005](#leg005) | Implemented      | [Go](#leg005-go-go)        | —     |
| <a id="coverage-go-leg006"></a>[LEG006](#leg006) | Implemented      | [Go](#leg006-go-go)        | —     |
| <a id="coverage-go-leg007"></a>[LEG007](#leg007) | Implemented      | [Go](#leg007-go-go)        | —     |
| <a id="coverage-go-leg008"></a>[LEG008](#leg008) | Implemented      | [Go](#leg008-go-go)        | —     |
| <a id="coverage-go-leg009"></a>[LEG009](#leg009) | Implemented      | [Go](#leg009-go-go)        | —     |
| <a id="coverage-go-leg010"></a>[LEG010](#leg010) | Implemented      | [Go](#leg010-go-go)        | —     |
| <a id="coverage-go-leg011"></a>[LEG011](#leg011) | Implemented      | [Go](#leg011-go-go)        | —     |
| <a id="coverage-go-leg012"></a>[LEG012](#leg012) | Implemented      | [Go](#leg012-go-go)        | —     |
| <a id="coverage-go-leg024"></a>[LEG024](#leg024) | Implemented      | [Go](#leg024-go-go)        | —     |
| <a id="coverage-go-leg025"></a>[LEG025](#leg025) | Implemented      | [Go](#leg025-go-go)        | —     |
| <a id="coverage-go-leg026"></a>[LEG026](#leg026) | Implemented      | [Go](#leg026-go-go)        | —     |
| <a id="coverage-go-leg031"></a>[LEG031](#leg031) | Implemented      | [Go](#leg031-go-go)        | —     |
| <a id="coverage-go-leg034"></a>[LEG034](#leg034) | Implemented      | [Go](#leg034-go-go)        | —     |
| <a id="coverage-go-leg035"></a>[LEG035](#leg035) | Implemented      | [Go](#leg035-go-go)        | —     |
| <a id="coverage-go-leg036"></a>[LEG036](#leg036) | Implemented      | [Go](#leg036-go-go)        | —     |
| <a id="coverage-go-leg037"></a>[LEG037](#leg037) | Implemented      | [Go](#leg037-go-go)        | —     |
| <a id="coverage-go-leg038"></a>[LEG038](#leg038) | Implemented      | [Go](#leg038-go-go)        | —     |
| <a id="coverage-go-leg039"></a>[LEG039](#leg039) | Implemented      | [Go](#leg039-go-go)        | —     |
| <a id="coverage-go-leg040"></a>[LEG040](#leg040) | Implemented      | [Go](#leg040-go-go)        | —     |
| <a id="coverage-go-leg041"></a>[LEG041](#leg041) | Implemented      | [Go](#leg041-go-go)        | —     |
| <a id="coverage-go-leg042"></a>[LEG042](#leg042) | Implemented      | [Go](#leg042-go-go)        | —     |
| <a id="coverage-go-leg043"></a>[LEG043](#leg043) | Implemented      | [Go](#leg043-go-go)        | —     |
| <a id="coverage-go-leg044"></a>[LEG044](#leg044) | Implemented      | [Go](#leg044-go-go)        | —     |
| <a id="coverage-go-leg045"></a>[LEG045](#leg045) | Implemented      | [Go](#leg045-go-go)        | —     |
| <a id="coverage-go-leg046"></a>[LEG046](#leg046) | Implemented      | [Go](#leg046-go-go)        | —     |
| <a id="coverage-go-leg047"></a>[LEG047](#leg047) | Implemented      | [Go](#leg047-go-go)        | —     |
| <a id="coverage-go-leg048"></a>[LEG048](#leg048) | Implemented      | [Go](#leg048-go-go)        | —     |
| <a id="coverage-go-leg049"></a>[LEG049](#leg049) | Implemented      | [Go](#leg049-go-go)        | —     |
| <a id="coverage-go-leg050"></a>[LEG050](#leg050) | Implemented      | [Go](#leg050-go-go)        | —     |
| <a id="coverage-go-leg051"></a>[LEG051](#leg051) | Implemented      | [Go](#leg051-go-go)        | —     |
| <a id="coverage-go-leg052"></a>[LEG052](#leg052) | Implemented      | [Go](#leg052-go-go)        | —     |
| <a id="coverage-go-leg053"></a>[LEG053](#leg053) | Implemented      | [Go](#leg053-go-go)        | —     |
| <a id="coverage-go-leg054"></a>[LEG054](#leg054) | Not yet assessed | [Rule definition](#leg054) | —     |
| <a id="coverage-go-leg055"></a>[LEG055](#leg055) | Not yet assessed | [Rule definition](#leg055) | —     |
| <a id="coverage-go-leg056"></a>[LEG056](#leg056) | Not yet assessed | [Rule definition](#leg056) | —     |
| <a id="coverage-go-leg057"></a>[LEG057](#leg057) | Not yet assessed | [Rule definition](#leg057) | —     |
| <a id="coverage-go-leg058"></a>[LEG058](#leg058) | Not yet assessed | [Rule definition](#leg058) | —     |
| <a id="coverage-go-leg059"></a>[LEG059](#leg059) | Not yet assessed | [Rule definition](#leg059) | —     |
| <a id="coverage-go-leg060"></a>[LEG060](#leg060) | Not yet assessed | [Rule definition](#leg060) | —     |
| <a id="coverage-go-leg061"></a>[LEG061](#leg061) | Not yet assessed | [Rule definition](#leg061) | —     |
| <a id="coverage-go-leg062"></a>[LEG062](#leg062) | Not yet assessed | [Rule definition](#leg062) | —     |
| <a id="coverage-go-leg063"></a>[LEG063](#leg063) | Not yet assessed | [Rule definition](#leg063) | —     |
| <a id="coverage-go-leg064"></a>[LEG064](#leg064) | Not yet assessed | [Rule definition](#leg064) | —     |
| <a id="coverage-go-leg065"></a>[LEG065](#leg065) | Not yet assessed | [Rule definition](#leg065) | —     |
| <a id="coverage-go-leg066"></a>[LEG066](#leg066) | Not yet assessed | [Rule definition](#leg066) | —     |
| <a id="coverage-go-leg067"></a>[LEG067](#leg067) | Not yet assessed | [Rule definition](#leg067) | —     |
| <a id="coverage-go-leg068"></a>[LEG068](#leg068) | Not yet assessed | [Rule definition](#leg068) | —     |
| <a id="coverage-go-leg069"></a>[LEG069](#leg069) | Not yet assessed | [Rule definition](#leg069) | —     |
| <a id="coverage-go-leg071"></a>[LEG071](#leg071) | Not yet assessed | [Rule definition](#leg071) | —     |
| <a id="coverage-go-leg072"></a>[LEG072](#leg072) | Not yet assessed | [Rule definition](#leg072) | —     |
| <a id="coverage-go-leg073"></a>[LEG073](#leg073) | Not yet assessed | [Rule definition](#leg073) | —     |
| <a id="coverage-go-leg074"></a>[LEG074](#leg074) | Not yet assessed | [Rule definition](#leg074) | —     |
| <a id="coverage-go-leg075"></a>[LEG075](#leg075) | Not yet assessed | [Rule definition](#leg075) | —     |
| <a id="coverage-go-leg076"></a>[LEG076](#leg076) | Not yet assessed | [Rule definition](#leg076) | —     |
| <a id="coverage-go-leg077"></a>[LEG077](#leg077) | Not yet assessed | [Rule definition](#leg077) | —     |
| <a id="coverage-go-leg078"></a>[LEG078](#leg078) | Not yet assessed | [Rule definition](#leg078) | —     |
| <a id="coverage-go-leg079"></a>[LEG079](#leg079) | Not yet assessed | [Rule definition](#leg079) | —     |
| <a id="coverage-go-leg081"></a>[LEG081](#leg081) | Not yet assessed | [Rule definition](#leg081) | —     |
| <a id="coverage-go-leg082"></a>[LEG082](#leg082) | Not yet assessed | [Rule definition](#leg082) | —     |

<a id="coverage-javascript"></a>

### JavaScript coverage

| ID                                                       | Status                    | Implementation / evidence                                                                                                                                                                                                                                   | Notes                                              |
| -------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| <a id="coverage-javascript-leg001"></a>[LEG001](#leg001) | Implemented               | [ESLint](#leg001-javascript-typescript-eslint); [Oxlint](#leg001-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg002"></a>[LEG002](#leg002) | Implemented               | [ESLint](#leg002-javascript-typescript-eslint); [Oxlint](#leg002-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg003"></a>[LEG003](#leg003) | Implemented               | [ESLint](#leg003-javascript-typescript-eslint); [Oxlint](#leg003-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg005"></a>[LEG005](#leg005) | Implemented               | [ESLint](#leg005-javascript-typescript-eslint); [Oxlint](#leg005-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg006"></a>[LEG006](#leg006) | Implemented               | [ESLint](#leg006-javascript-typescript-eslint); [Oxlint](#leg006-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg007"></a>[LEG007](#leg007) | Implemented               | [ESLint](#leg007-javascript-typescript-eslint); [Oxlint](#leg007-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg008"></a>[LEG008](#leg008) | Implemented               | [ESLint](#leg008-javascript-typescript-eslint); [Oxlint](#leg008-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg009"></a>[LEG009](#leg009) | Implemented               | [ESLint](#leg009-javascript-typescript-eslint); [Oxlint](#leg009-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg010"></a>[LEG010](#leg010) | Implemented               | [ESLint](#leg010-javascript-typescript-eslint); [Oxlint](#leg010-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg011"></a>[LEG011](#leg011) | Implemented               | [ESLint](#leg011-javascript-typescript-eslint); [Oxlint](#leg011-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg012"></a>[LEG012](#leg012) | Implemented               | [ESLint](#leg012-javascript-typescript-eslint); [Oxlint](#leg012-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg024"></a>[LEG024](#leg024) | Implemented               | [ESLint](#leg024-javascript-typescript-eslint); [Oxlint](#leg024-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg025"></a>[LEG025](#leg025) | Implemented               | [ESLint](#leg025-javascript-typescript-eslint); [Oxlint](#leg025-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg026"></a>[LEG026](#leg026) | Implemented               | [ESLint](#leg026-javascript-typescript-eslint); [Oxlint](#leg026-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg031"></a>[LEG031](#leg031) | Not yet assessed          | [Rule definition](#leg031)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg034"></a>[LEG034](#leg034) | Not yet assessed          | [Rule definition](#leg034)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg035"></a>[LEG035](#leg035) | Not yet assessed          | [Rule definition](#leg035)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg036"></a>[LEG036](#leg036) | Not yet assessed          | [Rule definition](#leg036)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg037"></a>[LEG037](#leg037) | Not yet assessed          | [Rule definition](#leg037)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg038"></a>[LEG038](#leg038) | Provided by native linter | [ESLint](https://eslint.org/docs/latest/rules/max-lines-per-function) / [setup](#leg038-javascript-typescript-eslint); [Oxlint](https://oxc.rs/docs/guide/usage/linter/rules/eslint/max-lines-per-function) / [setup](#leg038-javascript-typescript-oxlint) | Off by default; our presets warn at 40 code lines. |
| <a id="coverage-javascript-leg039"></a>[LEG039](#leg039) | Implemented               | [ESLint](#leg039-javascript-typescript-eslint); [Oxlint](#leg039-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg040"></a>[LEG040](#leg040) | Implemented               | [ESLint](#leg040-javascript-typescript-eslint); [Oxlint](#leg040-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg041"></a>[LEG041](#leg041) | Not yet assessed          | [Rule definition](#leg041)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg042"></a>[LEG042](#leg042) | Not yet assessed          | [Rule definition](#leg042)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg043"></a>[LEG043](#leg043) | Not yet assessed          | [Rule definition](#leg043)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg044"></a>[LEG044](#leg044) | Not yet assessed          | [Rule definition](#leg044)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg045"></a>[LEG045](#leg045) | Not yet assessed          | [Rule definition](#leg045)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg046"></a>[LEG046](#leg046) | Not yet assessed          | [Rule definition](#leg046)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg047"></a>[LEG047](#leg047) | Not yet assessed          | [Rule definition](#leg047)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg048"></a>[LEG048](#leg048) | Not yet assessed          | [Rule definition](#leg048)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg049"></a>[LEG049](#leg049) | Not yet assessed          | [Rule definition](#leg049)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg050"></a>[LEG050](#leg050) | Not yet assessed          | [Rule definition](#leg050)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg051"></a>[LEG051](#leg051) | Implemented               | [ESLint](#leg051-javascript-typescript-eslint); [Oxlint](#leg051-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg052"></a>[LEG052](#leg052) | Not yet assessed          | [Rule definition](#leg052)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg053"></a>[LEG053](#leg053) | Not yet assessed          | [Rule definition](#leg053)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg054"></a>[LEG054](#leg054) | Implemented               | [ESLint](#leg054-javascript-typescript-eslint); [Oxlint](#leg054-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg055"></a>[LEG055](#leg055) | Implemented               | [ESLint](#leg055-javascript-typescript-eslint); [Oxlint](#leg055-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg056"></a>[LEG056](#leg056) | Implemented               | [ESLint](#leg056-javascript-typescript-eslint); [Oxlint](#leg056-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg057"></a>[LEG057](#leg057) | Implemented               | [ESLint](#leg057-javascript-typescript-eslint); [Oxlint](#leg057-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg058"></a>[LEG058](#leg058) | Implemented               | [ESLint](#leg058-javascript-typescript-eslint); [Oxlint](#leg058-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg059"></a>[LEG059](#leg059) | Implemented               | [ESLint](#leg059-javascript-typescript-eslint); [Oxlint](#leg059-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg060"></a>[LEG060](#leg060) | Implemented               | [ESLint](#leg060-javascript-typescript-eslint); [Oxlint](#leg060-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg061"></a>[LEG061](#leg061) | Implemented               | [ESLint](#leg061-javascript-typescript-eslint); [Oxlint](#leg061-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg062"></a>[LEG062](#leg062) | Implemented               | [ESLint](#leg062-javascript-typescript-eslint); [Oxlint](#leg062-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg063"></a>[LEG063](#leg063) | Implemented               | [ESLint](#leg063-javascript-typescript-eslint); [Oxlint](#leg063-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg064"></a>[LEG064](#leg064) | Implemented               | [ESLint](#leg064-javascript-typescript-eslint); [Oxlint](#leg064-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg065"></a>[LEG065](#leg065) | Implemented               | [ESLint](#leg065-javascript-typescript-eslint); [Oxlint](#leg065-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg066"></a>[LEG066](#leg066) | Implemented               | [ESLint](#leg066-javascript-typescript-eslint); [Oxlint](#leg066-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg067"></a>[LEG067](#leg067) | Implemented               | [ESLint](#leg067-javascript-typescript-eslint); [Oxlint](#leg067-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg068"></a>[LEG068](#leg068) | Implemented               | [ESLint](#leg068-javascript-typescript-eslint); [Oxlint](#leg068-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg069"></a>[LEG069](#leg069) | Implemented               | [ESLint](#leg069-javascript-typescript-eslint); [Oxlint](#leg069-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-javascript-leg071"></a>[LEG071](#leg071) | Not yet assessed          | [Rule definition](#leg071)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg072"></a>[LEG072](#leg072) | Not yet assessed          | [Rule definition](#leg072)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg073"></a>[LEG073](#leg073) | Not yet assessed          | [Rule definition](#leg073)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg074"></a>[LEG074](#leg074) | Not yet assessed          | [Rule definition](#leg074)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg075"></a>[LEG075](#leg075) | Not yet assessed          | [Rule definition](#leg075)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg076"></a>[LEG076](#leg076) | Not yet assessed          | [Rule definition](#leg076)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg077"></a>[LEG077](#leg077) | Not yet assessed          | [Rule definition](#leg077)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg078"></a>[LEG078](#leg078) | Not yet assessed          | [Rule definition](#leg078)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg079"></a>[LEG079](#leg079) | Not yet assessed          | [Rule definition](#leg079)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg081"></a>[LEG081](#leg081) | Not yet assessed          | [Rule definition](#leg081)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-javascript-leg082"></a>[LEG082](#leg082) | Not yet assessed          | [Rule definition](#leg082)                                                                                                                                                                                                                                  | —                                                  |

<a id="coverage-typescript"></a>

### TypeScript coverage

| ID                                                       | Status                    | Implementation / evidence                                                                                                                                                                                                                                   | Notes                                              |
| -------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| <a id="coverage-typescript-leg001"></a>[LEG001](#leg001) | Implemented               | [ESLint](#leg001-javascript-typescript-eslint); [Oxlint](#leg001-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg002"></a>[LEG002](#leg002) | Implemented               | [ESLint](#leg002-javascript-typescript-eslint); [Oxlint](#leg002-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg003"></a>[LEG003](#leg003) | Implemented               | [ESLint](#leg003-javascript-typescript-eslint); [Oxlint](#leg003-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg005"></a>[LEG005](#leg005) | Implemented               | [ESLint](#leg005-javascript-typescript-eslint); [Oxlint](#leg005-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg006"></a>[LEG006](#leg006) | Implemented               | [ESLint](#leg006-javascript-typescript-eslint); [Oxlint](#leg006-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg007"></a>[LEG007](#leg007) | Implemented               | [ESLint](#leg007-javascript-typescript-eslint); [Oxlint](#leg007-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg008"></a>[LEG008](#leg008) | Implemented               | [ESLint](#leg008-javascript-typescript-eslint); [Oxlint](#leg008-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg009"></a>[LEG009](#leg009) | Implemented               | [ESLint](#leg009-javascript-typescript-eslint); [Oxlint](#leg009-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg010"></a>[LEG010](#leg010) | Implemented               | [ESLint](#leg010-javascript-typescript-eslint); [Oxlint](#leg010-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg011"></a>[LEG011](#leg011) | Implemented               | [ESLint](#leg011-javascript-typescript-eslint); [Oxlint](#leg011-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg012"></a>[LEG012](#leg012) | Implemented               | [ESLint](#leg012-javascript-typescript-eslint); [Oxlint](#leg012-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg024"></a>[LEG024](#leg024) | Implemented               | [ESLint](#leg024-javascript-typescript-eslint); [Oxlint](#leg024-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg025"></a>[LEG025](#leg025) | Implemented               | [ESLint](#leg025-javascript-typescript-eslint); [Oxlint](#leg025-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg026"></a>[LEG026](#leg026) | Implemented               | [ESLint](#leg026-javascript-typescript-eslint); [Oxlint](#leg026-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg031"></a>[LEG031](#leg031) | Not yet assessed          | [Rule definition](#leg031)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg034"></a>[LEG034](#leg034) | Not yet assessed          | [Rule definition](#leg034)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg035"></a>[LEG035](#leg035) | Not yet assessed          | [Rule definition](#leg035)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg036"></a>[LEG036](#leg036) | Not yet assessed          | [Rule definition](#leg036)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg037"></a>[LEG037](#leg037) | Not yet assessed          | [Rule definition](#leg037)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg038"></a>[LEG038](#leg038) | Provided by native linter | [ESLint](https://eslint.org/docs/latest/rules/max-lines-per-function) / [setup](#leg038-javascript-typescript-eslint); [Oxlint](https://oxc.rs/docs/guide/usage/linter/rules/eslint/max-lines-per-function) / [setup](#leg038-javascript-typescript-oxlint) | Off by default; our presets warn at 40 code lines. |
| <a id="coverage-typescript-leg039"></a>[LEG039](#leg039) | Implemented               | [ESLint](#leg039-javascript-typescript-eslint); [Oxlint](#leg039-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg040"></a>[LEG040](#leg040) | Implemented               | [ESLint](#leg040-javascript-typescript-eslint); [Oxlint](#leg040-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg041"></a>[LEG041](#leg041) | Not yet assessed          | [Rule definition](#leg041)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg042"></a>[LEG042](#leg042) | Not yet assessed          | [Rule definition](#leg042)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg043"></a>[LEG043](#leg043) | Not yet assessed          | [Rule definition](#leg043)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg044"></a>[LEG044](#leg044) | Not yet assessed          | [Rule definition](#leg044)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg045"></a>[LEG045](#leg045) | Not yet assessed          | [Rule definition](#leg045)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg046"></a>[LEG046](#leg046) | Not yet assessed          | [Rule definition](#leg046)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg047"></a>[LEG047](#leg047) | Not yet assessed          | [Rule definition](#leg047)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg048"></a>[LEG048](#leg048) | Not yet assessed          | [Rule definition](#leg048)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg049"></a>[LEG049](#leg049) | Not yet assessed          | [Rule definition](#leg049)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg050"></a>[LEG050](#leg050) | Not yet assessed          | [Rule definition](#leg050)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg051"></a>[LEG051](#leg051) | Implemented               | [ESLint](#leg051-javascript-typescript-eslint); [Oxlint](#leg051-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg052"></a>[LEG052](#leg052) | Not yet assessed          | [Rule definition](#leg052)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg053"></a>[LEG053](#leg053) | Not yet assessed          | [Rule definition](#leg053)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg054"></a>[LEG054](#leg054) | Implemented               | [ESLint](#leg054-javascript-typescript-eslint); [Oxlint](#leg054-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg055"></a>[LEG055](#leg055) | Implemented               | [ESLint](#leg055-javascript-typescript-eslint); [Oxlint](#leg055-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg056"></a>[LEG056](#leg056) | Implemented               | [ESLint](#leg056-javascript-typescript-eslint); [Oxlint](#leg056-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg057"></a>[LEG057](#leg057) | Implemented               | [ESLint](#leg057-javascript-typescript-eslint); [Oxlint](#leg057-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg058"></a>[LEG058](#leg058) | Implemented               | [ESLint](#leg058-javascript-typescript-eslint); [Oxlint](#leg058-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg059"></a>[LEG059](#leg059) | Implemented               | [ESLint](#leg059-javascript-typescript-eslint); [Oxlint](#leg059-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg060"></a>[LEG060](#leg060) | Implemented               | [ESLint](#leg060-javascript-typescript-eslint); [Oxlint](#leg060-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg061"></a>[LEG061](#leg061) | Implemented               | [ESLint](#leg061-javascript-typescript-eslint); [Oxlint](#leg061-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg062"></a>[LEG062](#leg062) | Implemented               | [ESLint](#leg062-javascript-typescript-eslint); [Oxlint](#leg062-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg063"></a>[LEG063](#leg063) | Implemented               | [ESLint](#leg063-javascript-typescript-eslint); [Oxlint](#leg063-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg064"></a>[LEG064](#leg064) | Implemented               | [ESLint](#leg064-javascript-typescript-eslint); [Oxlint](#leg064-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg065"></a>[LEG065](#leg065) | Implemented               | [ESLint](#leg065-javascript-typescript-eslint); [Oxlint](#leg065-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg066"></a>[LEG066](#leg066) | Implemented               | [ESLint](#leg066-javascript-typescript-eslint); [Oxlint](#leg066-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg067"></a>[LEG067](#leg067) | Implemented               | [ESLint](#leg067-javascript-typescript-eslint); [Oxlint](#leg067-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg068"></a>[LEG068](#leg068) | Implemented               | [ESLint](#leg068-javascript-typescript-eslint); [Oxlint](#leg068-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg069"></a>[LEG069](#leg069) | Implemented               | [ESLint](#leg069-javascript-typescript-eslint); [Oxlint](#leg069-javascript-typescript-oxlint)                                                                                                                                                              | —                                                  |
| <a id="coverage-typescript-leg071"></a>[LEG071](#leg071) | Not yet assessed          | [Rule definition](#leg071)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg072"></a>[LEG072](#leg072) | Not yet assessed          | [Rule definition](#leg072)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg073"></a>[LEG073](#leg073) | Not yet assessed          | [Rule definition](#leg073)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg074"></a>[LEG074](#leg074) | Not yet assessed          | [Rule definition](#leg074)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg075"></a>[LEG075](#leg075) | Not yet assessed          | [Rule definition](#leg075)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg076"></a>[LEG076](#leg076) | Not yet assessed          | [Rule definition](#leg076)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg077"></a>[LEG077](#leg077) | Not yet assessed          | [Rule definition](#leg077)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg078"></a>[LEG078](#leg078) | Not yet assessed          | [Rule definition](#leg078)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg079"></a>[LEG079](#leg079) | Not yet assessed          | [Rule definition](#leg079)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg081"></a>[LEG081](#leg081) | Not yet assessed          | [Rule definition](#leg081)                                                                                                                                                                                                                                  | —                                                  |
| <a id="coverage-typescript-leg082"></a>[LEG082](#leg082) | Not yet assessed          | [Rule definition](#leg082)                                                                                                                                                                                                                                  | —                                                  |

<a id="coverage-python"></a>

### Python coverage

| ID                                                   | Status                    | Implementation / evidence                                                                                     | Notes                                                                   |
| ---------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| <a id="coverage-python-leg001"></a>[LEG001](#leg001) | Implemented               | [Python](#leg001-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg002"></a>[LEG002](#leg002) | Implemented               | [Python](#leg002-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg003"></a>[LEG003](#leg003) | Implemented               | [Python](#leg003-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg005"></a>[LEG005](#leg005) | Implemented               | [Python](#leg005-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg006"></a>[LEG006](#leg006) | Implemented               | [Python](#leg006-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg007"></a>[LEG007](#leg007) | Implemented               | [Python](#leg007-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg008"></a>[LEG008](#leg008) | Implemented               | [Python](#leg008-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg009"></a>[LEG009](#leg009) | Implemented               | [Python](#leg009-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg010"></a>[LEG010](#leg010) | Implemented               | [Python](#leg010-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg011"></a>[LEG011](#leg011) | Implemented               | [Python](#leg011-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg012"></a>[LEG012](#leg012) | Implemented               | [Python](#leg012-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg024"></a>[LEG024](#leg024) | Implemented               | [Python](#leg024-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg025"></a>[LEG025](#leg025) | Implemented               | [Python](#leg025-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg026"></a>[LEG026](#leg026) | Implemented               | [Python](#leg026-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg031"></a>[LEG031](#leg031) | Implemented               | [Python](#leg031-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg034"></a>[LEG034](#leg034) | Not yet assessed          | [Rule definition](#leg034)                                                                                    | —                                                                       |
| <a id="coverage-python-leg035"></a>[LEG035](#leg035) | Available native coverage | [`FBT003`](https://docs.astral.sh/ruff/rules/boolean-positional-value-in-call/); [setup](#leg035-python-ruff) | Setup required. Positional booleans only.                               |
| <a id="coverage-python-leg036"></a>[LEG036](#leg036) | Not yet assessed          | [Rule definition](#leg036)                                                                                    | —                                                                       |
| <a id="coverage-python-leg037"></a>[LEG037](#leg037) | Not yet assessed          | [Rule definition](#leg037)                                                                                    | —                                                                       |
| <a id="coverage-python-leg038"></a>[LEG038](#leg038) | Not yet assessed          | [Rule definition](#leg038)                                                                                    | —                                                                       |
| <a id="coverage-python-leg039"></a>[LEG039](#leg039) | Implemented               | [Python](#leg039-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg040"></a>[LEG040](#leg040) | Not yet assessed          | [Rule definition](#leg040)                                                                                    | —                                                                       |
| <a id="coverage-python-leg041"></a>[LEG041](#leg041) | Not yet assessed          | [Rule definition](#leg041)                                                                                    | —                                                                       |
| <a id="coverage-python-leg042"></a>[LEG042](#leg042) | Not yet assessed          | [Rule definition](#leg042)                                                                                    | —                                                                       |
| <a id="coverage-python-leg043"></a>[LEG043](#leg043) | Not yet assessed          | [Rule definition](#leg043)                                                                                    | —                                                                       |
| <a id="coverage-python-leg044"></a>[LEG044](#leg044) | Not yet assessed          | [Rule definition](#leg044)                                                                                    | —                                                                       |
| <a id="coverage-python-leg045"></a>[LEG045](#leg045) | Not yet assessed          | [Rule definition](#leg045)                                                                                    | —                                                                       |
| <a id="coverage-python-leg046"></a>[LEG046](#leg046) | Not yet assessed          | [Rule definition](#leg046)                                                                                    | —                                                                       |
| <a id="coverage-python-leg047"></a>[LEG047](#leg047) | Not yet assessed          | [Rule definition](#leg047)                                                                                    | —                                                                       |
| <a id="coverage-python-leg048"></a>[LEG048](#leg048) | Not yet assessed          | [Rule definition](#leg048)                                                                                    | —                                                                       |
| <a id="coverage-python-leg049"></a>[LEG049](#leg049) | Not yet assessed          | [Rule definition](#leg049)                                                                                    | —                                                                       |
| <a id="coverage-python-leg050"></a>[LEG050](#leg050) | Not yet assessed          | [Rule definition](#leg050)                                                                                    | —                                                                       |
| <a id="coverage-python-leg051"></a>[LEG051](#leg051) | Available native coverage | [`PLR0913`](https://docs.astral.sh/ruff/rules/too-many-arguments/); [setup](#leg051-python-ruff)              | Setup required. Default limit: 5; exemptions apply.                     |
| <a id="coverage-python-leg052"></a>[LEG052](#leg052) | Not yet assessed          | [Rule definition](#leg052)                                                                                    | —                                                                       |
| <a id="coverage-python-leg053"></a>[LEG053](#leg053) | Not yet assessed          | [Rule definition](#leg053)                                                                                    | —                                                                       |
| <a id="coverage-python-leg054"></a>[LEG054](#leg054) | Implemented               | [Python](#leg054-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg055"></a>[LEG055](#leg055) | Implemented               | [Python](#leg055-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg056"></a>[LEG056](#leg056) | Implemented               | [Python](#leg056-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg057"></a>[LEG057](#leg057) | Implemented               | [Python](#leg057-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg058"></a>[LEG058](#leg058) | Implemented               | [Python](#leg058-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg059"></a>[LEG059](#leg059) | Not yet assessed          | [Rule definition](#leg059)                                                                                    | —                                                                       |
| <a id="coverage-python-leg060"></a>[LEG060](#leg060) | Implemented               | [Python](#leg060-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg061"></a>[LEG061](#leg061) | Not implemented           | [Python](#leg061-python-python)                                                                               | Python: Separate Python rule planned; current bundled behavior differs. |
| <a id="coverage-python-leg062"></a>[LEG062](#leg062) | Not yet assessed          | [Rule definition](#leg062)                                                                                    | —                                                                       |
| <a id="coverage-python-leg063"></a>[LEG063](#leg063) | Implemented               | [Python](#leg063-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg064"></a>[LEG064](#leg064) | Not yet assessed          | [Rule definition](#leg064)                                                                                    | —                                                                       |
| <a id="coverage-python-leg065"></a>[LEG065](#leg065) | Not yet assessed          | [Rule definition](#leg065)                                                                                    | —                                                                       |
| <a id="coverage-python-leg066"></a>[LEG066](#leg066) | Not yet assessed          | [Rule definition](#leg066)                                                                                    | —                                                                       |
| <a id="coverage-python-leg067"></a>[LEG067](#leg067) | Not yet assessed          | [Rule definition](#leg067)                                                                                    | —                                                                       |
| <a id="coverage-python-leg068"></a>[LEG068](#leg068) | Implemented               | [Python](#leg068-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg069"></a>[LEG069](#leg069) | Implemented               | [Python](#leg069-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg071"></a>[LEG071](#leg071) | Implemented               | [Python](#leg071-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg072"></a>[LEG072](#leg072) | Implemented               | [Python](#leg072-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg073"></a>[LEG073](#leg073) | Implemented               | [Python](#leg073-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg074"></a>[LEG074](#leg074) | Implemented               | [Python](#leg074-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg075"></a>[LEG075](#leg075) | Implemented               | [Python](#leg075-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg076"></a>[LEG076](#leg076) | Implemented               | [Python](#leg076-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg077"></a>[LEG077](#leg077) | Implemented               | [Python](#leg077-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg078"></a>[LEG078](#leg078) | Implemented               | [Python](#leg078-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg079"></a>[LEG079](#leg079) | Implemented               | [Python](#leg079-python-python)                                                                               | —                                                                       |
| <a id="coverage-python-leg081"></a>[LEG081](#leg081) | Not yet assessed          | [Rule definition](#leg081)                                                                                    | —                                                                       |
| <a id="coverage-python-leg082"></a>[LEG082](#leg082) | Not yet assessed          | [Rule definition](#leg082)                                                                                    | —                                                                       |

<a id="coverage-shell"></a>

### Shell coverage

| ID                                                  | Status           | Implementation / evidence    | Notes |
| --------------------------------------------------- | ---------------- | ---------------------------- | ----- |
| <a id="coverage-shell-leg001"></a>[LEG001](#leg001) | Implemented      | [Shell](#leg001-shell-shell) | —     |
| <a id="coverage-shell-leg002"></a>[LEG002](#leg002) | Implemented      | [Shell](#leg002-shell-shell) | —     |
| <a id="coverage-shell-leg003"></a>[LEG003](#leg003) | Implemented      | [Shell](#leg003-shell-shell) | —     |
| <a id="coverage-shell-leg005"></a>[LEG005](#leg005) | Implemented      | [Shell](#leg005-shell-shell) | —     |
| <a id="coverage-shell-leg006"></a>[LEG006](#leg006) | Not yet assessed | [Rule definition](#leg006)   | —     |
| <a id="coverage-shell-leg007"></a>[LEG007](#leg007) | Not yet assessed | [Rule definition](#leg007)   | —     |
| <a id="coverage-shell-leg008"></a>[LEG008](#leg008) | Not yet assessed | [Rule definition](#leg008)   | —     |
| <a id="coverage-shell-leg009"></a>[LEG009](#leg009) | Implemented      | [Shell](#leg009-shell-shell) | —     |
| <a id="coverage-shell-leg010"></a>[LEG010](#leg010) | Implemented      | [Shell](#leg010-shell-shell) | —     |
| <a id="coverage-shell-leg011"></a>[LEG011](#leg011) | Not yet assessed | [Rule definition](#leg011)   | —     |
| <a id="coverage-shell-leg012"></a>[LEG012](#leg012) | Not yet assessed | [Rule definition](#leg012)   | —     |
| <a id="coverage-shell-leg024"></a>[LEG024](#leg024) | Implemented      | [Shell](#leg024-shell-shell) | —     |
| <a id="coverage-shell-leg025"></a>[LEG025](#leg025) | Implemented      | [Shell](#leg025-shell-shell) | —     |
| <a id="coverage-shell-leg026"></a>[LEG026](#leg026) | Implemented      | [Shell](#leg026-shell-shell) | —     |
| <a id="coverage-shell-leg031"></a>[LEG031](#leg031) | Not yet assessed | [Rule definition](#leg031)   | —     |
| <a id="coverage-shell-leg034"></a>[LEG034](#leg034) | Implemented      | [Shell](#leg034-shell-shell) | —     |
| <a id="coverage-shell-leg035"></a>[LEG035](#leg035) | Implemented      | [Shell](#leg035-shell-shell) | —     |
| <a id="coverage-shell-leg036"></a>[LEG036](#leg036) | Not yet assessed | [Rule definition](#leg036)   | —     |
| <a id="coverage-shell-leg037"></a>[LEG037](#leg037) | Not yet assessed | [Rule definition](#leg037)   | —     |
| <a id="coverage-shell-leg038"></a>[LEG038](#leg038) | Implemented      | [Shell](#leg038-shell-shell) | —     |
| <a id="coverage-shell-leg039"></a>[LEG039](#leg039) | Implemented      | [Shell](#leg039-shell-shell) | —     |
| <a id="coverage-shell-leg040"></a>[LEG040](#leg040) | Implemented      | [Shell](#leg040-shell-shell) | —     |
| <a id="coverage-shell-leg041"></a>[LEG041](#leg041) | Not yet assessed | [Rule definition](#leg041)   | —     |
| <a id="coverage-shell-leg042"></a>[LEG042](#leg042) | Not yet assessed | [Rule definition](#leg042)   | —     |
| <a id="coverage-shell-leg043"></a>[LEG043](#leg043) | Not yet assessed | [Rule definition](#leg043)   | —     |
| <a id="coverage-shell-leg044"></a>[LEG044](#leg044) | Not yet assessed | [Rule definition](#leg044)   | —     |
| <a id="coverage-shell-leg045"></a>[LEG045](#leg045) | Not yet assessed | [Rule definition](#leg045)   | —     |
| <a id="coverage-shell-leg046"></a>[LEG046](#leg046) | Not yet assessed | [Rule definition](#leg046)   | —     |
| <a id="coverage-shell-leg047"></a>[LEG047](#leg047) | Not yet assessed | [Rule definition](#leg047)   | —     |
| <a id="coverage-shell-leg048"></a>[LEG048](#leg048) | Not yet assessed | [Rule definition](#leg048)   | —     |
| <a id="coverage-shell-leg049"></a>[LEG049](#leg049) | Not yet assessed | [Rule definition](#leg049)   | —     |
| <a id="coverage-shell-leg050"></a>[LEG050](#leg050) | Not yet assessed | [Rule definition](#leg050)   | —     |
| <a id="coverage-shell-leg051"></a>[LEG051](#leg051) | Not yet assessed | [Rule definition](#leg051)   | —     |
| <a id="coverage-shell-leg052"></a>[LEG052](#leg052) | Not yet assessed | [Rule definition](#leg052)   | —     |
| <a id="coverage-shell-leg053"></a>[LEG053](#leg053) | Not yet assessed | [Rule definition](#leg053)   | —     |
| <a id="coverage-shell-leg054"></a>[LEG054](#leg054) | Not yet assessed | [Rule definition](#leg054)   | —     |
| <a id="coverage-shell-leg055"></a>[LEG055](#leg055) | Not yet assessed | [Rule definition](#leg055)   | —     |
| <a id="coverage-shell-leg056"></a>[LEG056](#leg056) | Not yet assessed | [Rule definition](#leg056)   | —     |
| <a id="coverage-shell-leg057"></a>[LEG057](#leg057) | Not yet assessed | [Rule definition](#leg057)   | —     |
| <a id="coverage-shell-leg058"></a>[LEG058](#leg058) | Not yet assessed | [Rule definition](#leg058)   | —     |
| <a id="coverage-shell-leg059"></a>[LEG059](#leg059) | Not yet assessed | [Rule definition](#leg059)   | —     |
| <a id="coverage-shell-leg060"></a>[LEG060](#leg060) | Not yet assessed | [Rule definition](#leg060)   | —     |
| <a id="coverage-shell-leg061"></a>[LEG061](#leg061) | Implemented      | [Shell](#leg061-shell-shell) | —     |
| <a id="coverage-shell-leg062"></a>[LEG062](#leg062) | Not yet assessed | [Rule definition](#leg062)   | —     |
| <a id="coverage-shell-leg063"></a>[LEG063](#leg063) | Implemented      | [Shell](#leg063-shell-shell) | —     |
| <a id="coverage-shell-leg064"></a>[LEG064](#leg064) | Not yet assessed | [Rule definition](#leg064)   | —     |
| <a id="coverage-shell-leg065"></a>[LEG065](#leg065) | Not yet assessed | [Rule definition](#leg065)   | —     |
| <a id="coverage-shell-leg066"></a>[LEG066](#leg066) | Not yet assessed | [Rule definition](#leg066)   | —     |
| <a id="coverage-shell-leg067"></a>[LEG067](#leg067) | Not yet assessed | [Rule definition](#leg067)   | —     |
| <a id="coverage-shell-leg068"></a>[LEG068](#leg068) | Not yet assessed | [Rule definition](#leg068)   | —     |
| <a id="coverage-shell-leg069"></a>[LEG069](#leg069) | Implemented      | [Shell](#leg069-shell-shell) | —     |
| <a id="coverage-shell-leg071"></a>[LEG071](#leg071) | Not yet assessed | [Rule definition](#leg071)   | —     |
| <a id="coverage-shell-leg072"></a>[LEG072](#leg072) | Not yet assessed | [Rule definition](#leg072)   | —     |
| <a id="coverage-shell-leg073"></a>[LEG073](#leg073) | Not yet assessed | [Rule definition](#leg073)   | —     |
| <a id="coverage-shell-leg074"></a>[LEG074](#leg074) | Not yet assessed | [Rule definition](#leg074)   | —     |
| <a id="coverage-shell-leg075"></a>[LEG075](#leg075) | Not yet assessed | [Rule definition](#leg075)   | —     |
| <a id="coverage-shell-leg076"></a>[LEG076](#leg076) | Not yet assessed | [Rule definition](#leg076)   | —     |
| <a id="coverage-shell-leg077"></a>[LEG077](#leg077) | Not yet assessed | [Rule definition](#leg077)   | —     |
| <a id="coverage-shell-leg078"></a>[LEG078](#leg078) | Not yet assessed | [Rule definition](#leg078)   | —     |
| <a id="coverage-shell-leg079"></a>[LEG079](#leg079) | Not yet assessed | [Rule definition](#leg079)   | —     |
| <a id="coverage-shell-leg081"></a>[LEG081](#leg081) | Implemented      | [Shell](#leg081-shell-shell) | —     |
| <a id="coverage-shell-leg082"></a>[LEG082](#leg082) | Implemented      | [Shell](#leg082-shell-shell) | —     |

<a id="coverage-sql"></a>

### SQL coverage

| ID                                                | Status           | Implementation / evidence              | Notes |
| ------------------------------------------------- | ---------------- | -------------------------------------- | ----- |
| <a id="coverage-sql-leg001"></a>[LEG001](#leg001) | Not yet assessed | [Rule definition](#leg001)             | —     |
| <a id="coverage-sql-leg002"></a>[LEG002](#leg002) | Not yet assessed | [Rule definition](#leg002)             | —     |
| <a id="coverage-sql-leg003"></a>[LEG003](#leg003) | Not yet assessed | [Rule definition](#leg003)             | —     |
| <a id="coverage-sql-leg005"></a>[LEG005](#leg005) | Not yet assessed | [Rule definition](#leg005)             | —     |
| <a id="coverage-sql-leg006"></a>[LEG006](#leg006) | Not yet assessed | [Rule definition](#leg006)             | —     |
| <a id="coverage-sql-leg007"></a>[LEG007](#leg007) | Not yet assessed | [Rule definition](#leg007)             | —     |
| <a id="coverage-sql-leg008"></a>[LEG008](#leg008) | Not yet assessed | [Rule definition](#leg008)             | —     |
| <a id="coverage-sql-leg009"></a>[LEG009](#leg009) | Not yet assessed | [Rule definition](#leg009)             | —     |
| <a id="coverage-sql-leg010"></a>[LEG010](#leg010) | Not yet assessed | [Rule definition](#leg010)             | —     |
| <a id="coverage-sql-leg011"></a>[LEG011](#leg011) | Not yet assessed | [Rule definition](#leg011)             | —     |
| <a id="coverage-sql-leg012"></a>[LEG012](#leg012) | Not yet assessed | [Rule definition](#leg012)             | —     |
| <a id="coverage-sql-leg024"></a>[LEG024](#leg024) | Not yet assessed | [Rule definition](#leg024)             | —     |
| <a id="coverage-sql-leg025"></a>[LEG025](#leg025) | Not yet assessed | [Rule definition](#leg025)             | —     |
| <a id="coverage-sql-leg026"></a>[LEG026](#leg026) | Not yet assessed | [Rule definition](#leg026)             | —     |
| <a id="coverage-sql-leg031"></a>[LEG031](#leg031) | Not yet assessed | [Rule definition](#leg031)             | —     |
| <a id="coverage-sql-leg034"></a>[LEG034](#leg034) | Not yet assessed | [Rule definition](#leg034)             | —     |
| <a id="coverage-sql-leg035"></a>[LEG035](#leg035) | Not yet assessed | [Rule definition](#leg035)             | —     |
| <a id="coverage-sql-leg036"></a>[LEG036](#leg036) | Not yet assessed | [Rule definition](#leg036)             | —     |
| <a id="coverage-sql-leg037"></a>[LEG037](#leg037) | Not yet assessed | [Rule definition](#leg037)             | —     |
| <a id="coverage-sql-leg038"></a>[LEG038](#leg038) | Not yet assessed | [Rule definition](#leg038)             | —     |
| <a id="coverage-sql-leg039"></a>[LEG039](#leg039) | Implemented      | [SQLFluff](#leg039-sql-jinja-sqlfluff) | —     |
| <a id="coverage-sql-leg040"></a>[LEG040](#leg040) | Not yet assessed | [Rule definition](#leg040)             | —     |
| <a id="coverage-sql-leg041"></a>[LEG041](#leg041) | Not yet assessed | [Rule definition](#leg041)             | —     |
| <a id="coverage-sql-leg042"></a>[LEG042](#leg042) | Not yet assessed | [Rule definition](#leg042)             | —     |
| <a id="coverage-sql-leg043"></a>[LEG043](#leg043) | Not yet assessed | [Rule definition](#leg043)             | —     |
| <a id="coverage-sql-leg044"></a>[LEG044](#leg044) | Not yet assessed | [Rule definition](#leg044)             | —     |
| <a id="coverage-sql-leg045"></a>[LEG045](#leg045) | Not yet assessed | [Rule definition](#leg045)             | —     |
| <a id="coverage-sql-leg046"></a>[LEG046](#leg046) | Not yet assessed | [Rule definition](#leg046)             | —     |
| <a id="coverage-sql-leg047"></a>[LEG047](#leg047) | Not yet assessed | [Rule definition](#leg047)             | —     |
| <a id="coverage-sql-leg048"></a>[LEG048](#leg048) | Not yet assessed | [Rule definition](#leg048)             | —     |
| <a id="coverage-sql-leg049"></a>[LEG049](#leg049) | Not yet assessed | [Rule definition](#leg049)             | —     |
| <a id="coverage-sql-leg050"></a>[LEG050](#leg050) | Not yet assessed | [Rule definition](#leg050)             | —     |
| <a id="coverage-sql-leg051"></a>[LEG051](#leg051) | Not yet assessed | [Rule definition](#leg051)             | —     |
| <a id="coverage-sql-leg052"></a>[LEG052](#leg052) | Not yet assessed | [Rule definition](#leg052)             | —     |
| <a id="coverage-sql-leg053"></a>[LEG053](#leg053) | Not yet assessed | [Rule definition](#leg053)             | —     |
| <a id="coverage-sql-leg054"></a>[LEG054](#leg054) | Not yet assessed | [Rule definition](#leg054)             | —     |
| <a id="coverage-sql-leg055"></a>[LEG055](#leg055) | Not yet assessed | [Rule definition](#leg055)             | —     |
| <a id="coverage-sql-leg056"></a>[LEG056](#leg056) | Not yet assessed | [Rule definition](#leg056)             | —     |
| <a id="coverage-sql-leg057"></a>[LEG057](#leg057) | Not yet assessed | [Rule definition](#leg057)             | —     |
| <a id="coverage-sql-leg058"></a>[LEG058](#leg058) | Not yet assessed | [Rule definition](#leg058)             | —     |
| <a id="coverage-sql-leg059"></a>[LEG059](#leg059) | Not yet assessed | [Rule definition](#leg059)             | —     |
| <a id="coverage-sql-leg060"></a>[LEG060](#leg060) | Not yet assessed | [Rule definition](#leg060)             | —     |
| <a id="coverage-sql-leg061"></a>[LEG061](#leg061) | Implemented      | [SQLFluff](#leg061-sql-jinja-sqlfluff) | —     |
| <a id="coverage-sql-leg062"></a>[LEG062](#leg062) | Not yet assessed | [Rule definition](#leg062)             | —     |
| <a id="coverage-sql-leg063"></a>[LEG063](#leg063) | Not yet assessed | [Rule definition](#leg063)             | —     |
| <a id="coverage-sql-leg064"></a>[LEG064](#leg064) | Not yet assessed | [Rule definition](#leg064)             | —     |
| <a id="coverage-sql-leg065"></a>[LEG065](#leg065) | Not yet assessed | [Rule definition](#leg065)             | —     |
| <a id="coverage-sql-leg066"></a>[LEG066](#leg066) | Not yet assessed | [Rule definition](#leg066)             | —     |
| <a id="coverage-sql-leg067"></a>[LEG067](#leg067) | Not yet assessed | [Rule definition](#leg067)             | —     |
| <a id="coverage-sql-leg068"></a>[LEG068](#leg068) | Not yet assessed | [Rule definition](#leg068)             | —     |
| <a id="coverage-sql-leg069"></a>[LEG069](#leg069) | Not yet assessed | [Rule definition](#leg069)             | —     |
| <a id="coverage-sql-leg071"></a>[LEG071](#leg071) | Not yet assessed | [Rule definition](#leg071)             | —     |
| <a id="coverage-sql-leg072"></a>[LEG072](#leg072) | Not yet assessed | [Rule definition](#leg072)             | —     |
| <a id="coverage-sql-leg073"></a>[LEG073](#leg073) | Not yet assessed | [Rule definition](#leg073)             | —     |
| <a id="coverage-sql-leg074"></a>[LEG074](#leg074) | Not yet assessed | [Rule definition](#leg074)             | —     |
| <a id="coverage-sql-leg075"></a>[LEG075](#leg075) | Not yet assessed | [Rule definition](#leg075)             | —     |
| <a id="coverage-sql-leg076"></a>[LEG076](#leg076) | Not yet assessed | [Rule definition](#leg076)             | —     |
| <a id="coverage-sql-leg077"></a>[LEG077](#leg077) | Not yet assessed | [Rule definition](#leg077)             | —     |
| <a id="coverage-sql-leg078"></a>[LEG078](#leg078) | Not yet assessed | [Rule definition](#leg078)             | —     |
| <a id="coverage-sql-leg079"></a>[LEG079](#leg079) | Not yet assessed | [Rule definition](#leg079)             | —     |
| <a id="coverage-sql-leg081"></a>[LEG081](#leg081) | Not yet assessed | [Rule definition](#leg081)             | —     |
| <a id="coverage-sql-leg082"></a>[LEG082](#leg082) | Not yet assessed | [Rule definition](#leg082)             | —     |

<a id="coverage-jinja"></a>

### Jinja coverage

| ID                                                  | Status           | Implementation / evidence              | Notes |
| --------------------------------------------------- | ---------------- | -------------------------------------- | ----- |
| <a id="coverage-jinja-leg001"></a>[LEG001](#leg001) | Not yet assessed | [Rule definition](#leg001)             | —     |
| <a id="coverage-jinja-leg002"></a>[LEG002](#leg002) | Not yet assessed | [Rule definition](#leg002)             | —     |
| <a id="coverage-jinja-leg003"></a>[LEG003](#leg003) | Not yet assessed | [Rule definition](#leg003)             | —     |
| <a id="coverage-jinja-leg005"></a>[LEG005](#leg005) | Not yet assessed | [Rule definition](#leg005)             | —     |
| <a id="coverage-jinja-leg006"></a>[LEG006](#leg006) | Not yet assessed | [Rule definition](#leg006)             | —     |
| <a id="coverage-jinja-leg007"></a>[LEG007](#leg007) | Not yet assessed | [Rule definition](#leg007)             | —     |
| <a id="coverage-jinja-leg008"></a>[LEG008](#leg008) | Not yet assessed | [Rule definition](#leg008)             | —     |
| <a id="coverage-jinja-leg009"></a>[LEG009](#leg009) | Not yet assessed | [Rule definition](#leg009)             | —     |
| <a id="coverage-jinja-leg010"></a>[LEG010](#leg010) | Not yet assessed | [Rule definition](#leg010)             | —     |
| <a id="coverage-jinja-leg011"></a>[LEG011](#leg011) | Not yet assessed | [Rule definition](#leg011)             | —     |
| <a id="coverage-jinja-leg012"></a>[LEG012](#leg012) | Not yet assessed | [Rule definition](#leg012)             | —     |
| <a id="coverage-jinja-leg024"></a>[LEG024](#leg024) | Not yet assessed | [Rule definition](#leg024)             | —     |
| <a id="coverage-jinja-leg025"></a>[LEG025](#leg025) | Not yet assessed | [Rule definition](#leg025)             | —     |
| <a id="coverage-jinja-leg026"></a>[LEG026](#leg026) | Not yet assessed | [Rule definition](#leg026)             | —     |
| <a id="coverage-jinja-leg031"></a>[LEG031](#leg031) | Not yet assessed | [Rule definition](#leg031)             | —     |
| <a id="coverage-jinja-leg034"></a>[LEG034](#leg034) | Not yet assessed | [Rule definition](#leg034)             | —     |
| <a id="coverage-jinja-leg035"></a>[LEG035](#leg035) | Not yet assessed | [Rule definition](#leg035)             | —     |
| <a id="coverage-jinja-leg036"></a>[LEG036](#leg036) | Not yet assessed | [Rule definition](#leg036)             | —     |
| <a id="coverage-jinja-leg037"></a>[LEG037](#leg037) | Not yet assessed | [Rule definition](#leg037)             | —     |
| <a id="coverage-jinja-leg038"></a>[LEG038](#leg038) | Not yet assessed | [Rule definition](#leg038)             | —     |
| <a id="coverage-jinja-leg039"></a>[LEG039](#leg039) | Implemented      | [SQLFluff](#leg039-sql-jinja-sqlfluff) | —     |
| <a id="coverage-jinja-leg040"></a>[LEG040](#leg040) | Not yet assessed | [Rule definition](#leg040)             | —     |
| <a id="coverage-jinja-leg041"></a>[LEG041](#leg041) | Not yet assessed | [Rule definition](#leg041)             | —     |
| <a id="coverage-jinja-leg042"></a>[LEG042](#leg042) | Not yet assessed | [Rule definition](#leg042)             | —     |
| <a id="coverage-jinja-leg043"></a>[LEG043](#leg043) | Not yet assessed | [Rule definition](#leg043)             | —     |
| <a id="coverage-jinja-leg044"></a>[LEG044](#leg044) | Not yet assessed | [Rule definition](#leg044)             | —     |
| <a id="coverage-jinja-leg045"></a>[LEG045](#leg045) | Not yet assessed | [Rule definition](#leg045)             | —     |
| <a id="coverage-jinja-leg046"></a>[LEG046](#leg046) | Not yet assessed | [Rule definition](#leg046)             | —     |
| <a id="coverage-jinja-leg047"></a>[LEG047](#leg047) | Not yet assessed | [Rule definition](#leg047)             | —     |
| <a id="coverage-jinja-leg048"></a>[LEG048](#leg048) | Not yet assessed | [Rule definition](#leg048)             | —     |
| <a id="coverage-jinja-leg049"></a>[LEG049](#leg049) | Not yet assessed | [Rule definition](#leg049)             | —     |
| <a id="coverage-jinja-leg050"></a>[LEG050](#leg050) | Not yet assessed | [Rule definition](#leg050)             | —     |
| <a id="coverage-jinja-leg051"></a>[LEG051](#leg051) | Not yet assessed | [Rule definition](#leg051)             | —     |
| <a id="coverage-jinja-leg052"></a>[LEG052](#leg052) | Not yet assessed | [Rule definition](#leg052)             | —     |
| <a id="coverage-jinja-leg053"></a>[LEG053](#leg053) | Not yet assessed | [Rule definition](#leg053)             | —     |
| <a id="coverage-jinja-leg054"></a>[LEG054](#leg054) | Not yet assessed | [Rule definition](#leg054)             | —     |
| <a id="coverage-jinja-leg055"></a>[LEG055](#leg055) | Not yet assessed | [Rule definition](#leg055)             | —     |
| <a id="coverage-jinja-leg056"></a>[LEG056](#leg056) | Not yet assessed | [Rule definition](#leg056)             | —     |
| <a id="coverage-jinja-leg057"></a>[LEG057](#leg057) | Not yet assessed | [Rule definition](#leg057)             | —     |
| <a id="coverage-jinja-leg058"></a>[LEG058](#leg058) | Not yet assessed | [Rule definition](#leg058)             | —     |
| <a id="coverage-jinja-leg059"></a>[LEG059](#leg059) | Not yet assessed | [Rule definition](#leg059)             | —     |
| <a id="coverage-jinja-leg060"></a>[LEG060](#leg060) | Not yet assessed | [Rule definition](#leg060)             | —     |
| <a id="coverage-jinja-leg061"></a>[LEG061](#leg061) | Implemented      | [SQLFluff](#leg061-sql-jinja-sqlfluff) | —     |
| <a id="coverage-jinja-leg062"></a>[LEG062](#leg062) | Not yet assessed | [Rule definition](#leg062)             | —     |
| <a id="coverage-jinja-leg063"></a>[LEG063](#leg063) | Not yet assessed | [Rule definition](#leg063)             | —     |
| <a id="coverage-jinja-leg064"></a>[LEG064](#leg064) | Not yet assessed | [Rule definition](#leg064)             | —     |
| <a id="coverage-jinja-leg065"></a>[LEG065](#leg065) | Not yet assessed | [Rule definition](#leg065)             | —     |
| <a id="coverage-jinja-leg066"></a>[LEG066](#leg066) | Not yet assessed | [Rule definition](#leg066)             | —     |
| <a id="coverage-jinja-leg067"></a>[LEG067](#leg067) | Not yet assessed | [Rule definition](#leg067)             | —     |
| <a id="coverage-jinja-leg068"></a>[LEG068](#leg068) | Not yet assessed | [Rule definition](#leg068)             | —     |
| <a id="coverage-jinja-leg069"></a>[LEG069](#leg069) | Not yet assessed | [Rule definition](#leg069)             | —     |
| <a id="coverage-jinja-leg071"></a>[LEG071](#leg071) | Not yet assessed | [Rule definition](#leg071)             | —     |
| <a id="coverage-jinja-leg072"></a>[LEG072](#leg072) | Not yet assessed | [Rule definition](#leg072)             | —     |
| <a id="coverage-jinja-leg073"></a>[LEG073](#leg073) | Not yet assessed | [Rule definition](#leg073)             | —     |
| <a id="coverage-jinja-leg074"></a>[LEG074](#leg074) | Not yet assessed | [Rule definition](#leg074)             | —     |
| <a id="coverage-jinja-leg075"></a>[LEG075](#leg075) | Not yet assessed | [Rule definition](#leg075)             | —     |
| <a id="coverage-jinja-leg076"></a>[LEG076](#leg076) | Not yet assessed | [Rule definition](#leg076)             | —     |
| <a id="coverage-jinja-leg077"></a>[LEG077](#leg077) | Not yet assessed | [Rule definition](#leg077)             | —     |
| <a id="coverage-jinja-leg078"></a>[LEG078](#leg078) | Not yet assessed | [Rule definition](#leg078)             | —     |
| <a id="coverage-jinja-leg079"></a>[LEG079](#leg079) | Not yet assessed | [Rule definition](#leg079)             | —     |
| <a id="coverage-jinja-leg081"></a>[LEG081](#leg081) | Not yet assessed | [Rule definition](#leg081)             | —     |
| <a id="coverage-jinja-leg082"></a>[LEG082](#leg082) | Not yet assessed | [Rule definition](#leg082)             | —     |

<a id="coverage-c"></a>

### C coverage

| ID                                              | Status                    | Implementation / evidence                                                                                                                                                                                                                                                    | Notes                                                               |
| ----------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| <a id="coverage-c-leg001"></a>[LEG001](#leg001) | Implemented               | [Clang](#leg001-c-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-c-leg002"></a>[LEG002](#leg002) | Implemented               | [Clang](#leg002-c-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-c-leg003"></a>[LEG003](#leg003) | Partial native coverage   | [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html); [setup](#leg003-c-clang)                                                                                                                                       | Off by default; our limit is 3. Counts the function body.           |
| <a id="coverage-c-leg005"></a>[LEG005](#leg005) | Not implemented           | [Clang](#leg005-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg006"></a>[LEG006](#leg006) | Implemented               | [Clang](#leg006-c-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-c-leg007"></a>[LEG007](#leg007) | Not implemented           | [Clang](#leg007-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg008"></a>[LEG008](#leg008) | Not implemented           | [Clang](#leg008-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg009"></a>[LEG009](#leg009) | Provided by native linter | [`readability-else-after-return`](https://clang.llvm.org/extra/clang-tidy/checks/readability/else-after-return.html); [setup](#leg009-c-clang)                                                                                                                               | Off by default; enabled in our config.                              |
| <a id="coverage-c-leg010"></a>[LEG010](#leg010) | Not implemented           | [Clang](#leg010-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg011"></a>[LEG011](#leg011) | Not yet assessed          | [Rule definition](#leg011)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg012"></a>[LEG012](#leg012) | Not implemented           | [Clang](#leg012-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg024"></a>[LEG024](#leg024) | Not implemented           | [Clang](#leg024-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg025"></a>[LEG025](#leg025) | Not yet assessed          | [Rule definition](#leg025)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg026"></a>[LEG026](#leg026) | Not yet assessed          | [Rule definition](#leg026)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg031"></a>[LEG031](#leg031) | Not implemented           | [Clang](#leg031-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg034"></a>[LEG034](#leg034) | Not implemented           | [Clang](#leg034-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg035"></a>[LEG035](#leg035) | Implemented               | [Clang](#leg035-c-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-c-leg036"></a>[LEG036](#leg036) | Not yet assessed          | [Rule definition](#leg036)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg037"></a>[LEG037](#leg037) | Not yet assessed          | [Rule definition](#leg037)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg038"></a>[LEG038](#leg038) | Partial native coverage   | [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html); [setup](#leg038-c-clang)                                                                                                                                       | Off by default; our limit is 20. Line counting differs.             |
| <a id="coverage-c-leg039"></a>[LEG039](#leg039) | Implemented               | [Clang](#leg039-c-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-c-leg040"></a>[LEG040](#leg040) | Not implemented           | [Clang](#leg040-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg041"></a>[LEG041](#leg041) | Not yet assessed          | [Rule definition](#leg041)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg042"></a>[LEG042](#leg042) | Not yet assessed          | [Rule definition](#leg042)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg043"></a>[LEG043](#leg043) | Not yet assessed          | [Rule definition](#leg043)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg044"></a>[LEG044](#leg044) | Not yet assessed          | [Rule definition](#leg044)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg045"></a>[LEG045](#leg045) | Not yet assessed          | [Rule definition](#leg045)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg046"></a>[LEG046](#leg046) | Not yet assessed          | [Rule definition](#leg046)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg047"></a>[LEG047](#leg047) | Not yet assessed          | [Rule definition](#leg047)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg048"></a>[LEG048](#leg048) | Not applicable            | [Clang](#leg048-c-clang)                                                                                                                                                                                                                                                     | —                                                                   |
| <a id="coverage-c-leg049"></a>[LEG049](#leg049) | Not applicable            | [Clang](#leg049-c-clang)                                                                                                                                                                                                                                                     | —                                                                   |
| <a id="coverage-c-leg050"></a>[LEG050](#leg050) | Not yet assessed          | [Rule definition](#leg050)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg051"></a>[LEG051](#leg051) | Implemented               | [Clang](#leg051-c-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-c-leg052"></a>[LEG052](#leg052) | Not yet assessed          | [Rule definition](#leg052)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg053"></a>[LEG053](#leg053) | Not yet assessed          | [Rule definition](#leg053)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg054"></a>[LEG054](#leg054) | Partial native coverage   | [`readability-avoid-nested-conditional-operator`](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html); [setup](#leg054-c-clang)                                                                                               | Enabled in our config. Covers nested ternaries only.                |
| <a id="coverage-c-leg055"></a>[LEG055](#leg055) | Partial native coverage   | [`bugprone-assignment-in-if-condition`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-if-condition.html); [`bugprone-assert-side-effect`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assert-side-effect.html); [setup](#leg055-c-clang) | Enabled in our config. Covers conditions and assertions only.       |
| <a id="coverage-c-leg056"></a>[LEG056](#leg056) | Not yet assessed          | [Rule definition](#leg056)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg057"></a>[LEG057](#leg057) | Not yet assessed          | [Rule definition](#leg057)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg058"></a>[LEG058](#leg058) | Not implemented           | [Clang](#leg058-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg059"></a>[LEG059](#leg059) | Not yet assessed          | [Rule definition](#leg059)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg060"></a>[LEG060](#leg060) | Not yet assessed          | [Rule definition](#leg060)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg061"></a>[LEG061](#leg061) | Not implemented           | [Clang](#leg061-c-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-c-leg062"></a>[LEG062](#leg062) | Not yet assessed          | [Rule definition](#leg062)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg063"></a>[LEG063](#leg063) | Not yet assessed          | [Rule definition](#leg063)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg064"></a>[LEG064](#leg064) | Not yet assessed          | [Rule definition](#leg064)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg065"></a>[LEG065](#leg065) | Not yet assessed          | [Rule definition](#leg065)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg066"></a>[LEG066](#leg066) | Not yet assessed          | [Rule definition](#leg066)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg067"></a>[LEG067](#leg067) | Not yet assessed          | [Rule definition](#leg067)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg068"></a>[LEG068](#leg068) | Not yet assessed          | [Rule definition](#leg068)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg069"></a>[LEG069](#leg069) | Not yet assessed          | [Rule definition](#leg069)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg071"></a>[LEG071](#leg071) | Not yet assessed          | [Rule definition](#leg071)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg072"></a>[LEG072](#leg072) | Not yet assessed          | [Rule definition](#leg072)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg073"></a>[LEG073](#leg073) | Not yet assessed          | [Rule definition](#leg073)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg074"></a>[LEG074](#leg074) | Not yet assessed          | [Rule definition](#leg074)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg075"></a>[LEG075](#leg075) | Not yet assessed          | [Rule definition](#leg075)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg076"></a>[LEG076](#leg076) | Not yet assessed          | [Rule definition](#leg076)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg077"></a>[LEG077](#leg077) | Not yet assessed          | [Rule definition](#leg077)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg078"></a>[LEG078](#leg078) | Not yet assessed          | [Rule definition](#leg078)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg079"></a>[LEG079](#leg079) | Not yet assessed          | [Rule definition](#leg079)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg081"></a>[LEG081](#leg081) | Not yet assessed          | [Rule definition](#leg081)                                                                                                                                                                                                                                                   | —                                                                   |
| <a id="coverage-c-leg082"></a>[LEG082](#leg082) | Not yet assessed          | [Rule definition](#leg082)                                                                                                                                                                                                                                                   | —                                                                   |

<a id="coverage-cplusplus"></a>

### C++ coverage

| ID                                                      | Status                    | Implementation / evidence                                                                                                                                                                                                                                                            | Notes                                                               |
| ------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| <a id="coverage-cplusplus-leg001"></a>[LEG001](#leg001) | Implemented               | [Clang](#leg001-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-cplusplus-leg002"></a>[LEG002](#leg002) | Implemented               | [Clang](#leg002-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-cplusplus-leg003"></a>[LEG003](#leg003) | Partial native coverage   | [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html); [setup](#leg003-cplusplus-clang)                                                                                                                                       | Off by default; our limit is 3. Counts the function body.           |
| <a id="coverage-cplusplus-leg005"></a>[LEG005](#leg005) | Not implemented           | [Clang](#leg005-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg006"></a>[LEG006](#leg006) | Implemented               | [Clang](#leg006-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-cplusplus-leg007"></a>[LEG007](#leg007) | Not implemented           | [Clang](#leg007-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg008"></a>[LEG008](#leg008) | Not implemented           | [Clang](#leg008-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg009"></a>[LEG009](#leg009) | Provided by native linter | [`readability-else-after-return`](https://clang.llvm.org/extra/clang-tidy/checks/readability/else-after-return.html); [setup](#leg009-cplusplus-clang)                                                                                                                               | Off by default; enabled in our config.                              |
| <a id="coverage-cplusplus-leg010"></a>[LEG010](#leg010) | Not implemented           | [Clang](#leg010-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg011"></a>[LEG011](#leg011) | Not implemented           | [Clang](#leg011-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg012"></a>[LEG012](#leg012) | Not implemented           | [Clang](#leg012-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg024"></a>[LEG024](#leg024) | Not implemented           | [Clang](#leg024-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg025"></a>[LEG025](#leg025) | Not yet assessed          | [Rule definition](#leg025)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg026"></a>[LEG026](#leg026) | Not implemented           | [Clang](#leg026-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg031"></a>[LEG031](#leg031) | Not implemented           | [Clang](#leg031-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg034"></a>[LEG034](#leg034) | Not implemented           | [Clang](#leg034-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg035"></a>[LEG035](#leg035) | Implemented               | [Clang](#leg035-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-cplusplus-leg036"></a>[LEG036](#leg036) | Implemented               | [Clang](#leg036-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Coverage established only for the documented example.        |
| <a id="coverage-cplusplus-leg037"></a>[LEG037](#leg037) | Not implemented           | [Clang](#leg037-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg038"></a>[LEG038](#leg038) | Partial native coverage   | [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html); [setup](#leg038-cplusplus-clang)                                                                                                                                       | Off by default; our limit is 20. Line counting differs.             |
| <a id="coverage-cplusplus-leg039"></a>[LEG039](#leg039) | Implemented               | [Clang](#leg039-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-cplusplus-leg040"></a>[LEG040](#leg040) | Not implemented           | [Clang](#leg040-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg041"></a>[LEG041](#leg041) | Not yet assessed          | [Rule definition](#leg041)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg042"></a>[LEG042](#leg042) | Not yet assessed          | [Rule definition](#leg042)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg043"></a>[LEG043](#leg043) | Not yet assessed          | [Rule definition](#leg043)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg044"></a>[LEG044](#leg044) | Not yet assessed          | [Rule definition](#leg044)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg045"></a>[LEG045](#leg045) | Not yet assessed          | [Rule definition](#leg045)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg046"></a>[LEG046](#leg046) | Not yet assessed          | [Rule definition](#leg046)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg047"></a>[LEG047](#leg047) | Provided by native linter | [`modernize-loop-convert`](https://clang.llvm.org/extra/clang-tidy/checks/modernize/loop-convert.html); [setup](#leg047-cplusplus-clang)                                                                                                                                             | Off by default; enabled in our config. C++ only.                    |
| <a id="coverage-cplusplus-leg048"></a>[LEG048](#leg048) | Not applicable            | [Clang](#leg048-cplusplus-clang)                                                                                                                                                                                                                                                     | —                                                                   |
| <a id="coverage-cplusplus-leg049"></a>[LEG049](#leg049) | Not applicable            | [Clang](#leg049-cplusplus-clang)                                                                                                                                                                                                                                                     | —                                                                   |
| <a id="coverage-cplusplus-leg050"></a>[LEG050](#leg050) | Not yet assessed          | [Rule definition](#leg050)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg051"></a>[LEG051](#leg051) | Implemented               | [Clang](#leg051-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Local working-tree implementation; not verified as released. |
| <a id="coverage-cplusplus-leg052"></a>[LEG052](#leg052) | Not yet assessed          | [Rule definition](#leg052)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg053"></a>[LEG053](#leg053) | Not yet assessed          | [Rule definition](#leg053)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg054"></a>[LEG054](#leg054) | Partial native coverage   | [`readability-avoid-nested-conditional-operator`](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html); [setup](#leg054-cplusplus-clang)                                                                                               | Enabled in our config. Covers nested ternaries only.                |
| <a id="coverage-cplusplus-leg055"></a>[LEG055](#leg055) | Partial native coverage   | [`bugprone-assignment-in-if-condition`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-if-condition.html); [`bugprone-assert-side-effect`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assert-side-effect.html); [setup](#leg055-cplusplus-clang) | Enabled in our config. Covers conditions and assertions only.       |
| <a id="coverage-cplusplus-leg056"></a>[LEG056](#leg056) | Not implemented           | [Clang](#leg056-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg057"></a>[LEG057](#leg057) | Not implemented           | [Clang](#leg057-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg058"></a>[LEG058](#leg058) | Not implemented           | [Clang](#leg058-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg059"></a>[LEG059](#leg059) | Not implemented           | [Clang](#leg059-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg060"></a>[LEG060](#leg060) | Not implemented           | [Clang](#leg060-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg061"></a>[LEG061](#leg061) | Not implemented           | [Clang](#leg061-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg062"></a>[LEG062](#leg062) | Not implemented           | [Clang](#leg062-cplusplus-clang)                                                                                                                                                                                                                                                     | Clang: Known implementation gap.                                    |
| <a id="coverage-cplusplus-leg063"></a>[LEG063](#leg063) | Not yet assessed          | [Rule definition](#leg063)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg064"></a>[LEG064](#leg064) | Not yet assessed          | [Rule definition](#leg064)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg065"></a>[LEG065](#leg065) | Not yet assessed          | [Rule definition](#leg065)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg066"></a>[LEG066](#leg066) | Not yet assessed          | [Rule definition](#leg066)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg067"></a>[LEG067](#leg067) | Not yet assessed          | [Rule definition](#leg067)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg068"></a>[LEG068](#leg068) | Not yet assessed          | [Rule definition](#leg068)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg069"></a>[LEG069](#leg069) | Not yet assessed          | [Rule definition](#leg069)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg071"></a>[LEG071](#leg071) | Not yet assessed          | [Rule definition](#leg071)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg072"></a>[LEG072](#leg072) | Not yet assessed          | [Rule definition](#leg072)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg073"></a>[LEG073](#leg073) | Not yet assessed          | [Rule definition](#leg073)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg074"></a>[LEG074](#leg074) | Not yet assessed          | [Rule definition](#leg074)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg075"></a>[LEG075](#leg075) | Not yet assessed          | [Rule definition](#leg075)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg076"></a>[LEG076](#leg076) | Not yet assessed          | [Rule definition](#leg076)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg077"></a>[LEG077](#leg077) | Not yet assessed          | [Rule definition](#leg077)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg078"></a>[LEG078](#leg078) | Not yet assessed          | [Rule definition](#leg078)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg079"></a>[LEG079](#leg079) | Not yet assessed          | [Rule definition](#leg079)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg081"></a>[LEG081](#leg081) | Not yet assessed          | [Rule definition](#leg081)                                                                                                                                                                                                                                                           | —                                                                   |
| <a id="coverage-cplusplus-leg082"></a>[LEG082](#leg082) | Not yet assessed          | [Rule definition](#leg082)                                                                                                                                                                                                                                                           | —                                                                   |

## Rule details

<a id="leg001"></a>

### LEG001 — max-expression-operators

Limit operators inside a single expression.

| Language                | Plugin / current rule                         | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-max-expression-operators`  | [C](#coverage-c-leg001)                                                               | [Examples and source](#leg001-c-clang)                      | - `MaxOperators: unsigned integer`: allowed operators per expression. Default: `4`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                                                                                    |
| C++                     | Clang: `legibility-max-expression-operators`  | [C++](#coverage-cplusplus-leg001)                                                     | [Examples and source](#leg001-cplusplus-clang)              | - `MaxOperators: unsigned integer`: allowed operators per expression. Default: `4`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                                                                                    |
| Go                      | Go: `LEG001 / max-expression-operators`       | [Go](#coverage-go-leg001)                                                             | [Examples and source](#leg001-go-go)                        | `max-expression-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                            |
| JavaScript / TypeScript | ESLint: `legibility/max-expression-operators` | [JavaScript](#coverage-javascript-leg001) / [TypeScript](#coverage-typescript-leg001) | [Examples and source](#leg001-javascript-typescript-eslint) | - `{max: number}`: allowed weighted operators. Default: `4`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/max-expression-operators` | [JavaScript](#coverage-javascript-leg001) / [TypeScript](#coverage-typescript-leg001) | [Examples and source](#leg001-javascript-typescript-oxlint) | - `{max: number}`: allowed weighted operators. Default: `4`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG001 / max-expression-operators`   | [Python](#coverage-python-leg001)                                                     | [Examples and source](#leg001-python-python)                | `max-expression-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                                        |
| Shell                   | Shell: `LEG001 / max-expression-operators`    | [Shell](#coverage-shell-leg001)                                                       | [Examples and source](#leg001-shell-shell)                  | `max-expression-operators: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                                                                   |

<a id="leg001-c-clang"></a>

#### C — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#max-expression-operators)

```diff
- return a > 0 && b > 0 && !ready;
+ const bool bothPositive = a > 0 && b > 0;
+ return bothPositive && !ready;
```

<a id="leg001-cplusplus-clang"></a>

#### C++ — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#max-expression-operators)

```diff
- return a > 0 && b > 0 && !ready;
+ const bool bothPositive = a > 0 && b > 0;
+ return bothPositive && !ready;
```

<a id="leg001-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg001-max-expression-operators)

```diff
- return user.Active && user.Score > 10 && (user.Role == "admin" || user.Role == "owner")
+ isAdmin := user.Role == "admin"
+ isOwner := user.Role == "owner"
+ hasPrivilegedRole := isAdmin || isOwner
+ return user.Active && user.Score > 10 && hasPrivilegedRole
```

<a id="leg001-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#max-expression-operators)

```diff
- return user && user.active && (user.role === "admin" || user.role === "owner");
+ const isAdmin = user.role === "admin";
+ const isOwner = user.role === "owner";
+ const hasPrivilegedRole = isAdmin || isOwner;
+
+ return user && user.active && hasPrivilegedRole;
```

<a id="leg001-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#max-expression-operators)

```diff
- return user && user.active && !user.locked && (user.role === "admin" || user.role === "owner");
+ const isAdmin = user?.role === "admin";
+ const isOwner = user?.role === "owner";
+ const hasPrivilegedRole = isAdmin || isOwner;
+
+ return user && user.active && !user.locked && hasPrivilegedRole;
```

<a id="leg001-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg001-example-diff)

Current selector: `LEG001`.

```diff
- return user.is_active and user.score > 10 and (user.role == "admin" or user.role == "owner")
+ is_admin = user.role == "admin"
+ is_owner = user.role == "owner"
+ has_privileged_role = is_admin or is_owner
+ return user.is_active and user.score > 10 and has_privileged_role
```

<a id="leg001-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#max-expression-operators-diff)

Limit readable operators inside a single command expression.

```diff
- build && test && package && publish && notify
+ build
+ test
+ package
+ publish
+ notify
```

<a id="leg002"></a>

### LEG002 — hoist-if-operators

Prefer named booleans before operator-heavy conditions.

| Language                | Plugin / current rule                   | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-hoist-if-operators`  | [C](#coverage-c-leg002)                                                               | [Examples and source](#leg002-c-clang)                      | - `MaxOperators: unsigned integer`: allowed logical or conditional operators in an `if` condition. Default: `0`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                                                                                                               |
| C++                     | Clang: `legibility-hoist-if-operators`  | [C++](#coverage-cplusplus-leg002)                                                     | [Examples and source](#leg002-cplusplus-clang)              | - `MaxOperators: unsigned integer`: allowed logical or conditional operators in an `if` condition. Default: `0`.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                                                                                                                               |
| Go                      | Go: `LEG002 / hoist-if-operators`       | [Go](#coverage-go-leg002)                                                             | [Examples and source](#leg002-go-go)                        | `max-if-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                                                                                            |
| JavaScript / TypeScript | ESLint: `legibility/hoist-if-operators` | [JavaScript](#coverage-javascript-leg002) / [TypeScript](#coverage-typescript-leg002) | [Examples and source](#leg002-javascript-typescript-eslint) | - `{max: number}`: allowed weighted operators in the condition. Default: `0`. - `{operators: string[]}`: operators to count. Default: `["&&", "\|\|", "??", "?:"]`. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/hoist-if-operators` | [JavaScript](#coverage-javascript-leg002) / [TypeScript](#coverage-typescript-leg002) | [Examples and source](#leg002-javascript-typescript-oxlint) | - `{max: number}`: allowed weighted operators in the condition. Default: `0`. - `{operators: string[]}`: operators to count. Default: `["&&", "\|\|", "??", "?:"]`. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG002 / hoist-if-operators`   | [Python](#coverage-python-leg002)                                                     | [Examples and source](#leg002-python-python)                | `max-if-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                                                                                                        |
| Shell                   | Shell: `LEG002 / hoist-if-operators`    | [Shell](#coverage-shell-leg002)                                                       | [Examples and source](#leg002-shell-shell)                  | `max-if-operators: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                                                                                                                                   |

<a id="leg002-c-clang"></a>

#### C — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#hoist-if-operators)

```diff
- if (ready && allowed) {
+ const bool canProceed = ready && allowed;
+ if (canProceed) {
    proceed();
  }
```

<a id="leg002-cplusplus-clang"></a>

#### C++ — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#hoist-if-operators)

```diff
- if (ready && allowed) {
+ const bool canProceed = ready && allowed;
+ if (canProceed) {
    proceed();
  }
```

<a id="leg002-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg002-hoist-if-operators)

```diff
- if user != nil && user.Active && !user.Locked {
- 	sendInvite(user)
- }
+ canInviteUser := user != nil && user.Active && !user.Locked
+ if canInviteUser {
+ 	sendInvite(user)
+ }
```

<a id="leg002-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#hoist-if-operators)

```diff
- if (user && user.isActive && !user.isLocked) {
-   sendInvite(user);
- }
+ const canInviteUser = user && user.isActive && !user.isLocked;
+
+ if (canInviteUser) {
+   sendInvite(user);
+ }
```

<a id="leg002-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#hoist-if-operators)

```diff
- if (user && user.isActive && !user.isLocked) {
-   sendInvite(user);
- }
+ const canInviteUser = user && user.isActive && !user.isLocked;
+
+ if (canInviteUser) {
+   sendInvite(user);
+ }
```

<a id="leg002-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg002-example-diff)

Current selector: `LEG002`.

```diff
- if user and user.is_active and not user.is_locked:
-     send_invite(user)
+ can_invite_user = user and user.is_active and not user.is_locked
+ if can_invite_user:
+     send_invite(user)
```

<a id="leg002-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#hoist-if-operators-diff)

Prefer a named check before an operator-heavy `if`, `elif`, `while`, or `until` condition. Quoted data and case-pattern separators don't count as shell operators; commands inside substitutions still do.

```diff
- if [[ -n "$user" && -n "$email" ]]; then
+ user_has_contact() {
+   [[ -n "$user" && -n "$email" ]]
+ }
+
+ if user_has_contact; then
    send_invite "$user"
  fi
```

<a id="leg003"></a>

### LEG003 — max-control-flow-depth

Limit nested control-flow depth.

| Language                | Plugin / current rule                                                                                               | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html) | [C](#coverage-c-leg003)                                                               | [Examples and source](#leg003-c-clang)                      | `NestingThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                           |
| C++                     | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html) | [C++](#coverage-cplusplus-leg003)                                                     | [Examples and source](#leg003-cplusplus-clang)              | `NestingThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                           |
| Go                      | Go: `LEG003 / max-control-flow-depth`                                                                               | [Go](#coverage-go-leg003)                                                             | [Examples and source](#leg003-go-go)                        | `max-control-flow-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                      |
| JavaScript / TypeScript | ESLint: `legibility/max-control-flow-depth`                                                                         | [JavaScript](#coverage-javascript-leg003) / [TypeScript](#coverage-typescript-leg003) | [Examples and source](#leg003-javascript-typescript-eslint) | - `{max: number}`: allowed nested control-flow depth. Default: `3`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/max-control-flow-depth`                                                                         | [JavaScript](#coverage-javascript-leg003) / [TypeScript](#coverage-typescript-leg003) | [Examples and source](#leg003-javascript-typescript-oxlint) | - `{max: number}`: allowed nested control-flow depth. Default: `3`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG003 / max-control-flow-depth`                                                                           | [Python](#coverage-python-leg003)                                                     | [Examples and source](#leg003-python-python)                | `max-control-flow-depth: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                  |
| Shell                   | Shell: `LEG003 / max-control-flow-depth`                                                                            | [Shell](#coverage-shell-leg003)                                                       | [Examples and source](#leg003-shell-shell)                  | `max-control-flow-depth: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                             |

<a id="leg003-c-clang"></a>

#### C — Clang

**Default:** off, with no nesting limit. **Our config:** errors above 3.

Add `readability-function-size` to `Checks` and set:

```yaml
CheckOptions:
  readability-function-size.NestingThreshold: "3"
```

Clang counts the function body. Setting 4 passes the tested three/four-level boundary; other cases remain unverified. [Config](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/scripts/.clang-tidy).

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/readability-function-size-control-flow-depth.c` (unpublished)

```c
void step(void);
#ifdef BAD
void process(int a, int b, int c, int d) {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          step();
        }
      }
    }
  }
}
#else
void process(int a, int b, int c) {
  if (a) {
    if (b) {
      if (c) {
        step();
      }
    }
  }
}
#endif
```

<a id="leg003-cplusplus-clang"></a>

#### C++ — Clang

Same [setup and limits as C](#leg003-c-clang). Tested with C++17.

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/readability-function-size-control-flow-depth.c` (unpublished)

```c
void step(void);
#ifdef BAD
void process(int a, int b, int c, int d) {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          step();
        }
      }
    }
  }
}
#else
void process(int a, int b, int c) {
  if (a) {
    if (b) {
      if (c) {
        step();
      }
    }
  }
}
#endif
```

<a id="leg003-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg003-max-control-flow-depth)

```diff
- if user != nil {
- 	for _, invite := range invites {
- 		if invite.Pending {
- 			if invite.Retries < 3 {
- 				sendInvite(invite)
- 			}
- 		}
- 	}
- }
+ if user == nil {
+ 	return
+ }
+ for _, invite := range pendingInvites(invites) {
+ 	retryInvite(invite)
+ }
```

<a id="leg003-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#max-control-flow-depth)

```diff
- if (user) {
-   if (user.active) {
-     if (user.email) {
-       sendInvite(user);
-     }
-   }
- }
+ if (!user) return;
+ if (!user.active) return;
+ if (!user.email) return;
+
+ sendInvite(user);
```

<a id="leg003-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#max-control-flow-depth)

```diff
- if (user) {
-   if (user.active) {
-     if (user.email) {
-       if (user.canReceiveInvites) {
-         sendInvite(user);
-       }
-     }
-   }
- }
+ if (!user) return;
+ if (!user.active) return;
+ if (!user.email) return;
+ if (!user.canReceiveInvites) return;
+
+ sendInvite(user);
```

<a id="leg003-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg003-example-diff)

Current selector: `LEG003`.

```diff
- if user:
-     for invite in invites:
-         if invite.pending:
-             while invite.retries < 3:
-                 send_invite(invite)
+ if not user:
+     return
+ pending_invites = [invite for invite in invites if invite.pending]
+ for invite in pending_invites:
+     retry_invite(invite)
```

<a id="leg003-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#max-control-flow-depth-diff)

Limit nested branches and loops so the main path stays easy to scan.

```diff
- if [[ -n "$repo" ]]; then
-   if git diff --quiet; then
-     if [[ "$target" == "release" ]]; then
-       publish_release
-     fi
-   fi
- fi
+ [[ -n "$repo" ]] || exit 1
+ git diff --quiet || exit 1
+ [[ "$target" == "release" ]] || exit 0
+ publish_release
```

<a id="leg005"></a>

### LEG005 — no-quadratic-patterns

Flag likely quadratic nested loops.

| Language                | Plugin / current rule                      | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C                       | Clang: `legibility-no-quadratic-patterns`  | [C](#coverage-c-leg005)                                                               | [Examples and source](#leg005-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                   |
| C++                     | Clang: `legibility-no-quadratic-patterns`  | [C++](#coverage-cplusplus-leg005)                                                     | [Examples and source](#leg005-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                   |
| Go                      | Go: `LEG005 / no-quadratic-patterns`       | [Go](#coverage-go-leg005)                                                             | [Examples and source](#leg005-go-go)                        | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                  |
| JavaScript / TypeScript | ESLint: `legibility/no-quadratic-patterns` | [JavaScript](#coverage-javascript-leg005) / [TypeScript](#coverage-typescript-leg005) | [Examples and source](#leg005-javascript-typescript-eslint) | - `{iterationMethods: string[]}`: methods checked for nested iteration. - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-quadratic-patterns` | [JavaScript](#coverage-javascript-leg005) / [TypeScript](#coverage-typescript-leg005) | [Examples and source](#leg005-javascript-typescript-oxlint) | - `{iterationMethods: string[]}`: methods checked for nested iteration. - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG005 / no-quadratic-patterns`   | [Python](#coverage-python-leg005)                                                     | [Examples and source](#leg005-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                  |
| Shell                   | Shell: `LEG005 / no-quadratic-patterns`    | [Shell](#coverage-shell-leg005)                                                       | [Examples and source](#leg005-shell-shell)                  | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                                                |

<a id="leg005-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-quadratic-patterns.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
void assign(int user, int owner);
int findOwner(int user);
void process(const int *users, int userCount, const int *owners, int ownerCount) {
  for (int i = 0; i < userCount; ++i) {
#ifdef BAD
    for (int j = 0; j < ownerCount; ++j)
      assign(users[i], owners[j]);
#else
    assign(users[i], findOwner(users[i]));
#endif
  }
}
```

<a id="leg005-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-quadratic-patterns.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
void assign(int user, int owner);
int findOwner(int user);
void process(const int *users, int userCount, const int *owners, int ownerCount) {
  for (int i = 0; i < userCount; ++i) {
#ifdef BAD
    for (int j = 0; j < ownerCount; ++j)
      assign(users[i], owners[j]);
#else
    assign(users[i], findOwner(users[i]));
#endif
  }
}
```

<a id="leg005-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg005-no-quadratic-patterns)

```diff
- for _, user := range users {
- 	for _, owner := range owners {
- 		if user.ID == owner.UserID {
- 			assignOwner(user, owner)
- 		}
- 	}
- }
+ ownersByUserID := mapOwnersByUserID(owners)
+ for _, user := range users {
+ 	owner := ownersByUserID[user.ID]
+ 	assignOwner(user, owner)
+ }
```

<a id="leg005-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-quadratic-patterns)

```diff
- const enrichedOrders = orders.map((order) => ({
-   ...order,
-   user: users.find((user) => user.id === order.userId),
- }));
+ const usersById = new Map(users.map((user) => [user.id, user]));
+ const enrichedOrders = orders.map((order) => ({
+   ...order,
+   user: usersById.get(order.userId),
+ }));
```

<a id="leg005-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-quadratic-patterns)

```diff
- const enrichedOrders = orders.map((order) => ({
-   ...order,
-   user: users.find((user) => user.id === order.userId),
- }));
+ const usersById = new Map(users.map((user) => [user.id, user]));
+ const enrichedOrders = orders.map((order) => ({
+   ...order,
+   user: usersById.get(order.userId),
+ }));
```

<a id="leg005-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg005-example-diff)

Current selector: `LEG005`.

```diff
- for user in users:
-     for owner in owners:
-         if user.id == owner.user_id:
-             assign_owner(user, owner)
+ owners_by_user_id = {owner.user_id: owner for owner in owners}
+ for user in users:
+     owner = owners_by_user_id.get(user.id)
+     if owner is not None:
+         assign_owner(user, owner)
```

<a id="leg005-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#no-quadratic-patterns-diff)

Flag nested loops that are likely to become repeated scans.

```diff
- for user in "${users[@]}"; do
-   for owner in "${owners[@]}"; do
-     [[ "$user" == "$owner" ]] && print_owner "$user"
-   done
- done
+ declare -A owner_lookup=()
+ for owner in "${owners[@]}"; do
+   owner_lookup["$owner"]="1"
+ done
+ for user in "${users[@]}"; do
+   [[ -n "${owner_lookup[$user]:-}" ]] && print_owner "$user"
+ done
```

<a id="leg006"></a>

### LEG006 — no-redundant-boolean-logic

Avoid redundant boolean comparisons.

| Language                | Plugin / current rule                           | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-no-redundant-boolean-logic`  | [C](#coverage-c-leg006)                                                               | [Examples and source](#leg006-c-clang)                      | - `CheckTernaries: boolean`: also reject `condition ? true : false` and `condition ? false : true`. Default: `true`. Parity tests use `true` for the ESLint profile and `false` for the Go profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                               |
| C++                     | Clang: `legibility-no-redundant-boolean-logic`  | [C++](#coverage-cplusplus-leg006)                                                     | [Examples and source](#leg006-cplusplus-clang)              | - `CheckTernaries: boolean`: also reject `condition ? true : false` and `condition ? false : true`. Default: `true`. Parity tests use `true` for the ESLint profile and `false` for the Go profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                               |
| Go                      | Go: `LEG006 / no-redundant-boolean-logic`       | [Go](#coverage-go-leg006)                                                             | [Examples and source](#leg006-go-go)                        | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                          |
| JavaScript / TypeScript | ESLint: `legibility/no-redundant-boolean-logic` | [JavaScript](#coverage-javascript-leg006) / [TypeScript](#coverage-typescript-leg006) | [Examples and source](#leg006-javascript-typescript-eslint) | - `{equalityOperators: string[]}`: operators checked for comparisons against `true` or `false`. Default: `["==", "===", "!=", "!=="]`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-redundant-boolean-logic` | [JavaScript](#coverage-javascript-leg006) / [TypeScript](#coverage-typescript-leg006) | [Examples and source](#leg006-javascript-typescript-oxlint) | - `{equalityOperators: string[]}`: operators checked for comparisons against `true` or `false`. Default: `["==", "===", "!=", "!=="]`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG006 / no-redundant-boolean-logic`   | [Python](#coverage-python-leg006)                                                     | [Examples and source](#leg006-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                          |

<a id="leg006-c-clang"></a>

#### C — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#no-redundant-boolean-logic)

```diff
- return ready == true;
+ return ready;

- return ready ? false : true;
+ return !ready;
```

<a id="leg006-cplusplus-clang"></a>

#### C++ — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#no-redundant-boolean-logic)

```diff
- return ready == true;
+ return ready;

- return ready ? false : true;
+ return !ready;
```

<a id="leg006-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg006-no-redundant-boolean-logic)

```diff
- return enabled == true
+ return enabled
```

<a id="leg006-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-redundant-boolean-logic)

```diff
- return isReady === true ? true : false;
+ return isReady;
```

<a id="leg006-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-redundant-boolean-logic)

```diff
- return (count > 0) === true;
+ return count > 0;
```

<a id="leg006-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg006-example-diff)

Current selector: `LEG006`.

```diff
- return True if flag == True else False
+ return flag
```

<a id="leg007"></a>

### LEG007 — prefer-positive-condition-names

Prefer positive condition names.

| Language                | Plugin / current rule                                | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-prefer-positive-condition-names`  | [C](#coverage-c-leg007)                                                               | [Examples and source](#leg007-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                 |
| C++                     | Clang: `legibility-prefer-positive-condition-names`  | [C++](#coverage-cplusplus-leg007)                                                     | [Examples and source](#leg007-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                 |
| Go                      | Go: `LEG007 / prefer-positive-condition-names`       | [Go](#coverage-go-leg007)                                                             | [Examples and source](#leg007-go-go)                        | `negative-condition-name-pattern: string`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                |
| JavaScript / TypeScript | ESLint: `legibility/prefer-positive-condition-names` | [JavaScript](#coverage-javascript-leg007) / [TypeScript](#coverage-typescript-leg007) | [Examples and source](#leg007-javascript-typescript-eslint) | - `{booleanOperators: string[]}`: binary operators that mark an initializer as boolean-like.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/prefer-positive-condition-names` | [JavaScript](#coverage-javascript-leg007) / [TypeScript](#coverage-typescript-leg007) | [Examples and source](#leg007-javascript-typescript-oxlint) | - `{booleanOperators: string[]}`: binary operators that mark an initializer as boolean-like.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG007 / prefer-positive-condition-names`   | [Python](#coverage-python-leg007)                                                     | [Examples and source](#leg007-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                |

<a id="leg007-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-positive-condition-names.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <stdbool.h>
void step(void);
void process(int status) {
#ifdef BAD
  const bool isNotReady = status != 1;
  if (!isNotReady)
#else
  const bool isReady = status == 1;
  if (isReady)
#endif
    step();
}
```

<a id="leg007-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-positive-condition-names.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <stdbool.h>
void step(void);
void process(int status) {
#ifdef BAD
  const bool isNotReady = status != 1;
  if (!isNotReady)
#else
  const bool isReady = status == 1;
  if (isReady)
#endif
    step();
}
```

<a id="leg007-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg007-prefer-positive-condition-names)

```diff
- isNotReady := status != StatusReady
- if isNotReady {
+ isReady := status == StatusReady
+ if !isReady {
     return nil
 }
```

<a id="leg007-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#prefer-positive-condition-names)

```diff
- const isNotReady = status !== "ready";
-
- if (!isNotReady) {
-   run();
- }
+ const isReady = status === "ready";
+
+ if (isReady) {
+   run();
+ }
```

<a id="leg007-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#prefer-positive-condition-names)

```diff
- const isNotReady = status !== "ready";
-
- if (!isNotReady) {
-   run();
- }
+ const isReady = status === "ready";
+
+ if (isReady) {
+   run();
+ }
```

<a id="leg007-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg007-example-diff)

Current selector: `LEG007`.

```diff
- is_not_ready = status != "ready"
- if is_not_ready:
+ is_ready = status == "ready"
+ if not is_ready:
      return
```

<a id="leg008"></a>

### LEG008 — no-trivial-wrapper-functions

Avoid functions that only forward parameters to another call.

| Language                | Plugin / current rule                             | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-no-trivial-wrapper-functions`  | [C](#coverage-c-leg008)                                                               | [Examples and source](#leg008-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| C++                     | Clang: `legibility-no-trivial-wrapper-functions`  | [C++](#coverage-cplusplus-leg008)                                                     | [Examples and source](#leg008-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| Go                      | Go: `LEG008 / no-trivial-wrapper-functions`       | [Go](#coverage-go-leg008)                                                             | [Examples and source](#leg008-go-go)                        | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                        |
| JavaScript / TypeScript | ESLint: `legibility/no-trivial-wrapper-functions` | [JavaScript](#coverage-javascript-leg008) / [TypeScript](#coverage-typescript-leg008) | [Examples and source](#leg008-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-trivial-wrapper-functions` | [JavaScript](#coverage-javascript-leg008) / [TypeScript](#coverage-typescript-leg008) | [Examples and source](#leg008-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG008 / no-trivial-wrapper-functions`   | [Python](#coverage-python-leg008)                                                     | [Examples and source](#leg008-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                        |

<a id="leg008-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-trivial-wrapper-functions.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
int fetch(int id);
#ifdef BAD
static int getUser(int id) { return fetch(id); }
int process(int id) { return getUser(id) + 1; }
#else
int process(int id) { return fetch(id) + 1; }
#endif
```

<a id="leg008-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-trivial-wrapper-functions.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
int fetch(int id);
#ifdef BAD
static int getUser(int id) { return fetch(id); }
int process(int id) { return getUser(id) + 1; }
#else
int process(int id) { return fetch(id) + 1; }
#endif
```

<a id="leg008-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg008-no-trivial-wrapper-functions)

```diff
- func cleanName(name string) string {
- 	return strings.TrimSpace(name)
- }
-
- displayName := cleanName(input)
+ displayName := strings.TrimSpace(input)
```

<a id="leg008-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-trivial-wrapper-functions)

```diff
- const getUser = (userId) => fetchUser(userId);
+ const getActiveUser = (userId) => fetchUser(userId).then(requireActiveUser);
```

<a id="leg008-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-trivial-wrapper-functions)

```diff
- const getUser = (userId) => fetchUser(userId);
+ const getUser = fetchUser;
```

<a id="leg008-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg008-example-diff)

Current selector: `LEG008`.

```diff
- def normalize(value):
-     return clean(value)
- result = normalize(value)
+ result = clean(value)
```

<a id="leg009"></a>

### LEG009 — prefer-early-return

Avoid else branches after a branch already exits.

| Language                | Plugin / current rule                                                                                                       | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: [`readability-else-after-return`](https://clang.llvm.org/extra/clang-tidy/checks/readability/else-after-return.html) | [C](#coverage-c-leg009)                                                               | [Examples and source](#leg009-c-clang)                      | No catalog-specific settings.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                   |
| C++                     | Clang: [`readability-else-after-return`](https://clang.llvm.org/extra/clang-tidy/checks/readability/else-after-return.html) | [C++](#coverage-cplusplus-leg009)                                                     | [Examples and source](#leg009-cplusplus-clang)              | No catalog-specific settings.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                   |
| Go                      | Go: `LEG009 / prefer-early-return`                                                                                          | [Go](#coverage-go-leg009)                                                             | [Examples and source](#leg009-go-go)                        | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                        |
| JavaScript / TypeScript | ESLint: `legibility/prefer-early-return`                                                                                    | [JavaScript](#coverage-javascript-leg009) / [TypeScript](#coverage-typescript-leg009) | [Examples and source](#leg009-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/prefer-early-return`                                                                                    | [JavaScript](#coverage-javascript-leg009) / [TypeScript](#coverage-typescript-leg009) | [Examples and source](#leg009-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG009 / prefer-early-return`                                                                                      | [Python](#coverage-python-leg009)                                                     | [Examples and source](#leg009-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                        |
| Shell                   | Shell: `LEG009 / prefer-early-return`                                                                                       | [Shell](#coverage-shell-leg009)                                                       | [Examples and source](#leg009-shell-shell)                  | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                      |

<a id="leg009-c-clang"></a>

#### C — Clang

**Default:** off. **Our config:** enabled as an error.

Add `readability-else-after-return` to `Checks`. Keep `WarnOnUnfixable` and `WarnOnConditionVariables` at their native default, `true`. [Config](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/scripts/.clang-tidy).

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/readability-else-after-return.c` (unpublished)

```c
int choose(int value) {
  if (value < 0) {
    return -1;
  }
#ifdef BAD
  else {
    return value;
  }
#else
  return value;
#endif
}
```

<a id="leg009-cplusplus-clang"></a>

#### C++ — Clang

Same [setup and limits as C](#leg009-c-clang). Tested with C++17.

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/readability-else-after-return.c` (unpublished)

```c
int choose(int value) {
  if (value < 0) {
    return -1;
  }
#ifdef BAD
  else {
    return value;
  }
#else
  return value;
#endif
}
```

<a id="leg009-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg009-prefer-early-return)

```diff
 if err != nil {
     return err
- } else {
- 	saveUser(user)
 }
+ saveUser(user)
```

<a id="leg009-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#prefer-early-return)

```diff
- if (!user) {
-   return null;
- } else {
-   return user.name;
- }
+ if (!user) {
+   return null;
+ }
+
+ return user.name;
```

<a id="leg009-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#prefer-early-return)

```diff
- if (!user) {
-   return null;
- } else {
-   return user.name;
- }
+ if (!user) {
+   return null;
+ }
+
+ return user.name;
```

<a id="leg009-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg009-example-diff)

Current selector: `LEG009`.

```diff
- if not user:
-     return None
- else:
-     return user.email
+ if not user:
+     return None
+ return user.email
```

<a id="leg009-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#prefer-early-return-diff)

Avoid an `else` branch after the previous branch already exits.

```diff
  if [[ -z "$config" ]]; then
    return 1
- else
-   load_config "$config"
  fi
+ load_config "$config"
```

<a id="leg010"></a>

### LEG010 — prefer-guard-clauses

Prefer guard clauses over wrapping the main path in one large if block.

| Language                | Plugin / current rule                     | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-prefer-guard-clauses`  | [C](#coverage-c-leg010)                                                               | [Examples and source](#leg010-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| C++                     | Clang: `legibility-prefer-guard-clauses`  | [C++](#coverage-cplusplus-leg010)                                                     | [Examples and source](#leg010-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| Go                      | Go: `LEG010 / prefer-guard-clauses`       | [Go](#coverage-go-leg010)                                                             | [Examples and source](#leg010-go-go)                        | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                        |
| JavaScript / TypeScript | ESLint: `legibility/prefer-guard-clauses` | [JavaScript](#coverage-javascript-leg010) / [TypeScript](#coverage-typescript-leg010) | [Examples and source](#leg010-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/prefer-guard-clauses` | [JavaScript](#coverage-javascript-leg010) / [TypeScript](#coverage-typescript-leg010) | [Examples and source](#leg010-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG010 / prefer-guard-clauses`   | [Python](#coverage-python-leg010)                                                     | [Examples and source](#leg010-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                        |
| Shell                   | Shell: `LEG010 / prefer-guard-clauses`    | [Shell](#coverage-shell-leg010)                                                       | [Examples and source](#leg010-shell-shell)                  | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                      |

<a id="leg010-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-guard-clauses.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
void validate(void);
void save(void);
void process(int active) {
#ifdef BAD
  if (active) {
    validate();
    save();
  }
#else
  if (!active)
    return;
  validate();
  save();
#endif
}
```

<a id="leg010-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-guard-clauses.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
void validate(void);
void save(void);
void process(int active) {
#ifdef BAD
  if (active) {
    validate();
    save();
  }
#else
  if (!active)
    return;
  validate();
  save();
#endif
}
```

<a id="leg010-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg010-prefer-guard-clauses)

```diff
- if user.Active {
- 	validateUser(user)
- 	saveUser(user)
- }
+ if !user.Active {
+ 	return
+ }
+ validateUser(user)
+ saveUser(user)
```

<a id="leg010-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#prefer-guard-clauses)

```diff
- function sendInvite(user) {
-   if (user) {
-     const email = buildEmail(user);
-     deliver(email);
-   }
- }
+ function sendInvite(user) {
+   if (!user) return;
+
+   const email = buildEmail(user);
+   deliver(email);
+ }
```

<a id="leg010-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#prefer-guard-clauses)

```diff
- function sendInvite(user) {
-   if (user) {
-     const email = buildEmail(user);
-     deliver(email);
-   }
- }
+ function sendInvite(user) {
+   if (!user) return;
+
+   const email = buildEmail(user);
+   deliver(email);
+ }
```

<a id="leg010-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg010-example-diff)

Current selector: `LEG010`.

```diff
- if user:
-     prepare(user)
-     send_invite(user)
+ if not user:
+     return
+ prepare(user)
+ send_invite(user)
```

<a id="leg010-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#prefer-guard-clauses-diff)

Prefer guard clauses over wrapping a whole function body in one branch. Existing guard clauses and optional branches alongside other work are fine.

```diff
  deploy() {
-   if [[ -n "$target" ]]; then
-     build
-     upload "$target"
-   fi
+   [[ -n "$target" ]] || return 1
+   build
+   upload "$target"
  }
```

<a id="leg011"></a>

### LEG011 — max-array-chain-depth

Limit consecutive collection-style method chains.

| Language                | Plugin / current rule                      | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++                     | Clang: `legibility-max-array-chain-depth`  | [C++](#coverage-cplusplus-leg011)                                                     | [Examples and source](#leg011-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                      |
| Go                      | Go: `LEG011 / max-array-chain-depth`       | [Go](#coverage-go-leg011)                                                             | [Examples and source](#leg011-go-go)                        | `max-array-chain-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                     |
| JavaScript / TypeScript | ESLint: `legibility/max-array-chain-depth` | [JavaScript](#coverage-javascript-leg011) / [TypeScript](#coverage-typescript-leg011) | [Examples and source](#leg011-javascript-typescript-eslint) | - `{max: number}`: allowed chained items. Default: `2`. - `{iterationMethods: string[]}`: method names that count as chain items.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/max-array-chain-depth` | [JavaScript](#coverage-javascript-leg011) / [TypeScript](#coverage-typescript-leg011) | [Examples and source](#leg011-javascript-typescript-oxlint) | - `{max: number}`: allowed chained items. Default: `2`. - `{iterationMethods: string[]}`: method names that count as chain items.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG011 / max-array-chain-depth`   | [Python](#coverage-python-leg011)                                                     | [Examples and source](#leg011-python-python)                | `max-array-chain-depth: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                 |

<a id="leg011-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/max-array-chain-depth.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
struct Sequence {
  Sequence filter() const;
  Sequence map() const;
  bool some() const;
};
bool process(const Sequence &items) {
#ifdef BAD
  return items.filter().map().some();
#else
  const auto filtered = items.filter();
  const auto mapped = filtered.map();
  return mapped.some();
#endif
}
```

<a id="leg011-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg011-max-array-chain-depth)

```diff
- hasLargeActiveOrder := orders.Filter(activeOrder).Map(orderTotal).Some(overLimit)
+ activeOrders := orders.Filter(activeOrder)
+ orderTotals := activeOrders.Map(orderTotal)
+ hasLargeActiveOrder := orderTotals.Some(overLimit)
```

<a id="leg011-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#max-array-chain-depth)

```diff
- const hasLargeActiveItem = items
-   .filter((item) => item.active)
-   .map((item) => item.size)
-   .some((size) => size > 100);
+ const activeItems = items.filter((item) => item.active);
+ const itemSizes = activeItems.map((item) => item.size);
+ const hasLargeActiveItem = itemSizes.some((size) => size > 100);
```

<a id="leg011-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#max-array-chain-depth)

```diff
- const hasLargeActiveItem = items
-   .filter((item) => item.active)
-   .map((item) => item.size)
-   .some((size) => size > 100);
+ const activeItems = items.filter((item) => item.active);
+ const itemSizes = activeItems.map((item) => item.size);
+ const hasLargeActiveItem = itemSizes.some((size) => size > 100);
```

<a id="leg011-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg011-example-diff)

Current selector: `LEG011`.

```diff
- users = query.filter(active=True).order_by("name").limit(10)
+ active_users = query.filter(active=True)
+ sorted_users = active_users.order_by("name")
+ users = sorted_users.limit(10)
```

<a id="leg012"></a>

### LEG012 — no-computed-values

Prefer named values before returning computed expressions.

| Language                | Plugin / current rule                   | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-no-computed-values`  | [C](#coverage-c-leg012)                                                               | [Examples and source](#leg012-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| C++                     | Clang: `legibility-no-computed-values`  | [C++](#coverage-cplusplus-leg012)                                                     | [Examples and source](#leg012-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Go                      | Go: `LEG012 / no-computed-values`       | [Go](#coverage-go-leg012)                                                             | [Examples and source](#leg012-go-go)                        | `max-computed-value-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| JavaScript / TypeScript | ESLint: `legibility/no-computed-values` | [JavaScript](#coverage-javascript-leg012) / [TypeScript](#coverage-typescript-leg012) | [Examples and source](#leg012-javascript-typescript-eslint) | - `{max: number}`: allowed weighted operators in a computed value. Default: `1`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights. - `{objectValues: "computed" \| "named"}`: object value mode. Default: `"computed"`. - `{returnValues: "computed" \| "named"}`: return value mode. Default: `"computed"`. Use `"named"` mode to require a named identifier or literal before object construction and returns.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                           |
| JavaScript / TypeScript | Oxlint: `legibility/no-computed-values` | [JavaScript](#coverage-javascript-leg012) / [TypeScript](#coverage-typescript-leg012) | [Examples and source](#leg012-javascript-typescript-oxlint) | - `{max: number}`: allowed weighted operators in a computed value. Default: `1`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights. - `{objectValues: "computed" \| "named"}`: object value mode. Default: `"computed"`. - `{returnValues: "computed" \| "named"}`: return value mode. Default: `"computed"`. Use `"named"` mode to require a named identifier, literal, or `this` before object construction and returns. Destructuring bindings and their defaults are excluded; computed values inside an object created by a default are still checked.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG012 / no-computed-values`   | [Python](#coverage-python-leg012)                                                     | [Examples and source](#leg012-python-python)                | `max-computed-value-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

<a id="leg012-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-computed-values.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
int total(int subtotal, int tax, int shipping) {
#ifdef BAD
  return subtotal + tax + shipping;
#else
  const int taxed = subtotal + tax;
  return taxed + shipping;
#endif
}
```

<a id="leg012-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-computed-values.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
int total(int subtotal, int tax, int shipping) {
#ifdef BAD
  return subtotal + tax + shipping;
#else
  const int taxed = subtotal + tax;
  return taxed + shipping;
#endif
}
```

<a id="leg012-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg012-no-computed-values)

```diff
- return subtotal + tax + shipping
+ taxedSubtotal := subtotal + tax
+ return taxedSubtotal + shipping
```

<a id="leg012-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-computed-values)

```diff
- return subtotal + tax - discount;
+ const total = subtotal + tax - discount;
+
+ return total;

- return { route: getRouteName(url.pathname) };
+ const route = getRouteName(url.pathname);
+
+ return route;
```

<a id="leg012-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-computed-values)

```diff
- return subtotal + tax - discount;
+ const total = subtotal + tax - discount;
+
+ return total;
```

```diff
- return { route: getRouteName(url.pathname) };
+ const route = getRouteName(url.pathname);
+
+ return { route };
```

<a id="leg012-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg012-example-diff)

Current selector: `LEG012`.

```diff
- return total + tax - discount
+ subtotal = total + tax
+ return subtotal - discount
```

<a id="leg024"></a>

### LEG024 — prefer-object-lookup

Prefer set or map lookups over long equality-or chains.

| Language                | Plugin / current rule                     | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-prefer-object-lookup`  | [C](#coverage-c-leg024)                                                               | [Examples and source](#leg024-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                    |
| C++                     | Clang: `legibility-prefer-object-lookup`  | [C++](#coverage-cplusplus-leg024)                                                     | [Examples and source](#leg024-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                    |
| Go                      | Go: `LEG024 / prefer-object-lookup`       | [Go](#coverage-go-leg024)                                                             | [Examples and source](#leg024-go-go)                        | `min-object-lookup-chain-length: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                          |
| JavaScript / TypeScript | ESLint: `legibility/prefer-object-lookup` | [JavaScript](#coverage-javascript-leg024) / [TypeScript](#coverage-typescript-leg024) | [Examples and source](#leg024-javascript-typescript-eslint) | - `{min: number}`: equality checks required before reporting. Default: `3`. - `{operators: string[]}`: equality operators that count. Default: `["==", "==="]`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/prefer-object-lookup` | [JavaScript](#coverage-javascript-leg024) / [TypeScript](#coverage-typescript-leg024) | [Examples and source](#leg024-javascript-typescript-oxlint) | - `{min: number}`: equality checks required before reporting. Default: `3`. - `{operators: string[]}`: equality operators that count. Default: `["==", "==="]`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG024 / prefer-object-lookup`   | [Python](#coverage-python-leg024)                                                     | [Examples and source](#leg024-python-python)                | `min-object-lookup-chain-length: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                      |
| Shell                   | Shell: `LEG024 / prefer-object-lookup`    | [Shell](#coverage-shell-leg024)                                                       | [Examples and source](#leg024-shell-shell)                  | `min-object-lookup-chain-length: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                                                 |

<a id="leg024-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-object-lookup.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <stdbool.h>
bool containsRole(int role);
bool allowed(int role) {
#ifdef BAD
  return role == 1 || role == 2 || role == 3;
#else
  return containsRole(role);
#endif
}
```

<a id="leg024-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-object-lookup.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <stdbool.h>
bool containsRole(int role);
bool allowed(int role) {
#ifdef BAD
  return role == 1 || role == 2 || role == 3;
#else
  return containsRole(role);
#endif
}
```

<a id="leg024-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg024-prefer-object-lookup)

```diff
- return role == "admin" || role == "owner" || role == "staff"
+ allowedRoles := map[string]bool{
+ 	"admin": true,
+ 	"owner": true,
+ 	"staff": true,
+ }
+ return allowedRoles[role]
```

<a id="leg024-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#prefer-object-lookup)

```diff
- const isSupported = type === "page" || type === "post" || type === "asset";
+ const supportedTypes = new Set(["page", "post", "asset"]);
+ const isSupported = supportedTypes.has(type);
```

<a id="leg024-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#prefer-object-lookup)

```diff
- const isSupported = type === "page" || type === "post" || type === "asset";
+ const supportedTypes = new Set(["page", "post", "asset"]);
+ const isSupported = supportedTypes.has(type);
```

<a id="leg024-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg024-example-diff)

Current selector: `LEG024`.

```diff
- if status == "new" or status == "open" or status == "pending":
-     queue_item(item)
+ if status in {"new", "open", "pending"}:
+     queue_item(item)
```

<a id="leg024-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#prefer-object-lookup-diff)

Prefer `case` or lookup-style flow over long repeated equality checks.

```diff
- if [[ "$mode" == "dev" || "$mode" == "test" || "$mode" == "ci" ]]; then
-   enable_debug
- fi
+ case "$mode" in
+   dev|test|ci) enable_debug ;;
+ esac
```

<a id="leg025"></a>

### LEG025 — require-filename-matches-dirname

Opt-in. Require files in named subdirectories to match the directory name.

| Language                | Plugin / current rule                                 | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Go                      | Go: `LEG025 / require-filename-matches-dirname`       | [Go](#coverage-go-leg025)                                                             | [Examples and source](#leg025-go-go)                        | `min-dirname-match-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| JavaScript / TypeScript | ESLint: `legibility/require-filename-matches-dirname` | [JavaScript](#coverage-javascript-leg025) / [TypeScript](#coverage-typescript-leg025) | [Examples and source](#leg025-javascript-typescript-eslint) | - `{schema: "dirname" \| "index" \| "custom"}`: required filename schema. - `{minDepth: number}`: minimum parent depth to check. Default: `3`. - `{allowedQualifiers: string[]}`: `dirname` schema suffixes. - `{allowedFilenames: string[]}`: `dirname` schema standalone basenames. - `{patterns: string[]}`: required exact basenames for a `custom` schema. Use `{dirname}` as the parent-directory placeholder. The rule ignores the final JavaScript or TypeScript extension, so the same schema covers `.js`, `.jsx`, `.ts`, and `.tsx` files.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/require-filename-matches-dirname` | [JavaScript](#coverage-javascript-leg025) / [TypeScript](#coverage-typescript-leg025) | [Examples and source](#leg025-javascript-typescript-oxlint) | - `{schema: "dirname" \| "index" \| "custom"}`: required filename schema. - `{minDepth: number}`: minimum parent depth to check. Default: `3`. - `{allowedQualifiers: string[]}`: `dirname` schema suffixes. - `{allowedFilenames: string[]}`: `dirname` schema standalone basenames. - `{patterns: string[]}`: required exact basenames for a `custom` schema. Use `{dirname}` as the parent-directory placeholder. The rule ignores the final JavaScript or TypeScript extension, so the same schema covers `.js`, `.jsx`, `.ts`, and `.tsx` files.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG025 / require-filename-matches-dirname`   | [Python](#coverage-python-leg025)                                                     | [Examples and source](#leg025-python-python)                | `min-dirname-match-depth: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Shell                   | Shell: `LEG025 / require-filename-matches-dirname`    | [Shell](#coverage-shell-leg025)                                                       | [Examples and source](#leg025-shell-shell)                  | `min-dirname-match-depth: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

<a id="leg025-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg025-require-filename-matches-dirname)

Opt-in. Enable it with `enabled-rules` when the project uses directory-mirrored filenames.

```diff
- internal/orders/service.go
+ internal/orders/orders_service.go
```

<a id="leg025-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#require-filename-matches-dirname)

```diff
- src/components/button/button.ts
- src/components/button/button.test.ts
+ src/components/button/index.ts
+ src/components/button/index.test.tsx
+ src/components/button/utils.ts
```

```diff
- src/components/button/useButton.ts
- src/components/button/button.effect.ts
+ src/components/button/button.ts
+ src/components/button/button.test.ts
+ src/components/button/index.ts
```

<a id="leg025-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#require-filename-matches-dirname)

```diff
- src/components/button/button.ts
- src/components/button/button.test.ts
+ src/components/button/index.ts
+ src/components/button/index.test.tsx
+ src/components/button/utils.ts
```

```diff
- src/components/button/useButton.ts
- src/components/button/button.effect.ts
+ src/components/button/button.ts
+ src/components/button/button.test.ts
+ src/components/button/index.ts
```

<a id="leg025-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg025-example-diff)

Current selector: `LEG025`. Additional entry/path fields exist on Settings; file-config exposure is narrower.

```diff
- src/billing/customer/profile.py
+ src/billing/customer/customer.py
```

<a id="leg025-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#require-filename-matches-dirname-diff)

Require files in named subdirectories to match the directory name.

```diff
- scripts/deploy/run.sh
+ scripts/deploy/deploy.sh
```

<a id="leg026"></a>

### LEG026 — no-mixed-filename-casing

Avoid filenames that mix casing conventions.

| Language                | Plugin / current rule                         | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++                     | Clang: `legibility-no-mixed-filename-casing`  | [C++](#coverage-cplusplus-leg026)                                                     | [Examples and source](#leg026-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| Go                      | Go: `LEG026 / no-mixed-filename-casing`       | [Go](#coverage-go-leg026)                                                             | [Examples and source](#leg026-go-go)                        | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                        |
| JavaScript / TypeScript | ESLint: `legibility/no-mixed-filename-casing` | [JavaScript](#coverage-javascript-leg026) / [TypeScript](#coverage-typescript-leg026) | [Examples and source](#leg026-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-mixed-filename-casing` | [JavaScript](#coverage-javascript-leg026) / [TypeScript](#coverage-typescript-leg026) | [Examples and source](#leg026-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG026 / no-mixed-filename-casing`   | [Python](#coverage-python-leg026)                                                     | [Examples and source](#leg026-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                        |
| Shell                   | Shell: `LEG026 / no-mixed-filename-casing`    | [Shell](#coverage-shell-leg026)                                                       | [Examples and source](#leg026-shell-shell)                  | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                      |

<a id="leg026-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-mixed-filename-casing.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
int identity(int value) { return value; }
```

<a id="leg026-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg026-no-mixed-filename-casing)

```diff
- internal/API_client.go
+ internal/api_client.go
```

<a id="leg026-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-mixed-filename-casing)

```diff
- my-File.ts
+ my-file.ts

- user_profile-card.test.ts
+ user_profile_card.test.ts

- accountSettings-helper.ts
+ account-settings-helper.ts
```

<a id="leg026-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-mixed-filename-casing)

```diff
- my-File.ts
+ my-file.ts

- user_profile-card.test.ts
+ user_profile_card.test.ts

- accountSettings-helper.ts
+ account-settings-helper.ts
```

<a id="leg026-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg026-example-diff)

Current selector: `LEG026`.

```diff
- user_Profile.py
+ user_profile.py
```

<a id="leg026-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#no-mixed-filename-casing-diff)

Avoid filenames that mix casing conventions.

```diff
- scripts/deployUser.sh
+ scripts/deploy-user.sh
```

<a id="leg031"></a>

### LEG031 — no-deep-selector-chain

Avoid deep selector or index chains without named intermediate values.

| Language | Plugin / current rule                      | Coverage                          | Examples                                       | Types                                                                                                                                                                                                      |
| -------- | ------------------------------------------ | --------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C        | Clang: `legibility-no-deep-selector-chain` | [C](#coverage-c-leg031)           | [Examples and source](#leg031-c-clang)         | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md) |
| C++      | Clang: `legibility-no-deep-selector-chain` | [C++](#coverage-cplusplus-leg031) | [Examples and source](#leg031-cplusplus-clang) | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md) |
| Go       | Go: `LEG031 / no-deep-selector-chain`      | [Go](#coverage-go-leg031)         | [Examples and source](#leg031-go-go)           | `max-selector-chain-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                             |
| Python   | Python: `LEG031 / no-deep-subscript-chain` | [Python](#coverage-python-leg031) | [Examples and source](#leg031-python-python)   | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                |

<a id="leg031-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-deep-selector-chain.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <stdbool.h>
struct Email { bool enabled; };
struct Settings { struct Email email; };
struct Profile { struct Settings settings; };
struct User { struct Profile profile; };
struct Config { struct User user; };
bool process(struct Config config) {
#ifdef BAD
  return config.user.profile.settings.email.enabled;
#else
  const struct Profile profile = config.user.profile;
  const struct Email email = profile.settings.email;
  return email.enabled;
#endif
}
```

<a id="leg031-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-deep-selector-chain.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <stdbool.h>
struct Email { bool enabled; };
struct Settings { struct Email email; };
struct Profile { struct Settings settings; };
struct User { struct Profile profile; };
struct Config { struct User user; };
bool process(struct Config config) {
#ifdef BAD
  return config.user.profile.settings.email.enabled;
#else
  const struct Profile profile = config.user.profile;
  const struct Email email = profile.settings.email;
  return email.enabled;
#endif
}
```

<a id="leg031-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg031-no-deep-selector-chain)

```diff
- return config.User.Profile.Settings.Email.Enabled
+ userProfile := config.User.Profile
+ emailSettings := userProfile.Settings.Email
+ return emailSettings.Enabled
```

<a id="leg031-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg031-example-diff)

Current selector: `LEG031`.

```diff
- return payload["user"]["profile"]["email"]
+ user = payload["user"]
+ profile = user["profile"]
+ return profile["email"]
```

<a id="leg034"></a>

### LEG034 — prefer-switch-over-long-if-chain

Prefer switch over long if chains that compare the same value.

| Language | Plugin / current rule                                | Coverage                          | Examples                                       | Types                                                                                                                                                                                                      |
| -------- | ---------------------------------------------------- | --------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C        | Clang: `legibility-prefer-switch-over-long-if-chain` | [C](#coverage-c-leg034)           | [Examples and source](#leg034-c-clang)         | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md) |
| C++      | Clang: `legibility-prefer-switch-over-long-if-chain` | [C++](#coverage-cplusplus-leg034) | [Examples and source](#leg034-cplusplus-clang) | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md) |
| Go       | Go: `LEG034 / prefer-switch-over-long-if-chain`      | [Go](#coverage-go-leg034)         | [Examples and source](#leg034-go-go)           | `min-switch-chain-length: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                              |
| Shell    | Shell: `LEG034 / prefer-case-over-long-if-chain`     | [Shell](#coverage-shell-leg034)   | [Examples and source](#leg034-shell-shell)     | `min-case-chain-length: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                       |

<a id="leg034-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-switch-over-long-if-chain.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
void step(int result);
void process(int status) {
#ifdef BAD
  if (status == 1) { step(1); }
  else if (status == 2) { step(2); }
  else if (status == 3) { step(3); }
#else
  switch (status) {
  case 1: step(1); break;
  case 2: step(2); break;
  case 3: step(3); break;
  default: break;
  }
#endif
}
```

<a id="leg034-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-switch-over-long-if-chain.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
void step(int result);
void process(int status) {
#ifdef BAD
  if (status == 1) { step(1); }
  else if (status == 2) { step(2); }
  else if (status == 3) { step(3); }
#else
  switch (status) {
  case 1: step(1); break;
  case 2: step(2); break;
  case 3: step(3); break;
  default: break;
  }
#endif
}
```

<a id="leg034-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg034-prefer-switch-over-long-if-chain)

```diff
- if status == "new" {
- 	return 1
- } else if status == "active" {
- 	return 2
- } else if status == "closed" {
- 	return 3
- }
+ switch status {
+ case "new":
+ 	return 1
+ case "active":
+ 	return 2
+ case "closed":
+ 	return 3
+ }
```

<a id="leg034-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#prefer-case-over-long-if-chain-diff)

Prefer `case` over long `elif` chains comparing the same value.

```diff
- if [[ "$command" == "build" ]]; then
-   build
- elif [[ "$command" == "test" ]]; then
-   test_all
- elif [[ "$command" == "publish" ]]; then
-   publish
- fi
+ case "$command" in
+   build) build ;;
+   test) test_all ;;
+   publish) publish ;;
+ esac
```

<a id="leg035"></a>

### LEG035 — no-bool-literal-args

Avoid boolean literals as call arguments.

| Language | Plugin / current rule                                                                 | Coverage                          | Examples                                                  | Types                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| C        | Clang: `legibility-no-bool-literal-args`                                              | [C](#coverage-c-leg035)           | [Examples and source](#leg035-c-clang)                    | None.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                    |
| C++      | Clang: `legibility-no-bool-literal-args`                                              | [C++](#coverage-cplusplus-leg035) | [Examples and source](#leg035-cplusplus-clang)            | None.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                    |
| Go       | Go: `LEG035 / no-bool-literal-args`                                                   | [Go](#coverage-go-leg035)         | [Examples and source](#leg035-go-go)                      | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |
| Shell    | Shell: `LEG035 / no-bool-literal-args`                                                | [Shell](#coverage-shell-leg035)   | [Examples and source](#leg035-shell-shell)                | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)               |
| Python   | Ruff: [`FBT003`](https://docs.astral.sh/ruff/rules/boolean-positional-value-in-call/) | [Python](#coverage-python-leg035) | [Configuration, examples, and tests](#leg035-python-ruff) | `lint.flake8-boolean-trap.extend-allowed-calls: string[]`                                                                                   |

<a id="leg035-c-clang"></a>

#### C — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#no-bool-literal-args)

```diff
- save(true);
+ const bool overwriteExisting = true;
+ save(overwriteExisting);
```

<a id="leg035-cplusplus-clang"></a>

#### C++ — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#no-bool-literal-args)

```diff
- save(true);
+ const bool overwriteExisting = true;
+ save(overwriteExisting);
```

<a id="leg035-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg035-no-bool-literal-args)

```diff
- createUser(user, true, false)
+ shouldSendInvite := true
+ shouldRequirePasswordReset := false
+ createUser(user, shouldSendInvite, shouldRequirePasswordReset)
```

<a id="leg035-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#no-bool-literal-args-diff)

Avoid unquoted boolean literal arguments whose meaning is only clear at the call site. Commands like `true`, `false`, and `command true` are fine, including after `&&` or `||`.

```diff
- create_user "$name" true false
+ send_email="true"
+ is_admin="false"
+ create_user "$name" "$send_email" "$is_admin"
```

<a id="leg035-python-ruff"></a>

#### Python — Ruff

[FBT003](https://docs.astral.sh/ruff/rules/boolean-positional-value-in-call/) is **off by default and in [our config](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/pyproject.toml)**. Run Ruff alongside `ruff-legibility`.

Merge into `pyproject.toml`, preserving existing selections:

```toml
[tool.ruff.lint]
extend-select = ["FBT003"]
```

Flags positional booleans; allows named arguments and calls Ruff explicitly permits. Use `extend-allowed-calls` for more exceptions.

```diff
- publish(True)
+ publish(enabled=True)
```

[Test results](#native-coverage-verification). This setup is not yet part of our recommended configuration.

<a id="leg036"></a>

### LEG036 — no-complex-if-init

Avoid combining an if initializer with an operator-heavy condition.

| Language | Plugin / current rule                  | Coverage                          | Examples                                       | Types                                                                                                                                                       |
| -------- | -------------------------------------- | --------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++      | Clang: `legibility-hoist-if-operators` | [C++](#coverage-cplusplus-leg036) | [Examples and source](#leg036-cplusplus-clang) | `MaxOperators: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)         |
| Go       | Go: `LEG036 / no-complex-if-init`      | [Go](#coverage-go-leg036)         | [Examples and source](#leg036-go-go)           | `max-if-init-operators: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg036-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/hoist-if-operators-if-initializer.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document. This maps an initializer-specific Go rule to Clang's existing condition check.

```c
struct User { bool active; };
User *findUser(int id);
void save(User *user);
void process(int id) {
#ifdef BAD
  if (auto *user = findUser(id); user != nullptr && user->active)
#else
  auto *user = findUser(id);
  const bool canSave = user != nullptr && user->active;
  if (canSave)
#endif
    save(user);
}
```

<a id="leg036-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg036-no-complex-if-init)

```diff
- if user, ok := users[id]; ok && user.Active {
- 	save(user)
- }
+ user, ok := users[id]
+ canSaveUser := ok && user.Active
+ if canSaveUser {
+ 	save(user)
+ }
```

<a id="leg037"></a>

### LEG037 — no-deep-composite-literal-arg

Avoid deeply nested composite literals as call arguments.

| Language | Plugin / current rule                             | Coverage                          | Examples                                       | Types                                                                                                                                                                                                      |
| -------- | ------------------------------------------------- | --------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++      | Clang: `legibility-no-deep-composite-literal-arg` | [C++](#coverage-cplusplus-leg037) | [Examples and source](#leg037-cplusplus-clang) | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md) |
| Go       | Go: `LEG037 / no-deep-composite-literal-arg`      | [Go](#coverage-go-leg037)         | [Examples and source](#leg037-go-go)           | `max-composite-literal-arg-depth: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                      |

<a id="leg037-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-deep-composite-literal-arg.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
struct HttpConfig { int timeout; };
struct Config { HttpConfig http; };
void save(Config config);
void process() {
#ifdef BAD
  save(Config{HttpConfig{10}});
#else
  const HttpConfig http{10};
  save(Config{http});
#endif
}
```

<a id="leg037-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg037-no-deep-composite-literal-arg)

```diff
- save(Config{HTTP: HTTPConfig{Timeout: 10}})
+ httpConfig := HTTPConfig{Timeout: 10}
+ save(Config{HTTP: httpConfig})
```

<a id="leg038"></a>

### LEG038 — max-function-lines

Limit functions to a focused line budget.

| Language                | Plugin / current rule                                                                                               | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html) | [C](#coverage-c-leg038)                                                               | [Examples and source](#leg038-c-clang)                      | `LineThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                              |
| C++                     | Clang: [`readability-function-size`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-size.html) | [C++](#coverage-cplusplus-leg038)                                                     | [Examples and source](#leg038-cplusplus-clang)              | `LineThreshold: unsigned integer`; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                              |
| Go                      | Go: `LEG038 / max-function-lines`                                                                                   | [Go](#coverage-go-leg038)                                                             | [Examples and source](#leg038-go-go)                        | `max-function-lines: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                          |
| JavaScript / TypeScript | ESLint: [`max-lines-per-function`](https://eslint.org/docs/latest/rules/max-lines-per-function)                     | [JavaScript](#coverage-javascript-leg038) / [TypeScript](#coverage-typescript-leg038) | [Examples and source](#leg038-javascript-typescript-eslint) | `max: number`; `skipBlankLines: boolean`; `skipComments: boolean`; `IIFEs: boolean`; [Preset](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/index.ts) |
| JavaScript / TypeScript | Oxlint: [`max-lines-per-function`](https://oxc.rs/docs/guide/usage/linter/rules/eslint/max-lines-per-function)      | [JavaScript](#coverage-javascript-leg038) / [TypeScript](#coverage-typescript-leg038) | [Examples and source](#leg038-javascript-typescript-oxlint) | `max: number`; `skipBlankLines: boolean`; `skipComments: boolean`; `IIFEs: boolean`; [Preset](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/index.ts) |
| Shell                   | Shell: `LEG038 / max-function-lines`                                                                                | [Shell](#coverage-shell-leg038)                                                       | [Examples and source](#leg038-shell-shell)                  | `max-function-lines: integer`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                 |

<a id="leg038-c-clang"></a>

#### C — Clang

**Default:** off, with no line limit. **Our config:** errors above 20.

Add `readability-function-size` to `Checks` and set:

```yaml
CheckOptions:
  readability-function-size.LineThreshold: "20"
```

Clang accepts the 21-line example below. Setting 19 passes the tested 20/21-line boundary; other formatting remains unverified. [Config](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/scripts/.clang-tidy).

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/readability-function-size-inclusive-lines.c` (unpublished)

```c
void step(void);
#ifdef BAD
void process(void) {
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
}
#else
void process(void) {
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
}
#endif
```

<a id="leg038-cplusplus-clang"></a>

#### C++ — Clang

Same [setup and limits as C](#leg038-c-clang). Tested with C++17.

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/readability-function-size-inclusive-lines.c` (unpublished)

```c
void step(void);
#ifdef BAD
void process(void) {
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
}
#else
void process(void) {
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
  step();
}
#endif
```

<a id="leg038-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg038-max-function-lines)

With `max-function-lines: 6`:

```diff
- func syncUser(user User) error {
- 	validateUser(user)
- 	normalizeUser(&user)
- 	saveUser(user)
- 	sendWelcomeEmail(user)
- 	writeAuditLog(user)
- 	refreshSearchIndex(user)
- 	return nil
- }
+ func syncUser(user User) error {
+ 	if err := prepareUser(&user); err != nil {
+ 		return err
+ 	}
+ 	return persistUser(user)
+ }
```

<a id="leg038-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[Preset documentation](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#configs)

**Default:** off. When enabled, the [native rule](https://eslint.org/docs/latest/rules/max-lines-per-function) allows 50 lines, including blanks/comments, and skips immediately invoked functions.

**Our preset:** 40 code lines; warnings in recommended, errors in strict. Add to `rules`:

```json
"max-lines-per-function": ["warn", {
  "max": 40,
  "skipBlankLines": true,
  "skipComments": true,
  "IIFEs": true
}]
```

[Source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/index.ts) · [Test results](#native-coverage-verification)

Illustrative example with `max: 3`, adapted from the [native rule's line-counting contract](https://eslint.org/docs/latest/rules/max-lines-per-function#options). This isolates function length; it is not a promise that every other configured rule passes.

```diff
- function renderTitle(value) {
-   const title = value.trim();
-   return title;
- }
+ function renderTitle(value) {
+   return value.trim();
+ }
```

<a id="leg038-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Preset documentation](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#configs)

**Default:** off. When enabled, the [native rule](https://oxc.rs/docs/guide/usage/linter/rules/eslint/max-lines-per-function) allows 50 lines, including blanks/comments, and skips immediately invoked functions.

**Our preset:** 40 code lines; warnings in recommended, errors in strict. Add to `rules`:

```json
"max-lines-per-function": ["warn", {
  "max": 40,
  "skipBlankLines": true,
  "skipComments": true,
  "IIFEs": true
}]
```

[Source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/index.ts) · [Test results](#native-coverage-verification)

Illustrative example with `max: 3`, adapted from the [native rule's line-counting contract](https://eslint.org/docs/latest/rules/max-lines-per-function#options). This isolates function length; it is not a promise that every other configured rule passes.

```diff
- function renderTitle(value) {
-   const title = value.trim();
-   return title;
- }
+ function renderTitle(value) {
+   return value.trim();
+ }
```

<a id="leg038-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#max-function-lines-diff)

Keep shell functions within a focused line budget.

```diff
  deploy() {
-   validate_env
-   install_dependencies
-   build_assets
-   upload_assets
-   restart_service
-   notify_release
+   prepare_release
+   publish_release
+   notify_release
  }
```

<a id="leg039"></a>

### LEG039 — no-unmatched-comments

Policy opt-in. Reject comments without an allowed matcher or boundary identifier.

| Language                | Plugin / current rule                                          | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-no-unmatched-comments`                      | [C](#coverage-c-leg039)                                                               | [Examples and source](#leg039-c-clang)                      | `Matchers: string`; `PrefixIdentifiers: string`; `SuffixIdentifiers: string` (semicolon-separated lists); Check interface: `clang-tidy-legibility/src/NoUnmatchedCommentsCheck.h` (unpublished)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| C++                     | Clang: `legibility-no-unmatched-comments`                      | [C++](#coverage-cplusplus-leg039)                                                     | [Examples and source](#leg039-cplusplus-clang)              | `Matchers: string`; `PrefixIdentifiers: string`; `SuffixIdentifiers: string` (semicolon-separated lists); Check interface: `clang-tidy-legibility/src/NoUnmatchedCommentsCheck.h` (unpublished)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Go                      | Go: `LEG039 / no-unmatched-comments`                           | [Go](#coverage-go-leg039)                                                             | [Examples and source](#leg039-go-go)                        | `comment-matchers: string[]`; `comment-prefix-identifiers: string[]`; `comment-suffix-identifiers: string[]`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| JavaScript / TypeScript | ESLint: `legibility/no-unmatched-comments`                     | [JavaScript](#coverage-javascript-leg039) / [TypeScript](#coverage-typescript-leg039) | [Examples and source](#leg039-javascript-typescript-eslint) | - `matchers`: case-insensitive regular expressions matched against the comment body. - `prefixIdentifiers`: case-insensitive identifiers allowed at the start of a comment. - `suffixIdentifiers`: case-insensitive identifiers allowed at the end of a comment. All options accept string arrays and default to empty arrays. The three options are independent allow paths. Matching ignores comment delimiters, surrounding whitespace, and leading JSDoc stars. Invalid regular expressions and empty identifiers never match. The rule has no autofix.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts)                                                                                                                                                                           |
| JavaScript / TypeScript | Oxlint: `legibility/no-unmatched-comments`                     | [JavaScript](#coverage-javascript-leg039) / [TypeScript](#coverage-typescript-leg039) | [Examples and source](#leg039-javascript-typescript-oxlint) | - `matchers`: case-insensitive regular expressions matched against the comment body. - `prefixIdentifiers`: case-insensitive identifiers allowed at the start of a comment. - `suffixIdentifiers`: case-insensitive identifiers allowed at the end of a comment. All options accept string arrays and default to empty arrays. The three options are independent allow paths. Matching ignores comment delimiters, surrounding whitespace, and leading JSDoc stars. Invalid or potentially unsafe regular expressions and empty identifiers never match. Matcher lists accept at most 16 expressions, each at most 256 characters long; regex matching is limited to the first 1024 characters of a comment. The rule has no autofix.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG034 / no-unmatched-comments`                       | [Python](#coverage-python-leg039)                                                     | [Examples and source](#leg039-python-python)                | `comment-matchers: string[]`; `comment-prefix-identifiers: string[]`; `comment-suffix-identifiers: string[]`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| SQL / Jinja             | SQLFluff: `Legibility_L001 / legibility.no_unmatched_comments` | [SQL](#coverage-sql-leg039) / [Jinja](#coverage-jinja-leg039)                         | [Examples and source](#leg039-sql-jinja-sqlfluff)           | comment_matchers, comment_prefix_identifiers, comment_suffix_identifiers, directive_matchers: comma-separated strings; parser also accepts string lists.; [BaseRule definitions](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/src/sqlfluff_plugin_legibility/rules.py)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Shell                   | Shell: `LEG041 / no-unmatched-comments`                        | [Shell](#coverage-shell-leg039)                                                       | [Examples and source](#leg039-shell-shell)                  | `comment-matchers: string[]`; `comment-prefix-identifiers: string[]`; `comment-suffix-identifiers: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

<a id="leg039-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-unmatched-comments.c` (unpublished)

README custom-check list is stale. The module registers this check. Empty allowlists reject comments. POSIX regexes and per-comment matching differ from Go.

```diff
- // Comment policy rejection fixture.
- int commentPolicyValue;
+ int commentPolicyValue;
```

<a id="leg039-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-unmatched-comments.c` (unpublished)

README custom-check list is stale. The module registers this check. Empty allowlists reject comments. POSIX regexes and per-comment matching differ from Go.

```diff
- // Comment policy rejection fixture.
- int commentPolicyValue;
+ int commentPolicyValue;
```

<a id="leg039-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg039-no-unmatched-comments)

Opt-in. When a repository configures an allowed comment pattern, ordinary comments must match it. With a ticket matcher enabled:

```diff
- // Retry requests in provider order.
+ // ENG-482: Retry requests in provider order.
```

<a id="leg039-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-unmatched-comments)

```diff
- // Retry after the provider resets its rate limit.
+ // WHY: The provider resets its rate limit every 30 seconds.
```

<a id="leg039-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-unmatched-comments)

```diff
- // Retry after the provider resets its rate limit.
+ // WHY: The provider resets its rate limit every 30 seconds.
```

<a id="leg039-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg034-example-diffs)

Current selector: `LEG034`. Split matching into LEG039 and consecutive-line stacking into LEG061. The existing implementation also has a per-function limit and marker-based exceptions; those are not part of the agreed LEG061 behavior. Comment matching grants no exemption from stacking.

```diff
- # Convert cents to dollars.
- total_dollars = cents / 100  # Store the converted total.
+ total_dollars = cents / 100
```

```diff
- value = 1  # coding: utf-8
+ # coding: utf-8
+ value = 1
```

<a id="leg039-sql-jinja-sqlfluff"></a>

#### SQL / Jinja — SQLFluff

[SQLFluff source](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/README.md#remove-ordinary-comments)

Regex matching permits at most one matched comment per top-level statement. Machine directives are exempt.

```diff
--- Explain the join.
 SELECT customers.id
 FROM customers;
```

```diff
-SELECT customers.id /* Keep this stable. */
+SELECT customers.id
 FROM customers;
```

```diff
-{# Explain the model. #}
 SELECT customers.id
 FROM customers;
```

<a id="leg039-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#no-unmatched-comments-diff)

Reject comments that don't match a configured regular-expression matcher, prefix identifier, or suffix identifier. Shebangs, ShellCheck directives, and `noqa` directives are ignored. No matcher or identifier is configured by default, so selecting this rule directly rejects ordinary comments.

```diff
- # explain this branch
+ require_target
```

```diff
- # preserve the legacy response order
+ # KEEP: preserve the legacy response order
```

<a id="leg040"></a>

### LEG040 — no-automated-comment-attribution

Reject explicit automated source signatures in comments.

| Language                | Plugin / current rule                                 | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-no-automated-comment-attribution`  | [C](#coverage-c-leg040)                                                               | [Examples and source](#leg040-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                                    |
| C++                     | Clang: `legibility-no-automated-comment-attribution`  | [C++](#coverage-cplusplus-leg040)                                                     | [Examples and source](#leg040-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                                    |
| Go                      | Go: `LEG040 / no-automated-comment-attribution`       | [Go](#coverage-go-leg040)                                                             | [Examples and source](#leg040-go-go)                        | `automated-comment-identifiers: string[]`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                                   |
| JavaScript / TypeScript | ESLint: `legibility/no-automated-comment-attribution` | [JavaScript](#coverage-javascript-leg040) / [TypeScript](#coverage-typescript-leg040) | [Examples and source](#leg040-javascript-typescript-eslint) | - `{identifiers: string[]}`: case-insensitive names treated as automated sources. Default: `ai`, `chatgpt`, `claude`, `codex`, `copilot`, `gemini`, `gpt`, `llm`, and `openai`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-automated-comment-attribution` | [JavaScript](#coverage-javascript-leg040) / [TypeScript](#coverage-typescript-leg040) | [Examples and source](#leg040-javascript-typescript-oxlint) | - `{identifiers: string[]}`: case-insensitive names treated as automated sources. Default: `ai`, `chatgpt`, `claude`, `codex`, `copilot`, `gemini`, `gpt`, `llm`, and `openai`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Shell                   | Shell: `LEG042 / no-automated-comment-attribution`    | [Shell](#coverage-shell-leg040)                                                       | [Examples and source](#leg040-shell-shell)                  | `automated-comment-identifiers: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                                                                 |

<a id="leg040-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-automated-comment-attribution.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#ifdef BAD
// Generated by Codex.
#else
// Provider identifiers are already normalized.
#endif
int identity(int id) { return id; }
```

<a id="leg040-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-automated-comment-attribution.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#ifdef BAD
// Generated by Codex.
#else
// Provider identifiers are already normalized.
#endif
int identity(int id) { return id; }
```

<a id="leg040-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg040-no-automated-comment-attribution)

Keep useful context, but remove comments that attribute code or prose to an automated tool.

```diff
- // Generated by Codex.
+ // The provider requires retries to remain ordered.
```

<a id="leg040-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-automated-comment-attribution)

```diff
- // Generated by Codex. Normalize provider errors before retrying.
+ // Normalize provider errors before retrying.
```

<a id="leg040-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-automated-comment-attribution)

```diff
- // Generated by Codex. Normalize provider errors before retrying.
+ // Normalize provider errors before retrying.
```

<a id="leg040-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#no-automated-comment-attribution-diff)

Reject explicit automated authorship and generation signatures in comments. Ordinary references to the configured technologies are unchanged.

```diff
- # <configured identifier>-generated.
+ retry_in_provider_order
```

<a id="leg041"></a>

### LEG041 — prefer-line-comments

Prefer `//` comments for ordinary multiline prose.

| Language | Plugin / current rule               | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | ----------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG041 / prefer-line-comments` | [Go](#coverage-go-leg041) | [Examples and source](#leg041-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg041-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg041-prefer-line-comments)

Use Go line comments for ordinary multiline prose.

```diff
- /*
- The provider requires retries to remain ordered.
- */
+ // The provider requires retries to remain ordered.
```

<a id="leg042"></a>

### LEG042 — no-getter-prefix

Avoid the `Get` prefix on accessor names.

| Language | Plugin / current rule           | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | ------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG042 / no-getter-prefix` | [Go](#coverage-go-leg042) | [Examples and source](#leg042-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg042-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg042-no-getter-prefix)

[Effective Go, Getters](https://go.dev/doc/effective_go#Getters). Reported for zero-argument functions and methods that return a value. Generated files are skipped so protocol buffer accessors stay quiet.

```diff
- func (u User) GetOwner() string {
+ func (u User) Owner() string {
 	return u.owner
 }
```

<a id="leg043"></a>

### LEG043 — no-underscore-names

Prefer `MixedCaps` over underscores in declared names.

| Language | Plugin / current rule              | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | ---------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG043 / no-underscore-names` | [Go](#coverage-go-leg043) | [Examples and source](#leg043-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg043-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg043-no-underscore-names)

[Effective Go, MixedCaps](https://go.dev/doc/effective_go#mixed-caps). Test files and generated files are skipped.

```diff
- const max_retries = 3
+ const maxRetries = 3
```

<a id="leg044"></a>

### LEG044 — prefer-initialism-casing

Keep initialisms such as `ID` and `URL` fully capitalized.

| Language | Plugin / current rule                   | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | --------------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG044 / prefer-initialism-casing` | [Go](#coverage-go-leg044) | [Examples and source](#leg044-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg044-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg044-prefer-initialism-casing)

[Google Go style, initialisms](https://google.github.io/styleguide/go/decisions#initialisms). Generated files are skipped.

```diff
- type Request struct {
- 	Url    string
- 	userId string
- }
+ type Request struct {
+ 	URL    string
+ 	userID string
+ }
```

<a id="leg045"></a>

### LEG045 — no-package-name-stutter

Avoid repeating the package name in exported names.

| Language | Plugin / current rule                  | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | -------------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG045 / no-package-name-stutter` | [Go](#coverage-go-leg045) | [Examples and source](#leg045-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg045-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg045-no-package-name-stutter)

[Effective Go, package names](https://go.dev/doc/effective_go#package-names) and [Google Go style, avoid repetition](https://google.github.io/styleguide/go/best-practices#avoid-repetition). Reported when an exported name starts with the package name.

```diff
- func OrdersCreate() error
+ func Create() error
```

<a id="leg046"></a>

### LEG046 — no-generic-package-names

Avoid catch-all package names such as `util` or `common`.

| Language | Plugin / current rule                   | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | --------------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG046 / no-generic-package-names` | [Go](#coverage-go-leg046) | [Examples and source](#leg046-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg046-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg046-no-generic-package-names)

[Google Go style, util packages](https://google.github.io/styleguide/go/best-practices#util-packages).

```diff
- package util
+ package retry
```

<a id="leg047"></a>

### LEG047 — prefer-range-loop

Prefer a range clause over an index counter loop.

| Language | Plugin / current rule                                                                                         | Coverage                          | Examples                                       | Types                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| C++      | Clang: [`modernize-loop-convert`](https://clang.llvm.org/extra/clang-tidy/checks/modernize/loop-convert.html) | [C++](#coverage-cplusplus-leg047) | [Examples and source](#leg047-cplusplus-clang) | Native options retained.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md) |
| Go       | Go: `LEG047 / prefer-range-loop`                                                                              | [Go](#coverage-go-leg047)         | [Examples and source](#leg047-go-go)           | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg047-cplusplus-clang"></a>

#### C++ — Clang

**Default:** off. **Our config:** enabled as an error.

Add `modernize-loop-convert` to `Checks`. Keep native `MinConfidence: reasonable`. Covers supported array/container loops in C++11 and later. [Config](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/scripts/.clang-tidy).

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/modernize-loop-convert.c` (unpublished)

```c
void consume(int item);
void process(int (&items)[4]) {
#ifdef BAD
  for (int i = 0; i < 4; ++i)
    consume(items[i]);
#else
  for (int item : items)
    consume(item);
#endif
}
```

<a id="leg047-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg047-prefer-range-loop)

[Effective Go, For](https://go.dev/doc/effective_go#for). To preserve string and growing-slice semantics, the rule reports only canonical loops over explicitly typed array or slice parameters whose binding remains stable in the loop body.

```diff
- for i := 0; i < len(scores); i++ {
- 	sum += scores[i]
- }
+ for _, score := range scores {
+ 	sum += score
+ }
```

<a id="leg048"></a>

### LEG048 — no-redundant-break

Remove trailing `break` statements from case clauses.

| Language | Plugin / current rule             | Coverage                          | Examples                                       | Types                                                                                                                                       |
| -------- | --------------------------------- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| C        | Clang: `—`                        | [C](#coverage-c-leg048)           | [Examples and source](#leg048-c-clang)         | Not applicable.                                                                                                                             |
| C++      | Clang: `—`                        | [C++](#coverage-cplusplus-leg048) | [Examples and source](#leg048-cplusplus-clang) | Not applicable.                                                                                                                             |
| Go       | Go: `LEG048 / no-redundant-break` | [Go](#coverage-go-leg048)         | [Examples and source](#leg048-go-go)           | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg048-c-clang"></a>

#### C — Clang

[Confirmed exclusion](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)

C/C++ switch breaks prevent fallthrough.

Not applicable.

<a id="leg048-cplusplus-clang"></a>

#### C++ — Clang

[Confirmed exclusion](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)

C/C++ switch breaks prevent fallthrough.

Not applicable.

<a id="leg048-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg048-no-redundant-break)

[Effective Go, Switch](https://go.dev/doc/effective_go#switch). Go case clauses do not fall through, so a trailing `break` adds nothing. Labeled breaks are left alone.

```diff
 default:
 	notify(status)
- 	break
 }
```

<a id="leg049"></a>

### LEG049 — no-naked-returns

Avoid naked returns outside short functions.

| Language | Plugin / current rule           | Coverage                          | Examples                                       | Types                                                                                                                                                        |
| -------- | ------------------------------- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C        | Clang: `—`                      | [C](#coverage-c-leg049)           | [Examples and source](#leg049-c-clang)         | Not applicable.                                                                                                                                              |
| C++      | Clang: `—`                      | [C++](#coverage-cplusplus-leg049) | [Examples and source](#leg049-cplusplus-clang) | Not applicable.                                                                                                                                              |
| Go       | Go: `LEG049 / no-naked-returns` | [Go](#coverage-go-leg049)         | [Examples and source](#leg049-go-go)           | `max-naked-return-lines: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg049-c-clang"></a>

#### C — Clang

[Confirmed exclusion](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)

C/C++ does not have Go-style named return values.

Not applicable.

<a id="leg049-cplusplus-clang"></a>

#### C++ — Clang

[Confirmed exclusion](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)

C/C++ does not have Go-style named return values.

Not applicable.

<a id="leg049-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg049-no-naked-returns)

[Effective Go, named result parameters](https://go.dev/doc/effective_go#named-results). Reported for named results in functions longer than `max-naked-return-lines`.

```diff
- 	err = validate(data)
- 	return
+ 	return data, validate(data)
 }
```

<a id="leg050"></a>

### LEG050 — prefer-lowercase-error-strings

Prefer lowercase error strings without trailing punctuation.

| Language | Plugin / current rule                         | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | --------------------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG050 / prefer-lowercase-error-strings` | [Go](#coverage-go-leg050) | [Examples and source](#leg050-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg050-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg050-prefer-lowercase-error-strings)

[Effective Go, Errors](https://go.dev/doc/effective_go#errors) and [Google Go style, error strings](https://google.github.io/styleguide/go/decisions#error-strings). Covers `errors.New` and `fmt.Errorf`, recognizes import aliases, and ignores shadowed or unrelated selectors. Initialisms and multiword identifiers such as `HTTP` or `TLSConfig` are left alone.

```diff
- return errors.New("Invalid user")
- return fmt.Errorf("cannot read %s.", name)
+ return errors.New("invalid user")
+ return fmt.Errorf("cannot read %s", name)
```

<a id="leg051"></a>

### LEG051 — max-function-params

Limit the number of parameters in a signature.

| Language                | Plugin / current rule                                                    | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-max-function-parameters`                              | [C](#coverage-c-leg051)                                                               | [Examples and source](#leg051-c-clang)                      | - `MaxParameters: unsigned integer`: allowed declared parameters. Default: `5`. Parity tests use `5` for the Go profile and `4` for the ESLint profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                             |
| C++                     | Clang: `legibility-max-function-parameters`                              | [C++](#coverage-cplusplus-leg051)                                                     | [Examples and source](#leg051-cplusplus-clang)              | - `MaxParameters: unsigned integer`: allowed declared parameters. Default: `5`. Parity tests use `5` for the Go profile and `4` for the ESLint profile.; [Check registration](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                                                                                                             |
| Go                      | Go: `LEG051 / max-function-params`                                       | [Go](#coverage-go-leg051)                                                             | [Examples and source](#leg051-go-go)                        | `max-function-params: optional integer`; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go)                                                                                                                                                                                                                              |
| JavaScript / TypeScript | ESLint: `legibility/max-function-parameters`                             | [JavaScript](#coverage-javascript-leg051) / [TypeScript](#coverage-typescript-leg051) | [Examples and source](#leg051-javascript-typescript-eslint) | - `{max: number}`: allowed top-level parameters. Default: `4`. - `{maxObjectProperties: number}`: allowed properties in one destructured object parameter. Default: `8`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/max-function-parameters`                             | [JavaScript](#coverage-javascript-leg051) / [TypeScript](#coverage-typescript-leg051) | [Examples and source](#leg051-javascript-typescript-oxlint) | - `{max: number}`: allowed top-level parameters. Default: `4`. - `{maxObjectProperties: number}`: allowed properties in one destructured object parameter. Default: `8`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Ruff: [`PLR0913`](https://docs.astral.sh/ruff/rules/too-many-arguments/) | [Python](#coverage-python-leg051)                                                     | [Configuration, examples, and tests](#leg051-python-ruff)   | `lint.pylint.max-args: integer` (default 5)                                                                                                                                                                                                                                                                                                                                            |

<a id="leg051-c-clang"></a>

#### C — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#max-function-parameters)

```diff
- void draw(int x, int y, int width, int height, int color, int border);
+ struct Rectangle {
+   int x;
+   int y;
+   int width;
+   int height;
+ };
+ void draw(struct Rectangle bounds, int color, int border);
```

<a id="leg051-cplusplus-clang"></a>

#### C++ — Clang

[Clang source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md#max-function-parameters)

```diff
- void draw(int x, int y, int width, int height, int color, int border);
+ struct Rectangle {
+   int x;
+   int y;
+   int width;
+   int height;
+ };
+ void draw(struct Rectangle bounds, int color, int border);
```

<a id="leg051-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg051-max-function-params)

[Google Go style, function argument lists](https://google.github.io/styleguide/go/best-practices#function-argument-lists). Applies to declarations, literals, named function types, and interface methods.

```diff
- func send(host string, port int, user string, token string, retries int, verbose bool)
+ func send(target Target, options SendOptions)
```

<a id="leg051-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#max-function-parameters)

```diff
- function schedule(user, plan, timezone, locale, notify) {}
+ function schedule(request, deliveryOptions) {}

- function publish({ article, author, channel, locale, schedule, tags, theme, tracking, visibility }) {}
+ function publish(article, publicationOptions) {}
```

<a id="leg051-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#max-function-parameters)

```diff
- function schedule(user, plan, timezone, locale, notify) {}
+ function schedule(request, deliveryOptions) {}

- function publish({ article, author, channel, locale, schedule, tags, theme, tracking, visibility }) {}
+ function publish(article, publicationOptions) {}
```

<a id="leg051-python-ruff"></a>

#### Python — Ruff

[PLR0913](https://docs.astral.sh/ruff/rules/too-many-arguments/) is **off by default and in [our config](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/pyproject.toml)**. Run Ruff alongside `ruff-legibility`.

Merge into `pyproject.toml`, preserving existing selections:

```toml
[tool.ruff.lint]
extend-select = ["PLR0913"]

[tool.ruff.lint.pylint]
max-args = 5
```

Ruff defaults to five parameters. Adjust `max-args` for your project. Methods marked `@typing.override` are exempt.

```diff
- def move(x, y, z, dx, dy, dz): ...
+ def move(position, velocity): ...
```

[Test results](#native-coverage-verification). This setup is not yet part of our recommended configuration.

<a id="leg052"></a>

### LEG052 — prefer-verb-function-names

Opt-in. Prefer action verbs at the start of function names.

| Language | Plugin / current rule                     | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | ----------------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG052 / prefer-verb-function-names` | [Go](#coverage-go-leg052) | [Examples and source](#leg052-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg052-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg052-prefer-verb-function-names)

Opt-in. Flags obvious payload-first function names such as `dataFn` and `valueFunction`. Constructors and canonical methods such as `New`, `String`, `Error`, `Len`, `Close`, `Read`, and `Write` are exempt.

```diff
- func dataFn() {}
+ func getData() {}
```

<a id="leg053"></a>

### LEG053 — prefer-boolean-prefixes

Opt-in. Prefer predicate or state prefixes for boolean names.

| Language | Plugin / current rule                  | Coverage                  | Examples                             | Types                                                                                                                                       |
| -------- | -------------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | Go: `LEG053 / prefer-boolean-prefixes` | [Go](#coverage-go-leg053) | [Examples and source](#leg053-go-go) | No rule-specific setting.; [Settings](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/settings.go) |

<a id="leg053-go-go"></a>

#### Go — Go

[Go source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md#leg053-prefer-boolean-prefixes)

Opt-in. Applies to syntactically declared `bool` fields, parameters, and results. Prefer `is`, `has`, `can`, `should`, or `will`; idiomatic states such as `ok`, `done`, `ready`, `valid`, `enabled`, `disabled`, and `found` are exempt. Type aliases are not inferred by this syntax-only rule.

```diff
- active bool
+ isActive bool
```

<a id="leg054"></a>

### LEG054 — no-complex-ternaries

Reject nested ternaries and operator-heavy ternaries.

| Language                | Plugin / current rule                                                                                                                                       | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C                       | Clang: [`readability-avoid-nested-conditional-operator`](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html) | [C](#coverage-c-leg054)                                                               | [Examples and source](#leg054-c-clang)                      | No rule-specific options; covers nesting only. Operator-budget check remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                                               |
| C++                     | Clang: [`readability-avoid-nested-conditional-operator`](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html) | [C++](#coverage-cplusplus-leg054)                                                     | [Examples and source](#leg054-cplusplus-clang)              | No rule-specific options; covers nesting only. Operator-budget check remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                                               |
| JavaScript / TypeScript | ESLint: `legibility/no-complex-ternaries`                                                                                                                   | [JavaScript](#coverage-javascript-leg054) / [TypeScript](#coverage-typescript-leg054) | [Examples and source](#leg054-javascript-typescript-eslint) | - `{max: number}`: allowed weighted operators inside one ternary. Default: `2`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-complex-ternaries`                                                                                                                   | [JavaScript](#coverage-javascript-leg054) / [TypeScript](#coverage-typescript-leg054) | [Examples and source](#leg054-javascript-typescript-oxlint) | - `{max: number}`: allowed weighted operators inside one ternary. Default: `2`. - `{operators: string[]}`: operators to count. - `{complexity: Record<string, number>}`: per-operator weights.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG004 / no-complex-ternary`                                                                                                                       | [Python](#coverage-python-leg054)                                                     | [Examples and source](#leg054-python-python)                | `max-ternary-operators: integer`; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                                                              |

<a id="leg054-c-clang"></a>

#### C — Clang

**Default:** off. **Our config:** enabled as an error.

Add `readability-avoid-nested-conditional-operator` to `Checks`; no options are needed. It catches nested ternaries. Complex single ternaries, including the example below, remain unchecked. [Config](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/scripts/.clang-tidy); nested-ternary tests: `clang-tidy-legibility/tests/integration/fixtures/coverage/readability-avoid-nested-conditional-operator.c` (unpublished).

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-complex-ternaries.c` (unpublished)

```c
#include <stdbool.h>
bool choose(bool enabled, int a, int b, bool fallback) {
#ifdef BAD
  return enabled ? (a > 0 && b > 0) : fallback;
#else
  const bool bothPositive = a > 0 && b > 0;
  return enabled ? bothPositive : fallback;
#endif
}
```

<a id="leg054-cplusplus-clang"></a>

#### C++ — Clang

Same [setup and limits as C](#leg054-c-clang). Tested with C++17.

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-complex-ternaries.c` (unpublished)

```c
#include <stdbool.h>
bool choose(bool enabled, int a, int b, bool fallback) {
#ifdef BAD
  return enabled ? (a > 0 && b > 0) : fallback;
#else
  const bool bothPositive = a > 0 && b > 0;
  return enabled ? bothPositive : fallback;
#endif
}
```

<a id="leg054-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-complex-ternaries)

```diff
- const label = isLoading ? "Loading" : hasError ? "Error" : "Ready";
+ const label = getStatusLabel({ hasError, isLoading });
```

<a id="leg054-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-complex-ternaries)

```diff
- const label = isLoading ? "Loading" : hasError ? "Error" : "Ready";
+ const label = getStatusLabel({ hasError, isLoading });
```

<a id="leg054-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg004-example-diff)

Current selector: `LEG004`.

```diff
- label = "owner" if user.is_owner else "admin" if user.is_admin else "member"
+ if user.is_owner:
+     label = "owner"
+ elif user.is_admin:
+     label = "admin"
+ else:
+     label = "member"
```

<a id="leg055"></a>

### LEG055 — no-hidden-side-effects

Keep mutations out of nested expressions and side-effect-free callbacks.

| Language                | Plugin / current rule                                                                                                                                                                                                                                     | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: [`bugprone-assignment-in-if-condition`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-if-condition.html); [`bugprone-assert-side-effect`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assert-side-effect.html) | [C](#coverage-c-leg055)                                                               | [Examples and source](#leg055-c-clang)                      | Assertion option `CheckFunctionCalls: boolean` defaults to false; assignment-in-if has no rule-specific options. Broader policy remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             |
| C++                     | Clang: [`bugprone-assignment-in-if-condition`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-if-condition.html); [`bugprone-assert-side-effect`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assert-side-effect.html) | [C++](#coverage-cplusplus-leg055)                                                     | [Examples and source](#leg055-cplusplus-clang)              | Assertion option `CheckFunctionCalls: boolean` defaults to false; assignment-in-if has no rule-specific options. Broader policy remains unimplemented.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                             |
| JavaScript / TypeScript | ESLint: `legibility/no-hidden-side-effects`                                                                                                                                                                                                               | [JavaScript](#coverage-javascript-leg055) / [TypeScript](#coverage-typescript-leg055) | [Examples and source](#leg055-javascript-typescript-eslint) | - `{mutatingMethods: string[]}`: method calls treated as mutations. - `{sideEffectFreeIterationMethods: string[]}`: callback methods expected to stay side-effect-free.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-hidden-side-effects`                                                                                                                                                                                                               | [JavaScript](#coverage-javascript-leg055) / [TypeScript](#coverage-typescript-leg055) | [Examples and source](#leg055-javascript-typescript-oxlint) | - `{mutatingMethods: string[]}`: method calls treated as mutations. - `{sideEffectFreeIterationMethods: string[]}`: callback methods expected to stay side-effect-free.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG013 / no-hidden-side-effects`                                                                                                                                                                                                                 | [Python](#coverage-python-leg055)                                                     | [Examples and source](#leg055-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                           |

<a id="leg055-c-clang"></a>

#### C — Clang

**Default:** off. **Our config:** enabled as errors.

Add these names to `Checks`:

- `bugprone-assignment-in-if-condition`
- `bugprone-assert-side-effect`

Keep `CheckFunctionCalls: false`. These checks cover conditions and assertions, but miss return mutations and the callback policy. [Config](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/scripts/.clang-tidy); condition tests: `clang-tidy-legibility/tests/integration/fixtures/coverage/bugprone-assignment-in-if-condition.c` (unpublished); assertion tests: `clang-tidy-legibility/tests/integration/fixtures/coverage/bugprone-assert-side-effect.c` (unpublished).

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-hidden-side-effects.c` (unpublished)

```c
int process(int count) {
#ifdef BAD
  return (count += 1);
#else
  count += 1;
  return count;
#endif
}
```

<a id="leg055-cplusplus-clang"></a>

#### C++ — Clang

Same [setup and limits as C](#leg055-c-clang). Tested with C++17.

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-hidden-side-effects.c` (unpublished)

```c
int process(int count) {
#ifdef BAD
  return (count += 1);
#else
  count += 1;
  return count;
#endif
}
```

<a id="leg055-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-hidden-side-effects)

```diff
- return (count += 1);
+ count += 1;
+
+ return count;
```

<a id="leg055-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-hidden-side-effects)

```diff
- return (count += 1);
+ count += 1;
+
+ return count;
```

<a id="leg055-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg013-example-diff)

Current selector: `LEG013`.

```diff
- return cache.setdefault(key, build_value())
+ if key not in cache:
+     cache[key] = build_value()
+ return cache[key]
```

<a id="leg056"></a>

### LEG056 — no-identity-array-callback

Reject `map` and `filter` callbacks that keep every item unchanged.

| Language                | Plugin / current rule                           | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++                     | Clang: `legibility-no-identity-array-callback`  | [C++](#coverage-cplusplus-leg056)                                                     | [Examples and source](#leg056-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| JavaScript / TypeScript | ESLint: `legibility/no-identity-array-callback` | [JavaScript](#coverage-javascript-leg056) / [TypeScript](#coverage-typescript-leg056) | [Examples and source](#leg056-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-identity-array-callback` | [JavaScript](#coverage-javascript-leg056) / [TypeScript](#coverage-typescript-leg056) | [Examples and source](#leg056-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG022 / no-identity-array-callback`   | [Python](#coverage-python-leg056)                                                     | [Examples and source](#leg056-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                        |

<a id="leg056-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-identity-array-callback.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <algorithm>
#include <vector>
std::vector<int> process(const std::vector<int> &items) {
#ifdef BAD
  std::vector<int> result(items.size());
  std::transform(items.begin(), items.end(), result.begin(), [](int item) { return item; });
  return result;
#else
  return items;
#endif
}
```

<a id="leg056-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-identity-array-callback)

```diff
- const nextItems = items.map((item) => item);
+ const nextItems = items;
```

<a id="leg056-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-identity-array-callback)

```diff
- const nextItems = items.map((item) => item);
+ const nextItems = items;
```

<a id="leg056-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg022-example-diff)

Current selector: `LEG022`.

```diff
- names = list(map(lambda name: name, names))
+ names = list(names)
```

<a id="leg057"></a>

### LEG057 — no-repeated-collection-search

Flag repeated searches over the same collection in one scope.

| Language                | Plugin / current rule                              | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C++                     | Clang: `legibility-no-repeated-collection-search`  | [C++](#coverage-cplusplus-leg057)                                                     | [Examples and source](#leg057-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                           |
| JavaScript / TypeScript | ESLint: `legibility/no-repeated-collection-search` | [JavaScript](#coverage-javascript-leg057) / [TypeScript](#coverage-typescript-leg057) | [Examples and source](#leg057-javascript-typescript-eslint) | - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-repeated-collection-search` | [JavaScript](#coverage-javascript-leg057) / [TypeScript](#coverage-typescript-leg057) | [Examples and source](#leg057-javascript-typescript-oxlint) | - `{searchMethods: string[]}`: methods treated as collection searches.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG018 / no-repeated-collection-search`   | [Python](#coverage-python-leg057)                                                     | [Examples and source](#leg057-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                          |

<a id="leg057-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-repeated-collection-search.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <algorithm>
#include <unordered_set>
#include <vector>
bool process(const std::vector<int> &users, int owner, int reviewer) {
#ifdef BAD
  const auto ownerPosition = std::find(users.begin(), users.end(), owner);
  const auto reviewerPosition = std::find(users.begin(), users.end(), reviewer);
  return ownerPosition != users.end() && reviewerPosition != users.end();
#else
  const std::unordered_set<int> indexed(users.begin(), users.end());
  return indexed.count(owner) != 0 && indexed.count(reviewer) != 0;
#endif
}
```

<a id="leg057-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-repeated-collection-search)

```diff
- const owner = users.find((user) => user.id === ownerId);
- const reviewer = users.find((user) => user.id === reviewerId);
+ const usersById = new Map(users.map((user) => [user.id, user]));
+ const owner = usersById.get(ownerId);
+ const reviewer = usersById.get(reviewerId);
```

<a id="leg057-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-repeated-collection-search)

```diff
- const owner = users.find((user) => user.id === ownerId);
- const reviewer = users.find((user) => user.id === reviewerId);
+ const usersById = new Map(users.map((user) => [user.id, user]));
+ const owner = usersById.get(ownerId);
+ const reviewer = usersById.get(reviewerId);
```

<a id="leg057-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg018-example-diff)

Current selector: `LEG018`.

```diff
- if user_id in ids and owner_id in ids:
-     return True
+ id_lookup = set(ids)
+ required_ids = {user_id, owner_id}
+ return required_ids.issubset(id_lookup)
```

<a id="leg058"></a>

### LEG058 — no-single-use-renaming-alias

Avoid aliases that only rename another value for one use.

| Language                | Plugin / current rule                             | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-no-single-use-renaming-alias`  | [C](#coverage-c-leg058)                                                               | [Examples and source](#leg058-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| C++                     | Clang: `legibility-no-single-use-renaming-alias`  | [C++](#coverage-cplusplus-leg058)                                                     | [Examples and source](#leg058-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| JavaScript / TypeScript | ESLint: `legibility/no-single-use-renaming-alias` | [JavaScript](#coverage-javascript-leg058) / [TypeScript](#coverage-typescript-leg058) | [Examples and source](#leg058-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-single-use-renaming-alias` | [JavaScript](#coverage-javascript-leg058) / [TypeScript](#coverage-typescript-leg058) | [Examples and source](#leg058-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG019 / no-single-use-renaming-alias`   | [Python](#coverage-python-leg058)                                                     | [Examples and source](#leg058-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                        |

<a id="leg058-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-single-use-renaming-alias.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
struct User { int name; };
int process(struct User user) {
#ifdef BAD
  const struct User userData = user;
  return userData.name;
#else
  return user.name;
#endif
}
```

<a id="leg058-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-single-use-renaming-alias.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
struct User { int name; };
int process(struct User user) {
#ifdef BAD
  const struct User userData = user;
  return userData.name;
#else
  return user.name;
#endif
}
```

<a id="leg058-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-single-use-renaming-alias)

```diff
- const userData = user;
-
- return userData.name;
+ return user.name;
```

<a id="leg058-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-single-use-renaming-alias)

```diff
- const userData = user;
-
- return userData.name;
+ return user.name;
```

<a id="leg058-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg019-example-diff)

Current selector: `LEG019`.

```diff
- current_user = request.user
- return current_user.email
+ return request.user.email
```

<a id="leg059"></a>

### LEG059 — no-small-collection-conversion

Avoid converting a statically small array or string into a `Map` or `Set` for one immediate lookup. Named collections, dynamic inputs, and literal inputs at the threshold are unchanged.

| Language                | Plugin / current rule                               | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++                     | Clang: `legibility-no-small-collection-conversion`  | [C++](#coverage-cplusplus-leg059)                                                     | [Examples and source](#leg059-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                    |
| JavaScript / TypeScript | ESLint: `legibility/no-small-collection-conversion` | [JavaScript](#coverage-javascript-leg059) / [TypeScript](#coverage-typescript-leg059) | [Examples and source](#leg059-javascript-typescript-eslint) | - `{min: number}`: minimum known input size before a lookup collection is useful. Default: `3`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-small-collection-conversion` | [JavaScript](#coverage-javascript-leg059) / [TypeScript](#coverage-typescript-leg059) | [Examples and source](#leg059-javascript-typescript-oxlint) | - `{min: number}`: minimum known input size before a lookup collection is useful. Default: `3`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |

<a id="leg059-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-small-collection-conversion.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <set>
bool process(int status) {
#ifdef BAD
  return std::set<int>{1, 2}.count(status) != 0;
#else
  return status == 1 || status == 2;
#endif
}
```

<a id="leg059-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-small-collection-conversion)

```diff
- const isTerminal = new Set(["done", "failed"]).has(status);
+ const isTerminal = ["done", "failed"].includes(status);
```

<a id="leg059-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-small-collection-conversion)

```diff
- const isTerminal = new Set(["done", "failed"]).has(status);
+ const isTerminal = ["done", "failed"].includes(status);
```

<a id="leg060"></a>

### LEG060 — no-standalone-array-mutations

Prefer explicit returned array composition over standalone array mutation statements.

| Language                | Plugin / current rule                              | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++                     | Clang: `legibility-no-standalone-array-mutations`  | [C++](#coverage-cplusplus-leg060)                                                     | [Examples and source](#leg060-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                                                                                                                                                                               |
| JavaScript / TypeScript | ESLint: `legibility/no-standalone-array-mutations` | [JavaScript](#coverage-javascript-leg060) / [TypeScript](#coverage-typescript-leg060) | [Examples and source](#leg060-javascript-typescript-eslint) | - `{arrayMutatingMethods: string[]}`: array methods reported when used as standalone mutations. - `{mutatingMethods: string[]}`: mutation methods used to identify fresh mutation targets.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-standalone-array-mutations` | [JavaScript](#coverage-javascript-leg060) / [TypeScript](#coverage-typescript-leg060) | [Examples and source](#leg060-javascript-typescript-oxlint) | - `{arrayMutatingMethods: string[]}`: array methods reported when used as standalone mutations. - `{mutatingMethods: string[]}`: mutation methods used to identify fresh mutation targets.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG014 / no-standalone-array-mutations`   | [Python](#coverage-python-leg060)                                                     | [Examples and source](#leg060-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                                              |

<a id="leg060-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-standalone-array-mutations.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#include <vector>
std::vector<int> append(const std::vector<int> &items, int next);
std::vector<int> process(std::vector<int> items, int next) {
#ifdef BAD
  items.push_back(next);
  return items;
#else
  return append(items, next);
#endif
}
```

<a id="leg060-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-standalone-array-mutations)

```diff
- items.push(nextItem);
-
- return items;
+ return items.concat(nextItem);
```

<a id="leg060-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-standalone-array-mutations)

```diff
- items.push(nextItem);
-
- return items;
+ return items.concat(nextItem);
```

<a id="leg060-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg014-example-diff)

Current selector: `LEG014`.

```diff
- items.append(item)
- return items
+ return items + [item]
```

<a id="leg061"></a>

### LEG061 — no-stacked-comments

Reject comments on consecutive lines. A blank line between comments is allowed.

| Language                | Plugin / current rule                                                            | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C                       | Clang: `legibility-no-stacked-comments`                                          | [C](#coverage-c-leg061)                                                               | [Examples and source](#leg061-c-clang)                      | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| C++                     | Clang: `legibility-no-stacked-comments`                                          | [C++](#coverage-cplusplus-leg061)                                                     | [Examples and source](#leg061-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| JavaScript / TypeScript | ESLint: `legibility/no-stacked-comments`                                         | [JavaScript](#coverage-javascript-leg061) / [TypeScript](#coverage-typescript-leg061) | [Examples and source](#leg061-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-stacked-comments`                                         | [JavaScript](#coverage-javascript-leg061) / [TypeScript](#coverage-typescript-leg061) | [Examples and source](#leg061-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: current `LEG034 / no-unmatched-comments`; intended `no-stacked-comments` | [Python](#coverage-python-leg061)                                                     | [Target example and source](#leg061-python-python)          | Definition pending split; existing comment-policy fields are in [Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py).                                                                            |
| SQL / Jinja             | SQLFluff: `Legibility_L002 / legibility.no_stacked_comments`                     | [SQL](#coverage-sql-leg061) / [Jinja](#coverage-jinja-leg061)                         | [Examples and source](#leg061-sql-jinja-sqlfluff)           | No rule-specific options.; [BaseRule definitions](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/src/sqlfluff_plugin_legibility/rules.py)                                                                                 |
| Shell                   | Shell: `LEG043 / no-stacked-comments`                                            | [Shell](#coverage-shell-leg061)                                                       | [Examples and source](#leg061-shell-shell)                  | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                      |

<a id="leg061-c-clang"></a>

#### C — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-stacked-comments.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#ifdef BAD
// Retry failed requests.
// Retry requests during regional failover.
#else
// Retry failed requests during regional failover.
#endif
int identity(int id) { return id; }
```

<a id="leg061-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/no-stacked-comments.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
#ifdef BAD
// Retry failed requests.
// Retry requests during regional failover.
#else
// Retry failed requests during regional failover.
#endif
int identity(int id) { return id; }
```

<a id="leg061-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-stacked-comments)

```diff
- // Retry every failed request.
- // Retry requests that fail during regional failover.
+ // Retry only requests that fail during regional failover.
```

<a id="leg061-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-stacked-comments)

```diff
- // Retry every failed request.
- // Retry requests that fail during regional failover.
+ // Retry only requests that fail during regional failover.
```

<a id="leg061-python-python"></a>

#### Python — planned split

The shared catalog will describe comment matching and comment stacking separately. Python currently emits LEG034 for both. Its separate LEG061 implementation and interface do not exist yet.

[Current Python behavior](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#regex-matched-comments); [implementation](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/rules.py).

The agreed LEG061 behavior rejects consecutive comment lines. Matching a configured prefix or suffix does not exempt a comment from this rule. The current implementation's per-function limit and marker-based exemptions must not be carried into LEG061.

Proposed LEG061 example, with the ENG comment matcher configured. This is a documentation example for the planned rule, not a claim about the current implementation:

```diff
 def load_value():
-    # ENG-481: Load the configured value once.
-    # ENG-482: Preserve the configured fallback.
+    # ENG-481: Load once and use the configured fallback when empty.
     value = load()
     return value or fallback()
```

<a id="leg061-sql-jinja-sqlfluff"></a>

#### SQL / Jinja — SQLFluff

[SQLFluff source](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/README.md#reject-stacked-comments)

```diff
 -- ENG-481: Provider retries must remain ordered.
--- ENG-481: Do not reorder these retries.
 SELECT retry_id
 FROM retries;
```

<a id="leg061-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#no-stacked-comments-diff)

Report the second and subsequent comments on consecutive lines. A blank or non-comment line breaks the stack. Shebangs, ShellCheck directives, and `noqa` directives are ignored. This rule has no options.

```diff
- # Retry every failed request.
  # Retry requests that fail during regional failover.
```

<a id="leg062"></a>

### LEG062 — prefer-flat-map

Prefer `flatMap` over `map(...).flat()`.

| Language                | Plugin / current rule                | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C++                     | Clang: `legibility-prefer-flat-map`  | [C++](#coverage-cplusplus-leg062)                                                     | [Examples and source](#leg062-cplusplus-clang)              | No implemented rule-specific interface; proposed check name appears in parity fixtures.; [Coverage / options](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md)                                         |
| JavaScript / TypeScript | ESLint: `legibility/prefer-flat-map` | [JavaScript](#coverage-javascript-leg062) / [TypeScript](#coverage-typescript-leg062) | [Examples and source](#leg062-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/prefer-flat-map` | [JavaScript](#coverage-javascript-leg062) / [TypeScript](#coverage-typescript-leg062) | [Examples and source](#leg062-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |

<a id="leg062-cplusplus-clang"></a>

#### C++ — Clang

Clang fixture: `clang-tidy-legibility/tests/integration/fixtures/coverage/prefer-flat-map.c` (unpublished)

Existing fixture: BAD selects the rejected example, the other branch is the accepted example. Coverage status is reported by the repository; tests were not rerun for this document.

```c
struct Sequence {
  Sequence map() const;
  Sequence flat() const;
  Sequence flatMap() const;
};
Sequence process(const Sequence &items) {
#ifdef BAD
  return items.map().flat();
#else
  return items.flatMap();
#endif
}
```

<a id="leg062-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#prefer-flat-map)

```diff
- const permissions = users.map((user) => user.permissions).flat();
+ const permissions = users.flatMap((user) => user.permissions);
```

<a id="leg062-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#prefer-flat-map)

```diff
- const permissions = users.map((user) => user.permissions).flat();
+ const permissions = users.flatMap((user) => user.permissions);
```

<a id="leg063"></a>

### LEG063 — no-direct-bin-smoke

Smoke-test the installed command instead of invoking its source entry point directly.

The Node, Python, and Shell names below are previous names to retain as compatibility aliases.

| Language                | Plugin / current rule                         | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | ESLint: `legibility/no-direct-node-bin-smoke` | [JavaScript](#coverage-javascript-leg063) / [TypeScript](#coverage-typescript-leg063) | [Examples and source](#leg063-javascript-typescript-eslint) | - `{entryPatterns: string[]}`: entry files that should be tested through the installed bin shim.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-direct-node-bin-smoke` | [JavaScript](#coverage-javascript-leg063) / [TypeScript](#coverage-typescript-leg063) | [Examples and source](#leg063-javascript-typescript-oxlint) | - `{entryPatterns: string[]}`: entry files that should be tested through the installed bin shim.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG017 / no-direct-python-bin-smoke` | [Python](#coverage-python-leg063)                                                     | [Examples and source](#leg063-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                    |
| Shell                   | Shell: `LEG017 / no-direct-shell-bin-smoke`   | [Shell](#coverage-shell-leg063)                                                       | [Examples and source](#leg063-shell-shell)                  | `direct-shell-entry-patterns: string[]`; `executable-runtimes: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                   |

<a id="leg063-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-direct-node-bin-smoke)

```diff
- execSync("node src/index.js --help");
+ execSync("my-cli --help");
```

<a id="leg063-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-direct-node-bin-smoke)

```diff
- execSync("node src/index.js --help");
+ execSync("my-cli --help");
```

<a id="leg063-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg017-example-diff)

Current selector: `LEG017`. Additional entry/path fields exist on Settings; file-config exposure is narrower.

```diff
- subprocess.run(["python", "src/example/cli.py", "--help"], check=True)
+ subprocess.run(["example", "--help"], check=True)
```

<a id="leg063-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#no-direct-shell-bin-smoke-diff)

Prefer smoke-testing the installed command instead of invoking entry scripts directly with a shell.

```diff
- bash bin/shellcheck-legibility --version
+ shellcheck-legibility --version
```

<a id="leg064"></a>

### LEG064 — no-redundant-nullish-fallback

Avoid `?? undefined` fallbacks. Static `void` operands are evaluated within a bounded BigInt budget. Expressions that could create unusually large BigInt values are ignored.

| Language                | Plugin / current rule                              | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | ESLint: `legibility/no-redundant-nullish-fallback` | [JavaScript](#coverage-javascript-leg064) / [TypeScript](#coverage-typescript-leg064) | [Examples and source](#leg064-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-redundant-nullish-fallback` | [JavaScript](#coverage-javascript-leg064) / [TypeScript](#coverage-typescript-leg064) | [Examples and source](#leg064-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |

<a id="leg064-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-redundant-nullish-fallback)

```diff
- const value = maybeValue ?? undefined;
+ const value = maybeValue;
```

<a id="leg064-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-redundant-nullish-fallback)

```diff
- const value = (void 0) ?? undefined;
+ const value = void 0;
```

<a id="leg065"></a>

### LEG065 — require-jsdoc-multiline-comments

Require block comments spanning multiple lines to use `/** ... */` JSDoc syntax. Line comments and single-line block comments are unchanged. This formatting rule does not permit agents to add comments. During an agent session, `npx lint-changed --comments=forbid` rejects every added comment, including separated comments. Outside that session policy, ESLint and Oxlint can autofix this rule by adding the missing `*` to the block opener.

| Language                | Plugin / current rule                                 | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | ESLint: `legibility/require-jsdoc-multiline-comments` | [JavaScript](#coverage-javascript-leg065) / [TypeScript](#coverage-typescript-leg065) | [Examples and source](#leg065-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/require-jsdoc-multiline-comments` | [JavaScript](#coverage-javascript-leg065) / [TypeScript](#coverage-typescript-leg065) | [Examples and source](#leg065-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |

<a id="leg065-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#require-jsdoc-multiline-comments)

```diff
- /*
-  * The provider can return a stale token during regional failover.
-  * Preserve the retry order.
-  */
+ /**
+  * The provider can return a stale token during regional failover.
+  * Preserve the retry order.
+  */
```

<a id="leg065-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#require-jsdoc-multiline-comments)

```diff
- /*
-  * The provider can return a stale token during regional failover.
-  * Preserve the retry order.
-  */
+ /**
+  * The provider can return a stale token during regional failover.
+  * Preserve the retry order.
+  */
```

<a id="leg066"></a>

### LEG066 — no-unnecessary-async

Flag async functions that have no await, only return one awaited value, or only await Node filesystem operations with synchronous equivalents. Filesystem detection covers named and namespace imports from `node:fs/promises`, `fs/promises`, `node:fs`, and `fs`. Use the filesystem diagnostic for local tooling and scripts. Non-blocking filesystem I/O remains appropriate in request-serving code.

| Language                | Plugin / current rule                     | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | ESLint: `legibility/no-unnecessary-async` | [JavaScript](#coverage-javascript-leg066) / [TypeScript](#coverage-typescript-leg066) | [Examples and source](#leg066-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-unnecessary-async` | [JavaScript](#coverage-javascript-leg066) / [TypeScript](#coverage-typescript-leg066) | [Examples and source](#leg066-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |

<a id="leg066-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-unnecessary-async)

```diff
- import { readFile } from "node:fs/promises";
+ import { readFileSync } from "node:fs";

- async function readConfig() {
-   return await readFile("config.json", "utf8");
+ function readConfig() {
+   return readFileSync("config.json", "utf8");
  }
```

<a id="leg066-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-unnecessary-async)

```diff
- import { readFile } from "node:fs/promises";
+ import { readFileSync } from "node:fs";

- async function readConfig() {
-   return await readFile("config.json", "utf8");
+ function readConfig() {
+   return readFileSync("config.json", "utf8");
  }
```

<a id="leg067"></a>

### LEG067 — no-unnecessary-block-callback

Prefer expression-bodied arrow callbacks when the callback block only returns.

| Language                | Plugin / current rule                              | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | ESLint: `legibility/no-unnecessary-block-callback` | [JavaScript](#coverage-javascript-leg067) / [TypeScript](#coverage-typescript-leg067) | [Examples and source](#leg067-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/no-unnecessary-block-callback` | [JavaScript](#coverage-javascript-leg067) / [TypeScript](#coverage-typescript-leg067) | [Examples and source](#leg067-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |

<a id="leg067-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#no-unnecessary-block-callback)

```diff
- const ids = users.map((user) => {
-   return user.id;
- });
+ const ids = users.map((user) => user.id);
```

<a id="leg067-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#no-unnecessary-block-callback)

```diff
- const ids = users.map((user) => {
-   return user.id;
- });
+ const ids = users.map((user) => user.id);
```

<a id="leg068"></a>

### LEG068 — prefer-concat-object-assign

Report array and object literals containing spread when a project prefers method-based composition: - Array literal spread is reported in favor of `Array#concat`. - Object literal spread is reported in favor of `Object.assign` with a new target. - Function-call spread and rest syntax are unchanged. This rule has no options or autofix. Enable it explicitly:

| Language                | Plugin / current rule                            | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | ESLint: `legibility/prefer-concat-object-assign` | [JavaScript](#coverage-javascript-leg068) / [TypeScript](#coverage-typescript-leg068) | [Examples and source](#leg068-javascript-typescript-eslint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/prefer-concat-object-assign` | [JavaScript](#coverage-javascript-leg068) / [TypeScript](#coverage-typescript-leg068) | [Examples and source](#leg068-javascript-typescript-oxlint) | No rule-specific options documented.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG015 / prefer-concat-object-assign`   | [Python](#coverage-python-leg068)                                                     | [Examples and source](#leg068-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                        |

<a id="leg068-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#prefer-concat-object-assign)

```diff
 import legibility from "eslint-plugin-legibility";

+const compositionRules = {
+  "legibility/prefer-concat-object-assign": "warn",
+};
+const compositionConfig = { rules: compositionRules };
+
 export default [
   legibility.configs["flat/recommended"],
+  compositionConfig,
 ];
```

```diff
- const nextItems = [...items, ...moreItems];
- const appendedItems = [...items, nextItem];
- const prependedItems = [firstItem, ...items];
- const options = { ...defaults, enabled: true };
+ const nextItems = items.concat(moreItems);
+ const appendedItems = items.concat([nextItem]);
+ const prependedItems = [firstItem].concat(items);
+ const options = Object.assign({}, defaults, { enabled: true });
```

<a id="leg068-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#prefer-concat-object-assign)

```diff
 import { defineConfig } from "oxlint";
 import legibility from "oxlint-plugin-legibility";

+const compositionRules = {
+  "legibility/prefer-concat-object-assign": "warn",
+} as const;
+const rules = Object.assign({}, legibility.configs.recommended.rules, compositionRules);
+
-export default defineConfig(legibility.configs.recommended);
+export default defineConfig({ ...legibility.configs.recommended, rules });
```

```diff
- const nextItems = [...items, ...moreItems];
- const appendedItems = [...items, nextItem];
- const prependedItems = [firstItem, ...items];
- const options = { ...defaults, enabled: true };
+ const nextItems = items.concat(moreItems);
+ const appendedItems = items.concat([nextItem]);
+ const prependedItems = [firstItem].concat(items);
+ const options = Object.assign({}, defaults, { enabled: true });
```

<a id="leg068-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg015-example-diff)

Current selector: `LEG015`.

```diff
- payload = {**base_payload, "id": user_id}
+ payload = base_payload | {"id": user_id}
```

<a id="leg069"></a>

### LEG069 — require-executable-shebang

Require configured CLI entry source files to include a Node, Bun, or Deno shebang. This rule is opt-in because a common source index is not necessarily executable. Enable it only for actual command entry paths.

| Language                | Plugin / current rule                           | Coverage                                                                              | Examples                                                    | Types                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | ESLint: `legibility/require-executable-shebang` | [JavaScript](#coverage-javascript-leg069) / [TypeScript](#coverage-typescript-leg069) | [Examples and source](#leg069-javascript-typescript-eslint) | - `{files: string[]}`: source files expected to be executable entries. - `{runtimes: string[]}`: accepted shebang runtimes. Default: `["bun", "deno", "node"]`.; [Rule interface](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts); [Rule schemas](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/constants.ts) |
| JavaScript / TypeScript | Oxlint: `legibility/require-executable-shebang` | [JavaScript](#coverage-javascript-leg069) / [TypeScript](#coverage-typescript-leg069) | [Examples and source](#leg069-javascript-typescript-oxlint) | - `{files: string[]}`: source files expected to be executable entries. - `{runtimes: string[]}`: accepted shebang runtimes. Default: `["bun", "deno", "node"]`.; [Rule interface](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts); [Rule schemas](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/constants.ts) |
| Python                  | Python: `LEG016 / require-executable-shebang`   | [Python](#coverage-python-leg069)                                                     | [Examples and source](#leg069-python-python)                | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py)                                                                                                                                                                                                                   |
| Shell                   | Shell: `LEG016 / require-executable-shebang`    | [Shell](#coverage-shell-leg069)                                                       | [Examples and source](#leg069-shell-shell)                  | `executable-entry-patterns: string[]`; `executable-runtimes: string[]`; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                                                                                                                                                                                                    |

<a id="leg069-javascript-typescript-eslint"></a>

#### JavaScript / TypeScript — ESLint

[ESLint source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md#require-executable-shebang)

```diff
- console.log("hello");
+#!/usr/bin/env node
+
+ console.log("hello");
```

<a id="leg069-javascript-typescript-oxlint"></a>

#### JavaScript / TypeScript — Oxlint

[Oxlint source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#require-executable-shebang)

```diff
+#!/usr/bin/env node
+
 console.log("hello");
```

<a id="leg069-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg016-example-diff)

Current selector: `LEG016`. Additional entry/path fields exist on Settings; file-config exposure is narrower.

```diff
- # scripts/report.py
- print("ok")
+ #!/usr/bin/env python3
+ print("ok")
```

<a id="leg069-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#require-executable-shebang-diff)

Require configured executable entry files to start with an accepted shell shebang.

```diff
+ #!/usr/bin/env bash
+
  set -u
  main "$@"
```

<a id="leg071"></a>

### LEG071 — no-unnecessary-lambda

Avoid lambdas that only forward their parameters to another callable.

| Language | Plugin / current rule                    | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | ---------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG020 / no-unnecessary-lambda` | [Python](#coverage-python-leg071) | [Examples and source](#leg071-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg071-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg020-example-diff)

Current selector: `LEG020`.

```diff
- users = sorted(users, key=lambda user: normalize(user))
+ users = sorted(users, key=normalize)
```

<a id="leg072"></a>

### LEG072 — prefer-flat-comprehension

Prefer a flat comprehension over map followed by flattening.

| Language | Plugin / current rule                        | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | -------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG021 / prefer-flat-comprehension` | [Python](#coverage-python-leg072) | [Examples and source](#leg072-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg072-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg021-example-diff)

Current selector: `LEG021`.

```diff
- values = list(chain.from_iterable(map(expand, items)))
+ values = [value for item in items for value in expand(item)]
```

<a id="leg073"></a>

### LEG073 — no-redundant-none-fallback

Avoid fallback expressions that only return None unchanged.

| Language | Plugin / current rule                         | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | --------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG023 / no-redundant-none-fallback` | [Python](#coverage-python-leg073) | [Examples and source](#leg073-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg073-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg023-example-diff)

Current selector: `LEG023`.

```diff
- return value if value is not None else None
+ return value
```

<a id="leg074"></a>

### LEG074 — no-identity-comprehension

Avoid comprehensions that keep every item unchanged.

| Language | Plugin / current rule                        | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | -------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG027 / no-identity-comprehension` | [Python](#coverage-python-leg074) | [Examples and source](#leg074-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg074-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg027-example-diff)

Current selector: `LEG027`.

```diff
- copied = [item for item in items]
+ copied = list(items)
```

<a id="leg075"></a>

### LEG075 — prefer-comprehension-over-map-filter

Prefer comprehensions over map/filter calls with lambdas.

| Language | Plugin / current rule                                   | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | ------------------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG028 / prefer-comprehension-over-map-filter` | [Python](#coverage-python-leg075) | [Examples and source](#leg075-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg075-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg028-example-diff)

Current selector: `LEG028`.

```diff
- names = list(map(lambda user: user.name, users))
+ names = [user.name for user in users]
```

<a id="leg076"></a>

### LEG076 — no-loop-append-comprehension

Prefer comprehensions over simple list-building append loops.

| Language | Plugin / current rule                           | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | ----------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG029 / no-loop-append-comprehension` | [Python](#coverage-python-leg076) | [Examples and source](#leg076-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg076-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg029-example-diff)

Current selector: `LEG029`.

```diff
- names = []
- for user in users:
-     names.append(user.name)
+ names = [user.name for user in users]
```

<a id="leg077"></a>

### LEG077 — no-repeated-comprehension-filter

Avoid filtering the same collection with comprehensions multiple times in one scope.

| Language | Plugin / current rule                               | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | --------------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG030 / no-repeated-comprehension-filter` | [Python](#coverage-python-leg077) | [Examples and source](#leg077-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg077-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg030-example-diff)

Current selector: `LEG030`.

```diff
- active_users = [user for user in users if user.active]
- admin_users = [user for user in users if user.is_admin]
+ filtered_users = [user for user in users if user.active or user.is_admin]
+ active_users = [user for user in filtered_users if user.active]
+ admin_users = [user for user in filtered_users if user.is_admin]
```

<a id="leg078"></a>

### LEG078 — prefer-named-exception-context

Prefer named context when wrapping or logging broad exceptions.

| Language | Plugin / current rule                             | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | ------------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG032 / prefer-named-exception-context` | [Python](#coverage-python-leg078) | [Examples and source](#leg078-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg078-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg032-example-diff)

Current selector: `LEG032`.

```diff
- except Exception as error:
-     raise RuntimeError(error)
+ except Exception as error:
+     message = "Failed to load user profile"
+     raise RuntimeError(message) from error
```

<a id="leg079"></a>

### LEG079 — no-boolean-parameter-name-drift

Avoid positive boolean names assigned from inverted expressions.

| Language | Plugin / current rule                              | Coverage                          | Examples                                     | Types                                                                                                                                                       |
| -------- | -------------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | Python: `LEG033 / no-boolean-parameter-name-drift` | [Python](#coverage-python-leg079) | [Examples and source](#leg079-python-python) | No rule-specific file-config option exposed.; [Rule / Settings](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/config.py) |

<a id="leg079-python-python"></a>

#### Python — Python

[Python source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md#leg033-example-diff)

Current selector: `LEG033`.

```diff
- is_ready = status != "ready"
+ is_ready = status == "ready"
```

<a id="leg081"></a>

### LEG081 — prefer-functions

Prefer named functions over top-level script logic.

| Language | Plugin / current rule              | Coverage                        | Examples                                   | Types                                                                                                                         |
| -------- | ---------------------------------- | ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Shell    | Shell: `LEG039 / prefer-functions` | [Shell](#coverage-shell-leg081) | [Examples and source](#leg081-shell-shell) | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go) |

<a id="leg081-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#prefer-functions-diff)

Prefer named functions for script logic and keep top-level code limited to setup and dispatch.

```diff
- docker build --tag "$IMAGE_NAME" .
- docker run --rm "$IMAGE_NAME"
+ main() {
+   docker build --tag "$IMAGE_NAME" .
+   docker run --rm "$IMAGE_NAME"
+ }
+
+ main "$@"
```

<a id="leg082"></a>

### LEG082 — use-defaults-in-functions

Use defaulted or guarded positional args in functions.

| Language | Plugin / current rule                       | Coverage                        | Examples                                   | Types                                                                                                                         |
| -------- | ------------------------------------------- | ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Shell    | Shell: `LEG040 / use-defaults-in-functions` | [Shell](#coverage-shell-leg082) | [Examples and source](#leg082-shell-shell) | No rule-specific options.; [Config](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go) |

<a id="leg082-shell-shell"></a>

#### Shell — Shell

[Shell source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md#use-defaults-in-functions-diff)

Use default or required-argument expansions when binding function positional parameters.

```diff
  deploy() {
-   local target="$1"
+   local target="${1:-staging}"
    upload "$target"
  }
```

## Mapping review

These proposed mappings preserve the agreed Go baseline without claiming identical language semantics:

- Python `no-deep-subscript-chain` maps to Go LEG031 `no-deep-selector-chain`; Shell `prefer-case-over-long-if-chain` maps to Go LEG034 `prefer-switch-over-long-if-chain`.
- Python `no-complex-ternary` maps to LEG054 `no-complex-ternaries`.
- Python LEG034 currently bundles comment matching and a per-function comment limit. The agreed direction is separate LEG039 and LEG061 rules. Python LEG061 is planned with consecutive-line behavior and no marker-based stacking exemptions. The existing per-function count is outside LEG061; retaining that count as another rule has not been requested.
- Node, Python, and Shell direct-entry smoke rules share LEG063 `no-direct-bin-smoke`. Their previous language-specific names remain compatibility aliases. Python comprehension and None-fallback rules retain separate draft entries pending semantic mapping decisions.
- Go LEG041 line comments and JavaScript LEG065 JSDoc block comments express different documentation conventions; they remain separate.
- The top-level index follows the latest requested ID, name, description, language/link layout. The earlier two-column proposal remains in the interview history.

## Native companion checks

Existing host checks do not need duplicate plugin implementations. Shared-rule mappings appear in the existing rule tables above. Additional companion checks retain their native IDs:

| Plugin context  | Native check                                                                                                                                                                                                                                                                                                           | Existing reference                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ESLint / Oxlint | [`complexity` (ESLint)](https://eslint.org/docs/latest/rules/complexity); [`complexity` (Oxlint)](https://oxc.rs/docs/guide/usage/linter/rules/eslint/complexity)                                                                                                                                                      | [Preset settings](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md#configs); [defaults and configuration](#native-complexity-configuration)                                         |
| Clang           | [`readability-function-cognitive-complexity`](https://clang.llvm.org/extra/clang-tidy/checks/readability/function-cognitive-complexity.html); [`readability-isolate-declaration`](https://clang.llvm.org/extra/clang-tidy/checks/readability/isolate-declaration.html); selected bugprone checks and analyzer families | [Explicit configured checks and fixture inventory](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md#configured-checks); [configuration](#clang-companion-configuration) |
| SQLFluff        | [`LT05 / layout.long_lines`](https://docs.sqlfluff.com/en/stable/reference/rules.html#rule-LT05)                                                                                                                                                                                                                       | [Plugin's native line-length guidance](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/README.md#keep-lines-readable); [defaults and configuration](#sqlfluff-line-length-configuration)   |

### Native complexity configuration

**Default:** off; limit 20 when enabled. **Our presets:** warnings at 20, errors in strict mode.

Add `"complexity": ["warn", 20]` to `rules`. This counts decision paths. [ESLint tests](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/tests/unit/plugin/rules.test.ts) and [Oxlint tests](https://github.com/yowainwright/oxlint-plugin-legibility/blob/454c39f11d83fd07678a0068d684058eefe66c4c/tests/unit/plugin/plugin.test.ts) were inspected, not rerun.

### Clang companion configuration

[Our config](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/scripts/.clang-tidy) enables these checks as errors. They are off by default; add their names to `Checks` to enable them.

Cognitive complexity defaults to 25; our config uses 10:

```yaml
CheckOptions:
  readability-function-cognitive-complexity.Threshold: "10"
```

`readability-isolate-declaration` needs no options. [All configured checks and tests](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/.github/RULE_COVERAGE.md#configured-checks).

### SQLFluff line-length configuration

[LT05](https://docs.sqlfluff.com/en/stable/reference/rules.html#rule-LT05) is **on by default at 80 characters**, including comments. [Our setup](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/README.md#quick-start) makes violations warnings:

Merge into `.sqlfluff`, preserving existing dialect and warning settings:

```ini
[sqlfluff]
max_line_length = 80
warnings = Legibility_L001, LT05
```

Include `LT05` in any explicit rule list and remove it from `exclude_rules`. Remove it from `warnings` to report errors. [Defaults](https://docs.sqlfluff.com/en/stable/configuration/default_configuration.html) · [Tests](#native-coverage-verification)

## Source inventory

| Plugin   | Local revision | Rule-definition source                                                                                                                                                                                                 |
| -------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Go       | 05adfb3        | [README](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/README.md); [Source](https://github.com/yowainwright/golangci-lint-legibility/blob/05adfb3/internal/analyzers/analyzers.go)             |
| ESLint   | 7026bf5        | [README](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/README.md); [Source](https://github.com/yowainwright/eslint-plugin-legibility/blob/7026bf5/src/types.ts)                                |
| Oxlint   | 2bcac6a        | [README](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/README.md); [Source](https://github.com/yowainwright/oxlint-plugin-legibility/blob/2bcac6a/src/types.ts)                                |
| Python   | d7f0650        | [README](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/README.md); [Source](https://github.com/yowainwright/ruff-legibility/blob/d7f0650/src/ruff_legibility/rules.py)                                  |
| Shell    | babebd6        | [README](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/README.md); [Source](https://github.com/yowainwright/shellcheck_legibility/blob/babebd6/internal/lint/lint.go)                             |
| SQLFluff | d2d6559        | [README](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/README.md); [Source](https://github.com/yowainwright/sqlfluff-plugin-legibility/blob/d2d6559/src/sqlfluff_plugin_legibility/rules.py) |
| Clang    | c7591ad        | [README](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/README.md); [Source](https://github.com/yowainwright/clang-tidy-legibility/blob/c7591ad/src/LegibilityModule.cpp)                          |

### Native coverage verification

Checked September 29, 2026. Local Clang and Oxlint work includes uncommitted changes.

- **ESLint 9.39.5 / Oxlint 1.82.0:** inspected exported presets. Both passed JavaScript 40/41-line, blank/comment, and IIFE checks. ESLint defaults were also tested.
- **LLVM 23.1.2:** inspected defaults and enabled checks. Linked C11/C++17 fixture pairs passed; documented coverage gaps were reproduced. Proposed nesting 4 and line 19 adjustments passed their boundary pairs.
- **Ruff 0.15.18:** positional/keyword boolean cases and five/six-parameter boundaries passed; both rules were off in clean defaults.
- **SQLFluff 4.2.2:** LT05 accepted 80 characters and reported 81.

Tests used the documented native settings; ESLint also used the full recommended preset. Full suites, TypeScript-specific syntax, Jinja rendering, and unlisted exemptions were not tested. Fixture references remain in each rule section. Recheck configuration and behavior when upgrading linters.
