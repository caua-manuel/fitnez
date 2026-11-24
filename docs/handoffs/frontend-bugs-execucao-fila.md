# Frontend: rascunho da execução e fila após mutação recusada

## Bug 1: carga e repetições digitadas se perdiam
- Novo `src/features/treino/rascunho.ts`; ligado em `src/features/treino/Executar.tsx`.
- Grava as linhas **não concluídas** com algo digitado 400 ms após digitar, ao trocar de exercício, em `visibilitychange` (oculto), `pagehide` e ao sair da tela. Restaura ao reabrir; limpa ao concluir o treino.
- Escolha: `localStorage`, chave `storageKey('rascunho:<base>:<dia>:<sessão>')` (na demo vira `treino12:demo:…`). Não usei o `log` do dia pela fila porque gravar ali cria o treino como `partial` (muda "Continuar treino", resumo da semana e contagens) só por digitar. Não precisei mexer em `src/data` nem `src/domain`.
- Garantias: o rascunho só preenche `kg`/`reps` de linhas existentes e não concluídas; `done` nunca muda, então não vira série nem recorde. O texto é validado (só dígitos, vírgula e ponto, até 8 caracteres).
- Limite: não há "descartar treino" na execução; rascunhos de dias antigos ficam até a mesma combinação dia+sessão ser reaberta e concluída (são poucos bytes).

## Bug 2: fila travava após mutação recusada (`src/app/commitQueue.ts`)
- A fila guarda o último estado salvo e separa três casos:
  - (a) recusa por validação (`RepositoryError` com `code: 'validation'`): regrava o lote uma mutação por vez sobre o salvo, descarta só as recusadas (o `commit` delas devolve `false`), volta a tela ao salvo mais as aceitas e a fila segue;
  - (b) falha passageira (quota, `transaction`, `DOMException` como QuotaExceeded, Abort ou InvalidState, erro desconhecido): mantém as mutações pendentes e o valor na tela, como antes; a próxima gravação tenta de novo (se a falha acontecer no meio do passo (a), essa mutação e as seguintes também continuam pendentes);
  - (c) conflito: reaplica como antes.
- `tests/integration/commit.test.ts` não foi alterado: o contrato antigo para falha genérica continua valendo.

## Testes
- Novos: `tests/unit/rascunho-execucao.test.ts`, `tests/integration/commit-recusa.test.ts` (casos (a) e (b); os de (a) falhavam antes), `tests/e2e/rascunho-executar.spec.ts` (390x844, claro e escuro; falhava antes do ajuste).
- `npm run check`: 793 testes, orçamento OK (carga inicial 188,3 de 205 KB). E2E de execução, adr011-academia, hoje-livre-atalhos e recuperacao-erro: 39 passaram.
- A recusa da fila foi verificada só em integração: no navegador não há como injetar uma mutação inválida sem um gancho de teste.
