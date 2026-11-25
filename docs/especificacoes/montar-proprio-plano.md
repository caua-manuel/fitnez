# Especificação: "Eu mesmo monto" (plano manual guiado)

Data: 25/11/2026. Só especificação, nada implementado. Textos de aviso: finais, mas **provisórios até revisão profissional**. Hoje já existem treino livre, criar e editar treino, biblioteca e rotina da semana; a novidade é o caminho guiado no assistente.

## 1. Fluxo em telas
Primeira tela do assistente: três opções, "Montar meu plano", "Plano de exemplo" e **"Eu mesmo monto"**.
1. **Segurança** (seção 2): as mesmas telas do assistente.
2. **Seu nível e seu tempo:** experiência (nunca, iniciante, intermediário) e tempo por treino (curto, médio, longo). Servem para a faixa de volume e para o aviso de sessão longa; não geram exercícios.
3. **Dias por semana:** 2 a 6 (respeita o teto da seção 2).
4. **Nome e tipo de cada dia:** nome livre (até 24 caracteres) e tipo: corpo inteiro, superior, pernas, empurrar, puxar ou outro. Sugere os nomes do assistente (Corpo inteiro A etc.).
5. **Exercícios do dia:** lista com busca por nome e filtro por grupo muscular, reaproveitando `Biblioteca.tsx` e o seletor de `EditarTreino.tsx`. Mínimo 1, máximo 10 por dia.
6. **Séries e repetições:** sugeridas por padrão a partir de `VOLUME` e `setsPattern` (tabela da experiência e papel: principal, acessório ou core), editáveis por exercício com os limites de `EditarExercicio.tsx`. Descanso e RIR vêm do mesmo padrão.
7. **Ordem:** botões "subir" e "descer" em cada exercício (obrigatórios, acessíveis por teclado) e arrastar como atalho.
8. **Revisão final:** lista por dia, quadro de volume semanal (seção 3), avisos e botão "Aplicar plano". A rotina da semana usa a distribuição automática do assistente e fica editável depois.
Cada tela tem "Voltar"; o rascunho fica só em memória até aplicar.

## 2. Segurança (vem antes e vale para todos)
- O questionário (menor de 18, gestação, amamentação, transtorno alimentar, condição de saúde, peso e altura para o IMC) roda **antes** de qualquer escolha, também para "Eu mesmo monto".
- Quem `planBlockedReason` bloqueia (gestação, menor de 14) vê só a orientação do assistente. "Eu mesmo monto" não abre, não há link para treino livre dentro do fluxo e nenhum caminho do fluxo contorna o bloqueio.
- Quem não é bloqueado mas tem sinal (menor de 18, amamentação, condição, transtorno, IMC baixo) vê os mesmos avisos do assistente, na mesma ordem (`WARNING_ORDER`), e o plano manual usa os mesmos limites efetivos: `effectiveExperience` define a faixa de volume e `TRANSTORNO_MAX_DAYS` (4) o máximo de dias; transtorno alimentar não escolhe tempo longo.
- As respostas de segurança são as mesmas que o assistente guarda; nada novo é gravado.
- Nenhum texto de saúde novo nesta spec: os avisos de segurança reaproveitam os do domínio.

## 3. Feedback de volume ao vivo (nunca bloqueia)
Quadro por grupo muscular (sem core): séries semanais contra a faixa de `GROUP_RANGES` da experiência efetiva (`plannedSetsByGroup`). **Verde** dentro da faixa; **amarelo** abaixo ou acima; **cinza** ausente. A cor sempre vem com texto (acessibilidade). Todo aviso é só um aviso, nunca um bloqueio, e diz o que fazer. `{G}` = nome do grupo; `{n}`, `{min}`, `{max}` = séries.
- **Grupo ausente:** "{G} ainda não aparece na semana. Se quiser treinar esse grupo, adicione um exercício de {G} em qualquer dia."
- **Abaixo do mínimo:** "{G}: {n} séries na semana, abaixo das {min} a {max} indicadas para você. Para chegar lá, some {min-n} séries nesse grupo."
- **Acima do máximo:** "{G}: {n} séries na semana, acima das {min} a {max} indicadas. Tire {n-max} séries para recuperar melhor."
- **Mesmo grupo em dias seguidos:** "{G} aparece em {dia1} e {dia2}, dias seguidos. Se puder, deixe um dia livre entre os dois ou mude um deles de dia."
- **Composto depois de isolador:** "No treino {nome}, {isolador} vem antes de {composto}. Comece pelo exercício que usa mais músculos: mova {composto} para antes."
- **Sessão muito longa:** "O treino {nome} deve levar cerca de {n} min, mais que os {t} min que você escolheu. Tire um exercício ou algumas séries."
- **Exercício repetido no dia:** "{exercício} aparece mais de uma vez no treino {nome}. Troque um deles por outro do mesmo grupo ou remova um."

