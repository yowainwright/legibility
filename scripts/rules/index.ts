import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import GithubSlugger from "github-slugger";
import { format } from "oxfmt";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import {
  FORMAT_VERSION,
  HTML_ANCHOR_PATTERN,
  OUTPUT_FILE,
  RULE_ID_PATTERN,
  SEARCHABLE_BLOCK_TYPES,
  SEARCH_OUTPUT_FILE,
  SOURCE_FILE,
  TOPIC_TAGS,
} from "./constants.ts";
import type {
  CoveragePair,
  LinkDefinitionNode,
  LinkNode,
  LinkReferenceNode,
  MarkdownNode,
  RuleCoverage,
  RuleSearchRecord,
  RuleSummary,
  RuleTextIndex,
  RuleVariant,
  RuleVariantRowRequest,
} from "./types.ts";

const childNodes = (node: MarkdownNode): MarkdownNode[] => node.children ?? [];

const cellAt = (cells: MarkdownNode[], index: number): MarkdownNode => {
  const cell = cells[index];
  if (cell !== undefined) return cell;
  return { type: "text" };
};

const nodeText = (node: MarkdownNode): string => {
  if (node.value !== undefined) return node.value;
  const separator = node.type === "tableRow" ? " " : "";
  return childNodes(node).map(nodeText).join(separator);
};

const inlineCodeValues = (node: MarkdownNode): string[] => {
  const hasCodeValue = node.type === "inlineCode" && node.value !== undefined;
  if (hasCodeValue) return [node.value ?? ""];
  return childNodes(node).flatMap(inlineCodeValues);
};

const linkLabels = (node: MarkdownNode): string[] => {
  if (node.type === "link") return [nodeText(node)];
  return childNodes(node).flatMap(linkLabels);
};

const linkUrls = (node: MarkdownNode): string[] => {
  const hasLinkUrl = node.type === "link" && node.url !== undefined;
  if (hasLinkUrl) return [node.url ?? ""];
  return childNodes(node).flatMap(linkUrls);
};

const htmlAnchors = (value: string): string[] =>
  Array.from(value.matchAll(HTML_ANCHOR_PATTERN))
    .map((match) => match[1])
    .filter((anchor): anchor is string => anchor !== undefined);

const visitNodes = (node: MarkdownNode, visit: (node: MarkdownNode) => void): void => {
  visit(node);
  childNodes(node).forEach((child) => visitNodes(child, visit));
};

const parseDocument = (source: string): MarkdownNode =>
  unified().use(remarkParse).use(remarkGfm).parse(source) as unknown as MarkdownNode;

const isHeading = (node: MarkdownNode): boolean => node.type === "heading";

const headingIndex = (nodes: MarkdownNode[], depth: number, title: string): number =>
  nodes.findIndex((node) => {
    const matchesType = isHeading(node);
    const matchesDepth = node.depth === depth;
    const matchesTitle = nodeText(node) === title;
    const matchesHeadingShape = matchesType && matchesDepth;
    return matchesHeadingShape && matchesTitle;
  });

const isSectionBoundary = (
  node: MarkdownNode,
  index: number,
  start: number,
  depth: number,
): boolean => {
  const followsSectionStart = index > start;
  const hasHeadingType = isHeading(node);
  const isAtOrAboveDepth = (node.depth ?? 0) <= depth;
  const followsHeading = followsSectionStart && hasHeadingType;
  const endsAtBoundary = followsHeading && isAtOrAboveDepth;
  return endsAtBoundary;
};

const sectionAfter = (nodes: MarkdownNode[], start: number, depth: number): MarkdownNode[] => {
  const end = nodes.findIndex((node, index) => isSectionBoundary(node, index, start, depth));
  if (end < 0) return nodes.slice(start + 1);
  return nodes.slice(start + 1, end);
};

const requiredTable = (nodes: MarkdownNode[], section: string): MarkdownNode => {
  const table = nodes.find((node) => node.type === "table");
  if (table !== undefined) return table;
  throw new Error(`missing table in ${section}`);
};

