import { safeReadLink } from "../utils/fs.js";
import { logAction, logPkgName } from "../utils/log.js";
import { getPackages } from "../utils/self/package.js";
import { symlink, unlink } from "fs/promises";
import { join } from "path";

async function apply(
  pkgDir: string,
  packages: Awaited<ReturnType<typeof getPackages>>
) {
  for (const pkg of packages) {
    const dependencyPath = join(pkgDir, "node_modules", pkg.name);
    const isSymlink = !!(await safeReadLink(dependencyPath));
    if (!isSymlink) continue;

    if (pkg.config.distDir) {
      const targetPath = join(pkg.dir, pkg.config.distDir);
      await unlink(dependencyPath);
      await symlink(targetPath, dependencyPath, "junction");
    }
  }
}

/**
 * @link https://github.com/pnpm/pnpm/issues/3901
 */
async function updateDepLinks(options: {
  packageNames?: string[];
  log?: boolean;
}) {
  if (options.log) logAction(updateDepLinks.name);
  const packages = await getPackages({ packageNames: options.packageNames });
  for (const pkg of packages) {
    if (options.log) logPkgName(pkg.name);
    await apply(pkg.dir, packages);
  }
}

export default updateDepLinks;
