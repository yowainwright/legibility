# Documentation

- [Shared rules](rules.md) — rule IDs, language coverage, examples, and configuration.
- [E2E sandboxes](../tests/e2e/README.md) — try the CLI and verify hooks in macOS or Linux.

## Codex hooks

Enable hooks in `legibility.json`:

```json
{
  "hooks": { "enabled": true },
  "linters": {
    "oxlint-plugin-legibility": {
      "args": ["src"],
      "rules": {
        "LEG002": {
          "hooks": { "PostToolUse": { "blocking": true } }
        }
      }
    },
    "go-lint-legibility": {
      "args": ["./..."],
      "hooks": { "PostToolUse": { "enabled": false } }
    }
  }
}
```

The default is feedback after edits and blocking at completion. Here, `LEG002`
also blocks after edits; Go waits until completion.

Settings inherit project → linter → rule. Each explicit `enabled` or `blocking`
value overrides its parent, including `false`. Within each level, an event setting
overrides the general setting. Without project hook settings, hooks are disabled
unless a linter or rule explicitly enables them. A linter's ordinary
`enabled: false` disables it entirely.

Rule overrides currently support Oxlint's shared `LEG` IDs. They control feedback
from native rules already enabled in the project's Oxlint configuration; they do
not enable native rules or change their options. Other linters support whole-linter
hook settings and reject rule overrides explicitly. Normal `legibility` runs keep
their existing behavior.

Register the handler in the project's `.codex/hooks.json`, merging with existing
hooks:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "^apply_patch$|Edit|Write",
        "hooks": [{ "type": "command", "command": "legibility hook" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "legibility hook" }]
      }
    ]
  }
}
```

Use a `legibility` executable available on Codex's `PATH`. Review and trust the
hooks through Codex's `/hooks` flow or the app's hook settings. The edit matcher
covers patch tools; shell-based edits are checked at completion. See the
[Codex hook protocol](https://learn.chatgpt.com/docs/hooks).

`legibility hook` reads Codex JSON from stdin and uses its `cwd` to discover
configuration. Relative `--config` paths resolve from that directory. It emits
JSON feedback; clean or disabled runs return `{}`. Blocking is conveyed through
the JSON decision, so a native linter failure does not become the handler's exit
status. Each linter has a 60-second limit and a 256 KiB output limit. Invalid
input or configuration produces a blocking error. A repeated `Stop` still checks
unresolved failures.

The handler is covered by payload replay tests, including real Oxlint findings.
A live Codex session with reviewed hooks remains a separate verification step.

## Windows reproduction sandbox

Find Windows failures using Microsoft's [Windows Sandbox](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/)
and the existing npm CLI. It builds current local source, including uncommitted
edits, inside the guest. Windows compatibility, the native `.exe` build, and
Codex hooks are not verified by this environment yet.

Use Windows 11 23H2 or newer with Windows Sandbox enabled on a supported edition
(Pro, Enterprise, or Education). Windows Home is unsupported. See
[Microsoft's installation instructions](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-install).
This environment requires a Windows host. Tart provides native macOS testing;
Docker provides Linux testing.

From a checkout of this repository, run these commands in PowerShell:

```powershell
$env:LEGIBILITY_SOURCE = (Get-Location).Path
$env:LEGIBILITY_REPORTS = Join-Path $env:LOCALAPPDATA 'Legibility\reports'
New-Item -ItemType Directory -Force $env:LEGIBILITY_REPORTS | Out-Null
WindowsSandbox.exe .\tests\e2e\index.wsb
```

The [`.wsb` configuration](../tests/e2e/index.wsb) mounts the checkout read-only
and the reports folder writable. Its [startup script](../tests/e2e/index.ps1)
downloads [checksum-pinned Node 26.13.0](https://nodejs.org/dist/v26.13.0/SHASUMS256.txt), installs locked dependencies with lifecycle
scripts disabled, builds the JavaScript CLI, and installs its npm launcher inside
the sandbox. Initial provisioning needs internet access. Host Node installations
and `node_modules` are not reused.

The PowerShell window stays open even if provisioning fails. Its transcript
includes setup errors, Windows/PowerShell/Node versions, and hashes of the lockfile
and built CLI. Reports persist in `$env:LEGIBILITY_REPORTS` on the host.

### Try the CLI

Inside the sandbox:

```powershell
legibility --help
node $env:LEGIBILITY_CLI --help
legibility
```

The first command exercises npm's Windows launcher. The second invokes the same
CLI directly through Node, so a launcher failure does not prevent investigation.
The third starts guided setup in the `fresh` project.

For an already-configured project with a deliberate `no-debugger` violation:

```powershell
Set-Location C:\legibility-work\configured
oxlint.cmd -c .oxlintrc.json index.js
$LASTEXITCODE
legibility --dry-run
legibility
$LASTEXITCODE
```

Compare the direct Oxlint result with the Legibility run. Executable discovery
and `.cmd` invocation are known Windows compatibility risks; retain failures as
reproduction evidence. To try clean code, repeat from `C:\legibility-work\clean`.

For setup without linters on `PATH`, use a fresh sandbox session and run:

```powershell
$env:Path = $env:LEGIBILITY_BASE_PATH
Set-Location C:\legibility-work\fresh
legibility
```

This hides the prepared project linters; it does not test installing Windows
linters. Restore them with:

```powershell
$env:Path = "C:\legibility-work\node_modules\.bin;$env:LEGIBILITY_BASE_PATH"
```

### Report a failure

Run `Stop-Transcript` before sharing the saved transcript. Include the source
commit and whether it has local edits, the scenario, command, exit status,
expected behavior, and observed behavior. A screenshot helps with prompt or
rendering failures; a transcript is not a complete terminal recording.

Closing Windows Sandbox discards the guest, including edits and installed tools.
Reports survive. Relaunch it to reset all scenarios; provisioning runs again.
This Windows proof does not yet provide the persistent state or five-second
warm re-entry planned for the main sandbox.
