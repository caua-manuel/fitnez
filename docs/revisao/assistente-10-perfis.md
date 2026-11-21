# Assistente de início: saída para 10 perfis fictícios

Gerado por `tests/unit/assistente-perfis.test.ts` com o código real (`src/domain/onboarding.ts`) e o catálogo de `data/plan.json`, já com as regras do ADR 012.
Para refazer: `GERAR_TABELA_PERFIS=1 npx vitest run tests/unit/assistente-perfis.test.ts`. Perfis inventados; nenhum dado de pessoa real.

Leitura: séries e repetições aparecem por bloco (semanas 1–4 / 5–8 / 9–12). Dias da semana: 0 = segunda. A coluna "Estranho?" registra o que mudou com o ADR 012 ou o que foi mantido; não é parecer de nutrição ou de treino. Sanidade da proteína: 1,4 a 2,2 g/kg do peso de referência (IMC acima de 30 usa o peso de IMC 25).

## Resumo

| # | Perfil | Treinos (divisão/rotina) | Dieta | Avisos | Sanidade | Estranho? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Adolescente (16) querendo massa, 4 dias | 3/3: Corpo inteiro A, Corpo inteiro B | sem metas (seguranca) | menor18 | passou | Pediu 4 dias como iniciante; a idade (16) virou "menor18" sem marcar no passo 0 e o plano caiu para 3 dias de "nunca treinou" (teto 3). Sem metas de dieta (motivo: segurança). ADR 012: afundo e Pallof com "Repetições por perna/lado." na observação. |
| 2 | Idosa (67), saúde, nunca treinou, em casa sem equipamento | 2/2: Corpo inteiro A, Corpo inteiro B | 1400–1600 kcal, P 105 g | idade60 | passou | ADR 012: aviso idade60, RIR conservador, sentar e levantar da cadeira no lugar do agachamento livre, ponte com as duas pernas, sem stiff com uma perna nem flexão pike. Repetições do catálogo e 90 s nos principais sem carga. Descanso com 1.400 kcal: é manutenção (objetivo saúde), não o piso. |
| 3 | IMC baixo (17) querendo perder, casa com equipamento | 3/3: Corpo inteiro A, Corpo inteiro B | 1850–2050 kcal, P 85 g | imc-baixo | passou | Objetivo "perder" trocado para "saúde" com aviso imc-baixo (sem déficit). Sexo "não informar" usa constante intermediária (-78) na TMB. Gordura no piso de 40 g (mantido no ADR 012). Puxada com elástico (principal sem carga): 90 s. |
| 4 | IMC alto (36) querendo massa, intermediário, 5 dias longos | 5/5: Superior A, Pernas A, Superior B, Pernas B, Corpo inteiro A | 2450–2700 kcal, P 125 g | imc-alto-massa | passou | Objetivo "massa" trocado para "saúde" com aviso imc-alto-massa. Proteína e gordura pelo peso de referência (IMC 25 = 76,6 kg); a sanidade passou a ser 1,4 a 2,2 g/kg desse peso (ADR 012). ADR 012: Corpo inteiro A passa de sábado para domingo, para não ficar no dia seguinte a Pernas B. |
| 5 | Gestante, iniciante, academia | não gerado (gestacao) | sem metas (seguranca) | gestacao | passou | ADR 012: gestação não gera plano nem metas (blocked: gestacao). A tela mostra texto próprio, sem "Começar o plano". |
| 6 | Condição de saúde, perder, intermediário, 4 dias | 3/3: Corpo inteiro A, Corpo inteiro B | sem metas (seguranca) | condicao | passou | ADR 012: plano leve (experiência usada "nunca", 3 treinos), RIR conservador, ponte com halter no lugar do hip thrust com barra e confirmação obrigatória da liberação médica (requiresClearance, não gravada). Sem metas de dieta. |
| 7 | Lutador, recomp, intermediário, pediu 6 dias longos | 4/4: Superior A, Pernas A, Superior B, Pernas B | 2350–2650 kcal, P 160 g | nenhum | passou | Pediu 6 dias; teto do intermediário (5) e as 2 lutas reduziram a 4 treinos (daysReason: atividades). ADR 012: Pernas B passa de sábado para domingo, para não ficar no dia seguinte a Pernas A. Jiu-jitsu tem a maior kcal da semana. |
| 8 | Nunca treinou, perder, pediu 6 dias de 60 a 90 min | 3/3: Corpo inteiro A, Corpo inteiro B | 1400–1450 kcal, P 115 g | duracao-reduzida | passou | ADR 012: quem nunca treinou com 60 a 90 min recebe 45 a 60 min (6 exercícios) e aviso duracao-reduzida; o teto corta para 3 dias (daysReason: teto). kcal no piso de 1.400 em dia de descanso (mantido). |
| 9 | Corredor(a), massa, iniciante, casa com equipamento, treino curto | 4/4: Superior A, Pernas A, Superior B, Pernas B | 2100–2450 kcal, P 125 g | nenhum | passou | Corrida entra como "esporte" (+300 kcal, mantido). ADR 012: Pernas B passa de sexta (véspera da corrida) para quinta e Superior B para sexta. Pernas A e B com os mesmos 4 exercícios em outra ordem: limite do catálogo (mantido). |
| 10 | Semana cheia (luta + corrida em 6 dias), sem peso e altura | 2/0: Corpo inteiro A, Corpo inteiro B | sem metas (sem-dados) | sem-dados, semana-cheia | passou | Semana cheia: 2 treinos curtos fora da rotina, duração "longo" ignorada (decisão do dono). Sem metas de dieta por falta de altura e peso. ADR 012: remada com mochila mantém a faixa do catálogo (10–15/10–15/8–12) e os principais sem carga têm 90 s. |

