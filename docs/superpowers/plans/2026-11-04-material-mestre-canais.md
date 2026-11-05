# Material Mestre 50/50 — Canais, Tutoria, Áudio e RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Distribuir os módulos validados do Material Mestre para leitura, Projeto ChatGPT, sessões de tutoria, Modo Estudar, NotebookLM, ElevenReader/PWA e RAG staging, sem duplicar fontes nem inventar sincronização.

**Architecture:** Reaproveitar a biblioteca editorial versionada da Spec e do plano Core. Exportações são pacotes derivativos identificados por hash; o Google Sheets preexistente é o único registro de desempenho. Canais externos são tratados como integrações opcionais, cada um com estado verificável e capacidade de fallback a importação manual.

**Tech Stack:** Node.js ESM (testes nativos), Markdown/JSON/TXT, app existente Express + React/Vite, Google Drive/Sheets (conectores já autorizados, sem credenciais em repo), recursos externos por importação autorizada.

**Spec:** `docs/superpowers/specs/2026-11-04-material-mestre-50-50-design.md`  
**Dependency:** `docs/superpowers/plans/2026-11-04-material-mestre-core.md`, Tasks 1–3 para o piloto; Tasks 4–6 para publicação total.

## Global Constraints
- A fonte única dos capítulos é `study/modules/<ID>.md` após revisão; cada exportação inclui `topicId`, edição e proveniência.
- O Google Sheets existente contém as abas `Sessões`, `Aprendizagem`, `Cobertura edital`, `Rotina e escuta`, `Banco de questões`, `Evolução semanal`. Nunca recriar planilha nem sobrescrever dados históricos.
- O Modo Estudar é nativo do ChatGPT e **não funciona em Projetos**. São dois contextos; não afirmar sincronização automática. Instruções do Projeto e sessões em conversa normal são destinos distintos.
- Projeto ChatGPT pode usar arquivos/links de Drive compatíveis, mas a inclusão efetiva requer ação/checagem do ambiente. Não confundir link preparado com fonte realmente adicionada.
- NotebookLM e ElevenReader não têm nesta execução conexão operacional comprovada; gerar pacotes importáveis, não afirmar áudio ou notebook criado.
- A PWA `edu-audio-study` já recebe PDF/texto e toca áudio, mas provedores TTS podem cobrar: desabilitar invocação automática e exigir consentimento específico para qualquer custo.
- RAG staging não é índice produtivo; produção requer receipts, hashes, consultas de teste, isolamento e rollback.
- Nenhum dado pessoal no repositório público; sem tokens, PDFs restritos, desempenho individual ou nomes de estudantes. Custo incremental R$ 0.
- Preservar nomes de tópicos do manifest; priorização por pesos da prova (62,5/15/15/7,5), sem confundir o número de blocos com número de questões.

## Review Focus
1. **Resposta vazando antes do treino:** `test_study_packet_contains_no_answer_key` na Task 1.
2. **Conteúdo jurídico desatualizado:** `test_exports_reject_stale_legal_source` na Task 1.
3. **Modo Estudar dentro do Projeto:** `test_channel_manifest_separates_study_mode_from_project` na Task 2.
4. **Sessão sem data ou zero confundido com ausente:** `test_sheet_row_keeps_null_distinct_from_zero` na Task 4.
5. **Arquivo RAG sem proveniência:** `test_rag_manifest_requires_source_hash_and_scope` na Task 5.

---

### Task 1: Renderizar cinco formatos do mesmo tópico

**Files:**
- Create: `study/src/exports.mjs`
- Create: `study/tests/exports.test.mjs`
- Create: `study/scripts/export-topic.mjs`
- Modify: `package.json` (adicionar script `study:export`: `node study/scripts/export-topic.mjs`)

**Interfaces:**
- Consumes: `Topic`, `Lesson` e `isPublishableLesson` do plano Core.
- Produces:
  - `renderReading(lesson) -> string` (`reading.md`; teoria + exemplos + respostas em seção separada).
  - `renderStudyPacket(lesson) -> string` (`study-packet.md`; objetivos e exercícios SEM gabarito; respostas apenas em `answer-key.md` pós-sessão).
  - `renderAudio(lesson) -> string` (`reader.txt`; linguagem falada, pausas, sem URLs/tabelas e sem feedback prematuro).
  - `renderNotebookSources(lesson) -> string` (`notebook-sources.md`; fontes e referência a trechos).
  - `renderCitationIndex(lesson) -> object` (IDs, URLs, revisão e SHA-256).
- Outputs em `study/dist/<topicId>/<hash>/` (ignorado pelo Git, gerado somente com `status=verified`).

