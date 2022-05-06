export function logAction(name: string) {
  console.info(`- \x1b[36m${name}\x1b[0m`);
}

export function logPkgName(name: string) {
  console.info(`  - ${name}`);
}
