import { normalize, sep } from "path";

export function resolveRoot(path: string) {
  path = normalize(path);
  const folders: string[] = [];
  for (const folder of path.split(sep)) {
    if (folder === ".." && !folders.length) {
      continue;
    }
    folders.push(folder);
  }
  return folders.join(sep);
}
