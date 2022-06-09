import copyFiles from "./copyFiles.js";
import updateDepLinks from "./updateDepLinks.js";

async function patch(options: { packageNames?: string[]; log?: boolean }) {
  await updateDepLinks(options);
  await copyFiles(options);
}

export default patch;
