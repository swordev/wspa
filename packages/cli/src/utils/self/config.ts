import { ProjectManifest } from "@pnpm/types";

export const configKey = "x-wspa" as const;

export type Config = {
  extends?: string;
  rootDir?: string;
  distDir?: string;
  outFiles?: string[];
  distFiles?: string[];
  pkgManifest?: ProjectManifest;
};

export function getConfigFromManifest(manifest: ProjectManifest | undefined) {
  return ((manifest as any)[configKey] || {}) as Config | false;
}
