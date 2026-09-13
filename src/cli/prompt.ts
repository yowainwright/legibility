import * as readline from "node:readline";

const ANSI = {
  BOLD: "\x1b[1m",
  CYAN: "\x1b[36m",
  GRAY: "\x1b[90m",
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  RESET: "\x1b[0m",
  HIDE_CURSOR: "\x1b[?25l",
  SHOW_CURSOR: "\x1b[?25h",
} as const;

const SELECTOR_VIEWPORT_SIZE = 8;
const SELECTOR_CURSOR = "›";
const CHECKED_MARK = "■";
const UNCHECKED_MARK = "□";
const RADIO_SELECTED_MARK = "●";
const RADIO_UNSELECTED_MARK = "○";
const DISABLED_MARK = "─";

export type PromptChoice = {
  name: string;
  value: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean | string;
};

type PromptKey = { name?: string; ctrl?: boolean };
type SelectorMode = "multi" | "radio";

type SelectorState = {
  cursorIndex: number;
  selected: boolean[];
  viewportStart: number;
};

export type ChoiceFrameOptions = {
  cursorIndex?: number;
  footer?: string;
};

const isDisabled = (choice: PromptChoice): boolean =>
  choice.disabled !== undefined && choice.disabled !== false;

const hasInteractiveTerminal = (): boolean =>
  Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);

const activeText = (text: string, active: boolean): string => {
  if (!active) return text;
  return `${ANSI.BOLD}${ANSI.CYAN}${text}${ANSI.RESET}`;
};

const mutedText = (text: string): string => `${ANSI.GRAY}${text}${ANSI.RESET}`;

const choiceMark = (choice: PromptChoice, selected: boolean, mode: SelectorMode): string => {
  if (isDisabled(choice)) return DISABLED_MARK;
  if (mode === "radio") return selected ? RADIO_SELECTED_MARK : RADIO_UNSELECTED_MARK;
  return selected ? CHECKED_MARK : UNCHECKED_MARK;
};

const formatChoice = (
  choice: PromptChoice,
  index: number,
  state: SelectorState,
  mode: SelectorMode,
): string => {
  const isActive = index === state.cursorIndex;
  let selected = state.selected[index] ?? false;
  if (mode === "radio") selected = isActive;
  const prefix = `${isActive ? SELECTOR_CURSOR : " "} ${choiceMark(choice, selected, mode)} `;
  const description = choice.description ? ` ${mutedText(`· ${choice.description}`)}` : "";
  const text = `${prefix}${choice.name}${description}`;
  if (isDisabled(choice)) return mutedText(text);
  return activeText(text, isActive);
};

const selectedCount = (selected: boolean[]): number => selected.filter(Boolean).length;

const selectedSummary = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string => {
  if (mode === "radio") return "";
  const labels = choices.filter((_, index) => state.selected[index]).map(({ name }) => name);
  const hasSelections = labels.length > 0;
  const selectedLabels = hasSelections ? labels.join(", ") : "none";
  return `Selected: ${selectedLabels}`;
};

const selectorFooter = (state: SelectorState, choiceCount: number, mode: SelectorMode): string => {
  const hasPrevious = state.viewportStart > 0;
  const hasNext = state.viewportStart + SELECTOR_VIEWPORT_SIZE < choiceCount;
  const scrollHint = [hasPrevious ? "↑ more" : "", hasNext ? "↓ more" : ""].filter(Boolean);
  const instructions =
    mode === "radio"
      ? "↑/↓ navigate · Enter select · Esc cancel"
      : "↑/↓ navigate · Space toggle · a all · n none · Enter confirm · Esc cancel";
  const count = mode === "radio" ? "" : `${selectedCount(state.selected)} selected`;
  return mutedText(scrollHint.concat([instructions, count]).filter(Boolean).join(" · "));
};

const updateViewportStart = (
  cursorIndex: number,
  viewportStart: number,
  choiceCount: number,
): number => {
  const maxStart = Math.max(0, choiceCount - SELECTOR_VIEWPORT_SIZE);
  if (cursorIndex < viewportStart) return cursorIndex;
  if (cursorIndex >= viewportStart + SELECTOR_VIEWPORT_SIZE) {
    const nextStart = cursorIndex - SELECTOR_VIEWPORT_SIZE + 1;
    return Math.min(maxStart, nextStart);
  }
  return viewportStart;
};

const formatChoiceFrame = (
  message: string,
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
  footer?: string,
): string[] => {
  const visibleChoices = choices.slice(
    state.viewportStart,
    state.viewportStart + SELECTOR_VIEWPORT_SIZE,
  );
  const choiceLines = visibleChoices.map((choice, offset) =>
    formatChoice(choice, state.viewportStart + offset, state, mode),
  );
  const promptTitle = `${ANSI.BOLD}${ANSI.CYAN}?${ANSI.RESET} ${message}`;
  const promptFooter = footer ?? selectorFooter(state, choices.length, mode);
  const summary = selectedSummary(choices, state, mode);
  const summaryLine = summary ? mutedText(summary) : "";
  return [promptTitle].concat(choiceLines, [promptFooter], summaryLine ? [summaryLine] : []);
};

