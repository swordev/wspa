import type { Config, Package } from "@wspa/cli/utils/package.js";
import { readFile } from "fs/promises";

async function safeReadFile(path: string) {
  try {
    return (await readFile(path)).toString();
  } catch (_) {
    return undefined;
  }
}

export default async function auto(pkg: Package) {
  const vite = await safeReadFile(`${pkg.dir}/vite.config.ts`);
  const tsconfigRaw = await safeReadFile(`${pkg.dir}/tsconfig.json`);
  const config: Config = pkg.config
    ? JSON.parse(JSON.stringify(pkg.config))
    : {};

  if (!Array.isArray(config.distFiles)) config.distFiles = [];
  if (!Array.isArray(config.outFiles)) config.outFiles = [];

  config.distFiles.push("CHANGELOG.md", "node_modules");

  if (!config.distDir) {
    if (vite) {
      config.distDir = "dist";
      config.outFiles.push(config.distDir);
    } else if (tsconfigRaw) {
      const tsconfig = JSON.parse(tsconfigRaw) as
        | {
            compilerOptions: {
              outDir?: string;
            };
          }
        | undefined;

      const distDir = tsconfig?.compilerOptions.outDir;

      config.distDir = distDir;
      config.outFiles.push("tsconfig.tsbuildinfo");
      if (distDir) config.outFiles.push(distDir);
    } else if (pkg.manifest.publishConfig?.directory) {
      config.distDir = pkg.manifest.publishConfig.directory;
      config.outFiles.push(config.distDir);
    }
  }
  return config;
}
