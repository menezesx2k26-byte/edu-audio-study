import { topicIndex } from "./topic-manifest.mjs";
import { validateLesson, isPublishableLesson } from "./lesson-contract.mjs";
export function coverageReport({ topics, lessons = [] }) {
  const index = topicIndex(topics),
    byId = new Map();
  for (const lesson of lessons) {
    const id = lesson?.metadata?.topicId;
    if (!index.has(id)) throw new Error(`unknown lesson ID: ${id}`);
    byId.set(id, [...(byId.get(id) ?? []), lesson]);
  }
  const report = {
    total: 61,
    draft: 0,
    verified: 0,
    missingIds: [],
    invalidIds: [],
  };
  for (const topic of topics) {
    const ls = byId.get(topic.id);
    if (!ls) {
      report.missingIds.push(topic.id);
      continue;
    }
    const l = ls[0],
      sameTopic = Object.entries(topic).every(([k, v]) => l.topic?.[k] === v);
    if (ls.length !== 1 || !sameTopic || !validateLesson(l).ok) {
      report.invalidIds.push(topic.id);
      continue;
    }
    if (isPublishableLesson(l)) report.verified++;
    else report.draft++;
  }
  return report;
}
