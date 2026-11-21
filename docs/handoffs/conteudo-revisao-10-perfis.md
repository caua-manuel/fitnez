# Conteúdo: revisão do assistente com 10 perfis (antes do uso por amigos)

Data: 20/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: DECIDIDO (regras); implementação pelo `backend-dados` em `src/domain/onboarding.ts` e `data/plan.json`; testes pelo `qa-testes`.
Base: `docs/revisao/assistente-10-perfis.md`, `docs/handoffs/qa-assistente-10-perfis.md`, ADR 008, ADR 010, `conteudo-assistente-inicio.md`, `conteudo-ajuste-volume-assistente.md`, `src/domain/onboarding.ts` e `src/domain/progression.ts` (lidos, não editados).
Registro do motivo: [ADR 012](../decisoes/012-revisao-assistente-10-perfis.md).

Todos os números novos são escolhas de produto conservadoras **(a verificar)**. Nenhum estudo foi conferido nesta passada. O aviso fixo ("O app não substitui nutricionista, médico ou educador físico") continua em todas as telas do assistente.

## 1. Tabela de decisões

### 1.1 BLOQUEIA uso por amigos (segurança)

| # | Perfil | Número ou conduta atual | Decisão | Número ou conduta nova | Motivo |
| --- | --- | --- | --- | --- | --- |
| B1 | 5 (gestação) | Treino igual ao de iniciante sem gestação (agachamento e hip thrust com barra, RIR até 2); só um aviso | MUDA | **Não gera plano** nem metas. Tela com texto próprio e sem botão "Começar o plano" | O treino na gravidez muda a cada fase (posição deitada, equilíbrio, pressão no abdome) e precisa de acompanhamento (a verificar). O app não tem como acompanhar isso, e uma regra de troca de exercícios seria ciência inventada. |
| B2 | 6 (condição de saúde) | Treino intermediário completo, RIR até 1–2, hip thrust com barra; só um aviso | MUDA | Plano leve: experiência tratada como `nunca` (teto 3 dias, volume de quem nunca treinou), RIR conservador `4, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4`, sem barra (hip thrust com barra vira ponte com halter) e **confirmação obrigatória** de liberação médica antes de aplicar | A condição é variada (coração, pressão, diabetes, rins, lesão). Sem profissional, o mínimo seguro é esforço longe da falha, menos dias e liberação médica explícita (a verificar). Bloquear tudo empurraria a pessoa para o plano de exemplo, que é de alguém experiente: pior. |
| B3 | 2 (67 anos, nunca treinou, casa sem equipamento) | Afundo, ponte com uma perna, agachamento livre; flexão pike possível com 3 dias; descanso de 120 s; nenhuma adaptação por idade | MUDA | A partir de 60 anos: experiência `nunca` (se não for intermediário), RIR conservador, agachamento vira **sentar e levantar da cadeira**, ponte com uma perna vira **ponte com as duas pernas**, stiff com uma perna sai, flexão pike vira flexão de braço, aviso `idade60`. Para qualquer `nunca` em casa sem equipamento: ponte com as duas pernas | Exercícios de uma perna só e de cabeça para baixo pedem equilíbrio e aumentam o risco de queda de quem começa mais tarde (a verificar). As trocas mantêm o mesmo grupo muscular, então o volume semanal continua dentro da faixa. |
| B4 | 9 (corrida sáb e dom) | Pernas B na sexta, véspera da corrida | MUDA (correção de regra) | A troca de dia passa a procurar também os treinos **anteriores**: Pernas B vai para quinta e Superior B para sexta | O passo 6 promete na tela: "O app evita treino pesado de pernas na véspera dessas atividades". A regra de 36 a 48 h longe da atividade é de prevenção de lesão (seção 3 da especificação). Hoje a troca só olha para frente e falha quando o treino de perna é o último da semana. |
| — | 4 (IMC 36) | Sanidade do QA (1,2 a 2,4 g/kg do peso real) falha; CI vermelho | MANTÉM a regra; MUDA a sanidade | Proteína continua pelo **peso de referência** (IMC 25) quando IMC > 30. Sanidade nova: **1,4 a 2,2 g/kg do peso de referência** | Não é segurança, mas impede o CI. Ver 2.6. |

