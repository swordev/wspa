import { logAction, logPkgName } from "../utils/log.js";
import { resolveRoot } from "../utils/path.js";
import { getPackages, configKey } from "./../utils/package.js";
import fg from "fast-glob";
import { cp, mkdir, symlink, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";

async function copyFiles(options: { packageNames?: string[]; log?: boolean }) {
  if (options.log) logAction(copyFiles.name);
  const packages = await getPackages({ packageNames: options.packageNames });
  const baseFiles = ["package.json", "README.md", "LICENSE"];
  for (const pkg of packages) {
    if (!pkg.config.distDir) continue;
    if (options.log) logPkgName(pkg.name);
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
      const rootDir = join(pkg.config.distDir, pkg.config.rootDir ?? ".");
      const distPath = join(pkg.config.distDir, entryValue);
      const resolvedDistPath = resolveRoot(relative(rootDir, distPath));
      const endDistPath = join(pkg.config.distDir, resolvedDistPath);
      const sourcePath = join(pkg.dir, entryValue);
      const targetPath = join(pkg.dir, endDistPath);

      await mkdir(dirname(targetPath), {
        recursive: true,
      });

      if (entryValue === "package.json") {
        let newPkg: typeof pkg.manifest = {
          ...pkg.manifest,
        };
        delete newPkg.publishConfig;
        delete newPkg.devDependencies;
        delete newPkg.scripts;
        if (configKey in newPkg) delete newPkg[configKey];
        newPkg = { ...newPkg, ...(pkg.config.pkgManifest || {}) };
        await writeFile(targetPath, JSON.stringify(newPkg, null, 2));
      } else if (entryValue === "node_modules") {
        try {
          await symlink(sourcePath, targetPath, "junction");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        }
      } else {
        await cp(sourcePath, targetPath, {
          recursive: true,
        });
      }
    }
  }
}

export default copyFiles;
