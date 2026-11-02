import {
  ANCHORED_GLOBSTAR,
  CLASS_MEMBERS_TO_ESCAPE,
  DEFERRED_ESCAPES,
  INNER_SLASH,
  PLACEHOLDER,
  POSIX_CLASSES,
  REGEX_LITERAL_SPECIAL,
  RESERVED_CHARACTERS,
  RESTORE_PLACEHOLDER,
  TRAILING_DOUBLESTAR,
  TRAILING_DOUBLESTAR_PATTERN,
  TRAILING_WILDCARD,
  TRAILING_WILDCARD_PATTERN,
  WILDCARD,
} from "./constants.ts";
import type {
  BracketResult,
  BracketState,
  PatternState,
  RegexToken,
  TokenResult,
} from "./types.ts";

export const makeRegexSource = (body: string): string => {
  const pattern = ANCHORED_GLOBSTAR.test(body) ? "**" : body;
  const extracted = extractBrackets(pattern);
  const escaped = escapePattern(extracted.source);
  const anchored = anchorStart(escaped, pattern);
  const expanded = expandWildcards(anchored);
  const finished = anchorEnd(expanded);
  const restored = finished.replace(
    RESTORE_PLACEHOLDER,
    (_, index: string) => extracted.sources[Number(index)],
  );
  const wildcard = restored.replace(TRAILING_WILDCARD_PATTERN, replaceTrailingWildcard);
  const source = wildcard.replace(TRAILING_DOUBLESTAR_PATTERN, ".+(?=$|\\/$)");
  return pinWildcards(source);
};

export const basenameOf = (path: string): string => {
  const end = path.length - 1;
  const beforeSlash = path.endsWith("/") ? end - 1 : end;
  const index = path.lastIndexOf("/", beforeSlash);
  if (index < 0) return path;
  return path.slice(index + 1);
};

export const parentOf = (path: string): string => {
  const hasEmptySegment = path.startsWith("/") || path.includes("//");
  if (hasEmptySegment) {
    const segments = path.split("/").filter(Boolean);
    const parent = segments.slice(0, -1).join("/");
    if (!parent) return "";
    return parent + "/";
  }
  const end = path.length - 1;
  const beforeSlash = path.endsWith("/") ? end - 1 : end;
  const cut = path.lastIndexOf("/", beforeSlash);
  if (cut < 0) return "";
  return path.slice(0, cut + 1);
};

export const trimPattern = (body: string): string => {
  let end = body.length;
  while (end && /[\r\n]/.test(body[end - 1])) end--;
  const hasTrailingSpaces = body[end - 1] === " ";
  while (end && body[end - 1] === " ") end--;
  if (!hasTrailingSpaces) return body.slice(0, end);
  let backslashes = 0;
  while (backslashes < end && body[end - backslashes - 1] === "\\") backslashes++;
  if (backslashes % 2) return body.slice(0, end - 1) + " ";
  return body.slice(0, end);
};

const extractBrackets = (pattern: string): PatternState => {
  const state: PatternState = { pattern, index: 0, source: "", sources: [] };
  while (state.index < pattern.length) extractCharacter(state);
  return state;
};

const extractCharacter = (state: PatternState): void => {
  const char = state.pattern[state.index];
  if (char === "\\") return extractEscape(state);
  if (char === "[") return extractBracket(state);
  const source = RESERVED_CHARACTERS.has(char) ? holdSource(state, "[" + char + "]") : char;
  state.source += source;
  state.index++;
};

const extractEscape = (state: PatternState): void => {
  const escaped = state.pattern[state.index + 1];
  const finalSlash = escaped === "/" && state.index + 2 === state.pattern.length;
  const invalid = escaped === undefined || finalSlash;
  if (invalid) state.source += holdSource(state, "[]");
  else if (DEFERRED_ESCAPES.has(escaped)) {
    state.source += state.pattern.slice(state.index, state.index + 2);
  } else {
    const literal = escapeLiteral(escaped);
    state.source += holdSource(state, literal);
  }
  state.index += 2;
};

const extractBracket = (state: PatternState): void => {
  const bracket = scanBracket(state.pattern, state.index);
  if (!bracket) {
    state.source += holdSource(state, "[]");
    state.index = state.pattern.length;
    return;
  }
  state.source += holdSource(state, bracket.source);
  state.index = bracket.end + 1;
};

const holdSource = (state: PatternState, source: string): string => {
  const index = state.sources.length;
  state.sources[index] = source;
  const placeholder = PLACEHOLDER + index + PLACEHOLDER;
  return placeholder;
};

