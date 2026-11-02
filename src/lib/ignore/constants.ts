export const POSIX_CLASSES: Readonly<Record<string, string>> = {
  alnum: "0-9A-Za-z",
  alpha: "A-Za-z",
  blank: " \\t",
  cntrl: "\\x00-\\x1f\\x7f",
  digit: "0-9",
  graph: "!-.0-~",
  lower: "a-z",
  print: " -.0-~",
  punct: "!-.:-@\\[-\u0060{-~",
  space: " \\t\\n\\r",
  upper: "A-Z",
  xdigit: "0-9A-Fa-f",
};

export const PLACEHOLDER = "\u0000";
export const TRAILING_WILDCARD = "\uE000";
export const TRAILING_DOUBLESTAR = "\uE001";
export const RESERVED_CHARACTERS = new Set([PLACEHOLDER, TRAILING_WILDCARD, TRAILING_DOUBLESTAR]);
export const DEFERRED_ESCAPES = new Set(["*", "[", " "]);
export const CLASS_MEMBERS_TO_ESCAPE = new Set(["\\", "]", "^", "-", "["]);
export const REGEX_LITERAL_SPECIAL = /[.*+?()[\]{}^$|\\/]/;
export const INVALID_TRAILING_ESCAPE = /(?:[^\\]|^)\\$/;
export const ANCHORED_GLOBSTAR = /^\/\*{2,}$/;
export const INNER_SLASH = /\/(?!$)/;
export const RESTORE_PLACEHOLDER = new RegExp(PLACEHOLDER + "(\\d+)" + PLACEHOLDER, "g");
export const TRAILING_WILDCARD_PATTERN = /(^|\\\/)?\uE000$/;
export const TRAILING_DOUBLESTAR_PATTERN = /\uE001$/;
export const WILDCARD = "[^\\/]*";
export const NO_MATCH = Object.freeze({ ignored: false, unignored: false });
export const IGNORED_MATCH = Object.freeze({ ignored: true, unignored: false });
export const UNIGNORED_MATCH = Object.freeze({ ignored: false, unignored: true });