### 1.2 Melhoria (não bloqueia, mas deve entrar na mesma rodada se possível)

| # | Perfil | Número ou conduta atual | Decisão | Número ou conduta nova | Motivo |
| --- | --- | --- | --- | --- | --- |
| M1 | 2, 3, 9, 10 (exercícios `rep`) | Repetições do catálogo (até 25) e não da tabela de volume; descanso de 120 ou 150 s nos principais | MANTÉM as repetições; MUDA o descanso | Repetições do catálogo continuam. Descanso do principal sem carga: **90 s** (era 120 ou 150) | Sem carga, a progressão é por repetição: 6–10 repetições de agachamento livre ficariam longe da falha e o RIR do bloco seria inatingível. A faixa progressiva do catálogo foi escolhida para isso (seção 4.1). Mas 150 s de descanso entre séries de flexão é tempo morto; 90 s é o descanso que o próprio catálogo dá. |
| M2 | 10 (remada com mochila) | `remada_mochila` (m `kg`) recebe 6–10 / 6–8 / 5–8 do intermediário | MUDA | Mantém a faixa do catálogo: **10–15 / 10–15 / 8–12**, descanso 90 s | A carga de uma mochila é limitada; 5–8 repetições pediriam peso que a mochila não comporta. Resolve a mistura de faixas do perfil 10. |
| M3 | 1, 5, 6, 8 (afundo, Pallof) | O catálogo diz "10 por perna" e "10 por lado"; o assistente troca por "12–15" e perde o "por perna" | MUDA | A faixa da tabela continua (ex.: "12–15") e a observação ganha **"Repetições por perna."** ou **"Repetições por lado."** no começo | "12–15" sem "por perna" leva a fazer metade. Não dá para pôr o texto na faixa: `repRange` não lê "12–15 por perna" e a sugestão de carga pararia. |
| M4 | 8 (nunca treinou, 60 a 90 min) | 8 exercícios mantidos sem aviso | MUDA | Para experiência `nunca` (inclui menor de 18, condição e 60+), `longo` vira **`medio`** (6 exercícios, 45 a 60 min), com aviso `duracao-reduzida` | Quem começa aprende melhor poucos movimentos, e o cansaço e a dor muscular das primeiras semanas são a causa comum de desistência (a verificar). O volume do perfil 8 já estava na faixa; o que sobrava era tempo e exercício a mais. |
| M5 | 4, 7 (pernas em dias seguidos) | Perfil 7: Pernas A sex e Pernas B sáb. Perfil 4: Pernas B sex e Corpo inteiro A (agachamento e hip thrust com barra) sáb | MUDA | Treinos com pernas (Pernas A, Pernas B, Corpo inteiro A e B) não ficam em dias seguidos quando houver dia livre que resolva. Perfil 7: Pernas B vai para **domingo**. Perfil 4: Corpo inteiro A vai para **domingo** | Os mesmos músculos com 24 h de intervalo atrapalham a recuperação. Com um dia livre disponível, a correção não custa nada. |
| M6 | 5 (descanso 1.400 kcal, 67 anos e "perder") | Perfil 2: 1.400 (conta deu 1.382, arredondada). Perfil 8: 1.400 no descanso e 1.450 na academia | MANTÉM | — | Perfil 2 não é piso, é manutenção (objetivo "saúde"). Perfil 8: déficit de 12% no descanso e 19% na academia, dentro do proposto, e 1.400 kcal fica acima dos mínimos costumeiros para mulheres adultas (a verificar). O piso existe justamente para isso. |
| M7 | 9 (corrida = vôlei, +300 kcal) | +300 kcal por dia de corrida | MANTÉM | — | O assistente não sabe quanto a pessoa corre. 300 kcal correspondem a cerca de 30 a 40 min de corrida leve para um adulto médio (a verificar). Errar para menos é o lado seguro para quem quer perder, e a revisão semanal corrige quem quer ganhar. |
| M8 | 9 (curto em casa com equipamento) | Pernas A e B com os mesmos 4 exercícios em outra ordem | MANTÉM | — | Com 4 vagas e o catálogo de casa, não há outro exercício de joelho com carga (`goblet` é o único). A ordem diferente muda qual é o principal do dia. Fica registrado como limite do catálogo. |
| M9 | 3 (IMC 17) | Gordura no piso de 40 g (18 a 20% das kcal) | MANTÉM | — | Está perto dos 20% e o objetivo foi trocado para manutenção com aviso para procurar nutricionista. |
| M10 | 1 (16 anos) | Teto de `nunca`, sem metas | MANTÉM | — | Decisão do dono (ADR 008). Ver pendência P1 sobre idades muito baixas. |
| M11 | 10 (semana cheia) | 2 treinos curtos fora da rotina, "longo" ignorado | MANTÉM | — | Decisão do dono (ADR 008). |

