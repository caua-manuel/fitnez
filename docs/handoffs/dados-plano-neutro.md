# Dados: plano sem data de início pessoal

Resolve os achados B2 e C6 de `seguranca-limpeza-publica.md`.

## Contrato para a interface

- Novo campo opcional `settings.startConfirmed?: boolean` (em `StateV3`, sem nova versão do esquema: continua `v: 3`).
- Leitura: `isStartConfirmed(state.settings)` em `src/domain/planStart.ts`. Só `startConfirmed === false` significa "data padrão, ainda não escolhida"; campo ausente conta como confirmado.
- Usuário novo: `settings.start` = segunda-feira da semana de hoje (data local do aparelho, `defaultPlanStart(now)`) e `startConfirmed: false`. A interface deve abrir a escolha da data quando `!isStartConfirmed(settings)`.
- Como confirmar: gravar `settings.startConfirmed = true` (ou alterar `settings.start`). O `save` do repositório já marca `startConfirmed = true` sozinho quando `start` muda em relação ao estado atual, então `DataInicioSheet` passa a confirmar sem edição. Para "manter a data padrão", a interface precisa gravar `startConfirmed = true` explicitamente. Desfazer que restaura `start` anterior também resulta em confirmado.
- Também exportados: `localDayOf(ms)` e `defaultPlanStart(ms)`.

## O que muda para quem já tem dados

- Estado v3 existente, backup v3 importado e restauração: sem o campo, logo confirmado; data inalterada.
- Protótipo `treino12-v1`/`v2` com `start`: data preservada e `startConfirmed: true`.
- Protótipo legado sem `start` (antes recebia a data semente): passa a receber a segunda-feira padrão com `startConfirmed: false`, para o usuário escolher.
- Validação aceita `startConfirmed` ausente e rejeita valor não booleano. Não houve mudança de versão nem de migração de armazenamento.

## Arquivos

- Removido `start` de `data/plan.json` (nada mais alterado ali).
- `src/domain/planStart.ts` (novo), `src/data/migration.ts` (`foundation`, `migrate`), `src/data/validation.ts`, `src/data/index.ts` (`save`), `src/application/repository.ts` (tipo).
- Testes: `tests/integration/plan-start.test.ts` (novo). Fixtures com data neutra `2026-01-05` em `tests/e2e/base-ui.spec.ts`, `tests/e2e/fase1.spec.ts`, `tests/integration/repository.test.ts`, `tests/unit/eraseAll.test.ts`. Em `tests/e2e/entrega-a-inicio.spec.ts`, os dois testes de pré-semana e de data de início agora definem a data no próprio teste (relógio em 2026-02-12, início `2026-02-16`) em vez de depender do padrão do plano.
- Não alterei `tests/unit/calendar.test.ts`, `evolution.test.ts`, `workoutRecord.test.ts` e `csv.test.ts`: usam uma segunda-feira só como argumento de funções puras, sem semear estado.

## Verificação

- `npm run typecheck`: sem erros.
- `npm test`: 27 arquivos, 281 testes passando.
- E2E (Playwright) não foi executado nesta tarefa; os ajustes em `entrega-a-inicio.spec.ts` não foram rodados.
