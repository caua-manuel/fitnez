# Estudo: dupla progressão (sugestão de carga)

Arquivos principais: `src/domain/progression.ts` (regra) e `src/domain/setPlaceholder.ts` (como a regra vira o texto cinza
de cada série). `src/domain/records.ts` não usa `suggestNext`; recordes são um cálculo separado (Epley) e ficam fora deste estudo.
Regra de origem: `docs/ESPECIFICACAO.md`, seção 3, "Progressão (dupla progressão)".

## 1. O problema que a parte resolve

Na dupla progressão a pessoa mantém a carga e sobe as repetições dentro de uma faixa (ex.: `5–8`). Quando bate o topo da faixa
em todas as séries, a carga sobe no treino seguinte e as repetições voltam para baixo. Sem esta parte:

- a pessoa teria de lembrar sozinha a carga e as repetições da última sessão;
- o app não saberia dizer "suba 2,5 kg", "mantenha" ou "o desempenho caiu duas vezes";
- o aviso de estagnação (3 treinos sem melhora, prometido na especificação) não existiria;
- aquecimento e séries não concluídas entrariam na conta e distorceriam tudo.

A regra é **só sugestão**: `suggestNext` não grava nada (comentário em `src/domain/progression.ts:27`). Quem grava é o ✓ da
série, via `confirmSet`.

## 2. Fluxo passo a passo

### 2.1 De onde vem o histórico

1. A tela de execução (`src/features/treino/Executar.tsx:72`) e o cartão do Hoje (`src/features/inicio/Inicio.tsx:78`)
   chamam `workingHistory(days, exId, day)` (`src/domain/setPlaceholder.ts:35`).
2. `workingHistory` pega os dias **anteriores** a `day` (comparação de texto `YYYY-MM-DD`), ordena do mais antigo ao mais
   recente, tira o aquecimento com `workingSets` (`src/domain/setPlaceholder.ts:16`) e descarta dias sem nenhuma série
   concluída.
3. `workingSets` normaliza cada linha com `toEntry` (`src/domain/setPlaceholder.ts:9`): `kg` e `reps` viram texto, `done`
   só é verdadeiro se for exatamente `true`, e `kind: 'warm'` é preservado.

### 2.2 A decisão em `suggestNext` (`src/domain/progression.ts:28`)

1. `setsForWeek(ex, week)` (`src/domain/workout.ts:17`) devolve quantas séries e qual faixa valem na semana. `week` começa
   em 0; deload é `week % 4 === 3` (metade das séries, arredondada para cima, e a faixa do bloco anterior).
2. `repRange(plan.reps)` (`src/domain/progression.ts:6`) transforma `"5–8"`, `"5-8"` ou `"8"` em `{min, max}`. Aceita hífen,
   meia-risca e travessão. Qualquer outro formato devolve `null`.
3. `validSets` (`src/domain/progression.ts:15`) fica só com séries `done === true`, sem aquecimento, cujo `kg` **e** `reps`
   passam em `parseNumber` (`src/domain/workout.ts:8`, que aceita vírgula decimal e recusa negativos e texto).
4. Sem nenhuma sessão válida: `reason: 'sem-historico'`, `kg: null` (`src/domain/progression.ts:33`).
5. `last` é a última sessão válida; `kg` é a **maior** carga dela (`:36`). `vol` é o volume (kg × reps somados) de cada sessão (`:37`).
6. Estagnação (`:41-45`): com 3 ou mais sessões, olha as 3 últimas; é estagnado se nenhuma das duas mais recentes superou a
   primeira delas nem em carga máxima nem em repetições totais.
7. Reduzir (`:47-49`): se o volume caiu **duas vezes seguidas** (estritamente), devolve `'reduzir'`. Atenção: o `kg`
   devolvido é a mesma carga da última sessão; a regra não calcula a redução, só sinaliza.
8. Subir (`:51-52`): se a faixa existe, a última sessão tem pelo menos `plan.sets` séries e **todas** chegaram ao topo, soma
   +5 kg (inferior) ou +2,5 kg (superior). `lower` vem de `isLower(muscleGroupOf(...))` (`src/domain/muscleGroups.ts:30`).
9. Caso contrário, `'manter'` com a carga da última sessão (`:53`). `round` (`:25`) corta em 2 casas.

A ordem importa: **reduzir é testado antes de subir**. Se o volume caiu duas vezes e mesmo assim a última sessão bateu o topo
(ex.: 30 → 25 → 20 kg, sempre 8 reps), a resposta é `'reduzir'`.