## Perfil 1: Adolescente (16) querendo massa, 4 dias

**Entrada:** segurança: nenhum; objetivo massa; experiência iniciante; 4 dias; duração medio; local academia; atividades fixas: nenhuma; sexo m, 16 anos, 172 cm, 61 kg, rotina moderado, IMC 20,6

| Campo | Saída |
| --- | --- |
| Experiência usada | nunca |
| Treinos na divisão / na rotina | 3 / 3 |
| Motivo do corte de dias | teto |
| Duração usada | medio |
| Liberação médica obrigatória | não |
| Semana | seg: Corpo inteiro A; ter: descanso; qua: Corpo inteiro B; qui: descanso; sex: Corpo inteiro A; sáb: descanso; dom: descanso |
| Corpo inteiro A (45 a 60 min, 6 exercícios) | Leg press, pés na altura média: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Supino com halteres: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Puxada na frente, pegada aberta: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Hip thrust com barra: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Elevação lateral com halteres: 2/2/3 × 12–15/12–15/10–15, desc. 60 s<br>Pallof press (core): 2/2/3 × 12–15/12–15/10–15 por lado, desc. 45 s |
| Corpo inteiro B (45 a 60 min, 6 exercícios) | Hip thrust com barra: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Press de ombros sentado: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Remada unilateral ou remada baixa: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Afundo ou step-up: 2/2/3 × 12–15/12–15/10–15 por perna, desc. 60 s<br>Face pull na polia: 2/2/3 × 12–15/12–15/10–15, desc. 60 s<br>Pallof press (core): 2/2/3 × 12–15/12–15/10–15 por lado, desc. 45 s |
| RIR por semana (1 a 12) | iniciante: 3/3/3/4/2–3/2–3/2/4/2/2/2/4 |
| Avisos | menor18 |
| Dieta | não gera metas (motivo: seguranca); objetivo usado: massa; Dieta sem números: não |
| Sanidade | passou |
| Estranho? | Pediu 4 dias como iniciante; a idade (16) virou "menor18" sem marcar no passo 0 e o plano caiu para 3 dias de "nunca treinou" (teto 3). Sem metas de dieta (motivo: segurança). ADR 012: afundo e Pallof com "Repetições por perna/lado." na observação. |

