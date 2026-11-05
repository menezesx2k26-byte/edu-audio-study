import {readFile} from 'node:fs/promises';
import {auditBank,questionsFromSheet} from '../src/question-audit.mjs';
const file=process.argv[2];if(!file)throw new Error('Usage: audit-bank.mjs PRIVATE_SNAPSHOT.json [PRIVATE_REVIEWS.json]');
const snapshot=JSON.parse(await readFile(file,'utf8'));const topics=JSON.parse(await readFile(new URL('../data/edital-001-2026.topics.json',import.meta.url)));
const reviews=process.argv[3]?JSON.parse(await readFile(process.argv[3],'utf8')):[];
console.log(JSON.stringify(auditBank(questionsFromSheet(snapshot.values??snapshot),new Set(topics.map(t=>t.id)),reviews),null,2));
