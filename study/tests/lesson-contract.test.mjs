import test from "node:test";
import assert from "node:assert/strict";
import {
  validateLesson,
  isPublishableLesson,
  lessonHash,
} from "../src/lesson-contract.mjs";
import { fixtureLesson } from "./helpers/fixtures.mjs";
test("test_verified_legal_lesson_requires_versioned_primary_source", () => {
  const good = fixtureLesson("Leg03");
  assert.equal(isPublishableLesson(good), true);
  for (const patch of [
    { revision: "" },
    { primary: false },
    { verifiedAt: "" },
    { validity: "superseded" },
    { validityCheckedAt: "" },
    { articleOrSection: "" },
  ]) {
    const l = fixtureLesson("Leg03");
    Object.assign(l.metadata.sourceRefs[0], patch);
    assert.equal(isPublishableLesson(l), false);
  }
});
test("test_publishable_lesson_has_answer_rationale", () => {
  const l = fixtureLesson();
  assert.equal(validateLesson(l).ok, true);
  l.markdown = l.markdown.replace("Critério decisivo:", "Nota:");
  assert.equal(validateLesson(l).ok, false);
});
test("test_draft_never_passes_publish_gate", () => {
  const l = fixtureLesson();
  l.metadata.status = "draft";
  assert.equal(validateLesson(l).ok, true);
  assert.equal(isPublishableLesson(l), false);
});
test("human approval is bound to exact content and metadata", () => {
  const l = fixtureLesson();
  l.markdown += "\nMudança após revisão.";
  assert.equal(isPublishableLesson(l), false);
  const auto = fixtureLesson();
  auto.metadata.editorialReview.kind = "automatic";
  assert.equal(isPublishableLesson(auto), false);
  const missing = fixtureLesson();
  delete missing.metadata.editorialReview;
  assert.equal(isPublishableLesson(missing), false);
});
test("missing coverage, false citations and empty sections fail structural validation", () => {
  for (const edit of [
    (s) => s.replace("## Cobertura do edital", "## Outro"),
    (s) => s.replace("## Teoria\nTexto de referência [S1].", "## Teoria\n"),
    (s) => s.replace("[S1]", "[S99]"),
  ]) {
    const l = fixtureLesson();
    l.markdown = edit(l.markdown);
    assert.equal(validateLesson(l).ok, false);
  }
});
test("every exercise requires a matching answer and distinct rival", () => {
  for (const edit of [
    (s) => s.replace("### Q1\nCorreta:", "### Q9\nCorreta:"),
    (s) => s.replaceAll("Rival: B.", "Rival: A."),
    (s) => s.replace("E) Quinta.", "E) Primeira."),
  ]) {
    const l = fixtureLesson();
    l.markdown = edit(l.markdown);
    assert.equal(validateLesson(l).ok, false);
  }
});