## Perfil 2: Idosa (67), saúde, nunca treinou, em casa sem equipamento

**Entrada:** segurança: nenhum; objetivo saude; experiência nunca; 2 dias; duração curto; local casa_livre; atividades fixas: nenhuma; sexo f, 67 anos, 158 cm, 66 kg, rotina pouco, IMC 26,4

| Campo | Saída |
| --- | --- |
| Experiência usada | nunca |
| Treinos na divisão / na rotina | 2 / 2 |
| Motivo do corte de dias | nenhum |
| Duração usada | curto |
| Liberação médica obrigatória | não |
| Semana | seg: Corpo inteiro A; ter: descanso; qua: descanso; qui: Corpo inteiro B; sex: descanso; sáb: descanso; dom: descanso |
| Corpo inteiro A (30 a 45 min, 4 exercícios) | Sentar e levantar da cadeira: 2/3/3 × 8–12/10–15/12–15, desc. 90 s<br>Flexão de braço: 2/3/3 × 5–12/8–15/10–20, desc. 90 s<br>Remada curvada com mochila: 2/3/3 × 10–15/10–15/8–12, desc. 90 s<br>Ponte de glúteo: 2/3/3 × 10–15/12–15/12–20, desc. 90 s |
| Corpo inteiro B (30 a 45 min, 4 exercícios) | Ponte de glúteo: 2/3/3 × 10–15/12–15/12–20, desc. 90 s<br>Flexão de braço: 2/3/3 × 5–12/8–15/10–20, desc. 90 s<br>Remada curvada com mochila: 2/3/3 × 10–15/10–15/8–12, desc. 90 s<br>Afundo com peso do corpo: 2/2/3 × 8–12/10–15/12–15 por perna, desc. 60 s |
| RIR por semana (1 a 12) | conservador: 4/3/3/4/3/3/3/4/3/3/3/4 |
| Avisos | idade60 |
| Objetivo usado na dieta | saude |
| Metas por tipo de dia (só os usados na rotina) | Academia: 1600 kcal, carbo 171 g<br>Descanso: 1400 kcal, carbo 121 g |
| Proteína / gordura / água | 105 g (1,59 g/kg do peso real) / 55 g / 2,5 L |
| Sanidade | passou |
| Estranho? | ADR 012: aviso idade60, RIR conservador, sentar e levantar da cadeira no lugar do agachamento livre, ponte com as duas pernas, sem stiff com uma perna nem flexão pike. Repetições do catálogo e 90 s nos principais sem carga. Descanso com 1.400 kcal: é manutenção (objetivo saúde), não o piso. |

## Perfil 3: IMC baixo (17) querendo perder, casa com equipamento

**Entrada:** segurança: nenhum; objetivo perder; experiência iniciante; 3 dias; duração medio; local casa_equip; atividades fixas: nenhuma; sexo nao_informar, 27 anos, 176 cm, 52,5 kg, rotina moderado, IMC 16,9

