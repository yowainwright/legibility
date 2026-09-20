export type PromptChoice = {
  name: string;
  value: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean | string;
};

export type PromptLine = (message: string) => Promise<string>;
export type PromptKeyReader = () => Promise<string>;

export type PromptKey = { name?: string; ctrl?: boolean };
export type SelectorMode = "multi" | "radio";

export type SelectorState = {
  cursorIndex: number;
  selected: boolean[];
  viewportStart: number;
};

export type ChoiceFrameOptions = {
  cursorIndex?: number;
  footer?: string;
};

export type ChoiceFrame = {
  message: string;
  choices: PromptChoice[];
  state: SelectorState;
  mode: SelectorMode;
  footer?: string;
};

export type SelectorRuntime = {
  message: string;
  choices: PromptChoice[];
  mode: SelectorMode;
  state: SelectorState;
  previousLineCount: number;
  isFinished: boolean;
};

export type SelectorHandlers = {
  onKeypress: (input: string | undefined, key?: PromptKey) => void;
  onData: (chunk: Buffer) => void;
};

export type SelectorFinish = (error?: Error) => void;
