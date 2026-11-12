# Fitnez — Entrega A (base visual e Treino) Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans. Os passos usam caixas `- [ ]`. O projeto **não é um repositório git** e o AGENTS.md proíbe commit/push: onde a skill diria "commit", o passo é **registrar o handoff** em `docs/handoffs/<agente>-entrega-a-<tarefa>.md` (máx. 10 linhas: o que mudou, como verificar).

**Objetivo:** substituir a fundação da Fase 1 por um app Fitnez utilizável: sistema visual, navegação de cinco abas, Início e Treino com registro de séries, descanso com timer, edição de treinos e notificações locais.

**Arquitetura:** regras de negócio em funções puras em `src/domain/` (testadas com Vitest); telas em `src/features/<aba>/`; componentes visuais em `src/ui/`. O repositório IndexedDB e o estado v3 permanecem; os acréscimos são **campos opcionais dentro do v3** (sem novo número de versão, sem migração) porque `DayRecord`, `settings` e `Exercise` já admitem campos extras (CONTRATOS-FASE-1). Isto ajusta D10 do design: não existe "v4".

**Stack:** React 19.3 + TypeScript 6 + Vite 8, CSS próprio, Vitest 5, Playwright 1.64 (Chromium, 360×800). Nenhuma dependência nova.

**Design:** `docs/superpowers/specs/2026-11-12-fitnez-reconstrucao-design.md`. Telas: `docs/referencia-visual/tela-1.png` a `tela-8.png`. Regras de conteúdo: `docs/ESPECIFICACAO.md` seções 3 e 4.

## Restrições globais

- Português do Brasil em toda a interface. Caixa de frase nos rótulos.
- Sem dados fictícios na tela (nada de "João Silva", 1.850 kcal, +12%). Sem registro: estado vazio honesto.
- Não alterar séries, repetições ou cargas de `data/plan.json`, `diet.json`, `recipes.json`. `legacy/` intocado.
- Regras de negócio só em `src/domain/` (funções puras, sem React, sem `Date.now()` direto: receber `now`/dia por parâmetro).
- Dia civil sempre `YYYY-MM-DD` no fuso local. Cargas e repetições são texto digitado (aceita vírgula).
- Alvos de toque ≥ 44px; contraste AA; `prefers-reduced-motion`; foco visível; barra inferior com 5 colunas iguais e safe-area.
- Hash routing preservado; caminho base `/Projeto-Treino/` preservado. Escrita por um agente por pasta (AGENTS.md).
- Dependência nova só com ADR. Nenhuma publicação, push ou commit.

## Revisão de foco (casos que os testes das tarefas devem prender)

1. Carga/repetição digitadas como `"22,5"`, `""`, `"abc"`, `"-3"`: volume e sugestão ignoram o inválido, nunca produzem `NaN`. (Tarefas 3 e 4)
2. Datas: início numa quarta normaliza para a segunda; dia antes do início = pré-semana; dia 84 = concluído; virada de meia-noite. (Tarefa 2)
3. Treino interrompido e retomado; outra aba salvou antes (conflito de revisão): o que foi digitado não se perde. (Tarefas 7 e 11)
4. Exercício ou treino removido do plano: o histórico permanece e aparece como "Exercício removido". (Tarefas 6 e 12)
5. Notificação negada ou indisponível (iPhone fora da tela inicial): o interruptor explica e nada quebra. (Tarefa 13)
6. Nomes longos (treino e exercício) em 360px sem corte nem rolagem horizontal. (Tarefas 9 a 12)

