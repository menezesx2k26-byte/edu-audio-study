import test from "node:test";
import assert from "node:assert/strict";
import {
  auditQuestion,
  questionHash,
  questionsFromSheet,
  auditBank,
} from "../src/question-audit.mjs";
const topics = new Set(["Por01"]);
const q = () => ({
  id: "SYNTHETIC-Q1",
  subject: "Português",
  topicId: "Por01",
  stem: "Escolha o sentido contextual.",
  options: { A: "Um", B: "Dois", C: "Três", D: "Quatro", E: "Cinco" },
  answer: "A",
  rationale: "O sentido depende do contexto.",
  sourceUrl: "https://example.org/source",
  origin: "Autoral inédita",
  editorialStatus: "Revisada automaticamente",
  sourceRevision: "fixture-v1",
});
const review = (item) => ({
  questionId: item.id,
  kind: "human",
  reviewedBy: "synthetic-reviewer",
  reviewerApproval: true,
  reviewedAt: "2026-11-05",
  contentHash: questionHash(item),
  evidenceUrls: ["https://example.org/source"],
  correctOptionReason: "A satisfaz a condição.",
  wrongOptionReasons: {
    B: "B generaliza.",
    C: "C contradiz.",
    D: "D extrapola.",
    E: "E troca o sentido.",
  },
});
test("test_auto_review_is_not_editorial_approval", () => {
  assert.equal(auditQuestion(q(), topics).status, "hold");
  const x = q();
  x.editorialStatus = "Validada na fonte";
  assert.equal(auditQuestion(x, topics).status, "hold");
});
test("test_ambiguous_question_remains_on_hold", () => {
  const x = q();
  const r = review(x);
  r.ambiguous = true;
  assert.equal(auditQuestion(x, topics, r).status, "hold");
});
test("test_unknown_topic_id_is_rejected", () => {
  const x = q();
  x.topicId = "Por99";
  assert.equal(auditQuestion(x, topics, review(x)).status, "hold");
});
test("test_correct_option_requires_rationale_and_source", () => {
  for (const key of ["rationale", "sourceUrl"]) {
    const x = q();
    x[key] = "";
    assert.equal(auditQuestion(x, topics, review(x)).status, "hold");
  }
});
test("test_question_requires_five_unique_options", () => {
  for (const options of [
    { A: "Um", B: "Um", C: "Três", D: "Quatro", E: "Cinco" },
    { A: "Um", B: "Dois" },
  ]) {
    const x = { ...q(), options };
    assert.equal(auditQuestion(x, topics, review(x)).status, "hold");
  }
});
test("human review must explain every wrong option and match the current content", () => {
  const x = q();
  assert.equal(auditQuestion(x, topics, review(x)).status, "eligible");
  const r = review(x);
  delete r.wrongOptionReasons.E;
  assert.equal(auditQuestion(x, topics, r).status, "hold");
  const stale = review(x);
  x.stem += " Novo contexto.";
  assert.equal(auditQuestion(x, topics, stale).status, "hold");
});
test("sheet mapping uses exact headers and bank rejects duplicate IDs", () => {
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
      "SYNTHETIC-Q1",
      "Português",
      "Por01",
      "Texto",
      "A",
      "B",
      "C",
      "D",
      "E",
      "A",
      "Razão",
      "https://example.org/source",
      "Autoral inédita",
      "Revisada automaticamente",
    ],
  ];
  const items = questionsFromSheet(rows);
  assert.equal(items[0].topicId, "Por01");
  assert.equal(items[0].options.E, "E");
  assert.throws(() => questionsFromSheet([["ID"]]));
  const r = auditBank([q(), q()], topics);
  assert.equal(r.total, 2);
  assert.equal(r.eligible, 0);
  assert.ok(
    r.items.every((x) =>
      x.reasons.some((reason) => reason.includes("duplicate")),
    ),
  );
});