| Campo | Saída |
| --- | --- |
| Experiência usada | iniciante |
| Treinos na divisão / na rotina | 3 / 3 |
| Motivo do corte de dias | nenhum |
| Duração usada | medio |
| Liberação médica obrigatória | não |
| Semana | seg: Corpo inteiro A; ter: descanso; qua: Corpo inteiro B; qui: descanso; sex: Corpo inteiro A; sáb: descanso; dom: descanso |
| Corpo inteiro A (45 a 60 min, 6 exercícios) | Agachamento goblet com halter: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Supino no chão com halteres: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Puxada com elástico: 3/3/4 × 10–15/10–15/12–15, desc. 90 s<br>Ponte de glúteo com halter: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Elevação lateral com halteres: 2/3/3 × 12–15/10–15/10–12, desc. 60 s<br>Dead bug: 2/3/3 × 6–8/8–10/8–12 por lado, desc. 45 s |
| Corpo inteiro B (45 a 60 min, 6 exercícios) | Ponte de glúteo com halter: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Press de ombros sentado: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Remada unilateral ou remada baixa: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Agachamento búlgaro: 2/3/3 × 12–15/10–15/10–12 por perna, desc. 60 s<br>Face pull com elástico: 2/3/3 × 12–15/12–15/15–20, desc. 60 s<br>Dead bug: 2/3/3 × 6–8/8–10/8–12 por lado, desc. 45 s |
| RIR por semana (1 a 12) | iniciante: 3/3/3/4/2–3/2–3/2/4/2/2/2/4 |
| Avisos | imc-baixo |
| Objetivo usado na dieta | saude |
| Metas por tipo de dia (só os usados na rotina) | Academia: 2050 kcal, carbo 338 g<br>Descanso: 1850 kcal, carbo 288 g |
| Proteína / gordura / água | 85 g (1,62 g/kg do peso real) / 40 g / 2 L |
| Sanidade | passou |
| Estranho? | Objetivo "perder" trocado para "saúde" com aviso imc-baixo (sem déficit). Sexo "não informar" usa constante intermediária (-78) na TMB. Gordura no piso de 40 g (mantido no ADR 012). Puxada com elástico (principal sem carga): 90 s. |

## Perfil 4: IMC alto (36) querendo massa, intermediário, 5 dias longos

**Entrada:** segurança: nenhum; objetivo massa; experiência intermediario; 5 dias; duração longo; local academia; atividades fixas: nenhuma; sexo m, 34 anos, 175 cm, 110 kg, rotina pouco, IMC 35,9

| Campo | Saída |
| --- | --- |
| Experiência usada | intermediario |
| Treinos na divisão / na rotina | 5 / 5 |
| Motivo do corte de dias | nenhum |
| Duração usada | longo |
| Liberação médica obrigatória | não |
| Semana | seg: Superior A; ter: Pernas A; qua: Superior B; qui: descanso; sex: Pernas B; sáb: descanso; dom: Corpo inteiro A |
| Superior A (60 a 90 min, 7 exercícios) | Supino com halteres: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Puxada na frente, pegada aberta: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Press de ombros sentado: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Remada unilateral ou remada baixa: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Elevação lateral com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Rosca direta com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Tríceps na polia: 3/3/4 × 10–12/10–12/8–12, desc. 60 s |
| Pernas A (60 a 90 min, 7 exercícios) | Agachamento com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Hip thrust com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Agachamento búlgaro: 3/3/4 × 10–12/10–12/8–12 por perna, desc. 60 s<br>Stiff com barra ou halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Panturrilha em pé: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Pallof press (core): 3/3/4 × 10–12/10–12/8–12 por lado, desc. 45 s<br>Prancha: 3/3/4 × 20–30/30–40/30–45 s, desc. 45 s |
| Superior B (60 a 90 min, 7 exercícios) | Remada unilateral ou remada baixa: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Supino inclinado com halteres: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Puxada na frente, pegada aberta: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Elevação lateral com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Face pull na polia: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Tríceps na polia: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Rosca direta com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s |
| Pernas B (60 a 90 min, 7 exercícios) | Hip thrust com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Leg press, pés na altura média: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Agachamento búlgaro: 3/3/4 × 10–12/10–12/8–12 por perna, desc. 60 s<br>Stiff com barra ou halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Panturrilha em pé: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Pallof press (core): 3/3/4 × 10–12/10–12/8–12 por lado, desc. 45 s<br>Prancha: 3/3/4 × 20–30/30–40/30–45 s, desc. 45 s |
| Corpo inteiro A (60 a 90 min, 8 exercícios) | Agachamento com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Supino com halteres: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Puxada na frente, pegada aberta: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Hip thrust com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Elevação lateral com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Pallof press (core): 3/3/4 × 10–12/10–12/8–12 por lado, desc. 45 s<br>Rosca direta com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Panturrilha em pé: 3/3/4 × 10–12/10–12/8–12, desc. 60 s |
| RIR por semana (1 a 12) | padrão do plano: 3/2–3/2/4/2/1–2/1–2/4/2/1–2/1–2/4 |
| Avisos | imc-alto-massa |
| Objetivo usado na dieta | saude |
| Metas por tipo de dia (só os usados na rotina) | Perna: 2700 kcal, carbo 415 g<br>Academia: 2650 kcal, carbo 403 g<br>Descanso: 2450 kcal, carbo 353 g |
| Proteína / gordura / água | 125 g (1,14 g/kg do peso real; 1,63 g/kg do peso de referência, 76,6 kg) / 60 g / 4 L |
| Sanidade | passou |
| Estranho? | Objetivo "massa" trocado para "saúde" com aviso imc-alto-massa. Proteína e gordura pelo peso de referência (IMC 25 = 76,6 kg); a sanidade passou a ser 1,4 a 2,2 g/kg desse peso (ADR 012). ADR 012: Corpo inteiro A passa de sábado para domingo, para não ficar no dia seguinte a Pernas B. |

