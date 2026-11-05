import {createHash} from 'node:crypto';
export const REQUIRED_SECTIONS=['Objetivo','Cobertura do edital','Teoria','Exemplos resolvidos','Distinções','Armadilha A/B','Recuperação sem consulta','Questões','Gabarito comentado','Revisões','Fontes'];
export const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export const validUrl=s=>{try{return ['https:','http:'].includes(new URL(s).protocol);}catch{return false;}};
export const text=s=>typeof s==='string'&&s.trim().length>0;
export function readSections(markdown){
 const sections=new Map();let current=null,fence=null,buffer=[];
 const flush=()=>{if(current!==null){if(sections.has(current))throw new Error(`duplicate section: ${current}`);sections.set(current,buffer.join('\n').trim());}};
 for(const line of String(markdown).split('\n')){
  const mark=line.match(/^\s*(`{3,}|~{3,})/);if(mark){if(!fence)fence=mark[1][0];else if(mark[1][0]===fence)fence=null;}
  const heading=!fence&&line.match(/^## (.+?)\s*$/);
  if(heading){flush();current=heading[1];buffer=[];}else buffer.push(line);
 }
 if(fence)throw new Error('unclosed code fence');flush();return sections;
}
export function exercises(section=''){
 return [...section.matchAll(/^### ((?:AB|Q)\d+)\s*\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(m=>({id:m[1],body:m[2].trim()}));
}
export function lessonHash({topic,markdown,metadata={}}){
 const {editorialReview,status,reviewedBy,...contentMetadata}=metadata;
 return createHash('sha256').update(JSON.stringify({topic,markdown,metadata:contentMetadata})).digest('hex');
}
export function requiresPrimarySource(topic){return /^Leg/.test(topic?.id)||['Esp01','Esp07','Esp08','Esp10','Esp11','Esp12','Esp19','Esp21'].includes(topic?.id);}
export function validateLesson({topic,markdown,metadata:m}={}){
 const errors=[];if(!topic||!text(markdown)||!m)return {ok:false,errors:['topic, markdown and metadata required']};
 if(m.topicId!==topic.id)errors.push('topicId mismatch');
 if(!['draft','verified'].includes(m.status))errors.push('invalid status');
 if(!validDate(m.updatedAt)||!text(m.edition)||!text(m.qualityNotes))errors.push('edition, updatedAt and qualityNotes required');
 let sections;try{sections=readSections(markdown);}catch(e){return {ok:false,errors:[e.message]};}
 for(const title of REQUIRED_SECTIONS)if(!text(sections.get(title)))errors.push(`missing or empty section: ${title}`);
 const coverage=sections.get('Cobertura do edital')??'';if(!coverage.includes(topic.id)||!coverage.includes(topic.title))errors.push('exact topic coverage required');
 const refs=Array.isArray(m.sourceRefs)?m.sourceRefs:[],ids=new Set();
 if(!refs.length)errors.push('sourceRefs required');
 for(const r of refs){if(!text(r.id)||ids.has(r.id)||!validUrl(r.url)||!text(r.articleOrSection)||!text(r.revision))errors.push('invalid/duplicate source reference');ids.add(r.id);}
 for(const citation of markdown.matchAll(/\[(S\d+)\]/g))if(!ids.has(citation[1]))errors.push(`unknown citation: ${citation[1]}`);
 for(const section of ['Teoria','Exemplos resolvidos','Distinções','Gabarito comentado']){
  const linked=m.sectionSources?.[section];if(!Array.isArray(linked)||!linked.length||linked.some(id=>!ids.has(id)||!(sections.get(section)??'').includes(`[${id}]`)))errors.push(`unlinked section: ${section}`);
 }
 const prompts=(sections.get('Recuperação sem consulta')??'').match(/^\d+\.\s+\S/gm)??[];if(prompts.length<5)errors.push('five recall prompts required');
 const ab=exercises(sections.get('Armadilha A/B')),qs=exercises(sections.get('Questões')),answers=exercises(sections.get('Gabarito comentado'));
 if(ab.length<2||!qs.length)errors.push('two A/B exercises and questions required');
 const seen=new Set();
 for(const ex of [...ab,...qs]){
  if(seen.has(ex.id))errors.push(`duplicate exercise: ${ex.id}`);seen.add(ex.id);
  const opts=[...ex.body.matchAll(/^([A-E])\)\s+(.+)$/gm)];const n=ex.id.startsWith('AB')?2:5;
  if(opts.length!==n||new Set(opts.map(m=>m[1])).size!==n||new Set(opts.map(m=>m[2].trim().toLocaleLowerCase('pt-BR'))).size!==n)errors.push(`invalid options: ${ex.id}`);
  const matches=answers.filter(a=>a.id===ex.id),answer=matches[0]?.body??'',correct=answer.match(/Correta:\s*([A-E])\.\s+\S/),rival=answer.match(/Rival:\s*([A-E])\.\s+\S/);
  if(matches.length!==1||!correct||!rival||correct[1]===rival[1]||!opts.some(o=>o[1]===correct?.[1])||!opts.some(o=>o[1]===rival?.[1])||!/Critério decisivo:\s+\S/.test(answer)||!refs.some(r=>answer.includes(`[${r.id}]`)))errors.push(`missing answer rationale: ${ex.id}`);
 }
 if(answers.some(a=>!seen.has(a.id)))errors.push('answer without matching exercise');
 for(const day of ['D+1','D+7','D+21'])if(!(sections.get('Revisões')??'').includes(day))errors.push(`missing revision: ${day}`);
 if(m.status==='verified'){
  const r=m.editorialReview;
  if(!text(m.reviewedBy)||r?.kind!=='human'||r?.approved!==true||!validDate(r?.reviewedAt)||r?.contentHash!==lessonHash({topic,markdown,metadata:m}))errors.push('human approval of exact content required');
  if(refs.some(r=>!validDate(r.verifiedAt)))errors.push('sources must be verified');
  if(requiresPrimarySource(topic)&&(!refs.some(r=>r.primary===true)||refs.filter(r=>r.primary===true).some(r=>r.validity!=='current'||!validDate(r.validityCheckedAt))))errors.push('current versioned primary source required');
 }
 return {ok:errors.length===0,errors};
}
export function isPublishableLesson(lesson){return lesson?.metadata?.status==='verified'&&validateLesson(lesson).ok;}
