# Handoff backend-dados: ADR 011, Fase 1 (base, 1.2, 1.4, 1.3 e infraestrutura da 1.1)

Data: 20/11/2026. Estado continua `v: 3`; todos os campos novos são opcionais e validados só quando presentes. Backups v3 antigos importam sem conversão (teste). Nenhuma dependência nova. Sem commit.

## Arquivos

- Novos: `src/data/names.ts`, `src/data/demo.ts`, `src/app/mode.ts` (exceção combinada), `src/domain/planShare.ts`, `src/application/planShare.ts`, `src/demo/generate.ts`.
- Alterados: `src/application/repository.ts` (tipos e dois métodos novos), `src/data/index.ts` (opção `dbName`, dias de uso, `protection`, `snoozeBackup`, `markPrompt`), `src/data/validation.ts`, `src/domain/userData.ts`, `src/application/eraseAll.ts` (só usa `databaseName`).
- Testes existentes ajustados (mudança de contrato do ADR, de 7 dias de calendário para 7 dias de uso): dois casos de `tests/integration/repository.test.ts`.

## Campos novos

| Campo | Formato | Quem grava |
| --- | --- | --- |
| `meta.usage` | `{ lastDay: DayIso; daysSinceBackup: inteiro 0..100000 }` | `save` (no mesmo estado da gravação, sem transação extra); `confirmBackup` zera |
| `meta.prompts` | `{ persistAskedAt?: ms; installShownAt?: ms; backupSnoozedOn?: DayIso }` | `markPrompt`, `snoozeBackup` |
| `settings.planImport` | `{ v: 1; appliedOn: DayIso; name: string; undoKey?: string }` | `applyPlanShare` |
| `recovery['plan-import-undo:<t>']` | `{ kind, createdAt, plan, sched, start, startConfirmed, planImport }` | `applyPlanShare` (e `before-plan-import-undo:<t>` ao desfazer) |

`meta` continua sendo do repositório: `save` sempre ignora o `meta` vindo da tela, então `usage` e `prompts` só mudam pelas funções acima. Na importação de backup o `meta` do aparelho é mantido (como antes), então a contagem é a do aparelho.

## API para o frontend

### Modo (`src/app/mode.ts`, menos de 1 KB)
```ts
type AppMode = 'real' | 'demo';
appMode(): AppMode                 // lido uma vez da marca localStorage['treino12:<base>:modo'] e fixo até recarregar
storageKey(nome: string): string   // 'treino12:<nome>' no real, 'treino12:demo:<nome>' na demo
dbName(): string                   // banco do modo ativo (use no ErrorBoundary)
modeKey(): string                  // chave da marca (para o evento 'storage' das outras abas)
setDemoMark(): void                // só depois de a demo estar gravada no banco da demo
clearDemoMark(): void
readMode(storage, basePath): AppMode  // versão pura, para testes
```

### Repositório (`Repository`, `src/application/repository.ts`)
```ts
protection(input?: { requestPersistence?: boolean }): Promise<Protection>
  // backupDue agora = backupDue({ usage, lastBackupConfirmedAt, hasUserData, snoozedOn, today }) (7 dias de uso)
snoozeBackup(input: { expectedRevision: number }): Promise<StateV3>   // "Agora não": some até o dia seguinte
markPrompt(input: { prompt: 'persist' | 'install'; expectedRevision: number }): Promise<StateV3>
  // 'persist' grava persistAskedAt, 'install' grava installShownAt (instante atual)
```
As três gravações aumentam a revisão: use o estado devolvido (como em `confirmBackup`), senão o próximo `save` dá conflito. Não contam como dia de uso.

Fluxo sugerido no primeiro treino real concluído (1.2 + 1.4, uma tela só): se `shouldAskPersistence(...)` chame `protection({ requestPersistence: true })` e depois `markPrompt({ prompt: 'persist' })`; se `shouldOfferInstall(...)` mostre o cartão e chame `markPrompt({ prompt: 'install' })` ao mostrar.

