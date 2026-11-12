# ADR 004 — Reconstrução Fitnez, dados, banco remoto e notificações

Data: 12/11/2026. Responsável: agente `arquiteto`.
Status: adotado para a Entrega A; itens (c) e (d) têm gatilhos que dependem do dono.

Documentos de origem:
- Design: [2026-11-12-fitnez-reconstrucao-design.md](../superpowers/specs/2026-11-12-fitnez-reconstrucao-design.md)
- Plano da Entrega A: [2026-11-12-fitnez-entrega-a.md](../superpowers/plans/2026-11-12-fitnez-entrega-a.md)

## Contexto

O dono rejeitou a Fase 1 (fundação sem registro de treino) e forneceu oito telas de direção visual da marca Fitnez. O ADR 003 deixa de reger o escopo; o que ele estabelece sobre camadas, IndexedDB nativo, service worker nativo e restauração transacional (ADR 002) continua valendo. O projeto segue 100% front-end estático, sem servidor.

O repositório público do projeto é https://github.com/caua-manuel/fitnez. O Pages continua com **caminho base configurável** (`VITE_BASE_PATH` / derivação de `GITHUB_REPOSITORY`, ADR 003). Hoje o padrão é `/Projeto-Treino/`; ao publicar a partir do repositório `fitnez` o caminho passa a ser `/fitnez/`. A troca e a verificação de manifesto, escopo do service worker e precache são decisão e tarefa do `devops-github`, no momento da publicação. Nada é publicado nem enviado por push nesta entrega (AGENTS.md).

## Decisões

### (a) Reconstrução em três entregas, com parada ao fim de cada uma
- A: base visual, navegação de cinco abas, Início e Treino.
- B: Dieta.
- C: Evolução, Perfil completo, polimento; push agendado só se aprovado (item d).
Se A estourar, divide-se em A1 (base, Início, Treino) e A2 (biblioteca e edição).

### (b) Campos opcionais dentro do v3, sem v4
O design falava em "v4"; isto o ajusta. `DayRecord`, `settings` e `Exercise` já admitem campos extras (CONTRATOS-FASE-1). Acréscimos: `DayRecord.workout`, `DayRecord.acts`, `settings.profile`, `settings.notifications`, `Exercise.g` (grupo muscular), e nas entregas seguintes os de dieta e medidas.
- Sem novo número de versão e sem migração; nenhum dado existente muda.
- Consequência: leitores antigos ignoram os campos; a validação de `src/data/validation.ts` deve preservá-los e manter a recusa de `__proto__`/`constructor`/`prototype`.
- Prova: teste de ida e volta pelo repositório e pelo backup exportado/reimportado (Tarefa 6).
- Gatilho para um v4 real: qualquer mudança que torne um campo obrigatório ou reinterprete um existente.

### (c) IndexedDB mantido; banco remoto só a pedido do dono
IndexedDB atende uma pessoa em um aparelho, com custo zero e offline. Banco remoto só se o dono pedir uso em dois aparelhos. Caminho nesse caso: adaptador Supabase atrás da interface `Repository` existente, com login e regras de acesso por usuário (RLS). Custo: plano gratuito, dependência de terceiro, necessidade de rede para sincronizar e de política de privacidade para dados de saúde. Exige novo ADR e aval antes de qualquer código.

### (d) Notificações: locais agora, push agendado só com serviço aprovado
- Agora (Entrega A): interruptor no Perfil, pedido de permissão e notificações locais pelo service worker (fim do descanso). Sem dado pessoal no texto. No iPhone só funciona com o app instalado na tela inicial; o Perfil explica, assim como a limitação de lembretes com o app fechado.
- Push com o app fechado exige um servidor que envie a mensagem; hospedagem estática não basta. Opções, apenas se o dono aprovar (Entrega C):
  1. Supabase Edge Function com Web Push e chaves VAPID. Custo: plano gratuito; dependência de terceiro; guarda de assinaturas do aparelho no serviço; agendamento (cron) a configurar; chave privada VAPID fora do repositório.
  2. Continuar só com notificações locais e avisos ao abrir o app (custo zero, sem terceiro; limite: nada chega com o app fechado). **Recomendada** até o dono pedir o contrário.
- Se a opção 1 for aprovada, precisa de ADR próprio, revisão do `seguranca-privacidade` e atualização da CSP.

### (e) Sem dependências novas
A Entrega A usa a mesma pilha do ADR 003 (React 19.3, TypeScript 6, Vite 8, Vitest, Playwright, fake-indexeddb). Ícones são SVGs próprios; gráficos futuros serão SVG próprio; roteamento é por hash em módulo puro. Qualquer dependência futura exige registro neste ou em novo ADR.

## Camadas e donos (Entrega A)

UI (`src/app`, `src/features`, `src/ui`, `src/pwa`) chama application (`src/application`) e domain (`src/domain`, funções puras sem React nem `Date.now()` direto). Data (`src/data`) só é acessada via application. Donos de escrita seguem a tabela do ADR 003; `src/domain/` passa a ser escrito pelos agentes de cada tarefa do plano (calendário, treino, progressão por `frontend`/`backend-dados`, com revisão de conteúdo por `conteudo-treino-nutricao`), um agente por vez.

## Consequências

- Menos risco de dados: nada migra, backups antigos continuam válidos.
- A tela de Perfil passa a absorver o conteúdo de "Mais" sem alterar backup, importação e proteção.
- Dois pontos pendentes do dono, sem bloqueio para a Entrega A: banco remoto (c) e push agendado (d).
- Pendência operacional do `devops-github`: caminho base do Pages muda de `/Projeto-Treino/` para `/fitnez/` na publicação.

## Decisões que o usuário precisa tomar

1. Usar o app em mais de um aparelho? Recomendação: não por enquanto; manter dados só no celular com backup.
2. Quer lembretes com o app fechado? Recomendação: não agora; ficar com avisos locais e decidir na Entrega C.
3. Publicar no repositório `fitnez`? Recomendação: sim, após a Entrega A validada no seu celular; o endereço passa a terminar em `/fitnez/`.
