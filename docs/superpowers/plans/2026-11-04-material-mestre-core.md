# Material Mestre 50/50 — Núcleo Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma biblioteca de 61 unidades fiéis ao edital FURB, com qualidade verificável e sem publicar questões não auditadas.

**Architecture:** Manter conteúdo público didático, metadados e validadores em `study/` deste repositório; conservar respostas individuais e métricas exclusivamente no Google Sheets privado já existente. O pipeline de qualidade produz unidades independentes que os exportadores de outro plano podem distribuir por leitura, áudio e tutoria.

**Tech Stack:** Node.js ESM (`node:test`, `node:assert/strict`, `fs/promises`, `crypto`); Markdown + JSON; Google Sheets como origem de questões e progresso; Google Docs/Drive para publicação validada. Sem novas dependências de produção.

**Spec:** `docs/superpowers/specs/2026-11-04-material-mestre-50-50-design.md`

## Global Constraints
- Edital 001/2026 FURB; cargo Assistente Administrativo, prova 24/01/2027; mudanças e retificações devem invalidar trechos afetados.
- **61 blocos:** Português 20, Matemática 12, Legislação 8, Específicos 21, mantendo IDs `Por01..20`, `Mat01..12`, `Leg01..08`, `Esp01..21`.
- **Pesos reais:** Específicos 25 × 0,25; Português 10 × 0,15; Legislação 10 × 0,15; Matemática 5 × 0,15; total 10,00.
- Banco de questões já informa **316 itens**, mas “Revisada automaticamente” NÃO equivale a revisão editorial humana.
- O conteúdo publicado no Git público não inclui histórico pessoal, nome, resultados, IDs privados, tokens ou PDFs de terceiros sem autorização.
- R$ 0 de custo incremental; sem provedores TTS pagos, novos workers/servidores obrigatórios ou acesso não autorizado a contas.
- Originalidade, precisão e Anti AI-Slop. Conteúdo legal exige fonte e data de vigência; não inventar lei, jurisprudência ou questões FURB.
- Verificação red-green-refactor por tarefa; commits pequenos; não alterar a planilha de desempenho, o RAG privado nem o app ativo neste plano.

## Review Focus
1. **ID duplicado/ausente:** `test_topic_manifest_rejects_missing_or_duplicate_ids` na Task 1.
2. **Alteração normativa:** `test_verified_legal_lesson_requires_versioned_primary_source` na Task 2.
3. **Duas alternativas plausíveis:** `test_ambiguous_question_remains_on_hold` na Task 4.
4. **Item aprovado só por máquina:** `test_auto_review_is_not_editorial_approval` na Task 4.
5. **Capítulo publicado sem gabarito/explicação:** `test_publishable_lesson_has_answer_rationale` na Task 2.

---

### Task 1: Congelar espelho versionado dos 61 tópicos

**Files:**
- Create: `study/data/edital-001-2026.topics.json`
- Create: `study/src/topic-manifest.mjs`
- Test: `study/tests/topic-manifest.test.mjs`
- Modify: `package.json` (adicionar `test:study`: `node --test study/tests/*.test.mjs`)

**Interfaces:**
- Consumes: tabela `Cobertura edital` do Sheet existente e Anexo IV oficial (conferir versão e retificações antes do snapshot).
- Produces: `validateTopicManifest(topics: Topic[]) -> {ok:boolean, errors:string[], counts:Record<string,number>}` e `topicIndex(topics: Topic[]) -> Map<string,Topic>`. `Topic={id,subject,title,officialSourceUrl,sourceRevision}`.

- [ ] **Step 1: Write failing tests** in `study/tests/topic-manifest.test.mjs`: `test_topic_manifest_has_61_ids_and_20_12_8_21_counts` and `test_topic_manifest_rejects_missing_or_duplicate_ids`. Asserções: `counts={Português:20,Matemática:12,Legislação:8,Específicos:21}`, 61 IDs distintos, fonte não vazia, ausência de `Esp21` falha.
- [ ] **Step 2: Run red.** `node --test study/tests/topic-manifest.test.mjs`; expected FAIL because validator/manifest not implemented.
- [ ] **Step 3: Implement** `validateTopicManifest` and `topicIndex`, and populate JSON from the 61 rows reais do Sheet, preservando IDs, títulos e URL de fonte. As fontes são **dados**, não comandos executáveis. Não copiar campos individuais.
- [ ] **Step 4: Run green.** `node --test study/tests/topic-manifest.test.mjs`; expected PASS. Conferir por inspeção 5 IDs distribuídos pelas quatro disciplinas contra o Anexo IV.
- [ ] **Step 5: Commit.** `git add study/data/edital-001-2026.topics.json study/src/topic-manifest.mjs study/tests/topic-manifest.test.mjs package.json && git commit -m "feat(study): versionar mapa de 61 tópicos do edital"`.

### Task 2: Contrato editorial e regras de publicação

