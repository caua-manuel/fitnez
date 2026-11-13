# Dados Entrega A, Tarefa 3 (regras de treino)

- Criados src/domain/workout.ts e tests/unit/workout.test.ts (5 testes).
- Divergencia do plano: a formula escrita (coluna do bloco anterior para series) contradiz o caso semana 7 = 3 series. Implementado o que satisfaz todos os casos: series usam a coluna do bloco corrente (metade no deload); repeticoes usam a coluna do bloco anterior no deload. Semanas 3, 7 e 11 conferem.
- parseNumber aceita virgula, 0 e numeros; recusa vazio, texto, negativo, NaN, Infinity.
- Verificar: npm.cmd test -- tests/unit/workout.test.ts