### 1.3 Pendências do dono (recomendação e resposta curta)

- **P1. Idade mínima.** Hoje o passo 7 aceita a partir de 10 anos e o plano inclui hip thrust com barra. Recomendo: **abaixo de 14 anos, não gerar plano** (mesma tela da gestação, com texto próprio). Responda "sim, 14" ou "manter".
- **P2. Amamentação.** A opção do passo 0 junta gravidez e amamentação, e a amamentação herdaria o bloqueio de B1. Recomendo separar em duas opções: gravidez bloqueia (B1); amamentação segue a conduta de condição de saúde (B2). Responda "separar" ou "bloquear as duas".
- **P3. Transtorno alimentar.** O treino não muda. Recomendo teto de 4 dias e sem `longo` (excesso de exercício é um sinal comum nesses quadros, a verificar). Responda "sim" ou "manter".

## 2. Regras implementáveis (para o `backend-dados`)

Tudo em `src/domain/onboarding.ts`, salvo onde indicado. Nenhuma regra nova lê relógio ou dados.

### 2.1 Contexto de segurança e idade (B1, B2, B3)

```ts
export const RIR_CONSERVADOR = ['4','3','3','4','3','3','3','4','3','3','3','4'] as const; // a verificar
export const OLDER_AGE = 60;                                                          // a verificar
const isOlder = (a) => typeof a.body?.age === 'number' && a.body.age >= OLDER_AGE;
const isConservative = (a) => safetyFlagsOf(a).includes('condicao');
export function planBlockedReason(a): 'gestacao' | null { return safetyFlagsOf(a).includes('gestacao') ? 'gestacao' : null; }
```

- `effectiveExperience(a)`: devolve `'nunca'` se `isMinor(a) || isConservative(a) || (isOlder(a) && a.experience !== 'intermediario')`; senão `a.experience`.
- `buildPlanFromAnswers`: se `planBlockedReason(a)` não for `null`, lançar `OnboardingError('Plano não gerado: gestação.')` (defesa; a tela nunca deve chamar nesse caso).
- RIR do plano: `if (isConservative(a) || isOlder(a)) plan.rir = [...RIR_CONSERVADOR]; else if (exp !== 'intermediario') plan.rir = [...RIR_BEGINNER];`
- Avisos novos em `OnboardingWarning`: `'idade60'` (quando `isOlder`) e `'duracao-reduzida'` (2.3). Ordem de exibição: segurança, `idade60`, `sem-dados`, `imc-*`, `duracao-reduzida`, `semana-cheia`.
- `buildOnboardingPreview`:
  - novo campo `blocked: 'gestacao' | null`. Com `blocked`, `generated` é `null` (tipo `GeneratedPlan | null`), `usedDayTypes` é `[]` e o resumo tem `gymDays: 0`, `scheduledGymDays: 0`, `sessionNames: []`. A dieta continua `kind: 'none', reason: 'seguranca'`.
  - novo campo `requiresClearance: boolean`, `true` quando `isConservative(a)` e não bloqueado.
- Frontend (aviso para o `frontend`, sem regra de domínio): com `requiresClearance`, o botão "Começar o plano" fica desabilitado até marcar a caixa `Meu médico me liberou para fazer musculação.` A marcação **não é gravada** (mesma regra de privacidade do passo 0).