**Files:**
- Create: `study/src/lesson-contract.mjs`
- Create: `study/tests/lesson-contract.test.mjs`
- Create: `study/templates/lesson.md`
- Create: `study/templates/lesson.meta.json`

**Interfaces:**
- Consumes: `Topic` do Task 1 e par `<ID>.md` + `<ID>.meta.json` de módulo.
- Produces: `validateLesson({topic,markdown,metadata}) -> {ok:boolean, errors:string[]}`, `isPublishableLesson({topic,markdown,metadata}) -> boolean`.
- Metadados obrigatórios: `topicId`, `status` (`draft|verified`), `updatedAt`, `reviewedBy` (identificador editorial, não dado pessoal), `sourceRefs` (`[{url,articleOrSection,verifiedAt,revision}]`), `qualityNotes`.

- [ ] **Step 1: Write failing tests** `test_verified_legal_lesson_requires_versioned_primary_source`, `test_publishable_lesson_has_answer_rationale`, `test_draft_never_passes_publish_gate`. Estrutura mínima: `## Objetivo`, `## Teoria`, `## Exemplos resolvidos`, `## Armadilha A/B`, `## Recuperação sem consulta`, `## Questões`, `## Gabarito comentado`, `## Revisões`, `## Fontes`.
- [ ] **Step 2: Run red.** `node --test study/tests/lesson-contract.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** os validadores; para `Leg*` e capítulos específicos de Direito, `verified` exige norma/artigo ou trecho, revisão editorial explícita e data da fonte. Exigir comentário que distinga alternativa correta e rival; erros e conflitos deixam status `draft`.
- [ ] **Step 4: Run green.** `node --test study/tests/lesson-contract.test.mjs`; expected PASS, incluindo exemplos que falham por fonte não verificada.
- [ ] **Step 5: Commit.** `git add study/src/lesson-contract.mjs study/tests/lesson-contract.test.mjs study/templates && git commit -m "feat(study): adicionar gate editorial e rastreabilidade"`.

### Task 3: Piloto de três unidades com auditoria cruzada

**Files:**
- Create: `study/modules/Esp01.md`, `study/modules/Esp01.meta.json`
- Create: `study/modules/Leg03.md`, `study/modules/Leg03.meta.json`
- Create: `study/modules/Por01.md`, `study/modules/Por01.meta.json`
- Test: `study/tests/pilot-lessons.test.mjs`

**Interfaces:**
- Consumes: manifest e `isPublishableLesson`.
- Produces: primeiro conjunto de módulos legíveis e auditáveis; cada capítulo com teoria, exemplos, pelo menos 2 contrastes A/B, 5 prompts de evocação, questões e explicações (sem revelar resposta antes do exercício em modo tutoria).

- [ ] **Step 1: Write failing tests** `test_pilot_covers_exact_three_ids`, `test_each_pilot_lesson_has_citations_and_ab_exercises`, `test_no_source_claim_without_reference`. O último usa vínculo obrigatório de seção e URL; inspeção humana verifica a exatidão jurídica.
- [ ] **Step 2: Run red.** `node --test study/tests/pilot-lessons.test.mjs`; expected FAIL, arquivos ausentes.
- [ ] **Step 3: Write lessons** de `Esp01` (Administração Pública), `Leg03` (provimento/vacância na lei municipal vigente) e `Por01` (interpretação). Verificar alterações normativas e citar fontes oficiais; produzir exemplos novos, não paráfrases vagas. Marcar `draft` enquanto revisão humana não concluída.
- [ ] **Step 4: Run green and editorial review.** `node --test study/tests/pilot-lessons.test.mjs` + `node --test study/tests/lesson-contract.test.mjs`; expected PASS. Verificar todo enunciado jurídico e revisar questões potencialmente ambíguas antes de mudar `status` para `verified`.
- [ ] **Step 5: Commit.** `git add study/modules/Esp01.* study/modules/Leg03.* study/modules/Por01.* study/tests/pilot-lessons.test.mjs && git commit -m "content(study): piloto auditado de três módulos"`.

### Task 4: Auditoria dos itens preexistentes (316 reportados)

**Files:**
- Create: `study/src/question-audit.mjs`
- Create: `study/tests/question-audit.test.mjs`
- Create: `study/templates/question-review.json`
- Create: `study/docs/question-review-protocol.md`

**Interfaces:**
- Consumes: snapshots exportados **somente para leitura** das colunas existentes `ID`, `Disciplina`, `Tópico edital`, `Enunciado`, `Alternativa A..E`, `Gabarito`, `Comentário fundamentado`, `Fonte principal`, `Origem`, `Situação editorial`. Gabaritos reais FURB nunca substituídos por inferência.
- Produces: `auditQuestion(question: Question, topicIds: Set<string>, review?: EditorialReview) -> {status:"hold"|"eligible",reasons:string[]}`. `EditorialReview={questionId,reviewedAt,evidenceUrls,correctOptionReason,wrongOptionReasons,reviewerApproval}`.

- [ ] **Step 1: Write failing tests** `test_auto_review_is_not_editorial_approval`, `test_ambiguous_question_remains_on_hold`, `test_unknown_topic_id_is_rejected`, `test_correct_option_requires_rationale_and_source`, `test_question_requires_five_unique_options`. Assert `status:"hold"` para `Situação editorial:"Revisada automaticamente"` sem `reviewerApproval`.
- [ ] **Step 2: Run red.** `node --test study/tests/question-audit.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** checker sem alterar a planilha. Registrar por ID quais itens precisam revisão; exigir justificativa de por que uma resposta concorrente está errada. Questão genuinamente ambígua permanece `hold`, nunca “corrigida” só por IA.
- [ ] **Step 4: Run green.** `node --test study/tests/question-audit.test.mjs`; expected PASS. Com snapshot temporário, emitir contagem elegível/retida, **sem promover 316 itens automaticamente**.
- [ ] **Step 5: Commit.** `git add study/src/question-audit.mjs study/tests/question-audit.test.mjs study/templates/question-review.json study/docs/question-review-protocol.md && git commit -m "feat(study): auditar banco antes de publicar"`.

