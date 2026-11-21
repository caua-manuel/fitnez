# Conteúdo: números do ADR 011 (demonstração, resumo da semana, estagnação)

Data: 20/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: DECIDIDO para implementação (`backend-dados` em `src/demo/` e `src/domain/`; `qa-testes` nos testes).
Base: [ADR 011](../decisoes/011-pronto-para-amigos-e-ferramentas-da-academia.md) seções 1.1, 2.5 e 2.6; `src/domain/progression.ts` (`suggestNext`, `repRange`), `workout.ts` (`setsForWeek`), `records.ts` (`exerciseHistory`, `e1rm`), `diet.ts` (`dayTotals`, `markEaten`), `data/plan.json`, `data/diet.json`. Registro do motivo: [ADR 012](../decisoes/012-revisao-assistente-10-perfis.md), parte B.

Todos os limiares são escolhas de produto **(a verificar)**. Nenhum estudo foi conferido.

## A. Modo demonstração (1.1)

### A.1 Perfil fictício

| Campo | Valor |
| --- | --- |
| `profile.name` | `Exemplo` |
| `profile.goal` | `Recomposição corporal: perder gordura e manter a força` |
| `profile.age` | 30 |
| `profile.heightCm` | 178 |
| `profile.weightKg` | 76,3 (igual à última medida, como faz o formulário de medidas) |
| Sexo | não existe no perfil e não é gravado (ADR 008). Para conferência: homem, TMB 1.737 kcal, gasto com fator 1,55 de cerca de 2.700 kcal, dentro da faixa de exemplo da especificação (seção 4). |
| Metas de dieta | as de exemplo: **não** gravar `settings.dietTargets` (aparece "Meta de exemplo"). Proteína pelo perfil: 2,4 × 76,3 = 183 g. |

Coerência: a média do plano é de cerca de 2.450 kcal contra um gasto de cerca de 2.700, um déficit leve de uns 250 kcal por dia. Isso dá perto de 0,25 kg por semana, que é o ritmo das medidas em A.5.

### A.2 Plano e calendário

- Plano e rotina: os de fábrica (`data/plan.json`): seg jiu-jitsu com kimono, ter Lower (`LW`), qua Upper A (`UA`), qui jiu-jitsu sem kimono, sex Upper B (`UB`), sáb vôlei, dom descanso. `LB` (opcional) não é usado.
- Início: a segunda-feira 4 semanas antes da semana de `today`, então hoje cai na semana 5 (índice 4).
- Registros: todos os dias de `start` até `today − 1`. **Hoje não tem registro.**
- Atividades: `acts.bjj = true` nas segundas e quintas e `acts.volei = true` nos sábados, em todas as semanas.
- `feel` (nota do dia, quando houver treino de academia): 3; no Lower, 4; na semana 4 (leve), 2.

### A.3 Faltas e treino parcial

- **Falta:** sexta da semana 2 (`UB`): nenhum registro de academia nesse dia (o jiu-jitsu e o vôlei da semana continuam).
- **Parcial:** terça da semana 3 (`LW`): `workouts.LW.status = 'partial'`, com só os 4 primeiros exercícios registrados (`salto_l`, `agach`, `stiff`, `bulg`). Os demais ficam sem log.
- Horário: `startedAt` = `${dia}T18:30:00-03:00` em milissegundos; `finishedAt` = início + 75 min (parcial: + 40 min). `sets` e `volume` calculados das séries como o app calcula.
- Exercício sem registro numa sessão (falta ou parcial) não avança na progressão (A.4).

### A.4 Cargas iniciais e progressão

Cargas da semana 1 (texto com vírgula decimal, como o app grava; halteres em kg por halter):

