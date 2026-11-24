# Handoff: conteúdo, ADR 013 etapa 1 (tabela e moldes)

Data: 23/11/2026. Autor: `conteudo-treino-nutricao`. Nenhum arquivo de código foi editado. O plano padrão do dono (`catalog.diet`) não mudou.

## O que foi criado
- `src/data/foods/foods.json`: 88 alimentos da proposta, no formato do ADR 013. Todos com `check: true`, ou seja, "(a verificar)" na TACO (e os de rótulo: whey, proteína vegana, bebida de soja, PTS).
  - `portion` é um número: gramas da porção de referência (os valores de kcal e macros valem para ela). Os líquidos estão em ml, e o nome termina com "(ml)": `leite_desnatado`, `leite_integral`, `leite_zero_lactose`, `bebida_soja`.
  - `scale` também está em g (ou ml). Para alimentos contados em unidade, `step` = peso de 1 unidade (ovo 50, clara 33, sardinha 85, laranja 150, maçã 65 = meia) e o nome traz a equivalência, por exemplo "(1 un = 50 g)". `qty` em `DietOption.foods` deve estar nessa mesma unidade.
  - Papel "P/C" da proposta virou `PC` (leguminosas).
  - Regras de filtro: vegano aceita só `V`; vegetariano aceita `V` ou `Vg`; onívoro aceita tudo. Sem lactose tira `L`; sem glúten tira `G`; as alergias tiram `O`, `Pe`, `Am` e `S`.
  - Escolhas pelo lado seguro: aveia com `G` (contaminação). Proteína vegana com `S`. Pães francês e integral só com `Vg`, sem `V`, porque alguns levam leite ou ovo. Pão sem glúten com `Vg`, `O` e `L`, porque muitos levam ovo e leite. Mel com `Vg`.
- `src/data/foods/templates.json`: os moldes de 3, 4 e 5 refeições, para `treino` e `descanso`, com a fração de kcal de cada refeição (cada lista soma 1). Também traz:
  - os papéis de cada refeição (`mealRules`), com legume de pelo menos 100 g no almoço e no jantar, e no máximo 10 g de gordura no `lanche`;
  - a leguminosa (`PC`) obrigatória no almoço e no jantar para vegetariano e vegano;
  - o mapa de etiquetas de refeição para `MealKey`;
  - as tolerâncias do ADR.
  - 4 refeições: `cafe`, `almoco`, `lanche` (pré-treino), `jantar`. 5 refeições: entra `pos`.

## Metas conferidas (fórmula de `buildDietTargetsFromAnswers`)
Fórmula: TMB = 10·peso + 6,25·altura − 5·idade + s (s = 5 para homem, −161 para mulher). Base = TMB × fator (pouco 1,2; moderado 1,3). kcal = r50((base + extra) × (1 + ajuste)), com extra de 200 na academia e 0 no descanso, e piso max(r50(TMB), 1400). Proteína = r5(peso × g/kg). Gordura = max(40, r5(0,8 × peso)). Carboidrato = round((kcal − 4P − 9G)/4).

| Ex. | Entradas `answers` (safety `['nenhum']`) | TMB | Base | P / G | Academia kcal (C) | Descanso kcal (C) |
|---|---|---|---|---|---|---|
| a | m, 30, 180, 80, moderado, `massa` | 1780 | 2314 | 145 / 65 | 2514×1,1=2765,4 → **2750 (396)** | 2545,4 → **2550 (346)** |
| b | f, 25, 165, 62, moderado, `perder` | 1365,25 | 1774,825 | 125 / 50 | 1579,86 → **1600 (163)** | 1419,86 → **1400 (113)** |
| c | m, 40, 175, 85, pouco, `recomp` | 1748,75 | 2098,5 | 170 / 70 | 2068,65 → **2050 (185)** | 1888,65 → **1900 (148)** |
| d | f, 35, 160, 58, moderado, `saude` | 1244 | 1617,2 | 95 / 45 | 1817,2 → **1800 (254)** | 1617,2 → **1600 (204)** |
| e | m, 28, 175, 75, moderado, `recomp` | 1708,75 | 2221,375 | 150 / 60 | 2179,24 → **2200 (265)** | 1999,24 → **2000 (215)** |

Nenhum IMC fica abaixo de 18,5 nem acima de 30, então não há troca de objetivo. Correção em (b): o carboidrato é 163 g, e não "~162": 650/4 = 162,5, e `Math.round` arredonda para cima.

