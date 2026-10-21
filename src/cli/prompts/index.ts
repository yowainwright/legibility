import * as readline from "node:readline";
import { logger as createLogger } from "../../obs/index.ts";
import { ANSI } from "../constants.ts";
import {
  CHECKED_MARK,
  DISABLED_MARK,
  RADIO_SELECTED_MARK,
  RADIO_UNSELECTED_MARK,
  SELECTOR_CURSOR,
  SELECTOR_VIEWPORT_SIZE,
  UNCHECKED_MARK,
} from "./constants.ts";
import type {
  ChoiceFrame,
  ChoiceFrameOptions,
  PromptChoice,
  PromptKey,
  PromptKeyReader,
  PromptLine,
  SelectorFinish,
  SelectorHandlers,
  SelectorMode,
  SelectorRuntime,
  SelectorState,
} from "./types.ts";
export type { ChoiceFrameOptions, PromptChoice, PromptKeyReader, PromptLine } from "./types.ts";

const log = createLogger({ file: "prompts/index.ts" });

let nativePromptLine: PromptLine | undefined;

let nativePromptKey: PromptKeyReader | undefined;

export const promptAnsi = ANSI;

export const setPromptLine = (
  promptLine: PromptLine | undefined,
  promptKey?: PromptKeyReader,
): void => {
  nativePromptLine = promptLine;
  nativePromptKey = promptKey;
};

export const promptSelect = async (message: string, choices: PromptChoice[]): Promise<string> => {
  if (nativePromptKey) return (await runSelector(message, choices, "radio"))[0] ?? "";
  if (nativePromptLine) return (await numberedSelect(message, choices))[0] ?? "";
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
    selected: choices.map((choice) => Boolean(choice.checked) && !isDisabled(choice)),
    viewportStart: 0,
  };
  return formatChoiceFrame({
    message,
    choices,
    state,
    mode: "multi",
    footer: options.footer,
  });
};

export const formatConfirmDemo = (message: string, defaultValue: boolean): string => {
  const suffix = defaultValue ? "(Y/n)" : "(y/N)";
  return `${ANSI.BOLD}${ANSI.CYAN}?${ANSI.RESET} ${message} ${mutedText(suffix)}`;
};

export const formatInputDemo = (message: string, value: string): string =>
  `${ANSI.BOLD}${ANSI.CYAN}?${ANSI.RESET} ${message}: ${value}`;

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

const activeText = (text: string, active: boolean): string => {
  if (!active) return text;
  return `${ANSI.BOLD}${ANSI.CYAN}${text}${ANSI.RESET}`;
};

const choiceMark = (choice: PromptChoice, selected: boolean, mode: SelectorMode): string => {
  if (isDisabled(choice)) return DISABLED_MARK;
  if (mode === "radio") return selected ? RADIO_SELECTED_MARK : RADIO_UNSELECTED_MARK;
  return selected ? CHECKED_MARK : UNCHECKED_MARK;
};

const createSelectorRuntime = (
  message: string,
  choices: PromptChoice[],
  mode: SelectorMode,
): SelectorRuntime => ({
  message,
  choices,
  mode,
  state: createSelectorState(choices),
  previousLineCount: 0,
  isFinished: false,
});

const createSelectorState = (choices: PromptChoice[]): SelectorState => ({
  cursorIndex: firstSelectableIndex(choices),
  selected: choices.map((choice) => Boolean(choice.checked) && !isDisabled(choice)),
  viewportStart: 0,
});

const renderSelector = (runtime: SelectorRuntime): void => {
  const frame = formatChoiceFrame({
    message: runtime.message,
    choices: runtime.choices,
    state: runtime.state,
    mode: runtime.mode,
  });
  runtime.previousLineCount = writeFrame(
    frame,
    runtime.previousLineCount,
    runtime.previousLineCount === 0,
  );
};

const finishSelector = ({
  runtime,
  handlers,
  error,
  resolve,
  reject,
}: {
  runtime: SelectorRuntime;
  handlers: SelectorHandlers;
  error: Error | undefined;
  resolve: (value: string[]) => void;
  reject: (reason?: unknown) => void;
}): void => {
  if (runtime.isFinished) return;
  runtime.isFinished = true;
  cleanupSelector(handlers);
  renderSelectorFinish(runtime, error);
  settleSelector(runtime, error, resolve, reject);
};

