# Para o Codex: passagem de bastão (25/11/2026)

Conferido no `git log` e no `git status`. Leia junto com `AGENTS.md`. Agentes e skills do Claude não existem no Codex: onde algo exigir revisão de conteúdo, vale "BLOQUEADO PARA O CODEX: o dono revisa quando voltar ao Claude".

## 1. Onde paramos
- `6939f95` feat(assistente): motor de volume v2 (etapa 2). Contém também o ADR 014 (dias pedidos sem teto) e o passo "instalar o app primeiro" no assistente, porque compartilham arquivos. `npm run check`: 1406 testes passando; carga inicial 194,1 de 205 KB (gzip), total JS 259,4 de 300 KB.
- Antes: `2998415` (botão Adicionar à tela de início), `41d5fec` (cardápio ADR 013, rascunho da execução, fila de gravações).
- O commit seguinte só de documentos traz a spec do plano manual, este arquivo e o `AGENTS.md`.
- Fora do git, de propósito: `.roast/`, `docs/ilustracoes/` (só `PROMPTS.md`) e as imagens novas de `docs/antes-depois/depois/`. Não commite sem o dono.
- Nada foi publicado. Push e publicação são do dono.

## 2. Decisões que não podem ser refeitas
- Escala do jiu-jitsu: **1 = leve, 5 = destruído** (`src/domain/jiujitsu.ts`).
- Regras de segurança ficam como estão (`planBlockedReason`, `effectiveExperience`, `TRANSTORNO_MAX_DAYS`, avisos e `WARNING_ORDER`).
- Exceção de volume com 2 dias (ADR 010): com 2 dias por semana, em tempo médio, o mínimo dos grupos grandes é 2 × as séries do exercício principal.
- O assistente fica com 12 telas (hoje 10 em `STEPS`; entram prioridade muscular e dores por região na Etapa 3). A posição de equipamento em casa e de "treinou nos últimos 3 meses?" é do dono: se não estiver clara, pare e pergunte.
- Perguntas e exercícios novos aprovados: prioridade muscular, dores por região, equipamento em casa, "treinou nos últimos 3 meses?"; exercícios `rosca_elastico` e `lat_elastico`. Plano padrão (`data/plan.json`) intacto.
- Ilustrações dos exercícios: `public/img/exercise/<id>-1.webp` e `<id>-2.webp`. **Ainda não existem** (a pasta tem só `inclinado.jpg`); prompts em `docs/ilustracoes/PROMPTS.md`. Não gere imagens.
- Respostas novas (`priority`, `pains`, `equipment`, `trainedRecently`) existem só em memória; `StoredAnswers` e o formato guardado não mudam.

## 3. Bugs conhecidos (com divergência do que se esperava)
1. **Rascunho da série em `Executar.tsx`: já implementado e commitado em `41d5fec`** (`src/features/treino/rascunho.ts`, `rascunho-execucao.test.ts`, `rascunho-executar.spec.ts`). Liberado ao Codex só para conferir e completar o teste de "bloquear a tela e voltar" (tarefa 4).
2. **Fila de gravações em `src/app/commitQueue.ts`: NÃO mexer**, é o exercício de estudo do dono. O handoff `frontend-bugs-execucao-fila.md` diz que ela também recebeu a correção de recusa em `41d5fec`. Se achar problema, só relate.

## 4. Estado da Etapa 2 (ADR 015 e `conteudo-volume-assistente-v2.md`, seção 10)
- Motor: `src/domain/planEngine.ts` (exercícios, séries, tempo) e `src/domain/painRules.ts` (dores). `onboarding.ts` só monta o plano.
- Descanso: 120 s nos principais do intermediário no médio (aprovado). No curto o código usa 90 s; a regra aprovada é **nunca abaixo de 120 s**, com superset de músculos opostos ou corte de acessório. Mudança BLOQUEADA.
- Tempo longo: o plano não entrega "60 a 90 min" (31 a 58 min em boa parte dos 4 a 6 dias). O texto fica; ganhar volume útil é BLOQUEADO.
- Provisórias, aguardam revisão profissional (nunca descrever como verificadas): perder na posição 0,33; excesso de prioridade 0/1/2; prioridade escondida para menor de 18 e transtorno alimentar; "treinou há 3 meses" só muda o intermediário.
- Casa livre: faltam exercícios de peso do corpo (ombro lateral e bíceps ficam de fora; Pernas A e B parecidas).
- Pendente: Etapa 3 (telas novas e revisão com volume por grupo).

