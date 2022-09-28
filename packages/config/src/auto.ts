import type { Config } from "@wspa/cli/utils/self/config.js";
import type { Package } from "@wspa/cli/utils/self/package.js";
import { readFile, stat } from "fs/promises";

async function safeStat(path: string) {
  try {
    return await stat(path);
  } catch (_) {}
}

async function findPath(paths: string[]) {
  for (const path of paths) {
    if (await safeStat(path)) return path;
  }
}

export async function buildConfig(pkg: Package) {
  const hasViteConfig = !!(await findPath([
    `${pkg.dir}/vite.config.ts`,
    `${pkg.dir}/vite.config.js`,
  ]));
  const tsconfigPath = await findPath([
    `${pkg.dir}/tsconfig.build.json`,
    `${pkg.dir}/tsconfig.json`,
  ]);
  const config: Pick<Config, "distDir" | "rootDir" | "distFiles" | "outFiles"> =
    {
      distFiles: ["CHANGELOG.md", "node_modules"],
      outFiles: [],
    };

  if (hasViteConfig) {
    config.distDir = "dist";
    config.outFiles!.push(config.distDir);
  } else if (tsconfigPath) {
    const tsconfigRaw = (await readFile(tsconfigPath)).toString();
    const tsconfig = JSON.parse(tsconfigRaw) as
      | {
          compilerOptions?: {
            outDir?: string;
            rootDir?: string;
          };
        }
      | undefined;

    const distDir = tsconfig?.compilerOptions?.outDir;

    config.rootDir = tsconfig?.compilerOptions?.rootDir;
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

  if (
    config.pkgManifest?.repository &&
    typeof config.pkgManifest.repository !== "string"
  ) {
    const repo = config.pkgManifest.repository as any as {
      directory?: string;
    };
    if (repo.directory)
      repo.directory = repo.directory?.replaceAll(
        "<directory>",
        pkg.relativeDir.replaceAll("\\", "/")
      );
  }

  if (config.rootDir && autoConfig.rootDir) {
    config.rootDir = config.rootDir.replaceAll("<rootDir>", autoConfig.rootDir);
  } else if (!config.rootDir) {
    config.rootDir = autoConfig.rootDir;
  }

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
