import {
  formatCheckboxDemo,
  formatConfirmDemo,
  formatInputDemo,
  promptCheckbox,
  promptConfirm,
  promptInput,
  promptSelect,
  promptAnsi as ANSI,
  type PromptChoice,
} from "./prompt.ts";

const divider = `${ANSI.GRAY}────────────────────────────────────────────────────────────────────${ANSI.RESET}`;
const PREVIEW_MARK = "◆";
const CANCEL_MARK = "✗";

const section = (title: string, lines: string[]): string =>
  [`${ANSI.BOLD}${ANSI.CYAN}${title}${ANSI.RESET}`].concat(lines).join("\n");

const languageChoices: PromptChoice[] = [
  {
    name: "TypeScript",
    value: "typescript",
    description: "28 files · src/cli/index.ts, src/cli/utils.ts, …",
    checked: true,
  },
  { name: "JavaScript", value: "javascript", description: "not detected" },
  { name: "Python", value: "python", description: "not detected" },
  { name: "Go", value: "go", description: "not detected" },
];

const linterChoices: PromptChoice[] = [
  {
    name: "oxlint-plugin-legibility",
    value: "oxlint-plugin-legibility",
    description: "JavaScript and TypeScript readability · oxlint",
    checked: true,
  },
  {
    name: "eslint-plugin-legibility",
    value: "eslint-plugin-legibility",
    description: "JavaScript and TypeScript readability · eslint",
    disabled: "not installed",
  },
  {
    name: "src-lint",
    value: "src-lint",
    description: "import boundary policy · src-lint",
    disabled: "not installed",
  },
];

const tourChoices: PromptChoice[] = [
  { name: "Welcome confirmation", value: "welcome", description: "yes/no default handling" },
  {
    name: "Detect languages",
    value: "languages",
    description: "checkboxes, Space toggle, and Enter confirm",
  },
  {
    name: "Select available linters",
    value: "linters",
    description: "multiple circles with disabled and preselected choices",
  },
  {
    name: "Configure native arguments",
    value: "arguments",
    description: "text input and defaults",
  },
  { name: "Review configuration", value: "review", description: "read-only configuration preview" },
  { name: "Preview commands", value: "preview", description: "dry-run output" },
  { name: "Approve execution", value: "execution", description: "final yes/no gate" },
  { name: "Cancellation", value: "cancellation", description: "Esc cleanup and exit code" },
  { name: "Exit styleguide", value: "exit", description: "return to the shell" },
];

const reviewLines = (): string[] => [
  `${ANSI.BOLD}Configuration preview${ANSI.RESET}`,
  "  languages: typescript",
  "  linters:",
  "    oxlint-plugin-legibility:",
  "      enabled: true",
  "      args: []",
];

const commandLines = (): string[] => [
  `${ANSI.GREEN}${PREVIEW_MARK} Preview — no linters will run${ANSI.RESET}`,
  "  $ oxlint . --config oxlint.config.ts --deny-warnings",
];

const cancellationLine = `${ANSI.RED}${CANCEL_MARK}${ANSI.RESET} Which linters should run?: cancelled`;

export const formatStyleguide = (): string => {
  const languageFrame = formatCheckboxDemo(
    "Which languages should Legibility check?",
    languageChoices,
  );
  const linterFrame = formatCheckboxDemo("Which linters should run?", linterChoices);
  return [
    `${ANSI.BOLD}${ANSI.CYAN}Legibility CLI Styleguide${ANSI.RESET}`,
    "A visual tour of the guided project setup. No files are written and no linters run.",
    divider,
    section("01  Welcome", [formatConfirmDemo("Set up Legibility for this project?", false)]),
    section("02  Detect languages", languageFrame),
    section("03  Select available linters", linterFrame),
    section("04  Configure native arguments", [
      formatInputDemo("Arguments for oxlint-plugin-legibility (optional)", "--deny-warnings"),
    ]),
    section("05  Review and save", reviewLines()),
    section("06  Preview commands", commandLines()),
    section("07  Approve execution", [formatConfirmDemo("Run these linters now?", false)]),
    section("08  Cancellation", [cancellationLine]),
    divider,
    `${ANSI.GRAY}Keyboard: ↑/↓ navigate · Space toggle · a all · n none · Enter confirm · Esc cancel${ANSI.RESET}`,
  ].join("\n\n");
};