## 5. Armadilhas
- Terminal em `C:\Projeto-Treino` com C maiúsculo, senão o Vitest carrega o módulo duas vezes e falha na coleta.
- Testes de navegador (Playwright) são instáveis: rode o arquivo isolado e repita uma vez antes de concluir que há regressão; não "conserte" só aumentando espera.
- Preview local não é o site publicado: o app roda na base `/Projeto-Treino/` (service worker, caminhos e cache mudam) e, no iPhone, o app instalado não vê os dados do Safari. Veja `tests/e2e/instalar-*.spec.ts`.
- `npm run check` falha se a carga inicial passar de 205 KB (gzip).

## 6. Tarefas, em ordem
1. **LIBERADA.** Tarefa: confirmar que `planEngine` e `painRules` ficam fora da carga inicial (carregamento sob demanda) e reportar o JS inicial e total; corrigir se estiverem dentro | Leia: `scripts/verify-build.ts`, `src/application/onboarding.ts`, `src/application/repository.ts`, `src/data/validation.ts` | Altere: só imports e carregamento | Pronto quando: `rosca_elastico` e `lat_elastico` não aparecem em `dist/assets/index-*.js` (hoje aparecem) e `npm run check` passa | Não faça: mudar números, orçamento ou o motor.
2. **LIBERADA.** Tarefa: relatório (sem mudar regras) dos planos do tempo médio com grupo ausente, por dias (2 a 6), experiência e local | Leia: `src/domain/onboarding.ts`, `docs/revisao/assistente-matriz-diagnostico.md` | Altere: só `docs/revisao/assistente-medio-grupo-ausente.md` (script temporário, não commitado) | Pronto quando: tabela de grupos ausentes por combinação e contagem total | Não faça: propor ou aplicar o rodízio.
3. **LIBERADA.** Tarefa: Etapa 3, tela nova (prioridade muscular, dores por região, equipamentos em casa, "treinou nos últimos 3 meses?") e revisão com volume por grupo | Leia: ADR 015, handoff v2 seções 2, 4 e 5, `Assistente.tsx`, `PlanResumo.tsx`, `painRules.ts` | Altere: `src/features/assistente/*` | Pronto quando: respostas entram no motor, 390x844 nos dois temas, `npm run check` | Não faça: escrever texto novo de saúde (use EXATAMENTE os do domínio; se faltar, pare), mudar `StoredAnswers` ou regras.
4. **LIBERADA.** Tarefa: rascunho da série (bug 1): conferir e testar "bloquear a tela e voltar" | Leia: `rascunho.ts`, `Executar.tsx`, `tests/e2e/rascunho-executar.spec.ts` | Altere: `Executar.tsx` e testes | Pronto quando: testes cobrem `visibilitychange`/`pagehide` e a carga digitada volta | Não faça: tocar em `commitQueue.ts` ou gravar o rascunho no `log` do dia.
5. **LIBERADA.** Tarefa: "Eu mesmo monto", tarefas 1 a 4 de `docs/especificacoes/montar-proprio-plano.md`, uma por vez | Leia: a spec | Altere: `src/domain/manualPlan.ts`, `src/features/assistente/*` | Pronto quando: testes da seção 6 da spec e 390x844 nos dois temas | Não faça: deixar a opção visível no app publicado sem a tarefa 9; mudar regras de segurança.
6. **BLOQUEADA** (BLOQUEADO PARA O CODEX: o dono revisa quando voltar ao Claude). Tarefa: casa livre, exercícios de peso do corpo e ombro lateral/bíceps | Leia: handoff v2 | Altere: nada | Pronto quando: o Claude decidir | Não faça: inventar exercícios.
7. **BLOQUEADA** (idem). Tarefa: rodízio de grupos ausentes no tempo médio, a partir do relatório da tarefa 2 | Não faça: mudar o motor.
8. **BLOQUEADA** (idem). Tarefa: descanso e superset no tempo curto (principais com carga nunca abaixo de 120 s) | Não faça: tocar em `LOADED_PRINCIPAL_REST_CAP`.
9. **BLOQUEADA** (idem). Tarefa: volume útil no tempo longo e ligação do plano manual à segurança (spec, tarefas 5 e 6) | Não faça: alterar o texto "60 a 90 min".
10. **BLOQUEADA** (idem). Tarefa: revisão profissional das 4 regras provisórias e dos textos de aviso do plano manual | Não faça: marcá-las como verificadas.