const renderSelectorFinish = (runtime: SelectorRuntime, error: Error | undefined): void => {
  const lines = error
    ? cancelFrame(runtime.message)
    : finalFrame(runtime.message, runtime.choices, runtime.state, runtime.mode);
  writeFrame(lines, runtime.previousLineCount);
  process.stdout.write("\n");
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

const selectedLabels = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  if (mode === "radio") return [choices[state.cursorIndex]?.name ?? ""];
  return choices.filter((_, index) => state.selected[index]).map(({ name }) => name);
};

const cancelFrame = (message: string): string[] => [
  `${ANSI.BOLD}${ANSI.RED}✗${ANSI.RESET} ${message}: cancelled`,
];

const settleSelector = (
  runtime: SelectorRuntime,
  error: Error | undefined,
  resolve: (value: string[]) => void,
  reject: (reason?: unknown) => void,
): void => {
  if (error) return reject(error);
  resolve(selectedValues(runtime.choices, runtime.state, runtime.mode));
};

const selectedValues = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  if (mode === "radio") return [choices[state.cursorIndex]?.value ?? ""];
  return choices.filter((_, index) => state.selected[index]).map(({ value }) => value);
};

const createSelectorHandlers = (
  runtime: SelectorRuntime,
  finish: SelectorFinish,
  render: () => void,
): SelectorHandlers => ({
  onKeypress: (input, key = {}) => handleSelectorKeypress({ runtime, input, key, finish, render }),
});

const setupSelector = (
  handlers: SelectorHandlers,
  render: () => void,
  reject: (reason?: unknown) => void,
): void => {
  try {
    if (!selectorInputAvailable()) throw new Error("Interactive prompt input is unavailable");
    startSelectorInput(handlers);
    render();
  } catch (error: unknown) {
    cleanupSelector(handlers);
    reject(error);
  }
};

const cleanupSelector = (handlers: SelectorHandlers): void => {
  if (nativePromptKey) {
    process.stdout.write(ANSI.SHOW_CURSOR);
    return;
  }
  process.stdin.off("keypress", handlers.onKeypress);
  if (typeof process.stdin.setRawMode === "function") process.stdin.setRawMode(false);
  process.stdin.pause();
  process.stdout.write(ANSI.SHOW_CURSOR);
};

const startSelectorInput = (handlers: SelectorHandlers): void => {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("keypress", handlers.onKeypress);
  process.stdout.write(ANSI.HIDE_CURSOR);
};

const selectorInputAvailable = (): boolean => {
  const hasRawMode = typeof process.stdin.setRawMode === "function";
  return hasInteractiveTerminal() && hasRawMode;
};

const splitNativeInput = (input: string): { keys: string[]; remainder: string } => {
  let keys: string[] = [];
  let offset = 0;
  while (offset < input.length) {
    const isEscapeSequence = input.startsWith("\u001b[", offset);
    const keyLength = isEscapeSequence ? 3 : 1;
    const isPartialEscape = isEscapeSequence && input.length - offset < keyLength;
    if (isPartialEscape) return { keys, remainder: input.slice(offset) };
    keys = keys.concat([input.slice(offset, offset + keyLength)]);
    offset += keyLength;
  }
  return { keys, remainder: "" };
};

const handleNativeSelectorKey = (
  runtime: SelectorRuntime,
  input: string,
  finish: SelectorFinish,
  render: () => void,
): void => {
  const key = nativeKey(input);
  const isSpace = key.name === "space";
  if (isSpace) {
    Object.assign(runtime.state, updateSelected(runtime.state, " ", key, runtime.choices));
    render();
    return;
  }
  handleSelectorKeypress({ runtime, input, key, finish, render });
};

const handleSelectorKeypress = ({
  runtime,
  input,
  key,
  finish,
  render,
}: {
  runtime: SelectorRuntime;
  input: string | undefined;
  key: PromptKey;
  finish: SelectorFinish;
  render: () => void;
}): void => {
  if (handleSelectorExitKey(input, key, finish)) return;
  const direction = cursorDirection(key);
  if (handleSelectorDirection(runtime, direction, render)) return;
  const isSpace = input === " " || key.name === "space";
  if (isSpace) return toggleSelectorChoice(runtime, key, render);
  handleSelectorShortcut(runtime, input, key, render);
};

const cursorDirection = (key: PromptKey): number => {
  if (key.name === "up") return -1;
  if (key.name === "down") return 1;
  return 0;
};

