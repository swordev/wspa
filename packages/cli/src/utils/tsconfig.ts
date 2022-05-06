import { readFile } from "fs/promises";

type CompilerOptions = { paths: Record<string, string[]>; outDir?: string };
type Reference = { path: string };

export type TsConfig = {
  references: Reference[];
  compilerOptions: CompilerOptions;
  include?: string[];
  exclude?: string[];
};

export async function parseTsConfigFile(
  path: string,
  strict?: true
): Promise<TsConfig>;
export async function parseTsConfigFile(
  path: string,
  strict: false
): Promise<TsConfig | undefined>;
export async function parseTsConfigFile(path: string, strict = true) {
  let contents: Buffer | undefined;
  try {
    contents = await readFile(path);
  } catch (error) {
    if (!strict && (error as NodeJS.ErrnoException).code !== "ENOENT")
      throw error;
  }

  return contents ? (JSON.parse(contents.toString()) as TsConfig) : undefined;
}
