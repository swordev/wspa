import { safeStat } from "../utils/fs.js";
import { logAction, logPkgName } from "../utils/log.js";
import { filterPackage, getPackages, Package } from "../utils/package.js";
import cmdShim from "cmd-shim";
import { rm, writeFile } from "fs/promises";
import { join } from "path";

function normalizePkgBin(pkg: Package) {
  const bin = pkg.manifest.bin ?? pkg.config.pkgManifest?.bin;
  let result: Record<string, string> = {};

  if (typeof bin === "string") {
    const pkgName = pkg.manifest.name ?? pkg.config.pkgManifest?.name;
    const binName = pkgName!.split("/").pop()!;
    result[binName] = bin;
  } else if (bin) {
    result = { ...bin };
  }

  return result;
}

function resolvePkgBin(pkg: Package) {
  const bin = normalizePkgBin(pkg);
  for (const name in bin) {
    bin[name] = pkg.config.distDir
      ? join(pkg.dir, pkg.config.distDir, bin[name])
      : join(pkg.dir, bin[name]);
  }
  return bin;
}

async function createBins(pkg: Package, bins: Record<string, string>) {
  for (const binName in bins) {
    const scriptPath = bins[binName];
    const linkPath = join(pkg.dir, "node_modules", ".bin", binName);
    const existsScript = !!(await safeStat(scriptPath));
    if (!existsScript) {
      try {
        await writeFile(scriptPath, "#!/usr/bin/env node\n");
        await cmdShim(scriptPath, linkPath);
      } finally {
        await rm(scriptPath);
      }
    } else {
      await cmdShim(scriptPath, linkPath);
    }
  }
}

async function createBinLinks(options: {
  packageNames?: string[];
  log?: boolean;
}) {
  if (options.log) logAction(createBinLinks.name);
  const allPackages = await getPackages();

  const packages = allPackages.filter((pkg) =>
    filterPackage(pkg, { ...options, excludeRoot: true })
  );
  for (const pkg of packages) {
    const deps = {
      ...pkg.manifest.dependencies,
      ...pkg.manifest.devDependencies,
      ...pkg.manifest.peerDependencies,
    };

    const bins: ReturnType<typeof resolvePkgBin>[] = [];

    for (const depPkg of allPackages) {
      const isWorkspaceDep = deps[depPkg.name]?.startsWith("workspace:");
      if (isWorkspaceDep) {
        bins.push(resolvePkgBin(depPkg));
      }
    }

    const selfBin = resolvePkgBin(pkg);
    if (Object.keys(selfBin).length) {
      bins.push(selfBin);
    }

    if (!bins.length) continue;
    if (options.log) logPkgName(pkg.name);

    for (const bin of bins) await createBins(pkg, bin);
  }
}

export default createBinLinks;