const rowIds = (table: MarkdownNode): string[] =>
  childNodes(table)
    .slice(1)
    .flatMap((row) => {
      const firstCell = childNodes(row)[0];
      if (firstCell === undefined) return [];
      return nodeText(firstCell).match(RULE_ID_PATTERN) ?? [];
    });

const duplicates = (values: string[]): string[] => {
  const sorted = values.toSorted();
  return sorted.filter((value, index) => value === sorted[index - 1]);
};

const requiredRules = (nodes: MarkdownNode[]): RuleSummary[] => {
  const sectionIndex = headingIndex(nodes, 2, "All rules");
  if (sectionIndex < 0) throw new Error("missing All rules section");
  const section = sectionAfter(nodes, sectionIndex, 2);
  const table = requiredTable(section, "All rules");
  const rules = childNodes(table)
    .slice(1)
    .map((row) => {
      const cells = childNodes(row);
      const idMatches = nodeText(cellAt(cells, 0)).match(RULE_ID_PATTERN);
      const id = idMatches?.[0] ?? "";
      const name = inlineCodeValues(cellAt(cells, 1))[0] ?? "";
      const description = nodeText(cellAt(cells, 2));
      const tags = inlineCodeValues(cellAt(cells, 3));
      const languages = linkLabels(cellAt(cells, 4));
      const hasRuleIdentity = id.length > 0 && name.length > 0;
      const hasDescription = description.length > 0;
      const hasRuleTopics = tags.length > 0;
      const hasLanguageMappings = languages.length > 0;
      const hasCompleteRow =
        hasRuleIdentity && hasDescription && hasRuleTopics && hasLanguageMappings;
      if (!hasCompleteRow) {
        throw new Error(`incomplete All rules row: ${nodeText(row).slice(0, 80)}`);
      }
      return { id, name, description, tags, languages };
    });
  const ids = rules.map(({ id }) => id);
  const repeatedIds = duplicates(ids);
  const hasIds = ids.length > 0;
  const hasRepeatedIds = repeatedIds.length > 0;
  const hasValidIds = hasIds && !hasRepeatedIds;
  if (!hasValidIds) {
    throw new Error(`invalid All rules IDs: ${repeatedIds.join(", ") || "none found"}`);
  }
  return rules;
};

const topicProblems = (rule: RuleSummary, allowedTopics: Set<string>): string[] => {
  const invalidTags = rule.tags
    .filter((tag) => !allowedTopics.has(tag))
    .map((tag) => `${rule.id}: ${tag}`);
  const repeatedTags = duplicates(rule.tags).map((tag) => `${rule.id}: ${tag}`);
  const missingTags = rule.tags.length === 0 ? [rule.id] : [];
  return invalidTags.concat(repeatedTags, missingTags);
};

const validateTopics = (rules: RuleSummary[]): void => {
  const allowedTopics = new Set<string>(TOPIC_TAGS);
  const invalidValues = rules.flatMap((rule) => topicProblems(rule, allowedTopics));
  if (invalidValues.length > 0) {
    throw new Error(`invalid topic tags: ${invalidValues.join(", ")}`);
  }
};

const coverageSections = (
  section: MarkdownNode[],
): Array<{ end: number; heading: MarkdownNode; index: number }> => {
  const headings = headingSections(section, 3);
  const sections = headings.filter(({ heading }) => nodeText(heading).endsWith(" coverage"));
  if (sections.length === 0) throw new Error("missing language coverage tables");
  return sections;
};

const headingSections = (
  section: MarkdownNode[],
  depth: number,
): Array<{ end: number; heading: MarkdownNode; index: number }> => {
  const headings = section
    .map((heading, index) => ({ heading, index }))
    .filter(({ heading }) => heading.type === "heading" && heading.depth === depth);
  return headings.map((entry, index) => {
    const nextHeading = headings[index + 1];
    if (nextHeading === undefined) return Object.assign({}, entry, { end: section.length });
    return Object.assign({}, entry, { end: nextHeading.index });
  });
};

const coverageProblem = (label: string, ids: string[]): string => {
  if (ids.length === 0) return "";
  return `${label} ${ids.join(", ")}`;
};