Sessão longa: `estimateMinutes` do motor contra o máximo do tempo escolhido (`DURATION_MAX_MIN`). Dias seguidos: só entre treinos da rotina distribuída; domingo e segunda contam como seguidos.

## 4. Metas de dieta
Continuam vindo das perguntas do assistente (`buildDietTargetsFromAnswers`). O plano manual não altera nenhuma regra de dieta nem as metas já salvas; se a pessoa pular as perguntas de corpo e objetivo, as metas atuais ficam como estão.

## 5. Dados
- Mesmo formato guardado (`Plan`, `sess`, `order`, `sched`), **sem migração** e sem campo novo em `StoredAnswers`. Aplicar usa `mergeGeneratedPlan`, como o assistente.
- **Desfazer ao aplicar**, como na importação de plano (`src/features/assistente/undo.ts`): restaura o plano e a rotina anteriores.
- Quem tem registros não perde nada: ids de exercício e de treino existentes não são reaproveitados com outro sentido; treinos antigos fora do novo plano continuam no histórico.

## 6. Casos de borda e testes de unidade (para o Codex escrever)
1. Quadro de volume: grupo ausente, no mínimo, no máximo, abaixo e acima, nas três experiências efetivas.
2. Menor de 18, amamentação e condição usam a faixa de "nunca"; transtorno limita a 4 dias e tira o tempo longo.
3. Gestação e menor de 14: o fluxo manual não abre (nenhuma tela além da orientação).
4. Dia vazio: não aplica; mostra "Escolha ao menos um exercício em {nome}".
5. Mesmo exercício duas vezes no dia: aviso, e aplicar continua permitido.
6. Dias seguidos com domingo e segunda; 6 dias; 2 dias nunca geram aviso de dias seguidos.
7. Composto depois de isolador; core fica por último (`orderClass`).
8. Sessão longa: 10 exercícios no tempo curto avisa; 5 exercícios no longo não.
9. Séries e repetições fora dos limites são corrigidas ou recusadas como no editor atual.
10. Aplicar e desfazer devolvem plano, rotina e metas idênticos aos de antes; histórico intacto.
11. Reordenar por botões e por arrastar dá a mesma lista; voltar e avançar não perdem o rascunho.
12. Nome de dia vazio, repetido ou com mais de 24 caracteres; busca de exercício sem resultado.

## 7. Tarefas (máximo 6)
1. **LIBERADA PARA O CODEX:** módulo puro `src/domain/manualPlan.ts` com o estado do rascunho (dias, tipos, exercícios, séries e repetições padrão de `VOLUME`, ordem), validações e conversão para `GeneratedPlan`. Testes 4, 9, 11 e 12.
2. **LIBERADA PARA O CODEX:** terceira opção na primeira tela e telas 2 a 4 (nível e tempo, dias, nome e tipo), reaproveitando os componentes do assistente; 390x844 nos dois temas.
3. **LIBERADA PARA O CODEX:** telas 5 a 7 (exercícios por busca e grupo, séries e repetições, ordem por botões e arrastar), reaproveitando `Biblioteca.tsx`, `EditarTreino.tsx` e `EditarExercicio.tsx`.
4. **LIBERADA PARA O CODEX:** função pura de feedback de volume (cores, detecção dos 7 avisos com os textos EXATOS da seção 3) e tela de revisão com aplicar e desfazer. Testes 1, 5 a 8 e 10.
5. **BLOQUEADA PARA O CODEX: o dono revisa quando voltar ao Claude.** Ligação do fluxo à segurança: bloqueios, avisos, tetos e faixa efetiva (seção 2; testes 2 e 3).
6. **BLOQUEADA PARA O CODEX: o dono revisa quando voltar ao Claude.** Revisão profissional dos textos de aviso e das faixas aplicadas ao plano manual.

Ordem: 1, 2, 3, 4. As tarefas 5 e 6 ficam para o Claude. Sem a 5, a opção "Eu mesmo monto" **não pode ficar visível no app publicado**.