const toggleSelectorChoice = (
  runtime: SelectorRuntime,
  key: PromptKey,
  render: () => void,
): void => {
  if (runtime.mode !== "multi") return;
  Object.assign(runtime.state, updateSelected(runtime.state, " ", key, runtime.choices));
  render();
};

const handleSelectorShortcut = (
  runtime: SelectorRuntime,
  input: string | undefined,
  key: PromptKey,
  render: () => void,
): void => {
  const shortcut = input?.toLowerCase() ?? "";
  if (!["a", "n"].includes(shortcut)) return;
  Object.assign(runtime.state, updateSelected(runtime.state, input, key, runtime.choices));
  render();
};

const updateSelected = (
  state: SelectorState,
  input: string | undefined,
  key: PromptKey,
  choices: PromptChoice[],
): SelectorState => {
  const isSpace = input === " " || key.name === "space";
  if (isSpace) return Object.assign({}, state, { selected: toggleSelected(state) });
  const shortcut = input?.toLowerCase() ?? "";
  if (shortcut === "a") {
    return Object.assign({}, state, {
      selected: choices.map((choice) => !isDisabled(choice)),
    });
  }
  if (shortcut === "n") return Object.assign({}, state, { selected: choices.map(() => false) });
  return state;
};

const toggleSelected = (state: SelectorState): boolean[] =>
  state.selected.map((value, index) => {
    if (index !== state.cursorIndex) return value;
    return !value;
  });

const handleSelectorDirection = (
  runtime: SelectorRuntime,
  direction: number,
  render: () => void,
): boolean => {
  if (direction === 0) return false;
  Object.assign(runtime.state, moveSelector(runtime.state, direction, runtime.choices));
  render();
  return true;
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

const moveCursor = (cursorIndex: number, direction: number, choices: PromptChoice[]): number => {
  let nextIndex = cursorIndex;
  for (let step = 0; step < choices.length; step += 1) {
    nextIndex = (nextIndex + direction + choices.length) % choices.length;
    if (!isDisabled(choices[nextIndex])) return nextIndex;
  }
  return cursorIndex;
};

const isDisabled = (choice: PromptChoice): boolean => Boolean(choice.disabled);

const handleSelectorExitKey = (
  input: string | undefined,
  key: PromptKey,
  finish: SelectorFinish,
): boolean => {
  if (isCancelKey(input, key)) {
    finish(promptCancelled());
    return true;
  }
  if (!isConfirmKey(key)) return false;
  finish();
  return true;
};

const isConfirmKey = (key: PromptKey): boolean => key.name === "return" || key.name === "enter";

const promptCancelled = (): Error => {
  const error = new Error("Prompt cancelled");
  error.name = "PromptCancelled";
  return error;
};

const isCancelKey = (input: string | undefined, key: PromptKey): boolean => {
  const isEscape = key.name === "escape" || input === "\u001b";
  const isCtrlC = Boolean(key.ctrl) && key.name === "c";
  return isEscape || isCtrlC;
};

const nativeKey = (input: string): PromptKey => {
  const firstCode = input.charCodeAt(0);
  const secondCode = input.charCodeAt(1);
  const thirdCode = input.charCodeAt(2);
  const isEscapeSequence = firstCode === 27 && secondCode === 91;
  const isUp = isEscapeSequence && thirdCode === 65;
  const isDown = isEscapeSequence && thirdCode === 66;
  const isEscape = firstCode === 27;
  const isCtrlC = firstCode === 3;
  const isEnter = firstCode === 13 || firstCode === 10;
  const isSpace = firstCode === 32;
  if (isUp) return { name: "up" };
  if (isDown) return { name: "down" };
  if (isEscape) return { name: "escape" };
  if (isCtrlC) return { name: "c", ctrl: true };
  if (isEnter) return { name: "enter" };
  if (isSpace) return { name: "space" };
  return { name: input.charAt(0) };
};

const createNativeInputReader = (
  promptKey: PromptKeyReader,
  runtime: SelectorRuntime,
  finish: SelectorFinish,
  render: () => void,
): (() => Promise<void>) => {
  let pendingInput = "";
  const readNext = async (): Promise<void> => {
    pendingInput += await promptKey();
    const parsed = splitNativeInput(pendingInput);
    pendingInput = parsed.remainder;
    for (const input of parsed.keys) {
      handleNativeSelectorKey(runtime, input, finish, render);
      if (runtime.isFinished) return;
    }
    if (!runtime.isFinished) await readNext();
  };
  return readNext;
};

const selectChoices = (message: string, choices: PromptChoice[]): Promise<string[]> => {
  if (nativePromptKey) return runSelector(message, choices, "multi");
  if (nativePromptLine) return numberedSelect(message, choices);
  if (hasInteractiveTerminal()) return runSelector(message, choices, "multi");
  return numberedSelect(message, choices);
};

const hasInteractiveTerminal = (): boolean =>
  Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);

