#!/usr/bin/env node
import clean from "./actions/clean.js";
import compose from "./actions/compose.js";
import copyFiles from "./actions/copyFiles.js";
import createBinLinks from "./actions/createBinLinks.js";
import updateDepLinks from "./actions/updateDepLinks.js";
import { program } from "commander";
import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
let pkg: { version: string } | undefined;

try {
  pkg = JSON.parse(readFileSync(__dirname + "/package.json").toString());
} catch (error) {}

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

program.name("wspa");
if (pkg?.version) program.version(pkg.version);

program
  .command(snakeCase(clean.name))
  .option(...packageNamesOption)
  .action((o) => clean({ log: true, ...o }));

program
  .command(snakeCase(copyFiles.name))
  .option(...packageNamesOption)
  .action((o) => copyFiles({ log: true, ...o }));

program
  .command(snakeCase(createBinLinks.name))
  .option(...packageNamesOption)
  .action((o) => createBinLinks({ log: true, ...o }));

program
  .command(snakeCase(updateDepLinks.name))
  .option(...packageNamesOption)
  .action((o) => updateDepLinks({ log: true, ...o }));

program
  .command(snakeCase(compose.name))
  .option(...packageNamesOption)
  .action((o) => compose({ log: true, ...o }));

program.parse();
