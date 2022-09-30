import { logAction, logPkgName } from "../utils/log.js";
import { getPackages } from "../utils/self/package.js";
import { resolveTsConfigs } from "../utils/self/tsconfig.js";
import { writeFile } from "fs/promises";
import { join } from "path";

async function createTsConfigs(options: {
  packageNames?: string[];
  log?: boolean;
}) {
  if (options.log) logAction(createTsConfigs.name);
  const packages = await getPackages({ packageNames: options.packageNames });

  for (const pkg of packages) {
    const tsconfigs = resolveTsConfigs(pkg.name, packages);
    if (options.log && Object.keys(tsconfigs).length) logPkgName(pkg.name);
    for (const name in tsconfigs) {
      const path = join(
        pkg.dir,
        name === "defaults" ? "tsconfig.json" : `tsconfig.${name}.json`
      );
      await writeFile(path, JSON.stringify(tsconfigs[name], null, 2));
    }
  }
}

export default createTsConfigs;
