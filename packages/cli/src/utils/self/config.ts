import { ProjectManifest } from "@pnpm/types";

export const configKey = "x-wspa" as const;

export type Config = {
  /**
   * Config path.
   *
   * @example "@wspa/config/auto"
   */
  extends?: string;
  /**
   * Root directory.
   *
   * Used by the `copyFiles` action to strip the `rootDir` path from the `outFiles`.
   *
   * @example "src"
   */
  rootDir?: string;
  /**
   * Distributable directory.
   *
   * Used by the `copyFiles`, `createBinLinks` and `updateDepLinks` actions.
   *
   * @example "lib"
   */
  distDir?: string;
  /**
   * Glob patterns of generated output files.
   *
   * Used by the `clean` action for deleting the files.
   *
   * @example ["*.tsbuildinfo", "lib"]
   */
  outFiles?: string[];
  /**
   * Glob patterns of distribution files.
   *
   * Used by the `copyFiles` action for copying the files to the `distDir` directory.
   *
   * @example ["CHANGELOG.md", "src/*.json"]
   */
  distFiles?: string[];
  /**
   * Overrides the package manifest.
   *
   * Used by the `copyFiles` and `createBinLinks` actions.
   */
  pkgManifest?: ProjectManifest;
  /**
   * Keeps the "devDependencies" field in the package manifest.
   *
   * Used by the `copyFiles` action.
   */
  devPkgManifestFields?: boolean;
};

export function getConfigFromManifest(manifest: ProjectManifest | undefined) {
  return ((manifest as any)[configKey] || {}) as Config | false;
}
