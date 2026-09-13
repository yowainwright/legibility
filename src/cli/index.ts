#!/usr/bin/env node

import { resolve } from "node:path";
import { HELP_TEXT, VERSION } from "./constants.ts";
import { runStyleguide } from "./styleguide.ts";
import { discoverConfig, parseOptions, promptForSetup, readSource, runLinters } from "./utils.ts";
import type { Options } from "./types.ts";

export const run = async (args: string[]): Promise<number> => {
  let options: Options;
  try {
    options = parseOptions(args);
  } catch (error: unknown) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
  if (options.help) {
    console.log(HELP_TEXT);
    return 0;
  }
  if (options.styleguide) {
    return await runStyleguide();
  }
  if (options.version) {
    console.log(`legibility version ${VERSION}`);
    return 0;
  }
  try {
    const source = options.configPath
      ? readSource(resolve(process.cwd(), options.configPath))
      : discoverConfig();
    if (!source) return promptForSetup();
    return await runLinters(source, options);
  } catch (error: unknown) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
};

const exitCode = await run(process.argv.slice(2));
process.exit(exitCode);
