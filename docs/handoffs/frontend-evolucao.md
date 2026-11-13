# Frontend: aba Evolução

- Domínio puro `src/domain/evolution.ts` (22 testes em `tests/unit/evolution.test.ts`, escritos antes): `periodRange`, `strengthSeries`/`strengthChange`, `measureSeries`/`measureDelta`, `weightSeries`/`weightDelta`, `waistSeries`/`waistDelta`, `consistency` (5º parâmetro opcional `range`), `weeklyValues`, `pctOf`, `formatSigned`, `parseMeasure`. Semana nas séries é relativa ao início do período (S1..S12 = `firstPlanWeek` + índice). Hoje só entra no "previsto" da constância quando já está feito.
- UI em `src/features/evolucao/` (`Evolucao.tsx`, `Charts.tsx` com SVG próprio, `evolucao.css`); `App.tsx` só troca a rota.
- Indicadores selecionam o gráfico principal. Gráficos com `role="img"` e `aria-label`, mais tabela oculta. Estado vazio honesto e formulário "Registrar medidas" (chaves legadas p, c, b, t, texto com vírgula).
- Diferença conhecida: o legado só tem coxa (`t`); a linha mostra "Coxa", não "Quadril".
- Pendência de design: `DESIGN.md` já prevê o seletor de período como folha; usei menu suspenso (listbox) por simplicidade.
- Testes e2e: `tests/e2e/entrega-a-evolucao.spec.ts`. Capturas em `capturas/evolucao-r*`.
