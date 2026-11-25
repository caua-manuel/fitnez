# Conteúdo: o assistente respeita os dias pedidos

Data: 25/11/2026. Responsável: agente `conteudo-treino-nutricao`. ADR: [014-dias-pedidos-sem-teto.md](../decisoes/014-dias-pedidos-sem-teto.md).
Arquivos: `src/domain/onboarding.ts`, `tests/unit/onboarding-dias-pedidos.test.ts` (novo), `tests/unit/onboarding.test.ts`, `tests/unit/onboarding-adr012.test.ts`, `tests/unit/assistente-perfis.test.ts`, `docs/handoffs/conteudo-assistente-inicio.md` (2.1 a 2.3 e 3.1).

Todos os números: a verificar.

## 1. Motivo da mudança de números
Decisão do dono, depois da reclamação de amigos (pediam 5 ou 6 dias e recebiam 4 treinos Superior/Pernas): respeitar o número de treinos pedido e fazer o melhor treino possível em cada dia. O teto por experiência (`nunca` 3, `iniciante` 4, `intermediario` 5) saiu. Ficam as travas de segurança e as físicas: transtorno alimentar (no máximo 4), atividades fixas (no máximo 6 dias ativos, musculação nunca no mesmo dia da atividade fixa), semana cheia, gestação e menos de 14 anos.

## 2. Tabela final de divisões
Dias da semana: 0 = segunda. Sem atividades fixas, a rotina fica assim (as trocas por atividade fixa seguem o ADR 012).

| Dias | Quem nunca treinou | Iniciante | Intermediário | Dias da semana |
| --- | --- | --- | --- | --- |
| 2 | Corpo inteiro A, B | igual | igual | seg, qui |
| 3 | Corpo inteiro A, B, A | igual | Superior A, Pernas A, Corpo inteiro B | seg, qua, sex |
| 4 | Superior A, Pernas A, Superior B, Pernas B (novo para "nunca") | igual | igual | seg, ter, qui, sex |
| 5 | Superior, Pernas A, Empurrar, Puxar, Pernas B (novo) | igual | igual (antes: Sup A, Pernas A, Sup B, Pernas B, Corpo inteiro A) | seg, ter, qua, sex, sáb |
| 6 | Empurrar, Puxar, Pernas A, Empurrar, Puxar, Pernas B (novo) | igual, com principais [2, 3, 3] | igual | seg a sáb |

"Superior" é o Superior B (para quem nunca treinou e para o iniciante, sem a puxada vertical, conforme o ADR 010) renomeado, porque a divisão de 5 dias não tem Superior A.

Treinos novos (vagas em ordem de prioridade; o tempo escolhido define quantas entram: 4, 6 ou 7):
- **Empurrar** (`EMP`, "Peito, ombros e tríceps"): empurrar horizontal, empurrar inclinado, empurrar vertical, ombro lateral, tríceps, ombro posterior, core. Academia com 45 a 60 min: supino, inclinado, press, elevação lateral, tríceps, face pull.
- **Puxar** (`PUX`, "Costas, ombros, bíceps e abdômen"): puxar vertical, puxar horizontal, ombro posterior, bíceps, ombro lateral, core 2, core. Academia com 45 a 60 min: puxada, remada, face pull, rosca, elevação lateral, prancha.

O ombro posterior entra antes do core no Empurrar para o abdômen não aparecer em todos os 6 dias (fica em Puxar e Pernas: 4 dias).

## 3. Por que essas divisões
- **6 dias: Empurrar/Puxar/Pernas 2 vezes**, em vez de Superior/Pernas 3 vezes. Os dois dão cada grupo pelo menos 2 vezes por semana, que é a frequência que a seção 4.2 cita (a verificar). Com volume semanal igual, a frequência acima de 2 vezes parece pesar pouco no ganho de músculo (revisões de Schoenfeld e colegas sobre frequência, 2016 e 2019, a verificar). Por isso o critério de desempate foi a recuperação das pernas: Empurrar/Puxar/Pernas tem 2 dias de pernas (qua e sáb) contra 3, e não repete o mesmo treino três vezes.
- **5 dias: Superior + Pernas + Empurrar + Puxar + Pernas.** O antigo Superior/Pernas + Corpo inteiro A dava 3 dias com pernas e passava da faixa para iniciante (costas 12, quadríceps 13, posterior 13 contra o máximo de 10) e para quem nunca treinou (quadríceps e posterior 10 contra 8). A divisão nova dá 2 dias de pernas e cabe na faixa das três experiências sem mexer nas séries.
- **4 dias para quem nunca treinou: Superior/Pernas.** Corpo inteiro 4 vezes poria pernas em dias seguidos (em 7 dias cabem no máximo 3 dias de pernas sem dois seguidos).
- **Quem nunca treinou com 5 ou 6 dias.** Não corta dias e faz o treino mais leve: 2 séries por exercício no bloco 1, RIR de iniciante (ou conservador), no máximo 45 a 60 min e 6 exercícios. Com 6 dias, cerca de 12 séries por treino, com cada grupo 2 vezes por semana. O volume semanal fica igual ao de 4 dias de quem já treina um pouco, só mais espalhado.