const assertCoverage = (name: string, ids: string[], ruleIds: string[]): void => {
  const repeatedIds = duplicates(ids);
  const ruleIdSet = new Set(ruleIds);
  const unknownIds = ids.filter((id) => !ruleIdSet.has(id));
  const coverageIdSet = new Set(ids);
  const missingIds = ruleIds.filter((id) => !coverageIdSet.has(id));
  const problems = [
    coverageProblem("duplicates", repeatedIds),
    coverageProblem("unknown", unknownIds),
    coverageProblem("missing", missingIds),
  ].filter(Boolean);
  if (problems.length > 0) throw new Error(`${name} coverage: ${problems.join("; ")}`);
};

const validateCoverage = (nodes: MarkdownNode[], ruleIds: string[]): void => {
  const sectionIndex = headingIndex(nodes, 2, "Coverage by language");
  const section = sectionAfter(nodes, sectionIndex, 2);
  coverageSections(section).forEach(({ heading, index, end }) => {
    const contents = section.slice(index + 1, end);
    const headingName = nodeText(heading);
    const table = requiredTable(contents, headingName);
    assertCoverage(headingName, rowIds(table), ruleIds);
  });
};

const markdownNodes = function* (node: MarkdownNode): Generator<MarkdownNode> {
  yield node;
  for (const child of childNodes(node)) yield* markdownNodes(child);
};

const isLinkNode = (node: MarkdownNode): node is LinkNode =>
  node.type === "link" && node.url !== undefined;

const isLinkDefinition = (node: MarkdownNode): node is LinkDefinitionNode => {
  const isDefinition = node.type === "definition";
  const hasIdentifier = node.identifier !== undefined;
  const hasUrl = node.url !== undefined;
  const hasRequiredFields = hasIdentifier && hasUrl;
  return isDefinition && hasRequiredFields;
};

const isLinkReference = (node: MarkdownNode): node is LinkReferenceNode =>
  node.type === "linkReference" && node.identifier !== undefined;

const validateLinks = (document: MarkdownNode): void => {
  const slugger = new GithubSlugger();
  const nodes = Array.from(markdownNodes(document));
  const nodesByType = Map.groupBy(nodes, ({ type }) => type);
  const headingNodes = nodesByType.get("heading") ?? [];
  const headingAnchors = headingNodes.map((node) => slugger.slug(nodeText(node)));
  const htmlNodes = nodesByType.get("html") ?? [];
  const htmlValues = htmlNodes.map(({ value }) => value ?? "");
  const htmlAnchorIds = htmlValues.flatMap(htmlAnchors);
  const anchors = new Set(headingAnchors.concat(htmlAnchorIds));
  const linkNodes = nodesByType.get("link") ?? [];
  const definitionNodes = nodesByType.get("definition") ?? [];
  const referenceNodes = nodesByType.get("linkReference") ?? [];
  const links = linkNodes.filter(isLinkNode).map(({ url }) => url);
  const definitions = new Map<string, string>(
    definitionNodes
      .filter(isLinkDefinition)
      .map(({ identifier, url }) => [identifier.toLowerCase(), url] as const),
  );
  const references = referenceNodes
    .filter(isLinkReference)
    .map(({ identifier }) => identifier.toLowerCase());
  const referenceLinks = references
    .map((id) => definitions.get(id))
    .filter((url): url is string => url !== undefined);
  const localLinks = links.concat(referenceLinks).filter((url) => url.startsWith("#"));
  const fragments = localLinks.map((url) => decodeURIComponent(url.slice(1)));
  const uniqueFragments = Array.from(new Set(fragments));
  const missingLinks = uniqueFragments.filter((fragment) => !anchors.has(fragment));
  if (missingLinks.length > 0) throw new Error(`broken local links: ${missingLinks.join(", ")}`);
};

const appendSearchText = (index: RuleTextIndex, ruleId: string, text: string): void => {
  const parts = index.get(ruleId);
  if (parts === undefined) return;
  parts.add(text);
};

const indexSearchableBlocks = (index: RuleTextIndex, document: MarkdownNode): void => {
  visitNodes(document, (node) => {
    if (!SEARCHABLE_BLOCK_TYPES.has(node.type)) return;
    const text = nodeText(node).trim();
    const ruleIds = text.match(RULE_ID_PATTERN) ?? [];
    ruleIds.forEach((ruleId) => appendSearchText(index, ruleId, text));
  });
};

