#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$PROJECT_ROOT"
HOOKS_DIR=${HOOKS_DIR:-$(git -C "$PROJECT_ROOT" rev-parse --git-path hooks 2>/dev/null || true)}

log() {
  printf '%s\n' "$1"
}

skip_existing() {
  path="$1"
  label="$2"

  if [ -f "$path" ]; then
    log "$label already exists, skipping..."
    return 0
  fi

  if [ -L "$path" ]; then
    log "$label symlink does not point to a file, replacing..."
    rm "$path"
  fi

  return 1
}

ensure_git_repo() {
  if [ -n "$HOOKS_DIR" ]; then
    return
  fi

  log "Skipping setup outside a git repository"
  exit 0
}

install_pre_commit_hook() {
  path="$HOOKS_DIR/pre-commit"
  skip_existing "$path" "pre-commit hook" && return

  cat >"$path" <<'EOF'
#!/bin/sh

set -eu

pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test
EOF
  chmod +x "$path"
  log "Installed pre-commit hook"
}

install_commit_msg_hook() {
  path="$HOOKS_DIR/commit-msg"
  skip_existing "$path" "commit-msg hook" && return

  cat >"$path" <<'EOF'
#!/bin/sh

set -eu

commit_msg=$(head -n 1 "$1")
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,}"

if ! printf '%s\n' "$commit_msg" | grep -Eq "$pattern"; then
  printf '%s\n' "Error: commit message does not follow Conventional Commits format" >&2
  printf '%s\n' "Expected: <type>[optional scope]: <description>" >&2
  exit 1
fi

if [ "${#commit_msg}" -gt 120 ]; then
  printf '%s\n' "Error: commit message header exceeds 120 characters" >&2
  exit 1
fi
EOF
  chmod +x "$path"
  log "Installed commit-msg hook"
}

install_post_merge_hook() {
  path="$HOOKS_DIR/post-merge"
  skip_existing "$path" "post-merge hook" && return

  cat >"$path" <<'EOF'
#!/bin/sh

set -eu

changed_files=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)
dependencies_changed=false

for dependency_file in pnpm-lock.yaml package.json; do
  if printf '%s\n' "$changed_files" | grep -Fqx "$dependency_file"; then
    dependencies_changed=true
    break
  fi
done

if [ "$dependencies_changed" = true ]; then
  pnpm install
fi
EOF
  chmod +x "$path"
  log "Installed post-merge hook"
}

install_git_hooks() {
  mkdir -p "$HOOKS_DIR"
  install_pre_commit_hook
  install_commit_msg_hook
  install_post_merge_hook
}

main() {
  if [ "${CI:-}" = "true" ] || [ "${CI:-}" = "1" ]; then
    log "CI environment detected, skipping git hook installation"
    return
  fi

  ensure_git_repo
  log "Setting up git hooks..."
  install_git_hooks
  log "Setup complete!"
}

main "$@"
