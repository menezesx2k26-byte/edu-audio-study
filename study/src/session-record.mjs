import {text,validDate} from './lesson-contract.mjs';
export const SESSION_HEADERS=['ID sessão','Data','Disciplina','Tópico','Minutos líquidos','Questões','Acertos','Inéditas','Acertos inéditas','Origem','Natureza','Validação'];
const fields=['activeMinutes','questions','correct','newQuestions','newCorrect'];
function subjectOf(id){const m=/^(Por|Mat|Leg|Esp)(\d{2})$/.exec(id??'');if(!m)return null;const [subject,max]={Por:['Português',20],Mat:['Matemática',12],Leg:['Legislação',8],Esp:['Específicos',21]}[m[1]];return +m[2]>=1&&+m[2]<=max?subject:null;}
function safeString(s){return text(s)&&!/^\s*[=+@-]/.test(s)&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);}
export function validateStudySession(s,existingIds=new Set()){
 const errors=[];if(!s||typeof s!=='object')return {valid:false,errors:['session required']};
 for(const key of ['id','subject','topicId','origin','nature','validation'])if(!safeString(s[key]))errors.push(`invalid ${key}`);
 if(!validDate(s.date))errors.push('ISO date required');
 if(subjectOf(s.topicId)!==s.subject)errors.push('topic/subject mismatch');
 if(existingIds.has(s.id))errors.push('duplicate session ID');
 if(s.passiveMinutes!=null&&s.passiveMinutes!==0)errors.push('passive minutes belong only in Rotina e escuta');
 for(const key of fields)if(s[key]!=null&&(!Number.isInteger(s[key])||s[key]<0))errors.push(`invalid ${key}`);
 for(const [child,parent] of [['correct','questions'],['newQuestions','questions'],['newCorrect','newQuestions'],['newCorrect','correct']])if(s[child]!=null&&(s[parent]==null||s[child]>s[parent]))errors.push(`${child} exceeds or lacks ${parent}`);
 if(s.questions>0&&s.activeMinutes!=null&&s.activeMinutes<=0)errors.push('attempts require positive measured active minutes');
 return {valid:errors.length===0,errors};
}
export function toExistingSheetRow(s,existingIds){
 const r=validateStudySession(s,existingIds);if(!r.valid)throw new Error(r.errors.join('; '));
 const validation=s.validation==='VÁLIDO'&&(s.activeMinutes==null||s.activeMinutes<=0||s.questions==null||s.correct==null)?'PENDENTE':s.validation;
 return [s.id,s.date,s.subject,s.topicId,...fields.map(k=>s[k]??null),s.origin,s.nature,validation];
}
export function toListeningRow(s){
 if(!s||!validDate(s.date)||!subjectOf(s.topicId)||!['id','tool','validation'].every(k=>safeString(s[k]))||!Number.isInteger(s.minutes)||s.minutes<0)throw new Error('invalid listening event');
 return [s.id,s.date,s.tool,s.minutes,s.topicId,s.validation];
}
export function csvCell(value){if(value==null)return '';const str=String(value);if(typeof value==='string'&&!safeString(value))throw new Error('unsafe spreadsheet text');return /[",\r\n]/.test(str)?`"${str.replaceAll('"','""')}"`:str;}
export function sessionCsv(s,existingIds){return [SESSION_HEADERS,toExistingSheetRow(s,existingIds)].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';}
