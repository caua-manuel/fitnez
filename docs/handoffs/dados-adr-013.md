# Handoff: dados, ADR 013 etapa 2 (regra do cardápio)

Data: 23/11/2026. Autor: `backend-dados`. Não toquei em `src/features/` nem em `src/app/`. O plano padrão do dono não mudou.

## Arquivos
- `src/domain/onboarding.ts`: tipos `FoodStyle`, `FoodRestriction`, `Dedication`, `MealsPerDay`, `FoodAnswers`; `OnboardingAnswers.food?`; listas `FOOD_STYLES`, `FOOD_RESTRICTIONS`, `DEDICATIONS`, `MEALS_PER_DAY`; `checkFoodAnswers(v): string | null`; `ONBOARDING_CONTENT_VERSION = 2`. `storedAnswersOf` guarda `food`; `checkStoredOnboarding` aceita `answers.food` (listas fechadas) e `dietUndoKey`. Respostas sem `food` continuam válidas.
- `src/domain/mealPlan.ts`: regra pura (sem relógio, sem DOM, sem aleatoriedade).
- `src/data/foods/index.ts`: `loadFoodData(): Promise<FoodData>` com `import()` das duas tabelas (fica em cache).
- `src/application/generatedDiet.ts`: casos de uso (carregam a regra e a tabela por `import()`).
- `src/data/validation.ts`: `catalog.diet[meal][i].foods` opcional (até 8, id `^[a-z0-9_-]{1,40}$`, `qty` de 0 a 2000).
- Testes: `tests/unit/mealPlan.test.ts` (36), `tests/integration/cardapio-gerado.test.ts` (3).

## API para o frontend
Importe sempre por `import()`, nunca estático (senão vai para a carga inicial):
```ts
const { applyGeneratedDiet, swapDietFood, undoGeneratedDiet, canUndoGeneratedDiet } = await import('../../application/generatedDiet');
const { mealEligibility } = await import('../../domain/mealPlan');

mealEligibility(answers: OnboardingAnswers): { ok: true } | { ok: false; reason: 'menor18'|'imc-baixo'|'gestacao'|'amamentacao'|'transtorno'|'condicao'|'sem-dados'|'so-proteina' }

// Depois de applyOnboarding (precisa de settings.onboarding). Uma transação; nos bloqueados não grava nada.
applyGeneratedDiet(repo, { answers: OnboardingAnswers; expectedRevision: number; now?: number })
  : Promise<{ ok: true; state: StateV3; withinTolerance: boolean } | { ok: false; reason }>
// withinTolerance false = melhor aproximação: mostrar aviso, sem esconder.

// "Trocar este alimento". exclude = ids já oferecidos nesta sequência (para não voltar ao anterior). null = sem troca (nada gravado).
swapDietFood(repo, { meal: MealKey; optionKey: 't1'|'d1'; foodId: string; expectedRevision: number; today: DayIso; exclude?: string[] }): Promise<StateV3 | null>

undoGeneratedDiet(repo, { expectedRevision: number }): Promise<StateV3>   // devolve o catalog.diet anterior
canUndoGeneratedDiet(state): boolean
```
Funções puras (para testes ou prévia): `generateMeals(answers, targets, foods, templates)`, `swapFood(option, foodId, { food }, targets | null, foods, exclude?)`, `checkTolerance(totals, { kcal, protein })`, `applyGeneratedDietToState`, `undoGeneratedDietInState`.

Formato gravado: cada `MealKey` usada recebe `[{ key: 't1', name: 'Dia de treino', ... }, { key: 'd1', name: 'Dia de descanso', ... }]` com `foods: { id, qty }[]` e `items` "Nome: 150 g (a verificar)". Refeições fora do molde (lanche com 3; pos com 3 e 4) ficam com lista vazia: a Dieta precisa escondê-las. `rec` não é usado (é id de receita).

## Decisões
- Unidade: sem campo `unit`. `portion`, `scale` e `qty` em g; ml quando o nome termina com "(ml)" (o texto do item usa isso).
- `templates.json` aceito como está: `mealTags` (etiquetas aceitas por `MealKey`), `mealRules.roles` obrigatórios, `optional` só numa segunda tentativa quando a primeira não fecha a tolerância, `minLeG` (piso do legume), `maxFatG` (teto de gordura do lanche), `plantBased.requireRoleIn` (PC no almoço e jantar para vegetariano e vegano), `tolerance`.
- Escolha: por papel, custo, (só proteína) mais proteína por kcal, id. Porções por descida coordenada nos passos de `scale`, mirando kcal da meta e proteína +5%.
- Troca: "mesma refeição" = compartilhar uma etiqueta de refeição; mantém kcal da opção em ±5% e escolhe macros mais parecidas. O parâmetro `targets` fica por causa do ADR, mas não é usado.
- Desfazer: `recovery['diet-undo:<t>']` com o `catalog.diet` e o `food` anteriores; `settings.onboarding.dietUndoKey`. "Voltar ao plano anterior" (assistente) não desfaz o cardápio: são dois desfazer separados.
- O assistente já grava `food` em `settings.onboarding.answers` ao aplicar o plano (mesmo sem cardápio). Não entra no compartilhamento nem no CSV (nenhum dos dois lê `onboarding`).

## Peso (esbuild minificado, gzip)
`mealPlan` 3,1 KB, `foods.json` 3,0 KB, `templates.json` 0,4 KB, `generatedDiet` 1,3 KB: cerca de 7,9 KB sob demanda. O build atual (sem frontend chamando) está em 242,2 de 250 KB no total e 188,3 de 205 KB no inicial; com o frontend, o total fica perto de 250,1 KB, no limite. Não mexi no limite.

## Pendências
Valores e licença da TACO (dono); revisão de segurança dos textos de alergia; e2e (qa-testes).

## Ajustes pedidos pelo frontend (23/11/2026)
1. `FOOD_DISLIKES_MAX` passou de 20 para 40 (`src/domain/onboarding.ts`; a tela soma 34 nos grupos). A validação das respostas, a de `settings.onboarding` (importação) e o aviso da tela usam a mesma constante. Teste em `tests/unit/mealPlan.test.ts`: 34 e 40 aceitos, 41 recusado.
2. `applyOnboardingToState` (`src/application/onboarding.ts`): se o `catalog.diet` atual é gerado (alguma opção com `foods`, `hasGeneratedDiet`), refazer o plano troca `catalog.diet` na mesma gravação pelas refeições de antes do cardápio, que estão no registro `diet-undo` apontado por `dietUndoKey`; sem esse registro, `data/diet.json` (fábrica). Escolhi o registro antes do `catalog.diet` padrão porque ele é exatamente o que valia sem o cardápio (pode ser a dieta do dono). O registro `onboarding-undo` guarda `diet` (campo opcional, só nesse caso) e "Voltar ao plano anterior" devolve o cardápio gerado e o `dietUndoKey`. Com cardápio no novo uso, `applyGeneratedDiet` grava em seguida, como antes. Testes em `tests/integration/cardapio-gerado.test.ts`: só proteína, bloqueado, sem respostas food e o caso de fábrica.
`npm.cmd run check` passou: 837 testes; total 254,4 de 300 KB, inicial 189,3 de 205 KB.