## Estrutura de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/domain/calendar.ts` | fase do plano, semana, bloco, deload, RIR |
| `src/domain/workout.ts` | número digitado, séries da semana, volume, último desempenho |
| `src/domain/progression.ts` | sugestão de carga/repetições, estagnação |
| `src/domain/dayActivity.ts` | atividade do dia, tipo de dia |
| `src/domain/restTimer.ts` | tempo restante por carimbo de tempo |
| `src/domain/planEdit.ts` | criar, duplicar, excluir, mover treinos e exercícios |
| `src/domain/muscleGroups.ts` | grupo muscular por exercício |
| `src/application/repository.ts` | tipos opcionais novos (só tipos) |
| `src/app/DataProvider.tsx` | acrescenta `commit` |
| `src/app/router.ts` | rota pura por hash |
| `src/app/App.tsx` | casca, cabeçalho, barra de cinco abas |
| `src/ui/tokens.ts`, `styles.css`, `icons.tsx`, `Logo.tsx`, `components.tsx` | sistema visual |
| `src/features/inicio/`, `treino/`, `dieta/`, `evolucao/`, `perfil/` | telas |
| `src/pwa/notifications.ts`, `public/sw.js` | notificações locais |
| `tests/unit/*.test.ts`, `tests/integration/*.test.ts`, `tests/e2e/entrega-a.spec.ts` | testes |

---

### Tarefa 0: Decisões e referências (agente `arquiteto`)

**Arquivos:** criar `docs/decisoes/004-reconstrucao-fitnez-e-push.md`; atualizar `docs/decisoes/003-execucao-fase-1.md` (nota de que a Fase 1 foi superada).

- [ ] **Passo 1:** registrar no ADR 004: (a) reconstrução em três entregas; (b) campos opcionais no v3, sem v4; (c) IndexedDB mantido, banco remoto só com pedido do dono; (d) notificações: locais agora, push agendado só com serviço de envio aprovado (opções: Supabase Edge Function + Web Push com VAPID; custo e dependência de terceiro); (e) sem dependências novas.
- [ ] **Passo 2:** verificar: `Grep "004" docs/decisoes` encontra o arquivo; o ADR cita o design e o plano pelos caminhos.

### Tarefa 1: Sistema visual e marca (agentes `ux-acessibilidade` depois `frontend`)

**Arquivos:** reescrever `DESIGN.md`; criar `src/ui/tokens.ts`, `src/ui/Logo.tsx`; reescrever `src/ui/styles.css`; criar `tests/unit/tokens.test.ts`.

**Interfaces — produz:**
- `tokens.ts`: `export const palette: Record<'light'|'dark', Record<TokenName, string>>`, `export function contrast(a: string, b: string): number`.
- `Logo.tsx`: `export function Logo(props: { size?: number; withTagline?: boolean })` (halter azul com folha verde, recriado em SVG; texto "Fitnez" e "TREINO + DIETA").

- [ ] **Passo 1: teste que falha** em `tests/unit/tokens.test.ts`: para cada tema, `contrast(text, card) >= 4.5`, `contrast(primaryForeground, primary) >= 4.5`, `contrast(mutedForeground, card) >= 4.5`, `contrast(input, secondary) >= 3`; e: todo valor de `palette` aparece literalmente em `styles.css` sob `:root` / `[data-theme="dark"]`.
- [ ] **Passo 2:** `npm.cmd test -- tests/unit/tokens.test.ts` → FALHA (módulo ausente).
- [ ] **Passo 3:** `ux-acessibilidade` redefine `DESIGN.md` conforme as telas (azul vivo ≈ `#0F5FFF` ajustado para AA, fundo branco, cartões com raio 16–20px, ícones de linha, barra inferior de 5 abas, botão principal azul de 52px, controle segmentado, anel de progresso, tema escuro simétrico). `frontend` implementa `tokens.ts`, `styles.css` (tokens, tipografia Figtree/sistema, `.card`, `.button`, `.segmented`, `.ring`, `.tabbar`, `.sheet`, foco 3px, movimento reduzido) e `Logo.tsx`.
- [ ] **Passo 4:** mesmo comando → PASSA. `npm.cmd run typecheck` sem erros.
- [ ] **Passo 5:** handoff.

### Tarefa 2: Calendário do plano

**Arquivos:** criar `src/domain/calendar.ts`, `tests/unit/calendar.test.ts`.

