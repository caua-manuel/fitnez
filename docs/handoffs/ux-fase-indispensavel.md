# UX — fase "indispensável" (assistente de início e proposta de produto)

Autor: ux_acessibilidade. Somente documento; nada em `src/` ou testes foi alterado.

## Limitação de verificação

Nesta sessão eu tinha apenas leitura e escrita de arquivos, sem terminal. Por isso **não rodei `npm run build` nem o preview, e não tirei capturas**: a pasta `capturas/` não foi criada. A auditoria (seção B) vem da leitura do código (`src/features/inicio/Inicio.tsx`, `perfil/DataInicioSheet.tsx`, `treino/Executar.tsx`, `domain/progression.ts`, `vite.config.ts`) e do `DESIGN.md`. Antes de implementar, alguém com terminal precisa capturar Início, Treino > Executar, Dieta, Evolução e Perfil em 360 e 390 px, nos temas claro e escuro, e confirmar os pontos B1 a B8.

As regras e perguntas do assistente (números, faixas, fórmulas) ficam com o conteúdo, em `docs/handoffs/conteudo-assistente-inicio.md`, que ainda não existia quando escrevi este documento. Aqui eu defino só a experiência. Os nomes dos passos são provisórios até esse documento sair.

---

## A. Assistente de início ("Montar meu plano")

### A1. Princípios
- Uma pergunta por tela, com resposta em toques (opções grandes) e o mínimo possível de digitação.
- Dá para terminar em menos de 90 segundos com uma mão. Todo passo opcional tem "Pular".
- Nada é gravado até a confirmação no resumo. O rascunho fica na memória da sessão e, se o app fechar, em `sessionStorage`, para retomar.
- Sempre existe uma saída sem pensar: "Usar o plano de exemplo".

### A2. Entradas
1. **Primeira abertura** (`startConfirmed` falso e nenhum histórico): o assistente **substitui** a folha `DataInicioSheet firstRun`. Ele abre em tela cheia (não como folha, para não parecer um aviso que dá para dispensar), sem a barra inferior. A data de início vira um dos passos.
2. **Perfil > Plano > "Refazer meu plano"**: abre o mesmo fluxo já preenchido com os valores atuais. Na confirmação, mostra um toast "Plano atualizado" com **Desfazer por 8 s**, que restaura o `catalog.plan`, as metas e o `settings.start` anteriores (um instantâneo tirado antes de gravar). O histórico nunca é apagado, e isso aparece escrito no resumo.
3. **Retomada**: se a pessoa saiu no meio, o Início mostra um cartão discreto: "Seu plano está pela metade. Continuar" / "Usar o exemplo".

### A3. Passos (provisórios, a confirmar com o conteúdo)

| # | Tela (título h1) | Tipo | Obrigatório |
|---|---|---|---|
| 0 | Boas-vindas: "Vamos montar seu plano" | 2 ações: **Começar** (principal) / Usar o plano de exemplo (secundário) | — |
| 1 | "Qual é seu objetivo principal?" | opções exclusivas (radio) | sim |
| 2 | "Quanto você já treinou musculação?" | opções exclusivas | sim |
| 3 | "Quantos dias por semana dá para treinar?" | segmentado 2 a 6 | sim |
| 4 | "Quais dias?" | 7 chips de dia, multiseleção limitada ao número do passo 3 | sim |
| 5 | "Pratica outro esporte?" | multiseleção (jiu-jitsu, vôlei, corrida, nenhum) + dia | opcional |
| 6 | "Onde você treina?" | academia completa / em casa / condomínio | sim |
| 7 | "Seus dados para a dieta" | peso, altura, idade, sexo para o cálculo (campos numéricos) | opcional (sem eles não há meta de calorias, só estrutura) |
| 8 | "Quando começa?" | "Nesta segunda (dd/mm)" / "Na próxima segunda (dd/mm)" / "Outra data" (campo date) | sim, com sugestão marcada |
| 9 | **"Seu plano"** (resumo) | revisão + Confirmar | — |

### A4. Anatomia de cada passo (360 px)

