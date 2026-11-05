import test from "node:test";
import assert from "node:assert/strict";
import {
  makeRagBundle,
  verifyRagBundle,
  NAMESPACE,
} from "../src/rag-bundle.mjs";
import { fixtureLesson } from "./helpers/fixtures.mjs";
test("test_rag_manifest_requires_source_hash_and_scope", () => {
  const b = makeRagBundle([fixtureLesson()], NAMESPACE);
  assert.equal(verifyRagBundle(b), true);
  assert.match(b.manifest.entries[0].sourceHash, /^[a-f0-9]{64}$/);
  assert.ok(
    b.chunks.every((c) => c.sourceRefs.length && c.namespace === NAMESPACE),
  );
  assert.throws(() => makeRagBundle([fixtureLesson()], "another-contest"));
  assert.deepEqual(makeRagBundle([fixtureLesson()], NAMESPACE), b);
});
test("test_unverified_lesson_never_enters_bundle", () => {
  const l = fixtureLesson();
  l.metadata.status = "draft";
  assert.throws(() => makeRagBundle([l], NAMESPACE));
  assert.throws(() => makeRagBundle([], NAMESPACE));
});
test("test_no_personal_session_data_in_public_bundle", () => {
  const l = fixtureLesson();
  l.sessions = [{ email: "private@example.org", minutes: 50 }];
  const b = makeRagBundle([l], NAMESPACE);
  assert.doesNotMatch(
    JSON.stringify(b),
    /private@example.org|sessions|minutes/,
  );
  assert.doesNotMatch(
    JSON.stringify(b.chunks),
    /SENTINELA_GABARITO_TESTE|Correta:/,
  );
});
test("test_staging_is_not_marked_indexed", () => {
  const b = makeRagBundle([fixtureLesson()], NAMESPACE);
  assert.equal(b.manifest.indexStatus, "staging");
  assert.equal(b.receipt.indexed, false);
});
test("test_duplicate_chunk_ids_rejected", () => {
  assert.throws(() =>
    makeRagBundle([fixtureLesson(), fixtureLesson()], NAMESPACE),
  );
  const b = makeRagBundle([fixtureLesson()], NAMESPACE);
  b.chunks.push(b.chunks[0]);
  assert.throws(() => verifyRagBundle(b));
});
test("tampered text and provenance fail integrity verification", () => {
  for (const mutate of [
    (b) => {
      b.chunks[0].text += " changed";
    },
    (b) => {
      b.chunks[0].sourceHash = "0".repeat(64);
    },
    (b) => {
      b.manifest.entries[0].sourceRefs[0].url = "https://evil.example";
    },
  ]) {
    const b = makeRagBundle([fixtureLesson()], NAMESPACE);
    mutate(b);
    assert.throws(() => verifyRagBundle(b));
  }
});
