import { findPath, safeReadFile } from "../fs.js";
import { TsConfig } from "./tsconfig.js";
import { Project, ProjectManifest } from "@pnpm/types";
import { join } from "path";

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
  /**
   * TypeScript configuration profiles.
   *
   * Used by the `createTsConfigs` action.
   */
  tsconfigProfiles?: {
    defaults?: TsConfig | null;
    build?: TsConfig | null;
    test?: TsConfig | null;
  };
};

export function getConfigFromManifest(manifest: ProjectManifest | undefined) {
  return ((manifest as any)[configKey] || {}) as Config | false;
}

export async function parseConfig(
  project: Project
): Promise<Config | false | undefined> {
  if (project.dir) {
    const path = await findPath(
      ["wspa.json", "wspa.js", "wspa.cjs", "wspa.mjs"].map((v) =>
        join(project.dir, v)
      )
    );

    if (path?.endsWith(".json")) {
      const wspaJson = await safeReadFile(path);
      if (wspaJson) return JSON.parse(wspaJson.toString());
    } else if (path) {
      return await import(path);
    }
  }

  return getConfigFromManifest(project.manifest);
}
