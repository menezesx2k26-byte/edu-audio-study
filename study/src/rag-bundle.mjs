import {
  text,
  validDate,
  validUrl,
  isPublishableLesson,
  readSections,
  lessonHash,
} from "./lesson-contract.mjs";
import { sha256 } from "./exports.mjs";
export const NAMESPACE =
  "concursos/sc/sao-francisco-do-sul/camara/assistente-administrativo/2027/operacao-50-50";
const reference = (r) =>
  Object.fromEntries(
    [
      "id",
      "url",
      "articleOrSection",
      "revision",
      "verifiedAt",
      "primary",
      "validity",
      "validityCheckedAt",
    ].map((k) => [k, r[k] ?? null]),
  );
function splitText(content, max = 1800) {
  const chunks = [];
  let buffer = "";
  for (const word of content.split(/\s+/)) {
    if (buffer && buffer.length + word.length + 1 > max) {
      chunks.push(buffer);
      buffer = "";
    }
    buffer += (buffer ? " " : "") + word;
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}
export function makeRagBundle(lessons, namespace = NAMESPACE) {
  if (namespace !== NAMESPACE || !Array.isArray(lessons) || !lessons.length)
    throw new Error(
      "non-empty verified lessons and exact project namespace required",
    );
  if (lessons.some((l) => !isPublishableLesson(l)))
    throw new Error("unverified lesson");
  if (new Set(lessons.map((l) => l.topic.id)).size !== lessons.length)
    throw new Error("duplicate lesson/chunk identity");
  const ordered = [...lessons].sort((a, b) =>
      a.topic.id.localeCompare(b.topic.id),
    ),
    entries = [],
    chunks = [];
  for (const l of ordered) {
    const sourceHash = sha256(l.markdown),
      contentHash = lessonHash(l),
      sourceRefs = l.metadata.sourceRefs.map(reference);
    entries.push({
      topicId: l.topic.id,
      edition: l.metadata.edition,
      sourceRevision: l.topic.sourceRevision,
      sourceHash,
      contentHash,
      sourceRefs,
    });
    const sections = readSections(l.markdown);
    for (const section of [
      "Objetivo",
      "Cobertura do edital",
      "Teoria",
      "Exemplos resolvidos",
      "Distinções",
      "Recuperação sem consulta",
      "Revisões",
    ]) {
      for (const [index, text] of splitText(
        sections.get(section) ?? "",
      ).entries()) {
        const hash = sha256(text),
          sectionKey = section
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Za-z0-9]+/g, "-")
            .toLowerCase();
        chunks.push({
          id: `${namespace}/${l.topic.id}/${l.metadata.edition}/${sectionKey}/${index}-${hash.slice(0, 16)}`,
          namespace,
          topicId: l.topic.id,
          edition: l.metadata.edition,
          section,
          index,
          text,
          hash,
          sourceHash,
          sourceRefs,
        });
      }
    }
  }
  const manifest = {
    schemaVersion: 1,
    namespace,
    indexStatus: "staging",
    generatedAt: ordered
      .map((l) => l.metadata.updatedAt)
      .sort()
      .at(-1),
    sourceRevision: [...new Set(entries.map((e) => e.sourceRevision))].sort(),
    entries,
  };
  const bundle = {
    manifest,
    chunks,
    receipt: {
      indexed: false,
      entryCount: entries.length,
      chunkCount: chunks.length,
      bundleHash: sha256(JSON.stringify({ manifest, chunks })),
    },
  };
  verifyRagBundle(bundle);
  return bundle;
}
export function verifyRagBundle(b) {
  if (
    b?.manifest?.namespace !== NAMESPACE ||
    b.manifest.indexStatus !== "staging" ||
    b.receipt?.indexed !== false ||
    !Array.isArray(b.chunks) ||
    !b.chunks.length ||
    !Array.isArray(b.manifest.entries) ||
    !b.manifest.entries.length
  )
    throw new Error("invalid staging scope");
  const isHash = (value) =>
    typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  if (
    b.manifest.schemaVersion !== 1 ||
    !validDate(b.manifest.generatedAt) ||
    !Array.isArray(b.manifest.sourceRevision) ||
    !b.manifest.sourceRevision.length ||
    b.manifest.sourceRevision.some((revision) => !text(revision))
  )
    throw new Error("manifest provenance required");
  for (const entry of b.manifest.entries) {
    if (
      !text(entry.topicId) ||
      !text(entry.edition) ||
      !text(entry.sourceRevision) ||
      !isHash(entry.sourceHash) ||
      !isHash(entry.contentHash) ||
      !Array.isArray(entry.sourceRefs) ||
      !entry.sourceRefs.length ||
      new Set(entry.sourceRefs.map((r) => r?.id)).size !==
        entry.sourceRefs.length ||
      entry.sourceRefs.some(
        (r) =>
          !r ||
          !text(r.id) ||
          !validUrl(r.url) ||
          !text(r.articleOrSection) ||
          !text(r.revision) ||
          !validDate(r.verifiedAt),
      ) ||
      !b.chunks.some((c) => c.topicId === entry.topicId)
    )
      throw new Error("entry provenance required");
  }
  for (const chunk of b.chunks) {
    if (
      !text(chunk.id) ||
      !text(chunk.text) ||
      !text(chunk.edition) ||
      !text(chunk.section) ||
      !isHash(chunk.hash) ||
      !isHash(chunk.sourceHash) ||
      !Array.isArray(chunk.sourceRefs) ||
      !chunk.sourceRefs.length
    )
      throw new Error("chunk provenance required");
  }
  if (
    new Set(b.chunks.map((c) => c.id)).size !== b.chunks.length ||
    new Set(b.manifest.entries.map((e) => e.topicId)).size !==
      b.manifest.entries.length
  )
    throw new Error("duplicate identity");
  for (const c of b.chunks) {
    const entry = b.manifest.entries.find((e) => e.topicId === c.topicId);
    if (
      !entry ||
      c.namespace !== NAMESPACE ||
      !c.id.startsWith(`${NAMESPACE}/${c.topicId}/`) ||
      c.edition !== entry.edition ||
      c.sourceHash !== entry.sourceHash ||
      sha256(c.text) !== c.hash ||
      JSON.stringify(c.sourceRefs) !== JSON.stringify(entry.sourceRefs)
    )
      throw new Error("chunk integrity/provenance failure");
  }
  if (
    b.receipt.entryCount !== b.manifest.entries.length ||
    b.receipt.chunkCount !== b.chunks.length ||
    b.receipt.bundleHash !==
      sha256(JSON.stringify({ manifest: b.manifest, chunks: b.chunks }))
  )
    throw new Error("bundle receipt mismatch");
  return true;
}