## Perfil 5: Gestante, iniciante, academia

**Entrada:** segurança: gestacao; objetivo perder; experiência iniciante; 3 dias; duração medio; local academia; atividades fixas: nenhuma; sexo f, 31 anos, 165 cm, 72 kg, rotina moderado, IMC 26,4

| Campo | Saída |
| --- | --- |
| Plano | não gerado (blocked: gestacao) |
| Avisos | gestacao |
| Dieta | não gera metas (motivo: seguranca); objetivo usado: saude |
| Sanidade | passou |
| Estranho? | ADR 012: gestação não gera plano nem metas (blocked: gestacao). A tela mostra texto próprio, sem "Começar o plano". |

## Perfil 6: Condição de saúde, perder, intermediário, 4 dias

**Entrada:** segurança: condicao; objetivo perder; experiência intermediario; 4 dias; duração medio; local academia; atividades fixas: nenhuma; sexo m, 52 anos, 180 cm, 98 kg, rotina pouco, IMC 30,2

| Campo | Saída |
| --- | --- |
| Experiência usada | nunca |
| Treinos na divisão / na rotina | 3 / 3 |
| Motivo do corte de dias | teto |
| Duração usada | medio |
| Liberação médica obrigatória | sim (não gravada) |
| Semana | seg: Corpo inteiro A; ter: descanso; qua: Corpo inteiro B; qui: descanso; sex: Corpo inteiro A; sáb: descanso; dom: descanso |
| Corpo inteiro A (45 a 60 min, 6 exercícios) | Leg press, pés na altura média: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Supino com halteres: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Puxada na frente, pegada aberta: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Ponte de glúteo com halter: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Elevação lateral com halteres: 2/2/3 × 12–15/12–15/10–15, desc. 60 s<br>Pallof press (core): 2/2/3 × 12–15/12–15/10–15 por lado, desc. 45 s |
| Corpo inteiro B (45 a 60 min, 6 exercícios) | Ponte de glúteo com halter: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Press de ombros sentado: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Remada unilateral ou remada baixa: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Afundo ou step-up: 2/2/3 × 12–15/12–15/10–15 por perna, desc. 60 s<br>Face pull na polia: 2/2/3 × 12–15/12–15/10–15, desc. 60 s<br>Pallof press (core): 2/2/3 × 12–15/12–15/10–15 por lado, desc. 45 s |
| RIR por semana (1 a 12) | conservador: 4/3/3/4/3/3/3/4/3/3/3/4 |
| Avisos | condicao |
| Dieta | não gera metas (motivo: seguranca); objetivo usado: saude; Dieta sem números: não |
| Sanidade | passou |
| Estranho? | ADR 012: plano leve (experiência usada "nunca", 3 treinos), RIR conservador, ponte com halter no lugar do hip thrust com barra e confirmação obrigatória da liberação médica (requiresClearance, não gravada). Sem metas de dieta. |