Respostas `food` para os testes:
- a: `{ style: 'tudo', restrictions: [], mealsPerDay: 4, dedication: 'cardapio', dislikes: [], whey: false }`
- b: `{ style: 'vegetariano', restrictions: [], mealsPerDay: 3, dedication: 'cardapio', dislikes: [], whey: true }`. Sem whey, 125 g de proteína em 3 refeições pode não fechar.
- c: `{ style: 'tudo', restrictions: ['sem_lactose'], mealsPerDay: 5, dedication: 'cardapio', dislikes: [], whey: true }`
- d: `{ style: 'vegano', restrictions: [], mealsPerDay: 4, dedication: 'cardapio', dislikes: [], whey: true }`. Usa proteína vegana em pó.
- e: `{ style: 'tudo', restrictions: [], mealsPerDay: 4, dedication: 'proteina', dislikes: [], whey: false }`

Resultado esperado para os testes:
- a, b, c e d: `mealEligibility` dá `{ ok: true }`, e `generateMeals` devolve `withinTolerance: true` nos dois tipos de dia.
  - kcal do dia entre 95% e 105% da meta; proteína entre 95% e 115%.
  - Nenhum alimento com etiqueta proibida. Em (c), nenhum `L` e nenhum `whey_concentrado`. Em (d), só alimentos `V`, e almoço e jantar com um `PC`.
  - O número de refeições preenchidas é igual a `mealsPerDay`.
- e: `mealEligibility` dá `{ ok: false, reason: 'so-proteina' }`, e nenhum cardápio é gravado.
- Os cardápios escritos à mão na proposta não são a saída esperada de `generateMeals`, porque a regra escolhe por papel, custo e id. Eles servem só como prova de que a meta fecha com a tabela.

Exemplos corrigidos (contas refeitas com a tabela, academia):
- a: 2.707,5 kcal (−1,5%); P 165,1 (+13,9%); C 362,2; G 65,4. Ok.
- b: 1.598 kcal (−0,1%); P 127,0 (+1,6%); C 176,8; G 45,2. Ok.
- c: whey zero lactose com 115 kcal, 24 P, 2 C e 1 G. O lanche fica com 316 kcal, 27,4 P, 24,3 C e 13,6 G (antes: 321 / 25,3 C / 14,1 G). Total do dia: 2.066,5 kcal (+0,8%); P 184,2 (+8,3%); C 185,1; G 66,9. Ok. Com 5 refeições, o "pré-treino" (atum + pão) da proposta vai para a chave `pos`, e o lanche (whey + maçã + castanha) fica em `lanche`.
- d: 1.769,8 kcal (−1,7%); P 98,6 (+3,8%); C 256,3; G 44,1. Ok.
- e: atalhos conferidos: café 32,1 g; frango 125 g = 40 g; atum 130 g = 33,8 g; patinho 110 g = 39,5 g; tilápia 155 g = 40,3 g.

## Valores a verificar (TACO ou rótulo)
- Todos os 88 itens têm `check: true`.
- Prioridade: os itens de rótulo (`whey_concentrado`, `whey_zero_lactose`, `proteina_vegana_po`, `bebida_soja`, `pts_seca`), `tofu_firme` (64 kcal com 6,6 g de proteína parece baixo), `cuscuz_milho`, `couve` e `espinafre` (gordura do refogado), além da medida "1 col. sopa ≈ 10 g".
- A licença da TACO também está a verificar.

## Dúvidas
1. Unidade: o ADR não prevê um campo de unidade. Usei g/ml em `portion` e `scale`, com a unidade escrita no nome. Se o backend preferir um campo `unit`, ele precisa entrar no ADR.
2. Os campos extras de `templates.json` (`mealTags`, `mealRules`, `plantBased`, `tolerance`) não estão detalhados no ADR. O backend confirma ou pede outro formato.
3. Pães: os exemplos (c) "sem lactose" e (d) "vegano" usam pão. Com as etiquetas pelo lado seguro, o pão sai do (d) e o pão sem glúten sai do (c). O gerador deve trocar o pão por outro C.
4. Registro: a correção do carboidrato de (b) e do whey de (c) é só de exemplo, e não muda regra nem número do plano. Peço ao arquiteto que anote isso no ADR 013, se achar necessário (não editei o ADR).
5. Aviso fixo mantido: o cardápio é sugestão automática e não substitui nutricionista ou médico.
