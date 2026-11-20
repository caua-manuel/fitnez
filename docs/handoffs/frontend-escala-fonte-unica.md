# Frontend: escala “Como terminou” com fonte única (Fase 0, item 1)

- `src/domain/jiujitsu.ts` agora exporta `FEEL_SCALE` (`min: 1`, `max: 5`, `destroyed: 5`, rótulos 1 = “leve” e 5 = “destruído”), `FEEL_VALUES` (`[1, 2, 3, 4, 5]`), `feelLegend()` (“1 = leve, 5 = destruído”) e `feelAriaLabel(n)` (“Nota n de 5”, com “, leve” ou “, destruído” nas pontas).
- `thirdClassEligibility` usa `FEEL_SCALE.destroyed` no lugar do 5 literal. Nenhum número nem critério da regra mudou.
- `src/features/inicio/Inicio.tsx` usa essas funções. O texto visível e os aria-labels continuam iguais.
- `npm run typecheck` passou, e `tests/unit/jiujitsu.test.ts` também (7 de 7).
- Pedido ao qa-testes: teste unitário de `feelLegend`, `feelAriaLabel` (1, 3 e 5) e `FEEL_VALUES`. `tests/` não foi alterado.
