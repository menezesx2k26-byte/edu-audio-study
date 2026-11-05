import { createHash } from "node:crypto";
import { text, validDate, validUrl } from "./lesson-contract.mjs";
const LETTERS = ["A", "B", "C", "D", "E"];
export function questionHash(q) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        Object.fromEntries(
          [
            "id",
            "subject",
            "topicId",
            "stem",
            "options",
            "answer",
            "rationale",
            "sourceUrl",
            "origin",
            "sourceRevision",
            "articleOrSection",
          ].map((k) => [k, q?.[k] ?? null]),
        ),
      ),
    )
    .digest("hex");
}
export function auditQuestion(q, topicIds, review) {
  const reasons = [];
  if (!q || typeof q !== "object")
    return { status: "hold", reasons: ["invalid question"] };
  for (const k of ["id", "subject", "stem", "rationale", "origin"])
    if (!text(q[k])) reasons.push(`missing ${k}`);
  if (!topicIds?.has(q.topicId)) reasons.push("unknown topicId");
  if (!validUrl(q.sourceUrl)) reasons.push("source required");
  const opts = LETTERS.map((k) => q.options?.[k]);
  if (
    opts.some((o) => !text(o)) ||
    Object.keys(q.options ?? {}).length !== 5 ||
    new Set(opts.map((o) => String(o).trim().toLocaleLowerCase("pt-BR")))
      .size !== 5
  )
    reasons.push("five unique options required");
  if (!LETTERS.includes(q.answer)) reasons.push("invalid answer");
  if (q.ambiguous === true || review?.ambiguous === true)
    reasons.push("ambiguous item");
  if (
    review?.kind !== "human" ||
    review?.reviewerApproval !== true ||
    !text(review?.reviewedBy) ||
    !validDate(review?.reviewedAt) ||
    review?.questionId !== q.id ||
    review?.contentHash !== questionHash(q)
  )
    reasons.push("human approval of current question required");
  if (
    !Array.isArray(review?.evidenceUrls) ||
    !review.evidenceUrls.length ||
    review.evidenceUrls.some((u) => !validUrl(u))
  )
    reasons.push("review evidence URLs required");
  if (
    !text(review?.correctOptionReason) ||
    LETTERS.filter((k) => k !== q.answer).some(
      (k) => !text(review?.wrongOptionReasons?.[k]),
    )
  )
    reasons.push("correct and all wrong option reasons required");
  return { status: reasons.length ? "hold" : "eligible", reasons };
}
export function questionsFromSheet(rows) {
  const headers = rows?.[0];
  const required = [
    "ID",
    "Disciplina",
    "Tópico edital",
    "Enunciado",
    ...LETTERS.map((k) => `Alternativa ${k}`),
    "Gabarito",
    "Comentário fundamentado",
    "Fonte principal",
    "Origem",
    "Situação editorial",
  ];
  if (
    !Array.isArray(headers) ||
    required.some((h) => headers.filter((x) => x === h).length !== 1)
  )
    throw new Error("missing or duplicate bank headers");
  return rows
    .slice(1)
    .filter((row) => row[headers.indexOf("ID")])
    .map((row) => {
      const get = (h) => row[headers.indexOf(h)] ?? null;
      return {
        id: get("ID"),
        subject: get("Disciplina"),
        topicId: get("Tópico edital"),
        stem: get("Enunciado"),
        options: Object.fromEntries(
          LETTERS.map((k) => [k, get(`Alternativa ${k}`)]),
        ),
        answer: get("Gabarito"),
        rationale: get("Comentário fundamentado"),
        sourceUrl: get("Fonte principal"),
        origin: get("Origem"),
        editorialStatus: get("Situação editorial"),
        sourceRevision: get("Versão da fonte"),
        articleOrSection: get("Referência normativa"),
        legacyHash: get("SHA256 do conteúdo"),
      };
    });
}
export function auditBank(questions, topicIds, reviews = []) {
  const counts = new Map();
  for (const q of questions) counts.set(q.id, (counts.get(q.id) ?? 0) + 1);
  const items = questions.map((q) => {
    const matches = reviews.filter((r) => r.questionId === q.id),
      r = auditQuestion(
        q,
        topicIds,
        matches.length === 1 ? matches[0] : undefined,
      );
    if (counts.get(q.id) > 1) {
      r.reasons.push("duplicate question ID");
      r.status = "hold";
    }
    return { id: q.id, topicId: q.topicId, contentHash: questionHash(q), ...r };
  });
  const eligible = items.filter((i) => i.status === "eligible").length;
  return {
    total: items.length,
    eligible,
    hold: items.length - eligible,
    items,
  };
}