**Interfaces — produz:**
```ts
export type DayIso = string;
export const RIR: readonly string[]; // 12 itens: '3','2–3','2','4','2','1–2','1–2','4','2','1–2','1–2','4'
export const WEEK_NOTES: Readonly<Record<number, string>>; // 5: Natal, 6: Réveillon, 11: testes
export type Phase =
 | { kind: 'pre'; daysUntil: number }
 | { kind: 'done' }
 | { kind: 'week'; idx: number; week: number; weekday: number; block: 1|2|3; deload: boolean; rir: string; note?: string; progress: number };
export function mondayOf(day: DayIso): DayIso;
export function addDays(day: DayIso, n: number): DayIso;
export function phaseOf(start: DayIso, today: DayIso): Phase;
export function weekLabel(week: number): string; // 3 -> 'Semana 04 de 12'
```

- [ ] **Passo 1: testes** (`calendar.test.ts`): `mondayOf('2026-11-18') === '2026-11-16'`; `phaseOf('2026-11-16','2026-11-15')` é `{kind:'pre',daysUntil:1}`; `'2026-11-16'` → week 0, weekday 0, block 1, deload false, rir '3', progress 1/12; `'2026-12-07'` → week 3, deload true, rir '4', `weekLabel(3)==='Semana 04 de 12'`; `'2027-02-07'` → week 11; `'2027-02-08'` → `{kind:'done'}`; início `'2026-11-18'` produz a mesma fase que `'2026-11-16'`; virada de ano `addDays('2026-12-31',1)==='2027-01-01'`; `progress === (week+1)/12` (decisão: o mockup mostra 4 de 12 = 33%).
- [ ] **Passo 2:** `npm.cmd test -- tests/unit/calendar.test.ts` → FALHA.
- [ ] **Passo 3:** implementar usando UTC apenas para aritmética de dias (evita horário de verão); semana = `floor(idx/7)`, bloco por `floor(week/4)+1`, deload quando `week % 4 === 3`.
- [ ] **Passo 4:** → PASSA. **Passo 5:** handoff.

### Tarefa 3: Regras de treino

**Arquivos:** criar `src/domain/workout.ts`, `tests/unit/workout.test.ts`.

**Interfaces — consome:** `Exercise`, `DayRecord` de `src/application/repository.ts`. **Produz:**
```ts
export interface SetEntry { kg: string; reps: string; done: boolean }
export function parseNumber(v: unknown): number | null; // '22,5'→22.5; ''|'abc'|'-3'→null; 0 aceito
export function setsForWeek(ex: Exercise, week: number): { sets: number; reps: string };
export function sessionVolume(entries: SetEntry[][]): number; // soma kg×reps só de séries done com ambos válidos
export function lastPerformance(days: Record<string, DayRecord>, exId: string, before: DayIso): { day: DayIso; sets: SetEntry[] } | null;
export function countDoneSets(entries: SetEntry[][]): number;
```

- [ ] **Passo 1: testes** com `supino` (`s:[4,5,5]`, `r:['5–8','4–6','3–5']`): semana 0 → `{sets:4,reps:'5–8'}`; semana 4 → `{5,'4–6'}`; semana 3 (deload, coluna do bloco 1) → `{2,'5–8'}`; semana 7 → `{3,'5–8'}` (ceil(5/2)=3, coluna do bloco 1, pois o deload usa a coluna do bloco anterior); semana 11 → `{3,'4–6'}`; exercício com 1 série em deload → 1. `parseNumber`: os quatro casos da Revisão 1. `sessionVolume([[{kg:'70',reps:'12',done:true},{kg:'70,5',reps:'10',done:true},{kg:'75',reps:'',done:true},{kg:'75',reps:'8',done:false}]]) === 840 + 705 = 1545`. `lastPerformance` ignora o próprio dia e dias futuros, retorna o dia anterior mais recente com alguma série `done`.
- [ ] **Passo 2:** `npm.cmd test -- tests/unit/workout.test.ts` → FALHA.
- [ ] **Passo 3:** implementar. Coluna do bloco: `deload ? max(0, block-2) : block-1` (índice 0..2); em deload `sets = max(1, ceil(n/2))`.
- [ ] **Passo 4:** PASSA. **Passo 5:** handoff.