### Task 5: Expandir para os 61 tópicos por lotes com gates

**Files:**
- Create/update: `study/modules/<ID>.md` e `study/modules/<ID>.meta.json` para todos os IDs do manifest.
- Create: `study/src/coverage.mjs`
- Test: `study/tests/coverage.test.mjs`

**Interfaces:**
- Consumes: `validateLesson` do Task 2, manifest Task 1 e revisão Task 4.
- Produces: `coverageReport({topics,lessons}) -> {total:61,draft:number,verified:number,missingIds:string[]}`.

- [ ] **Step 1: Write failing tests** `test_coverage_reports_missing_not_zero`, `test_total_61_does_not_change_with_lessons`, `test_only_verified_counts_as_completed`.
- [ ] **Step 2: Run red.** `node --test study/tests/coverage.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** relatório; expandir em quatro lotes de disciplina: Específicos 21, Legislação 8, Português 20, Matemática 12. Priorizar os capítulos de maior retorno sem declarar distribuição histórica por subtema. Revisar lote por lote com fontes, exemplos e objeções A/B; na lei local conferir texto vigente em cada lote.
- [ ] **Step 4: Run green at each batch.** `npm run test:study`; expected PASS; `coverageReport` deve mostrar 61 IDs totais, cada um com estado auditável. Para DoD completo: `verified===61` e `missingIds.length===0`; antes disso informar cobertura parcial, sem maquiagem.
- [ ] **Step 5: Commit each batch** com `git add study/modules study/src/coverage.mjs study/tests/coverage.test.mjs && git commit -m "content(study): ampliar cobertura auditada do edital"` (mensagem específica por lote é preferível).

### Task 6: Gate de publicação editorial

**Files:**
- Create: `study/scripts/validate-all.mjs`
- Create: `study/tests/release-gate.test.mjs`
- Modify: `package.json` (adicionar `study:validate` = `node study/scripts/validate-all.mjs`)

**Interfaces:**
- Consumes: `coverageReport`, `isPublishableLesson`, `auditQuestion`.
- Produces: `validateRelease({topics,lessons,questions}) -> {allowed:boolean,problems:string[],evidence:{...}}`; `allowed` exige pacote válido do lote solicitado, sem obrigar 61 tópicos para publicar o piloto.

- [ ] **Step 1: Write failing tests** `test_release_rejects_draft_lesson`, `test_release_rejects_unreviewed_question`, `test_pilot_can_publish_with_3_verified_topics`, `test_full_release_requires_all_61_topics`.
- [ ] **Step 2: Run red.** `node --test study/tests/release-gate.test.mjs`; expected FAIL.
- [ ] **Step 3: Implement** gate para publicações parciais explícitas e edição completa. Relatório de saída deve separar `validated`, `pending`, `blocked`, com IDs e referências; **nunca** afirmar que uma questão apenas “revisada automaticamente” foi validada.
- [ ] **Step 4: Run green.** `npm run test:study && npm run study:validate`; expected PASS para fixtures válidas; nenhum pacote inválido aprovado.
- [ ] **Step 5: Commit.** `git add study/scripts/validate-all.mjs study/tests/release-gate.test.mjs package.json && git commit -m "feat(study): impor gate de publicação do material"`.

## Definition of Done — Núcleo
- `study:validate` e `test:study` passam, sem chamadas a API paga.
- Inventário possui 61 IDs/categorias corretos e base de edital rastreável.
- Três capítulos piloto podem ser lidos e auditados; todos os 61 só são “completos” após revisão individual.
- Itens não verificados do banco não são distribuídos como gabaritos definitivos.
- Não há informação pessoal nem tokens em Git público.
- A planilha existente e os RAGs permanecem intactos nesta fase.
