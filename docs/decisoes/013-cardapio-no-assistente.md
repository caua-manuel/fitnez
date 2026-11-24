# ADR 013: cardápio gerado pelo assistente

Data: 23/11/2026. Status: **aceito, com decisões do dono provisórias**. Base: `docs/handoffs/conteudo-proposta-cardapio.md`, ADRs 006, 008, 011 e 012.

## Contexto
O assistente calcula metas (`buildDietTargetsFromAnswers`), mas a aba Dieta mostra o cardápio do dono (`catalog.diet`). A proposta de conteúdo traz 88 alimentos, moldes de refeição e regras de porção e de troca. O projeto é 100% estático e offline, então tudo é regra fixa local, sem IA e sem servidor.

## Decisões do dono (provisórias)
- Cardápio só a partir de 18 anos. Nunca com IMC < 18,5, gestação, amamentação, transtorno alimentar ou condição de saúde: nesses casos só aparecem metas e orientação, como hoje.
- "Tempo por treino" e "local" viram uma tela só, e o assistente fica com 10 telas. As telas A ("Como você come?") e B ("Quanto você quer seguir?") só aparecem se a tela de corpo foi respondida.
- Whey e proteína em pó só para quem marcar que usa.
- Tolerâncias por dia: kcal ±5% da meta; proteína de −5% a +15%.
- Alergia só tira o alimento e mostra "confira os rótulos". O app não garante que um produto seja livre de alérgenos.
- Cardápio fixo por tipo de dia (treino e descanso), com botão "Trocar este alimento".
- "Usar o plano padrão" continua dando o `catalog.diet` atual do dono, sem mudança.
- Os valores nutricionais ficam marcados "(a verificar)" até a conferência na TACO. A licença da TACO precisa ser verificada antes de publicar.

## Opções consideradas
1. Gerar as refeições no formato atual `DietOption` e gravar em `catalog.diet` (escolhida). A Dieta já mostra, soma e marca essas opções, então a tela quase não muda.
2. Um formato novo de "cardápio" com tela própria. É mais flexível, mas duplica a Dieta, os totais e a validação.
3. Gerar a cada abertura, sem gravar. Obriga a carregar a tabela sempre, o que fere o orçamento inicial.

## Decisão

### Onde fica cada coisa
- **Tabela de alimentos**: `src/data/foods/foods.json` (dono: conteúdo). Formato `{ "version": 1, "source": "TACO (a verificar)", "foods": Food[] }`, com `Food = { id, name, portion, kcal, p, c, g, role: 'P'|'PC'|'C'|'F'|'Gd'|'Le', tags: ('V'|'Vg'|'L'|'G'|'O'|'Pe'|'Am'|'S')[], meals: ('c'|'a'|'l'|'pre'|'pos')[], cost: 1|2, check: boolean, scale: { min, max, step } }`. O `id` segue `^[a-z0-9_-]{1,40}$`, e `check: true` quer dizer "(a verificar)".
- **Moldes**: `src/data/foods/templates.json` (dono: conteúdo). Para cada número de refeições por dia (3, 4 ou 5) e cada tipo de dia (`treino`, `descanso`), define a lista de papéis e a fração de kcal de cada refeição.
- **Regra pura**: `src/domain/mealPlan.ts` (dono: backend-dados). Sem React, sem datas e sem aleatoriedade.
  - `mealEligibility(answers): { ok: true } | { ok: false; reason: 'menor18' | 'imc-baixo' | 'gestacao' | 'amamentacao' | 'transtorno' | 'condicao' | 'sem-dados' | 'so-proteina' }`
  - `generateMeals(answers, targets, foods, templates): { meals: Record<MealKey, DietOption[]>; withinTolerance: boolean }`. Filtra por tipo de alimentação, restrições, "não como" e whey. Escolhe em ordem fixa (papel, custo, id) e ajusta as porções pelos passos de `scale` até entrar nas tolerâncias. A mesma entrada sempre dá a mesma saída.
  - `swapFood(option, foodId, answers, targets, foods): DietOption | null`. Troca por um alimento do mesmo papel e da mesma refeição e refaz a porção para manter as kcal da refeição em ±5%. Devolve `null` quando não há troca válida.
  - `checkTolerance(totals, target): { kcal: boolean; protein: boolean }`