### 2.2 Exercício por vaga (B2, B3)

`slotExercise(slot, place, exp)` passa a receber `mods: { older: boolean; conservative: boolean }`. Mudanças sobre a tabela atual (o resto fica igual):

| Vaga | Local | Condição | Exercício |
| --- | --- | --- | --- |
| quadril | academia | `conservative` | `ponte_h` (no lugar de `hip_b`) |
| quadril | casa_livre | `exp === 'nunca' \|\| older` | `ponte` (novo) |
| joelho, joelho 2 | casa_livre | `older` | `sentar_levantar` (novo) |
| posterior | casa_livre | `older` | `null` (vaga pulada) |
| empurrar vertical | casa_livre | `older \|\| conservative` | `flexao` (no lugar de `pike`) |

`ASSISTANT_EXERCISE_IDS` deve percorrer também as 4 combinações de `mods`, para incluir `ponte` e `sentar_levantar`.

Exercícios novos em `data/plan.json` (`plan.ex`), no formato do catálogo:

```json
"ponte": { "n": "Ponte de glúteo", "s": [3, 3, 4], "r": ["10–15", "12–15", "12–20"], "m": "rep",
  "t": "Deitado de costas, joelhos dobrados. Suba o quadril, aperte o glúteo e desça devagar.", "rest": 60, "g": "posterior-gluteos" },
"sentar_levantar": { "n": "Sentar e levantar da cadeira", "s": [3, 3, 4], "r": ["8–12", "10–15", "12–15"], "m": "rep",
  "t": "Cadeira firme, encostada na parede. Levante sem usar as mãos se conseguir; se não, apoie as mãos nos joelhos.", "rest": 90, "g": "quadriceps" }
```

Observação de `afundo_livre` passa a ser: `Repetições por perna. Fique ao lado de uma parede ou cadeira e apoie a mão.` (era "Repetições por perna. Apoie a mão na parede se perder o equilíbrio.").

### 2.3 Duração para quem nunca treinou (M4)

Em `buildPlanFromAnswers`, logo depois de calcular `duration`:

```ts
let duration: Duration = full ? 'curto' : answers.duration;
if (exp === 'nunca' && duration === 'longo') { duration = 'medio'; warnings.push('duracao-reduzida'); }
```

### 2.4 Repetições, observação e descanso (M1, M2, M3)

```ts
const LOAD_LIMITED: ReadonlySet<string> = new Set(['remada_mochila']);
// dentro do laço de exercícios:
const keepCatalogReps = e.m === 'rep' || e.m === 's' || LOAD_LIMITED.has(id);
if (!keepCatalogReps) {
  e.r = [...(principal ? vol.pr : vol.ar)];
  const unit = /\spor (lado|perna)\s*$/.exec(String(base.r[0] ?? ''))?.[1];
  if (unit && !/^Repetições por /.test(e.t ?? '')) e.t = `Repetições por ${unit}.${e.t ? ' ' + e.t : ''}`;
}
e.rest = CORE_SLOTS.has(slot) ? CORE_REST : principal ? (keepCatalogReps ? 90 : vol.prest) : vol.arest;
```

Resultado: `afundo` → t `Repetições por perna. Passo controlado.`; `pallof` → `Repetições por lado. Sem girar o tronco.`; `bulg` → `Repetições por perna. Amplitude sem dor no joelho.`

### 2.5 Dias da semana (B4, M5)

Na troca de treinos de pernas (o laço com `busy`), a busca do parceiro passa a ser: primeiro `k > i` em ordem crescente (como hoje); se não houver, `k < i` do mais próximo para o mais distante (`i-1` até `0`). Só aceita o parceiro `b` se `!isLegSession(b.key)` e se o treino de pernas ficar válido no dia dele: `!busy(b.day) && !busy((b.day + 1) % 7)`.

Depois da troca, uma passada nova para pernas em dias seguidos:

