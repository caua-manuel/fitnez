# 014. Assistente respeita os dias pedidos (sem teto por experiência)

Data: 25/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: decisão do dono; implementado em `src/domain/onboarding.ts`. Detalhes e tabela: `docs/handoffs/conteudo-dias-pedidos.md`.

Todos os números: a verificar (escolhas de produto, sem estudo conferido nesta passada).

## Contexto
Amigos do dono pediram 5 ou 6 dias e receberam 3 ou 4 treinos. A causa era o teto por experiência do ADR 008 (`nunca` 3, `iniciante` 4, `intermediario` 5) e a falta de divisão para 6 dias. Decisão do dono: "respeitar o número de treinos que a pessoa pedir, e fazer o melhor treino possível em cada dia".

## Decisão
1. Sai o teto por experiência (substitui o item 2 do ADR 008 nessa parte). Continuam: transtorno alimentar com no máximo 4 treinos (ADR 012, P3; único caso de `daysReason: 'teto'`), no máximo 6 dias ativos com atividades fixas (`'atividades'`), semana cheia, e os bloqueios de gestação e de menos de 14 anos.
2. 4 dias para quem nunca treinou: Superior/Pernas, igual ao iniciante (Corpo inteiro 4 vezes poria pernas em dias seguidos).
3. 5 dias, todas as experiências: Superior, Pernas A, Empurrar, Puxar, Pernas B (antes: Superior/Pernas + Corpo inteiro A, só intermediário). Motivo: cada grupo grande 2 a 3 vezes por semana com só 2 dias de pernas, o que facilita afastar pernas das atividades fixas; volume semanal dentro da faixa de cada experiência sem mexer nas séries.
4. 6 dias, todas as experiências: Empurrar, Puxar, Pernas A, Empurrar, Puxar, Pernas B. Motivo: cada grupo 2 vezes por semana, pernas com 2 dias de intervalo e domingo livre. Superior/Pernas 3 vezes repetiria os mesmos treinos e daria 3 dias de pernas.
5. Treinos novos `EMP` ("Empurrar") e `PUX` ("Puxar"), feitos com as vagas e exercícios que já existem. Nenhum exercício novo no catálogo.
6. Iniciante com 6 treinos: exercícios principais com [2, 3, 3] séries (antes [3, 3, 4]). Motivo: com [3, 3, 4], peito e costas teriam 12 séries no bloco 1, acima da faixa de 6 a 10.
7. Quem nunca treinou com 5 ou 6 dias não ganha corte de dias: mantém 2 séries por exercício no bloco 1, RIR de iniciante, sem treino longo e no máximo 6 exercícios por treino. Com 6 dias, cada treino tem cerca de 12 séries (o mais leve da tabela).

## Consequências
- `onboarding.ts`: sai `TETO`; entram `EMP`, `PUX`, `PREFERRED[6]`, `PRINCIPAL_SETS_6_DIAS` e o nome "Superior" para o Superior B na divisão de 5 dias.
- Condição de saúde, amamentação, menor de 18 e 60 anos ou mais seguem com a experiência "nunca", agora com os dias pedidos (a liberação médica continua obrigatória onde já era).
- O texto da tela para `daysReason: 'teto'` precisa deixar de sugerir mais treinos (só aparece com transtorno alimentar). Ver o handoff.
- `docs/revisao/assistente-10-perfis.md` fica desatualizado até ser gerado de novo (`GERAR_TABELA_PERFIS=1`).