const writeFrame = (lines: string[], previousLineCount: number, firstFrame = false): number => {
  if (firstFrame) process.stdout.write("\n");
  if (previousLineCount > 0) {
    readline.moveCursor(process.stdout, 0, -(previousLineCount - 1));
  }
  readline.cursorTo(process.stdout, 0);
  readline.clearScreenDown(process.stdout);
  process.stdout.write(lines.join("\n"));
  return lines.length;
};

const firstSelectableIndex = (choices: PromptChoice[]): number => {
  const index = choices.findIndex((choice) => !isDisabled(choice));
  const hasSelectableChoice = index >= 0;
  if (hasSelectableChoice) return index;
  return 0;
};

const moveCursor = (cursorIndex: number, direction: number, choices: PromptChoice[]): number => {
  let nextIndex = cursorIndex;
  for (let step = 0; step < choices.length; step += 1) {
    nextIndex = (nextIndex + direction + choices.length) % choices.length;
    if (!isDisabled(choices[nextIndex])) return nextIndex;
  }
  return cursorIndex;
};

const moveSelector = (
  state: SelectorState,
  direction: number,
  choices: PromptChoice[],
): SelectorState => {
  const cursorIndex = moveCursor(state.cursorIndex, direction, choices);
  const viewportStart = updateViewportStart(cursorIndex, state.viewportStart, choices.length);
  return Object.assign({}, state, { cursorIndex, viewportStart });
};

const selectedValues = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  if (mode === "radio") return [choices[state.cursorIndex]?.value ?? ""];
  return choices.filter((_, index) => state.selected[index]).map(({ value }) => value);
};

const selectedLabels = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  if (mode === "radio") return [choices[state.cursorIndex]?.name ?? ""];
  return choices.filter((_, index) => state.selected[index]).map(({ name }) => name);
};

const finalFrame = (
  message: string,
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  const labels = selectedLabels(choices, state, mode);
  const summary = labels.length > 0 ? labels.join(", ") : "none selected";
  return [`${ANSI.BOLD}${ANSI.GREEN}✔${ANSI.RESET} ${message}: ${summary}`];
};

const cancelFrame = (message: string): string[] => [
  `${ANSI.BOLD}${ANSI.RED}✗${ANSI.RESET} ${message}: cancelled`,
];

const isCancelKey = (input: string | undefined, key: PromptKey): boolean => {
  const isEscape = key.name === "escape" || input === "\u001b";
  const isCtrlC = key.ctrl === true && key.name === "c";
  return isEscape || isCtrlC;
};

const isConfirmKey = (key: PromptKey): boolean => key.name === "return" || key.name === "enter";

const cursorDirection = (key: PromptKey): number => {
  if (key.name === "up") return -1;
  if (key.name === "down") return 1;
  return 0;
};

const updateSelected = (
  state: SelectorState,
  input: string | undefined,
  key: PromptKey,
  choices: PromptChoice[],
): SelectorState => {
  const isSpace = input === " " || key.name === "space";
  if (isSpace) {
    const selected = state.selected.map((value, index) => {
      if (index === state.cursorIndex) return !value;
      return value;
    });
    return Object.assign({}, state, { selected });
  }
  const shortcut = input?.toLowerCase() ?? "";
  if (shortcut === "a") {
    return Object.assign({}, state, {
      selected: choices.map((choice) => !isDisabled(choice)),
    });
  }
  if (shortcut === "n") return Object.assign({}, state, { selected: choices.map(() => false) });
  return state;
};

const promptCancelled = (): Error => {
  const error = new Error("Prompt cancelled");
  error.name = "PromptCancelled";
  return error;
};

