import {readSections,exercises,lessonHash} from './lesson-contract.mjs';import {renderStudyPacket} from './exports.mjs';
export function buildChannelManifest(input){
 const topic=input.topic??input;let contentHash=null,edition=null;if(input.topic){renderStudyPacket(input);contentHash=lessonHash(input);edition=input.metadata.edition;}
 if(!/^(Por|Mat|Leg|Esp)\d{2}$/.test(topic?.id))throw new Error('invalid topic');
 return {topicId:topic.id,edition,contentHash,integrationStatus:'prepared',project:{sources:['reading.md','notebook-sources.md'],instructions:'study/prompts/project-professor.md',nativeStudyMode:false},studyMode:{packet:'study-packet.md',sources:['study-packet.md'],context:'regular-chat',instructions:'study/prompts/study-mode.md',postAttemptCorrection:'answer-key.md'},notebook:{sources:['reading.md','notebook-sources.md'],instructions:'Select relevant primary sources; request citations'},reader:{text:'reader.txt'}};
}
export function tutorTurn(lesson,input={}){
 renderStudyPacket(lesson);const sections=readSections(lesson.markdown),all=[...exercises(sections.get('Armadilha A/B')),...exercises(sections.get('Questões'))],exercise=all.find(q=>q.id===input.exerciseId);
 if(!exercise)throw new Error('unknown exercise');const options=[...exercise.body.matchAll(/^([A-E])\)/gm)].map(m=>m[1]);
 if((input.first&&!options.includes(input.first))||(input.second&&!options.includes(input.second))||(input.first&&input.first===input.second))throw new Error('distinct valid choices required');
 const base={topicId:lesson.topic.id,edition:lesson.metadata.edition,contentHash:lessonHash(lesson)};
 if(!input.first||!input.second||typeof input.reason!=='string'||!input.reason.trim())return {...base,phase:'attempt',exercise:{id:exercise.id,prompt:exercise.body},feedback:null};
 const answer=exercises(sections.get('Gabarito comentado')).find(a=>a.id===exercise.id).body;
 return {...base,phase:'feedback',exercise:{id:exercise.id,prompt:exercise.body},attempt:{exerciseId:exercise.id,first:input.first,second:input.second,reason:input.reason,correct:answer.match(/Correta:\s*([A-E])\./)[1]===input.first},feedback:answer,sourceRefs:lesson.metadata.sourceRefs};
}
export function tutorWrapup(lesson,turns){
 renderStudyPacket(lesson);const hash=lessonHash(lesson);if(!Array.isArray(turns))throw new Error('turns required');
 const attempts=turns.filter(t=>t.phase==='feedback');if(attempts.some(t=>t.contentHash!==hash||t.topicId!==lesson.topic.id||typeof t.attempt?.correct!=='boolean'))throw new Error('turn topic/revision mismatch');
 return {topicId:lesson.topic.id,edition:lesson.metadata.edition,questions:attempts.length||null,correct:attempts.length?attempts.filter(t=>t.attempt.correct).length:null,activeMinutes:null,doubts:attempts.filter(t=>!t.attempt.correct).map(t=>({exerciseId:t.attempt.exerciseId,first:t.attempt.first,second:t.attempt.second,reason:t.attempt.reason}))};
}
