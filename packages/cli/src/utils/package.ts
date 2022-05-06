import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { resolve } from "path";

export const pkgPropName = "x-wspa" as const;

export type Config = {
  /**
   * @default publishConfig.directory
   */
  distDir?: string;
  outFiles?: string[];
  distFiles?: string[];
};

export async function getPackages(options: { packageNames?: string[] } = {}) {
  const packages = await findWorkspacePackagesNoCheck(".");

  return packages
    .filter(
      (pkg) =>
        pkg.dir !== "." &&
        (!options.packageNames?.length ||
          options.packageNames.includes(pkg.manifest.name!))
    )
    .map((pkg) => {
      const result = {
        name: pkg.manifest.name!,
        dir: resolve(pkg.dir),
        manifest: pkg.manifest,
        config: ((pkg.manifest as any)[pkgPropName] || {}) as Config,
      };

      if (!result.config.distDir)
        result.config.distDir = pkg.manifest.publishConfig?.directory;

      return result;
    });
}
