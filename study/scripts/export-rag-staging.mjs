import { loadLibrary } from "../src/library.mjs";
import { validateRelease } from "../src/release-gate.mjs";
import { makeRagBundle } from "../src/rag-bundle.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--topics"))
    throw new Error("Usage: export-rag-staging.mjs [--topics Esp01,Por01]");
  const library = await loadLibrary();
  const ids = args[1]?.split(",");
  const release = validateRelease({ ...library, requestedTopicIds: ids });
  if (!release.allowed) throw new Error(release.problems.join("\n"));
  const bundle = makeRagBundle(
    library.lessons.filter((l) => !ids || ids.includes(l.topic.id)),
  );
  const directory = fileURLToPath(
    new URL(`../dist/rag/${bundle.receipt.bundleHash}/`, import.meta.url),
  );
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, "bundle.json"),
    JSON.stringify(bundle, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      { directory, indexStatus: "staging", ...bundle.receipt },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 2;
}
