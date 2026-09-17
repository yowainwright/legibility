---
name: legibility-workflow
description: Route project lint setup and execution through the Legibility CLI.
---

# Legibility workflow

Use this skill when a user asks to try, configure, or run Legibility.

## Route to the CLI

- Run `legibility` for interactive setup. Let the CLI prompt for language confirmation, linter selection, arguments, configuration saving, dry-run approval, and execution.
- Do not reproduce the CLI's detection or selection logic in the agent response.
- If `legibility` is unavailable, show the exact install or build command and request approval before changing the project.
- With an existing configuration, use `legibility --dry-run` before execution when the user has not already approved the run.
- Use `legibility update` for Homebrew-backed linter updates; the CLI honors project update policy and asks by default before changes.
- Preserve the CLI's exit code and native diagnostics. The configured tools determine pass or fail.

## Boundaries

- Do not manually implement a second Legibility workflow in the skill.
- Do not install dependencies, write configuration, build, or execute linters outside the CLI's prompted flow without explicit approval.
- Do not run `brew update` or `brew upgrade` directly from the skill; the CLI owns the prompted update flow.
- If the user asks to change the workflow, update the CLI first and keep this skill as a thin router.
