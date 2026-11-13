# Dados: elegibilidade da 3ª aula de jiu-jitsu

- `src/domain/jiujitsu.ts`: `thirdClassEligibility({ start, today, days, sleepOkByWeek?, plan? })` retorna `{ status: 'indisponivel'|'ainda-nao'|'elegivel', criteria: Criterion[], summary }`. Função pura, só sugestão.
- Regra: índice de semana atual >= 5; avalia as 3 últimas semanas completas (cur-3..cur-1).
- Aulas: `acts.bjj` com 2 ou mais por semana e nenhum `feel === 5`.
- Sono: novo campo opcional `settings.sleepOk?: Record<string, boolean>` (chave = índice da semana 0-based; true = sono de 7 h ou mais). A UI passa `settings.sleepOk` como `sleepOkByWeek`. Qualquer false reprova; faltando declaração fica `null`.
- Cargas: carga máxima (séries feitas) por exercício nos treinos UA/LW (ou nome /upper a|lower/i); queda entre semanas consecutivas reprova; semanas de deload (índice % 4 === 3) são ignoradas; sem pares comparáveis fica `null`.
- Sem migração: o campo é opcional e aditivo (StateV3 sem mudança de versão).
