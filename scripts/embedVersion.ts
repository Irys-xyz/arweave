import { resolve } from "path";
import type { PathLike } from "fs";
import { readFileSync, promises } from "fs";
import Arweave from "../src/common/arweave";
import { readFile, writeFile } from "fs/promises";
export const checkPath = async (path: PathLike): Promise<boolean> => {
  return promises
    .stat(path)
    .then((_) => true)
    .catch((_) => false);
};

const version = JSON.parse(readFileSync("./package.json", { encoding: "utf-8" })).version;
const paths = [
  "./web.bundle.js",
  "./web.bundle.min.js",
  "./web.bundle.js.map",
  "./web.bundle.min.js.map",
  "./cjs/common/arweave.js",
  "./esm/common/arweave.js",
];
(async function (): Promise<void> {
  const dir = resolve("./build");
  await Promise.all(
    paths.map((p) =>
      (async (): Promise<void> => {
        const path = resolve(dir, p);
        if (!(await checkPath(path))) return console.log(`Skipping ${path} (ENOENT)`);
        const content = await readFile(path, { encoding: "utf-8" });
        const newContent = content.replace(Arweave.VERSION, version);
        await writeFile(path, newContent, { encoding: "utf-8" });
      })(),
    ),
  );
})();
