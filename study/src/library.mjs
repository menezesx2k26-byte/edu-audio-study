import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { topicIndex } from "./topic-manifest.mjs";
export async function loadLibrary(root = new URL("../", import.meta.url)) {
  if (typeof root === "string") root = pathToFileURL(resolve(root) + "/");
  const topics = JSON.parse(
    await readFile(new URL("data/edital-001-2026.topics.json", root), "utf8"),
  );
  const index = topicIndex(topics),
    files = await readdir(new URL("modules/", root));
  const lessons = [];
  for (const file of files.filter((f) => f.endsWith(".md"))) {
    const id = file.slice(0, -3);
    if (!index.has(id)) throw new Error(`unknown module file: ${id}`);
    lessons.push({
      topic: index.get(id),
      markdown: await readFile(new URL(`modules/${id}.md`, root), "utf8"),
      metadata: JSON.parse(
        await readFile(new URL(`modules/${id}.meta.json`, root), "utf8"),
      ),
    });
  }
  for (const file of files.filter((f) => f.endsWith(".meta.json")))
    if (!files.includes(file.replace(".meta.json", ".md")))
      throw new Error(`metadata without module: ${file}`);
  return { topics, lessons };
}