const escapeLiteral = (char: string): string => {
  if (REGEX_LITERAL_SPECIAL.test(char)) return "\\" + char;
  if (RESERVED_CHARACTERS.has(char)) {
    const literal = "[" + char + "]";
    return literal;
  }
  return char;
};

const scanBracket = (pattern: string, start: number): BracketResult | undefined => {
  const lead = pattern[start + 1];
  const negated = lead === "!" || lead === "^";
  const index = start + (negated ? 2 : 1);
  const state: BracketState = { pattern, index, body: "", previous: "" };
  while (state.index < pattern.length) {
    if (!scanBracketMember(state)) return undefined;
    state.index++;
    if (pattern[state.index] === "]") {
      const source = bracketSource(state.body, negated);
      return { end: state.index, source };
    }
  }
  return undefined;
};

const scanBracketMember = (state: BracketState): boolean => {
  const char = state.pattern[state.index];
  if (char === "\\") return scanBracketEscape(state);
  const hasRangeEnd = state.index + 1 < state.pattern.length;
  const validRangeEnd = hasRangeEnd && state.pattern[state.index + 1] !== "]";
  const isRange = char === "-" && state.previous && validRangeEnd;
  if (isRange) return scanBracketRange(state);
  const isClass = char === "[" && state.pattern[state.index + 1] === ":";
  if (isClass) return scanPosixClass(state);
  state.body += escapeMember(char);
  state.previous = char;
  return true;
};

const scanBracketEscape = (state: BracketState): boolean => {
  const escaped = state.pattern[state.index + 1];
  if (escaped === undefined) return false;
  state.body += escapeMember(escaped);
  state.previous = escaped;
  state.index++;
  return true;
};

const scanBracketRange = (state: BracketState): boolean => {
  state.index++;
  if (state.pattern[state.index] === "\\") state.index++;
  const end = state.pattern[state.index];
  if (end === undefined) return false;
  if (state.previous <= end) state.body += "-" + escapeMember(end);
  state.previous = "";
  return true;
};

const scanPosixClass = (state: BracketState): boolean => {
  const start = state.index + 2;
  const end = state.pattern.indexOf("]", start);
  if (end < 0) return false;
  const closed = end > start && state.pattern[end - 1] === ":";
  if (!closed) {
    state.body += escapeMember("[");
    state.previous = "[";
    return true;
  }
  const name = state.pattern.slice(start, end - 1);
  if (!Object.hasOwn(POSIX_CLASSES, name)) return false;
  state.body += POSIX_CLASSES[name];
  state.previous = "";
  state.index = end;
  return true;
};

const escapeMember = (char: string): string =>
  CLASS_MEMBERS_TO_ESCAPE.has(char) ? "\\" + char : char;

const bracketSource = (body: string, negated: boolean): string => {
  if (negated) {
    const source = "[^\\/" + body + "]";
    return source;
  }
  const source = "[" + body + "]";
  if (new RegExp(source).test("/")) return "(?!\\/)" + source;
  return source;
};