const runSelector = (
  message: string,
  choices: PromptChoice[],
  mode: SelectorMode,
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    if (choices.length === 0) {
      reject(new Error("Prompt requires at least one choice"));
      return;
    }
    const state: SelectorState = {
      cursorIndex: firstSelectableIndex(choices),
      selected: choices.map((choice) => choice.checked === true && !isDisabled(choice)),
      viewportStart: 0,
    };
    let previousLineCount = 0;
    let isFinished = false;
    const cleanup = (): void => {
      process.stdin.off("keypress", onKeypress);
      process.stdin.off("data", onData);
      if (typeof process.stdin.setRawMode === "function") process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write(ANSI.SHOW_CURSOR);
    };
    const finish = (error?: Error): void => {
      if (isFinished) return;
      isFinished = true;
      cleanup();
      const lines = error ? cancelFrame(message) : finalFrame(message, choices, state, mode);
      writeFrame(lines, previousLineCount);
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(selectedValues(choices, state, mode));
    };
    const render = (): void => {
      previousLineCount = writeFrame(
        formatChoiceFrame(message, choices, state, mode),
        previousLineCount,
        previousLineCount === 0,
      );
    };
    const toggleCurrentChoice = (): void => {
      Object.assign(state, updateSelected(state, " ", { name: "space" }, choices));
      render();
    };
    const onKeypress = (input: string | undefined, key: PromptKey = {}): void => {
      if (isCancelKey(input, key)) {
        finish(promptCancelled());
        return;
      }
      if (isConfirmKey(key)) {
        finish();
        return;
      }
      const direction = cursorDirection(key);
      if (direction !== 0) {
        Object.assign(state, moveSelector(state, direction, choices));
        render();
        return;
      }
      const isSpace = input === " " || key.name === "space";
      if (isSpace) return;
      const shortcut = input?.toLowerCase() ?? "";
      const isSelectionKey = ["a", "n"].includes(shortcut);
      if (isSelectionKey) {
        Object.assign(state, updateSelected(state, input, key, choices));
        render();
      }
    };
    const onData = (chunk: Buffer): void => {
      const isMultiSelect = mode === "multi";
      const hasSpace = chunk.toString("utf8").includes(" ");
      const shouldToggle = isMultiSelect && hasSpace;
      if (shouldToggle) toggleCurrentChoice();
    };
    try {
      const hasRawMode = typeof process.stdin.setRawMode === "function";
      const isInteractive = hasInteractiveTerminal() && hasRawMode;
      if (!isInteractive) {
        reject(new Error("Interactive prompt input is unavailable"));
        return;
      }
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("keypress", onKeypress);
      process.stdin.on("data", onData);
      process.stdout.write(ANSI.HIDE_CURSOR);
      render();
    } catch (error: unknown) {
      cleanup();
      reject(error);
    }
  });

const askLine = (message: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const parseSelectedChoices = (answer: string, choices: PromptChoice[]): string[] => {
  const numbers = answer
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= choices.length);
  return numbers
    .map((number) => choices[number - 1])
    .filter((choice) => choice !== undefined && !isDisabled(choice))
    .map(({ value }) => value);
};

const numberedSelect = async (message: string, choices: PromptChoice[]): Promise<string[]> => {
  console.log(`\n${message}`);
  choices.forEach((choice, index) => {
    const suffix = isDisabled(choice) ? ` (${choice.disabled})` : "";
    console.log(`  ${index + 1}. ${choice.name}${suffix}`);
  });
  const answer = await askLine("\nEnter choices (comma-separated numbers): ");
  return parseSelectedChoices(answer, choices);
};

const selectChoices = (message: string, choices: PromptChoice[]): Promise<string[]> => {
  if (hasInteractiveTerminal()) return runSelector(message, choices, "multi");
  return numberedSelect(message, choices);
};

export const promptSelect = async (message: string, choices: PromptChoice[]): Promise<string> => {
  if (!hasInteractiveTerminal()) return (await numberedSelect(message, choices))[0] ?? "";
  const selected = await runSelector(message, choices, "radio");
  return selected[0] ?? "";
};

export const promptCheckbox = async (
  message: string,
  choices: PromptChoice[],
  required = false,
): Promise<string[]> => {
  const selected = await selectChoices(message, choices);
  const hasRequiredSelection = required && selected.length === 0;
  if (hasRequiredSelection) throw new Error("At least one choice must be selected");
  return selected;
};

export const promptConfirm = async (message: string, defaultValue = true): Promise<boolean> => {
  const suffix = defaultValue ? " (Y/n): " : " (y/N): ";
  const answer = (await askLine(`${message}${suffix}`)).trim().toLowerCase();
  if (answer === "") return defaultValue;
  const isAffirmative = answer === "y" || answer === "yes";
  return isAffirmative;
};

export const promptInput = async (message: string, defaultValue = ""): Promise<string> => {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = (await askLine(`${message}${suffix}: `)).trim();
  return answer || defaultValue;
};

export const formatCheckboxDemo = (
  message: string,
  choices: PromptChoice[],
  options: ChoiceFrameOptions = {},
): string[] => {
  const cursorIndex = options.cursorIndex ?? firstSelectableIndex(choices);
  const state: SelectorState = {
    cursorIndex,
    selected: choices.map((choice) => choice.checked === true && !isDisabled(choice)),
    viewportStart: 0,
  };
  return formatChoiceFrame(message, choices, state, "multi", options.footer);
};

export const formatConfirmDemo = (message: string, defaultValue: boolean): string => {
  const suffix = defaultValue ? "(Y/n)" : "(y/N)";
  return `${ANSI.BOLD}${ANSI.CYAN}?${ANSI.RESET} ${message} ${mutedText(suffix)}`;
};

export const formatInputDemo = (message: string, value: string): string =>
  `${ANSI.BOLD}${ANSI.CYAN}?${ANSI.RESET} ${message}: ${value}`;

export const promptAnsi = ANSI;
