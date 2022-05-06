#!/usr/bin/env node
import clean from "./actions/clean.js";
import copyFiles from "./actions/copyFiles.js";
import patch from "./actions/patch.js";
import updateDepLinks from "./actions/updateDepLinks.js";
import { program } from "commander";
import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg: { version: string } = JSON.parse(
  readFileSync(__dirname + "/package.json").toString()
);

export function snakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

const packageNamesOption = [
  "-p,--package-names [value]",
  "Package names",
  function (value: string, prev: string[]) {
    return [...prev, value];
  },
  [] as string[],
] as const;

program.name("wspa").version(pkg.version);

program
  .command(snakeCase(clean.name))
  .option(...packageNamesOption)
  .action(clean);

program
  .command(snakeCase(copyFiles.name))
  .option(...packageNamesOption)
  .action(copyFiles);

program
  .command(snakeCase(updateDepLinks.name))
  .option(...packageNamesOption)
  .action(updateDepLinks);

program
  .command(snakeCase(patch.name))
  .option(...packageNamesOption)
  .action(patch);

program.parse();
