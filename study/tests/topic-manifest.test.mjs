import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateTopicManifest, topicIndex } from "../src/topic-manifest.mjs";
const load = async () =>
  JSON.parse(
    await readFile(
      new URL("../data/edital-001-2026.topics.json", import.meta.url),
    ),
  );
test("test_topic_manifest_has_61_ids_and_20_12_8_21_counts", async () => {
  const topics = await load();
  const result = validateTopicManifest(topics);
  assert.deepEqual(result, {
    ok: true,
    errors: [],
    counts: { Português: 20, Matemática: 12, Legislação: 8, Específicos: 21 },
  });
  assert.equal(
    topicIndex(topics).get("Leg03").title,
    "LC 8/2003: provimento e vacância",
  );
});
test("test_topic_manifest_rejects_missing_or_duplicate_ids", async () => {
  const topics = await load();
  for (const invalid of [
    topics.filter((t) => t.id !== "Esp21"),
    [...topics, topics[0]],
    topics.map((t) => (t.id === "Esp21" ? { ...t, id: "Esp22" } : t)),
    topics.map((t) => (t.id === "Por01" ? { ...t, subject: "Matemática" } : t)),
    topics.map((t) => ({ ...t, officialSourceUrl: "" })),
  ]) {
    assert.equal(validateTopicManifest(invalid).ok, false);
    assert.throws(() => topicIndex(invalid));
  }
  assert.equal(validateTopicManifest(null).ok, false);
});
