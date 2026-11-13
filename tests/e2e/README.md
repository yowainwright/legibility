# E2E sandboxes

The fixtures here are used by the real-linter E2Es and manual sandboxes. Automated
checks restore the scenario files after each test. The VM and containers remain
available for manual use. The separate native prompt E2Es use fake linters to
check terminal interactions.

## Try the CLI on macOS

Enter the prepared VM, then try the configured project:

```sh
tart exec -it legibility-macos /bin/zsh -l
cd ~/legibility-scenarios/typescript
legibility --help
legibility --dry-run
legibility
legibility --styleguide
```

The deliberate `LEG002` mistake makes linting fail. Edit `src/index.ts` and run
again to try the fix. For guided setup, use `~/legibility-scenarios/fresh`.

Run the shared automated proof inside the VM:

```sh
LEGIBILITY_SANDBOX_PROJECT="$HOME/legibility-scenarios/typescript" node --test "$HOME/legibility-source/tests/e2e/index.ts"
```

This checks the native CLI against real Oxlint, help, preview, default hook
feedback, blocking completion, linter/rule overrides, disabled feedback, and
clean code. It refuses projects without the sandbox fixture's package name and
restores the three files it edits, even when an assertion fails. Use a separate
session for verification while no editor or agent is changing those files.

For hook policy experiments, edit `legibility.json` and send a payload yourself:

```sh
printf '{"cwd":"%s","hook_event_name":"PostToolUse"}\n' "$PWD" | legibility hook
printf '{"cwd":"%s","hook_event_name":"Stop"}\n' "$PWD" | legibility hook
```

The fixture includes `.codex/hooks.json`. The prepared macOS guest has Codex
0.167.2 installed, without an account signed in. Run `codex` in the scenario to
sign in and review its hooks. Live agent behavior still needs that manual check;
the automated proof checks payload handling.

## Linux with Docker

Compose builds the native CLI from current local source with the existing build
script and frozen pnpm lockfile. Host dependencies and generated binaries are
excluded. The `legibility-sandbox` project leaves earlier prototype containers
untouched. Independent containers use Docker's existing bridge network; they do
not allocate another Compose network.

From the repository root:

```sh
docker compose -f tests/e2e/compose.yaml build
docker compose -f tests/e2e/compose.yaml up -d typescript
docker compose -f tests/e2e/compose.yaml exec typescript bash
```

Use `go` or `python` instead of `typescript` to enter the other environments.
Each project starts with a saved `legibility.json` and a deliberate lint finding:

```sh
legibility --dry-run
legibility
```

Run the same shared proof from the host:

```sh
docker compose -f tests/e2e/compose.yaml exec -e LEGIBILITY_SANDBOX_PROJECT=/workspace typescript node --test /proof/tests/e2e/index.ts
```

The container stays running afterward. Enter it again to try changes manually.

For first-time setup, move the config inside the guest, then run the CLI:

```sh
mv legibility.json legibility.saved.json
legibility
```

The real linters are `oxlint`, `go-lint-legibility`, and the separate
`ruff-legibility` command. Python also includes ordinary Ruff. Python's build
verifies that the separate checker is present.

Re-enter a running environment with `exec`. Stop it without discarding edits:

```sh
docker compose -f tests/e2e/compose.yaml stop typescript
```

Resume it with `start typescript`, then `exec typescript bash`. To explicitly
reset a stopped TypeScript environment and discard its edits:

```sh
docker compose -f tests/e2e/compose.yaml rm typescript
docker compose -f tests/e2e/compose.yaml up -d typescript
```

Rebuilding an image does not update an existing container. Recreate that
container explicitly when testing a new CLI build; recreation discards edits.
No project directories are mounted from the host.

## Verification