const numberedSelect = async (message: string, choices: PromptChoice[]): Promise<string[]> => {
  log.print(`\n${message}`);
  choices.forEach((choice, index) => {
    const suffix = isDisabled(choice) ? ` (${choice.disabled})` : "";
    log.print(`  ${index + 1}. ${choice.name}${suffix}`);
  });
  const answer = await askLine("\nEnter choices (comma-separated numbers): ");
  return parseSelectedChoices(answer, choices);
};

const parseSelectedChoices = (answer: string, choices: PromptChoice[]): string[] => {
  const numbers = answer
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= choices.length);
  const selectedChoices = numbers.map((number) => choices[number - 1]);
  const enabledChoices = selectedChoices.filter(
    (choice) => choice !== undefined && !isDisabled(choice),
  );
  return enabledChoices.map(({ value }) => value);
};

const runSelector = (
  message: string,
  choices: PromptChoice[],
  mode: SelectorMode,
): Promise<string[]> => {
  if (choices.length === 0) return Promise.reject(new Error("Prompt requires at least one choice"));
  const hasSelectableChoice = choices.some((choice) => !isDisabled(choice));
  if (!hasSelectableChoice) return Promise.resolve([]);
  if (nativePromptKey) return runNativeSelector(message, choices, mode);
  return runInteractiveSelector(message, choices, mode);
};

const formatChoiceFrame = ({ message, choices, state, mode, footer }: ChoiceFrame): string[] => {
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
  const scrollHint = [
    { label: "↑ more", visible: hasPrevious },
    { label: "↓ more", visible: hasNext },
  ]
    .filter(({ visible }) => visible)
    .map(({ label }) => label);
  const instructions =
    mode === "radio"
      ? "↑/↓ navigate · Enter select · Esc cancel"
      : "↑/↓ navigate · Space toggle · a all · n none · Enter confirm · Esc cancel";
  const count = mode === "radio" ? "" : `${selectedCount(state.selected)} selected`;
  return mutedText(scrollHint.concat([instructions, count]).filter(Boolean).join(" · "));
};

const selectedCount = (selected: boolean[]): number => selected.filter(Boolean).length;

const runInteractiveSelector = (
  message: string,
  choices: PromptChoice[],
  mode: SelectorMode,
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const runtime = createSelectorRuntime(message, choices, mode);
    const render = (): void => renderSelector(runtime);
    const finish = (error?: Error): void =>
      finishSelector({ runtime, handlers, error, resolve, reject });
    const handlers = createSelectorHandlers(runtime, finish, render);
    setupSelector(handlers, render, reject);
  });

const runNativeSelector = (
  message: string,
  choices: PromptChoice[],
  mode: SelectorMode,
): Promise<string[]> => {
  const promptKey = nativePromptKey;
  if (!promptKey) return Promise.reject(new Error("Native prompt input is unavailable"));
  return new Promise((resolve, reject) => {
    const runtime = createSelectorRuntime(message, choices, mode);
    const render = (): void => renderSelector(runtime);
    const handlers: SelectorHandlers = { onKeypress: () => undefined };
    const finish = (error?: Error): void =>
      finishSelector({ runtime, handlers, error, resolve, reject });
    const readNext = createNativeInputReader(promptKey, runtime, finish, render);
    render();
    void readNext().catch(reject);
  });
};

const askLine = (message: string): Promise<string> =>
  nativePromptLine
    ? nativePromptLine(message)
    : new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(message, (answer) => {
          rl.close();
          resolve(answer);
        });
      });

const firstSelectableIndex = (choices: PromptChoice[]): number => {
  const index = choices.findIndex((choice) => !isDisabled(choice));
  const hasSelectableChoice = index >= 0;
  if (hasSelectableChoice) return index;
  return 0;
};

const mutedText = (text: string): string => `${ANSI.GRAY}${text}${ANSI.RESET}`;
