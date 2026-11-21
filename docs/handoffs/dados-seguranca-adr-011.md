# Handoff backend-dados: correções de segurança do ADR 011 (lado de dados)

Data: 20/11/2026. Origem: [seguranca-adr-011.md](seguranca-adr-011.md). Estado continua `v: 3`; único campo novo é `meta.demo` (opcional, só no banco da demo). Nenhuma dependência nova. Sem commit. `src/app/mode.ts` **sem mudança de API**.

## Arquivos

- Alterados: `src/application/eraseAll.ts`, `src/data/index.ts`, `src/data/demo.ts`, `src/data/validation.ts`, `src/demo/generate.ts`, `src/domain/planShare.ts`.
- Novo: `src/data/recoveryPrune.ts`.
- Testes: `tests/integration/seguranca-dados.test.ts` (novo), `tests/unit/planShare.test.ts` (B1 a B4).

## A1: apagar tudo na demonstração

`eraseAllData` recusa com `RepositoryError('validation')` **antes de abrir o IndexedDB** quando:
- `options.mode === 'demo'` (opção nova `mode?: AppMode`), ou
- a marca `localStorage['treino12:<base>:modo'] === 'demo'` (conferida no `storage` recebido ou no `localStorage` global).

Nada do localStorage ou do sessionStorage é limpo nesse caso. Teste: com a marca, e com `mode: 'demo'`, nenhum byte do banco real muda.

Para o frontend:
- Em `ApagarDados.tsx`, passar `mode: appMode()`, além de esconder e desativar a função na demo.
- No `ErrorBoundary.tsx`, usar `dbName()` de `src/app/mode.ts`. Na demo, oferecer só "Sair da demonstração" (`clearDemoMark()` + `deleteDemoDatabase()`).
- Eu não toquei nesses arquivos.

## M1: assinatura `meta.demo`

- `demoState` grava `meta.demo = true`.
- `createDemoRepository` usa a opção interna `demo: true` de `createRepository` (tipo `InternalRepositoryOptions`, só em `src/data/`). O `save` da demo mantém `meta.demo = true` quando o estado enviado o traz; as gravações seguintes a preservam, porque `meta` vem do banco.
- Um banco da demo só inicializado (marca sem demo gravada) **não** tem `meta.demo`. É o sinal para a tela fazer `clearDemoMark()`, `deleteDemoDatabase()` e recarregar no modo real.
- Banco real: `commit` apaga `meta.demo` de toda gravação, e a leitura também o remove. `prepareImport` recusa backup com `state.meta.demo === true` ("Este arquivo veio da demonstração...").
- `validateState`: `meta.demo`, se existir, precisa ser verdadeiro ou falso.

Fluxo de entrada continua o mesmo do handoff da fase 1: `initialize()` e depois `save({ state: demoState(hoje, init.state), ... })`. A checagem na abertura é `state.meta.demo === true`.

## M4: poda do `recovery`

- `recoveryToPrune(recovery, settings)` em `src/data/recoveryPrune.ts` mantém os **3 mais recentes** de cada prefixo `plan-import-undo:`, `before-plan-import-undo:` e `onboarding-undo:`.
- A ordem vem de `createdAt`, depois do instante da chave, depois do sufixo `:n`.
- Nunca apaga a chave de `settings.planImport.undoKey` nem a de `settings.onboarding.undoKey`, mesmo com o relógio para trás.
- É aplicada dentro do `commit`, na mesma transação: os registros são removidos do estado e apagados do store `recovery`. Isso cobre o assistente sem editar `application/onboarding.ts`.
- Teste: 405 aplicações de plano (com desfazeres no meio) deixam 3 registros no banco e o desfazer continua funcionando. 12 aplicações do assistente deixam 3.
- Fora do pedido: `before-import:*` (estado inteiro a cada importação de backup) também cresce sem poda. Recomendo a mesma regra num próximo passo; não apliquei porque é a cópia de segurança de uma restauração.

## Baixos

- B1 (feito): na rotina do arquivo, `s` só vale em `gym`, `gi` só em `bjj` e `label` só em `esporte`. Fora disso o arquivo é recusado. `buildPlanShare` já gerava assim, então a ida e volta não muda.
- B2 (feito): textos com caracteres de controle (C0, DEL, C1) ou de direção (U+061C, U+200E/F, U+202A a U+202E, U+2066 a U+2069) são recusados. Quebra de linha e tabulação só são aceitas na observação (`t`) e nos itens do condomínio.
- B3 (feito): ids que existem em `Object.prototype` (`toString`, `hasOwnProperty`, `valueOf`...) são recusados.
- B4 (feito): o id renomeado corta a base para que `<base>-n` caiba em 40 caracteres.
- B5 (não feito): datas futuras em `meta.usage` e `meta.prompts`. `validateState` não recebe "hoje", e o `meta` importado é descartado (`restoredState`), então hoje isso não tem efeito. Fica para quando houver um caminho que grave `meta` vindo de fora.
- B6 (frontend, só listo): chaves de sessão fora do `storageKey` em `src/features/treino/util.ts:127` (cursor), `src/features/treino/Detalhe.tsx:27`, `src/app/App.tsx:28` e `src/features/treino/NovoTreino.tsx:48`.
- M2 e M3 também são do frontend: conferir `file.size` antes de `file.text()`, e mostrar uma prévia das observações ou deixar a opção desmarcada.

## Também nesta rodada (2.6)

O conteúdo aprovou a regra C.2.6: `stagnation` devolve `null` quando `repRange(setsForWeek(ex, week).reps) === null`. Já está implementada. O caso 13 (Pallof) entrou na tabela, e `demo-generate.test.ts` agora garante que a demo não mostra nenhum aviso de estagnação. Registrado também em `dados-adr-011-fase-2.md`.

## Verificação

- `npx vitest run`: 49 arquivos, 766 de 766 aprovados.
- `npm run typecheck`: um único erro, de outro agente: `src/app/App.tsx` importa `../features/compartilhar/Compartilhar`, que ainda não existe (o frontend está fazendo a tela agora).