| Treino | Exercício: carga inicial |
| --- | --- |
| UA | supino 28; remada_a 60; press_a 20; barra 0 (peso do corpo); lat_a 10; face 25; rosca_a 12; tri_a 25; pallof 15; farmer 28 |
| UB | puxada 60; inclinado 24; press_b 18; remada_b 30; cruc 40; lat_b 7,5; inverso 8; rosca_b 25; tri_b 20 |
| LW | agach 80; stiff 70; bulg 14; hip_l 90; pant_pe 60 |

**Modelo de repetições (exercícios `kg` e `bw` com faixa que `repRange` entende).** Cada exercício guarda `{ kg, base }`. `sets` e a faixa `[min, max]` vêm de `setsForWeek(ex, semana)`.
1. Primeira sessão: `base = min + 1`.
2. Sessão normal: todas as séries com `min(base, max)` repetições; a **última** com `max(min, min(base − 1, max))` (cansaço).
3. Depois da sessão normal: se todas as séries chegaram a `max`, `kg` sobe exatamente o que `suggestNext` devolveria (`+5` se o exercício é de membro inferior, como o app decide na chamada; senão `+2,5`) e `base = min + 1`. Se não chegaram, `base = base + 1`.
4. Troca de bloco: na primeira sessão do bloco novo, `base = min(base, max_novo + 1)`.
5. Semana leve (semana 4): `sets` pela metade (de `setsForWeek`), mesma `kg`, todas as séries com `min` repetições. `kg` e `base` não mudam.

O teste deve conferir que toda subida de carga vem depois de uma sessão normal com todas as séries no topo da faixa (a regra `hitTop` de `suggestNext`) e que não há subida na semana leve.

Exemplo (supino, 4 séries, faixa 5–8 no bloco 1): sem. 1 28 × 6/6/6/5; sem. 2 28 × 7/7/7/6; sem. 3 28 × 8/8/8/7; sem. 4 (leve) 28 × 5/5; sem. 5 (bloco 2, 4–6, 5 séries) base 7 → 28 × 6/6/6/6/6, todas no topo, então a semana 6 começa com 30,5.

**Casos sem faixa legível** (a carga nunca sobe, porque o app também não sugeriria):
- `bulg` ("8–10 por perna"): modelo de repetições com faixa 8–10 e `kg` fixo em 14.
- `pallof` ("10 por lado"): 15 kg, 10 repetições em todas as séries.
- `farmer` (`kgs`, "30–40 s"): 28 kg, `reps` "35".
- `rep` com faixa (`joelhos` 8–15, `nordic` 4–8, `roll` 8–12): modelo de repetições sem carga (`kg` vazio), parando no topo.
- `salto_l` ("3"): 3 repetições, `kg` vazio.
- `s` (`pescoco` "20 s", `copen_l` "20–30 s por lado"): `reps` = 20 e 25, `kg` vazio.
- Sem estagnação planejada: com esse modelo, nenhum exercício dispara o aviso da seção C nas 4 semanas.

### A.5 Medidas semanais

Na segunda-feira de cada semana, de 1 a 5 (só se a data for ≤ `today`), em `history.measurements[dia]`:

| Semana | `p` (kg) | `c` (cintura, cm) |
| --- | --- | --- |
| 1 | `77,0` | `86,0` |
| 2 | `76,8` | `85,8` |
| 3 | `76,6` | `85,5` |
| 4 | `76,6` | `85,5` |
| 5 | `76,3` | `85,2` |

Média de −0,18 kg por semana, com uma semana parada (comum na semana leve, pela água e pelo carboidrato). A revisão semanal (`weeklyReview`) da semana 5 dá "manter" (perda de 0,3 kg com a cintura diminuindo).

### A.6 Dieta registrada

- Dias com registro: segunda a sexta de todas as semanas, mais o domingo das semanas 1 e 3. Sábados sem registro. Semana 5: os dias úteis antes de hoje.
- Opções (`markEaten`, com a cópia em `consumed`): todas as refeições com a opção A na semana 1, B na 2, C na 3, A na 4 e B na 5.
- Domingo (descanso): `skip.lanche = true`.
- Quinta das semanas 2 e 4: o jantar não é marcado (4 refeições).
- `water` = 6 copos (3 L) e `crea = true` nos dias com registro; na quinta sem jantar, `water` = 4.

