# Deload: opção A (decisão do dono)

Nas semanas 3, 7 e 11: séries = max(1, ceil(n/2)) com n da coluna do bloco corrente; repetições da coluna do bloco anterior (semana 3 usa B1).
ESPECIFICACAO seção 3 (linha 75) emendada para descrever isso, com o exemplo do supino. Código (workout.ts setsForWeek) e teste (workout.test.ts) já conferem: semana 3 = 2 x 5–8, semana 7 = 3 x 5–8, semana 11 = 3 x 4–6. Nenhum código alterado.
Pendente: registrar a decisão em docs/decisoes/ (fora do meu escopo de escrita nesta tarefa).
