# Frontend: Fase 3 (polimento), estagnação (2.6) e margem de peso

Data: 20/11/2026. Agente: `frontend`. Sem commit. Base: `ux-auditoria-fase-3.md`, `conteudo-adr-011.md` (parte C), `dados-adr-011-fase-2.md`, `seguranca-adr-011-telas.md`.

## 0. Margem de peso (ADR 011, orçamento)

| Medida (gzip) | Antes | Depois | Limite |
| --- | --- | --- | --- |
| JS da carga inicial | 203,5 KB (204,2 KB com o resumo da semana do outro frontend) | **190,9 KB** (folga de 14,1 KB) | 205 KB |
| CSS da carga inicial | 23,6 KB | 22,4 KB | 26 KB |
| JS total | 222,8 KB | 240,4 KB | 250 KB |

### O que saiu da carga inicial

Tudo continua no precache e funciona offline. Os módulos que saíram vão por `lazy`/`import()`:
- a aba **Evolução** (`App.tsx`);
- **Editar treino**, **Editar exercício**, **Novo treino** e **Biblioteca** (`treino/lazy.tsx`);
- a **página do exercício** (`ExercicioSheet`, via `treino/lazy.tsx`);
- a folha de **metas da dieta** (`dieta/MetasSheetLazy.tsx`).

As duas folhas carregam sem `Suspense`: o módulo chega por `useEffect` e a folha abre em seguida. Assim nada depende dos timers do React, que ficam parados nos e2e com relógio pausado. A página do exercício também é pré-carregada ao abrir a execução.

### Por que `data/exercise-guide.json` não saiu

Não deu para mover o guia sem mexer no domínio. `src/data/validation.ts` importa `checkStoredExerciseNotes` de `src/domain/exerciseNotes.ts`, e esse módulo importa o JSON no topo. Por isso o guia continua na carga inicial, com cerca de 4 KB gzip.

**Pedido ao `backend-dados`:** separar `checkStoredExerciseNotes` (e `EXERCISE_NOTE_MAX`) do guia, por exemplo em `exerciseNoteRules.ts`, e deixar o JSON só em `guideFor`. Com isso a página do exercício, que já é sob demanda, leva o guia junto.

### Atenção ao total

O JS total subiu 17,6 KB. Parte vem do resumo da semana (outro frontend, cerca de 6 KB) e parte do custo de cada chunk novo. O total está a 9,6 KB do limite.

## 1. Estagnação (ADR 011, 2.6)

`src/features/treino/Estagnacao.tsx`, o componente `AvisoEstagnacao`. Usa `stagnation()` com `exerciseHistory`, `planWeekIndex` e `beginner = Array.isArray(plan.rir)`.

### Onde aparece e como é

- Na execução, abaixo do nome e do grupo.
- Na página do exercício. A nota `STAGNATION_NOTE` aparece uma vez, junto dos recordes.
- Fundo `surface-2`, ícone de informação em `muted` e nenhuma cor de alerta.

### Ações

- **"Ajustar repetições":** troca o `r` do exercício no bloco atual e nos seguintes pela `novaFaixa` (`upsertExercise`), com Desfazer. O `kgSugerido` aparece só no texto.
- **"Trocar só hoje":** abre a troca existente. Só na execução, e só enquanto nenhuma série do exercício foi feita.
- **Semana leve (`deload`):** só texto, sem botão.

## 2. Fase 3: as 10 correções e os extras

### As 10 correções

1. Descanso com o tempo dentro do `role="timer"`, com o texto oculto "Descanso restante:" e sem `aria-label`. Botões falados como "Tirar 15 segundos", "Somar 15 segundos" e "Pular descanso" (ou "Fechar descanso"). No fim, anuncia "Descanso terminado. Próxima: série N.".
2. Na rota `executar`, a região global de salvamento não fala mais; o erro continua no alerta.
3. Um anúncio por série, numa região única da execução (`announce.ts`, função pura `setAnnouncement`).
   - Exemplo: "Série 2 registrada: 32,5 kg, 5 repetições. Recorde de carga: …. Descanso de 2 min 30 s."
   - Desmarcar e Desfazer também são anunciados.
   - O toast ganhou a opção `silent` em `showToast`: o Desfazer continua, mas o toast não fala de novo.
   - A antiga região `ex-copied` saiu.
