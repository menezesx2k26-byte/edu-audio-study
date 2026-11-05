# Percurso híbrido e condições de entrega

## Estado da edição

Não há capítulo aprovado por humano nesta fase. Esp01 e Por01 são rascunhos substanciais para revisão. Leg03 permanece bloqueado: a recuperação integral do estatuto consolidado retornou HTTP 403 e o portal da Câmara apresentou captcha/503; o compêndio IPRESF de 2022 não comprova vigência atual. Não foi criada uma versão resumida de lei para preencher essa lacuna. A expansão editorial fica bloqueada conforme a decisão do usuário de trabalhar sem revisor nesta fase.

## Uso dos materiais disponíveis

Abra os Markdown em modules para leitura e revisão, observando os rótulos de rascunho. Use um leitor Markdown no celular ou computador. Eles ainda não podem ser exportados como edição aprovada. O contrato exige objetivo, cobertura, teoria, exemplos, distinções, treino A/B, evocação, questões, correção fundamentada, revisões e fontes.

## Quando houver aprovação humana real

1. Conferir fontes e vigência dos dispositivos usados; corrigir o capítulo e seu rótulo editorial.
2. Obter o hash com lessonHash da versão exata. Registrar revisão humana efetivamente realizada: reviewedBy, editorialReview.kind=human, approved=true, reviewedAt e contentHash. Não há comando que conceda aprovação automaticamente.
3. Executar `npm run study:validate -- --topics Esp01,Por01` para o lote explícito. A edição integral exige os 61. Código 2 significa bloqueio editorial esperado; código 1 significa erro operacional/arquivo inválido.
4. Executar `npm run study:export -- Por01` e `npm run study:channels -- Por01`. Ambos recusam draft. Os destinos têm tópico e hash; receipts registram hashes e tamanhos dos arquivos derivados.
5. Ler reading.md. Resolver study-packet.md antes de abrir answer-key.md. As respostas não são copiadas para o pacote de tentativa nem para os chunks RAG.
6. No Projeto ChatGPT, adicionar as fontes e as instruções project-professor.md. Em conversa normal com o recurso de estudo disponível na conta, enviar study-packet.md e study-mode.md. Conferir manualmente fontes e versões. São contextos distintos.
7. Para escuta, importar reader.txt manualmente no ElevenReader. Na PWA, apenas preparar/colar texto; a reprodução pode acionar provedores cobrados. Esta operação não gera áudio.
8. Após uma tentativa real, usar os registros efetivamente observados. `npm run study:session -- /caminho/privado/sessao.json /caminho/privado/ids-existentes.json` gera CSV para A:L de Sessões. Conferir IDs, regras e intervalos na planilha antes de transferência manual; preservar M:P. A deduplicação depende do conjunto atualizado de IDs fornecido ao validador.
9. Escuta vai para Rotina e escuta, sem somar minutos ativos. Se tempo ou métrica não foram medidos, manter ausência. O serializador não transforma uma sessão incompleta em VÁLIDO.
10. Para leitura consolidada, usar `npm run study:reading -- --topics Esp01,Por01 --pdf`. Requer Pandoc e XeLaTeX locais; sem --pdf gera Markdown/HTML. Para uma disciplina completa, passar seus IDs após aprovação do conjunto correspondente.
11. Executar `npm run study:rag -- --topics Esp01,Por01`. O bundle preserva o namespace e indica staging. Verificar receipt, citações e hashes antes de qualquer indexação. referenceHash identifica metadados de referência; não é hash dos bytes de um PDF remoto.

## O que os testes comprovam

A suíte usa fixtures sintéticas declaradas, sem aprovação fictícia de conteúdo real. Testa publicação parcial/integral, rejeição de fontes inválidas, integridade, preservação de ausências, separação de correções e um percurso composto com tentativa sintética. Não comprova revisão pedagógica, registro de estudo real, importação em contas externas, retenção, indexação de produção ou geração TTS.

Pré-requisitos de testes: Node.js com node:test; Pandoc e XeLaTeX para o teste local de PDF. O restante do pipeline usa apenas módulos nativos do Node.js. `npm run build` verifica a PWA existente. Nenhum código do aplicativo, credencial, storage ou configuração de TTS foi alterado.

## Matriz de integração

| Destino | Evidência nesta fase | Estado máximo |
| --- | --- | --- |
| Sheets | Abas e cabeçalhos reais lidos; serializador testado | Leitura conectada; escrita não executada |
| Projeto ChatGPT | Manifesto, prompts e empacotador testados com fixture | Preparado |
| Modo Estudar | Pacote sem gabarito e instruções para conversa normal | Preparado |
| ElevenReader | TXT e instruções de importação; sem execução externa | Preparado |
| PWA | API existente inspecionada; payload sem rede testado; build | Compatibilidade preparada |
| NotebookLM | Fontes e perguntas empacotadas; sem notebook criado | Preparado |
| RAG | Bundle staging e recibo verificados com fixture | Testado em staging documental |

Os pacotes RAG privados anteriores são preservados. Não existe promoção para índice produtivo, scheduler ou serviço novo por esta entrega.
