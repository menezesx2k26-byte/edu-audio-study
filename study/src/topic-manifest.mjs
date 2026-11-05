const GROUPS = [
  ["Por", "Português", 20],
  ["Mat", "Matemática", 12],
  ["Leg", "Legislação", 8],
  ["Esp", "Específicos", 21],
];
export function validateTopicManifest(topics) {
  const errors = [],
    counts = Object.fromEntries(GROUPS.map(([, name]) => [name, 0]));
  if (!Array.isArray(topics))
    return { ok: false, errors: ["topics must be an array"], counts };
  const expected = new Map(
      GROUPS.flatMap(([prefix, subject, n]) =>
        Array.from({ length: n }, (_, i) => [
          `${prefix}${String(i + 1).padStart(2, "0")}`,
          subject,
        ]),
      ),
    ),
    seen = new Set();
  for (const t of topics) {
    if (!t || typeof t !== "object") {
      errors.push("invalid topic");
      continue;
    }
    if (seen.has(t.id)) errors.push(`duplicate ID: ${t.id}`);
    seen.add(t.id);
    if (expected.get(t.id) !== t.subject)
      errors.push(`unknown ID or subject mismatch: ${t.id}`);
    if (Object.hasOwn(counts, t.subject)) counts[t.subject]++;
    for (const key of ["title", "sourceRevision"])
      if (typeof t[key] !== "string" || !t[key].trim())
        errors.push(`${t.id}: missing ${key}`);
    try {
      if (!["https:", "http:"].includes(new URL(t.officialSourceUrl).protocol))
        throw Error();
    } catch {
      errors.push(`${t.id}: invalid officialSourceUrl`);
    }
  }
  for (const id of expected.keys())
    if (!seen.has(id)) errors.push(`missing ID: ${id}`);
  if (topics.length !== 61) errors.push("expected 61 topics");
  return { ok: errors.length === 0, errors, counts };
}
export function topicIndex(topics) {
  const r = validateTopicManifest(topics);
  if (!r.ok) throw new Error(r.errors.join("; "));
  return new Map(topics.map((t) => [t.id, t]));
}
