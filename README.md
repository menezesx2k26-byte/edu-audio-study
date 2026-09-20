# 🎧 Gabriel Audio Study

PWA privada para transformar PDFs e textos em áudio de estudo, com geração sob demanda, biblioteca local e fallback entre múltiplos provedores de TTS.

A ideia é simples: **abrir o material, gerar o áudio e estudar sem precisar gerenciar MP3 manualmente**.

## ✨ Funcionalidades

- autenticação simples por `APP_SECRET`;
- upload de PDF;
- entrada por texto colado;
- divisão automática em partes;
- geração de áudio sob demanda;
- armazenamento persistente no servidor;
- biblioteca de materiais;
- player integrado;
- continuação automática entre partes;
- fallback entre provedores de voz;
- deploy via Docker/Render.

## 🧠 Pipeline de TTS

A ordem é configurável por variável de ambiente.

Exemplo recomendado:

```text
Azure Speech
   ↓
Amazon Polly
   ↓
ElevenLabs
   ↓
OpenAI TTS
```

Google Cloud TTS também pode ser habilitado como provider opcional.

A aplicação ignora provedores sem credenciais válidas e tenta os próximos candidatos configurados.

## 🔊 Provedores suportados

- Microsoft Azure Speech;
- Amazon Polly;
- ElevenLabs;
- OpenAI TTS;
- Google Cloud Text-to-Speech.

## 🧱 Arquitetura

```text
client/    PWA e player
server/    API, autenticação, TTS e storage
Dockerfile
render.yaml
```

Em produção, o servidor Express entrega a API e também a build do cliente.

## 🚀 Desenvolvimento local

Instale cliente e servidor:

```bash
npm run install:all
```

Crie a configuração do backend:

```bash
cp server/.env.example server/.env
```

Inicie o servidor:

```bash
npm run dev:server
```

Em outro terminal:

```bash
npm run dev:client
```

Frontend padrão:

```text
http://localhost:5173
```

## 🔐 Autenticação

A variável:

```env
APP_SECRET=uma_senha_privada
```

define a senha usada para entrar na aplicação.

Não existe senha padrão no repositório.

Se `APP_SECRET` não estiver configurado no ambiente de produção, o login não funcionará corretamente.

## ⚙️ Variáveis principais

### Aplicação

```env
APP_SECRET=
CORS_ORIGIN=
PORT=3001
TTS_PROVIDER_ORDER=azure,polly,elevenlabs,openai
```

### Azure Speech

```env
AZURE_SPEECH_KEYS=
AZURE_SPEECH_REGIONS=brazilsouth
AZURE_SPEECH_VOICES=pt-BR-FranciscaNeural,pt-BR-AntonioNeural
AZURE_SPEECH_OUTPUT_FORMAT=audio-24khz-160kbitrate-mono-mp3
```

### Amazon Polly

```env
AWS_POLLY_ACCESS_KEY_IDS=
AWS_POLLY_SECRET_ACCESS_KEYS=
AWS_POLLY_REGIONS=us-east-1
AWS_POLLY_VOICES=Camila
AWS_POLLY_ENGINE=generative
```

### ElevenLabs

```env
ELEVENLABS_API_KEYS=
ELEVENLABS_VOICE_IDS=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

### OpenAI

```env
OPENAI_API_KEYS=
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=marin
```

### Google Cloud TTS

```env
GOOGLE_TTS_CREDENTIALS_B64=
GOOGLE_TTS_LANGUAGE_CODE=pt-BR
GOOGLE_TTS_AUDIO_ENCODING=MP3
```

## ❤️ Health check

Depois do deploy:

```text
/health
```

O endpoint informa o estado do serviço e a ordem efetiva de candidatos de TTS sem expor chaves privadas.

## 💾 Persistência

Em Docker/produção, mantenha armazenamento persistente em:

```text
/app/server/storage
```

Os áudios são gerenciados pela aplicação; não é necessário organizar arquivos manualmente.

## ☁️ Deploy

O repositório inclui:

- `Dockerfile`;
- `render.yaml`;
- configuração para servir frontend e backend no mesmo domínio.

Fluxo recomendado:

```bash
npm run build
npm start
```

## 🔒 Segurança

- nunca commitar API keys;
- nunca commitar `APP_SECRET`;
- manter credenciais somente no ambiente do servidor;
- revisar CORS antes de expor o app;
- tratar storage como conteúdo privado.

## 🗺️ Evolução possível

- geração antecipada das próximas partes;
- estimativa de custo antes de lotes grandes;
- modos aula/resumo/revisão;
- suporte a EPUB;
- cache por hash;
- banco SQLite/Postgres;
- object storage externo quando o acervo crescer.

---

**Status:** MVP funcional, multi-provider e pronto para evolução. 🎙️