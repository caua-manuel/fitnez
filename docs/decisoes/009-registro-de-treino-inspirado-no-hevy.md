# ADR 009: Registro de treino inspirado no Hevy (aval do conteúdo)

Data: 19/11/2026. Responsável: agente `conteudo-treino-nutricao`.
Status: PROPOSTA (aguarda o dono; ver pendências). Especificação completa: [conteudo-aval-ondas-hevy.md](../handoffs/conteudo-aval-ondas-hevy.md) e [conteudo-instrucoes-exercicios.md](../handoffs/conteudo-instrucoes-exercicios.md).

## Contexto

A proposta de UX ([ux-inspiracao-hevy.md](../handoffs/ux-inspiracao-hevy.md)) traz recursos do Hevy em três ondas. Oito pontos mexem em regra de treino e precisavam do aval do conteúdo. O plano de exemplo, o motor de semanas (`setsForWeek`) e a dupla progressão (`suggestNext`) não mudam.

## Decisão

1. **Campo vazio:** placeholder, nunca valor gravado sozinho. Carga pela sugestão de `suggestNext`; repetições pelo "Antes" da mesma série, limitadas à faixa da semana; ao subir carga, repetições no piso da faixa. Semana leve não sobe carga. Na primeira vez, o ✓ com campo vazio pede a carga. O ✓ sem digitar grava o placeholder, com Desfazer. Motivo: a sugestão já aplica a regra da especificação, e o "Antes" é o que a pessoa conseguiu de fato.
2. **Recordes:** só três tipos: maior carga, 1RM estimado por Epley (a verificar) com 1 a 10 repetições, e mais repetições numa carga já usada. Volume não é recorde (varia com séries e com a semana leve). Ficam fora: aquecimento, exercícios sem carga, por tempo, `bw`, `kgs` e a primeira vez. Empate não conta; 1RM precisa subir pelo menos 0,5 kg.
3. **Séries por grupo na semana:** grupos grandes 4 a 8 / 6 a 10 / 8 a 16 (nunca, iniciante, intermediário, iguais ao assistente após a ADR 010); grupos menores 2 a 6 / 3 a 8 / 4 a 10 (a verificar). Sem rótulo "abaixo" com a semana em andamento nem na semana leve; core sem rótulo. Sem onboarding, usa intermediário.
4. **Trocar só hoje:** tabela por grupo, padrão de movimento e local; mantém as séries do original e usa as repetições, o descanso e a progressão do novo. Iniciante não vê os exercícios de técnica ou impacto maiores (mesma lista do assistente).
5. **Aquecimento:** série marcada `A` fica fora de volume, recordes, progressão, "Antes", séries por grupo e sequência. Sugestão só nos compostos com carga, só no 1º exercício de cada grupo no treino: 1 série (50% × 8) de 20 a 39,5 kg; 2 séries (50% × 8, 70% × 4) a partir de 40 kg; arredonda para 2,5 kg (a verificar).
6. **Sequência de semanas:** semana cumprida com pelo menos `max(1, meta − 1)` treinos do plano; semana leve com pelo menos 1. Uma semana perdida é perdoada se não houve outro perdão nas 3 anteriores. Aparece a partir de 2 semanas, sem mensagem ao quebrar.
7. **Instruções:** 55 exercícios (38 do exemplo e 17 do assistente), 2 a 3 frases e 1 erro comum, mais 2 frases fixas de segurança. Sem promessa de resultado.
8. **Anilhas:** barra 20 kg (15, 10 e "sem barra" configuráveis), anilhas por lado 25, 20, 15, 10, 5, 2,5 e 1,25 kg, sendo possível desmarcar as que faltam; guloso, com aviso e a carga mais próxima abaixo quando não fecha. Só em exercícios com barra.

## Motivo dos números novos

Nenhum número do plano ou da dieta muda. Os números novos (faixas por grupo, percentuais de aquecimento, limite de 10 repetições no 1RM, mínimo `meta − 1`, tolerância de 1 semana, anilhas) são escolhas de produto conservadoras, coerentes com o assistente (ADR 008), com o perfil de recomposição e com o tom sem cobrança do app. Nenhum estudo foi conferido; todos ficam "a verificar".

## Consequências

- Funções puras novas: `placeholderFor`, `personalRecords` e `recordForSet`, `weeklySetsByGroup` e `groupStatus`, `swapOptions` (constante `SWAP_GROUPS`), `warmupSets`, `weekStreak`, `platesPerSide`. Exemplos de teste na especificação.
- Campo novo: `SetEntry.kind?: 'warm'`. Configuração nova: barra e anilhas em Perfil. Arquivo de dados opcional para as instruções (`data/exercise-guide.json`).
- Teste de consistência pedido ao `backend-dados`: séries do plano de exemplo por grupo contra a faixa intermediária.

## Revisão de 19/11/2026 (divergências do `backend-dados`)

Detalhe e valores de teste em [conteudo-divergencias-ondas.md](../handoffs/conteudo-divergencias-ondas.md).

1. Aquecimento: vale a regra (múltiplo de 2,5 kg mais próximo). `goblet` 24 → 12,5 × 8; o "12 × 8" do contrato era erro de conta. Motivo: uma regra única é testável; casos de halter sem 12,5 a pessoa ajusta ao digitar.
2. Faixa intermediária de grupos grandes: 8 a 16 em todo o app, igual à ADR 010. Motivo: uma só faixa para assistente e tela de séries; duas faixas para o mesmo perfil confundiriam. Exemplo 4 passa a quadríceps 17 = `acima`.
3. Plano de exemplo abaixo da faixa (quadríceps 7, panturrilha 3 nos blocos 1 e 3): o plano não muda e a faixa não baixa. `groupStatus` usa piso `min(min da faixa, séries previstas pelo plano no grupo e semana)`. Motivo: o plano é de recomposição com volume moderado de pernas por escolha; rotular "abaixo" quem cumpriu o plano contradiz o tom sem cobrança. Alterar o plano exigiria decisão do dono.

## Pendências do dono

1. Aprovar as faixas por grupo e os percentuais de aquecimento, ou revisá-los com educador físico.
2. Confirmar o mínimo `meta − 1` e a tolerância de 1 semana na sequência.
3. Confirmar que volume fica fora dos recordes.
