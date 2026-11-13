#!/bin/sh
set -eu

source_root=${1:-$HOME/legibility-input}
workspace="$HOME/legibility-source"
scenarios="$HOME/legibility-scenarios"
local_bin="$HOME/.local/bin"
python_env="$HOME/.local/share/legibility-python"

main() {
	assert_guest
	assert_source
	assert_new_workspace
	install_build_tools
	install_agent
	build_cli
	install_native_linters
	copy_scenarios
	install_project_tools
	configure_profile
	legibility --version
	printf 'Prepared scenarios: %s\n' "$scenarios"
}

assert_guest() {
	vm_model=$(sysctl -n hw.model)
	case "$vm_model" in
	VirtualMac*) return ;;
	esac
	printf 'Provisioning requires a macOS virtual machine; refusing to modify this host.\n' >&2
	exit 2
}

assert_source() {
	if [ -f "$source_root/package.json" ]; then
		return
	fi
	printf 'Missing source checkout: %s\n' "$source_root" >&2
	exit 2
}

assert_new_workspace() {
	for directory in "$workspace" "$scenarios"; do
		if [ -e "$directory" ]; then
			printf 'Workspace exists: %s. Provision a clean VM clone instead.\n' "$directory" >&2
			exit 2
		fi
	done
}

install_build_tools() {
	export PATH="/opt/homebrew/opt/node@26/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$local_bin:$PATH"
	export HOMEBREW_NO_AUTO_UPDATE=1
	brew install node@26 go rust python@3.12
}

install_agent() {
	npm install --global @openai/codex@0.167.2
	codex --version
}

build_cli() {
	mkdir -p "$workspace" "$scenarios" "$local_bin"
	for input in src scripts docs tests package.json pnpm-lock.yaml pnpm-workspace.yaml; do
		cp -R "$source_root/$input" "$workspace/"
	done
	cd "$workspace"
	npx --yes pnpm@12.5.1 install --frozen-lockfile --ignore-scripts
	npx --yes pnpm@12.5.1 rebuild scriptc
	PATH="$workspace/node_modules/.bin:$PATH" node --experimental-strip-types scripts/build/index.ts
	cp bin/native/legibility "$local_bin/legibility"
}

install_native_linters() {
	GOBIN="$local_bin" go install github.com/yowainwright/go-lint-legibility/cmd/go-lint-legibility@v0.4.1
	python3.12 -m venv "$python_env"
	"$python_env/bin/pip" install ruff==0.17.4 ruff-legibility==0.4.0
	ln -s "$python_env/bin/ruff" "$local_bin/ruff"
	ln -s "$python_env/bin/ruff-legibility" "$local_bin/ruff-legibility"
}

copy_scenarios() {
	for language in typescript go python; do
		cp -R "$source_root/tests/e2e/fixtures/$language" "$scenarios/$language"
		git -C "$scenarios/$language" init --quiet
	done
	for scenario in fresh missing-tools; do
		cp -R "$source_root/tests/e2e/fixtures/typescript" "$scenarios/$scenario"
		mv "$scenarios/$scenario/legibility.json" "$scenarios/$scenario/legibility.saved.json"
		git -C "$scenarios/$scenario" init --quiet
	done
}

install_project_tools() {
	cd "$scenarios/typescript"
	npm install --ignore-scripts --no-audit --no-fund
	cd "$scenarios/fresh"
	npm install --ignore-scripts --no-audit --no-fund
	cp -R "$scenarios/typescript" "$scenarios/clean"
	printf 'export const canPublish = true;\n' >"$scenarios/clean/src/index.ts"
}

configure_profile() {
	profile_line="export PATH=\"/opt/homebrew/opt/node@26/bin:/opt/homebrew/bin:/opt/homebrew/sbin:\$HOME/.local/bin:\$PATH\""
	if grep -Fqx "$profile_line" "$HOME/.zprofile" 2>/dev/null; then
		return
	fi
	printf '\n%s\n' "$profile_line" >>"$HOME/.zprofile"
}

main "$@"