The shared TypeScript E2E uses real Oxlint and the native CLI. Go and Python are
manual real-linter scenarios; the shared hook E2E does not cover them. The earlier
prototype verified direct/wrapped findings and clean runs in all three languages.
Versions outside the CLI lockfile, including some base images and ordinary Ruff,
are not all pinned. Linux x64 and native Windows remain unverified. Windows uses
the separate [reproduction sandbox](../../docs/README.md#windows-reproduction-sandbox).

## macOS with Tart

The prepared `legibility-macos` VM runs macOS 26.6.2 on Apple Silicon. Enter it:

```sh
tart exec -it legibility-macos /bin/zsh -l
```

Inside the VM, projects live in `~/legibility-scenarios`:

| Directory       | Starting point                                                           |
| --------------- | ------------------------------------------------------------------------ |
| `fresh`         | TypeScript tools installed, no Legibility configuration.                 |
| `typescript`    | Configured TypeScript project with a deliberate finding.                 |
| `go`            | Configured Go project with a deliberate finding.                         |
| `python`        | Configured Python project with a deliberate finding.                     |
| `clean`         | Configured TypeScript project with clean code.                           |
| `missing-tools` | TypeScript project without Oxlint installed or Legibility configuration. |

For example, run `cd ~/legibility-scenarios/fresh` followed by `legibility`.
The VM has its own tools, source snapshot, configuration, and profile. It has no
shared host folders. The host checkout and installed host linters are not used
by guest commands.

### Start and preserve state

If stopped, run this in one terminal and leave it running:

```sh
tart run --no-graphics --suspendable legibility-macos
```

Use `tart exec -it` from another terminal to enter it. Exiting that shell keeps
the VM and its files. `tart stop legibility-macos` stops the VM and preserves
its disk. Warm entry into the running VM measured 0.18 seconds in one sample;
that measurement excludes installation and boot time.

### Explicit reset

`legibility-macos-base` is the untouched publisher image.
`legibility-macos-e2e-ready` is the updated baseline, with tools, shared E2Es, and
Codex installed without sign-in. The earlier baseline is retained. To discard working
VM edits and restore the updated baseline:

```sh
tart stop legibility-macos
tart clone legibility-macos-e2e-ready legibility-macos --overwrite
tart run --no-graphics --suspendable legibility-macos
```

### Provision another clean VM

Install Tart using the [current upstream instructions](https://github.com/openai/tart#usage):
`brew install openai/tools/tart`. Homebrew may require trust for the specific
`openai/tools/tart` and `openai/tools/softnet` formulae. The older
`cirruslabs/cli/tart` installation command no longer worked in this session.

Clone the pinned publisher image into a new name, then boot it:

```sh
tart clone ghcr.io/cirruslabs/macos-tahoe-base@sha256:65c3133a633fda8753cf1f71f2d55727792d534a2125b0032466563dcc8e58fd legibility-macos-new
tart run --no-graphics --suspendable legibility-macos-new
```

From the repository root in another terminal, transfer current local source and
run the [guest-only bootstrap](index.sh):

```sh
mkdir -p artifacts
COPYFILE_DISABLE=1 tar --no-xattrs -czf artifacts/index.tar.gz src scripts docs package.json pnpm-lock.yaml pnpm-workspace.yaml tests/e2e
tart exec legibility-macos-new /bin/mkdir -p /Users/admin/legibility-input
tart exec -i legibility-macos-new /usr/bin/tar -xzf - -C /Users/admin/legibility-input < artifacts/index.tar.gz
tart exec legibility-macos-new /bin/sh /Users/admin/legibility-input/tests/e2e/index.sh
```

The bootstrap builds the native CLI using the existing build script and frozen
pnpm lockfile, then installs real language linters. It refuses physical Macs and
existing scenario workspaces. It does not copy host `node_modules`, credentials,
or generated binaries. Initial provisioning needs internet access; this is a
source snapshot, not live synchronization with later host edits.

For a terminal transcript, enter with:

```sh
tart exec -it legibility-macos /usr/bin/script -q /Users/admin/legibility-session.log /bin/zsh -l
```

Exit that recorded shell, then retrieve the log:

```sh
tart exec legibility-macos /bin/cat /Users/admin/legibility-session.log > tests/e2e/macos-session.log
```