```
+----------------------------------+
| <  Voltar              Pular     |  44 px, Pular só se opcional
| ===-------------  Passo 3 de 8   |  barra fina em primary + texto
|                                  |
| Quantos dias por semana          |  h1 1,75rem 700
| dá para treinar?                 |
| Dá para mudar depois.            |  muted, 1 frase
|                                  |
| [ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]        |  alvos >= 48 px
|                                  |
|                                  |
| [        Continuar         ]     |  fixo no rodapé, zona do polegar
+----------------------------------+
```
- Progresso: `<div role="progressbar" aria-valuemin=1 aria-valuemax=N aria-valuenow=k aria-valuetext="Passo 3 de 8">` mais o texto visível. Sem bolinhas nem pílulas.
- "Continuar" fica desabilitado até haver resposta, com o motivo escrito embaixo ("Escolha uma opção"). Em escolha única, o toque **seleciona e não avança sozinho**: avançar sozinho atrapalha quem toca errado com a mão suada.
- Voltar: o botão no topo e o gesto/tecla Voltar do sistema voltam um passo, sem sair do fluxo. Cada passo vira uma entrada de histórico (`#/inicio/assistente/3`). No passo 0, Voltar sai do assistente, com uma confirmação se já houver respostas.
- Transição entre passos: deslizar 12 px mais opacidade, 200 ms (ADR 006). Com movimento reduzido, troca direta.

### A5. Resumo "Seu plano" (passo 9)
```
Seu plano
12 semanas · começa seg, 24/11

Semana tipo
Seg  Treino A · 55 min
Ter  Jiu-jitsu
Qua  Treino B · 50 min
...                       [Alterar]  -> volta ao passo 4

Dieta
2.350 kcal · 160 g proteína        [Alterar] -> passo 7
(ou: "Sem meta de calorias. Dá para definir em Dieta.")

Seus registros anteriores continuam guardados.   (só em Refazer)

[      Confirmar e começar      ]
  Usar o plano de exemplo
```
- Cada bloco tem um "Alterar" (link, 44 px) que vai direto ao passo e **volta ao resumo** ao continuar.
- Os números entram com `CountUp`, uma vez só.
- Ao confirmar: uma gravação transacional só (plano, metas, start, `startConfirmed`), depois o Início com o toast "Plano pronto. Bom treino." Se falhar: "Não foi possível salvar o plano. Suas respostas continuam aqui." e o botão "Tentar de novo", sem perder o rascunho.

### A6. "Usar o plano de exemplo"
Disponível no passo 0, no resumo e como link no rodapé de qualquer passo. Leva a uma tela de confirmação curta ("Plano de exemplo: 4 treinos, 12 semanas, começa seg dd/mm. Dá para refazer em Perfil.") com **Usar exemplo** / Voltar. Grava o mesmo que o fluxo atual de "Manter a segunda-feira sugerida".

### A7. Acessibilidade e teclado
- Um h1 por passo; o foco vai ao h1 a cada passo e é anunciado com "Passo 3 de 8, Quantos dias...".
- Escolha única: `fieldset` + `legend` (a pergunta) + `input type=radio` nativos estilizados como linhas de 56 px (setas navegam, Espaço seleciona). Multisseleção: checkboxes nativos. Nada de `div` clicável.
- Limite de dias (passo 4): quando atinge o limite, os demais chips **não** ficam desabilitados (desabilitado some do teclado). Ao tocar num a mais, aparece a mensagem `role="status"`: "Você escolheu 3 dias. Desmarque um para trocar."
- Campos numéricos: `inputMode="decimal"`, aceitam vírgula, unidade visível ("kg", "cm") fora do campo, erro com `aria-invalid` e `aria-describedby`.
- Enter = Continuar; Escape = Voltar (com confirmação no passo 0).
- Em 360 px: sem rolagem horizontal; o botão fixo respeita `env(safe-area-inset-bottom)` e o teclado virtual (usar `visualViewport` para não cobrir o campo). Zoom de 200%: o rodapé fixo vira estático.
- Contraste: a barra de progresso em `primary` sobre o trilho `secondary`, com texto ao lado (não depende de cor).

### A8. Estados
- Carregando: "Abrindo seus dados…". Erro ao gravar: ver A5. Retomada: ver A2.3. Quando a pessoa já tem histórico e chega pela primeira abertura (backup importado): pular o assistente e não mostrar nada.

---

## B. Auditoria das telas atuais (pela leitura do código; capturas pendentes)

**B1. Crítico — o Início pede decisões demais antes de mostrar o treino.** Em ordem: saudação, semana, faixa, segmentado Treino/Dieta, cartão, ação, "Registrar outro dia"/"Trocar treino", Terceira aula, dois atalhos (Dieta e Evolução, que **repetem a barra inferior**), instalar e lembrete de backup. A pergunta "o que eu faço agora" tem resposta, mas some no meio de nove blocos. O segmentado Treino/Dieta esconde metade do dia atrás de um toque.