## Perfil 7: Lutador, recomp, intermediário, pediu 6 dias longos

**Entrada:** segurança: nenhum; objetivo recomp; experiência intermediario; 6 dias; duração longo; local academia; atividades fixas: luta ter+qui; sexo m, 26 anos, 178 cm, 80 kg, rotina muito, IMC 25,2

| Campo | Saída |
| --- | --- |
| Experiência usada | intermediario |
| Treinos na divisão / na rotina | 4 / 4 |
| Motivo do corte de dias | atividades |
| Duração usada | longo |
| Liberação médica obrigatória | não |
| Semana | seg: Superior A; ter: Jiu-jitsu; qua: Superior B; qui: Jiu-jitsu; sex: Pernas A; sáb: descanso; dom: Pernas B |
| Superior A (60 a 90 min, 7 exercícios) | Supino com halteres: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Puxada na frente, pegada aberta: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Press de ombros sentado: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Remada unilateral ou remada baixa: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Elevação lateral com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Rosca direta com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Tríceps na polia: 3/3/4 × 10–12/10–12/8–12, desc. 60 s |
| Pernas A (60 a 90 min, 7 exercícios) | Agachamento com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Hip thrust com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Agachamento búlgaro: 3/3/4 × 10–12/10–12/8–12 por perna, desc. 60 s<br>Stiff com barra ou halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Panturrilha em pé: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Pallof press (core): 3/3/4 × 10–12/10–12/8–12 por lado, desc. 45 s<br>Prancha: 3/3/4 × 20–30/30–40/30–45 s, desc. 45 s |
| Superior B (60 a 90 min, 7 exercícios) | Remada unilateral ou remada baixa: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Supino inclinado com halteres: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Puxada na frente, pegada aberta: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Elevação lateral com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Face pull na polia: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Tríceps na polia: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Rosca direta com halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s |
| Pernas B (60 a 90 min, 7 exercícios) | Hip thrust com barra: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Leg press, pés na altura média: 3/4/4 × 6–10/6–8/5–8, desc. 150 s<br>Agachamento búlgaro: 3/3/4 × 10–12/10–12/8–12 por perna, desc. 60 s<br>Stiff com barra ou halteres: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Panturrilha em pé: 3/3/4 × 10–12/10–12/8–12, desc. 60 s<br>Pallof press (core): 3/3/4 × 10–12/10–12/8–12 por lado, desc. 45 s<br>Prancha: 3/3/4 × 20–30/30–40/30–45 s, desc. 45 s |
| RIR por semana (1 a 12) | padrão do plano: 3/2–3/2/4/2/1–2/1–2/4/2/1–2/1–2/4 |
| Avisos | nenhum |
| Objetivo usado na dieta | recomp |
| Metas por tipo de dia (só os usados na rotina) | Perna: 2550 kcal, carbo 331 g<br>Academia: 2500 kcal, carbo 319 g<br>Jiu-jitsu: 2650 kcal, carbo 356 g<br>Descanso: 2350 kcal, carbo 281 g |
| Proteína / gordura / água | 160 g (2 g/kg do peso real) / 65 g / 3 L |
| Sanidade | passou |
| Estranho? | Pediu 6 dias; teto do intermediário (5) e as 2 lutas reduziram a 4 treinos (daysReason: atividades). ADR 012: Pernas B passa de sábado para domingo, para não ficar no dia seguinte a Pernas A. Jiu-jitsu tem a maior kcal da semana. |

## Perfil 8: Nunca treinou, perder, pediu 6 dias de 60 a 90 min

**Entrada:** segurança: nenhum; objetivo perder; experiência nunca; 6 dias; duração longo; local academia; atividades fixas: nenhuma; sexo f, 22 anos, 163 cm, 58 kg, rotina pouco, IMC 21,8