- **Integração com o estado**: o caso de uso `applyGeneratedDiet` em `src/application/` grava o resultado em `catalog.diet`, no formato atual (`DietOption`), numa transação única com desfazer, como no ADR 011.
  - Cada refeição recebe 2 opções: `t1` (dia de treino) e `d1` (dia de descanso), com `rec` explicando o tipo de dia.
  - `items` traz o texto com a quantidade e o sufixo "(a verificar)".
  - Para permitir a troca, a opção ganha o campo opcional `foods?: { id: string; qty: number }[]`.
  - `MealKey` tem 5 chaves fixas. Com 3 refeições usam-se `cafe`, `almoco` e `jantar`; com 4 entra `lanche`; com 5 entra `pos`.
  - `catalog.recipes` não muda.
- **Versão do estado**: continua `v: 3`, porque só entram campos opcionais. `ONBOARDING_CONTENT_VERSION` passa a 2, e respostas da versão 1 continuam válidas. Em `src/data/validation.ts`, `catalogDiet` passa a aceitar `foods` opcional (até 8 itens, id válido, `qty` de 0 a 2000), e `checkStoredOnboarding` passa a aceitar o bloco `food`, só com valores de listas fechadas.
- **Respostas novas** em `src/domain/onboarding.ts`:
  - `FoodStyle = 'tudo' | 'vegetariano' | 'vegano'`
  - `FoodRestriction = 'sem_lactose' | 'sem_gluten' | 'ovo' | 'peixe' | 'amendoim' | 'soja'`
  - `Dedication = 'proteina' | 'cardapio'`
  - `FoodAnswers = { style; restrictions: FoodRestriction[]; mealsPerDay: 3 | 4 | 5; dedication; dislikes: string[] (ids da tabela, até 20); whey: boolean }`
  - `OnboardingAnswers.food?: FoodAnswers`
- **O que é guardado**: as respostas `food` ficam salvas em `settings.onboarding` (IndexedDB local), porque a troca de alimento precisa delas depois.
  - Justificativa: é dado de saúde leve, mas nunca sai do aparelho. Entra só no backup que o próprio usuário exporta e **não** entra no compartilhamento de plano (ADR 011, lista de chaves) nem no CSV. "Apagar tudo" remove essas respostas.
  - Guardar só em memória foi recusado, porque obrigaria refazer o assistente a cada troca.

### Donos de pasta e ordem de trabalho (um escritor por pasta por vez)
1. **conteudo-treino-nutricao**: `src/data/foods/foods.json` e `templates.json` (88 itens e moldes finais). Confere as metas dos 5 exemplos com `buildDietTargetsFromAnswers`.
2. **backend-dados**: `src/domain/onboarding.ts`, `src/domain/mealPlan.ts`, o caso de uso em `src/application/`, `src/data/validation.ts` e os testes de unidade.
3. **frontend**: `src/features/assistente/` (tela única de tempo e local, telas A e B, aviso fixo e bloqueios) e `src/features/dieta/` (botão "Trocar este alimento", aviso de sugestão e "(a verificar)").
4. **qa-testes**: `tests/e2e/`.
5. **seguranca-privacidade**: revisa o que é guardado, exportado e compartilhado, e os textos de alergia.
6. **devops-github**: mede o build e aplica a revisão do orçamento, se o dono aprovar.

