import { logAction, logPkgName } from "../utils/log.js";
import { getPackages } from "./../utils/package.js";
import fg from "fast-glob";
import { rm } from "fs/promises";
import { join } from "path";

async function clean(options: { packageNames?: string[] }) {
  logAction(clean.name);
  const packages = await getPackages({ packageNames: options.packageNames });

  for (const pkg of packages) {
    if (!pkg.config.outFiles) continue;

    logPkgName(pkg.name);

    const stream = fg.stream(pkg.config.outFiles, {
      dot: true,
      cwd: pkg.dir,
      onlyFiles: false,
    });

    for await (const entry of stream) {
      const entryPath = join(pkg.dir, entry.toString());
      await rm(entryPath, {
        recursive: true,
      });
    }
  }
}

export default clean;
