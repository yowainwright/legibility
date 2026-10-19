import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test, { type TestContext } from "node:test";
import { diagnose, setGitOutputReader } from "../../src/lib/diagnose/index.ts";

const expectedScriptTools = [
  {
    id: "oxlint",
    evidence: [
      { kind: "config", count: 1, paths: [".oxlintrc.json"] },
      { kind: "invocation", count: 1, paths: ["package.json"] },
    ],
  },
  {
    id: "oxlint-plugin-legibility",
    evidence: [{ kind: "dependency", count: 1, paths: ["package.json"] }],
  },
  {
    id: "ruff-legibility",
    evidence: [{ kind: "invocation", count: 1, paths: ["package.json"] }],
  },
];

const expectedPythonAndGoTools = [
  { id: "go-lint-legibility", evidence: [{ kind: "dependency", count: 1, paths: ["go.mod"] }] },
  { id: "ruff", evidence: [{ kind: "config", count: 1, paths: ["pyproject.toml"] }] },
  {
    id: "ruff-legibility",
    evidence: [{ kind: "config", count: 1, paths: [".ruff-legibility.toml"] }],
  },
];

const repeatedToolManifest = JSON.stringify({
  dependencies: { oxlint: "1" },
  devDependencies: { oxlint: "1" },
  optionalDependencies: { oxlint: "1" },
  peerDependencies: { oxlint: "1" },
  scripts: { lint: "oxlint .", fix: "oxlint --fix ." },
});

test("diagnoses non-Git projects with nested ignore rules", async (t) => {
  const root = createFixture(t);
  writeFiles(root, {
    ".gitignore": "*.ts\nignored/\n",
    "src/.gitignore": "!keep.ts\n",
    "src/keep.ts": "export {};",
    "src/drop.ts": "export {};",
    "main.py": "print(1)",
    "ignored/app.go": "package ignored",
    "node_modules/app.js": "export {};",
  });
  const result = await diagnose(root);
  assert.deepEqual(result.languages, [
    { id: "python", label: "Python", count: 1, files: ["main.py"] },
    { id: "typescript", label: "TypeScript", count: 1, files: ["src/keep.ts"] },
  ]);
});

test("keeps language counts and bounded samples deterministic", async (t) => {
  const root = createFixture(t);
  writeFiles(root, {
    "z.ts": "",
    "b.ts": "",
    "a.ts": "",
    "m.ts": "",
    "c.ts": "",
    "app.js": "",
  });
  const first = await diagnose(root);
  const second = await diagnose(root);
  assert.deepEqual(first, second);
  assert.deepEqual(first.languages, [
    { id: "javascript", label: "JavaScript", count: 1, files: ["app.js"] },
    { id: "typescript", label: "TypeScript", count: 5, files: ["a.ts", "b.ts", "c.ts"] },
  ]);
});

test("uses Git ignores while retaining tracked files and excluding deleted files", async (t) => {
  const root = createFixture(t, true);
  writeFiles(root, { "src/tracked.ts": "", "src/deleted.ts": "" });
  git(root, "add", "src/tracked.ts", "src/deleted.ts");
  writeFiles(root, {
    ".gitignore": "ignored/\nsrc/tracked.ts\n",
    ".git/info/exclude": "local/\n",
    "src/é漢🙂.ts": "",
    "src/with space.py": "",
    "ignored/app.go": "",
    "local/app.go": "",
  });
  rmSync(join(root, "src/deleted.ts"));
  const result = await diagnose(root);
  assert.deepEqual(result.languages, [
    { id: "python", label: "Python", count: 1, files: ["src/with space.py"] },
    { id: "typescript", label: "TypeScript", count: 2, files: ["src/tracked.ts", "src/é漢🙂.ts"] },
  ]);
});