Conferência com a regra B (meta de exemplo): opção A completa = 2.463 kcal e 179 g de proteína; B = 2.452 e 203; C = 2.463 e 187. Domingo sem lanche: A dá 2.079 kcal e 160 g (87% de 183) e C dá 2.108 kcal e 164 g (90%), contra a meta de 2.100. Terça (perna, 2.600): 2.463 kcal (95%). Quinta sem jantar: A dá 1.889 de 2.500 kcal (76%) e 131 g (72%), fora da meta. Resultado esperado por semana: 1 → 6 de 6 na meta; 2 → 4 de 5 (2 sem registro); 3 → 6 de 6; 4 → 4 de 5 (2 sem registro).

## B. Resumo da semana (2.5): "dia na meta"

### B.1 Regra

```
dias considerados: segunda a domingo da semana do plano, só datas < today (hoje nunca conta)
meta do dia: a mesma que a Dieta usa para aquela data e tipo de dia (dayTargetFor(tipo, data, settings, perfil))
totais: dayTotals(dia.diet, cardápio): refeição marcada e não pulada; usa `consumed` quando existir
registrado = totais.eatenCount >= 1
naMeta     = registrado
             E |totais.kcal − meta.kcal| <= 10% de meta.kcal      // a verificar
             E totais.p >= 85% de meta.protein                     // a verificar
sem registro: não conta nem como na meta nem como fora; aparece à parte
```

- Comer **acima** de 110% também é fora da meta (vale para perder e para ganhar).
- Por que 85% na proteína: no dia de descanso, o próprio cardápio do app (pular o lanche) dá de 160 a 164 g contra 183 a 185 g de meta, ou seja, de 86% a 90%. Com 90%, o app reprovaria o dia que ele mesmo recomenda.
- Carboidrato, gordura e água não entram: a regra cobre as duas metas que o app trata como principais (energia e proteína), e uma regra com 5 critérios ficaria quase impossível de cumprir.
- Com `hideDietNumbers` ou `dietTargetsDisabled`: a dieta não aparece (ADR 011).

### B.2 Texto

- Nenhum dia registrado: `Dieta: nenhum dia registrado nesta semana.`
- Com registro: `Dieta: na meta em {n} de {r} dias registrados.` Se houver dias sem registro (entre os considerados), acrescentar ` {s} sem registro.` (singular `1 dia sem registro`, plural `{s} dias sem registro`).
- Rodapé curto, uma vez por cartão: `Na meta: calorias perto da meta do dia (10% para mais ou para menos) e proteína quase completa.`

Exemplos: semana 2 da demo, `Dieta: na meta em 4 de 5 dias registrados. 2 dias sem registro.`

## C. Aviso de estagnação (2.6)

### C.1 Entrada

`stagnation({ ex, sessions, start, today, week, beginner })`: `sessions` = `exerciseHistory(days, exId, ex)` (do mais recente ao mais antigo); `week` = índice da semana de `today`; `beginner` = o plano tem `plan.rir` (iniciante, nunca treinou ou conservador). Saída: `null` ou `{ motivo: 'queda' | 'sem-progresso', acao: 'deload' | 'repeticoes' | 'trocar', sessoes: number, texto: string, novaFaixa?: string, kgSugerido?: number }`.

### C.2 Quando NUNCA avisar (devolve `null`)

