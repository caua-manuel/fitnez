# Revisão de conteúdo: regras de treino em src/domain (Entrega A)

Escopo: calendar.ts, workout.ts, muscleGroups.ts, dayActivity.ts contra ESPECIFICACAO seção 3 e data/plan.json. Somente leitura em src/ e data/.

## 1. Deload (workout.ts:15-23)
Leitura literal da especificação: n e repetições vêm da coluna do bloco anterior (semana 3 não tem anterior, usa B1).
Supino s [4,5,5], r ['5–8','4–6','3–5']:
- Semana 3: 2 séries, '5–8' (código e especificação concordam).
- Semana 7: especificação literal = ceil(4/2) = 2 séries, '5–8'. Código atual = ceil(5/2) = 3 séries, '5–8'. DIVERGE.
- Semana 11: 3 séries, '4–6' (código e especificação concordam).
Só diverge na semana 7 (e em exercícios cuja série muda de B1 para B2, ex.: rosca_a [2,3,2] daria 1 contra 2).
O legado (legacy/index.html:452) usa n do bloco corrente e não usa coluna anterior para repetições; a especificação mistura as duas coisas.
Decisão necessária (mudança de regra, exige registro em docs/decisoes/): (a) corrigir o código para o literal, sCol = rCol = max(0, block-2) no deload; ou (b) manter o código (metade das séries realmente feitas no bloco, repetições da coluna anterior) e emendar a especificação seção 3. Recomendação: (b), pois corta a metade do volume que foi de fato treinado, e o plano de implementação já assume semana 7 = 3 séries. Não aplicar sem confirmação do dono do produto.

## 2. Grupos musculares (muscleGroups.ts)
Os 38 ids de plan.json estão no mapa. A soma das séries por grupo só bate com a tabela-alvo (seção 8 item 1) se estes ficarem sem grupo (null):
salto_l, salto_b (potência), farmer, pescoco, copen_l, copen_b.
Conferência: peito 9/12/10 ok; costas 12/14/12 ok; ombro-lateral 6/8/6 ok; ombro-posterior 6/6/5 (face + inverso) ok; press 6/6/5 (press_a + press_b) ok; bíceps e tríceps 5/7/5 ok; quadríceps 7/8/7 = agach + bulg (sem saltos); posterior-glúteos 8/10/8 = stiff + nordic + hip_l; panturrilha 3/4/3 = pant_pe; core 9/10/9 = pallof + joelhos + roll.
Hoje o código soma farmer, pescoco, copen e saltos e estoura: core 15/16/15 (alvo 9/10/9), quadríceps 17/20/20 com saltos (alvo 7/8/7).
Correções: remover salto_l e salto_b da linha 17; remover farmer, pescoco, copen_l e copen_b da linha 20.
Mantidos: press_a e press_b = press; inverso = ombro-posterior; joelhos e roll = core; med = core (só no Lower B opcional, que soma acima da meta quando feito; aceitável, avisar na UI). leg, afundo = quadríceps; hip_b, mesa = posterior-glúteos; pant_sent = panturrilha (também só Lower B).

## 3. WEEK_NOTES (calendar.ts:3)
Chaves 5, 6, 11 corretas (semanas 6, 7, 12). Com início 16/11/2026: semana 6 = 21-27/12 (Natal), semana 7 = 28/12-03/01 (Réveillon). Sem números inventados.
Ajustes: a nota 11 está incompleta; a especificação diz "testes de carga, medidas e fotos". Trocar por 'Semana de testes de carga, medidas e fotos.' O trecho "ajuste a rotina se precisar" nas notas 5 e 6 não está na especificação: é orientação inofensiva, mas manter só se aprovado; versão fiel: 'Semana do Natal.' e 'Semana do Réveillon.'. Aviso: as notas são presas ao índice da semana; se o usuário mudar a data de início, Natal e Réveillon deixam de coincidir com o calendário (ponto de produto, não de bug).

## 4. RIR e blocos (calendar.ts)
RIR = 3, 2–3, 2, 4, 2, 1–2, 1–2, 4, 2, 1–2, 1–2, 4: confere. Blocos floor(week/4)+1, deload week%4===3, idx>=84 concluído, pré-semana idx<0: conferem.

## Extra: dayActivity.ts:20
A especificação (seção 4) diz tipo "perna" quando o nome CONTÉM "Lower" ou "perna". O código só aceita nome começando por "lower". Correção: /lower|perna/i.