**B2. Crítico — o cartão de hoje não diz carga nem progresso.** Ele mostra nome, minutos e número de exercícios. Já existe `suggestNext` (dupla progressão), mas a sugestão só aparece dentro de Executar. A informação mais útil (o que mudou desde a última vez, quanto pôr na barra) não está onde a pessoa olha primeiro.

**B3. Crítico — a primeira abertura começa com uma data, não com um plano.** `DataInicioSheet firstRun` pergunta a data de um plano que não é da pessoa (exemplo com jiu-jitsu e vôlei fixos). Quem não pratica esses esportes vê "Aula de jiu-jitsu" no Início. Três botões ("Salvar", "Manter a segunda-feira sugerida", "Decidir depois") para uma decisão que o iniciante não sabe tomar.

**B4. Importante — o pré-plano é verboso e confuso.** Aparecem juntos "Seu plano começa em N dias", "Primeiro treino do plano", a nota "O plano começa na segunda... Você pode começar agora ou treinar sem mexer na data" e dois botões ("Começar o plano hoje" / "Treinar agora (sem alterar o plano)"). São três frases sobre data antes de qualquer valor.

**B5. Importante — jargão no topo.** "Bloco 2 · RIR 2 (repetições em reserva) · Semana leve (deload)". Para iniciante, RIR é ruído no lugar de maior destaque. Sugestão: "Semana 5 de 12 · pare 2 repetições antes da falha", com RIR no detalhe do exercício.

**B6. Importante — o dia de descanso não tem vida.** Ele mostra "Descanso" e uma checklist do condomínio. Não traz o resumo da semana, o que vem amanhã nem a dieta. É exatamente o dia em que a pessoa abre o app com calma.

**B7. Importante — falta fechamento na Evolução.** (A confirmar na captura.) Os gráficos existem, mas não há uma frase que interprete ("Supino +5 kg em 4 semanas"). Gráfico sem conclusão não dá vontade de voltar.

**B8. Desejável — movimento usado como enfeite.** `useTilt` no cartão principal e `mv-par` na arte do hero parecem efeito de site, não de ferramenta, e no celular não fazem nada. O hero com foto só existe para UA e UB, então os cartões ficam com alturas diferentes entre os dias.

**B9. Desejável — o manifesto não tem `shortcuts`.** Não há atalho "Treino de hoje" ao pressionar o ícone.

---

## C. Proposta priorizada (impacto por esforço)

**1. "Hoje" que responde em 3 segundos — M**
- Problema: B1, B2.
- Solução: o primeiro cartão diz o treino, o primeiro exercício com a carga sugerida, a duração, e uma linha da dieta. O segmentado Treino/Dieta e os atalhos que repetem a barra saem. "Registrar outro dia" e "Trocar treino" vão para um menu "..." no cartão.
```
Qua, 19 nov · Semana 5 de 12        [anel 38%]
Treino B — Costas e bíceps
55 min · 7 exercícios
1º  Remada curvada  4×8–10 · 42,5 kg  ↑2,5
[ >  Começar treino                ]
Dieta  1.420 de 2.350 kcal  ·  próxima: Jantar   >
```
- Premium: um cartão, uma ação azul, números tabulares, setinha de progresso em texto mais ícone (sem cor de fundo).

**2. Série em um toque com sugestão pré-visível — M**
- Problema: registrar exige digitar e depois marcar.
- Solução: a linha da série mostra a sugestão como placeholder; tocar na caixa de marcar sem digitar confirma a sugestão (um toque); tocar no número abre o ajuste com ±2,5 / ±1 rep (alvos de 48 px). Mostrar "da última vez: 40 kg × 10, 9, 8" sob o nome. Desfazer no toast.
- Premium: nenhum componente novo, só usa melhor a linha atual. Esforço M porque mexe na regra "sugestão não preenche" (precisa do aval do conteúdo).

**3. Assistente de início (seção A) — G**
- Problema: B3. É o pedido 1 do dono.

**4. Resumo semanal no domingo/segunda — P**
- Problema: não existe um momento de fechamento.
- Solução: cartão no Início no 1º dia da semana: "Semana 4: 4 de 4 treinos · volume +6% · proteína na meta 5 de 7 dias · Melhor: agachamento 80 kg". Some ao dispensar ou no dia seguinte.
- Premium: texto e números; o acento brasa só no ícone de "melhor".