4. Série ativa = primeira linha não feita.
   - Fundo `surface-2`, número em 700 e `aria-current="step"`.
   - Depois de marcar, a série ativa rola para cima do rodapé (`block: 'nearest'`, instantâneo com movimento reduzido).
   - Medido em 390 × 844: base da série ativa em y = 452 e topo do rodapé em y = 664.
5. Com o exercício completo, o rodapé mostra "Próximo: {nome}" (secundário, 48 px) acima de "Concluir treino". Trocar de exercício anuncia "{nome}, Nº de M exercícios". A frase foi escolhida para não repetir o texto visível "Exercício N de M", que os e2e procuram.
6. **Dieta:** saíram os 3 cartões. "N kcal restantes" (ou "acima da meta") virou a linha de apoio do anel. As refeições subiram de y ≈ 1450 para y ≈ 624.
7. Cronômetro geral em 1,125rem, peso 600, formato `m:ss` (`h:mm:ss` a partir de 1 h).
8. h1 por rota: "Upper A, em andamento" na execução e "Treino concluído" no Concluído, que recebe o foco. Conferido no navegador.
9. **Detalhe:** os metadados ganharam espaço de 6 px entre ícone e texto, e sumiu o "·" herdado do Início. O anel usa `weekLabel` ("Semana 05 de 12").
10. Sugestão (placeholder) em peso 400 e `muted`; valor digitado em peso 700 e `foreground`.

### Extras

- **Aba ativa do Detalhe:** `primary` sólido. Contraste de 5,2:1 sobre `surface-2` no claro e 6,3:1 no escuro (antes, 1,06:1 e 1,08:1). O contador saiu do parêntese: "Exercícios 10", sem quebrar em 390 px.
- **Movimento (ADR 006):**
  - `CountUp` com 350 ms por padrão; contadores até 20 aparecem prontos no Início.
  - As barras de macros e a barra do descanso animam só com `transform: scaleX`.
  - Folha e menu usam `--mv-ease`.
  - Fica de fora: a barra da Evolução (`evolucao.css`) também anima `height`. Corrigir quando a pasta estiver livre.
- **Desfazer:** o código já usava 6 s (`TOAST_MS`). O `DESIGN.md` foi ajustado para 6 s. Também foi corrigido o contraste de `input` (4,49:1).
- **Microinterações** (todas desligadas com movimento reduzido, exceto a vibração):
  - Marcar série: ✓ pressionado em 0,92 por 100 ms e traço de 200 ms. O painel de descanso entra em 200 ms (opacidade e 8 px).
  - Recorde: linha em 240 ms (atraso de 120), troféu de 0,85 a 1 em 280 ms e `recordHaptic()` `[12, 60, 12]` em `src/pwa/haptics.ts`.
  - Concluído: sequência abaixo de 800 ms (marca, título aos 180 ms, cartões aos 260/320/380 ms, total aos 380 ms, recordes aos 500 ms). "soma de carga × repetições" visível. Séries e Total levantado ficam sem `CountUp`: com o relógio pausado dos e2e, a contagem ficaria parada em 0.

## Pedidos de segurança (seguranca-adr-011-telas.md)

- **M-T1:** a prévia das observações sai do próprio `buildPlanShare(state, { includeNotes: true, includeSched })`. Com isso entram o treino `alt` e os citados só pela rotina, com o texto exato do arquivo.
- **B-T1:** o resumo da semana ganhou a opção "Incluir a dieta", marcada por padrão e não salva. Desmarcada, tira a linha da dieta da tela e do PNG (`cardContent({ diet })`).

