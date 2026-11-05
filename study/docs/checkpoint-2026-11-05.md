# Checkpoint — Material Mestre 50/50 — 05/11/2026

## Resultado confirmado

Pipeline editorial implementado na branch `feat/material-mestre-50-50-20261105`, base `223daa7`. Implementação e correções verificadas até `fbc70eb`. A edição integral não está concluída.

- Inventário: 61 tópicos; Português 20, Matemática 12, Legislação 8, Específicos 21.
- Capítulos: 2 rascunhos substanciais (Esp01 e Por01, cerca de 5 mil palavras no conjunto); 0 verificados; 59 ausentes. Doze exercícios autorais no conjunto, com recuperação e revisões adicionais.
- Terceiro piloto Leg03: bloqueado por acesso ao texto vigente. Fonte consolidada HTTP 403; Câmara com captcha/503; compêndio IPRESF de 2022 insuficiente para comprovar vigência em 2026. Não houve substituição por regras federais ou texto jurídico inventado.
- Banco existente: 316/316 itens submetidos à auditoria estrutural em snapshot privado; 0 elegíveis, 316 retidos para revisão humana. Isso não é auditoria humana integral do conteúdo.
- Usuário escolheu trabalhar sem revisor humano nesta fase. Publicação, exportações reais finais e expansão editorial continuam bloqueadas.

## Estado das 12 tasks

| Task | Estado técnico | Pendência efetiva |
| --- | --- | --- |
| A1 | Implementada e testada | Revalidar retificações antes de nova edição |
| A2 | Contrato e gate implementados | Aprovação humana de cada revisão real |
| A3 | Esp01 e Por01 redigidos; alvos do piloto rastreados | Leg03 e revisão dos três pilotos |
| A4 | Auditor e relatório estrutural dos 316 itens executados | Revisão humana de conteúdo e aprovação por hash |
| A5 | Relatório de cobertura implementado | Expansão editorial após os gates; 59 capítulos ausentes |
| A6 | Gate parcial/integral implementado | Acervo real corretamente recusado |
| B1 | Exportadores, consolidação HTML/Markdown/PDF e recibos testados | Conteúdo aprovado para gerar edição real |
| B2 | Manifestos, prompts, empacotador e tentativa antes da correção testados | Revisão humana dos prompts e inclusão na conta |
| B3 | Payload determinístico e guia de importação implementados | Importação externa; nenhum áudio gerado |
| B4 | CSV e validações testados; 12/12 cabeçalhos reais reconferidos | Transferência de sessões reais, sem sobrescrever M:P |
| B5 | Bundle staging com proveniência e integridade testado | Conteúdo aprovado; nenhum índice produtivo promovido |
| B6 | Percurso composto verificado com fixture sintética | Validação com conteúdo real aprovado e contas externas |

## Evidências

- `npm run test:study`: 63 testes, 63 aprovados, zero falhas ou skips.
- `npm run build`: build React/Vite aprovada; aplicação existente preservada.
- `node study/scripts/validate-all.mjs`: código 2, `allowed=false`, 2 drafts, 0 verified, 59 missing.
- `node study/scripts/export-topic.mjs Esp01`: código 2, sem exportar rascunho.
- Leitura conectada dos cabeçalhos reais: Sessões tem 16 colunas; A:L correspondem exatamente ao serializador. M:P ficam preservadas. Rotina e escuta tem seis campos próprios.
- PDF sintético gerado e inspecionado; extração de texto e limites de página verificados. Não é PDF de capítulo aprovado.
- Revisão independente automatizada do código em `223daa7..688e182`; dois achados Important e dois Minor reproduzidos. Todos corrigidos numa passagem com cinco regressões RED→GREEN, incluindo o problema visual de PDF observado separadamente. A revisão de código não é revisão humana editorial.

## Decisões e limites registrados

- Helpers de shell do skill cloud indisponíveis: usados briefs dos planos e logs equivalentes RED/GREEN em ledgers por plano; limitação de compatibilidade do bookkeeping, não do pipeline.
- Manifesto usa o caminho do Plano A, resolvendo o atalho do design; permanece um único inventário.
- Infraestrutura de cobertura implementada antes do gate; expansão de conteúdo permanece condicionada à validação do piloto.
- Fixtures aprovadas são exclusivamente sintéticas. Nenhuma delas conta como aprovação de capítulos reais.
- Estados legados automáticos e conferência na fonte não concedem aprovação humana.
- Importação textual determinística não significa deduplicação da API existente; importações manuais repetidas podem duplicar livros.
- Datas de bundles determinísticos representam a revisão editorial, não o instante de execução.
- Chromium local travou até em página em branco; PDF usa Pandoc/XeLaTeX já instalados, sem serviço pago. O layout e o pré-requisito mudaram.
- Identidade de recibo e escolha inicial do exercício foram reclassificadas para correção porque um recibo podia declarar outro tópico e um capítulo válido podia falhar ao empacotar. PDF foi corrigido por perda de texto comprovada fora da página.
- Registros humanos locais são atestações de revisão real; não há autenticação criptográfica de identidade do revisor.
- Validação semântica, precisão jurídica, vigência e ambiguidades pedagógicas continuam exigindo revisão efetiva; separação estrutural de respostas não elimina revisão de conteúdo.
- Labels de sessão são fornecidos pelo chamador, com rebaixamento de VÁLIDO quando incompleta. Conferir regras atuais da planilha antes de transferir; labels incompatíveis podem ser rejeitados.
- Chamadas diretas aos renderizadores devem fornecer Topic canônico; os CLIs documentados e o gate o carregam do manifesto validado.
- Nenhuma importação externa, escrita de desempenho, geração TTS ou indexação produtiva foi executada. Os RAGs anteriores e monitores de outros concursos foram preservados.
- Nenhum novo fato pessoal durável ou regra global foi produzido: não duplicar este estado transitório nos repositórios de memória de conta ou regras globais.

## Continuidade

Primeira ação editorial: recuperar a redação vigente da LC 8/2003 e verificar os dispositivos de provimento/vacância para redigir Leg03. Depois, quando houver revisor humano, revisar o piloto e os prompts, registrar aprovação da revisão exata e liberar o primeiro lote. O pipeline independente já está implementado.

Handoff privado reúne relatório por item, evidências de testes, ledgers e recibo de hashes. PersistFlow operou pela conexão Gabriel MCP Remote após falha do conector direto. Estados externos devem ser confirmados por leitura, nunca inferidos da existência dos arquivos.
