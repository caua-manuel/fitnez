# Handoff: arquiteto, ADR 013 (cardápio no assistente)

Data: 23/11/2026. A decisão completa está em `docs/decisoes/013-cardapio-no-assistente.md`. Nenhum código de produto foi escrito.

Ordem de trabalho (um escritor por pasta por vez):
1. **conteudo-treino-nutricao**: escreve `src/data/foods/foods.json` e `src/data/foods/templates.json` e confere as metas dos 5 exemplos com `buildDietTargetsFromAnswers`.
2. **backend-dados**: tipos `food` em `src/domain/onboarding.ts` (conteúdo v2), `src/domain/mealPlan.ts` (`mealEligibility`, `generateMeals`, `swapFood`, `checkTolerance`), caso de uso `applyGeneratedDiet` em `src/application/`, `src/data/validation.ts` e os testes de unidade.
3. **frontend**: tela única de tempo e local, telas A e B e o botão "Trocar este alimento" na Dieta. A tabela e a regra só carregam por `import()`.
4. **qa-testes**: e2e do fluxo assistente → Dieta → trocar alimento.
5. **seguranca-privacidade**: revisão. As respostas `food` ficam só no aparelho e não entram no compartilhamento nem no CSV.
6. **devops-github**: mede o build e, se passar de 250 KB, aplica o limite de 265 KB depois que o dono aprovar (registrar no ADR 006 e no ADR 011).

Peso estimado: +9 a 12 KB gzip carregados sob demanda e menos de 1 KB na carga inicial.

Pendências do dono:
- Conferir os valores na TACO.
- Verificar a licença da TACO.
- Aprovar o limite de 265 KB.
- Confirmar que a opção de 6 refeições por dia fica para depois.
