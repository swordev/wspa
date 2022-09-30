import copyFiles from "./copyFiles.js";
import createBinLinks from "./createBinLinks.js";
import createTsConfigs from "./createTsConfigs.js";
import updateDepLinks from "./updateDepLinks.js";

async function compose(options: { packageNames?: string[]; log?: boolean }) {
  await updateDepLinks(options);
  await copyFiles(options);
  await createBinLinks(options);
  await createTsConfigs(options);
}

export default compose;