const indexRuleDetail = (
  index: RuleTextIndex,
  details: MarkdownNode[],
  section: { end: number; heading: MarkdownNode; index: number },
): void => {
  const ruleId = nodeText(section.heading).match(RULE_ID_PATTERN)?.[0];
  if (ruleId === undefined) return;
  const text = details.slice(section.index, section.end).map(nodeText).join(" ").trim();
  appendSearchText(index, ruleId, text);
};

const indexRuleDetails = (index: RuleTextIndex, document: MarkdownNode): void => {
  const documentNodes = childNodes(document);
  const detailsIndex = headingIndex(documentNodes, 2, "Rule details");
  if (detailsIndex < 0) throw new Error("missing Rule details section");
  const details = sectionAfter(documentNodes, detailsIndex, 2);
  const ruleSections = headingSections(details, 3).filter(({ heading }) =>
    /^LEG\d{3}\b/.test(nodeText(heading)),
  );
  ruleSections.forEach((section) => indexRuleDetail(index, details, section));
};

const searchRecord = (
  rule: RuleSummary,
  index: RuleTextIndex,
  variants: Map<string, RuleVariant[]>,
): RuleSearchRecord => {
  const parts = Array.from(index.get(rule.id) ?? []);
  const ruleVariants = variants.get(rule.id) ?? [];
  if (ruleVariants.length === 0) throw new Error(`missing rule variants: ${rule.id}`);
  return Object.assign({}, rule, {
    searchText: parts.join(" ").toLowerCase(),
    variants: ruleVariants,
  });
};

const buildSearchIndex = (document: MarkdownNode, rules: RuleSummary[]): RuleSearchRecord[] => {
  const index: RuleTextIndex = new Map(rules.map(({ id }) => [id, new Set<string>()]));
  indexSearchableBlocks(index, document);
  indexRuleDetails(index, document);
  const variants = buildRuleVariants(document);
  return rules.map((rule) => searchRecord(rule, index, variants));
};

const parseConfiguration = (section: MarkdownNode[], nativeRule: string): unknown => {
  const code = section.find((node) => node.type === "code" && node.lang === "json");
  if (code?.value === undefined) return undefined;
  const source = code.value.trim();
  const json = source.startsWith("{") ? source : `{${source}}`;
  const configuration = JSON.parse(json) as Record<string, unknown>;
  const rules = configuration.rules;
  const hasTopLevelRule = Object.hasOwn(configuration, nativeRule);
  if (hasTopLevelRule) return configuration[nativeRule];
  const hasObjectType = typeof rules === "object";
  const isArray = Array.isArray(rules);
  const isRulesObject = hasObjectType && rules !== null && !isArray;
  if (!isRulesObject) return undefined;
  return (rules as Record<string, unknown>)[nativeRule];
};

const defaultRuleState = (section: MarkdownNode[]): RuleVariant["defaultState"] => {
  const content = section.map(nodeText).join(" ").toLocaleLowerCase();
  const disabledByDefault = /\bdefault\s*:\s*(off|disabled)\b/u.test(content);
  const enabledByDefault = /\bdefault\s*:\s*(on|enabled)\b/u.test(content);
  const saysDisabledByDefault = /\b(off|disabled)\s+by\s+default\b/u.test(content);
  const saysEnabledByDefault = /\b(on|enabled)\s+by\s+default\b/u.test(content);
  const isDisabledByDefault = disabledByDefault || saysDisabledByDefault;
  if (isDisabledByDefault) return "disabled";
  const isEnabledByDefault = enabledByDefault || saysEnabledByDefault;
  if (isEnabledByDefault) return "enabled";
  return "unknown";
};

const nativeRuleMapping = (mapping: MarkdownNode): Pick<RuleVariant, "nativeRule" | "plugin"> => {
  const mappingText = nodeText(mapping);
  const separatorIndex = mappingText.indexOf(":");
  const plugin = mappingText.slice(0, separatorIndex).trim();
  const linkedRule = linkLabels(mapping)[0];
  const inlineRule = inlineCodeValues(mapping).at(-1);
  const mappedRule = linkedRule ?? inlineRule ?? "";
  const nativeRule = mappedRule.split("/").at(-1)?.trim() ?? "";
  return { nativeRule, plugin };
};

