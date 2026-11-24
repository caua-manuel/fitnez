# Handoff: frontend, ADR 013 etapa 3 (cardápio no assistente e na Dieta)

Data: 23/11/2026. Autor: `frontend`. Não editei `src/domain`, `src/application`, `src/data` nem testes existentes. Sem commit.

## O que mudou
- `src/features/assistente/Assistente.tsx`: 10 telas. "Tempo e local do treino" numa tela só; tela A "Como você come?" (tipo, restrições e alergias com o aviso fixo, alimentos que não come, whey); tela B "Quanto você quer seguir?" (3 a 5 refeições; "Seguir o cardápio" ou "Só bater a proteína"). A e B só aparecem com idade, altura e peso; sem eles o progresso passa a "de 8". Resumo ganha o bloco "Cardápio" (prévia do dia de treino por refeição, aviso de tolerância, "Confira os rótulos" com alergia, aviso fixo) ou o motivo de não gerar (saúde ou menor de 18 → texto de nutricionista; "só bater a proteína" → texto de proteína). Ao aplicar: `applyOnboarding` e, se a prévia gerou cardápio, `applyGeneratedDiet` (import dinâmico).
- `src/features/assistente/food.ts` (novo): textos e opções das telas A e B; grupos de "não como" ligados aos ids de `foods.json` (ids já tirados pelo tipo de alimentação não contam).
- `src/features/assistente/undo.ts` (novo): `undoAssistantPlan` = `undoGeneratedDiet` (se `canUndoGeneratedDiet`) e depois `undoOnboarding`. Usado no toast do assistente e em Perfil > "Voltar ao plano anterior" (texto da folha cita o cardápio). Um desfazer só para o usuário.
- `src/features/assistente/store.ts`: `ASSISTANT_QUESTIONS = 10`.
- `src/features/dieta/`: com cardápio gerado (opções com `foods`), refeições vazias somem e a contagem vira "X de N"; cada alimento tem "Trocar" (`aria-label` "Trocar este alimento: …", 48 px), com `swapDietFood` por `import()`, "Não há troca parecida para este alimento." quando volta `null`, e desfazer pelo `UndoToast`. Aviso "Confira os rótulos" com alergia marcada; aviso de sugestão automática na refeição. Plano padrão: nada muda.

## Testes
- Novo `tests/e2e/cardapio-assistente.spec.ts` (5 casos, passam): onívoro 4 refeições (claro e escuro) com troca, desfazer e desfazer do assistente; vegetariana 3 refeições; menor de 18; só proteína. `SHOTS=1` grava `docs/antes-depois/depois/cardapio-{tela-a,tela-b,resumo,dieta}-{claro,escuro}.png`.
- `npm run test` e `typecheck` passam. `test:config` falha em `build-budget.test.ts` por uma mudança em `scripts/` que não é minha (limite total 300 no diff local).
- **Para o qa-testes**: 5 e2e antigos esperam "Passo X de 9" e as telas separadas de tempo e local (`assistente-inicio.spec.ts` 3 casos, `hoje-livre-atalhos.spec.ts` 2 casos). Precisam passar a "de 10" e a navegação nova (tempo+local é 1 passo; depois do corpo preenchido vêm A e B).

## Orçamento
Total JS gzip 254,3 KB (acima de 250 KB do ADR; o arquivo local já diz 300, não fui eu). Inicial 189,1 de 205 KB. Sob demanda novos: `Assistente` 10,3 KB, `mealPlan` 3,1 KB, `foods` 3,0 KB, generatedDiet cerca de 1,3 KB. Maior peso geral: `index` 152,5 KB e `icons` 29,3 KB.

## Pedidos ao backend-dados
- `FOOD_DISLIKES_MAX = 20` é menor que todos os grupos juntos (até 34 ids). Hoje a tela A bloqueia com mensagem; sugiro subir para 40.
- Refazer o plano com "só bater a proteína" ou caso bloqueado mantém um cardápio gerado antes em `catalog.diet`. Decidir se deve voltar ao padrão.
