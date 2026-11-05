import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { renderReading, sha256 } from "./exports.mjs";
import { lessonHash } from "./lesson-contract.mjs";
export function renderCollection(lessons) {
  if (
    !Array.isArray(lessons) ||
    !lessons.length ||
    new Set(lessons.map((l) => l.topic.id)).size !== lessons.length
  )
    throw new Error("non-empty unique lessons required");
  const priority = {
    Específicos: 0,
    Legislação: 1,
    Português: 2,
    Matemática: 3,
  };
  return [...lessons]
    .sort(
      (a, b) =>
        priority[a.topic.subject] - priority[b.topic.subject] ||
        a.topic.id.localeCompare(b.topic.id),
    )
    .map(renderReading)
    .join("\n\n---\n\n");
}
function run(binary, args) {
  const r = spawnSync(binary, args, {
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (r.error || r.status !== 0)
    throw new Error(`${binary}: ${r.error?.message ?? r.stderr.slice(-1000)}`);
  return r.stdout;
}
export async function writeReadingCollection(
  lessons,
  root,
  { pdf = false } = {},
) {
  const markdown = renderCollection(lessons),
    hash = sha256(markdown),
    directory = resolve(root, hash);
  await mkdir(directory, { recursive: true });
  const md = join(directory, "reading.md");
  await writeFile(md, markdown);
  let html = run("pandoc", [
    "--from=gfm-raw_html",
    "--to=html5",
    "--standalone",
    "--metadata",
    "title=Material Mestre — leitura",
    md,
  ]);
  html = html.replace(
    "</head>",
    '<meta name="viewport" content="width=device-width, initial-scale=1"><style>body{max-width:78ch;margin:2rem auto;padding:0 1rem;font:17px/1.65 system-ui,sans-serif;overflow-wrap:anywhere}h1,h2,h3{line-height:1.2;break-after:avoid}pre{white-space:pre-wrap}table{display:block;overflow:auto}a{overflow-wrap:anywhere}@page{size:A4;margin:16mm}@media print{body{font-size:11pt;margin:0;padding:0}h1{break-before:page}h1:first-of-type{break-before:auto}}</style></head>',
  );
  await writeFile(join(directory, "reading.html"), html);
  const names = ["reading.md", "reading.html"];
  if (pdf) {
    run("pandoc", [
      "--from=gfm-raw_html",
      "--pdf-engine=xelatex",
      "--variable",
      "papersize=a4",
      "--variable",
      "geometry:margin=18mm",
      "--variable",
      "mainfont=DejaVu Serif",
      "--variable",
      "monofont=DejaVu Sans Mono",
      "--output",
      join(directory, "reading.pdf"),
      md,
    ]);
    names.push("reading.pdf");
  }
  const artifacts = [];
  for (const name of names) {
    const bytes = await readFile(join(directory, name));
    artifacts.push({ name, sha256: sha256(bytes), bytes: bytes.length });
  }
  await writeFile(
    join(directory, "receipt.json"),
    JSON.stringify(
      {
        status: "prepared",
        collectionHash: hash,
        chapters: lessons.map((l) => ({
          topicId: l.topic.id,
          edition: l.metadata.edition,
          contentHash: lessonHash(l),
        })),
        artifacts,
      },
      null,
      2,
    ) + "\n",
  );
  return { directory, collectionHash: hash };
}