1. `ex.m` diferente de `kg` e `bw` (exercícios por repetição, tempo e `kgs` ficam de fora).
2. `week < 2` (semanas 1 e 2), `week > 11` (plano concluído) ou antes do início.
3. `week % 4 === 3` (semana leve).
4. `beginner` e `week < 4` (iniciante melhora pela técnica nas primeiras semanas).
5. Menos de 3 sessões válidas para a queda, ou menos de 4 para sem progresso (C.4).
6. Faixa de repetições que o app não consegue ler: `repRange(setsForWeek(ex, week).reps) === null` (ex.: "10 por lado", "8–10 por perna", "30–40 s"). Decisão de 20/11/2026, a pedido do `backend-dados`. Motivo: esses exercícios não sobem carga pela dupla progressão, então ficar "sem melhorar" é o esperado e não é estagnação. Na demo, isso tira do aviso o Pallof, o búlgaro e o afundo do plano de exemplo, e a regra de A.4 (nenhum aviso na demo) continua valendo. Nos planos do assistente, as faixas passam a ser legíveis (revisão dos 10 perfis, M3).

Sessão válida: `day >= start`, `day < today`, semana da sessão `floor(dias desde start / 7)` entre 0 e 11 e **fora da semana leve**, `best` com `kg` e `reps` numéricos. Ordem da mais antiga para a mais nova. Pausa: se duas sessões válidas seguidas estão a mais de **21 dias** uma da outra, só contam as que vêm depois da pausa. Usar no máximo as 6 últimas.

### C.3 O que conta como progresso

`cmp(S, R)` compara a melhor série da sessão `S` com a da referência `R` (`best` de `exerciseHistory`):
- Se as duas têm `e1rm` (só `m: 'kg'`, até 10 repetições): `q = S.e1rm / R.e1rm`. `q ≥ 1,01` é **melhor**; `q ≤ 0,97` é **pior**; o resto é igual.
- Senão, com `d = S.kg − R.kg`: `d ≥ 0,5` é melhor. Com `|d| < 0,5`: `S.reps ≥ R.reps + 1` é melhor e `S.reps ≤ R.reps − 2` é pior. `d ≤ −0,5` é pior, a não ser que `S.reps > R.reps` (aí é igual).

As tolerâncias de 1% e 0,5 kg evitam contar erro de digitação ou arredondamento como progresso. A de 3% para pior evita tratar 1 repetição a menos num dia ruim como queda.

### C.4 Decisão (nesta ordem)

`v` = sessões válidas, `n = v.length`.
1. **Queda** (`n ≥ 3`): `cmp(v[n−2], v[n−3])` e `cmp(v[n−1], v[n−3])` são **pior** → `acao: 'deload'`, `motivo: 'queda'`, `sessoes: 2`. É a regra da especificação: desempenho caindo em 2 treinos seguidos pede cortar de 30 a 40% das séries.
2. **Sem progresso** (`n ≥ 4`): `k` = maior valor de `min(5, n−1)` até 3 tal que nenhuma das últimas `k` sessões é **melhor** que `v[n−k−1]`. Sem esse `k`, devolve `null`.
   - `k ≥ 5` → `acao: 'trocar'`.
   - `k` de 3 a 4 → `acao: 'repeticoes'` se `ex.m === 'kg'` e a faixa atual (`repRange(setsForWeek(ex, week).reps)`) tiver `max ≤ 12`; senão `'trocar'`.
   - `motivo: 'sem-progresso'`, `sessoes: k`.
3. Faixa nova para `repeticoes`, pelo `max` da faixa atual: até 6 → `6–8`; de 7 a 10 → `8–12`; 11 ou 12 → `12–15`. `kgSugerido = floor(best.kg da última sessão × 0,9 × 2) / 2`.

A ação "Ajustar repetições" troca o `r` do exercício no bloco atual e nos seguintes pela faixa nova (edição com desfazer, `planEdit.ts`). A semana leve é só orientação (ADR 011).

Alinhamento: `suggestNext.stagnant` (3 sessões, sem tolerância) continua só como dado interno. A tela usa `stagnation` como fonte do aviso.

### C.5 Textos