test("preserves conflicting package-manager signals", async (t) => {
  const root = createFixture(t);
  writeFiles(root, {
    "package.json": JSON.stringify({ packageManager: "pnpm@12.5.1" }),
    "pnpm-lock.yaml": "",
    "package-lock.json": "",
  });
  const result = await diagnose(root);
  assert.deepEqual(result.packageManagers, [
    { id: "npm", evidence: [{ kind: "lockfile", count: 1, paths: ["package-lock.json"] }] },
    {
      id: "pnpm",
      evidence: [
        { kind: "declaration", count: 1, paths: ["package.json"] },
        { kind: "lockfile", count: 1, paths: ["pnpm-lock.yaml"] },
      ],
    },
  ]);
});

test("distinguishes tool configuration, dependencies, and script invocations", async (t) => {
  const root = createFixture(t);
  const manifest = {
    devDependencies: { "oxlint-plugin-legibility": "0.0.5" },
    scripts: { lint: "oxlint . && ruff-legibility check ." },
  };
  writeFiles(root, { "package.json": JSON.stringify(manifest), ".oxlintrc.json": "{}" });
  const result = await diagnose(root);
  assert.deepEqual(result.tools, expectedScriptTools);
});

test("identifies Python and Go policy without conflating Ruff with ruff-legibility", async (t) => {
  const root = createFixture(t);
  writeFiles(root, {
    "pyproject.toml": "[tool.ruff]\n[tool.uv]\n",
    ".ruff-legibility.toml": 'select = ["LEG"]\n',
    "go.mod":
      "module example.com/demo\nrequire github.com/yowainwright/go-lint-legibility v0.4.1\n",
  });
  const result = await diagnose(root);
  assert.deepEqual(
    result.packageManagers.map(({ id }) => id),
    ["go", "uv"],
  );
  assert.deepEqual(result.tools, expectedPythonAndGoTools);
});

test("bounds evidence samples while counting all matching manifests", async (t) => {
  const root = createFixture(t);
  const manifest = JSON.stringify({ dependencies: { oxlint: "1.82.0" } });
  writeFiles(root, {
    "z/package.json": manifest,
    "a/package.json": manifest,
    "b/package.json": manifest,
  });
  const result = await diagnose(root);
  assert.deepEqual(result.tools, [
    {
      id: "oxlint",
      evidence: [{ kind: "dependency", count: 3, paths: ["a/package.json", "b/package.json"] }],
    },
  ]);
});

test("continues scanning after a malformed package.json", async (t) => {
  const root = createFixture(t);
  writeFiles(root, { "package.json": "{", "index.ts": "export {};" });
  const result = await diagnose(root);
  assert.deepEqual(result.languages, [
    { id: "typescript", label: "TypeScript", count: 1, files: ["index.ts"] },
  ]);
  assert.deepEqual(result.packageManagers, []);
  assert.deepEqual(result.tools, []);
});

test("decodes NUL-delimited Git paths across UTF-8 chunk boundaries", async (t) => {
  const root = createFixture(t, true);
  setGitOutputReader(async (_root, args, consume) => {
    if (args.includes("--deleted")) return 0;
    const bytes = Buffer.from("src/é漢🙂.ts\0src/line\nbreak.py\0node_modules/ignored.go\0");
    for (let offset = 0; offset < bytes.length; offset += 1) {
      await consume(bytes.subarray(offset, offset + 1));
    }
    return 0;
  });
  const result = await diagnose(root);
  assert.deepEqual(result.languages, [
    { id: "python", label: "Python", count: 1, files: ["src/line\nbreak.py"] },
    { id: "typescript", label: "TypeScript", count: 1, files: ["src/é漢🙂.ts"] },
  ]);
});

test("reports Git inventory failures instead of returning an empty diagnosis", async (t) => {
  const root = createFixture(t, true);
  setGitOutputReader(() => Promise.resolve(128));
  await assert.rejects(diagnose(root), /Git inventory exited with code 128/);
});