**5. Evolução com conclusão em frase — P**
- Problema: B7.
- Solução: acima de cada gráfico, uma frase calculada ("+5 kg em 4 semanas", "Estável há 3 sessões: considere trocar a variação"). Estado vazio que ensina: "Depois de 2 treinos com carga, aparece aqui quanto você subiu."
- Premium: tipografia faz o trabalho; o gráfico fica secundário.

**6. Dia de descanso útil — P**
- Problema: B6.
- Solução: "Descanso" + "Amanhã: Treino C (50 min)" + mini resumo da semana + condomínio recolhido em "Opcional: treino do condomínio".

**7. Atalhos do PWA no manifesto — P**
- Solução: `shortcuts` com "Treino de hoje" (`#/treino/hoje`), "Marcar refeição" (`#/dieta`), "Registrar peso" (`#/evolucao/medida`), ícones monocromáticos de 96 px. Conferir o caminho base do Pages.

**8. Lembretes úteis com conteúdo — P**
- Problema: notificações locais existem, mas são genéricas.
- Solução: o texto traz o dado: "Hoje: Treino B · remada 42,5 kg", "Falta registrar o almoço", "Pesagem da semana". No máximo um por dia; configuráveis por tipo em Perfil; o horário é escolhido no assistente (passo opcional extra).

**9. Marcos discretos — P**
- Solução: uma linha no Concluído quando houver recorde ("Recorde: supino 62,5 kg"), selo pequeno na faixa de 12 semanas para as semanas completas, e um marco a cada 4 semanas. Sem confete, sem pontos, sem medalha ilustrada; ícone de linha em brasa e texto.

**10. Check-in rápido de 5 segundos — P**
- Solução: depois de concluir o treino, ou no Início à noite: "Como foi?" com 1 a 5 (reaproveita o segmentado do jiu-jitsu) e sono/energia opcionais. Alimenta a frase da Evolução ("seus melhores treinos vêm após noites de 7 h ou mais", só com 8 registros ou mais).

---

## D. Ajustes visuais concretos (sem novas dependências)

1. **Hierarquia do topo**: data e semana em uma linha só ("Qua, 19 nov · Semana 5 de 12", 0,875rem muted). O h2 do treino sobe para 1,5rem 700. A saudação "Olá!" sai (ocupa a primeira linha sem informar nada) ou vai para o cabeçalho.
2. **Número herói**: no cartão de hoje, a carga sugerida do 1º exercício em 2rem peso 800, tabular. É o único número grande da tela. Em Dieta, o mesmo papel vai para "kcal restantes".
3. **Ritmo vertical**: usar só 24 px entre blocos e 12 px dentro do cartão. Hoje há muitos blocos com 16 px e o conjunto parece uma lista.
4. **Menos cartões**: atalhos, instalar e backup viram linhas de lista simples com separador hairline no fim da página, não cartões com `depth`.
5. **Faixa de 12 semanas como identidade**: levá-la ao topo do Início (12 segmentos de 4 px, concluídas em `primary`, atual contornada) no lugar do anel de 88 px, que repete a informação. O anel fica só no Concluído.
6. **Movimento com significado**: remover `useTilt` e `mv-par` do Início. Manter: `CountUp` nos números-chave (uma vez por sessão), `CheckDraw` ao marcar série/refeição, e uma barra de progresso do treino que avança 200 ms a cada série concluída. Adicionar a troca de passo do assistente (A4). Tudo `transform`/`opacity`, desligado com movimento reduzido.
7. **Hero sem foto consistente**: enquanto não houver foto para todos os treinos, usar o tile `accent-soft` com glifo do grupo muscular em todos (inclusive UA/UB) ou fotos para todos. Misturar deixa os dias com cara diferente.
8. **Escuro**: conferir na captura se `depth` não cria uma borda dupla; no escuro, um cartão = borda `border`, sem sombra (já previsto no DESIGN, a verificar).
9. **Textos**: trocar "Marcar aula como feita" por "Fiz a aula"; "Treinar agora (sem alterar o plano)" por "Treinar sem mudar a data"; "Registrar outro dia" por "Outro dia"; remover parênteses explicativos dos rótulos.
10. **Toque**: confirmar na captura que os botões "in-ghost" têm 44 px ou mais e que o segmentado 1 a 5 do jiu-jitsu cabe em 360 px com alvos de 48 px.
