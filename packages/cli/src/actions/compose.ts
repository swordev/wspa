import copyFiles from "./copyFiles.js";
import createBinLinks from "./createBinLinks.js";
import updateDepLinks from "./updateDepLinks.js";

async function compose(options: { packageNames?: string[]; log?: boolean }) {
  await updateDepLinks(options);
  await copyFiles(options);
  await createBinLinks(options);
}

export default compose;
