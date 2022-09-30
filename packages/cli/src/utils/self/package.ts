import { Config, parseConfig } from "./config.js";
import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { ProjectManifest } from "@pnpm/types";
import merge from "merge";
import { join, resolve } from "path";

export const configKey = "x-wspa" as const;

export type Package = {
  name: string;
  dir: string;
  relativeDir: string;
  manifest: ProjectManifest;
  config: Config;
};

function resolvePath(path: string, cwd: string) {
  if (!path.endsWith(".js")) {
    const slashes = path.split("/").length - 1;
    const scoped = path.startsWith("@");
    // @vendor/pkg/file -> @vendor/pkg/file.js
    // pkg/file -> pkg/file.js
    const appendExt = (scoped && slashes) > 1 || (!scoped && slashes > 0);
    if (appendExt) {
      path += ".js";
    }
  }
  if (path.startsWith("./")) path = `file://${join(cwd, path)}`;
  return path;
}

export function filterPackage(
  pkg: { dir: string; manifest: { name?: string } },
  options: { packageNames?: string[]; excludeRoot?: boolean } = {}
) {
  return (
    (options.excludeRoot && pkg.dir === "." ? false : true) &&
    (!options.packageNames?.length ||
      options.packageNames.includes(pkg.manifest.name!))
  );
}

export function getWorkspaceDeps(name: string, packages: Package[]) {
  const pkg = packages.find((pkg) => pkg.name === name);
  if (!pkg) throw new Error(`Package not found: ${name}`);

  const workspaceDeps: string[] = [];

  const allDeps = [
    pkg.manifest.dependencies,
    pkg.manifest.devDependencies,
    pkg.manifest.peerDependencies,
  ];

  for (const deps of allDeps) {
    for (const dep in deps) {
      const version = deps[dep];
      if (version.startsWith("workspace:")) {
        if (!workspaceDeps.includes(dep)) workspaceDeps.push(dep);
      }
    }
  }

  return workspaceDeps;
}

export async function getPackages(options: { packageNames?: string[] } = {}) {
  const allProjects = await findWorkspacePackagesNoCheck(".");
  const rootProject = allProjects.find((pkg) => pkg.dir === ".")!;
  const projects = allProjects.filter((pkg) =>
    filterPackage(pkg, {
      ...options,
      excludeRoot: true,
    })
  );
  const packages: Package[] = [];

  const rootConfig = await parseConfig(rootProject);

  for (const project of projects) {
    const config = await parseConfig(project);

    const pkg: Package = {
      name: project.manifest.name!,
      dir: resolve(project.dir),
      relativeDir: project.dir,
      manifest: project.manifest,
      config: {},
    };

    if (config !== false) {
      if (config) pkg.config = config;

      if (rootConfig !== false)
        pkg.config = merge.recursive(true, rootConfig, pkg.config);

      if (pkg.config.extends) {
        const path = resolvePath(pkg.config.extends, pkg.dir);
        const applyConfig = await import(path);
        pkg.config = await applyConfig.default(pkg);
      }
    }

    packages.push(pkg);
  }
  return packages;
}
