import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { questionsFromSheet, auditBank } from "../src/question-audit.mjs";
import { makeRagBundle, verifyRagBundle } from "../src/rag-bundle.mjs";
import {
  writeTopicExport,
  verifyExportReceipt,
  sha256,
} from "../src/exports.mjs";
import { buildStudyJourney } from "../src/study-journey.mjs";
import { writeReadingCollection } from "../src/reading-collection.mjs";
import { lessonHash } from "../src/lesson-contract.mjs";
import { fixtureLesson } from "./helpers/fixtures.mjs";

test("missing ID rows remain visible and held in bank audit", () => {
  const headers = [
    "ID",
    "Disciplina",
    "Tópico edital",
    "Enunciado",
    "Alternativa A",
    "Alternativa B",
    "Alternativa C",
    "Alternativa D",
    "Alternativa E",
    "Gabarito",
    "Comentário fundamentado",
    "Fonte principal",
    "Origem",
    "Situação editorial",
  ];
  const rows = [
    headers,
    [
      "",
      "Português",
      "Por01",
      "Questão sem identificação",
      "Um",
      "Dois",
      "Três",
      "Quatro",
      "Cinco",
      "A",
      "Fundamento",
      "https://example.org/source",
      "Autoral inédita",
      "Revisada automaticamente",
    ],
    [],
  ];
  const qs = questionsFromSheet(rows);
  assert.equal(qs.length, 1);
  assert.equal(qs[0].sourceRow, 2);
  const r = auditBank(qs, new Set(["Por01"]));
  assert.equal(r.total, 1);
  assert.equal(r.hold, 1);
  assert.ok(r.items[0].reasons.includes("missing id"));
});

test("self-consistent RAG checksums cannot replace mandatory provenance", () => {
  for (const remove of [
    "sourceHash",
    "sourceRefs",
    "contentHash",
    "sourceRevision",
  ]) {
    const b = makeRagBundle([fixtureLesson()]);
    for (const e of b.manifest.entries) delete e[remove];
    for (const c of b.chunks) delete c[remove];
    b.receipt.bundleHash = sha256(
      JSON.stringify({ manifest: b.manifest, chunks: b.chunks }),
    );
    assert.throws(() => verifyRagBundle(b), remove);
  }
  const b = makeRagBundle([fixtureLesson()]);
  b.manifest.entries[0].sourceRefs = [];
  for (const c of b.chunks) c.sourceRefs = [];
  b.receipt.bundleHash = sha256(
    JSON.stringify({ manifest: b.manifest, chunks: b.chunks }),
  );
  assert.throws(() => verifyRagBundle(b));
});

test("export receipt identity must match the citation artifact", async () => {
  const dir = await mkdtemp(join(tmpdir(), "receipt-identity-"));
  try {
    const out = await writeTopicExport(fixtureLesson(), dir);
    const path = join(out.directory, "receipt.json"),
      receipt = JSON.parse(await readFile(path));
    assert.equal((await verifyExportReceipt(out.directory)).topicId, "Por01");
    for (const patch of [
      { topicId: "Leg03" },
      { edition: "unrelated" },
      { contentHash: "not-a-hash" },
    ]) {
      await writeFile(path, JSON.stringify({ ...receipt, ...patch }));
      await assert.rejects(verifyExportReceipt(out.directory));
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("journey selects the first exercise admitted by the lesson contract", () => {
  const l = fixtureLesson();
  l.markdown = l.markdown.replaceAll("AB1", "AB01");
  l.metadata.editorialReview.contentHash = lessonHash(l);
  assert.equal(buildStudyJourney({ lesson: l }).turn.exercise.id, "AB01");
});

test("PDF keeps complete metadata and alternatives inside the page", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pdf-layout-"));
  try {
    const out = await writeReadingCollection([fixtureLesson()], dir, {
      pdf: true,
    });
    const script = `import json,fitz,sys\nd=fitz.open(sys.argv[1]);bad=[];texts=[]\nfor p in d:\n texts.append(p.get_text())\n for b in p.get_text('dict')['blocks']:\n  for l in b.get('lines',[]):\n   for s in l.get('spans',[]):\n    if s['bbox'][2]>p.rect.width-10 or s['bbox'][0]<10: bad.append(s['text'])\nprint(json.dumps({'overflow':bad,'text':'\\n'.join(texts)}))`;
    const result = spawnSync(
      "python",
      ["-c", script, join(out.directory, "reading.pdf")],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const pdf = JSON.parse(result.stdout);
    assert.deepEqual(pdf.overflow, []);
    assert.match(pdf.text, /\nA\)/);
    assert.match(pdf.text, /\nB\)/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
