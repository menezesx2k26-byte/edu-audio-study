import {sha256} from './exports.mjs';
export function buildAudioImport({topicId,title,readerText}={}){
 if(!/^(Por|Mat|Leg|Esp)\d{2}$/.test(topicId)||typeof title!=='string'||!title.trim()||typeof readerText!=='string'||!readerText.trim())throw new Error('topicId, title and non-empty readerText required');
 return {title:`[${topicId}] ${title.trim()} — ${sha256(readerText).slice(0,12)}`,text:readerText,sourceTopicId:topicId};
}
