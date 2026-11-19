# Conteúdo: decisões sobre as divergências das ondas Hevy

Data: 19/11/2026. Responsável: `conteudo-treino-nutricao`. Origem: seção "Divergências" de `dados-ondas-hevy.md`. Registro: ADR 009, seção "Revisão de 19/11/2026". Nenhum número do plano ou da dieta muda.

## 1. Aquecimento: vale a regra

- Arredondar ao múltiplo de 2,5 kg mais próximo. O "12 × 8" do exemplo 3 era erro de conta; corrigido no contrato.
- Motivo: uma regra única e testável. Se o halter de 12,5 não existir, a pessoa ajusta ao digitar (é só sugestão).
- Teste: `warmupSets({ exId: 'goblet', baseKg: 24 })` → `[{ kg: 12.5, reps: 8 }]`. A implementação atual já está certa; nada muda no código.

## 2. Faixa intermediária de grupos grandes: 8 a 16

- Uma faixa só para o app inteiro, igual à ADR 010 do assistente. `GROUP_RANGES` intermediário grandes passa de 8 a 14 para 8 a 16. Nunca (4 a 8), iniciante (6 a 10) e grupos menores não mudam.
- Motivo: o mesmo perfil não pode receber do assistente um plano de 15 séries e ver "acima da faixa" na tela de séries.
- Testes (intermediário, semana encerrada, fora da semana leve):
  - `quadriceps` 15 → `dentro`; 16 → `dentro`; 17 → `acima` (substitui o exemplo antigo 15 = `acima`).
  - `peito` 8 → `dentro`; 7 → `abaixo` (sem plano prevendo menos).

## 3. Plano de exemplo abaixo da faixa: piso pelo plano

- Não altera o plano nem baixa a faixa. Regra nova em `groupStatus`: `piso = min(min da faixa, séries previstas pelo plano ativo para o grupo naquela semana)`; sem previsão do grupo na semana, `piso = min da faixa`. `abaixo` se n < piso; `dentro` se piso ≤ n ≤ max; `acima` se n > max. Semana em andamento e semana leve continuam como antes.
- Motivo: o plano de exemplo usa volume moderado de pernas por escolha (recomposição, treino intenso em superiores); rotular "abaixo" quem cumpriu o plano contradiz o tom sem cobrança. Mudar o plano seria decisão do dono, com registro.
- Entrada sugerida: `groupStatus({ group, sets, experience?, inProgress, deload, planned? })`, onde `planned` é a soma de `setsForWeek` dos exercícios da semana com aquele `g` (o `backend-dados` escolhe onde calcular).
- Testes (intermediário, plano de exemplo, semana encerrada do bloco 1 e do bloco 3):
  - `quadriceps` 7 → `dentro`; 6 → `abaixo`; 17 → `acima`.
  - `panturrilha` 3 → `dentro`; 2 → `abaixo`; 11 → `acima`.
  - Bloco 2 (onde o plano já alcança a faixa): piso = min da faixa (8 e 4).
  - Sem `planned`: comportamento antigo (piso = min da faixa).
- O teste de consistência do plano contra a faixa fica, mas passa a conferir só `séries previstas ≤ max` em todos os grupos e blocos; os casos abaixo do mínimo deixam de ser falha.
