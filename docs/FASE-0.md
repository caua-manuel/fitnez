# Fase 0 — Descoberta e proposta de arquitetura

Data: 11/11/2026. Status: análise entregue; aguardando escolha da stack.

## Escopo atendido

Leitura de `AGENTS.md`, especificação, sementes, protótipo, service worker,
manifesto e definições dos papéis solicitados. Como esta sessão não oferece
subagentes, o orquestrador assumiu primeiro `arquiteto` e depois `backend-dados`,
conforme a alternativa expressamente permitida pelo pedido.

- [ADR 001 — Arquitetura e três opções de stack](decisoes/001-arquitetura-e-stack-frontend.md).
- [ADR 002 — Armazenamento, migração e backup](decisoes/002-armazenamento-local-migracao-backup.md).
- [Handoff de dados](handoffs/dados-fase-0.md).

Recomendação: **React + TypeScript + Vite + CSS próprio**, com IndexedDB e
backup JSON. Alternativas: JavaScript modular + Vite ou Svelte + TypeScript +
Vite. Todas seguem a decisão já tomada de aplicação estática sem backend.

## Pontos descobertos

- As sementes coincidem com os dados padrão do protótipo e suas referências
  internas resolvem. Não houve alteração dos números de treino ou dieta.
- O protótipo não acusa falhas ao gravar. A proposta exige confirmação de commit
  e indicação visível quando uma edição ainda não foi salva.
- A migração precisa preservar as duas chaves e não assumir que maior timestamp
  significa histórico mais completo. Backups reais não estão presentes no kit.
- Trocar de origem exige exportar/importar JSON; o novo endereço não pode ler
  automaticamente dados de outro domínio ou navegador.
- O service worker atual exclui caches alheios à sua versão; a nova implementação
  precisa de namespace e atualização segura.
- A referência visual existente prevalece sobre os tokens genéricos provisórios.
- A regra de coluna do deload diverge entre especificação e código. O guardião
  de conteúdo deverá resolver isso antes da implementação da Fase 2.

## Verificação desta entrega

Foi feita análise estrutural das sementes e comparação com seus valores no
protótipo por script de diagnóstico temporário executado em memória. Nenhum
código de aplicação, projeto, dependência ou workflow foi criado. As entregas
desta fase são documentos; a matriz de testes futura não significa testes já
executados. O app novo ainda não existe para validar no celular.

Os hashes abaixo registram os arquivos preservados durante a Fase 0:

| Arquivo | SHA-256 |
| --- | --- |
| `legacy/index.html` | `6252287e6a20c0f3edf6e24ffab7c06de9d3e3812194ae5f796b38e36fb3ce4b` |
| `legacy/sw.js` | `781f1ee51eea581f3a2b5c7a5949adbb372357d60c84f697e45802e9b85bb192` |
| `legacy/manifest.webmanifest` | `51da7ccc6230d95f414fbb853361d5519831e62ce5ec6cc11ae4f75502df87ed` |
| `data/plan.json` | `dc89106e6cc55accec3a6865ff993a180a9508b37972f723087c94a88846cf32` |
| `data/diet.json` | `40bf676a932289811de8e0abbf9ec984f5f69a706d94c02342ede92bfddb650c` |
| `data/recipes.json` | `3d7fafb48df755cbf989b4970846654c81ff1a5f3305fad90b160e100a3f9652` |
| `DESIGN.md` | `d3cd2f23d6b1e004d17debd3dd61623c7e99db1c7bffff7e4cc99e8062fc2a3e` |

## Ponto de parada solicitado

A única decisão pedida agora é a stack de front-end. Após a resposta, atualizar
o ADR 001 com a escolha e preparar a Fase 1. Não iniciar código do sistema
antes disso. Esta pausa vem do pedido do usuário na seção Fase 0 do prompt.
