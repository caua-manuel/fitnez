# Diagnóstico dos planos do assistente (matriz completa)

Gerado em 25/11/2026 a partir de `buildPlanFromAnswers` (sem alterar código). Só leitura.

- Combinações: 3 experiências × 3 locais × 3 tempos × 5 dias = 135. **O objetivo (perder, massa, recomp, saúde) não entra no cálculo do plano: as 4 opções geram o mesmo treino**, então não multiplicam a matriz.
- Séries = soma de `s[0]` (bloco 1) por grupo, contando cada treino as vezes que aparece na semana.
- Faixas do app (`GROUP_RANGES`): grandes (peito, costas, coxa, posterior/glúteo) nunca 4–8, iniciante 6–10, intermediário 8–16; pequenos (ombro lateral/posterior, press, bíceps, tríceps, panturrilha) nunca 2–6, iniciante 3–8, intermediário 4–10. Core não tem faixa (só conta se faltar).
- 🔴 = fora da faixa (↓ abaixo, ↑ acima, 0 = grupo ausente). Min. = estimativa grosseira (45 s por série + descanso do exercício), sem aquecimento.
- Exceções já documentadas (ADR 010): tempo curto sem mínimo; com 2 dias o mínimo é 2 × séries principais. Aqui tudo é marcado.
- Colunas Ex./Séries/Min. listam cada treino distinto da divisão, na ordem.

