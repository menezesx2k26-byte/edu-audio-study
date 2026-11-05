import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  renderCollection,
  writeReadingCollection,
} from "../src/reading-collection.mjs";
import { fixtureLesson } from "./helpers/fixtures.mjs";
test("collection is deterministic, versioned and rejects draft editions", () => {
  const l = fixtureLesson();
  assert.equal(renderCollection([l]), renderCollection([l]));
  assert.match(renderCollection([l]), /Por01/);
  l.metadata.status = "draft";
  assert.throws(() => renderCollection([l]));
  assert.throws(() => renderCollection([]));
});
test("collection writes local HTML and a readable PDF without external services", async () => {
  const dir = await mkdtemp(join(tmpdir(), "study-pdf-"));
  try {
    const out = await writeReadingCollection([fixtureLesson()], dir, {
      pdf: true,
    });
    assert.deepEqual((await readdir(out.directory)).sort(), [
      "reading.html",
      "reading.md",
      "reading.pdf",
      "receipt.json",
    ]);
    assert.match(
      await readFile(join(out.directory, "reading.html"), "utf8"),
      /viewport/,
    );
    assert.equal(
      (await readFile(join(out.directory, "reading.pdf")))
        .subarray(0, 4)
        .toString(),
      "%PDF",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
