import { loadLibrary } from "../src/library.mjs";
import { writeChannelPackage } from "../src/study-journey.mjs";
import { fileURLToPath } from "node:url";
try {
  if (process.argv.length !== 3)
    throw new Error("Usage: export-channels.mjs TOPIC_ID");
  const { lessons } = await loadLibrary(),
    lesson = lessons.find((l) => l.topic.id === process.argv[2]);
  if (!lesson) throw new Error("missing or blocked topic");
  console.log(
    JSON.stringify(
      await writeChannelPackage(
        lesson,
        fileURLToPath(new URL("../dist/channels/", import.meta.url)),
      ),
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 2;
}