const coverageForLanguages = (
  languages: string[],
  coverageByLanguage: Map<string, RuleCoverage>,
  ruleId: string,
): RuleCoverage[] => {
  const missingCoverage = languages.filter((language) => !coverageByLanguage.has(language));
  if (missingCoverage.length > 0) {
    throw new Error(`${ruleId} missing coverage for ${missingCoverage.join(", ")}`);
  }
  return languages
    .map((language) => coverageByLanguage.get(language))
    .filter((coverage): coverage is RuleCoverage => coverage !== undefined);
};

const parseRuleVariantRow = (request: RuleVariantRowRequest): RuleVariant => {
  const { contentByHeading, coverageByLanguage, ruleId, row } = request;
  const cells = childNodes(row);
  const languageLabel = nodeText(cellAt(cells, 0));
  const { nativeRule, plugin } = nativeRuleMapping(cellAt(cells, 1));
  const anchor =
    linkUrls(cellAt(cells, 3))
      .find((url) => url.startsWith("#"))
      ?.slice(1) ?? "";
  const languages = languageLabel.split(/\s*\/\s*/u);
  const coverage = coverageForLanguages(languages, coverageByLanguage, ruleId);
  const heading = `${languageLabel} — ${plugin}`;
  const content = contentByHeading.get(heading) ?? [];
  const recommended = parseConfiguration(content, nativeRule);
  const variant: RuleVariant = {
    anchor,
    coverage,
    defaultState: defaultRuleState(content),
    languages,
    nativeRule,
    plugin,
    settings: nodeText(cellAt(cells, 4)),
  };
  if (recommended === undefined) return variant;
  return Object.assign({}, variant, { recommended });
};

const contentSectionsByHeading = (section: MarkdownNode[]): Map<string, MarkdownNode[]> => {
  const sections = headingSections(section, 4);
  return new Map(
    sections.map(
      ({ heading, index, end }) => [nodeText(heading), section.slice(index, end)] as const,
    ),
  );
};

const ruleVariants = (
  section: MarkdownNode[],
  coverageByRule: Map<string, RuleCoverage[]>,
): RuleVariant[] => {
  const table = requiredTable(section, "Rule details");
  const heading = section.find(isHeading) ?? { type: "text" };
  const ruleId = nodeText(heading).match(RULE_ID_PATTERN)?.[0] ?? "";
  const ruleCoverage = coverageByRule.get(ruleId) ?? [];
  const coverageByLanguage = new Map(ruleCoverage.map((entry) => [entry.language, entry] as const));
  const contentByHeading = contentSectionsByHeading(section);
  return childNodes(table)
    .slice(1)
    .map((row) => parseRuleVariantRow({ contentByHeading, coverageByLanguage, ruleId, row }));
};

const coveragePairsForRow = (row: MarkdownNode, language: string): CoveragePair[] => {
  const cells = childNodes(row);
  const ruleIds = nodeText(cellAt(cells, 0)).match(RULE_ID_PATTERN) ?? [];
  const coverage: RuleCoverage = {
    details: cells.slice(2).map(nodeText).join(" ").trim(),
    language,
    status: nodeText(cellAt(cells, 1)).trim(),
  };
  return ruleIds.map((ruleId) => ({ ruleId, coverage }));
};

const coveragePairsForSection = (
  section: MarkdownNode[],
  descriptor: { end: number; heading: MarkdownNode; index: number },
): CoveragePair[] => {
  const language = nodeText(descriptor.heading).replace(/ coverage$/u, "");
  const contents = section.slice(descriptor.index + 1, descriptor.end);
  const table = requiredTable(contents, `${language} coverage`);
  const rows = childNodes(table).slice(1);
  return rows.flatMap((row) => coveragePairsForRow(row, language));
};