### 2.3 Da sugestão ao campo da série: `placeholderFor` (`src/domain/setPlaceholder.ts:63`)

1. `leve = week % 4 === 3` (`:67`): na semana leve a carga não sobe; se a sugestão era `'subir'`, usa a maior carga da sessão
   anterior (`:76-78`).
2. Se hoje já há uma série de trabalho concluída antes do índice atual e a carga dela difere da planejada, essa carga vale
   para todas as séries seguintes (`:70-72`, `:83-84`).
3. Repetições (`:86-92`): a série de mesmo índice da última sessão ("Antes"); se não houver, a anterior de hoje; se não houver,
   a última da sessão anterior. Em `'subir'` fora da semana leve, recomeça do mínimo da faixa. O valor é preso dentro da faixa.
4. `podeConfirmar` (`:94-95`): exige repetições e, só para `m === 'kg'`, uma carga.
5. `confirmSet` (`src/domain/setPlaceholder.ts:105`): no ✓, o digitado vence o placeholder; aquecimento só exige repetições.

## 3. Casos de borda

1. Sem histórico, ou só sessões vazias.
2. Topo da faixa em todas as séries: +2,5 kg superior, +5 kg inferior.
3. Uma série abaixo do topo, ou faltou série: mantém.
4. Volume caiu em 2 sessões seguidas: reduzir (com a mesma carga).
5. Reduzir tem prioridade sobre subir quando as duas condições valem.
6. Estagnação com 3 sessões iguais; sem estagnação com 2 sessões ou com progresso.
7. Vírgula decimal na carga (`22,5`).
8. Carga ou repetições inválidas não geram `NaN`; faixa ilegível (`'x'`) leva a manter.
9. Aquecimento ignorado no histórico e na sugestão.
10. Série com `done` diferente de `true` ignorada; dia sem série concluída pulado.
11. Faixa escrita fora do padrão aceito (ex.: `"8 a 12"`): `repRange` devolve `null` e a sugestão nunca sobe.
12. Semana depois do deload: a sessão leve tem menos séries que `plan.sets`, então nunca dispara `'subir'`, mesmo no topo.
13. Semana leve com sugestão `'subir'`: o placeholder não sobe a carga.
14. Mudou a carga hoje: a nova carga segue para as próximas séries; voltou à sugerida, segue a sugerida.
15. Primeira vez (sem sugestão): sem carga, não dá para confirmar; a partir da série 2 usa a série anterior de hoje.
16. Exercício sem carga (`bw`): o ✓ grava `kg` vazio.
17. Faixa nova menor que o "Antes" (mudança de bloco): repetições presas ao topo da nova faixa.
18. Carga mista na última sessão (ex.: 20, 20, 15 kg, todas no topo): a base é a maior carga (20) e a sugestão sobe.

## 4. Testes que provam cada caso

| Caso | Arquivo | Teste |
| --- | --- | --- |
| 1 | `tests/unit/progression.test.ts` | `it('sem histórico')` |
| 2 | `tests/unit/progression.test.ts` | `it('sobe +2,5 kg no superior e +5 kg no inferior no topo da faixa')` |
| 3 | `tests/unit/progression.test.ts` | `it('mantém quando alguma série não chegou ao topo ou faltou série')` |
| 4 | `tests/unit/progression.test.ts` | `it('reduz quando o volume caiu em 2 sessões seguidas')` |
| 5 | — | **sem teste** (o teste do caso 4 usa reps caindo, não o topo) |
| 6 | `tests/unit/progression.test.ts` | `it('estagnação após 3 sessões sem aumento')` |
| 7 | `tests/unit/progression.test.ts` | `it('aceita vírgula decimal')` |
| 8 | `tests/unit/progression.test.ts` | `it('entradas inválidas não geram NaN')` |
| 9 | `tests/unit/ondasHevy.test.ts` | `it('volume, contagem e suggestNext ignoram aquecimento')` |
| 10 | `tests/unit/ondasHevy.test.ts` | `it('previousSetAt pula aquecimento e dias sem série concluída')` (cobre o dia pulado em `workingHistory`; `done: false` dentro de `suggestNext` não tem teste próprio) |
| 11 | — | **sem teste** (vira o exercício da seção 6) |
| 12 | — | **sem teste** |
| 13 | `tests/unit/ondasHevy.test.ts` | `it('3 semana leve não sobe carga')` |
| 14 | `tests/unit/ondasHevy.test.ts` | `it('7 mudou a carga hoje')`, `it('defeito: mudou para 35 com sugestão 30, a série 3 segue 35')`, `it('voltou à carga sugerida hoje: segue a sugestão')` |
| 15 | `tests/unit/ondasHevy.test.ts` | `it('5 primeira vez kg')`, `it('6 primeira vez, série 2')`, `it('defeito: primeira vez com 2 séries feitas, a série 3 mostra a última carga')` |
| 16 | `tests/unit/ondasHevy.test.ts` | `it('9 bw: reps do Antes e ✓ grava kg vazio')` |
| 17 | `tests/unit/ondasHevy.test.ts` | `it('4 antes acima da faixa nova')` |
| 18 | — | **sem teste** |

