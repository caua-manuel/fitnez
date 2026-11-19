# Front-end: ondas inspiradas no Hevy

Data: 19/11/2026. Responsável: `frontend`. Contratos: `ux-inspiracao-hevy.md`, `conteudo-aval-ondas-hevy.md`, `dados-ondas-hevy.md`, ADR 009. Sem dependência nova; toda regra vem de `src/domain`.

## O que entrou

- **Execução** (`treino/Executar.tsx`): coluna "Antes" por série (`lastWorkingSession`), placeholder de carga e repetições (`placeholderFor`), ✓ sem digitar grava o placeholder (`confirmSet`) com o aviso `Registrado 40 kg × 10` e Desfazer; recorde na hora (`personalRecords` + `recordForSet`) numa linha discreta abaixo da série, com troféu em `--accent-brasa` (só o ícone); séries de aquecimento sugeridas (`warmupSets`) como linhas `A` no início, gravadas com `kind: 'warm'`; texto de aquecimento geral no 1º exercício. Nome do exercício abre a página do exercício; menu ⋮ com "Ver exercício", "Trocar exercício só hoje" (só antes de concluir séries do exercício; `swapOptions`, `setDaySwap`, `exercisesWithSwaps`, `NO_SWAP_TEXT`, "Voltar ao original") e "Calcular anilhas" (só `BARBELL_EXERCISES`). Nota fixa aparece sob o nome. O "Último desempenho" em linha saiu (a coluna Antes o substitui).
- **Página do exercício** (`treino/ExercicioPagina.tsx`, em folha, sem rota nova): nota fixa (até 140, `setExerciseNote` em `settings.exerciseNotes`), recordes ou "Melhores marcas" com o rodapé do 1RM, gráfico por sessão (o `LineChart` da Evolução), histórico e "Como fazer" (`guideFor` + `GUIDE_SAFETY`). Abre da execução, do Detalhe (menu ⋮ "Ver exercício") e da Biblioteca (o nome em "Tem …" na busca).
- **Anilhas** (`AnilhasSheet`): carga total, barra (20, 15, 10, sem barra) e anilhas disponíveis gravadas em `settings.plates`; textos do contrato.
- **Concluído**: "Recordes de hoje" (`recordsOfDay`, até 3 e "e mais N") e `±N% em relação à última vez` (`previousSessionVolume`, `volumeComparison`); conta exercícios trocados.
- **Evolução** (`evolucao/SeriesGrupo.tsx`): séries por grupo na semana atual do plano, em barras finas, com `groupStatus` recebendo `planned` de `plannedSetsByGroup` (semana em andamento: nunca "abaixo"; semana leve: `DELOAD_LINE`); `GROUP_HELP` no rodapé. Sequência `N semanas seguidas` (só com `show`) no cartão de Constância.

## Verificação

- `npm run typecheck` e `npm test` verdes. e2e novos em `tests/e2e/ondas-hevy.spec.ts` (placeholder + Antes + ✓ + Desfazer + aquecimento; recorde e Concluído; página do exercício e nota; anilhas; troca; séries por grupo). Ajustados sem afrouxar em `entrega-a-executar.spec.ts`: "Usei … da série anterior" virou `Registrado 70 kg × 8` com o valor gravado; "Sem registro anterior" virou a coluna `Antes: sem registro`.
- Capturas 390 px claro e escuro em `capturas/ondas-hevy/`.

## Pendências e pedidos

1. **Orçamento de JS (ADR 006) estourado: 196,1 KB de 190 KB** (`npm run build` falha no `verify-build`). Antes desta entrega já estava em 188,8 KB, com o assistente em andamento no mesmo diretório; o guia de exercícios (~4 KB gzip) já entrava pelo `validation.ts`. Precisa de decisão do orquestrador/dono: subir o teto ou cortar código. Não alterei o limite.
2. **Pedido ao `backend-dados`**: `placeholderFor` devolve `kg: null` da 3ª série em diante quando não há sugestão (primeira vez) e as séries de hoje repetiram o placeholder, porque compara a carga de hoje com o placeholder anterior e cai na sugestão nula. Há um paliativo na interface (usa a última carga concluída hoje); remover quando o domínio cobrir. O mesmo defeito aparece com sugestão: com sugestão 30 e as séries 1 e 2 feitas a 35 kg, a série 3 volta a mostrar 30 (a série 2 "seguiu o placeholder" 35, então a 3 cai na sugestão). O esperado pelo contrato (exemplo 7) é seguir a carga mudada hoje. Sugestão: comparar com o placeholder da 1ª série de hoje, ou seguir a última série concluída hoje sempre que alguma série de hoje divergiu da sugestão.
3. **Treino livre** não entrou: precisa de rota/entrada em `Treino.tsx` e `src/app/router.ts`, que estão com outro agente.
4. Sequência de semanas ficou na Evolução, não na faixa de 12 semanas do Início (pasta de outro agente).
5. Não há marcar/desmarcar aquecimento manual (toque longo) nem apagar a linha `A` sugerida; ela só grava com ✓.