```
temPerna(key) = key ∈ {PERA, PERB, CIA, CIB}
para d de 0 a 6:
  e = (d + 1) % 7
  se o dia d e o dia e têm treino com perna:
    para f de 0 a 6 (em ordem):
      f livre (sem treino e sem atividade fixa), !busy((f + 1) % 7),
      e nenhum dos dias vizinhos de f ((f + 6) % 7 e (f + 1) % 7), sem contar o próprio e, tem treino com perna
      → mover o treino do dia e para f; parar a busca
    (sem f válido: deixa como está)
```

Conferência com os exemplos da especificação (seção 7 de `conteudo-assistente-inicio.md`): nenhum dos 15 muda de dia. No 5 e no 11 não há dia livre que resolva. Mudam os perfis 4, 7 e 9 do QA (seção 3).

### 2.6 Sanidade do QA (perfil 4)

A regra fica: `refW = IMC > 30 ? 25 × (altura/100)² : peso`, proteína = `r5(refW × g/kg do objetivo)`. Usar o peso de referência quando há obesidade é uma prática comum (a verificar). Se fosse pelo peso real, 2,0 g/kg × 110 kg dariam 220 g, um número que um leigo não alcança e que não traz ganho conhecido.

**Para o `qa-testes`:** a sanidade passa a ser `proteinG / refW` entre **1,4 e 2,2 g/kg do peso de referência** (as constantes são 1,6 a 2,0; a folga cobre o arredondamento de 5 g no peso mínimo de 30 kg). Não usar faixa sobre o peso real. Perfil 4: 125 / 76,6 = 1,63, passa.

## 3. Saídas esperadas depois das mudanças (para os testes)

| # | O que muda |
| --- | --- |
| 1 | Só textos: afundo com `Repetições por perna.` e Pallof com `Repetições por lado.` na observação. |
| 2 | Aviso `idade60`. RIR conservador. Corpo inteiro A (curto): `sentar_levantar`, `flexao`, `remada_mochila`, `ponte`. Corpo inteiro B (2 dias, curto): `ponte`, `flexao`, `remada_mochila`, `afundo_livre`. Séries 2/3/3 nos 4 principais e 2/2/3 no afundo. Repetições do catálogo (remada com mochila 10–15/10–15/8–12). Descanso 90 s nos principais e 60 s no afundo. Dieta igual (1.400 a 1.600 kcal, P 105 g). |
| 3 | Puxada com elástico: descanso 90 s. O resto fica igual. |
| 4 | Corpo inteiro A passa de sábado para **domingo** (rotina: seg Superior A, ter Pernas A, qua Superior B, sex Pernas B, dom Corpo inteiro A). Sanidade passa (1,63 g/kg de referência). Pallof com `Repetições por lado.` |
| 5 | `blocked: 'gestacao'`, `generated: null`, sem metas. |
| 6 | Experiência usada `nunca`: 3 treinos (Corpo inteiro A, B, A em seg, qua, sex). A: `leg`, `supino`, `puxada`, `ponte_h`, `lat_a`, `pallof`. B: `ponte_h`, `press_b`, `remada_b`, `afundo`, `face`, `pallof`. Séries de `nunca`. RIR conservador. `requiresClearance: true`. |
| 7 | Pernas B passa de sábado para **domingo** (seg Superior A, ter luta, qua Superior B, qui luta, sex Pernas A, sáb descanso, dom Pernas B). |
| 8 | Duração `medio`, 6 exercícios por treino, aviso `duracao-reduzida`. Dieta igual. |
| 9 | Rotina: seg Superior A, ter Pernas A, qua descanso, **qui Pernas B, sex Superior B**, sáb e dom corrida. Puxada com elástico 90 s. |
| 10 | Remada com mochila 10–15/10–15/8–12, descanso 90 s. Agachamento livre, flexão e ponte com uma perna: descanso 90 s. |

