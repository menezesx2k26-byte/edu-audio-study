import {validateTopicManifest} from './topic-manifest.mjs';import {validateLesson,isPublishableLesson} from './lesson-contract.mjs';import {coverageReport} from './coverage.mjs';import {auditBank} from './question-audit.mjs';
export function validateRelease({topics,lessons=[],questions=[],questionReviews=[],requestedTopicIds}={}){
 const problems=[],evidence={validated:[],pending:[],blocked:[],coverage:null,questions:null};
 const manifest=validateTopicManifest(topics);if(!manifest.ok)return {allowed:false,problems:manifest.errors,evidence};
 try{evidence.coverage=coverageReport({topics,lessons});}catch(e){problems.push(e.message);}
 const ids=requestedTopicIds??topics.map(t=>t.id),known=new Set(topics.map(t=>t.id));
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!known.has(id)))return {allowed:false,problems:[...problems,'invalid requested topic scope'],evidence};
 for(const id of ids){const matches=lessons.filter(l=>l?.metadata?.topicId===id),l=matches[0];
  if(matches.length!==1){problems.push(`${id}: missing or duplicate lesson`);evidence.blocked.push({id,reasons:['missing or duplicate lesson']});continue;}
  const errors=validateLesson(l).errors,topic=topics.find(t=>t.id===id);if(Object.entries(topic).some(([k,v])=>l.topic?.[k]!==v))errors.push('canonical topic mismatch');
  if(!isPublishableLesson(l)||errors.length){if(l.metadata.status==='draft')evidence.pending.push(id);problems.push(`${id}: ${errors.join('; ')||'human review pending'}`);evidence.blocked.push({id,reasons:errors.length?errors:['human review pending']});}else evidence.validated.push(id);
 }
 const scopedQuestions=questions.filter(q=>ids.includes(q.topicId));if(scopedQuestions.length!==questions.length)problems.push('question outside requested topic scope');
 const audit=auditBank(questions,known,questionReviews);evidence.questions={total:audit.total,eligible:audit.eligible,hold:audit.hold};for(const item of audit.items)if(item.status!=='eligible')problems.push(`${item.id}: ${item.reasons.join('; ')}`);
 return {allowed:problems.length===0,problems,evidence};
}
