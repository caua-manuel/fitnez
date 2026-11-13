# Frontend: Início com vários treinos, componentes compartilhados e 3ª aula de jiu-jitsu

- Início lê treinos só por `listWorkouts`/`getWorkout`/`isDone` (workoutRecord); não grava `workout`. Treino previsto concluído: "Concluído hoje", "Ver resultado" e "Fazer outro treino" (folha com os treinos ainda não concluídos). Outros treinos do dia aparecem em lista com estado e atalho.
- `Folha.tsx` local removida; Trocar treino, Registrar outro dia e Fazer outro treino usam `Sheet` de `src/ui`. Avisos viraram `showToast`; Trocar treino, Desmarcar aula e Desmarcar jogo têm Desfazer (a nota da aula volta junto).
- `.in-ghost` sem `nowrap`; abaixo de 380 px os dois botões empilham. Verificado em 320x640 (sem rolagem horizontal, sem corte).
- Dieta: o segmentado Treino/Dieta troca o cartão principal pelo resumo da dieta do dia (kcal, refeições e macros reais via `useDietDay`). Por decisão do dono (tela-7), os dois cartões inferiores Dieta e Evolução foram mantidos. Segmentado é grupo de botões com `aria-pressed`.
- 3ª aula (`TerceiraAula.tsx`): aparece com `thirdClassEligibility` != indisponivel; critérios Aulas/Sono/Cargas com ✓/✗/— mais texto (atende, não atende, sem dados), resumo e "só uma sugestão". Interruptor "Dormi 7 h ou mais nesta semana" (com texto Ligado/Desligado) grava `settings.sleepOk[índice da semana]`; desligar remove a chave. A declaração conta na avaliação a partir da semana seguinte (o domínio avalia as 3 semanas completas anteriores).
- Anel: rótulo "Semana N de 12: X% do plano". Itens da auditoria: 10 (Desmarcar aula), 12 (320 px), 14 (navegação duplicada), 18 (RIR explicado), foto cinza removida para treinos sem foto.
- Testes: `tests/e2e/entrega-a-inicio.spec.ts` (15 casos, dados sintéticos de 3 semanas, legado, vários treinos, desfazer, Dieta, 320x640).
- Pendência: o `ProgressRing` (treino) não aceita `aria-valuetext`; o rótulo já traz o percentual.