### Tarefa 4: Sugestão de carga (agente `conteudo-treino-nutricao` revisa as regras)

**Arquivos:** criar `src/domain/progression.ts`, `tests/unit/progression.test.ts`.

**Interfaces — produz:**
```ts
export interface Suggestion { kg: number | null; reps: string; reason: 'sem-historico' | 'subir' | 'manter' | 'reduzir'; stagnant: boolean }
export function repRange(reps: string): { min: number; max: number } | null; // '5–8'→{5,8}; '8'→{8,8}
export function suggestNext(input: { ex: Exercise; week: number; history: SetEntry[][]; lower: boolean }): Suggestion;
```
`history` = sessões anteriores do exercício, da mais antiga à mais recente, só séries `done`.

- [ ] **Passo 1: testes:** sem histórico → `{kg:null, reason:'sem-historico'}`; última sessão com todas as séries previstas no topo da faixa (`8` em `5–8`) a 70 kg, membro superior → `{kg:72.5, reps:'5', reason:'subir'}`; inferior → 75; topo não atingido → `{kg:70, reason:'manter'}`; carga com vírgula (`'72,5'`) é entendida; desempenho (volume) menor em 2 sessões seguidas → `reason:'reduzir'` mantendo a carga; 3 sessões sem aumento de carga nem de repetições → `stagnant:true`; entradas inválidas (`'abc'`) são ignoradas sem `NaN`.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar a dupla progressão (ESPECIFICACAO §3): +2,5 kg superior, +5 kg inferior. É **somente sugestão**; nenhuma função preenche ou grava carga.
- [ ] **Passo 4:** PASSA. **Passo 5:** `conteudo-treino-nutricao` revisa e registra o handoff.

### Tarefa 5: Atividade e tipo do dia

**Arquivos:** criar `src/domain/dayActivity.ts`, `tests/unit/dayActivity.test.ts`.

**Interfaces — produz:**
```ts
export type Activity = { kind: 'gym'; sessionId: string } | { kind: 'bjj'; gi: boolean } | { kind: 'volei'; altSessionId?: string } | { kind: 'rest' };
export type DayType = 'perna' | 'academia' | 'jiujitsu' | 'volei' | 'descanso';
export function activityFor(input: { sched: Payload[]; weekday: number; override?: string; alt?: string }): Activity;
export function dayTypeOf(activity: Activity, sessionName?: string): DayType;
```

- [ ] **Passo 1: testes** com a rotina padrão: segunda (`weekday 0`) → `{bjj, gi:true}`; terça → gym `LW`; `override:'UB'` na segunda → gym `UB`; sábado → volei com `altSessionId:'LB'`; domingo → rest; `dayTypeOf(gym,'Lower')==='perna'`, `'Upper A'→'academia'`, `'Lower B (opcional)'→'perna'`.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar. **Passo 4:** PASSA. **Passo 5:** handoff.

### Tarefa 6: Dados — tipos opcionais, grupos musculares e edição do plano (agente `backend-dados`)

**Arquivos:** modificar `src/application/repository.ts` (só tipos); criar `src/domain/muscleGroups.ts`, `src/domain/planEdit.ts`, `tests/unit/planEdit.test.ts`, `tests/integration/entrega-a-dados.test.ts`.