| Campo | Saída |
| --- | --- |
| Experiência usada | nunca |
| Treinos na divisão / na rotina | 3 / 3 |
| Motivo do corte de dias | teto |
| Duração usada | medio |
| Liberação médica obrigatória | não |
| Semana | seg: Corpo inteiro A; ter: descanso; qua: Corpo inteiro B; qui: descanso; sex: Corpo inteiro A; sáb: descanso; dom: descanso |
| Corpo inteiro A (45 a 60 min, 6 exercícios) | Leg press, pés na altura média: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Supino com halteres: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Puxada na frente, pegada aberta: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Hip thrust com barra: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Elevação lateral com halteres: 2/2/3 × 12–15/12–15/10–15, desc. 60 s<br>Pallof press (core): 2/2/3 × 12–15/12–15/10–15 por lado, desc. 45 s |
| Corpo inteiro B (45 a 60 min, 6 exercícios) | Hip thrust com barra: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Press de ombros sentado: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Remada unilateral ou remada baixa: 2/3/3 × 10–12/8–12/8–12, desc. 120 s<br>Afundo ou step-up: 2/2/3 × 12–15/12–15/10–15 por perna, desc. 60 s<br>Face pull na polia: 2/2/3 × 12–15/12–15/10–15, desc. 60 s<br>Pallof press (core): 2/2/3 × 12–15/12–15/10–15 por lado, desc. 45 s |
| RIR por semana (1 a 12) | iniciante: 3/3/3/4/2–3/2–3/2/4/2/2/2/4 |
| Avisos | duracao-reduzida |
| Objetivo usado na dieta | perder |
| Metas por tipo de dia (só os usados na rotina) | Academia: 1450 kcal, carbo 146 g<br>Descanso: 1400 kcal, carbo 134 g |
| Proteína / gordura / água | 115 g (1,98 g/kg do peso real) / 45 g / 2 L |
| Sanidade | passou |
| Estranho? | ADR 012: quem nunca treinou com 60 a 90 min recebe 45 a 60 min (6 exercícios) e aviso duracao-reduzida; o teto corta para 3 dias (daysReason: teto). kcal no piso de 1.400 em dia de descanso (mantido). |

## Perfil 9: Corredor(a), massa, iniciante, casa com equipamento, treino curto

**Entrada:** segurança: nenhum; objetivo massa; experiência iniciante; 4 dias; duração curto; local casa_equip; atividades fixas: corrida sáb+dom; sexo nao_informar, 44 anos, 171 cm, 70 kg, rotina moderado, IMC 23,9