const buildCoverageIndex = (document: MarkdownNode): Map<string, RuleCoverage[]> => {
  const documentNodes = childNodes(document);
  const sectionIndex = headingIndex(documentNodes, 2, "Coverage by language");
  if (sectionIndex < 0) throw new Error("missing Coverage by language section");
  const section = sectionAfter(documentNodes, sectionIndex, 2);
  const coveragePairs = coverageSections(section).flatMap((descriptor) =>
    coveragePairsForSection(section, descriptor),
  );
  const coverageByRule = Map.groupBy(coveragePairs, ({ ruleId }) => ruleId);
  return new Map(
    Array.from(
      coverageByRule,
      ([ruleId, entries]) => [ruleId, entries.map(({ coverage }) => coverage)] as const,
    ),
  );
};

const buildRuleVariants = (document: MarkdownNode): Map<string, RuleVariant[]> => {
  const documentNodes = childNodes(document);
  const detailsIndex = headingIndex(documentNodes, 2, "Rule details");
  const details = sectionAfter(documentNodes, detailsIndex, 2);
  const sections = headingSections(details, 3).filter(({ heading }) =>
    /^LEG\d{3}\b/u.test(nodeText(heading)),
  );
  const coverageByRule = buildCoverageIndex(document);
  return new Map(
    sections.map(({ heading, index, end }) => {
      const ruleId = nodeText(heading).match(RULE_ID_PATTERN)?.[0] ?? "";
      return [ruleId, ruleVariants(details.slice(index, end), coverageByRule)];
    }),
  );
};

const sourceRevision = (source: string): string =>
  `sha256:${createHash("sha256").update(source).digest("hex")}`;

const renderCatalog = (source: string, rules: RuleSearchRecord[]): string => {
  const catalog = {
    formatVersion: FORMAT_VERSION,
    sourceRevision: sourceRevision(source),
    contentType: "text/markdown",
    topics: TOPIC_TAGS,
    rules,
    markdown: source,
  };
  return `${JSON.stringify(catalog, null, 2)}\n`;
};

const searchTerms = (searchText: string): string =>
  Array.from(new Set(searchText.split(/\s+/u).filter(Boolean))).join(" ");

const runtimeRule = (rule: RuleSearchRecord) => ({
  description: rule.description,
  id: rule.id,
  languages: rule.languages,
  name: rule.name,
  tags: rule.tags,
  variants: rule.variants,
  searchTerms: searchTerms(rule.searchText),
});

const renderSearchCatalog = (source: string, rules: RuleSearchRecord[]): string => {
  const runtimeRules = rules.map(runtimeRule);
  const catalog = {
    formatVersion: FORMAT_VERSION,
    sourceRevision: sourceRevision(source),
    contentType: "text/markdown",
    topics: TOPIC_TAGS,
    rules: runtimeRules,
  };
  return `${JSON.stringify(catalog, null, 2)}\n`;
};

const formatCatalog = async (file: string, contents: string): Promise<string> => {
  const result = await format(file, contents);
  if (result.errors.length > 0) {
    throw new Error(`${file}: ${result.errors.map(({ message }) => message).join("; ")}`);
  }
  return result.code;
};

const writeCatalog = async (catalog: string, searchCatalog: string): Promise<void> => {
  const formattedCatalog = await formatCatalog(OUTPUT_FILE, catalog);
  const formattedSearchCatalog = await formatCatalog(SEARCH_OUTPUT_FILE, searchCatalog);
  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, formattedCatalog);
  writeFileSync(SEARCH_OUTPUT_FILE, formattedSearchCatalog);
};

const generateCatalog = async (): Promise<void> => {
  const source = readFileSync(SOURCE_FILE, "utf8");
  const document = parseDocument(source);
  const rules = requiredRules(childNodes(document));
  validateTopics(rules);
  validateCoverage(
    childNodes(document),
    rules.map(({ id }) => id),
  );
  validateLinks(document);
  const indexedRules = buildSearchIndex(document, rules);
  await writeCatalog(
    renderCatalog(source, indexedRules),
    renderSearchCatalog(source, indexedRules),
  );
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

try {
  await generateCatalog();
} catch (error: unknown) {
  process.stderr.write(`${errorMessage(error)}\n`);
  process.exitCode = 1;
}
