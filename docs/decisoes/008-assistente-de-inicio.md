# ADR 008: Assistente de início para iniciante

Data: 19/11/2026. Responsável: agente `conteudo-treino-nutricao`.
Status: ADOTADA na parte de dados e regras (19/11/2026, decisões do dono abaixo); a tela ainda será feita. Especificação completa: [conteudo-assistente-inicio.md](../handoffs/conteudo-assistente-inicio.md).

## Contexto

O app é público, mas nasce com o plano de exemplo de uma pessoa experiente (musculação, jiu-jitsu e vôlei) e metas de dieta de exemplo. Um iniciante não tem como montar um ponto de partida adequado sozinho.

## Decisão

1. Um assistente opcional de 7 perguntas e 1 passo de segurança gera, por regras puras e determinísticas: divisão de treino, rotina da semana, exercícios, séries e repetições, e metas de dieta (ADR 007).
2. Divisão: Corpo inteiro para 2 e 3 dias (intermediário com 3 dias: Superior, Pernas, Corpo inteiro); Superior e Pernas para 4; mais um Corpo inteiro para 5. Teto de dias de musculação por experiência (3, 4, 5) e no máximo 6 dias ativos por semana. Motivo: recuperação de quem começa (a verificar). **Substituído pelo ADR 014 (25/11/2026):** sem teto por experiência; divisões novas para 5 e 6 dias.
3. Exercícios: reaproveita o catálogo de `data/plan.json` (para manter o histórico de carga) e acrescenta 17 exercícios para casa, todos com grupo muscular `g`. Ficam fora do iniciante os de técnica ou impacto maiores (nordic, saltos, roll-out, Copenhagen, medicine ball, pescoço).
4. Mantém 12 semanas, blocos, semana leve e o motor atual. Motivo: tudo no app depende disso e o prazo serve ao iniciante. Novo apenas: RIR mais conservador para iniciante (opcional, `plan.rir`).
5. Dieta: Mifflin-St Jeor, fator de rotina fora do treino, acréscimo por tipo de dia, ajuste pelo objetivo (−20%, −10%, 0, +10%), pisos na TMB e em 1.400 kcal, teto de 4.500 kcal, proteína de 1,6 a 2,0 g/kg com peso de referência quando o IMC passa de 30, gordura de pelo menos 40 g, carboidrato pelo restante, água de 2 a 4 L. Todos os números estão marcados "a verificar". Os limites de `dietTargets.ts` nunca são ultrapassados.
6. Segurança: com menos de 18 anos, gestação ou amamentação, condição de saúde ou transtorno alimentar, o assistente não calcula metas nem déficit e orienta procurar profissional. Sem idade, altura e peso, ficam as metas de exemplo. IMC abaixo de 18,5 impede déficit.
7. Quem já usa: nada é sobrescrito sem tela de revisão e confirmação; o estado anterior (plano, rotina, data de início, metas) é guardado para desfazer; registros não são tocados; metas novas valem a partir de hoje. O plano atual vira a opção "Usar o plano de exemplo".

## Motivo dos números novos

Os valores do plano de exemplo não mudam. Os novos números só valem para o plano gerado e buscam um começo seguro e simples: volume e esforço menores, déficit limitado por pisos, proteína alta coerente com o perfil de recomposição do app. Nenhum estudo foi conferido; as referências da seção 9 da especificação seguem "a verificar".

## Consequências

- Novas funções puras (`planFromAnswers`, `dietTargetsFromAnswers`) e testes com os 15 perfis da especificação.
- Campos novos opcionais: `settings.onboarding`, o instantâneo para desfazer, `g` nos exercícios, `plan.rir` (se aprovado), rótulo de esporte na rotina (se aprovado).
- Sexo e marcações de saúde são dados sensíveis: ficam só no aparelho; recomenda-se guardar só o resultado do passo de segurança.

## Pendências do dono

1. Aprovar ou mandar revisar com nutricionista os números "a verificar".
2. Menores de 18: treino leve sem dieta (proposto) ou bloquear o assistente.
3. Esporte e corrida: reaproveitar o dia de vôlei com rótulo "Esporte" ou criar um tipo novo.
4. Semana com 6 ou 7 dias de atividade fixa: aceitar musculação no mesmo dia (proposto) ou não.
5. Adotar `plan.rir` para iniciante.
6. Esconder metas numéricas da Dieta em caso de transtorno alimentar.

## Decisões do dono (19/11/2026) e como foram implementadas (agente `backend_dados`)

1. Números "a verificar": usados como estão; a interface mostra o aviso fixo.
2. Menores de 18 (marcado ou idade informada abaixo de 18): treino leve (regras de quem "nunca treinou", RIR de iniciante), sem metas de dieta, com aviso.
3. Esporte e corrida: novo tipo de dia `esporte` na rotina (`{ k: 'esporte', label }`, rótulo escolhido pela pessoa; corrida = "Corrida"). Metas: mesmo acréscimo do vôlei (300 kcal); sem meta própria salva, usa a do vôlei. Estados e backups antigos continuam válidos sem conversão.
4. Privacidade: sexo e marcações do passo 0 não são gravados em lugar nenhum (estado, backup, recuperação). Só o resultado: `settings.onboarding.dietTargetsDisabled` e `hideDietNumbers`. A validação de importação recusa esses campos.
5. Assumidas: `plan.rir` opcional (12 textos) para nunca/iniciante; transtorno alimentar esconde as metas numéricas (`hideDietNumbers`); semana com 6 ou 7 dias de atividade fixa: 2 treinos curtos criados, mas nenhum colocado na rotina (sem musculação no mesmo dia).

Detalhes, API e pendências: [dados-assistente-inicio.md](../handoffs/dados-assistente-inicio.md).