test("falls back to directory inspection when Git is not installed", async (t) => {
  const root = createFixture(t, true);
  writeFiles(root, { ".gitignore": "ignored/\n", "index.ts": "", "ignored/app.py": "" });
  const originalEnvironment = Object.assign({}, process.env);
  t.after(() => {
    process.env = originalEnvironment;
  });
  process.env.PATH = join(root, "missing-bin");
  const result = await diagnose(root);
  assert.deepEqual(result.languages, [
    { id: "typescript", label: "TypeScript", count: 1, files: ["index.ts"] },
  ]);
});

test("falls back when the native Git reader reports command-not-found", async (t) => {
  const root = createFixture(t, true);
  writeFiles(root, { "index.ts": "" });
  setGitOutputReader(() => Promise.resolve(127));
  const result = await diagnose(root);
  assert.equal(result.languages[0]?.count, 1);
});

test("counts a conflicted path once", async (t) => {
  const root = createFixture(t, true);
  writeFiles(root, { "index.ts": "", "package.json": '{"dependencies":{"oxlint":"1"}}' });
  writeConflictedIndex(root, ["index.ts", "package.json"]);
  const result = await diagnose(root);
  assert.equal(result.languages[0]?.count, 1);
  assert.deepEqual(result.tools, [
    { id: "oxlint", evidence: [{ kind: "dependency", count: 1, paths: ["package.json"] }] },
  ]);
});

test("counts repeated tool matches once per manifest and evidence kind", async (t) => {
  const root = createFixture(t);
  writeFiles(root, {
    "a/package.json": repeatedToolManifest,
    "b/package.json": repeatedToolManifest,
  });
  const result = await diagnose(root);
  assert.deepEqual(result.tools, [
    {
      id: "oxlint",
      evidence: [
        { kind: "dependency", count: 2, paths: ["a/package.json", "b/package.json"] },
        { kind: "invocation", count: 2, paths: ["a/package.json", "b/package.json"] },
      ],
    },
  ]);
});

test("counts repeated Go module references once per file", async (t) => {
  const root = createFixture(t);
  writeFiles(root, {
    "go.mod":
      "require github.com/yowainwright/go-lint-legibility v0.4.1\nreplace github.com/yowainwright/go-lint-legibility => ../local\n",
  });
  const result = await diagnose(root);
  assert.deepEqual(result.tools, [
    { id: "go-lint-legibility", evidence: [{ kind: "dependency", count: 1, paths: ["go.mod"] }] },
  ]);
});

test("propagates Git reader errors", async (t) => {
  const root = createFixture(t, true);
  setGitOutputReader(() => Promise.reject(new Error("Git reader unavailable")));
  await assert.rejects(diagnose(root), /Git reader unavailable/);
});

const createFixture = (t: TestContext, withGit = false): string => {
  const root = mkdtempSync(join(tmpdir(), "legibility-diagnose-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => setGitOutputReader(undefined));
  if (withGit) git(root, "init", "--quiet");
  return root;
};

const git = (root: string, ...args: string[]): void => {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
};

const writeConflictedIndex = (root: string, paths: string[]): void => {
  const options = { cwd: root, input: "", encoding: "utf8" as const };
  const blob = spawnSync("git", ["hash-object", "-w", "--stdin"], options);
  assert.equal(blob.status, 0, blob.stderr);
  const hash = blob.stdout.trim();
  const entries = paths
    .flatMap((path) => [
      `100644 ${hash} 1\t${path}\n`,
      `100644 ${hash} 2\t${path}\n`,
      `100644 ${hash} 3\t${path}\n`,
    ])
    .join("");
  const input = Object.assign({}, options, { input: entries });
  const index = spawnSync("git", ["update-index", "--index-info"], input);
  assert.equal(index.status, 0, index.stderr);
};

const writeFiles = (root: string, files: Record<string, string>): void => {
  Object.entries(files).forEach(([path, contents]) => {
    const absolutePath = join(root, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
  });
};