- [ ] **Step 1: Write failing tests** `test_study_packet_contains_no_answer_key`, `test_audio_has_no_raw_markdown_tables_or_urls`, `test_exports_are_deterministic_and_versioned`, `test_exports_reject_stale_legal_source`. Demonstrar que o pacote de treino contém questão mas não revela resposta.
- [ ] **Step 2: Run red.** `node --test study/tests/exports.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** os cinco renderizadores e script CLI `node study/scripts/export-topic.mjs Esp01`; usar módulo validado, exigir fonte, versão e hash; se `draft` abortar e listar problemas.
- [ ] **Step 4: Run green.** `node --test study/tests/exports.test.mjs`; expected PASS; `npm run study:export -- Esp01` deve criar os cinco formatos sem segredos. Conferir manualmente a fluidez do TXT em voz alta.
- [ ] **Step 5: Commit.** `git add study/src/exports.mjs study/tests/exports.test.mjs study/scripts/export-topic.mjs package.json && git commit -m "feat(study): exportar leitura, tutoria, áudio e fontes"`.

### Task 2: Pacote para Projeto ChatGPT e sessões com professor

**Files:**
- Create: `study/src/channel-manifest.mjs`
- Create: `study/tests/channel-manifest.test.mjs`
- Create: `study/prompts/project-professor.md`
- Create: `study/prompts/study-mode.md`
- Create: `study/prompts/lesson-wrapup.md`

**Interfaces:**
- Consumes: `study-packet.md`, `answer-key.md`, `reading.md`, referências da Task 1.
- Produces: `buildChannelManifest(topic) -> {project:{sources:string[],instructions:string},studyMode:{packet:string,context:"regular-chat"},notebook:{sources:string[]},reader:{text:string}}`.

- [ ] **Step 1: Write failing tests** `test_channel_manifest_separates_study_mode_from_project`, `test_teacher_prompt_asks_before_explaining`, `test_ab_dilemma_records_first_and_second_options`, `test_wrapup_does_not_invent_metrics`.
- [ ] **Step 2: Run red.** `node --test study/tests/channel-manifest.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** manifest e prompts: professor Socrático dentro do Projeto sem reivindicar Study Mode; modo Estudar em conversa normal com pacote enviado; pedir escolha A e alternativa rival antes de revelar gabarito; depois correção com fonte; encerrar com resumo com `topicId`, questões tentadas e dúvidas reais. Preparar instrução de inclusão de link de Drive **sem afirmar que foi instalado**.
- [ ] **Step 4: Run green.** `node --test study/tests/channel-manifest.test.mjs`; expected PASS; revisão humana dos prompts para ausência de resposta prematura e respeito aos limites de Projetos.
- [ ] **Step 5: Commit.** `git add study/src/channel-manifest.mjs study/tests/channel-manifest.test.mjs study/prompts && git commit -m "feat(study): separar projeto e sessões guiadas"`.

### Task 3: Leitura em áudio sem gasto obrigatório

**Files:**
- Create: `study/src/audio-import.mjs`
- Create: `study/tests/audio-import.test.mjs`
- Optionally modify **after inspection and approval**: `client/src/main.jsx`, `server/src/index.js` (usar API `POST /api/books/text` já existente; não reescrever biblioteca).
- Create: `study/docs/audio-manual-import.md`

**Interfaces:**
- Consumes: `reader.txt` da Task 1.
- Produces: `buildAudioImport({topicId,title,readerText}) -> {title:string,text:string,sourceTopicId:string}`; não inicia TTS.
- API existente sob autenticação do app: `POST /api/books/text` aceita `{title,text}`, caso usuário opte por importar na PWA. ElevenReader é destino manual alternativo.

- [ ] **Step 1: Write failing tests** `test_audio_import_preserves_topic_id`, `test_audio_import_never_calls_tts_provider`, `test_empty_audio_is_rejected`, `test_same_topic_hash_is_idempotent`.
- [ ] **Step 2: Run red.** `node --test study/tests/audio-import.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** payload, validação e guia ElevenReader/NotebookLM. Só integrar UI/backend se necessário e autorizado; default não chama Azure/Polly/ElevenLabs/OpenAI/Google TTS. Nenhuma operação de rede em teste.
- [ ] **Step 4: Run green.** `node --test study/tests/audio-import.test.mjs`; expected PASS. Smoke offline do texto importável; se UI alterada, `npm run build` precisa passar.
- [ ] **Step 5: Commit.** `git add study/src/audio-import.mjs study/tests/audio-import.test.mjs study/docs/audio-manual-import.md && git commit -m "feat(study): preparar leitura em áudio sem cobrança"`. Se UI alterada, adicionar os caminhos realmente modificados.

### Task 4: Registros de sessão compatíveis com Google Sheets

**Files:**
- Create: `study/src/session-record.mjs`
- Create: `study/tests/session-record.test.mjs`
- Create: `study/scripts/export-session-csv.mjs`

**Interfaces:**
- Consumes: evento pós-aula apenas com dados reais declarados ou aferidos; cabeçalhos existentes de `Sessões`: `ID sessão,Data,Disciplina,Tópico,Minutos líquidos,Questões,Acertos,Inéditas,Acertos inéditas,Origem,Natureza,Validação`.
- Produces: `validateStudySession(input) -> {valid:boolean,errors:string[]}` e `toExistingSheetRow(session) -> [string,string,string,string,number|null,number|null,number|null,number|null,number|null,string,string,string]`, exportação CSV para importação autorizada.

- [ ] **Step 1: Write failing tests** `test_sheet_row_matches_existing_12_headers`, `test_sheet_row_keeps_null_distinct_from_zero`, `test_minutos_passivos_nao_somam_ativos`, `test_duplicate_session_id_rejected`, `test_acertos_nao_excedem_questoes`.
- [ ] **Step 2: Run red.** `node --test study/tests/session-record.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** validador/serializador, com sessão ativa e exposição auditiva distinguidas em registros diferentes conforme as abas existentes. ID estável e datas ISO. **Não** adicionar colunas à planilha sem inspeção nova; não criar sync OAuth sem escopo e autorização.
- [ ] **Step 4: Run green.** `node --test study/tests/session-record.test.mjs`; expected PASS. Usar fixture com 5 questões, 4 acertos e 0 minuto passivo: esperado `Questões=5`, `Acertos=4`; campo ausente permanece vazio, não 0.
- [ ] **Step 5: Commit.** `git add study/src/session-record.mjs study/tests/session-record.test.mjs study/scripts/export-session-csv.mjs && git commit -m "feat(study): exportar sessões sem duplicar analytics"`.

