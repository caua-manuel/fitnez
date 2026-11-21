# Frontend: ADR 011, Fase 2 (itens 2.1 a 2.4)

Data: 20/11/2026. Agente: `frontend`. Sem commit.

## O que mudou

- **2.1 Tela acesa, vibração e descanso**
  - `src/pwa/wakeLock.ts` (novo): `useWakeLock(ativo)` pede `navigator.wakeLock.request('screen')` ao abrir a execução, pede de novo no `visibilitychange` visível, solta ao concluir (`leaving`) ou ao desmontar; sem suporte ou com erro, silencioso. `wakeLockSupported()` exportado.
  - `src/pwa/haptics.ts` (novo): `canVibrate`, `vibrate(pattern, { enabled })` e `restEndHaptic()`; `enabled` reserva a futura opção de desligar. A vibração do fim do descanso saiu do `Executar.tsx`.
  - `Executar.tsx`: o relógio do descanso atualiza na hora no `visibilitychange` (além do intervalo de 500 ms). A chave do descanso passou a `storageKey('descanso')` (`src/app/mode.ts` já existe; no modo real continua `treino12:descanso`).
  - **Pendente do `backend-dados`**: `restoreRest(raw, { id, day, now })` em `src/domain/restTimer.ts`. O ponto de entrada está marcado com `TODO(ADR 011, 2.1)` acima de `readRest` em `Executar.tsx`, com o que a tela deve fazer em `terminado` (`setRest` + `setEnded(true)`, sem vibrar de novo).
- **2.2 Teclado, alvos e polegar**
  - Token `--tap-min: 48px` em `src/ui/styles.css` e em `DESIGN.md` (seções 4 e 7).
  - Repetições e segundos com `inputMode="numeric"`; carga com `decimal` (calculadora de anilhas também).
  - Toda a execução com 48 × 48 px ou mais: voltar, pausa, setas, nome, menu e itens, número da série, campos, caixa de marcar, botões do descanso, Desfazer, "Concluir treino" (52 px) e as folhas abertas da execução (classe `.ex-tap`). As 7 anilhas viram grade de 4 colunas para caber 48 px em 360 px.
  - Em 390 × 844, a primeira caixa de marcar começa em y = 640 e "Concluir treino" em y = 784 (metade de baixo); descanso e concluir ficam no rodapé fixo.
- **2.3 Histórico rápido**: `src/features/treino/HistoricoRapido.tsx` (novo). Folha aberta tocando no nome do exercício (com ícone de histórico) ou por "Últimas sessões" no menu. Usa `exerciseHistory` (já sem aquecimento), só dias anteriores a hoje, limite `QUICK_HISTORY_LIMIT = 5`. "Ver exercício" abre a página completa. Não navega: o que foi digitado e o descanso continuam.
- **2.4 Anilhas na série**: `AnilhasSheet` saiu de `ExercicioPagina.tsx` para `src/features/treino/Anilhas.tsx`, com `onUse` e `className`. Na série ativa (primeira série de trabalho não concluída) de exercício com barra, o botão "Anilhas para X kg" (carga digitada ou placeholder) fica logo abaixo da carga. "Usar X kg" aparece quando a conta não fecha ou quando a carga da folha é diferente da carga da série: preenche o campo e não conclui a série. "Calcular anilhas" continua no menu.
- Glifo `anilha` em `glyphs.tsx`; `ExercicioSheet` aceita `className`.

## Testes

- `npm run typecheck`: passou.
- `npx vitest run`: 551 de 554 passaram. As 3 falhas não vêm desta entrega: `assistente-perfis` (falha já conhecida) e 2 em `tests/integration/repository.test.ts` (exportação e lembrete semanal). Estas 2 vêm do trabalho do `backend-dados` em andamento (`src/data`, `src/application`, `meta.usage`).
- E2E de treino (`entrega-a-executar`, `ondas-hevy`, `entrega-a-treino`, `entrega-a-editor`, `hoje-livre-atalhos`, `pendencias-hoje`, `fase1`): 88 de 90 passaram. As 2 falhas são `fase1` "importação v1/v2", que esperam o aviso "Seu backup semanal está pendente" depois de importar. Isso é efeito da mudança do lembrete para 7 dias de uso (1.2, `backend-dados`), não da execução.
- Seletores ajustados por mudança legítima de tela: `entrega-a-executar` (repetições agora `numeric`); `ondas-hevy` (a página do exercício abre por "Mais opções" e "Ver exercício", porque o nome agora abre o histórico rápido).
- Verificação no navegador real (Playwright/Chromium, 390 × 844, claro e escuro, data real; capturas `capturas/fase2-*.png`, fora do Git):
  - Nenhum botão ou campo abaixo de 48 px na execução, com descanso ativo, no histórico ou nas anilhas.
  - `inputmode` conferido nos campos.
  - Histórico com 5 sessões, valor digitado preservado e foco de volta ao nome ao fechar.
  - Wake Lock simulado: pedido ao abrir, liberado e pedido de novo ao esconder e voltar, liberado ao sair.
  - "Usar 42,5 kg" a partir de 43 kg preenche a carga sem concluir a série.
  - 360 px com movimento reduzido sem rolagem horizontal.
  - Nenhum erro de console.

## Para o `qa-testes` (pedido)

E2E do ADR para a pasta `tests/`:

- Medir 48 px e conferir `inputmode` em 360 × 740.
- Histórico: abrir no meio de uma série e ver o valor intacto.
- Anilhas: abrir pela série, usar a carga e conferir que a série não é concluída.
- Wake Lock com a API simulada: pedido, novo pedido ao voltar, liberação ao concluir.
- Descanso com relógio simulado, depois de `restoreRest`.

O roteiro usado na verificação pode servir de base: o stub de `navigator.wakeLock` precisa soltar o bloqueio no `visibilitychange` oculto.

## Observação fora do escopo

O menu "⋮" do exercício aparece centralizado abaixo do grupo muscular, não no canto (já era assim antes desta entrega: `.ui-menu-wrap{position:relative}` vence `.ex-more{position:absolute}`). Não foi mexido para não mudar o layout aprovado; corrigir aproximaria as séries do topo (a caixa de marcar continuaria abaixo da metade).