Exemplos da especificação afetados (atualizar os testes): **8** (gestação) passa a ser bloqueado; **14** (condição) passa a ter experiência `nunca`, `ponte_h` no lugar de `hip_b` e RIR conservador; **2** e **(d)** (casa sem equipamento, `nunca`) passam a ter `ponte` no lugar de `ponte_uni` e descanso de 90 s nos principais sem carga. Volume semanal (seção 4.2): nenhum perfil sai da faixa, porque as trocas mantêm o grupo muscular (`ponte` em posterior e glúteos, `sentar_levantar` em quadríceps, `flexao` em peito: com 3 dias, `nunca` em casa sem equipamento dá peito 6, dentro de 4 a 8).

## 4. Textos novos (pt-BR)

- `gestacao` (tela de bloqueio): `Na gravidez, o treino muda a cada fase e precisa de acompanhamento. Por isso o app não monta um plano nem calcula metas de dieta. Converse com seu médico e, com a liberação dele, procure um educador físico. O plano de exemplo do app também não foi feito para a gravidez.` Botões: `Voltar` e `Explorar o app`.
- `condicao` (substitui o atual): `Com uma condição de saúde, o app monta um começo leve, com esforço longe do limite, e não calcula metas de dieta. Antes de começar, peça liberação ao seu médico e procure um nutricionista. Durante o esforço, não prenda a respiração.`
- Caixa de confirmação (condição): `Meu médico me liberou para fazer musculação.`
- `idade60`: `A partir dos 60 anos, o app monta um começo mais leve, com exercícios mais estáveis. Se tiver alguma condição de saúde ou estiver parado há muito tempo, converse com seu médico antes de começar.`
- `duracao-reduzida`: `Para quem está começando, o app montou treinos de 45 a 60 minutos. Depois de algumas semanas, você pode acrescentar exercícios em Treinos.`
- O texto de dor da revisão continua igual.

## 5. Aval de textos do UX (`docs/handoffs/ux-primeira-abertura.md`)

**A14 (linha do limite de dias): AJUSTE.** O texto proposto, `Para começar com segurança, o app montou {gymDays} dias. Dá para aumentar depois, em Perfil.`, tem três problemas:
1. `gymDays < daysPerWeek` acontece por **dois motivos**: o teto por experiência e as atividades fixas (no máximo 6 dias ativos). "Para começar com segurança" só serve para o primeiro. O intermediário que pede 6 dias também cai no teto (5) e não está "começando".
2. "Em Perfil" leva a refazer o assistente, que aplica o mesmo teto. Quem quer mais treinos acrescenta em **Treinos**, como diz a especificação (2.1).
3. "Montou 3 dias" soa estranho. Melhor "3 treinos por semana".

Regra para o `backend-dados`: `GeneratedPlan` ganha `daysReason: 'teto' | 'atividades' | null`. Vale `'atividades'` quando o corte `dias + fixas > 6` foi aplicado (mesmo que o teto também tenha cortado); vale `'teto'` quando só `min(daysPerWeek, TETO[exp])` cortou; e `null` quando nada cortou ou com `semana-cheia`.

Textos aprovados (o `frontend` mostra no resumo só quando `daysReason !== null`):
- `teto`: `Você pediu {pedido} dias. O app montou {n} treinos por semana para sobrar tempo de recuperação. Depois de algumas semanas, você pode acrescentar treinos em Treinos.`
- `atividades`: `Com suas outras atividades, o app montou {n} treinos por semana para você ter pelo menos 1 dia de descanso.`

**Outros textos do mesmo handoff que tocam em treino ou dieta:**
- A12 (`Em cada série, pare antes de não aguentar mais: o app mostra quantas repetições deixar sobrando.`): APROVADO. Explica o RIR sem sigla e não promete número.
- A13 e A13b (`mais nos dias de treino`, `por dia`): APROVADOS. Em todas as fórmulas, o dia de descanso tem a menor meta de kcal, então a frase é verdadeira. Os números não mudam.
- A16 (texto de dor): APROVADO. Os limites (4 em 10, 2 semanas, formigamento ou perda de força) são os mesmos da seção 3 da especificação.
- O1 (`core` vira `abdômen` nos subtítulos): APROVADO. Pallof, dead bug e prancha trabalham o tronco inteiro, mas "abdômen" é o termo que um leigo entende, e o subtítulo não é descrição técnica.
