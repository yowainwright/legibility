# Agent Rules

This tool combines existing Legibility tools so projects can configure and run them quickly, deterministically, and with little overhead. There should be no custom code unless existing tools and patterns cannot meet the need and the evidence is recorded.

- Check whether files and directories already exist before creating them.
- Do not stage, commit, push, deploy, or publish unless explicitly asked.
- Keep architecture notes in `tmp/*.md` aligned before commit-ready work.
- No snowflakes. Copy established patterns before inventing anything.

## Grill Me

Use `grill-me` to build shared understanding, one decision at a time.

Every agent starts by answering:

1. Does this need to be built?
2. How can we enable this without building anything?

First inspect existing tools, code, configuration, and documented workflows. Prefer doing nothing. Ask what we can copy or achieve with existing capabilities. New work without evidence that those options fail is wrong.

- Before work, state what I understand, the evidence, one decision, and one uncertainty.
- During work, label assumptions, ask one focused question at a time, and wait for the answer.
- Answer repository questions by inspecting the repository first.
- Work in small, agreed iterations. After each iteration, state what changed, what was learned, and what remains unclear before continuing.
- Prefer a small proof or measurement to speculative implementation.

## Communication Style

- Teach before acting with concise, cited evidence.
- Explain the exact source, file, tool, API, or pattern before editing.
- Do not execute ahead of the user's understanding or outside the agreed scope.
- State uncertainty plainly. Be terse. Avoid preambles, repetition, and obvious next steps.
- If the default path is unclear, ask one precise question instead of listing options.
- If the user pushes back, use a short grill of no more than two focused questions.

## Core Defaults

- Read relevant code, configuration, issues, pull requests, and history before proposing changes. Verify cited sources.
- Use established tools, documented APIs, and project patterns. Treat new work as a failure until evidence justifies it.
- Reuse a standard directory before introducing one. Discuss a nonstandard directory with `grill-me` and wait for agreement before creating it.
- Within an approved directory, use only the generic filenames it needs: `index.ts`, `utils.ts`, `types.ts`, and `constants.ts`. Do not create unused companion files or descriptive filename schemes.
- Keep policy understandable and make tools enforce pass/fail. Agents cannot waive violations or weaken policy to make a change pass.
- Keep linters fast and independent. Skills and hooks use underlying tools directly wherever possible. Configuration work stays separate from routine lint execution.
- Utilities should use Effect. If there is an exception, invoke a 2-question grill to understand it.
- Prefer oxlint with eslint-plugin-legibility in strict mode.
- Thoughtful work is better than fast work. Slow is smooth; smooth is fast.

## Stop Conditions

- Before editing, name the exact default tool, API, component, or pattern being used.
- If you cannot name it, do not edit. Ask: "I'm at `<file/component>`, implementing `<specific behavior>`. Which `<specific default API/component/pattern>` should I use?"
- Ask one buffer question only after the default path is exhausted.
- Do not invent wrappers, one-off controls, bespoke CSS, or new architecture.
