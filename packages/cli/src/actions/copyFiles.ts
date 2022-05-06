import { safeStat } from "../utils/fs.js";
import { logAction, logPkgName } from "../utils/log.js";
import { getPackages, pkgPropName } from "./../utils/package.js";
import cpy from "cpy";
import fg from "fast-glob";
import { mkdir, symlink, writeFile } from "fs/promises";
import { dirname, join } from "path";

async function copyFiles(options: { packageNames?: string[] }) {
  logAction(copyFiles.name);
  const packages = await getPackages({ packageNames: options.packageNames });
  const baseFiles = ["package.json", "README.md", "LICENSE"];
  for (const pkg of packages) {
    if (!pkg.config.distDir) continue;
    logPkgName(pkg.name);
    const distPath = join(pkg.dir, pkg.config.distDir);
    const files = pkg.config.distFiles;
    const allFiles = [...baseFiles, ...(files ?? [])];
    const stream = fg.stream(allFiles, {
      dot: true,
      cwd: pkg.dir,
      onlyFiles: false,
    });
    await mkdir(distPath, {
      recursive: true,
    });

    for await (const entry of stream) {
      const entryValue = entry.toString();
      const entryPath = join(pkg.dir, entryValue);
      const outPath = join(distPath, entryValue);
      const outDir = dirname(outPath);
      await mkdir(outDir, {
        recursive: true,
      });

      if (entryValue === "package.json") {
        const newPkg: typeof pkg.manifest = {
          ...pkg.manifest,
        };
        delete newPkg.publishConfig;
        delete newPkg.devDependencies;
        delete newPkg.scripts;
        if (pkgPropName in newPkg) delete newPkg[pkgPropName];
        await writeFile(outPath, JSON.stringify(newPkg, null, 2));
      } else if (entryValue === "node_modules") {
        try {
          await symlink(entryPath, outPath, "junction");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        }
      } else {
        await cpy(entryPath, distPath);
      }
    }
  }
}

export default copyFiles;
