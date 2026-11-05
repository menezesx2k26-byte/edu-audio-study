# Leitura e escuta

Use reader.txt de um tópico aprovado. O exportador recusa rascunhos. Importe o TXT no ElevenReader pelos controles da sua conta e confira título, edição e texto. Verifique o plano gratuito disponível antes de usar recursos externos; este projeto não solicita áudio por API nem consome créditos automaticamente.

Na PWA existente, cole o texto em Biblioteca → texto. A API aceita POST /api/books/text com somente title e text, sob a autenticação existente. buildAudioImport prepara esses campos e sourceTopicId para rastreabilidade local; não faz requisições. O título contém ID e hash do texto. Confira se esse título já existe antes de importar: a API atual cria um novo livro a cada POST e não garante deduplicação.

Importar texto não gera áudio. O player solicita um endpoint que pode chamar provedores pagos quando não há cache. Não iniciar reprodução ou geração nesta operação de custo R$ 0. Nenhuma alteração de configuração, credenciais, biblioteca ou áudios existentes é feita pelo pipeline.

NotebookLM recebe reading.md e notebook-sources.md, com fontes oficiais selecionadas para o assunto. Adicionar um documento não comprova criação de notebook ou execução de áudio. Confira a fonte na interface e teste uma pergunta com citação antes de registrar integração conectada.

Escuta é exposição, não comprovação de aprendizagem. Registre minutos passivos apenas em Rotina e escuta. Após ouvir, tente responder sem consulta e registre separadamente a atividade ativa realmente realizada.