| Exp. | Local | Tempo | Dias | Divisão | Ex. | Séries | Min. | Peito | Costas | Coxa | Post/Glúteo | Ombro lat. | Ombro post. | Press ombro | Bíceps | Tríceps | Panturrilha | Core |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| nunca | academia | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 8/8 | 22/20 | 4 | 4 | 4 | 4 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | academia | curto | 3 | Corpo inteiro A / Corpo inteiro B | 4/4 | 8/8 | 22/20 | 4 | 6 | 6 | 6 | 🔴 0 | 🔴 0 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | academia | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 8/8/8/8 | 22/18/18/18 | 4 | 6 | 8 | 8 | 2 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | academia | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 8/8/8/8/8 | 18/18/20/18/18 | 6 | 6 | 8 | 8 | 4 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | academia | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 8/8/8/8 | 20/18/18/18 | 8 | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | academia | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 29/27 | 4 | 4 | 4 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| nunca | academia | médio | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 29/27 | 4 | 6 | 6 | 6 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| nunca | academia | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 12/12/12/12 | 29/25/25/25 | 4 | 6 | 8 | 8 | 4 | 2 | 2 | 4 | 2 | 4 | 4 |
| nunca | academia | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 12/12/12/12/12 | 25/25/27/25/25 | 6 | 6 | 8 | 8 | 6 | 6 | 2 | 4 | 4 | 4 | 6 |
| nunca | academia | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 12/12/12/12 | 27/25/25/25 | 8 | 8 | 8 | 8 | 🔴 8↑ | 🔴 8↑ | 4 | 4 | 4 | 4 | 8 |
| nunca | academia | longo | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 29/27 | 4 | 4 | 4 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| nunca | academia | longo | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 29/27 | 4 | 6 | 6 | 6 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| nunca | academia | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 12/12/12/12 | 29/25/25/25 | 4 | 6 | 8 | 8 | 4 | 2 | 2 | 4 | 2 | 4 | 4 |
| nunca | academia | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 12/12/12/12/12 | 25/25/27/25/25 | 6 | 6 | 8 | 8 | 6 | 6 | 2 | 4 | 4 | 4 | 6 |
| nunca | academia | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 12/12/12/12 | 27/25/25/25 | 8 | 8 | 8 | 8 | 🔴 8↑ | 🔴 8↑ | 4 | 4 | 4 | 4 | 8 |
| nunca | casa c/ equip. | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 8/8 | 21/20 | 4 | 4 | 4 | 4 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | casa c/ equip. | curto | 3 | Corpo inteiro A / Corpo inteiro B | 4/4 | 8/8 | 21/20 | 4 | 6 | 6 | 6 | 🔴 0 | 🔴 0 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | casa c/ equip. | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 8/8/8/8 | 21/18/18/18 | 4 | 6 | 8 | 8 | 2 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | casa c/ equip. | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 8/8/8/8/8 | 18/18/18/17/18 | 4 | 6 | 8 | 8 | 4 | 4 | 2 | 2 | 2 | 🔴 0 | 🔴 0 |
| nunca | casa c/ equip. | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 8/8/8/8 | 18/17/18/18 | 4 | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 4 | 🔴 0 | 🔴 0 |
| nunca | casa c/ equip. | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 28/27 | 4 | 4 | 4 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| nunca | casa c/ equip. | médio | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 28/27 | 4 | 6 | 6 | 6 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| nunca | casa c/ equip. | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 12/12/12/12 | 28/25/25/25 | 4 | 6 | 8 | 8 | 4 | 2 | 2 | 4 | 2 | 4 | 4 |
| nunca | casa c/ equip. | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 12/12/12/12/12 | 25/25/25/24/25 | 4 | 6 | 8 | 8 | 6 | 6 | 2 | 4 | 4 | 4 | 8 |
| nunca | casa c/ equip. | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 12/12/12/12 | 25/24/25/25 | 4 | 8 | 8 | 8 | 🔴 8↑ | 🔴 8↑ | 4 | 4 | 4 | 4 | 12 |
| nunca | casa c/ equip. | longo | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 28/27 | 4 | 4 | 4 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| nunca | casa c/ equip. | longo | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 28/27 | 4 | 6 | 6 | 6 | 4 | 2 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| nunca | casa c/ equip. | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 12/12/12/12 | 28/25/25/25 | 4 | 6 | 8 | 8 | 4 | 2 | 2 | 4 | 2 | 4 | 4 |
| nunca | casa c/ equip. | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 12/12/12/12/12 | 25/25/25/24/25 | 4 | 6 | 8 | 8 | 6 | 6 | 2 | 4 | 4 | 4 | 8 |
| nunca | casa c/ equip. | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 12/12/12/12 | 25/24/25/25 | 4 | 8 | 8 | 8 | 🔴 8↑ | 🔴 8↑ | 4 | 4 | 4 | 4 | 12 |
| nunca | casa livre | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 8/8 | 18/17 | 4 | 4 | 4 | 4 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | casa livre | curto | 3 | Corpo inteiro A / Corpo inteiro B | 4/4 | 8/8 | 18/17 | 4 | 6 | 6 | 6 | 🔴 0 | 🔴 0 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| nunca | casa livre | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 8/8/8/8 | 17/16/16/16 | 4 | 4 | 8 | 8 | 🔴 0 | 4 | 2 | 🔴 0 | 2 | 🔴 0 | 🔴 0 |
| nunca | casa livre | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 8/8/8/8/8 | 16/16/16/14/16 | 4 | 4 | 8 | 8 | 🔴 0 | 6 | 2 | 🔴 0 | 4 | 🔴 0 | 4 |
| nunca | casa livre | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 8/8/8/8 | 16/14/16/16 | 4 | 4 | 8 | 8 | 🔴 0 | 🔴 8↑ | 4 | 🔴 0 | 4 | 🔴 0 | 8 |
| nunca | casa livre | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 25/24 | 4 | 4 | 4 | 4 | 🔴 0 | 4 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| nunca | casa livre | médio | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 25/24 | 4 | 6 | 6 | 6 | 🔴 0 | 6 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| nunca | casa livre | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 5/6/5/6 | 10/12/10/12 | 21/23/21/23 | 4 | 4 | 8 | 8 | 🔴 0 | 4 | 4 | 🔴 0 | 4 | 4 | 4 |
| nunca | casa livre | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 5/6/5/4/6 | 10/12/10/8/12 | 21/23/19/14/23 | 4 | 4 | 8 | 8 | 🔴 0 | 6 | 4 | 🔴 0 | 4 | 4 | 10 |
| nunca | casa livre | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 5/4/6/6 | 10/8/12/12 | 19/14/23/23 | 4 | 4 | 8 | 8 | 🔴 0 | 🔴 8↑ | 4 | 🔴 0 | 4 | 4 | 16 |
| nunca | casa livre | longo | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 25/24 | 4 | 4 | 4 | 4 | 🔴 0 | 4 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| nunca | casa livre | longo | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 12/12 | 25/24 | 4 | 6 | 6 | 6 | 🔴 0 | 6 | 2 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| nunca | casa livre | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 5/6/5/6 | 10/12/10/12 | 21/23/21/23 | 4 | 4 | 8 | 8 | 🔴 0 | 4 | 4 | 🔴 0 | 4 | 4 | 4 |
| nunca | casa livre | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 5/6/5/4/6 | 10/12/10/8/12 | 21/23/19/14/23 | 4 | 4 | 8 | 8 | 🔴 0 | 6 | 4 | 🔴 0 | 4 | 4 | 10 |
| nunca | casa livre | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 5/4/6/6 | 10/8/12/12 | 19/14/23/23 | 4 | 4 | 8 | 8 | 🔴 0 | 🔴 8↑ | 4 | 🔴 0 | 4 | 4 | 16 |
| iniciante | academia | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/11 | 33/28 | 6 | 6 | 🔴 5↓ | 6 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | academia | curto | 3 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/11 | 33/28 | 6 | 9 | 8 | 9 | 🔴 0 | 🔴 0 | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | academia | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 12/10/10/10 | 33/24/24/24 | 6 | 9 | 10 | 10 | 🔴 2↓ | 🔴 2↓ | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | academia | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 10/10/11/10/10 | 24/24/28/24/24 | 9 | 9 | 10 | 10 | 4 | 4 | 3 | 🔴 2↓ | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | academia | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 8/8/8/8 | 20/18/18/18 | 8 | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | academia | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 16/15 | 40/35 | 6 | 6 | 🔴 5↓ | 6 | 🔴 2↓ | 🔴 2↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| iniciante | academia | médio | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 16/15 | 40/35 | 6 | 9 | 8 | 9 | 4 | 🔴 2↓ | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| iniciante | academia | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 16/14/14/14 | 40/30/31/30 | 6 | 9 | 10 | 10 | 4 | 🔴 2↓ | 3 | 4 | 🔴 2↓ | 4 | 4 |
| iniciante | academia | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 14/14/15/14/14 | 31/30/35/30/30 | 9 | 9 | 10 | 10 | 6 | 6 | 3 | 4 | 4 | 4 | 6 |
| iniciante | academia | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 12/12/12/12 | 27/25/25/25 | 8 | 8 | 8 | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 8 |
| iniciante | academia | longo | 2 | Corpo inteiro A / Corpo inteiro B | 8/8 | 20/19 | 47/42 | 6 | 6 | 🔴 5↓ | 6 | 🔴 2↓ | 🔴 2↓ | 🔴 0 | 🔴 2↓ | 🔴 2↓ | 4 | 4 |
| iniciante | academia | longo | 3 | Corpo inteiro A / Corpo inteiro B | 8/8 | 20/19 | 47/42 | 6 | 9 | 8 | 9 | 4 | 🔴 2↓ | 3 | 4 | 🔴 2↓ | 6 | 6 |
| iniciante | academia | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 7/7/7/7 | 18/16/17/16 | 44/33/39/33 | 6 | 9 | 10 | 10 | 4 | 🔴 2↓ | 6 | 4 | 4 | 4 | 8 |
| iniciante | academia | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 7/7/7/7/7 | 17/16/17/16/16 | 39/33/38/33/33 | 9 | 9 | 10 | 10 | 6 | 6 | 6 | 4 | 4 | 4 | 14 |
| iniciante | academia | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 7/7/7/7 | 14/14/14/14 | 30/28/28/28 | 8 | 8 | 8 | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 20 |
| iniciante | casa c/ equip. | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/11 | 32/28 | 6 | 6 | 🔴 5↓ | 6 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | casa c/ equip. | curto | 3 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/11 | 32/28 | 6 | 9 | 8 | 9 | 🔴 0 | 🔴 0 | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | casa c/ equip. | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 12/10/10/10 | 32/24/24/24 | 6 | 9 | 10 | 10 | 🔴 2↓ | 🔴 2↓ | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | casa c/ equip. | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 10/10/10/10/10 | 24/24/24/22/24 | 6 | 9 | 10 | 10 | 4 | 4 | 3 | 🔴 2↓ | 🔴 2↓ | 🔴 0 | 🔴 0 |
| iniciante | casa c/ equip. | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 8/8/8/8 | 18/17/18/18 | 🔴 4↓ | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 4 | 🔴 0 | 🔴 0 |
| iniciante | casa c/ equip. | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 16/15 | 38/35 | 6 | 6 | 🔴 5↓ | 6 | 🔴 2↓ | 🔴 2↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| iniciante | casa c/ equip. | médio | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 16/15 | 38/35 | 6 | 9 | 8 | 9 | 4 | 🔴 2↓ | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| iniciante | casa c/ equip. | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 16/14/14/14 | 39/30/31/30 | 6 | 9 | 10 | 10 | 4 | 🔴 2↓ | 3 | 4 | 🔴 2↓ | 4 | 4 |
| iniciante | casa c/ equip. | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 14/14/14/14/14 | 31/30/30/29/30 | 6 | 9 | 10 | 10 | 6 | 6 | 3 | 4 | 4 | 4 | 8 |
| iniciante | casa c/ equip. | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 12/12/12/12 | 25/24/25/25 | 🔴 4↓ | 8 | 8 | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 12 |
| iniciante | casa c/ equip. | longo | 2 | Corpo inteiro A / Corpo inteiro B | 8/8 | 20/19 | 45/42 | 6 | 6 | 🔴 5↓ | 6 | 🔴 2↓ | 🔴 2↓ | 🔴 0 | 🔴 2↓ | 🔴 2↓ | 4 | 4 |
| iniciante | casa c/ equip. | longo | 3 | Corpo inteiro A / Corpo inteiro B | 8/8 | 20/19 | 45/42 | 6 | 9 | 8 | 9 | 4 | 🔴 2↓ | 3 | 4 | 🔴 2↓ | 6 | 6 |
| iniciante | casa c/ equip. | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 7/7/7/7 | 18/16/17/16 | 42/33/39/33 | 6 | 9 | 10 | 10 | 4 | 🔴 2↓ | 6 | 4 | 4 | 4 | 8 |
| iniciante | casa c/ equip. | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 7/7/6/7/7 | 17/16/14/16/16 | 39/33/30/32/33 | 6 | 9 | 10 | 10 | 6 | 6 | 6 | 4 | 4 | 4 | 14 |
| iniciante | casa c/ equip. | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/7/7/7 | 12/14/14/14 | 25/27/28/28 | 🔴 4↓ | 8 | 8 | 8 | 8 | 8 | 4 | 4 | 4 | 4 | 20 |
| iniciante | casa livre | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/11 | 27/24 | 6 | 6 | 🔴 5↓ | 6 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | casa livre | curto | 3 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/11 | 27/24 | 6 | 9 | 8 | 9 | 🔴 0 | 🔴 0 | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| iniciante | casa livre | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 11/10/10/10 | 24/21/21/21 | 6 | 6 | 10 | 10 | 🔴 0 | 4 | 3 | 🔴 0 | 🔴 2↓ | 🔴 0 | 🔴 0 |
| iniciante | casa livre | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 10/10/10/9/10 | 21/21/21/16/21 | 6 | 6 | 10 | 10 | 🔴 0 | 6 | 3 | 🔴 0 | 4 | 🔴 0 | 4 |
| iniciante | casa livre | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 8/8/8/8 | 16/14/16/16 | 🔴 4↓ | 🔴 4↓ | 8 | 8 | 🔴 0 | 8 | 4 | 🔴 0 | 4 | 🔴 0 | 8 |
| iniciante | casa livre | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 16/15 | 34/30 | 6 | 6 | 🔴 5↓ | 6 | 🔴 0 | 4 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 4 |
| iniciante | casa livre | médio | 3 | Corpo inteiro A / Corpo inteiro B | 6/6 | 16/15 | 34/30 | 6 | 9 | 8 | 9 | 🔴 0 | 6 | 3 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| iniciante | casa livre | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 5/6/5/6 | 13/14/13/14 | 27/27/27/27 | 6 | 6 | 10 | 10 | 🔴 0 | 4 | 6 | 🔴 0 | 4 | 4 | 4 |
| iniciante | casa livre | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 5/6/5/4/6 | 13/14/12/9/14 | 27/27/24/16/27 | 6 | 6 | 10 | 10 | 🔴 0 | 6 | 6 | 🔴 0 | 4 | 4 | 10 |
| iniciante | casa livre | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 5/4/6/6 | 10/8/12/12 | 19/14/23/23 | 🔴 4↓ | 🔴 4↓ | 8 | 8 | 🔴 0 | 8 | 4 | 🔴 0 | 4 | 4 | 16 |
| iniciante | casa livre | longo | 2 | Corpo inteiro A / Corpo inteiro B | 7/8 | 18/19 | 37/37 | 6 | 6 | 🔴 5↓ | 6 | 🔴 0 | 4 | 🔴 0 | 🔴 0 | 🔴 2↓ | 4 | 4 |
| iniciante | casa livre | longo | 3 | Corpo inteiro A / Corpo inteiro B | 7/8 | 18/19 | 37/37 | 6 | 9 | 8 | 9 | 🔴 0 | 6 | 3 | 🔴 0 | 🔴 2↓ | 6 | 6 |
| iniciante | casa livre | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 5/7/5/7 | 13/16/13/16 | 27/30/27/30 | 6 | 6 | 10 | 10 | 🔴 0 | 4 | 6 | 🔴 0 | 4 | 4 | 8 |
| iniciante | casa livre | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 5/7/5/4/7 | 13/16/12/9/16 | 27/30/24/16/30 | 6 | 6 | 10 | 10 | 🔴 0 | 6 | 6 | 🔴 0 | 4 | 4 | 14 |
| iniciante | casa livre | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 5/4/7/7 | 10/8/14/14 | 19/14/26/26 | 🔴 4↓ | 🔴 4↓ | 8 | 8 | 🔴 0 | 8 | 4 | 🔴 0 | 4 | 4 | 20 |
| intermediário | academia | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/12 | 39/35 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | academia | curto | 3 | Superior A / Pernas A / Corpo inteiro B | 4/4/4 | 12/12/12 | 39/30/35 | 🔴 3↓ | 9 | 9 | 9 | 🔴 0 | 🔴 0 | 6 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | academia | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 12/12/12/12 | 39/30/35/30 | 🔴 6↓ | 12 | 12 | 12 | 🔴 3↓ | 🔴 0 | 🔴 3↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | academia | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 12/12/12/12/12 | 35/30/35/30/30 | 9 | 12 | 12 | 12 | 6 | 🔴 3↓ | 🔴 3↓ | 🔴 3↓ | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | academia | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 12/12/12/12 | 35/30/30/30 | 12 | 12 | 12 | 12 | 6 | 6 | 6 | 6 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | academia | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 18/18 | 49/44 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 3↓ | 🔴 3↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| intermediário | academia | médio | 3 | Superior A / Pernas A / Corpo inteiro B | 6/6/6 | 18/18/18 | 50/40/44 | 🔴 3↓ | 9 | 9 | 9 | 🔴 3↓ | 🔴 3↓ | 6 | 🔴 3↓ | 🔴 0 | 🔴 3↓ | 6 |
| intermediário | academia | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 18/18/18/18 | 50/40/45/40 | 🔴 6↓ | 12 | 12 | 12 | 6 | 🔴 3↓ | 🔴 3↓ | 🔴 3↓ | 🔴 3↓ | 6 | 6 |
| intermediário | academia | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 18/18/18/18/18 | 45/40/45/40/40 | 9 | 12 | 12 | 12 | 9 | 9 | 🔴 3↓ | 🔴 3↓ | 6 | 6 | 9 |
| intermediário | academia | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 18/18/18/18 | 45/40/40/40 | 12 | 12 | 12 | 12 | 🔴 12↑ | 🔴 12↑ | 6 | 6 | 6 | 6 | 12 |
| intermediário | academia | longo | 2 | Corpo inteiro A / Corpo inteiro B | 8/8 | 24/24 | 59/55 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 3↓ | 🔴 3↓ | 🔴 0 | 🔴 3↓ | 🔴 3↓ | 6 | 6 |
| intermediário | academia | longo | 3 | Superior A / Pernas A / Corpo inteiro B | 7/7/8 | 21/21/24 | 55/44/55 | 🔴 3↓ | 9 | 9 | 9 | 🔴 3↓ | 🔴 3↓ | 6 | 🔴 3↓ | 6 | 6 | 9 |
| intermediário | academia | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 7/7/7/7 | 21/21/21/21 | 55/44/50/44 | 🔴 6↓ | 12 | 12 | 12 | 6 | 🔴 3↓ | 🔴 3↓ | 6 | 6 | 6 | 12 |
| intermediário | academia | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 7/7/7/7/7 | 21/21/21/21/21 | 50/44/50/44/44 | 9 | 12 | 12 | 12 | 9 | 9 | 🔴 3↓ | 6 | 6 | 6 | 21 |
| intermediário | academia | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 7/7/7/7 | 21/21/21/21 | 50/44/44/44 | 12 | 12 | 12 | 12 | 🔴 12↑ | 🔴 12↑ | 6 | 6 | 6 | 6 | 30 |
| intermediário | casa c/ equip. | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/12 | 36/35 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | casa c/ equip. | curto | 3 | Superior A / Pernas A / Corpo inteiro B | 4/4/4 | 12/12/12 | 36/30/35 | 🔴 3↓ | 9 | 9 | 9 | 🔴 0 | 🔴 0 | 6 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | casa c/ equip. | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 12/12/12/12 | 36/30/32/30 | 🔴 6↓ | 12 | 12 | 12 | 🔴 3↓ | 🔴 0 | 🔴 3↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | casa c/ equip. | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 12/12/12/12/12 | 32/30/30/27/30 | 🔴 6↓ | 12 | 12 | 12 | 6 | 🔴 3↓ | 🔴 3↓ | 🔴 3↓ | 🔴 3↓ | 🔴 0 | 🔴 0 |
| intermediário | casa c/ equip. | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 12/12/12/12 | 30/27/30/30 | 🔴 6↓ | 12 | 12 | 12 | 6 | 6 | 6 | 6 | 6 | 🔴 0 | 🔴 0 |
| intermediário | casa c/ equip. | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 18/18 | 46/44 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 3↓ | 🔴 3↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| intermediário | casa c/ equip. | médio | 3 | Superior A / Pernas A / Corpo inteiro B | 6/6/6 | 18/18/18 | 47/40/44 | 🔴 3↓ | 9 | 9 | 9 | 🔴 3↓ | 🔴 3↓ | 6 | 🔴 3↓ | 🔴 0 | 🔴 3↓ | 6 |
| intermediário | casa c/ equip. | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 6/6/6/6 | 18/18/18/18 | 47/40/42/40 | 🔴 6↓ | 12 | 12 | 12 | 6 | 🔴 3↓ | 🔴 3↓ | 🔴 3↓ | 🔴 3↓ | 6 | 6 |
| intermediário | casa c/ equip. | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 6/6/6/6/6 | 18/18/18/18/18 | 42/40/40/37/40 | 🔴 6↓ | 12 | 12 | 12 | 9 | 9 | 🔴 3↓ | 🔴 3↓ | 6 | 6 | 12 |
| intermediário | casa c/ equip. | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/6/6/6 | 18/18/18/18 | 40/37/40/40 | 🔴 6↓ | 12 | 12 | 12 | 🔴 12↑ | 🔴 12↑ | 6 | 6 | 6 | 6 | 18 |
| intermediário | casa c/ equip. | longo | 2 | Corpo inteiro A / Corpo inteiro B | 8/8 | 24/24 | 56/55 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 3↓ | 🔴 3↓ | 🔴 0 | 🔴 3↓ | 🔴 3↓ | 6 | 6 |
| intermediário | casa c/ equip. | longo | 3 | Superior A / Pernas A / Corpo inteiro B | 7/7/8 | 21/21/24 | 52/44/55 | 🔴 3↓ | 9 | 9 | 9 | 🔴 3↓ | 🔴 3↓ | 6 | 🔴 3↓ | 6 | 6 | 9 |
| intermediário | casa c/ equip. | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 7/7/7/7 | 21/21/21/21 | 52/44/47/44 | 🔴 6↓ | 12 | 12 | 12 | 6 | 🔴 3↓ | 🔴 3↓ | 6 | 6 | 6 | 12 |
| intermediário | casa c/ equip. | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 7/7/6/7/7 | 21/21/18/21/21 | 47/44/40/41/44 | 🔴 6↓ | 12 | 12 | 12 | 9 | 9 | 🔴 3↓ | 6 | 6 | 6 | 21 |
| intermediário | casa c/ equip. | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 6/7/7/7 | 18/21/21/21 | 40/41/44/44 | 🔴 6↓ | 12 | 12 | 12 | 🔴 12↑ | 🔴 12↑ | 6 | 6 | 6 | 6 | 30 |
| intermediário | casa livre | curto | 2 | Corpo inteiro A / Corpo inteiro B | 4/4 | 12/12 | 27/26 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | casa livre | curto | 3 | Superior A / Pernas A / Corpo inteiro B | 4/4/4 | 12/12/12 | 26/24/26 | 🔴 3↓ | 🔴 6↓ | 9 | 9 | 🔴 0 | 🔴 3↓ | 6 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 |
| intermediário | casa livre | curto | 4 | Superior A / Pernas A / Superior B / Pernas B | 4/4/4/4 | 12/12/12/12 | 26/24/24/24 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 6 | 🔴 3↓ | 🔴 0 | 🔴 3↓ | 🔴 0 | 🔴 0 |
| intermediário | casa livre | curto | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/4/4/4/4 | 12/12/12/12/12 | 24/24/24/21/24 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 9 | 🔴 3↓ | 🔴 0 | 6 | 🔴 0 | 6 |
| intermediário | casa livre | curto | 6 | Empurrar / Puxar / Pernas A / Pernas B | 4/4/4/4 | 12/12/12/12 | 24/21/24/24 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 🔴 12↑ | 6 | 🔴 0 | 6 | 🔴 0 | 12 |
| intermediário | casa livre | médio | 2 | Corpo inteiro A / Corpo inteiro B | 6/6 | 18/18 | 37/35 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 0 | 6 | 🔴 0 | 🔴 0 | 🔴 0 | 🔴 0 | 6 |
| intermediário | casa livre | médio | 3 | Superior A / Pernas A / Corpo inteiro B | 5/6/6 | 15/18/18 | 31/34/35 | 🔴 3↓ | 🔴 6↓ | 9 | 9 | 🔴 0 | 6 | 6 | 🔴 0 | 🔴 3↓ | 🔴 3↓ | 6 |
| intermediário | casa livre | médio | 4 | Superior A / Pernas A / Superior B / Pernas B | 5/6/4/6 | 15/18/12/18 | 31/34/24/34 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 6 | 🔴 3↓ | 🔴 0 | 6 | 6 | 6 |
| intermediário | casa livre | médio | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/6/5/4/6 | 12/18/15/12/18 | 24/34/29/21/34 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 9 | 🔴 3↓ | 🔴 0 | 6 | 6 | 15 |
| intermediário | casa livre | médio | 6 | Empurrar / Puxar / Pernas A / Pernas B | 5/4/6/6 | 15/12/18/18 | 29/21/34/34 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 🔴 12↑ | 6 | 🔴 0 | 6 | 6 | 24 |
| intermediário | casa livre | longo | 2 | Corpo inteiro A / Corpo inteiro B | 7/8 | 21/24 | 42/46 | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 6↓ | 🔴 0 | 6 | 🔴 0 | 🔴 0 | 🔴 3↓ | 6 | 6 |
| intermediário | casa livre | longo | 3 | Superior A / Pernas A / Corpo inteiro B | 5/7/8 | 15/21/24 | 31/38/46 | 🔴 3↓ | 🔴 6↓ | 9 | 9 | 🔴 0 | 6 | 6 | 🔴 0 | 6 | 6 | 9 |
| intermediário | casa livre | longo | 4 | Superior A / Pernas A / Superior B / Pernas B | 5/7/4/7 | 15/21/12/21 | 31/38/24/38 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 6 | 🔴 3↓ | 🔴 0 | 6 | 6 | 12 |
| intermediário | casa livre | longo | 5 | Superior / Pernas A / Empurrar / Puxar / Pernas B | 4/7/5/4/7 | 12/21/15/12/21 | 24/38/29/21/38 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 9 | 🔴 3↓ | 🔴 0 | 6 | 6 | 21 |
| intermediário | casa livre | longo | 6 | Empurrar / Puxar / Pernas A / Pernas B | 5/4/7/7 | 15/12/21/21 | 29/21/38/38 | 🔴 6↓ | 🔴 6↓ | 12 | 12 | 🔴 0 | 🔴 12↑ | 6 | 🔴 0 | 6 | 6 | 30 |
