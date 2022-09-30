import { getWorkspaceDeps, Package } from "./package.js";
import merge from "merge";
import { join, relative } from "path";
import { TsConfigJson } from "type-fest";

export type TsConfig = TsConfigJson & {
  /**
   * Merge the config deeply.
   */
  $merge?: string;
  /**
   * Workspace dependencies.
   */
  $workspaceDeps?: {
    /**
     * Adds all path aliases from workspace dependencies.
     */
    compilerOptionsPaths?: boolean;
    /**
     * Adds all project references from workspace dependencies.
     */
    references?: boolean;
  };
};

function getWorkspaceDepsData(pkg: Package, packages: Package[]) {
  return getWorkspaceDeps(pkg.name, packages).map((name) => {
    const wsPkg = packages.find((pkg) => pkg.name === name);
    if (!wsPkg) throw new Error(`Workspace dependency not found: ${name}`);
    const dir = relative(pkg.dir, wsPkg.dir).replaceAll("\\", "/");
    const rootDir =
      pkg.config.tsconfigProfiles?.["defaults"]?.compilerOptions?.rootDir;
    const aliasPath = join(dir, rootDir ?? ".").replaceAll("\\", "/");
    const referencePath = join(
      dir,
      wsPkg.config.tsconfigProfiles?.["build"] ? "tsconfig.build.json" : "."
    ).replaceAll("\\", "/");
    return { name, referencePath, aliasPath };
  });
}

function cloneTsConfig(tsconfig: TsConfig): TsConfig {
  return JSON.parse(JSON.stringify(tsconfig));
}

export function resolveTsConfigs(name: string, packages: Package[]) {
  const pkg = packages.find((pkg) => pkg.name === name);
  if (!pkg) throw new Error(`Package not found: ${name}`);
  const tsconfigMap = pkg?.config.tsconfigProfiles ?? {};
  const tsconfigResult: Record<string, TsConfig> = {};
  for (const name in tsconfigMap) {
    let tsconfig = tsconfigMap[name as keyof typeof tsconfigMap];
    if (!tsconfig) continue;
    tsconfig = tsconfigResult[name] = cloneTsConfig(tsconfig);
    if (tsconfig.$merge) {
      merge.recursive(
        tsconfig,
        tsconfigMap[tsconfig.$merge as keyof typeof tsconfigMap]
      ) as TsConfig;
      delete tsconfig.$merge;
    }
    if (tsconfig.$workspaceDeps) {
      const wsDeps = getWorkspaceDepsData(pkg, packages);
      if (tsconfig.$workspaceDeps.compilerOptionsPaths) {
        if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
        if (!tsconfig.compilerOptions.paths)
          tsconfig.compilerOptions.paths = {};
        for (const wsDep of wsDeps) {
          tsconfig.compilerOptions.paths[wsDep.name] = [wsDep.aliasPath];
          tsconfig.compilerOptions.paths[`${wsDep.name}/*`] = [
            `${wsDep.aliasPath}/*`,
          ];
        }
      }
      if (tsconfig.$workspaceDeps.references) {
        if (!tsconfig.references) tsconfig.references = [];
        for (const wsDep of wsDeps) {
          tsconfig.references.push({
            path: wsDep.referencePath,
          });
        }
      }
      delete tsconfig.$workspaceDeps;
    }
  }
  return tsconfigResult;
}
