# Handoff — conteúdo de treino e nutrição — Fase 1

Agente real `conteudo_treino_nutricao`, acionado por `spawn_agent`. Revisão inicial somente de leitura; este registro foi escrito após autorização exclusiva do coordenador.

- Lidos AGENTS.md, definição do agente, especificação (incluindo seções 3, 4 e 9), ADR 003, contratos, as três sementes e trechos pertinentes do protótipo.
- Conferidas nas sementes: 38 exercícios, 4 treinos, 5 refeições com 3 opções cada e 11 receitas.
- Aprovada na Fase 1 a exibição fiel do catálogo/rotina e das refeições das sementes, identificada como fundação. Catálogo personalizado importado deve ser preservado; não substituí-lo silenciosamente pelo padrão.
- Não implementar nesta fase cálculo de blocos/RIR/deload/tipo de dia, totais consumidos, progressão, elegibilidade ou revisão semanal. Não alterar números, porções, séries ou repetições.
- Divergência confirmada: `legacy/index.html:452` calcula séries do deload com o bloco atual; a seção 3 da especificação pede a coluna do bloco anterior. A decisão fica pendente para revisão antes da Fase 2; nenhum dos números foi alterado.
- Manter aviso de que calorias/proteínas são estimativas e o app não substitui nutricionista ou médico. Não acrescentar alegações científicas: as fontes da seção 9 continuam a verificar.

Verificação: leitura explícita UTF-8 e contagem estrutural dos JSON via PowerShell. Não houve teste científico/nutricional dos itens nem pesquisa de regras novas. Nenhuma alteração em produto, legacy/, sementes, skills ou regras; nenhum commit, push ou publicação. Fase 2 não iniciada.
