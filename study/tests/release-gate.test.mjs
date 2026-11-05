import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateRelease } from "../src/release-gate.mjs";
import { fixtureLesson } from "./helpers/fixtures.mjs";
import { lessonHash } from "../src/lesson-contract.mjs";
const topics = JSON.parse(
  await readFile(
    new URL("../data/edital-001-2026.topics.json", import.meta.url),
  ),
);
const pilot = () => ["Esp01", "Leg03", "Por01"].map(fixtureLesson);
const release = (lessons, extra = {}) =>
  validateRelease({
    topics,
    lessons,
    questions: [],
    requestedTopicIds: ["Esp01", "Leg03", "Por01"],
    ...extra,
  });
test("test_release_rejects_draft_lesson", () => {
  const ls = pilot();
  ls[0].metadata.status = "draft";
  assert.equal(release(ls).allowed, false);
});
test("test_release_rejects_unreviewed_question", () => {
  assert.equal(
    release(pilot(), { questions: [{ id: "UNREVIEWED", topicId: "Por01" }] })
      .allowed,
    false,
  );
});
test("test_pilot_can_publish_with_3_verified_topics", () => {
  const r = release(pilot());
  assert.equal(r.allowed, true);
  assert.equal(r.evidence.validated.length, 3);
  assert.equal(r.evidence.coverage.total, 61);
});
test("test_full_release_requires_all_61_topics", () => {
  assert.equal(
    validateRelease({ topics, lessons: pilot(), questions: [] }).allowed,
    false,
  );
  const lessons = topics.map((t) => {
    const l = fixtureLesson(t.id);
    l.topic = t;
    l.markdown = l.markdown.replace(
      "Tópico sintético de teste.",
      t.title + ".",
    );
    l.metadata.editorialReview.contentHash = lessonHash(l);
    return l;
  });
  assert.equal(
    validateRelease({ topics, lessons, questions: [] }).allowed,
    true,
  );
});
test("missing, empty or duplicate requested scopes and duplicate lessons fail closed", () => {
  for (const ids of [
    [],
    ["Por99"],
    ["Por01", "Por01"],
    ["Esp01", "Leg03", "Por01", "Por02"],
  ])
    assert.equal(release(pilot(), { requestedTopicIds: ids }).allowed, false);
  assert.equal(release([...pilot(), fixtureLesson()]).allowed, false);
});