### Regras puras (`src/domain/userData.ts`)
```ts
interface Usage { lastDay: DayIso; daysSinceBackup: number }
interface Prompts { persistAskedAt?: number; installShownAt?: number; backupSnoozedOn?: DayIso }
nextUsage(usage: Usage | null | undefined, today: DayIso): Usage
usageAfterBackup(usage: Usage | null | undefined, today: DayIso): Usage
backupDue(input: { usage; lastBackupConfirmedAt: number | null; hasUserData: boolean; snoozedOn: DayIso | null | undefined; today: DayIso }): boolean
hasCompletedWorkout(days: state.history.days): boolean   // use como firstWorkoutDone
shouldOfferInstall(input: { prompts; installMode: string; demo: boolean; firstWorkoutDone: boolean }): boolean
shouldAskPersistence(input: { prompts; persistence: string | undefined; demo: boolean; firstWorkoutDone: boolean }): boolean
```
`shouldShowBackupReminder(state, protection.backupDue)` continua valendo sem mudança.

### Compartilhar plano (`src/domain/planShare.ts`, puro)
```ts
buildPlanShare(state, opts: { name: string; includeNotes: boolean; includeSched?: boolean /* padrão true */ }):
  { ok: true; file: PlanShareFile; text: string; filename: string; warnings: string[] } | { ok: false; error: string }
parsePlanShare(text: string): { ok: true; value: PlanShareFile; warnings: string[] } | { ok: false; error: string }
checkPlanShare(value: unknown): mesmo retorno (objeto já lido)
planShareDiff(currentPlan: Plan, shared: PlanShareFile, currentSched?: Payload[]): PlanShareDiff
  // exercises/sessions: { added: string[]; same: string[]; renamed: { from; to; name }[] }
  // mapping: { ex, sess } (id do arquivo -> id final); kept: meus exercícios que ficam no catálogo
  // hasSched: o arquivo traz rotina; schedRemap: { day; from; to }[] se eu mantiver a minha rotina
planShareFilename(name: string): string   // fitnez-plano-<nome>.json
PLAN_SHARE_LIMITS                          // limites para os maxLength da tela
```
Os textos de `error` e `warnings` já estão em português, prontos para a tela.

### Aplicar e desfazer (`src/application/planShare.ts`)
```ts
applyPlanShare(repo, input: { file: PlanShareFile; start: DayIso; today: DayIso; includeSched?: boolean /* padrão false */; expectedRevision: number; now?: number }): Promise<StateV3>
undoPlanShare(repo, input: { expectedRevision: number; now?: number }): Promise<StateV3>
canUndoPlanShare(state): boolean
applyPlanShareToState(state, file, { start, today, now, includeSched? }): StateV3   // puro
undoPlanShareInState(state, now): StateV3                                          // puro
```

### Demonstração (`src/data/demo.ts` e `src/demo/generate.ts`)
```ts
createDemoRepository(options?: Omit<RepositoryOptions, 'dbName' | 'storage'>): Repository
  // banco 'treino12:demo:<base>'; export/prepareImport/confirmImport/confirmBackup recusam com RepositoryError('validation');
  // protection() -> { persistence: 'unavailable', backupDue: false, ... }; não lê o protótipo legado
deleteDemoDatabase(options?: { basePath?: string; indexedDB?: IDBFactory | null }): Promise<void>   // idempotente
demoDatabaseName(basePath?): string
demoState(today: DayIso, empty: StateV3): StateV3   // em src/demo/generate.ts, só por import('../demo/generate')
```
Entrar: `const { demoState } = await import('../demo/generate')`; `createDemoRepository()`, `initialize()`, `save({ state: demoState(hoje, init.state), expectedRevision })`, fechar, `setDemoMark()`, recarregar. Sair: `clearDemoMark()`, fechar o repositório da demo, `deleteDemoDatabase()`, recarregar. Na abertura em modo real, chamar `deleteDemoDatabase()` sem esperar.

## Decisões e desvios

