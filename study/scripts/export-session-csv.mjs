import { readFile } from "node:fs/promises";
import { sessionCsv } from "../src/session-record.mjs";
if (!process.argv[2])
  throw new Error(
    "Usage: export-session-csv.mjs PRIVATE_SESSION.json [PRIVATE_EXISTING_IDS.json]",
  );
const session = JSON.parse(await readFile(process.argv[2], "utf8"));
const existingIds = new Set(
  process.argv[3] ? JSON.parse(await readFile(process.argv[3], "utf8")) : [],
);
process.stdout.write(sessionCsv(session, existingIds));
