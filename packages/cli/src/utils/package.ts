import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { ProjectManifest } from "@pnpm/types";
import { join, resolve } from "path";

export const configKey = "x-wspa" as const;

export type Config = {
  extends?: string;
  distDir?: string;
  outFiles?: string[];
  distFiles?: string[];
  pkgManifest?: ProjectManifest;
};

export type Package = {
  name: string;
  dir: string;
  manifest: ProjectManifest;
  config: Config;
};

function getManifestConfig(manifest: ProjectManifest | undefined) {
  return ((manifest as any)[configKey] || {}) as Config | false;
}

export async function getPackages(options: { packageNames?: string[] } = {}) {
  const allProjects = await findWorkspacePackagesNoCheck(".");
  const rootProject = allProjects.find((pkg) => pkg.dir === ".");
  const projects = allProjects.filter(
    (pkg) =>
      pkg !== rootProject &&
      (!options.packageNames?.length ||
        options.packageNames.includes(pkg.manifest.name!))
  );

  const packages: Package[] = [];
  const rootConfig = getManifestConfig(rootProject?.manifest);

  for (const project of projects) {
    const config = getManifestConfig(project.manifest);

    const pkg: Package = {
      name: project.manifest.name!,
      dir: resolve(project.dir),
      manifest: project.manifest,
      config: {},
    };

    if (config !== false) {
      pkg.config = config;

      if (rootConfig !== false)
        pkg.config = {
          ...pkg.config,
          ...rootConfig,
          pkgManifest: {
            ...pkg.config.pkgManifest,
            ...rootConfig.pkgManifest,
          },
        };

      if (pkg.config.extends) {
        let path = pkg.config.extends;
        if (path.startsWith("./")) path = `file://${join(pkg.dir, path)}`;
        const applyConfig = await import(path);
        pkg.config = await applyConfig.default(pkg);
      }
    }

    packages.push(pkg);
  }
  return packages;
}
