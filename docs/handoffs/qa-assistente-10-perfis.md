# QA: assistente de início com 10 perfis fictícios (Fase 1, item 6)

**Testado:** `tests/unit/assistente-perfis.test.ts` passa 10 perfis inventados por `buildOnboardingPreview`, `buildPlanFromAnswers` e `buildDietTargetsFromAnswers`, com o catálogo de `data/plan.json`. Os perfis cobrem: menor de 18, pessoa com 60 anos ou mais, os três sexos, IMC baixo e IMC alto querendo massa, os quatro objetivos, as três experiências, de 2 a 6 dias, os três locais, luta e corrida, gestação e condição de saúde. Também entram a semana cheia e um perfil sem altura nem peso.
Com `GERAR_TABELA_PERFIS=1`, o teste grava `docs/revisao/assistente-10-perfis.md` com a tabela de cada perfil e a coluna "Estranho?". Sem a variável, roda só as asserções.

**Sanidade:** nenhum NaN nem valor negativo, nenhuma sessão vazia, a rotina não aponta para treino inexistente, kcal entre 1200 e 4500, proteína entre 1,2 e 2,4 g/kg do peso real, e menor de 18 ou gestante sem meta calórica.
- Comportamento confirmado: menor de 18 e gestação recebem `kind: 'none'`, `reason: 'seguranca'`, e "perder" passa a "saude". A idade abaixo de 18 vale como `menor18` mesmo sem marcar o passo 0. Nesse caso o treino passa a ser o de "nunca treinou".

**Resultado:** 12 de 13 testes passam. **Falha no perfil 4** (IMC 35,9, objetivo massa): a proteína dá 125 g, ou seja 1,14 g/kg do peso real. Com IMC acima de 30, o código calcula pelo peso de referência (IMC 25), de propósito. O domínio não foi alterado. Decisão do conteudo-treino-nutricao: manter a regra e ajustar a sanidade para o peso de referência, ou mudar a regra.

**Risco que sobrou:**
- O teste vermelho quebra o `npm test` e o CI até essa decisão.
- Exercícios com `m: "rep"` (flexão, agachamento livre, ponte com uma perna, elásticos, dead bug) ficam com as repetições do catálogo, não com a tabela de volume.
- Gestação, condição de saúde e 60 anos ou mais não mudam o treino.
- A duração "longo" é mantida para quem nunca treinou.

**Extra:** `tests/unit/escala-como-terminou.test.ts`, 5 de 5 passam.
