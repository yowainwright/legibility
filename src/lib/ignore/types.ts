export type IgnoreMatch = {
  ignored: boolean;
  unignored: boolean;
};

export type IgnoreMatcher = {
  test: (path: string) => IgnoreMatch;
};

export type IgnoreRule = {
  negative: boolean;
  basenameOnly: boolean;
  source: string;
  expression?: RegExp;
};

export type BracketState = {
  pattern: string;
  index: number;
  body: string;
  previous: string;
};

export type BracketResult = {
  end: number;
  source: string;
};

export type PatternState = {
  pattern: string;
  index: number;
  source: string;
  sources: string[];
};

export type RegexToken =
  | { kind: "wildcard" }
  | { kind: "single"; source: string }
  | { kind: "boundary"; source: string };

export type TokenResult = {
  token: RegexToken;
  end: number;
};
