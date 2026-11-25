# 015. Gerador do assistente v2: objetivo, prioridade, dores, tempo

Data: 25/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: proposta de conteúdo, o dono aprovou refazer o gerador; os números abaixo aguardam confirmação. Detalhes e exemplos: `docs/handoffs/conteudo-volume-assistente-v2.md`.

Todos os números: a verificar (escolhas de produto, nenhum estudo conferido).

## Decisões
1. Dois exercícios novos no catálogo: `rosca_elastico` (bíceps) e `lat_elastico` (ombro lateral), em `data/plan.json` e `data/exercise-guide.json`. Plano padrão intacto.
2. Dor por região (ombro, joelho, lombar, punho ou cotovelo, quadril): listas de exercícios a evitar e troca na própria vaga; sem troca segura, a vaga é pulada.
3. O objetivo passa a definir a posição do volume na faixa de séries semanais por grupo: saúde 0, perder 0,33, recomposição 0,5, massa 1.
4. Prioridade muscular soma 2 (nunca), 3 (iniciante) ou 4 (intermediário) séries semanais, podendo passar do máximo da faixa em 0, 1 e 2 séries; sem excesso em déficit (perder).
5. "Treinou nos últimos 3 meses?": quem diz não e marcou intermediário usa o volume, os exercícios e o RIR de iniciante.
6. Tempo: modelo de estimativa por sessão (aquecimento, execução, descanso, transição), calculado no pior bloco. Descanso do principal: 90 s no curto, 120 s no médio (antes 120 e 150). Os três textos prometidos não mudam.
7. Mínimo de 5 exercícios por sessão em tempo médio e longo; 4 no curto.

Motivos e contas: no handoff citado.

## Implementação (25/11/2026)
- Motor novo em `src/domain/planEngine.ts` (vagas com alternativas por local e equipamento, séries por exercício calculadas para cada grupo cair na faixa, tempo estimado com aquecimento e transição). `onboarding.ts` só monta o plano a partir dele. Dores em `src/domain/painRules.ts`.
- Respostas novas (`priority`, `pains`, `equipment`, `trainedRecently`) existem só em memória: `StoredAnswers` e o formato guardado não mudam; plano padrão intacto.
- Decisões tomadas com a recomendação do agente de conteúdo, a confirmar com o dono: perder na posição 0,33; excesso de prioridade 0/1/2 (sem excesso em perder); descanso dos principais com carga 90 s (curto) e 120 s (médio); "treinou nos últimos 3 meses?" só muda o intermediário; sem equipamento o grupo fica de fora com aviso (`sem_equipamento`).
- Encaixe no tempo: o volume sobe a partir do mínimo enquanto cabe; se nem o mínimo cabe, os acessórios (depois os principais) deixam de ganhar série nos blocos 2 e 3, e só então sai isolador.
- Limite do catálogo: em casa sem equipamento Pernas A/B (e Empurrar/Puxar de 6 dias) ficam parecidos; só mais exercícios de peso do corpo resolvem.

## Vitest e a letra do drive (causa raiz do erro de coleta)
`Cannot read properties of undefined (reading 'config')` aparecia só quando o terminal abria em `c:\Projeto-Treino` (letra minúscula): o Vitest carregava o módulo `vitest` duas vezes. Com `C:\Projeto-Treino` funciona no pool padrão; não é problema de pool, então `vitest.config.ts` não muda e o CI (Linux) não é afetado. Abra o terminal com a letra do drive maiúscula.
