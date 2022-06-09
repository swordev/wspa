import { logAction, logPkgName } from "../utils/log.js";
import { getPackages } from "./../utils/package.js";
import fg from "fast-glob";
import { rm } from "fs/promises";
import { join } from "path";

async function clean(options: { packageNames?: string[]; log?: boolean }) {
  if (options.log) logAction(clean.name);
  const packages = await getPackages({ packageNames: options.packageNames });

  for (const pkg of packages) {
    if (!pkg.config.outFiles) continue;
    if (options.log) logPkgName(pkg.name);

    const stream = fg.stream(pkg.config.outFiles, {
      dot: true,
      cwd: pkg.dir,
      onlyFiles: false,
    });

    for await (const entry of stream) {
      const entryPath = join(pkg.dir, entry.toString());
      try {
        await rm(entryPath, {
          recursive: true,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  }
}

export default clean;
