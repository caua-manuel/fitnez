# 012. Revisão do assistente com 10 perfis e números do ADR 011

Data: 20/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: decidido no conteúdo; Decisão A implementada no domínio pelo `backend-dados` em 20/11/2026 (`docs/handoffs/dados-adr-012.md`); tela com o `frontend`. P1 a P3: adotadas pelo orquestrador, aguardam confirmação do dono (Decisão C).

Todos os números: a verificar (escolhas de produto conservadoras, sem estudo conferido).

## Contexto
O app passa a ser usado por amigos do dono, leigos e sem acompanhamento. O QA rodou o assistente (ADR 008) com 10 perfis fictícios (`docs/revisao/assistente-10-perfis.md`) e achou condutas inseguras e números incoerentes. O ADR 011 pede os números da demonstração, do resumo da semana e do aviso de estagnação.

## Decisão A: assistente (detalhes em `docs/handoffs/conteudo-revisao-10-perfis.md`)
1. Gestação: o assistente não gera plano (antes: plano igual ao de iniciante). Motivo: o treino muda por fase e precisa de acompanhamento; o app não consegue fazer isso.
2. Condição de saúde: experiência tratada como "nunca", RIR conservador (4, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4), sem hip thrust com barra e confirmação obrigatória de liberação médica, que não é gravada. Motivo: esforço longe da falha e liberação explícita são o mínimo seguro sem profissional.
3. 60 anos ou mais (novo limiar): experiência "nunca" (salvo intermediário), RIR conservador, trocas por exercícios estáveis (sentar e levantar, ponte com as duas pernas, sem stiff com uma perna nem flexão pike) e aviso. Motivo: risco de queda em exercícios de equilíbrio.
4. A troca de dia do treino de pernas também procura os treinos anteriores. Motivo: o app prometia evitar pernas na véspera da atividade e falhava quando o treino era o último da semana.
5. Descanso dos exercícios principais sem carga (`rep`, `s`, `remada_mochila`): 90 s (antes 120 ou 150). Repetições do catálogo mantidas, inclusive na remada com mochila (antes 6–10 / 5–8 no intermediário). Motivo: sem carga, a progressão é por repetição, e a carga da mochila é limitada.
6. "Por perna" e "por lado" passam para a observação quando a faixa é trocada. Motivo: "12–15" sem a unidade leva a fazer metade.
7. Experiência "nunca" com 60 a 90 min passa a ter 45 a 60 min (8 exercícios → 6), com aviso. Motivo: começo mais simples e menos desistência.
8. Treinos com pernas não ficam em dias seguidos quando há um dia livre que resolva. Motivo: recuperação.
9. Mantidos, com o motivo no handoff: proteína pelo peso de referência com IMC acima de 30 (a sanidade do QA passa a ser de 1,4 a 2,2 g/kg do peso de referência), piso de 1.400 kcal, +300 kcal para corrida, gordura mínima de 40 g.
10. O texto do UX que explica o limite de dias foi ajustado: separa o motivo (teto por experiência ou atividades fixas) e aponta para Treinos, não para Perfil.

## Decisão B: ADR 011 (detalhes em `docs/handoffs/conteudo-adr-011.md`)
1. Demonstração: perfil fictício de 30 anos, 178 cm e 77,0 → 76,3 kg em 4 semanas, com a cintura de 86,0 a 85,2 cm. Plano e metas de exemplo. 1 falta (sexta da semana 2) e 1 treino parcial (terça da semana 3). Progressão que reproduz a regra de `suggestNext`. Dieta registrada em 22 de 28 dias.
2. "Dia na meta": dia com pelo menos 1 refeição marcada, kcal dentro de ±10% da meta do dia e proteína ≥ 85% da meta. Dias sem registro ficam à parte. Motivo do 85%: o próprio cardápio do app no descanso dá de 86% a 90%.
3. Estagnação: só exercícios `kg` e `bw`; nunca nas semanas 1 e 2, na semana leve, depois da semana 12 ou antes da semana 5 para iniciante. Progresso: 1RM estimado ≥ +1%, ou +0,5 kg, ou +1 repetição com a mesma carga. Queda em 2 treinos seguidos (≤ −3%) sugere série reduzida; 3 a 4 treinos sem progresso sugerem ajustar as repetições (tabela de faixas, carga −10%); 5 ou mais sugerem trocar o exercício. Pausa de mais de 21 dias recomeça a contagem.

## Decisão C: pendências do dono adotadas provisoriamente
Adotadas pelo orquestrador com a recomendação do conteúdo; **aguardam confirmação do dono**. Cada uma é uma constante ou uma regra isolada em `src/domain/onboarding.ts`, fácil de desfazer.
1. P1, idade mínima: com idade informada abaixo de 14 anos, o assistente não gera plano nem metas (`planBlockedReason` = `'menor14'`, `MIN_PLAN_AGE = 14`). Texto da tela: pendente do conteúdo. Adotada pelo orquestrador, aguarda confirmação do dono.
2. P2, amamentação: separada da gravidez (marcação `amamentacao`) e tratada como condição de saúde: plano leve, RIR conservador, sem barra, liberação médica obrigatória e sem metas de dieta. A opção nova no passo 0 e o texto do aviso ficam com o `frontend` e o conteúdo; até lá, a opção atual "grávida ou amamentando" continua bloqueando (lado seguro). Adotada pelo orquestrador, aguarda confirmação do dono.
3. P3, transtorno alimentar: no máximo 4 treinos por semana (`TRANSTORNO_MAX_DAYS`) e sem duração longa (60 a 90 min vira 45 a 60 min, sem aviso próprio). Adotada pelo orquestrador, aguarda confirmação do dono.

## Consequências
- `onboarding.ts` ganha `planBlockedReason`, `requiresClearance`, `daysReason`, os avisos `idade60` e `duracao-reduzida`, `RIR_CONSERVADOR` e trocas por vaga; `data/plan.json` ganha `ponte` e `sentar_levantar` e muda a observação de `afundo_livre`.
- Os exemplos 2, 8, 14 e (d) da especificação do assistente mudam (lista no handoff).
- Novas funções puras: `stagnation` e a regra de "dia na meta" em `weekSummary`.