### Orçamento
- **Estimativa (gzip)**: tabela de 88 itens, de 3 a 4 KB; moldes, cerca de 1 KB; `mealPlan.ts`, de 2 a 3 KB; telas A e B, cerca de 2 KB (no chunk do assistente); troca, de 1 a 2 KB. Total de 9 a 12 KB, tudo sob demanda (`import()` no assistente e ao tocar em "Trocar").
- **Inicial**: menos de 1 KB (botão e aviso). Fica perto de 188 de 205 KB.
- **Total**: 240,8 + 9 a 12 = 250 a 253 KB, no limite de 250 KB ou acima dele.
- **Revisão proposta**: JS gzip total ≤ 265 KB, com o inicial mantido em ≤ 205 KB.
  - Justificativa: o precache baixa tudo uma vez só. A abertura no celular não muda, porque o inicial não cresce. A margem de cerca de 12 KB cobre os ajustes da conferência na TACO.
  - Registro: entra como revisão no ADR 006 (seção de orçamento) e no ADR 011. O devops-github aplica em `scripts/verify-build.ts` só depois de medir o build real.

### Testes exigidos
- **Unidade (`mealPlan`)**:
  - Os 5 exemplos da proposta, depois de conferir as metas com a fórmula real, ficam dentro das tolerâncias.
  - Nenhum tipo de alimentação ou restrição devolve alimento com etiqueta proibida: vegano sem L, O, Pe nem origem animal; sem glúten sem G e sem aveia comum; cada alergia.
  - "Não como" e whey são respeitados.
  - Determinismo: duas chamadas dão saída idêntica, e embaralhar a ordem da tabela não muda o resultado.
  - `mealEligibility` bloqueia cada caso (17 anos, IMC 18,4, gestação, amamentação, transtorno, condição, sem dados de corpo), e nesses casos nenhum cardápio é gravado.
  - `swapFood` mantém ±5% e devolve `null` quando não há candidato.
- **Validação**: `foods` e `food` com valores fora dos limites são rejeitados, e um backup v3 antigo continua abrindo.
- **e2e**:
  - Assistente completo (10 telas) → a Dieta mostra o cardápio gerado → "Trocar este alimento" → os totais atualizam e continuam iguais depois de recarregar a página.
  - Um caso bloqueado mostra só as metas.
  - "Usar o plano padrão" mostra o cardápio do dono.
  - Compartilhar o plano não leva `food`.

## Riscos
- Os valores ainda não foram conferidos na TACO. Mitigação: mostrar sempre "(a verificar)". Se a licença impedir publicar a tabela, a alternativa é usar valores próprios, tirados da média de rótulos.
- Alergia: o app não garante nada. Mitigação: texto fixo e revisão de segurança.
- Dietas muito restritas (por exemplo, vegano sem soja) podem não fechar a tolerância. Nesse caso a regra devolve a melhor aproximação e mostra um aviso, sem esconder.
- O total passa de 250 KB enquanto a revisão do limite não for aprovada.

## Fora desta fase
6 refeições por dia (exige uma `MealKey` nova), filtro por custo, receitas, lista de compras, micronutrientes, cardápio que muda a cada semana e alimentos cadastrados pelo usuário.

## Consequências
A tela Dieta quase não muda, e o cardápio do dono continua intacto para quem escolhe o plano padrão. Passam a ser validados um campo opcional novo (`foods`) e um bloco novo de respostas (`food`).

## Revisão
- 23/11/2026 (backend-dados, etapa 2): sem campo `unit`; `portion`, `scale` e `qty` em g, e ml quando o nome termina com "(ml)". Os campos extras de `templates.json` ficam como o conteúdo escreveu (`mealTags`, `mealRules` com `optional`, `minLeG` e `maxFatG`, `plantBased.requireRoleIn`, `tolerance`), e os papéis `optional` só entram numa segunda tentativa quando a primeira não fecha a tolerância. O tipo de dia vai em `name` ("Dia de treino"/"Dia de descanso"), não em `rec`, que é id de receita. `settings.onboarding` ganha `dietUndoKey` opcional. `swapFood` ganha o parâmetro opcional `exclude` (ids já mostrados) e considera "mesma refeição" como compartilhar uma etiqueta de refeição da tabela. Detalhes em `docs/handoffs/dados-adr-013.md`.

- 23/11/2026 (DevOps): limite de JS total gzip revisto para 300 KB por decisão do dono (margem para o cardápio e animações); inicial segue em 205 KB.
