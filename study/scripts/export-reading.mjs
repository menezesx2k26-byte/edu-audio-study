import { loadLibrary } from "../src/library.mjs";
import { validateRelease } from "../src/release-gate.mjs";
import { writeReadingCollection } from "../src/reading-collection.mjs";
import { fileURLToPath } from "node:url";
try {
  const args = process.argv.slice(2),
    pdf = args.includes("--pdf"),
    rest = args.filter((a) => a !== "--pdf");
  if (rest.length && (rest.length !== 2 || rest[0] !== "--topics"))
    throw new Error("Usage: export-reading.mjs [--topics Esp01,Por01] [--pdf]");
  const library = await loadLibrary(),
    ids = rest[1]?.split(",");
  const release = validateRelease({ ...library, requestedTopicIds: ids });
  if (!release.allowed) throw new Error(release.problems.join("\n"));
  console.log(
    JSON.stringify(
      await writeReadingCollection(
        library.lessons.filter((l) => !ids || ids.includes(l.topic.id)),
        fileURLToPath(new URL("../dist/collections/", import.meta.url)),
        { pdf },
      ),
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 2;
}