**Interfaces — produz (tipos):**
```ts
// DayRecord ganha:
workout?: { sessionId: string; startedAt: number; finishedAt?: number; status: 'partial' | 'done'; sets: number; volume: number };
acts?: Partial<Record<'gym'|'bjj'|'volei'|'cond', boolean>>;
// settings ganha:
profile?: { name: string; goal: string };
notifications?: { enabled: boolean; restEnd: boolean };
```
```ts
// muscleGroups.ts
export type MuscleGroup = 'peito'|'costas'|'ombro-lateral'|'ombro-posterior'|'press'|'biceps'|'triceps'|'quadriceps'|'posterior-gluteos'|'panturrilha'|'core';
export function muscleGroupOf(exId: string, ex: Exercise): MuscleGroup | null; // ex.g ?? mapa por id das sementes
export function isLower(group: MuscleGroup | null): boolean;
// planEdit.ts (todas puras; retornam novo Plan)
export function createSession(plan: Plan, input: { name: string; sub?: string; min?: string }): { plan: Plan; id: string };
export function duplicateSession(plan: Plan, id: string): { plan: Plan; id: string };
export function deleteSession(plan: Plan, id: string): Plan; // remove de sess e order; NÃO apaga plan.ex
export function upsertExercise(plan: Plan, id: string | null, ex: Exercise): { plan: Plan; id: string };
export function addExerciseToSession(plan: Plan, sessionId: string, exId: string): Plan;
export function removeExerciseFromSession(plan: Plan, sessionId: string, exId: string): Plan; // mantém plan.ex
export function moveExercise(plan: Plan, sessionId: string, from: number, to: number): Plan;
```

- [ ] **Passo 1: testes:** `deleteSession` mantém `plan.ex` intacto; `removeExerciseFromSession` não apaga o exercício de `plan.ex`; `duplicateSession` gera id novo e nome "… (cópia)" com exercícios compartilhados; `upsertExercise` aceita `rest` e `g` e rejeita `rest < 0`; `moveExercise` reordena. Integração: salvar no repositório (fake-indexeddb) um estado com `acts`, `workout`, `settings.profile`, `settings.notifications` e `ex.g`, reler e comparar igual (campos extras preservados); backup exportado e reimportado preserva os mesmos campos; todo exercício das sementes tem `muscleGroupOf !== null` (a lista é revisada por `conteudo-treino-nutricao`).
- [ ] **Passo 2:** `npm.cmd test -- tests/unit/planEdit.test.ts tests/integration/entrega-a-dados.test.ts` → FALHA.
- [ ] **Passo 3:** implementar. Se a validação em `src/data/validation.ts` descartar algum campo novo, ajustá-la mantendo as recusas de `__proto__`/`constructor`/`prototype`.
- [ ] **Passo 4:** PASSA, e `npm.cmd test` inteiro continua verde. **Passo 5:** handoff (inclui "o que mudou nos dados": campos opcionais, nenhum dado existente alterado).

### Tarefa 7: Gravação otimista (`commit`) no DataProvider (agente `frontend`)

**Arquivos:** modificar `src/app/DataProvider.tsx`; criar `tests/integration/commit.test.ts`.

**Interfaces — produz:** no contexto, `commit: (mutate: (draft: StateV3) => StateV3) => Promise<boolean>`. Atualiza a tela na hora, grava em fila única (uma gravação por vez, sempre com a revisão mais recente) e, em conflito de revisão (outra aba), relê, reaplica `mutate` sobre o estado novo e tenta uma vez; falhando, mantém o estado local, mostra o erro e devolve `false` sem descartar o que foi digitado.

- [ ] **Passo 1: testes** (repositório real com fake-indexeddb): dois `commit` seguidos gravam ambos em ordem; conflito simulado (gravação externa entre leitura e save) reaplica a mutação e preserva as duas alterações; falha de gravação devolve `false` e mantém o valor local.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar sem remover `run`/`refresh` (o Perfil e o backup continuam usando `run`). **Passo 4:** PASSA. **Passo 5:** handoff.

### Tarefa 8: Casca do app, rotas e cinco abas (agente `frontend`)

**Arquivos:** criar `src/app/router.ts`, `tests/unit/router.test.ts`; reescrever `src/app/App.tsx`; criar `src/ui/icons.tsx`, `src/ui/TabBar.tsx`; remover `src/features/FoundationPages.tsx` e `Foundation`/`BackupReminder` antigos conforme as novas telas assumirem.

**Interfaces — produz:**
```ts
export type Route =
 | { tab: 'inicio' } | { tab: 'dieta' } | { tab: 'evolucao' } | { tab: 'perfil' }
 | { tab: 'treino'; view: 'lista' | 'detalhe' | 'executar' | 'concluido' | 'editar'; id?: string; day?: DayIso };
export function parseRoute(hash: string): Route; // '' ou desconhecido → { tab:'inicio' }
export function hrefFor(route: Route): string;   // '#treino/UA/executar?dia=2026-11-17'
```

