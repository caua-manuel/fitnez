# Dados: assistente de início (ADR 008)

Data: 19/11/2026. Responsável: agente `backend_dados`. Contrato: [conteudo-assistente-inicio.md](conteudo-assistente-inicio.md).

## O que foi feito

- `src/domain/onboarding.ts` (puro): tipos e validação das respostas, segurança, divisão, rotina, exercícios por vaga/local/tempo, séries/repetições/descanso, RIR, metas de dieta, prévia, respostas que podem ser guardadas e validação estrita de `settings.onboarding`.
- `src/application/onboarding.ts`: prévia com o catálogo de fábrica, aplicar e desfazer em uma única gravação (`repository.save`).
- Tipo de dia `esporte`: `dayActivity.ts` (atividade, rótulo, `anyDayTypeOf`), `diet.ts` (padrão = vôlei), `dietTargets.ts` (`days.esporte` opcional), `evolution.ts` (constância conta `acts.esporte`), `calendar.ts` (`plan.rir` via `rirSequence`).
- `data/plan.json`: 17 exercícios novos no fim de `plan.ex` e `g` em 19 exercícios existentes usados pelo assistente. Nenhuma série, repetição, descanso ou treino do plano de exemplo mudou.
- `src/data/validation.ts` e `src/domain/limits.ts` (`sportLabel: 60`): rotina com `esporte` e `label`, `acts.esporte`, `plan.rir` (exatamente 12 textos), `settings.onboarding` estrito.
- Testes: `tests/unit/onboarding.test.ts` (15 perfis, divisões a–e, RIR, Esporte) e `tests/integration/onboarding.test.ts` (aplicar/desfazer, privacidade, backups antigos, Esporte). Dois testes antigos que fixavam 38 exercícios sem `g` foram atualizados para 55.

## Formato gravado (novo, tudo opcional)

- `settings.sched[i] = { k: 'esporte', label?: string }`.
- `catalog.plan.rir?: string[12]`.
- `settings.dietTargets.versions[].targets.days.esporte?` (ausente = usa `volei`).
- `settings.onboarding = { v: 1, appliedOn, answers: { goal, experience, daysPerWeek, duration, place, activities }, dietTargetsDisabled, hideDietNumbers, undoKey? }`. Nunca contém sexo, passo 0 nem dados físicos; a importação recusa campos fora dessa lista.
- `recovery['onboarding-undo:<ms>']` (estado anterior de plano, rotina, início, metas, perfil e marcações) e `recovery['before-onboarding-undo:<ms>']` (gravado ao desfazer).

## Pendências e observações

- A faixa de volume da seção 4.2 não se confirma em todos os perfis (séries semanais no bloco 1): perfil 4 costas 12 (> 10); perfil 11 costas, quadríceps e posterior 15 (> 14); perfil 12 peito 2 (< 4, tempo médio); perfil 15 peito 3 e demais 6 (< 8, tempo longo). Não foi testado nem ajustado; cabe ao `conteudo_treino_nutricao`.
- `recovery` só cresce (até 400 entradas no total, já usado por importações). Cada aplicar soma 1 e cada desfazer soma 1.
- Ao desfazer, se a data de início muda, `repository.save` marca `startConfirmed: true` (regra existente).
- `consistency` passa a contar dias de esporte: até a tela permitir marcar `acts.esporte`, eles aparecem como não feitos.
- O aviso "semana-cheia" da seção 10 fala em "montou 2 treinos curtos"; os treinos ficam fora da rotina. Sugiro o texto mencionar que podem ser feitos em Treinos.
