import test from 'node:test';import assert from 'node:assert/strict';import {buildAudioImport} from '../src/audio-import.mjs';
const data={topicId:'Por01',title:'Interpretação',readerText:'Texto próprio. Pausa para recuperar.'};
test('test_audio_import_preserves_topic_id',()=>{const p=buildAudioImport(data);assert.equal(p.sourceTopicId,'Por01');assert.match(p.title,/^\[Por01\]/);assert.equal(p.text,data.readerText);});
test('test_audio_import_never_calls_tts_provider',()=>{const original=globalThis.fetch;globalThis.fetch=()=>{throw new Error('network forbidden');};try{assert.equal(typeof buildAudioImport(data).text,'string');}finally{globalThis.fetch=original;}});
test('test_empty_audio_is_rejected',()=>{assert.throws(()=>buildAudioImport({...data,readerText:' '}));assert.throws(()=>buildAudioImport({...data,topicId:'../private'}));});
test('test_same_topic_hash_is_idempotent',()=>{assert.deepEqual(buildAudioImport(data),buildAudioImport(data));assert.notEqual(buildAudioImport(data).title,buildAudioImport({...data,readerText:'Texto diferente.'}).title);});