- [ ] **Passo 1: testes:** `parseRoute('#treino/UA')` → detalhe `UA`; `'#treino/UA/executar?dia=2026-11-17'` → executar com `day`; `'#xyz'` → inicio; `hrefFor(parseRoute(h)) === h` para as rotas válidas.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar router; `App.tsx` com cabeçalho (Logo, sino, avatar → Perfil), `<main>` com h1 único e foco no título a cada rota, link "Pular para o conteúdo", status "Salvando…/Salvo neste aparelho", aviso de atualização do PWA (comportamento atual preservado), `TabBar` fixa de 5 itens (Início, Treino, Dieta, Evolução, Perfil) com `aria-current="page"`, escondida na execução do treino.
- [ ] **Passo 4:** PASSA; `npm.cmd run typecheck`. **Passo 5:** handoff.

### Tarefa 9: Início (agente `frontend`, revisão `ux-acessibilidade`)

**Arquivos:** criar `src/features/inicio/Inicio.tsx`, `tests/e2e/entrega-a.spec.ts` (primeiro bloco).

Conteúdo (tela-7): saudação com o nome do perfil (sem nome: "Olá!"), "Semana 04 de 12" e foco da semana (RIR, bloco, deload), anel de progresso `progress`, alternância Treino/Dieta, cartão "Treino de hoje" conforme `Activity` (gym: nome, duração `min`, nº de exercícios, **Começar treino** ou **Continuar treino** se `workout.status==='partial'`; bjj: **Marcar aula como feita** + "Como terminou" 1–5; vôlei: **Marcar jogo** ou treino alternativo; descanso: checklist do condomínio), **Trocar treino de hoje**, atalho **Registrar outro dia** (seletor de data), aviso de backup quando `protection.backupDue`, pré-semana ("Seu plano começa em N dias") e concluído. Atalhos Dieta e Evolução.

- [ ] **Passo 1: teste e2e** (estado sintético semeado por backup importado, plano começando na semana atual): Início mostra "Semana", nome do treino da rotina, botão "Começar treino"; em dia de aula mostra "Marcar aula como feita" e persiste `acts.bjj` e `feel`; pré-semana mostra a contagem; nenhum texto "João" nem "1.850".
- [ ] **Passo 2:** `npx.cmd playwright test tests/e2e/entrega-a.spec.ts -g "Início"` → FALHA. **Passo 3:** implementar. **Passo 4:** PASSA em 360×800 sem rolagem horizontal. **Passo 5:** handoff.

### Tarefa 10: Treino — plano, biblioteca e detalhe (agente `frontend`)

**Arquivos:** criar `src/features/treino/Treino.tsx`, `Detalhe.tsx`, `Biblioteca.tsx`.

Conteúdo (telas 4, 5 e 6): controle segmentado "Meu plano" / "Biblioteca". Meu plano: semana atual, treinos da rotina por dia com estado concluído/parcial/pendente. Biblioteca: busca por nome, filtros Todos/Superiores/Inferiores (por `muscleGroupOf` + `isLower`), cartão com duração, nº de exercícios, último dia feito. Detalhe: título, duração, nº de exercícios, **Começar treino**, abas Exercícios/Detalhes/Histórico, cada exercício com séries e repetições da semana (`setsForWeek`), último desempenho e sugestão (`suggestNext`, rotulada "Sugestão"), menu ⋮ por exercício.

- [ ] **Passo 1: e2e:** abrir Treino → Biblioteca mostra os 4 treinos reais (Upper A, Upper B, Lower, Lower B); filtro "Inferiores" mostra Lower e Lower B; busca "upper" filtra; Detalhe de Upper A lista 10 exercícios com séries da semana corrente; sem histórico mostra "Sem registro anterior" e nenhuma sugestão inventada.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar. **Passo 4:** PASSA em 360px. **Passo 5:** handoff.

