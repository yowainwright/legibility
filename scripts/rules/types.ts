export type MarkdownNode = {
  children?: MarkdownNode[];
  depth?: number;
  identifier?: string;
  type: string;
  url?: string;
  value?: string;
};

export type LinkNode = MarkdownNode & { url: string };
export type LinkDefinitionNode = MarkdownNode & { identifier: string; url: string };
export type LinkReferenceNode = MarkdownNode & { identifier: string };

export type RuleSummary = {
  description: string;
  id: string;
  languages: string[];
  name: string;
  tags: string[];
};

export type RuleVariant = {
  anchor: string;
  coverage: RuleCoverage[];
  defaultState: "disabled" | "enabled" | "unknown";
  languages: string[];
  nativeRule: string;
  plugin: string;
  settings: string;
  recommended?: unknown;
};

export type RuleCoverage = { details: string; language: string; status: string };

export type RuleSearchRecord = RuleSummary & { searchText: string; variants: RuleVariant[] };
export type RuleTextIndex = Map<string, Set<string>>;

export type RuleVariantRowRequest = {
  contentByHeading: Map<string, MarkdownNode[]>;
  coverageByLanguage: Map<string, RuleCoverage>;
  ruleId: string;
  row: MarkdownNode;
};

export type CoveragePair = { coverage: RuleCoverage; ruleId: string };
