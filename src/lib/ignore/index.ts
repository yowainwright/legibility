/**
 * @license
 * Adapted from node-ignore 7.0.14: https://github.com/kaelzhang/node-ignore
 *
 * Copyright (c) 2013 Kael Zhang <i@kael.me>, contributors
 * http://kael.me/
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { IGNORED_MATCH, INVALID_TRAILING_ESCAPE, NO_MATCH, UNIGNORED_MATCH } from "./constants.ts";
import { basenameOf, makeRegexSource, parentOf, trimPattern } from "./utils.ts";
import type { IgnoreMatch, IgnoreMatcher, IgnoreRule } from "./types.ts";

export const createIgnoreMatcher = (contents: string): IgnoreMatcher => {
  const rules = contents.split(/\r?\n/).flatMap(compileRule);
  const cache = new Map<string, IgnoreMatch>();
  const basenameCount = rules.filter((rule) => rule.basenameOnly).length;
  const useBasename = basenameCount * 2 >= rules.length;
  const test = (path: string): IgnoreMatch => {
    validatePath(path);
    return testPath(path, rules, cache, useBasename);
  };
  return { test };
};

const compileRule = (pattern: string): IgnoreRule[] => {
  const invalid = !pattern || INVALID_TRAILING_ESCAPE.test(pattern);
  if (invalid) return [];
  const normalized = pattern.replace(/^\uFEFF/, "");
  if (normalized.startsWith("#")) return [];
  const negative = normalized.startsWith("!");
  const content = negative ? normalized.slice(1) : normalized;
  const trimmed = trimPattern(content);
  if (!trimmed) return [];
  const body = trimmed.replace(/^\\!/, "!").replace(/^\\#/, "#");
  const slash = body.indexOf("/");
  const basenameOnly = slash < 0 || slash === body.length - 1;
  const source = makeRegexSource(body);
  return [{ negative, basenameOnly, source }];
};

const validatePath = (path: string): void => {
  const invalid = !path || /^(?:\/|\.\.?(?:\/|$))/.test(path);
  if (invalid) throw new Error("Ignore matching requires a nonempty relative path");
};

const testPath = (
  path: string,
  rules: IgnoreRule[],
  cache: Map<string, IgnoreMatch>,
  useBasename: boolean,
): IgnoreMatch => {
  const cached = cache.get(path);
  if (cached) return cached;
  const parentPath = parentOf(path);
  const parent = parentPath && testPath(parentPath, rules, cache, useBasename);
  const match = parent && parent.ignored ? parent : testRules(path, rules, useBasename);
  if (path.endsWith("/")) cache.set(path, match);
  return match;
};

const testRules = (path: string, rules: IgnoreRule[], useBasename: boolean): IgnoreMatch => {
  const basename = useBasename ? basenameOf(path) : path;
  for (let index = rules.length - 1; index >= 0; index--) {
    const rule = rules[index];
    const candidate = useBasename && rule.basenameOnly ? basename : path;
    rule.expression ??= new RegExp(rule.source, "i");
    if (rule.expression.test(candidate)) return rule.negative ? UNIGNORED_MATCH : IGNORED_MATCH;
  }
  return NO_MATCH;
};