Ponta a ponta: `tests/e2e/hoje-livre-atalhos.spec.ts`,
`test('Hoje: o cartão mostra o 1º exercício com a carga sugerida do domínio e Começar treino')`.

Os casos 5, 11 e 12 foram conferidos em execução avulsa (fora de `tests/`): 30/25/20 kg × 8 devolve `reduzir`; faixa
`"8 a 12"` com 12 reps em todas devolve `manter`; semana 4 com sessão anterior de 2 séries no topo devolve `manter`.

**Observação para estudo, não corrigida aqui:** `src/features/treino/Detalhe.tsx:45` monta o histórico na própria tela, sem
`workingHistory`. O `map` descarta `kind`, então ali o aquecimento entra como série de trabalho, e o dia de hoje também entra.
A sugestão do Detalhe pode divergir da tela de execução. Cabe ao agente `frontend` avaliar.

## 5. Glossário

- **Dupla progressão:** subir primeiro as repetições dentro da faixa; ao bater o topo em todas as séries, subir a carga.
- **Faixa de repetições:** texto como `5–8`; `repRange` lê mínimo e máximo.
- **Série de trabalho:** série que conta para a progressão. Oposto de aquecimento (`kind: 'warm'`).
- **Bloco:** 4 semanas (índices 0–3, 4–7, 8–11). Cada bloco usa uma coluna de `ex.s` (séries) e `ex.r` (repetições).
- **Deload / semana leve:** última semana de cada bloco (`week % 4 === 3`): metade das séries e a faixa do bloco anterior.
- **RIR:** repetições na reserva (quantas ainda daria para fazer). A especificação pede o topo "dentro do RIR do bloco", mas
  o app não registra RIR por série; a regra não verifica isso.
- **Volume:** soma de kg × repetições das séries válidas da sessão.
- **Estagnação:** 3 sessões sem superar a primeira delas em carga máxima nem em repetições totais.
- **Placeholder:** o valor cinza que aparece no campo vazio e é gravado se a pessoa tocar no ✓ sem digitar.
- **"Antes":** a série de mesmo índice na última sessão concluída.

## 6. Exercício: faixa escrita como "8 a 12"

**Enunciado.** O editor de exercício (`src/domain/exerciseDraft.ts:69-72`) aceita qualquer texto de até 24 caracteres nas
repetições. Quem digita `8 a 12` (forma natural em português) tem a progressão desligada sem aviso: `repRange` devolve `null`,
`suggestNext` nunca diz `'subir'` e o placeholder deixa de prender as repetições na faixa. Faça `repRange` aceitar a palavra
`a` como separador (`"8 a 12"`, `"8a12"` com ou sem espaços, maiúscula ou minúscula), mantendo o comportamento atual para
todo o resto.

**Onde mexer.** Só `src/domain/progression.ts`, função `repRange`. Não mexa nos números do plano (`data/plan.json`).

**Teste a escrever primeiro** (em `tests/unit/progression.test.ts`, novo `it` dentro de `describe('repRange')`), e vê-lo
falhar antes de mudar o código:

- `repRange('8 a 12')` igual a `{ min: 8, max: 12 }`;
- `repRange('8A12')` igual a `{ min: 8, max: 12 }`;
- `repRange('8 a')`, `repRange('a 12')` e `repRange('12 a 8')` são `null`;
- um `suggestNext` com `ex.r = ['8 a 12', '8 a 12', '8 a 12']` e uma sessão de 3 séries × 12 devolve `reason: 'subir'`.

**Critério de pronto.**

- O teste novo passa e todos os outros de `npm test` continuam passando (em especial `it('interpreta faixa e valor único')`
  e o arquivo `tests/unit/ondasHevy.test.ts`, que também depende de `repRange`).
- `npm run typecheck` sem erros.
- Nenhum arquivo fora de `src/domain/progression.ts` e `tests/unit/progression.test.ts` foi alterado.
