import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { coverageReport } from "../src/coverage.mjs";
import { fixtureLesson } from "./helpers/fixtures.mjs";
const topics = JSON.parse(
  await readFile(
    new URL("../data/edital-001-2026.topics.json", import.meta.url),
  ),
);
test("test_coverage_reports_missing_not_zero", () => {
  const r = coverageReport({ topics, lessons: [] });
  assert.equal(r.total, 61);
  assert.equal(r.verified, 0);
  assert.equal(r.missingIds.length, 61);
  assert.ok(r.missingIds.includes("Leg03"));
});
test("test_total_61_does_not_change_with_lessons", () => {
  const r = coverageReport({ topics, lessons: [fixtureLesson()] });
  assert.equal(r.total, 61);
  assert.equal(r.verified, 1);
  assert.equal(r.missingIds.length, 60);
});
test("test_only_verified_counts_as_completed", () => {
  const l = fixtureLesson();
  l.metadata.status = "draft";
  const r = coverageReport({ topics, lessons: [l] });
  assert.equal(r.draft, 1);
  assert.equal(r.verified, 0);
  l.metadata.status = "verified";
  l.markdown += " changed";
  assert.equal(coverageReport({ topics, lessons: [l] }).verified, 0);
});
test("duplicate and unknown lesson IDs never inflate coverage", () => {
  const r = coverageReport({
    topics,
    lessons: [fixtureLesson(), fixtureLesson()],
  });
  assert.equal(r.verified, 0);
  assert.deepEqual(r.invalidIds, ["Por01"]);
  assert.throws(() =>
    coverageReport({ topics, lessons: [fixtureLesson("Por99")] }),
  );
});