const printDemoTitle = (title: string): void => {
  console.log(`\n${divider}\n${ANSI.BOLD}${ANSI.CYAN}${title}${ANSI.RESET}`);
};

const printDemoResult = (label: string, value: string): void => {
  console.log(`${ANSI.GRAY}Result${ANSI.RESET} · ${label}: ${value}`);
};

const runWelcomeDemo = async (): Promise<void> => {
  printDemoTitle("Welcome confirmation");
  const answer = await promptConfirm("Demo · Set up Legibility for this project?", false);
  printDemoResult("setup", answer ? "yes" : "no");
};

const runLanguagesDemo = async (): Promise<void> => {
  printDemoTitle("Detect languages");
  const selected = await promptCheckbox(
    "Demo · Which languages should Legibility check?",
    languageChoices,
  );
  printDemoResult("languages", selected.join(", ") || "none");
};

const runLintersDemo = async (): Promise<void> => {
  printDemoTitle("Select available linters");
  const selected = await promptCheckbox("Demo · Which linters should run?", linterChoices, true);
  printDemoResult("linters", selected.join(", "));
};

const runArgumentsDemo = async (): Promise<void> => {
  printDemoTitle("Configure native arguments");
  const answer = await promptInput(
    "Demo · Arguments for oxlint-plugin-legibility (optional)",
    "--deny-warnings",
  );
  printDemoResult("arguments", answer || "none");
};

const runReviewDemo = async (): Promise<void> => {
  printDemoTitle("Review configuration");
  reviewLines().forEach((line) => console.log(line));
  await promptConfirm("Demo · Continue from this configuration?", true);
};

const runPreviewDemo = async (): Promise<void> => {
  printDemoTitle("Preview commands");
  commandLines().forEach((line) => console.log(line));
  await promptConfirm("Demo · Continue to execution approval?", true);
};

const runExecutionDemo = async (): Promise<void> => {
  printDemoTitle("Approve execution");
  const answer = await promptConfirm("Demo · Run these linters now?", false);
  printDemoResult("execution", answer ? "approved" : "not approved");
};

const runCancellationDemo = async (): Promise<void> => {
  printDemoTitle("Cancellation");
  try {
    await promptCheckbox("Demo · Press Esc to cancel this prompt", [
      { name: "A safe demo choice", value: "safe" },
    ]);
    printDemoResult("cancellation", "not exercised — press Esc next time");
  } catch (error: unknown) {
    const wasCancelled = error instanceof Error && error.name === "PromptCancelled";
    if (!wasCancelled) throw error;
    printDemoResult("cancellation", "handled");
  }
};

const runDemo = async (value: string): Promise<void> => {
  if (value === "welcome") return await runWelcomeDemo();
  if (value === "languages") return await runLanguagesDemo();
  if (value === "linters") return await runLintersDemo();
  if (value === "arguments") return await runArgumentsDemo();
  if (value === "review") return await runReviewDemo();
  if (value === "preview") return await runPreviewDemo();
  if (value === "execution") return await runExecutionDemo();
  if (value === "cancellation") return await runCancellationDemo();
};

export const runStyleguide = async (): Promise<number> => {
  console.log(
    [
      `${ANSI.BOLD}${ANSI.CYAN}Legibility CLI Styleguide${ANSI.RESET}`,
      "Interactive tour. Nothing is saved and no linter runs.",
      `${ANSI.GRAY}Use ↑/↓ and Enter to choose a demo. Esc exits.${ANSI.RESET}`,
    ].join("\n\n"),
  );
  while (true) {
    try {
      const selected = await promptSelect("Choose a flow to exercise", tourChoices);
      if (selected === "exit") return 0;
      await runDemo(selected);
      await promptConfirm("Return to the styleguide menu?", true);
    } catch (error: unknown) {
      const wasCancelled = error instanceof Error && error.name === "PromptCancelled";
      if (!wasCancelled) throw error;
      console.log("\nStyleguide closed.");
      return 0;
    }
  }
};
