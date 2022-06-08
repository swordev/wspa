import type { Config, Package } from "@wspa/cli/utils/package.js";
import { readFile } from "fs/promises";

async function safeReadFile(path: string) {
  try {
    return (await readFile(path)).toString();
  } catch (_) {
    return undefined;
  }
}

export async function buildConfig(pkg: Package) {
  const vite = await safeReadFile(`${pkg.dir}/vite.config.ts`);
  const tsconfigRaw = await safeReadFile(`${pkg.dir}/tsconfig.json`);
  const config: Pick<Config, "distDir" | "distFiles" | "outFiles"> = {
    distFiles: ["CHANGELOG.md", "node_modules"],
    outFiles: [],
  };

  if (vite) {
    config.distDir = "dist";
    config.outFiles!.push(config.distDir);
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
    config.outFiles!.push("tsconfig.tsbuildinfo");
    if (distDir) config.outFiles!.push(distDir);
  } else if (pkg.manifest.publishConfig?.directory) {
    config.distDir = pkg.manifest.publishConfig.directory;
    config.outFiles!.push(config.distDir);
  }
  return config;
}

export default async function auto(pkg: Package) {
  const config: Config = pkg.config
    ? JSON.parse(JSON.stringify(pkg.config))
    : {};
  const autoConfig = await buildConfig(pkg);

  if (config.distDir && autoConfig.distDir) {
    config.distDir = config.distDir.replaceAll("<distDir>", autoConfig.distDir);
  } else if (!config.distDir) {
    config.distDir = autoConfig.distDir;
  }

  if (config.distFiles && autoConfig.distFiles) {
    config.distFiles = config.distFiles.flatMap((v) =>
      v === "<distFiles>" ? autoConfig.distFiles! : v
    );
  } else if (!config.distFiles) {
    config.distFiles = autoConfig.distFiles;
  }

  if (config.outFiles && autoConfig.outFiles) {
    config.outFiles = config.outFiles.flatMap((v) =>
      v === "<outFiles>" ? autoConfig.outFiles! : v
    );
  } else if (!config.outFiles) {
    config.outFiles = autoConfig.outFiles;
  }
  return config;
}
