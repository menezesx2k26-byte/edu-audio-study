# Material Mestre 50/50 — Design (proposto)
**Data:** 2026-11-04  
**Status:** proposta para aprovação antes de implementar  
**Projeto:** Câmara de São Francisco do Sul, Assistente Administrativo, FURB, edital 001/2026, prova 2027-01-24.

## Intenção e público
Construir uma biblioteca didática única para estudo individual, acompanhamento com ChatGPT como professor, sessões guiadas no Modo Estudar, escuta no ElevenReader/NotebookLM e recuperação no RAG da Operação 50/50. O aluno quer que a teoria seja detalhada e rigorosa, porém sem enchimento artificial: praticar especialmente a discriminação entre duas alternativas aparentemente corretas.

## Fontes existentes verificadas
- Verticalização do Anexo IV: **61 tópicos** identificados na planilha canônica; Português 20, Matemática 12, Legislação Municipal 8, Conhecimentos Específicos 21. Códigos preservados `Por01..20`, `Mat01..12`, `Leg01..08`, `Esp01..21`.
- Prova de 50 questões / 10 pontos: Específicos 25 × 0,25 = 6,25 (62,5%); Português 10 × 0,15 = 1,50 (15%); Legislação 10 × 0,15 = 1,50 (15%); Matemática 5 × 0,15 = 0,75 (7,5%).
- Banco de questões no Google Sheets informa 316 itens e cobertura dos 61 tópicos. O estado “Revisada automaticamente” **não** é aprovação editorial ou jurídica; nada entra no material final sem auditoria.
- Painel já existente contém, entre outras abas, `Banco de questões`, `Banco - cobertura`, `Sessões`, `Aprendizagem`, `Cobertura edital`, `Rotina e escuta` e `Evolução semanal`; é a fonte canônica da **performance**, não do texto didático.
- O projeto `edu-audio-study` já tem React/Vite, Express, upload de PDF/texto, biblioteca e TTS multi-provedor. Não reescrever o aplicativo ou ativar provedores pagos por padrão.
- Existem Plano Mestre e Plano Híbrido no Drive `sgtmenezes`, e staging de RAG. Índices de produção não foram confirmados como atualizados.

## Abordagens comparadas
1. **Apostila monolítica em PDF:** boa para imprimir; ruim para corrigir leis, rastrear revisões por assunto e reutilizar áudios.
2. **Biblioteca modular com fonte editorial única e múltiplas exportações (escolhida):** 61 unidades versionadas, consolidação por disciplina e pacotes específicos de tutoria, leitura, áudio e RAG; mais rigor inicial, mas evita divergência de versões.
3. **IA gerar capítulos e questões sob demanda, sem acervo canônico:** rápido no começo; pior para rastreabilidade, comparações e correção de erros, além de aumentar risco de afirmações inventadas.

## Arquitetura proposta
- Fonte de conteúdo didático **público e não pessoal**: `study/topics.json`, `study/modules/<ID>.md`, `study/sources/<ID>.json` no repositório. Conteúdo privado, histórico do aluno e exportações de desempenho permanecem restritos ao Drive/Sheets, não ao Git público.
- Módulos são arquivos pequenos, com contrato obrigatório: objetivo, cobertura exata do edital, teoria, bases normativas e data de vigência (quando aplicável), exemplos, diferenças de duas alternativas, exercícios de recuperação, questões de treino, justificativa de respostas, revisão D+1/D+7/D+21, referências e revisão editorial.
- Questões do Google Sheets permanecem canônicas no Sheets; exportação para materiais é um snapshot rastreável somente de itens verificados, com ID e revisão. Não duplicar dados do estudante.
- Exportador determinístico gera `reading.md`, `reader.txt`, `study-packet.md`, `notebook-sources.md`, `rag-manifest.json` e sumários. A fonte textual é única; saídas são derivadas, identificadas por hash/versão.
- **Estudar do ChatGPT** é um modo nativo disponível em conversas normais, **não** dentro de Projetos. Uma sessão guiada recebe pacote do tópico em conversa normal; o Projeto ChatGPT utiliza instruções e fontes do projeto. Não assumir sincronização automática entre os dois ambientes.
- ElevenReader e NotebookLM são destinos de material, não fontes de verdade. Usar geração/importação manual quando não houver integração autenticada. A PWA existente é opção de leitura em áudio, nunca pré-requisito.
- RAG: estágio documental verificado antes de indexação; promover BM25/vetor somente com receipts, citações, isolamento de namespace e rollback.
- Métricas: continuar no Google Sheets; ausente não é zero, conteúdo lido não é domínio, “questão revisada automaticamente” não é revisão validada.

## Ordem editorial
Piloto de **três unidades**: `Esp01` (Administração Pública), `Leg03` (provimento/vacância, com lei vigente comprovada), `Por01` (interpretação). Após aprovação de qualidade, lotes por prioridade: Específicos (21), Legislação (8), Português (20), Matemática (12). Matemática recebe diagnóstico para reduzir profundidade desnecessária sem omitir conteúdo do edital.

## Critérios de qualidade (Anti AI-Slop)
- Nenhum tópico recebe “concluído” sem cobertura rastreável no Anexo IV e fontes verificáveis.
- Explicações juridicamente relevantes devem apontar norma, artigo, versão e consulta. Não criar citações, jurisprudências, datas, gabaritos ou estatísticas.
- Questões autorais identificadas como autorais; questões históricas com origem e autorização de uso; comentário deve justificar o acerto e descartar a alternativa rival.
- Texto claro, exemplar e compacto; não repetir definições por preenchimento ou decorar a resposta antes do exercício.
- Sessões: primeiro tentar responder, depois receber pistas, explicação, correção e registro; insistir em raciocínio A/B.
- Custo incremental R$ 0; não ativar SaaS com overage, provedores TTS com cobrança, runners ou workloads pagos.
- Preservar o painel, projetos e histórico; idempotência, backup e nenhum segredo no repositório.

## Limites explicitamente assumidos
Esta fase entrega **planos**, não 61 capítulos finalizados. Não é possível confirmar aqui que o ChatGPT Project foi alimentado, que o Modo Estudar recebeu fontes, que o ElevenReader/NotebookLM importaram documentos ou que o RAG foi indexado. Esses estados exigem confirmação posterior, não mera existência de arquivos.

## Planos de execução separados
- `docs/superpowers/plans/2026-11-04-material-mestre-core.md`: conteúdo, validação, qualidade, piloto e 61 tópicos.
- `docs/superpowers/plans/2026-11-04-material-mestre-canais.md`: exportações, tutoria, Project, áudio, métricas e RAG.

## Referências primárias
- Edital/retificações: https://furb.selecao.net.br/informacoes/581/
- Modo Estudar: https://help.openai.com/pt-br/articles/11780217-using-study-mode-in-chatgpt
- Projetos: https://help.openai.com/pt-br/articles/10169521-projects-in-chatgpt
- Aplicativo de áudio existente: https://github.com/menezesx2k26-byte/edu-audio-study