const escapePattern = (source: string): string => {
  const spaces = source.replace(/(\\+)( ?)/g, replaceEscapedSpace);
  const globstars = spaces.replace(/(^|\/)\*{3,}(?=\/|$)/g, "$1**");
  const metacharacters = globstars.replace(/[\\$.|*+(){^]/g, "\\$&");
  const questions = metacharacters.replace(/(?!\\)\?/g, "[^/]");
  const anchored = questions.replace(/^\//, "^");
  const separated = anchored.replace(/\//g, "\\/");
  return separated.replace(/^\^*(?:\\\*\\\*\\\/)+/, "^(?:.*\\/)?");
};

const replaceEscapedSpace = (_: string, run: string, space: string): string => {
  if (!space) return run;
  return run.slice(0, run.length - (run.length % 2)) + " ";
};

const anchorStart = (source: string, pattern: string): string => {
  const anchored = !source || source.startsWith("^");
  if (anchored) return source;
  const anchor = INNER_SLASH.test(pattern) ? "^" : "(?:^|\\/)";
  return anchor + source;
};

const expandWildcards = (source: string): string => {
  const globstars = source.replace(/\\\/\\\*\\\*(?=\\\/|$)/g, replaceGlobstar);
  const stars = globstars.replace(/(^|[^\\]+)(\\\*)+(?=.+)/g, replaceWildcard);
  const trailing = stars.replace(/(^|[^\\])((?:\\\\)*)\\\*$/, replaceTrailingMarker);
  const escapes = trailing.replace(/\\\\\\(?=[$.|*+(){^])/g, "\\");
  const unescaped = escapes.replace(/\\\\/g, "\\");
  return unescaped.replace(/\\\[([^\]/]*?)($|\])/g, "\\[$1$2");
};

const replaceGlobstar = (_: string, index: number, source: string): string => {
  if (index + 6 >= source.length) return "\\/" + TRAILING_DOUBLESTAR;
  if (source.slice(index + 6) === "\\/") return "(?:\\/[^\\/]+)+";
  return "(?:\\/[^\\/]+)*";
};

const replaceWildcard = (_: string, prefix: string, stars: string): string => {
  const source = stars.replace(/\\\*/g, WILDCARD);
  return prefix + source;
};

const replaceTrailingMarker = (match: string, prefix: string, escapes: string): string => {
  if (escapes) return match;
  return prefix + TRAILING_WILDCARD;
};

const anchorEnd = (source: string): string => {
  const last = source.at(-1);
  const marker = last === TRAILING_WILDCARD || last === TRAILING_DOUBLESTAR;
  const deferred = !last || marker;
  if (deferred) return source;
  const suffix = last === "/" ? "$" : "(?=$|\\/$)";
  return source + suffix;
};

const replaceTrailingWildcard = (_: string, slash: string | undefined): string => {
  const prefix = slash ? slash + "[^/]+" : "[^/]*";
  return prefix + "(?=$|\\/$)";
};

const pinWildcards = (source: string): string => {
  if (!source.includes(WILDCARD)) return source;
  const tokens = tokenizeRegex(source);
  const output: string[] = [];
  let run: RegexToken[] = [];
  for (const token of tokens) {
    if (token.kind !== "boundary") {
      run[run.length] = token;
      continue;
    }
    output[output.length] = renderRun(run) + token.source;
    run = [];
  }
  output[output.length] = renderRun(run);
  return output.join("");
};

const tokenizeRegex = (source: string): RegexToken[] => {
  const tokens: RegexToken[] = [];
  let index = 0;
  while (index < source.length) {
    const result = readRegexToken(source, index);
    tokens[tokens.length] = result.token;
    index = result.end;
  }
  return tokens;
};

const readRegexToken = (source: string, index: number): TokenResult => {
  if (source.startsWith(WILDCARD, index)) {
    const end = index + WILDCARD.length;
    return { token: { kind: "wildcard" }, end };
  }
  const char = source[index];
  if (char === "(") {
    const end = groupEnd(source, index);
    const token: RegexToken = { kind: "boundary", source: source.slice(index, end) };
    return { token, end };
  }
  return readSingleToken(source, index);
};

const readSingleToken = (source: string, index: number): TokenResult => {
  const char = source[index];
  const boundary = char === "^" || char === "$";
  if (boundary) {
    const end = index + 1;
    return { token: { kind: "boundary", source: char }, end };
  }
  let end = index + 1;
  if (char === "[") end = bracketEnd(source, index);
  if (char === "\\") end = index + 2;
  const token: RegexToken = { kind: "single", source: source.slice(index, end) };
  return { token, end };
};

const bracketEnd = (source: string, index: number): number => {
  let end = index + 1;
  if (source[end] === "^") end++;
  if (source[end] === "]") end++;
  while (end < source.length && source[end] !== "]") {
    end += source[end] === "\\" ? 2 : 1;
  }
  return end + 1;
};

const groupEnd = (source: string, index: number): number => {
  let end = index;
  let depth = 0;
  do {
    if (source[end] === "\\") end++;
    else if (source[end] === "(") depth++;
    else if (source[end] === ")") depth--;
    end++;
  } while (end < source.length && depth > 0);
  if ("*+?".includes(source[end])) end++;
  return end;
};

const renderRun = (run: RegexToken[]): string => {
  const lastWildcard = run.findLastIndex((token) => token.kind === "wildcard");
  return run.map((token, index) => renderRunToken(token, index, run, lastWildcard)).join("");
};

const renderRunToken = (
  token: RegexToken,
  index: number,
  run: RegexToken[],
  lastWildcard: number,
): string => {
  if (token.kind !== "wildcard") return token.source;
  if (index === lastWildcard) return WILDCARD;
  const separator = separatorAfter(run, index);
  const source = "(?:(?!" + separator + ")[^\\/])*";
  return source;
};

const separatorAfter = (run: RegexToken[], index: number): string => {
  let separator = "";
  for (let next = index + 1; next < run.length; next++) {
    const token = run[next];
    if (token.kind === "wildcard") break;
    separator += token.source;
  }
  return separator;
};
