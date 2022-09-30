import { readFile } from "fs/promises";
import { TsConfigJson } from "type-fest";

export async function parseTsConfigFile(
  path: string,
  strict?: true
): Promise<TsConfigJson>;
export async function parseTsConfigFile(
  path: string,
  strict: false
): Promise<TsConfigJson | undefined>;
export async function parseTsConfigFile(path: string, strict = true) {
  let contents: Buffer | undefined;
  try {
    contents = await readFile(path);
  } catch (error) {
    if (!strict && (error as NodeJS.ErrnoException).code !== "ENOENT")
      throw error;
  }

  return contents
    ? (JSON.parse(contents.toString()) as TsConfigJson)
    : undefined;
}