### Tarefa 11: Execução do treino, descanso e conclusão (agente `frontend`)

**Arquivos:** criar `src/domain/restTimer.ts`, `tests/unit/restTimer.test.ts`, `src/features/treino/Executar.tsx`, `Concluido.tsx`.

**Interfaces — produz:**
```ts
export function restRemaining(endsAt: number, now: number): number;          // segundos, ≥ 0, arredondado para cima
export function adjustRest(endsAt: number, deltaSec: number, now: number): number; // novo endsAt, nunca antes de now
```

- [ ] **Passo 1: testes unitários:** `restRemaining(10_000, 8_001) === 2`; `restRemaining(10_000, 11_000) === 0`; `adjustRest(10_000, -15, 9_000) === 9_000`; `adjustRest(10_000, 15, 9_000) === 25_000`. **e2e:** executar Upper A: preencher e concluir a série 1 (carga e repetições), o timer aparece com o `rest` do exercício (150 s no supino) e `−15 s`, `+15 s`, `Pular` funcionam; concluir a série seguinte com os campos vazios os preenche com o último valor (aceite: 2 toques por série repetida); sair no meio e voltar mostra **Continuar treino** com tudo preservado (`workout.status==='partial'`); **Concluir treino** grava `workout.status==='done'`, `finishedAt`, `sets`, `volume`, `acts.gym`, e abre "Treino concluído" com duração, exercícios, séries e volume reais; **Adicionar série** cria série extra; recarregar a página durante o descanso retoma o tempo restante correto.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar. O timer usa `endsAt` (carimbo), nunca contagem de ticks; ao terminar vibra (`navigator.vibrate`, se existir) e chama `notifyRestEnd` da Tarefa 13 (stub até lá). Gravação a cada série via `commit`. Valores digitados nunca se perdem em erro de gravação (Revisão 3).
- [ ] **Passo 4:** PASSA em 360×800, com teclado numérico (`inputMode="decimal"`). **Passo 5:** handoff.

### Tarefa 12: Criar e editar treinos e exercícios (agente `frontend`)

**Arquivos:** criar `src/features/treino/EditarTreino.tsx`, `EditarExercicio.tsx`, `src/ui/UndoToast.tsx`.

Conteúdo (tela 5, nº 10): criar treino (nome, descrição, duração), renomear, duplicar, excluir com confirmação e **Desfazer** (8 s, guarda o estado anterior e regrava via `commit`); exercício: nome, grupo muscular, tipo de registro (`kg`, `bw`, `rep`, `s`, `kgs`), séries e repetições por bloco, **descanso em segundos (também ao criar o treino)**, observação; adicionar, remover da sessão e reordenar. Remover exercício ou treino não apaga histórico; o histórico de exercício que não existe mais é mostrado como "Exercício removido".

- [ ] **Passo 1: e2e:** criar "Treino de teste" com um exercício de 90 s de descanso e abrir a execução (timer inicia em 90 s); excluir e desfazer devolve o treino; excluir Upper A com histórico sintético: o histórico continua em Evolução/Histórico como "Exercício removido"; nome com 80 caracteres não gera rolagem horizontal em 360px.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar usando `planEdit.ts`. **Passo 4:** PASSA. **Passo 5:** handoff.

### Tarefa 13: Notificações (agente `frontend`, revisão `seguranca-privacidade`)

**Arquivos:** criar `src/pwa/notifications.ts`, `tests/unit/notifications.test.ts`; modificar `public/sw.js`.

**Interfaces — produz:**
```ts
export type NotifySupport = 'granted' | 'denied' | 'default' | 'unsupported';
export function notifySupport(env?: { Notification?: { permission: NotificationPermission }; serviceWorker?: unknown }): NotifySupport;
export async function enableNotifications(): Promise<NotifySupport>;       // pede permissão
export async function notifyRestEnd(exerciseName: string): Promise<void>;  // service worker showNotification; no-op sem permissão
```