### Task 5: RAG staging com proveniência e bloqueio de índice falso

**Files:**
- Create: `study/src/rag-bundle.mjs`
- Create: `study/tests/rag-bundle.test.mjs`
- Create: `study/scripts/export-rag-staging.mjs`

**Interfaces:**
- Consumes: lições verificadas, manifesto de fontes, hashes do Task 1.
- Produces: `makeRagBundle(lessons,namespace) -> {manifest:{namespace,generatedAt,sourceRevision,entries},chunks:object[]}`; namespace `concursos/sc/sao-francisco-do-sul/camara/assistente-administrativo/2027/operacao-50-50`.

- [ ] **Step 1: Write failing tests** `test_rag_manifest_requires_source_hash_and_scope`, `test_unverified_lesson_never_enters_bundle`, `test_no_personal_session_data_in_public_bundle`, `test_staging_is_not_marked_indexed`, `test_duplicate_chunk_ids_rejected`.
- [ ] **Step 2: Run red.** `node --test study/tests/rag-bundle.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** bundle determinístico, verificação SHA-256, citações e `indexStatus:"staging"`. Só promover a BM25/FAISS após execução real de indexador já existente, consultas de teste, receipt de integridade e plano de rollback; esse estágio **não** faz promoção.
- [ ] **Step 4: Run green.** `node --test study/tests/rag-bundle.test.mjs`; expected PASS, sem modificar snapshot privado existente.
- [ ] **Step 5: Commit.** `git add study/src/rag-bundle.mjs study/tests/rag-bundle.test.mjs study/scripts/export-rag-staging.mjs && git commit -m "feat(study): preparar RAG rastreável sem publicação"`.

### Task 6: Gate ponta a ponta do piloto

**Files:**
- Create: `study/tests/study-journey.test.mjs`
- Create: `study/docs/study-journey-checklist.md`
- Modify: `README.md` (apenas seção de navegação para fluxo didático; preservar o restante)

**Interfaces:**
- Consumes: pipeline editorial + exportações + canais + registros + RAG staging.
- Produces: guia e prova de que 1 tópico verificado pode ser: ler → praticar sem resposta → ouvir → corrigir → exportar registro → gerar pacote RAG staging.

- [ ] **Step 1: Write failing test** `test_one_topic_supports_read_study_audio_sheet_and_staging`. Asserções: mesmos `topicId` e revisão em todas saídas, gabarito ausente no pacote de estudo, sessão não vazia somente após tentativa, `rag.indexStatus=staging`.
- [ ] **Step 2: Run red.** `node --test study/tests/study-journey.test.mjs`; expected FAIL.
- [ ] **Step 3: Compose** fluxo e documentação com instruções para usar ChatGPT Project e Modo Estudar em contextos separados; nenhum gabarito de questão real sem fonte; marcador explícito de etapas **não conectadas**.
- [ ] **Step 4: Run green.** `npm run test:study && npm run build`; expected PASS, sem cobrança. Conferir manualmente os cinco exports do piloto e a precisão das fontes legais.
- [ ] **Step 5: Commit.** `git add study/tests/study-journey.test.mjs study/docs/study-journey-checklist.md README.md && git commit -m "docs(study): documentar fluxo híbrido e gate de entrega"`.

## Definition of Done — Canais
- Para um tópico validado, material de leitura, treino sem gabarito, áudio TXT, fontes NotebookLM, relatório de sessão e bundle RAG staging saem da mesma revisão.
- O aluno consegue escolher entre leitura própria e professor socrático sem dependência obrigatória de app externo.
- O Modo Estudar e o Projeto ChatGPT são descritos como ambientes distintos, não conectados automaticamente.
- Nenhuma chamada TTS com risco de cobrança é disparada por padrão.
- Sessão exportada compatível com a aba `Sessões`, com `null` preservado, sem mexer na planilha em produção.
- RAG `staging` não é anunciado como índice publicado; sem credenciais e sem dados pessoais no repo.
- Prova de qualidade do piloto aceita; expansão para 61 tópicos permanece objetivo separado, ligado ao plano Core.