- `deload`: `Seu desempenho caiu nos últimos 2 treinos deste exercício. Pode ser cansaço. Nesta semana, faça cerca de 1/3 menos séries dele e capriche no sono e na comida.`
- `deload` com `week % 4 === 2` (a próxima semana é leve): `Seu desempenho caiu nos últimos 2 treinos deste exercício. A próxima semana já é leve: siga o plano, durma bem e coma o suficiente.`
- `repeticoes`: `{k} treinos seguidos sem melhorar neste exercício. Uma ideia: mudar para {novaFaixa} repetições, com cerca de {kgSugerido} kg.` Botão: `Ajustar repetições`.
- `trocar`: `{k} treinos seguidos sem melhorar neste exercício. Trocar por um parecido por algumas semanas pode ajudar.` Botão: `Trocar só hoje`.
- Nota, uma vez na página do exercício: `Melhorar aqui é levantar mais carga ou fazer mais repetições com a mesma carga.`

### C.6 Casos de teste

Comum: `start = 2026-11-16` (segunda). Exercício A (`m: 'kg'`, `s: [4,5,5]`, `r: ['5–8','4–6','3–5']`), `beginner = false`, salvo quando indicado. Sessões às quartas: s0 11-18, s1 11-25, s2 12-02, s3 12-09 (semana leve), s4 12-16, s5 12-23, s6 12-30, s8 01-13, s9 01-20. Na coluna de entrada, "30×6" = melhor série com 30 kg e 6 repetições.

| # | Entrada | Saída esperada |
| --- | --- | --- |
| 1 | today 11-26 (semana 2); s0 e s1 30×6 | `null` (semanas 1 e 2) |
| 2 | today 12-10 (semana 4, leve); s0, s1 e s2 30×6 | `null` (semana leve) |
| 3 | today 12-17; s0, s1, s2 e s4 30×6; s3 30×5 (leve, ignorada) | `repeticoes`, `sessoes` 3, faixa atual 4–6, `novaFaixa` "6–8", `kgSugerido` 27 |
| 4 | igual ao 3, mas s4 30×7 | `null` (e1rm 37,0 contra 36,0: +2,8%, melhorou) |
| 5 | today 12-24; s0 30×6, s1 30×7, s2 30×8, s4 30×6, s5 30×5 | `deload`, `motivo` queda, texto normal (36/38 = 0,947 e 35/38 = 0,921) |
| 6 | today 12-29 (semana 7); s0 30×6, s1 30×8, s2 30×6, s4 30×6 | `deload`, texto "A próxima semana já é leve" |
| 7 | today 01-21; s0, s1, s2, s4, s5, s6, s8 e s9 30×6 | `trocar`, `sessoes` 5 |
| 8 | exercício `m: 'bw'`, `r: ['5–8','5–8','3–6']`; today 12-17; s0, s1, s2 e s4 0×6 | `trocar`, `sessoes` 3 (peso do corpo não recebe faixa nova) |
| 9 | today 01-21; s0 e s1 30×6, s8 e s9 30×6 (pausa de 49 dias) | `null` (só s8 e s9 contam) |
| 10 | `beginner = true`, `r: ['8–12','8–12','8–12']`; sessões 11-16, 11-18, 11-20, 11-23 e 11-25 com 20×10; today 11-30 | `null` (iniciante antes da semana 5) |
| 11 | igual ao 10 com `beginner = false` | `repeticoes`, `sessoes` 4, `novaFaixa` "12–15", `kgSugerido` 18 |
| 12 | exercício `m: 'kg'`, `r: ['12–20','12–20','12–20']`; today 12-17; s0, s1, s2 e s4 10×15 | `trocar`, `sessoes` 3 (sem e1rm acima de 10 repetições; faixa com máximo acima de 12) |

Um exercício `m: 's'` (prancha) com qualquer histórico também dá `null` (regra C.2.1). Vale incluir como asserção simples.

Caso 13 (regra C.2.6): exercício `m: 'kg'`, `r: ['10 por lado','10 por lado','10 por lado']` (Pallof); today 12-17; s0, s1, s2 e s4 15×10 → `null`.