## Seletores de e2e que mudaram (para o `qa-testes`; `tests/` não foi editado)

Suíte completa: as únicas falhas que restam vêm destas mudanças, todas legítimas:
- `entrega-a-executar`: `:62` e `:213`.
- `metas-dieta`: `:84` e `:163`.
- `entrega-b-dieta`: `:49` e `:274`.

As demais falhas de uma rodada anterior eram ENOENT em `test-results/`, causadas por outra execução simultânea do Playwright, e passaram ao rodar de novo.

Mudanças de nome acessível ou de texto:
- `−15 s`, `+15 s` e `Pular` agora se chamam "Tirar 15 segundos", "Somar 15 segundos" e "Pular descanso" (`entrega-a-executar.spec.ts:72-88`). "Fechar" no descanso terminado virou "Fechar descanso".
- O `role="timer"` não tem mais `aria-label`; o nome vem do conteúdo ("Descanso restante: 2:30").
- A região `.ex-copied` saiu. O recorde segue visível em `.ex-pr` e falado na região única da execução.
- O cronômetro geral agora usa `m:ss`, não `00:00:00`.
- Detalhe: a aba diz "Exercícios 10" (sem parênteses) e o anel diz "Semana 05 de 12".
- Dieta: os cartões "Meta diária", "Consumidas" e "Restantes" (`.dt-stat`) saíram. Fica a linha `.dt-ring-left`, "N kcal restantes", abaixo do anel. As metas da Dieta agora se leem no anel ("de N kcal") e nas macros.

## Verificação

- `npm run typecheck`: limpo. `npm run build`: verde.
- **Navegador:** Playwright/Chromium, 390 × 844, claro e escuro, data real, com `demo-backup.json` e um backup sintético de estagnação. Capturas em `capturas/fase3/`. Sem erros de console e sem rolagem horizontal.
- **Comparação com `docs/referencia-visual/tela-8.png` (Dieta):** o anel e as macros vêm primeiro e as refeições logo abaixo, como na referência. A faixa de 12 semanas e a identidade seguem o `DESIGN.md`.
- **Pendente (fora destas 10):** "Sugestão" ainda em azul (BAIXO na auditoria) e o lembrete de backup compacto no Início (MÉDIO).

## Itens finais (21/11)

- **Lembrete de backup compacto no Início.** `BackupReminder compact` vira uma linha neutra com:
  - um ponto em `warning`;
  - o texto "Backup pendente · Seus dados estão só neste aparelho.";
  - duas ações de texto com 44 px: "Fazer backup agora" e "Agora não".

  O fluxo é o mesmo: gerar, perguntar "Guardou o arquivo?" e então "Sim, guardei" ou "Ainda não". Ocupa 105 px em 390 × 844, contra a antiga caixa âmbar de cerca de 330 px. O Perfil continua com o cartão completo.
- **"Sugestão" sem azul** (execução e Detalhe). O rótulo fica em `muted` e o valor em `foreground` 600. Saiu também o estilo inline do Detalhe.
- **Barra da Evolução** (`evolucao.css`):
  - sem `transition: height` na trilha;
  - o preenchimento anima só com `transform: scaleY` a partir da base, em 300 ms com `--mv-ease`;
  - desligada com movimento reduzido.
- **Verificação:**
  - navegador em 390 × 844, claro e escuro, com o backup sintético e 8 dias de uso; capturas `capturas/fase3/08` a `10`; sem erros de console;
  - `tsc` sem erros em `src/` (o único erro atual está em `tests/e2e/entrega-b-dieta.spec.ts`, que o `qa-testes` está editando);
  - build verde: carga inicial de 187,0 KB de JS e 22,5 KB de CSS; total de 240,7 KB; demo isolada.
- **Seletor novo para o `qa-testes`:** o lembrete do Início agora é `.backup-line`, com título "Backup pendente". O texto "Seu backup semanal está pendente." continua só no sino.