- [ ] **Passo 1: testes:** `notifySupport({})` → `'unsupported'`; com `permission:'denied'` → `'denied'`; `notifyRestEnd` sem permissão não lança erro nem chama `showNotification`.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar; no Perfil, interruptor "Notificações" com texto: "Avisos de fim de descanso. No iPhone, instale o app na tela inicial. Lembretes com o app fechado exigem um serviço de envio, que ainda não está ativo." A notificação do `sw.js` abre o app na execução do treino ao ser tocada. Nenhum dado pessoal vai no texto.
- [ ] **Passo 4:** PASSA. **Passo 5:** handoff com a limitação de push agendado (decisão do dono pendente para a Entrega C).

### Tarefa 14: Perfil e abas Dieta e Evolução provisórias (agente `frontend`)

**Arquivos:** criar `src/features/perfil/Perfil.tsx`; mover a lógica de `src/features/More.tsx` para dentro do Perfil (backup, importação, migração, proteção continuam iguais); criar `src/features/dieta/Dieta.tsx` e `src/features/evolucao/Evolucao.tsx`.

Perfil (tela 2): nome e objetivo editáveis (vazios por padrão), números reais (treinos feitos, constância), "Meu plano" com `weekLabel` e progresso, tema Claro/Escuro/Automático, interruptor de notificações (Tarefa 13), "Dados neste aparelho" e "Backup e restauração" (comportamento de DESIGN.md anterior preservado). Dieta e Evolução: nesta entrega mostram o conteúdo já existente (cardápio e receitas para consulta; contagem de treinos e medidas importadas) com cabeçalho e estilo Fitnez, sem texto de "fase"; a versão completa vem nas entregas B e C.

- [ ] **Passo 1:** adaptar o e2e da Fase 1 (`tests/e2e/fase1.spec.ts`) às cinco abas: rotas, tema, importação v1/v2/v3, conflito de migração, persistência, offline PWA continuam passando com os novos rótulos.
- [ ] **Passo 2:** `npx.cmd playwright test` → FALHA nos rótulos antigos. **Passo 3:** implementar e atualizar seletores. **Passo 4:** PASSA.
- [ ] **Passo 5:** handoff.

### Tarefa 15: Verificação, segurança e fechamento (agentes `qa-testes`, `seguranca-privacidade`, `ux-acessibilidade`)

- [ ] **Passo 1:** `npm.cmd run check` (config, typecheck, Vitest, build) → verde; `npx.cmd playwright test` → verde, sem erros de console.
- [ ] **Passo 2:** `qa-testes`: capturas 360×800 e 1280×800 em claro e escuro das 5 abas e das telas de treino, comparadas com `docs/referencia-visual/`; verificação de teclado, foco, contraste e movimento reduzido.
- [ ] **Passo 3:** `seguranca-privacidade`: CSP do `index.html` cobre o service worker e as notificações; nada de dado pessoal em notificações; importação continua tratando JSON como texto.
- [ ] **Passo 4:** `ux-acessibilidade` revisa contra DESIGN.md; apontamentos viram correções antes de entregar.
- [ ] **Passo 5:** atualizar `docs/FASE-1.md` com nota "superada pela Entrega A" e escrever o relatório da entrega: resumo (≤ 5 linhas), passo a passo no celular (`npm.cmd run preview`, endereço de rede local) e o que mudou nos dados. **Parar e aguardar o aval do dono.**

---

## Autorrevisão

- **Cobertura do design:** objetivos 1 (Tarefas 9–11), 5 (Tarefa 1), 6 (PWA preservado, Tarefa 14); D3/D4/D5 (8–12); D8 parcial e D7/D6 provisórios por desenho (B e C); D9 (1); D10 (6); notificações e descanso na criação (12, 13); cópia do consumido na dieta e sugestões (B; sugestão de carga na 4).
- **Tipos:** `SetEntry`, `Phase`, `Activity`, `Suggestion`, `Route` definidos uma vez e usados pelas tarefas seguintes com os mesmos nomes; `commit` definido na Tarefa 7 e consumido nas 9–12.
- **Proporção:** o plano descreve decisões, assinaturas e testes; os corpos ficam com os agentes.
