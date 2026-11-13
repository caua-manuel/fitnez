# Correções da Evolução (frontend)

- N3: nova `measuresOutsidePlan` em `src/domain/evolution.ts` (testes em `tests/unit/evolution.test.ts`); cartão "Medidas fora do plano" (antes e depois das 12 semanas) em `src/features/evolucao/Evolucao.tsx`. Só aparece quando existe medida fora do plano e evita o estado vazio.
- N4: tocar numa medida abre `Sheet` compartilhado com valor, variação e gráfico daquela medida (visível sem rolar); o mini-gráfico inline saiu.
- N2: ao salvar peso de hoje (válido e diferente do perfil) aparece a caixa "Atualizar o peso do perfil para X kg", ligada por padrão; grava `settings.profile.weightKg` no mesmo commit. Peso de data passada não oferece (não é o peso atual).
- Seletor de período agora usa `Select` compartilhado; folha de medidas usa `Sheet`; confirmação usa `showToast`. Gráfico principal ganhou região `role=status` com o resumo ao trocar o indicador.
- Pendência: item 5 (vários treinos por dia) aguarda `workoutRecord.ts`. CSS antigo `.ev-menu/.ev-option` ficou sem uso em `evolucao.css`.
- Observação para o dono de `src/ui/UndoToast`: o texto do aviso aparece em 2 elementos (os testes usam `.first()`).
- Observação: `src/features/dieta/GerenciarOpcoes.tsx` importava `UndoToast` de `./parts` (erro de tipos visto no meio da tarefa; o build final passou).