## 4. Volume semanal no bloco 1 (academia, peito / costas / quadríceps / posterior e glúteos)
Faixas da seção 4.2 e do ADR 010: nunca 4 a 8, iniciante 6 a 10, intermediário 8 a 16.

| Dias | Nunca | Iniciante | Intermediário |
| --- | --- | --- | --- |
| 4 | 4 / 6 / 8 / 8 | 6 / 9 / 10 / 10 (igual) | 6 / 12 / 12 / 12 (igual) |
| 5 | 6 / 6 / 8 / 8 | 9 / 9 / 10 / 10 | 9 / 12 / 12 / 12 (antes 9 / 15 / 15 / 15) |
| 6 | 8 / 8 / 8 / 8 | 8 / 8 / 8 / 8 (com [2, 3, 3]; sem isso daria 12 / 12 / 10 / 10) | 12 / 12 / 12 / 12 |

Curto, médio e longo dão os mesmos números para esses grupos (as vagas extras do longo são de braço, ombro e abdômen). Em casa os números caem, porque as IDs repetidas são puladas (limite do catálogo já conhecido; em casa sem equipamento, o Puxar fica com 4 exercícios).

Pendências que já existiam e não mudaram aqui (para uma próxima revisão, não tratei agora): intermediário com 3 dias tem peito 3 e com 4 dias tem peito 6 (mínimo 8); iniciante com 2 dias tem quadríceps 5 (mínimo para 2 dias: 6).

## 5. Exemplos para os testes (entrada → saída)
- `{ experience: 'nunca', daysPerWeek: 6 }` → `gymDays` 6, `daysReason` null, rotina Empurrar, Puxar, Pernas A, Empurrar, Puxar, Pernas B, descanso.
- `{ experience: 'iniciante', daysPerWeek: 6 }` → `plan.ex.supino.s` = [2, 3, 3]; com 5 dias, [3, 3, 4].
- `{ experience: 'intermediario', daysPerWeek: 5 }` → `plan.order` = SUPB, PERA, EMP, PUX, PERB; `sess.SUPB.name` = "Superior".
- `{ safety: ['transtorno'], daysPerWeek: 6 }` → `gymDays` 4, `daysReason` 'teto'.
- `{ experience: 'nunca', daysPerWeek: 6, activities: [luta na terça] }` → `gymDays` 5, `daysReason` 'atividades'.
- `{ safety: ['condicao'], experience: 'intermediario', daysPerWeek: 6 }` → 6 treinos de "nunca", sem `hip_b`, liberação médica obrigatória.

## 6. Texto da interface (para o `frontend`; não editei `src/features/**`)
`daysReason: 'teto'` agora só aparece com transtorno alimentar. O texto atual termina com "Depois de algumas semanas, você pode acrescentar treinos em Treinos.", e isso não deve ser sugerido nesse caso (excesso de exercício é um sinal comum nesses quadros, a verificar). Texto proposto, em `src/features/assistente/Assistente.tsx`, linha do `daysReason === 'teto'`:

> Você pediu {pedido} dias. O app montou {n} treinos por semana, para sobrar tempo de descanso. Se quiser mudar, converse antes com quem acompanha você.

O texto de `atividades` continua igual. Quem mostra os nomes dos treinos na tela precisa aceitar "Empurrar", "Puxar" e "Superior" (sem letra).

## 7. Aviso
O app não substitui nutricionista, médico ou profissional de educação física. Dor que não passa, tontura, falta de ar ou qualquer condição de saúde: pare e procure um profissional.
