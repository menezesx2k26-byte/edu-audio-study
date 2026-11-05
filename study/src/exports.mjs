import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  isPublishableLesson,
  validateLesson,
  lessonHash,
  readSections,
} from "./lesson-contract.mjs";
export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
function checked(l) {
  if (!/^(Por|Mat|Leg|Esp)\d{2}$/.test(l?.topic?.id) || !isPublishableLesson(l))
    throw new Error(
      `Lesson is not publishable: ${validateLesson(l).errors.join("; ") || "draft"}`,
    );
  return readSections(l.markdown);
}
const header = (l) =>
  `# ${l.topic.id} — ${l.topic.title}\n\nEdição: ${l.metadata.edition}  \nRevisão: ${l.metadata.updatedAt}  \nSHA-256 editorial:  \n\`${lessonHash(l)}\`\n`;
const body = (sections, names) =>
  names
    .filter((n) => sections.has(n))
    .map(
      (n) =>
        `## ${n}\n\n${sections
          .get(n)
          .replace(/\n(?=A\) )/g, "\n\n")
          .replace(/^([A-E]\).+)$/gm, "$1  ")}`,
    )
    .join("\n\n");
export function renderReading(l) {
  const s = checked(l);
  return (
    header(l) +
    "\n" +
    body(
      s,
      [...s.keys()].filter((n) => n !== "Gabarito comentado"),
    ) +
    "\n\n" +
    body(s, ["Gabarito comentado"]) +
    "\n"
  );
}
export function renderStudyPacket(l) {
  const s = checked(l);
  return (
    header(l) +
    "\nTente responder antes de consultar a correção. Registre a primeira escolha, a segunda opção e seu motivo.\n\n" +
    body(s, [
      "Objetivo",
      "Cobertura do edital",
      "Armadilha A/B",
      "Recuperação sem consulta",
      "Questões",
    ]) +
    "\n"
  );
}
export function renderAnswerKey(l) {
  const s = checked(l);
  return (
    header(l) +
    "\nCorreção pós-tentativa. Arquivo separado do pacote de estudo.\n\n" +
    body(s, ["Gabarito comentado", "Fontes"]) +
    "\n"
  );
}
export function renderAudio(l) {
  const s = checked(l);
  const narration = body(s, [
    "Objetivo",
    "Teoria",
    "Exemplos resolvidos",
    "Distinções",
    "Recuperação sem consulta",
    "Armadilha A/B",
    "Questões",
    "Revisões",
  ]);
  const clean = narration
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/[^\s<>]+/g, "")
    .replace(/\[S\d+\]/g, "")
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "")
    .replace(/\|/g, ". ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^([A-E])\)\s+/gm, "Alternativa $1. ")
    .replace(/D\+21/g, "vinte e um dias depois")
    .replace(/D\+7/g, "sete dias depois")
    .replace(/D\+1\b/g, "um dia depois")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `${l.topic.id}. ${l.topic.title}. Edição ${l.metadata.edition}.\n\n${clean}\n\nPause a leitura. Responda antes de abrir o arquivo separado de correção.\n`;
}
export function renderNotebookSources(l) {
  checked(l);
  return (
    header(l) +
    "\nSelecione as fontes pertinentes. Peça citações de trecho e limite as respostas ao material selecionado. Registre lacunas em vez de inventar fundamentos.\n\n" +
    l.metadata.sourceRefs
      .map(
        (r) =>
          `- [${r.id}] ${r.url}\n  Trecho: ${r.articleOrSection}. Revisão: ${r.revision}. Consulta: ${r.verifiedAt}.`,
      )
      .join("\n") +
    "\n\nPerguntas de recuperação: explique a distinção central; formule um contraexemplo; identifique a condição que elimina a alternativa rival.\n"
  );
}
export function renderCitationIndex(l) {
  checked(l);
  return {
    topicId: l.topic.id,
    edition: l.metadata.edition,
    updatedAt: l.metadata.updatedAt,
    sourceRevision: l.topic.sourceRevision,
    contentHash: lessonHash(l),
    markdownHash: sha256(l.markdown),
    references: l.metadata.sourceRefs.map((r) => ({
      ...r,
      referenceHash: sha256(JSON.stringify(r)),
    })),
    hashMeaning:
      "markdownHash hashes the canonical chapter; referenceHash hashes reference metadata, not remote source bytes",
  };
}
export function renderTopicFiles(l) {
  return {
    "reading.md": renderReading(l),
    "study-packet.md": renderStudyPacket(l),
    "answer-key.md": renderAnswerKey(l),
    "reader.txt": renderAudio(l),
    "notebook-sources.md": renderNotebookSources(l),
    "citations.json": JSON.stringify(renderCitationIndex(l), null, 2) + "\n",
  };
}
export async function writeTopicExport(l, root) {
  const files = renderTopicFiles(l),
    contentHash = lessonHash(l),
    directory = join(root, l.topic.id, contentHash);
  const receipt = {
    topicId: l.topic.id,
    edition: l.metadata.edition,
    contentHash,
    preparedAt: l.metadata.updatedAt,
    status: "prepared",
    artifacts: Object.entries(files).map(([name, data]) => ({
      name,
      sha256: sha256(data),
      bytes: Buffer.byteLength(data),
    })),
  };
  await mkdir(directory, { recursive: true });
  for (const [name, data] of Object.entries(files))
    await writeFile(join(directory, name), data);
  await writeFile(
    join(directory, "receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  return { directory, topicId: l.topic.id, contentHash };
}
export async function verifyExportReceipt(directory) {
  const receipt = JSON.parse(
    await readFile(join(directory, "receipt.json"), "utf8"),
  );
  if (
    !Array.isArray(receipt.artifacts) ||
    receipt.artifacts.length !== 6 ||
    new Set(receipt.artifacts.map((a) => a.name)).size !== 6
  )
    throw new Error("invalid artifact inventory");
  const expected = new Set([
    "reading.md",
    "study-packet.md",
    "answer-key.md",
    "reader.txt",
    "notebook-sources.md",
    "citations.json",
  ]);
  for (const item of receipt.artifacts) {
    if (!expected.has(item.name)) throw new Error("unsafe artifact name");
    const data = await readFile(join(directory, item.name));
    if (sha256(data) !== item.sha256 || data.length !== item.bytes)
      throw new Error(`integrity failure: ${item.name}`);
  }
  const citations = JSON.parse(
    await readFile(join(directory, "citations.json"), "utf8"),
  );
  if (
    !/^[a-f0-9]{64}$/.test(receipt.contentHash) ||
    !/^(Por|Mat|Leg|Esp)\d{2}$/.test(receipt.topicId) ||
    typeof receipt.edition !== "string" ||
    !receipt.edition.trim() ||
    ["topicId", "edition", "contentHash"].some(
      (key) => receipt[key] !== citations[key],
    )
  ) {
    throw new Error("receipt identity mismatch");
  }
  return receipt;
}
