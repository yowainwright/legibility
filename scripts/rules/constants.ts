export const SOURCE_FILE = "docs/rules.md";
export const OUTPUT_FILE = "src/rules/index.json";
export const SEARCH_OUTPUT_FILE = "src/rules/search.json";
export const FORMAT_VERSION = 1;
export const RULE_ID_PATTERN = /LEG\d{3}/g;
export const HTML_ANCHOR_PATTERN = /<a\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi;
export const SEARCHABLE_BLOCK_TYPES = new Set([
  "heading",
  "tableRow",
  "paragraph",
  "listItem",
  "code",
]);
export const TOPIC_TAGS = [
  "control-flow",
  "expressions",
  "functions",
  "collections",
  "naming",
  "comments",
  "files",
  "side-effects",
  "error-handling",
  "testing",
  "script-structure",
  "complexity",
] as const;
