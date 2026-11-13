# Frontend: data de início do plano e Início antes do plano

- Novo `src/features/perfil/DataInicioSheet.tsx`: Sheet "Data de início do plano" (input date, texto da segunda-feira com dd/mm ao vivo, Salvar, Começar esta semana, Cancelar), validação (data válida, 2020 a 2100) e hook `useSetPlanStart` (grava `settings.start` = `mondayOf(dia)` via commit, `showToast('Plano começa em dd/mm')` com Desfazer; não toca no histórico).
- Perfil: a linha "Meu plano" agora é botão que abre o Sheet (antes era link para Treinos).
- Início, fase `pre`: título "Seu plano começa em N dias" + "Segunda-feira, dd/mm" (sem "Antes do plano"); cartão com o primeiro treino previsto (o de hoje, se for de academia; senão o primeiro da rotina), com duração, exercícios e foto; botões "Começar o plano hoje" (Sheet de confirmação, início = segunda-feira desta semana) e "Treinar agora (sem alterar o plano)" (abre a execução, sem mexer em `settings.start`); "Registrar outro dia" e "Data de início" ficam abaixo. Em dia passado escolhido, só "Ver treinos".
- Fase `done`: "Reiniciar o plano" (abre o Sheet de data) e "Ver evolução"; "Data de início" também disponível.
- Dieta e Treino no pré-plano já usam o dia da semana (`dayTypeFor`, `planWeek`), sem alteração.
- Testes: `tests/e2e/entrega-a-inicio.spec.ts` (pré-semana estendido; novo caso do Perfil com validação, desfazer e recarga). Verificação visual 390x844 claro e escuro, sem rolagem horizontal.
- Limite conhecido: "Reiniciar o plano" não foi coberto por e2e.

## Correção de rótulo (pré-plano)
- O cartão do Início pré-plano mostra o treino do dia da semana de hoje pela rotina: "Treino de hoje · quinta-feira" (dia da semana real). Se hoje não for de academia (jiu-jitsu, vôlei, descanso), o cartão do tipo do dia aparece sem controles de registro, seguido do "Primeiro treino do plano", que é o que "Treinar agora (sem alterar o plano)" abre.
