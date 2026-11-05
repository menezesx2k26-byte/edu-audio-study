import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  buildStudyJourney,
  writeChannelPackage,
} from "../src/study-journey.mjs";
import { fixtureLesson } from "./helpers/fixtures.mjs";
import { verifyRagBundle } from "../src/rag-bundle.mjs";
test("test_one_topic_supports_read_study_audio_sheet_and_staging", () => {
  const l = fixtureLesson();
  const j = buildStudyJourney({
    lesson: l,
    attempt: {
      exerciseId: "Q1",
      first: "A",
      second: "B",
      reason: "O escopo é decisivo.",
    },
    session: {
      id: "SYNTHETIC-JOURNEY",
      date: "2026-11-05",
      activeMinutes: 5,
      origin: "TESTE",
      nature: "TESTE",
      validation: "TESTE",
    },
  });
  assert.equal(j.provenance.topicId, "Por01");
  assert.equal(j.channels.edition, j.provenance.edition);
  assert.match(j.reading, /Por01/);
  assert.doesNotMatch(j.studyPacket, /SENTINELA_GABARITO_TESTE/);
  assert.match(j.answerKey, /SENTINELA_GABARITO_TESTE/);
  assert.equal(j.audioImport.sourceTopicId, "Por01");
  assert.match(j.sessionCsv, /,5,1,1,,,TESTE,TESTE,TESTE/);
  assert.equal(j.rag.manifest.indexStatus, "staging");
  assert.equal(verifyRagBundle(j.rag), true);
});
test("no session record exists before an actual attempt", () => {
  const j = buildStudyJourney({ lesson: fixtureLesson() });
  assert.equal(j.sessionCsv, null);
  assert.equal(j.turn.phase, "attempt");
  assert.equal(j.turn.feedback, null);
});
test("channel package includes prompts, split corrections and integrity receipt", async () => {
  const dir = await mkdtemp(join(tmpdir(), "study-channels-"));
  try {
    const out = await writeChannelPackage(fixtureLesson(), dir);
    const manifest = JSON.parse(
      await readFile(join(out.directory, "channels.json")),
    );
    assert.equal(manifest.integrationStatus, "prepared");
    assert.equal(manifest.studyMode.context, "regular-chat");
    assert.match(
      await readFile(
        join(out.directory, "study/prompts/study-mode.md"),
        "utf8",
      ),
      /conversa normal/,
    );
    const receipt = JSON.parse(
      await readFile(join(out.directory, "receipt.json")),
    );
    assert.ok(receipt.artifacts.some((a) => a.name === "audio-import.json"));
    assert.ok(receipt.artifacts.some((a) => a.name === "answer-key.md"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