| Campo | Saída |
| --- | --- |
| Experiência usada | iniciante |
| Treinos na divisão / na rotina | 4 / 4 |
| Motivo do corte de dias | nenhum |
| Duração usada | curto |
| Liberação médica obrigatória | não |
| Semana | seg: Superior A; ter: Pernas A; qua: descanso; qui: Pernas B; sex: Superior B; sáb: Corrida; dom: Corrida |
| Superior A (30 a 45 min, 4 exercícios) | Supino no chão com halteres: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Puxada com elástico: 3/3/4 × 10–15/10–15/12–15, desc. 90 s<br>Press de ombros sentado: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Remada unilateral ou remada baixa: 3/3/4 × 8–12/8–10/6–10, desc. 120 s |
| Pernas A (30 a 45 min, 4 exercícios) | Agachamento goblet com halter: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Ponte de glúteo com halter: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Agachamento búlgaro: 2/3/3 × 12–15/10–15/10–12 por perna, desc. 60 s<br>Stiff com barra ou halteres: 2/3/3 × 12–15/10–15/10–12, desc. 60 s |
| Superior B (30 a 45 min, 4 exercícios) | Remada unilateral ou remada baixa: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Supino no chão com halteres: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Elevação lateral com halteres: 2/3/3 × 12–15/10–15/10–12, desc. 60 s<br>Face pull com elástico: 2/3/3 × 12–15/12–15/15–20, desc. 60 s |
| Pernas B (30 a 45 min, 4 exercícios) | Ponte de glúteo com halter: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Agachamento goblet com halter: 3/3/4 × 8–12/8–10/6–10, desc. 120 s<br>Agachamento búlgaro: 2/3/3 × 12–15/10–15/10–12 por perna, desc. 60 s<br>Stiff com barra ou halteres: 2/3/3 × 12–15/10–15/10–12, desc. 60 s |
| RIR por semana (1 a 12) | iniciante: 3/3/3/4/2–3/2–3/2/4/2/2/2/4 |
| Avisos | nenhum |
| Objetivo usado na dieta | massa |
| Metas por tipo de dia (só os usados na rotina) | Perna: 2400 kcal, carbo 351 g<br>Academia: 2300 kcal, carbo 326 g<br>Descanso: 2100 kcal, carbo 276 g<br>Esporte: 2450 kcal, carbo 364 g |
| Proteína / gordura / água | 125 g (1,79 g/kg do peso real) / 55 g / 2,5 L |
| Sanidade | passou |
| Estranho? | Corrida entra como "esporte" (+300 kcal, mantido). ADR 012: Pernas B passa de sexta (véspera da corrida) para quinta e Superior B para sexta. Pernas A e B com os mesmos 4 exercícios em outra ordem: limite do catálogo (mantido). |

## Perfil 10: Semana cheia (luta + corrida em 6 dias), sem peso e altura

**Entrada:** segurança: nenhum; objetivo recomp; experiência intermediario; 5 dias; duração longo; local casa_livre; atividades fixas: luta seg+qua+sex, corrida ter+qui+sáb; sexo f, 38 anos, altura -, peso -, rotina -

| Campo | Saída |
| --- | --- |
| Experiência usada | intermediario |
| Treinos na divisão / na rotina | 2 / 0 |
| Motivo do corte de dias | nenhum |
| Duração usada | curto |
| Liberação médica obrigatória | não |
| Semana | seg: Jiu-jitsu; ter: Corrida; qua: Jiu-jitsu; qui: Corrida; sex: Jiu-jitsu; sáb: Corrida; dom: descanso |
| Corpo inteiro A (30 a 45 min, 4 exercícios) | Agachamento livre com peso do corpo: 3/4/4 × 12–20/12–20/15–25, desc. 90 s<br>Flexão de braço: 3/4/4 × 5–12/8–15/10–20, desc. 90 s<br>Remada curvada com mochila: 3/4/4 × 10–15/10–15/8–12, desc. 90 s<br>Ponte de glúteo com uma perna: 3/4/4 × 8–12/10–15/12–15 por lado, desc. 90 s |
| Corpo inteiro B (30 a 45 min, 4 exercícios) | Ponte de glúteo com uma perna: 3/4/4 × 8–12/10–15/12–15 por lado, desc. 90 s<br>Flexão de braço: 3/4/4 × 5–12/8–15/10–20, desc. 90 s<br>Remada curvada com mochila: 3/4/4 × 10–15/10–15/8–12, desc. 90 s<br>Afundo com peso do corpo: 3/3/4 × 8–12/10–15/12–15 por perna, desc. 60 s |
| RIR por semana (1 a 12) | padrão do plano: 3/2–3/2/4/2/1–2/1–2/4/2/1–2/1–2/4 |
| Avisos | sem-dados, semana-cheia |
| Dieta | não gera metas (motivo: sem-dados); objetivo usado: recomp; Dieta sem números: não |
| Sanidade | passou |
| Estranho? | Semana cheia: 2 treinos curtos fora da rotina, duração "longo" ignorada (decisão do dono). Sem metas de dieta por falta de altura e peso. ADR 012: remada com mochila mantém a faixa do catálogo (10–15/10–15/8–12) e os principais sem carga têm 90 s. |

