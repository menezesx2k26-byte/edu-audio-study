import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import {
  renderReading,
  renderStudyPacket,
  renderAudio,
  renderAnswerKey,
  renderCitationIndex,
  renderTopicFiles,
  sha256,
} from "./exports.mjs";
import {
  buildChannelManifest,
  tutorTurn,
  tutorWrapup,
} from "./channel-manifest.mjs";
import { buildAudioImport } from "./audio-import.mjs";
import { sessionCsv } from "./session-record.mjs";
import { makeRagBundle } from "./rag-bundle.mjs";
export function buildStudyJourney({ lesson, attempt = null, session = null }) {
  const provenance = renderCitationIndex(lesson),
    channels = buildChannelManifest(lesson),
    reading = renderReading(lesson),
    studyPacket = renderStudyPacket(lesson),
    readerText = renderAudio(lesson),
    answerKey = renderAnswerKey(lesson);
  const turn = tutorTurn(lesson, attempt ?? { exerciseId: "AB1" }),
    wrapup = tutorWrapup(lesson, [turn]);
  const csv =
    turn.phase === "feedback" && session
      ? sessionCsv({
          ...session,
          topicId: lesson.topic.id,
          subject: lesson.topic.subject,
          questions: wrapup.questions,
          correct: wrapup.correct,
          newQuestions: session.newQuestions ?? null,
          newCorrect: session.newCorrect ?? null,
        })
      : null;
  return {
    provenance,
    channels,
    reading,
    studyPacket,
    readerText,
    answerKey,
    turn,
    sessionCsv: csv,
    audioImport: buildAudioImport({
      topicId: lesson.topic.id,
      title: lesson.topic.title,
      readerText,
    }),
    rag: makeRagBundle([lesson]),
  };
}
export async function writeChannelPackage(lesson, root) {
  const journey = buildStudyJourney({ lesson }),
    files = {
      ...renderTopicFiles(lesson),
      "channels.json": JSON.stringify(journey.channels, null, 2) + "\n",
      "audio-import.json": JSON.stringify(journey.audioImport, null, 2) + "\n",
    };
  for (const name of [
    "project-professor.md",
    "study-mode.md",
    "lesson-wrapup.md",
  ])
    files[`study/prompts/${name}`] = await readFile(
      new URL(`../prompts/${name}`, import.meta.url),
      "utf8",
    );
  const directory = join(root, lesson.topic.id, journey.provenance.contentHash);
  await mkdir(directory, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    await mkdir(dirname(join(directory, name)), { recursive: true });
    await writeFile(join(directory, name), data);
  }
  const receipt = {
    topicId: lesson.topic.id,
    edition: lesson.metadata.edition,
    contentHash: journey.provenance.contentHash,
    status: "prepared",
    artifacts: Object.entries(files).map(([name, data]) => ({
      name,
      sha256: sha256(data),
      bytes: Buffer.byteLength(data),
    })),
  };
  await writeFile(
    join(directory, "receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  return {
    directory,
    topicId: lesson.topic.id,
    contentHash: journey.provenance.contentHash,
  };
}