- Ids no plano compartilhado: aceito `^[A-Za-z0-9_-]{1,40}$` (com maiúsculas), porque os treinos de fábrica são `UA`, `UB`, `LW`, `LB`; o padrão do ADR (só minúsculas) recusaria o próprio plano de fábrica. `__proto__`, `prototype` e `constructor` são recusados.
- A regra de colisão vale também para os treinos: mesmo id com nome diferente ganha id livre (`UA-2`), porque `workouts[sessionId]` no histórico é indexado pelo id do treino.
- Sem marcar a rotina, a minha continua; dias de academia que apontariam para treino que deixou de existir passam para os treinos novos, na ordem (`schedRemap`, mostrado na revisão). Desfazer devolve a rotina original.
- Mesmo exercício: a prescrição do arquivo vale; observação e grupo que o arquivo não traz continuam os meus. `alt` e `rir` ausentes no arquivo são removidos; `cond` ausente mantém o meu.
- Limites que o ADR não fixou: repetições e RIR até 30 caracteres, condomínio até 30 itens de até 300 caracteres, nome do esporte até 30, profundidade do JSON até 12. `g: ''` ("sem grupo") é aceito.
- Rotina no arquivo: só `k`, `s`, `gi`, `label`; `buildPlanShare` grava só o que faz sentido para cada tipo de dia. Se a rotina aponta para treino inexistente, o arquivo sai sem rotina e com aviso.
- `backupDue` não usa mais os dias de calendário; um relógio adiantado já não dispara o lembrete sozinho. Gerar o backup não zera: só confirmar.

## Pendente: números da demo (PROVISÓRIO)

`docs/handoffs/conteudo-adr-011.md` ainda não existia. Todos os números estão em `DEMO_PARAMS`, no topo de `src/demo/generate.ts`, marcados "PROVISÓRIO: aguardando conteudo-treino-nutricao": perfil fictício ("Pessoa de exemplo", 30 anos, 175 cm), cargas iniciais por exercício, ritmo de repetições, falta (semana 2, 2º treino) e parcial (semana 3, 1º treino, metade), presença no jiu-jitsu e no vôlei, medidas (80 kg e 90 cm, -0,3 kg e -0,4 cm por semana) e adesão à dieta (70% dos dias). As cargas sobem pela própria `suggestNext`; na semana leve, séries pela metade (`setsForWeek`) e carga mantida.

## Testes criados

- `tests/unit/userData-uso.test.ts`: `nextUsage` (mesmo dia não conta duas vezes, relógio para trás, teto), `usageAfterBackup`, `backupDue` (7º dia dispara, adiado só hoje, sem dados, sem `usage`), `shouldOfferInstall`, `shouldAskPersistence`, `hasCompletedWorkout`.
- `tests/unit/adr011-base.test.ts`: nomes dos bancos e da marca, `readMode`, `storageKey`; validação de `meta.usage`, `meta.prompts` e `settings.planImport` (aceita e recusa).
- `tests/unit/planShare.test.ts`: ida e volta, nada pessoal (lista de chaves e textos), observações opcionais, chave desconhecida em cada nível, chave perigosa, número infinito, versão mais nova, cada limite no valor e no valor + 1 (incluindo 200 KB antes do parse), rotina e referências inexistentes, colisão de id.
- `tests/unit/demo-generate.test.ts`: determinismo, entrada intacta, `validateState`, nada depois de hoje, hoje na semana 5, 1 falta e 1 parcial, semana leve com metade das séries, cargas que nunca caem e não sobem na semana leve; verificação estática (nenhum `import` estático de `src/demo/`, `import()` só em `src/app/`, entrada `generate.ts` e nunca `index.ts`).
- `tests/integration/protecao-uso.test.ts`: contador na mesma escrita do `save`, abrir sem gravar não conta, `confirmBackup` zera, "Agora não", relógio para trás, `markPrompt`, backup v3 sem `meta.usage` importa, `meta.usage` inválido recusado.
- `tests/integration/plan-share.test.ts`: aplicar numa só escrita, registros e notas intactos, rotina opcional, desfazer idêntico, conflito de revisão, arquivo adulterado, ida e volta entre dois aparelhos.
- `tests/integration/demo.test.ts`: entrar e sair não muda nenhum byte do banco real, banco real nunca criado na demo, recusas da demo, saída apaga o banco (idempotente), marca sem banco abre demo vazia sem ler o legado e regenerável, bancos separados.

Resultado: `npm run typecheck` sem erros; `npx vitest run` com 657 de 658 aprovados. A única falha é a conhecida de proteína em `tests/unit/assistente-perfis.test.ts`, que aguarda o conteúdo.
