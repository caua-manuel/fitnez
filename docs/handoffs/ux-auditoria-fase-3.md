# UX e acessibilidade: auditoria da Fase 3 (itens 1 a 5)

Data: 20/11/2026. Agente: `ux_acessibilidade`. Só a lista: nada foi implementado. Sem commit.

**Base usada**
- `AGENTS.md`, `DESIGN.md`, `agents/impeccable/SKILL.md` (com `reference/audit.md`), `agents/emil-design-eng/SKILL.md` e ADR 006, seção 6.
- Referências `docs/referencia-visual/tela-1.png` a `tela-8.png`.
- Capturas `docs/antes-depois/antes/*` (claro e escuro).
- Código atual de `src/features/*`, `src/ui/styles.css` e `src/app/App.tsx`, mais os handoffs `frontend-adr-011-fase-2.md` e `frontend-textos-primeira-abertura.md`.

**Já corrigido no código e fora desta lista**
- Menu ⋮ no canto e alvos de 48 px na execução.
- Histórico rápido e anilhas na série.
- Textos da primeira abertura e rótulo "Carga sugerida".
- "Instalar na tela inicial" fora do Início.
- Coluna "Anterior".

**Limitações**
- O lançador do Impeccable não rodou: esta sessão não tem shell. Li o contexto direto.
- Sem navegador nem leitor de tela reais nesta auditoria. As posições em 390 × 844 vêm dos handoffs do `frontend`.
- As razões de contraste foram calculadas à mão com a fórmula WCAG 2.x (luminância relativa sRGB). Margem de ±0,02.
- O `Executar.tsx` mudou durante a auditoria (entrou `restoreRest`). Os números de linha citados valem para a versão de 20/11 à tarde.

Prioridade: **ALTO**, **MÉDIO** e **BAIXO** (impacto). Esforço: **P** (até 1 h), **M** (meio dia), **G** (mais de 1 dia).

---

## As 10 correções com melhor relação impacto/esforço

| # | Imp. | Esf. | Tela | Correção |
|---|---|---|---|---|
| 1 | ALTO | P | Execução | O tempo de descanso não chega ao leitor de tela: o `aria-label` do `role="timer"` substitui o conteúdo (`Executar.tsx:129`). Trocar por texto oculto dentro do elemento (`<span class="visually-hidden">Descanso restante: </span>1:23`), sem `aria-label`. Dar nomes falados aos botões: "Tirar 15 segundos", "Somar 15 segundos", "Pular descanso" (`Executar.tsx:133-135`). |
| 2 | ALTO | P | Execução | Cada série marcada faz o leitor anunciar "Salvando…" e depois "Salvo neste aparelho", pela região global (`App.tsx:117`). Na rota `executar`, a região só deve falar em erro. |
| 3 | ALTO | M | Execução | Um anúncio único por série, numa região `status` da execução: "Série 2 registrada: 32,5 kg, 5 repetições. Recorde de carga. Descanso de 1 min 30 s." Hoje a informação vem em 3 regiões que competem (toast, `ex-copied` e status global) e, com valores digitados, não há anúncio nenhum (`Executar.tsx:306-331, 493`). |
| 4 | ALTO | M | Execução | Depois de marcar, o painel de descanso aumenta o rodapé fixo em cerca de 100 px e pode cobrir a próxima série. Após marcar, rolar a série ativa para ficar acima do rodapé (`block: 'nearest'`, instantâneo com movimento reduzido) e destacar a linha ativa (`Executar.tsx:405`, `treino.css:262-265`). |
| 5 | ALTO | M | Execução | Trocar de exercício exige as setas no meio de cima da tela (y ≈ 340 em 390 × 844). Com todas as séries do exercício feitas, o rodapé mostra "Próximo: {nome}" (48 px, secundário) acima de "Concluir treino" (`Executar.tsx:452-455`). |
| 6 | ALTO | P | Dieta | Tirar os 3 cartões "Meta diária / Consumidas / Restantes", que repetem o anel. Hoje as refeições, que são a ação da tela, começam abaixo da dobra (captura `dieta-claro.png`, y ≈ 1450 de 1688). A referência mais nova (`tela-8.png`) não tem esses cartões. "Restantes" passa a ser a linha de apoio do anel. |
| 7 | MÉDIO | P | Execução | O cronômetro geral é o maior elemento da tela (2,5rem, peso 800, `treino.css:187`), mas é o dado menos útil entre séries. Reduzir para 1,125rem, peso 600, em números tabulares, no formato `m:ss` até 1 h (`Executar.tsx:60-62`). O nome do exercício volta a ser o destaque. |
| 8 | MÉDIO | P | Execução e Concluído | Na execução, o h1 oculto diz só "Treino". Ao trocar de exercício nada é anunciado, e no Concluído o foco cai em "Treino". Mudanças: h1 com o nome da sessão ("Upper A, em andamento"); anunciar "Exercício 2 de 10: Remada curvada" nas setas; no Concluído, h1 "Treino concluído" recebe o foco (`App.tsx:35-41, 101`, `Concluido.tsx:80`). |
| 9 | MÉDIO | P | Detalhe do treino | Os ícones de relógio e de barras encostam no texto, porque `.in-meta` só tem estilo dentro de `.inicio` (`Detalhe.tsx:112`, `inicio.css:21`). O anel diz "Semana 5 de 12" e o resto do app diz "Semana 05 de 12" (`Detalhe.tsx:116`). Usar `weekLabel` e um `.meta` comum com espaço de 6 px. |
| 10 | MÉDIO | P | Execução | Sugestão (placeholder) e valor digitado só diferem pela cor (`styles.css:193`, `treino.css:209`). Sob luz forte, "30,5" cinza e "30,5" preto se confundem. Placeholder em peso 400; valor digitado em peso 700, cor `foreground`. Assim a diferença não depende só de cor. |

---

## 1. Telas comparadas com as referências e o DESIGN.md

### Início (`tela-7`, `tela-5` nº 1; captura `inicio-*.png`)

A faixa de 12 semanas no lugar do anel é decisão do DESIGN.md (identidade) e não entra como diferença.

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | O lembrete de backup é o maior bloco da tela: fundo âmbar e 4 linhas. Ele aparece em 3 lugares: sino, Início e topo do Perfil. Compete com o treino de hoje, que é o que mais importa. | `Inicio.tsx:381`, `Perfil.tsx:221`, `App.tsx:84-95`; capturas `inicio-claro.png` (y 1230-1560) e `perfil-claro.png` (acima da identidade) | Início: uma linha compacta abaixo da dieta, com ícone em `warning`, "Backup pendente" e o botão de texto "Fazer backup" (44 px). Perfil: o aviso vai para dentro da seção de backup. O sino continua com o ponto. | P |
| BAIXO | O tipo do dia na faixa da semana está em 0,6875rem (11 px), abaixo do mínimo de 0,75rem (DESIGN §3). | `inicio.css:103` | 0,75rem, com `white-space: nowrap` mantido. | P |
| BAIXO | `CountUp` de 600 ms em "N exercícios" sempre que o Início monta: o `Reveal` anima só na primeira visita, mas a contagem se repete. Passa da faixa de 120 a 350 ms do ADR 006. | `Inicio.tsx:40, 172`; `CountUp.tsx:11` | Sem contagem para contadores pequenos (até 20). Duração padrão do `CountUp` de 350 ms. | P |

### Treino, lista (`tela-4`, `tela-5` nº 2; captura `treino-*.png`)

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | A rotina da semana não marca o dia de hoje. Na sexta, o treino do dia fica abaixo da dobra, depois de 3 dias que já passaram. | `Treino.tsx:41-55`; captura `treino-claro.png` | Selo "Hoje" em texto, contorno de 1,5 px em `primary` (mesma linguagem do `is-now` da faixa) e `aria-current="date"` no cartão do dia. | P |
| MÉDIO | "+ Novo" é um botão azul sólido numa tela em que a ação frequente é abrir o treino. Com o segmentado azul e o play azul de "Treino livre", são 3 azuis no topo (DESIGN §2: uma ação principal). | `Treino.tsx:94`; captura | "Novo" vira botão secundário (contorno `input`). O azul fica no segmentado. | P |
| BAIXO | O selo "Concluído" ocupa uma linha própria e o ícone do cartão fica centralizado na vertical, enquanto o texto começa no topo. As alturas variam de 1 a 4 linhas (Jiu-jitsu × Upper). | `treino.css:15, 20-23`; captura | Status na linha da data ("Terça · 17 nov · ✓ Concluído", ícone + texto) e `align-self: start` no tile. | P |
| BAIXO | O mesmo ícone tem sentidos diferentes. "barras" (sinal) indica "N exercícios" e também a aba Evolução/Constância. "alvo" indica jiu-jitsu, Objetivo, Constância e "Restantes". No Concluído, "Exercícios" usa halter. | `Cartao.tsx:33`, `Treino.tsx:53`, `Concluido.tsx:72` | Um glifo de lista (ou "camadas") para contar exercícios em todo o app. Jiu-jitsu ganha glifo próprio ou neutro. Registrar no DESIGN.md §7. | M |

### Detalhe do treino (`tela-6`, `tela-5` nº 3; captura `treino-UA-*.png`)

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | Ícones colados no texto e semana sem o zero ("Semana 5" × "Semana 05"). | Ver correção 9 do topo | Ver correção 9 do topo. | P |
| MÉDIO | O botão voltar ocupa uma linha só dele (cerca de 56 px) entre a marca e o título, e empurra "Começar treino" para baixo. | `Detalhe.tsx:107`, `treino.css:40`; captura (y 140-200) | Voltar na mesma linha de "Treino A" (grade de 48 px + texto), como a seta ao lado do título em `tela-6`. | P |
| MÉDIO | O cartão aberto repete "5 séries · 4–6 repetições" (no subtítulo e em "Meta:"). "Último desempenho" escreve 5 vezes "28 kg × 6". | `Detalhe.tsx:61, 76, 78` | Tirar a linha "Meta:". Agrupar séries iguais numa função pura: "5 × (28 kg × 6)". | P |
| MÉDIO | Em 390 px, a aba "Exercícios (10)" quebra em 2 linhas. A aba ativa é só um fundo `card` sobre `surface-2` (1,06:1 no claro e 1,08:1 no escuro). Há outro padrão de segmentado na lista, com azul sólido. | `treino.css:166-169, 278`; `Detalhe.tsx:134`; captura | Contador num selo pequeno ("Exercícios" + "10") ou sem ícones abaixo de 26rem. Ativa com azul sólido, igual ao `.segmented` (DESIGN §7). Um padrão só. | P |
| BAIXO | "Sugestão: 30,5 kg" em azul fere a regra do azul (não é ação). | `treino.css:75`; `Detalhe.tsx:79`, `Executar.tsx:463` | "Sugestão" em `muted`; o valor em `foreground` 600. | P |
| BAIXO | Histórico vazio diz só "Sem registro anterior.", sem título nem ação (DESIGN §8). | `Detalhe.tsx:152` | Título "Nenhum treino registrado", uma frase e "Começar treino". | P |

### Execução (`tela-5` nº 4; captura `treino-UA-executar-*.png`)

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | O cronômetro geral é o maior elemento da tela. | Correção 7 do topo | Correção 7 do topo. | P |
| MÉDIO | Até 4 parágrafos centralizados (esforço, dica do exercício, aquecimento geral e sugestão) ficam entre a figura e as séries. Texto centralizado em várias linhas é difícil de ler entre séries. A meta da série vem por último, entre parênteses. | `Executar.tsx:457-464`; captura (y 860-1140) | Uma linha alinhada à esquerda logo acima das séries: "Hoje: 30,5 kg × 4–6 · pare com 2 sobrando" (`foreground` 600). Dica do exercício e aquecimento num "Dicas" recolhível (`details`), aberto só na primeira vez no exercício. | M |
| MÉDIO | Sem foto, a figura de 144 px é só um ícone de halter sobre cinza: cerca de 180 px sem informação. | `Executar.tsx:454`; captura (y 540-830) | Sem foto, trocar a figura por um bloco compacto "Última vez: 28 kg × 6 · há 2 dias" com altura parecida. As séries continuam na metade de baixo (DESIGN §4). | M |
| BAIXO | O CSS da execução tem 4 ou 5 camadas de sobreposição (`.ex-row` em `treino.css:102, 203, 295, 325`; `.ex-pause` em 84, 188, 322). A garantia de 48 px fica frágil. | `treino.css` | Juntar num bloco só por componente, sem mudar o visual aprovado. | M |
| BAIXO | "Treino não encontrado." não tem título nem frase de apoio. | `Executar.tsx:241`, `Concluido.tsx:65` | Título, uma frase ("Ele pode ter sido excluído do plano.") e a ação. | P |

### Concluído (`tela-5` nº 5)

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | O foco e o anúncio caem em "Treino". | Correção 8 do topo | Correção 8 do topo. | P |
| BAIXO | A explicação de "Total levantado" está só no `title`, que não existe no toque nem é lido de forma confiável. | `Concluido.tsx:88` | Texto visível pequeno abaixo do número: "soma de carga × repetições". | P |

### Dieta (`tela-3`, `tela-8`; captura `dieta-*.png`)

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| ALTO | Os 3 cartões de kcal repetem o anel, e as refeições caem abaixo da dobra. | Correção 6 do topo | Correção 6 do topo. | P |
| MÉDIO | "Meta de exemplo" é uma pílula contornada com ícone e parece botão, mas não é. Ao lado ficam 2 ações em link azul sublinhado. | `MetaDieta.tsx:20-26`; captura (y 1080-1300) | Texto simples com o ícone de informação em `muted`: "Meta de exemplo do plano. Ajuste para o seu caso." Um botão secundário "Ajustar metas". "Usar esta meta" vira ação dentro da folha de metas. | P |
| BAIXO | O % de cada macro cai para a linha de baixo da barra, enquanto em `tela-8` fica na mesma linha. | captura `dieta-claro.png` | Tirar o % ("0 g de 183 g" já informa) ou travá-lo na mesma linha. | P |
| BAIXO | A barra de macro anima `width` em 300 ms. O ADR 006 só permite `transform` e `opacity`. | `dieta.css:30` | `transform: scaleX()` com `transform-origin: left`. | P |

### Evolução (`tela-1`, `tela-5` nº 8; captura `evolucao-*.png`)

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | Os rótulos S10, S11 e S12 se encostam no eixo X. | captura `evolucao-claro.png` (y 1115) | Mostrar S1, S4, S8, S12 e a semana atual, ou só as semanas com dado. | P |
| BAIXO | Tons misturados: os ícones são violeta (`tone-evolucao`); a linha, o delta e o selo são azuis; no tile ativo "Força" o ícone também é azul. | captura; `evolucao.css:152` | Dados em `primary` (progresso) e todos os ícones em violeta, inclusive o do tile ativo. | P |
| BAIXO | A barra de constância anima `height` em 300 ms (animação de layout). | `evolucao.css:66` | `scaleY` com origem embaixo. | P |
| BAIXO | "Peso corporal" quebra em 2 linhas no cartão de meia largura e o ícone fica desalinhado. | captura (y 1250) | Título "Peso". | P |

### Perfil (`tela-2`, `tela-5` nº 9; captura `perfil-*.png`)

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | O lembrete de backup vem antes da identidade. | Ver Início | Ver Início. | P |
| BAIXO | O avatar fica mais baixo que o nome: centralizado num bloco de 3 linhas, enquanto o nome começa acima. | captura (y 540-750) | Alinhar o avatar ao topo do nome, ou centralizar o bloco inteiro como em `tela-2`. | P |
| BAIXO | "Dados físicos" tem 4 linhas numa linha de lista. | captura (y 1200-1460) | Uma linha de resumo ("30 anos · 76,3 kg · 178 cm") e a seta. A meta de proteína vai para "Metas de dieta". | P |

### Geral

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| MÉDIO | O DESIGN.md (§7) diz "Desfazer por 8 s", mas o código usa 6 s e os textos dizem "6 segundos". Na academia, com a mão ocupada, 6 s é pouco. | `UndoToast.tsx:4`, `Cartao.tsx:51`, `Detalhe.tsx:73` | 8 s numa constante única, com os textos montados a partir dela. | P |
| BAIXO | O DESIGN.md §2 diz que `input` tem 3,79:1. O real é 4,49:1 sobre branco e 4,09:1 sobre `#F4F4F5`. | `DESIGN.md:35` | Corrigir o número no documento. | P |

---

## 2. Uso com uma mão na execução

Posições em 390 × 844, pelos handoffs do `frontend` e pelo código atual:

| Controle | Posição | Frequência | Alcance do polegar |
|---|---|---|---|
| Voltar, cronômetro, pausa | Topo (y < 100) | Rara | Difícil, aceitável |
| Nome (histórico) e menu ⋮ | Topo (y ≈ 120-180) | Rara | Difícil, aceitável |
| Setas de exercício | y ≈ 340 | **1 vez por exercício** (cerca de 10 por treino) | **Difícil** |
| Campos e ✓ das séries | 1ª caixa entre y 594 e 701, as demais abaixo | Alta | Bom (coluna da direita) |
| Descanso (−15, +15, Pular) | Rodapé fixo | Alta | Bom |
| Concluir treino | Rodapé, y = 784 | 1 vez | Bom |

Resposta: **sim** para série atual, ✓ e descanso, todos na metade de baixo. Falta o que está abaixo.

| Imp. | Problema | Evidência | Correção proposta | Esf. |
|---|---|---|---|---|
| ALTO | O painel de descanso surge ao marcar e o rodapé cresce de cerca de 90 para 190 px. A próxima série pode ficar atrás dele. `scroll-padding` só vale para foco e `scrollIntoView`, não para mudança de layout. | `Executar.tsx:500`, `treino.css:262-265` | Correção 4 do topo. | M |
| ALTO | Trocar de exercício fica no meio de cima. | `Executar.tsx:452-455` | Correção 5 do topo. As setas ficam para quem quiser pular. | M |
| MÉDIO | A série atual não tem destaque visual. Só exercícios com barra ganham o botão de anilhas. | `Executar.tsx:405` | Linha ativa com número em `foreground` 700 e fundo `surface-2`, mais `aria-current="step"`. | P |
| MÉDIO | Com o teclado numérico aberto, o rodapé fixo (até 45vh) espreme as séries no Android. | `treino.css:265` | Com um campo da execução em foco, o rodapé vira uma barra compacta só com o relógio do descanso (`:has(.ex-input:focus)` ou `visualViewport`). | M |
| BAIXO | A caixa visível do ✓ tem 24 px dentro do alvo de 48 px. Sob luz forte e com a mão suada, o sinal visual é pequeno. | `treino.css:211` | Caixa de 28 a 30 px com borda de 2 px, como em `tela-6`. | P |
| BAIXO | Em exercício com barra, o botão de anilhas muda de série ao marcar, e a próxima linha sobe 48 px. | `Executar.tsx:487` | Aceitar (não fica sob o dedo) ou reservar a altura. | P |
| BAIXO | O ✓ fica sempre à direita, o que é ruim para canhotos. | `treino.css:325` | Futuro: preferência "Mão esquerda" que espelha as colunas. Decisão do dono. | G |

---

## 3. Microinterações

As regras valem para os três momentos:
- ADR 006 §6: de 120 a 350 ms, só `transform` e `opacity`, nada em loop, nunca bloqueia toque nem teclado, desliga com a aba oculta.
- Uma curva só: `--mv-ease: cubic-bezier(.2,.8,.2,1)`. Hoje a folha e o menu usam `cubic-bezier(.23,1,.32,1)` (`styles.css:54, 271`); proponho unificar.
- Pelo critério de frequência da emil-design-eng, quanto mais vezes o gesto acontece, menos movimento.

### A. Marcar série (dezenas de vezes por treino: o mínimo)

| Momento | O que anima | Duração | Easing | Movimento reduzido |
|---|---|---|---|---|
| Pressionar ✓ | `.ex-check-box` em `scale(.92)` | 100 ms | ease-out | Sem escala |
| Série concluída | Caixa em `primary` (já existe) + traço do `CheckDraw` | 120 ms (cor) + **200 ms** (traço; hoje 300) | `--mv-ease` | Marca pronta, cor sem transição |
| Linha feita | Fundo e cor dos campos passam a `accent-soft` (só cor) | 150 ms | ease | Troca imediata |
| Painel de descanso entra | `opacity` 0→1 e `translateY(8px)`→0, só na 1ª aparição de cada descanso | 200 ms (saída 120 ms, só opacidade) | `--mv-ease` | Aparece pronto |
| Desmarcar / Desfazer | Nada | 0 | — | — |
| Tato | `vibrate(12)` (toque curto), pela futura opção de vibração | — | — | Mantido (não é movimento) |

Fica de fora: confete, pulso, escala da linha inteira, mudança de altura animada.

### B. Recorde batido (raro: o "momento discreto")

| Momento | O que anima | Duração | Easing | Movimento reduzido |
|---|---|---|---|---|
| Linha "Recorde de carga: 32,5 kg × 5" | `opacity` 0→1 e `translateY(4px)`→0, 120 ms depois do toque (não compete com o traço) | 240 ms | `--mv-ease` | Linha pronta |
| Troféu | `scale(.85)`→1 e `opacity`, sem passar do tamanho final, cor `accent-brasa` | 280 ms | `--mv-ease` | Ícone pronto |
| Tato | `[12, 60, 12]`, diferente do fim do descanso `[200, 100, 200]` | — | — | Mantido |

Uma vez por série (`useJustTurnedOn`), sem brilho e sem fundo âmbar grande (ADR 006 §7). O texto entra no anúncio único da série (seção 5).

### C. Conclusão do treino (1 vez por treino: pode ter um pouco mais)

O tempo conta a partir da montagem. Total abaixo de 800 ms, com cada peça dentro de 120 a 350 ms.

| t (ms) | O que anima | Duração | Movimento reduzido |
|---|---|---|---|
| 0 | Círculo da marca: `opacity` 0→1 e `scale(.94)`→1 | 220 | Pronto |
| 120 | Traço do ✓ (`CheckDraw`, já existe) | 300 | Pronto |
| 180 | Título e subtítulo: `opacity` e `translateY(6px)` | 240 | Pronto |
| 260 / 320 / 380 | Os 3 cartões do resumo (`Reveal`, 60 ms por passo) | 280 cada | Prontos |
| 260 | `CountUp` em Séries e Total levantado; Duração sem contagem | **350** (hoje o padrão é 600) | Valor final |
| 500 | Linha de recordes: `opacity` | 240 | Pronta |
| 0 | Botões sem animação, tocáveis desde o início | — | — |

Com a aba oculta, tudo vai direto ao fim (`CountUp` já faz isso). O foco vai para o h1 "Treino concluído", e um anúncio resume: "Treino concluído: 52 minutos, 8 exercícios, 24 séries, 2 recordes."

### Mudanças no código atual (formato emil-design-eng)

| Antes | Depois | Por quê |
|---|---|---|
| `.mv-check.is-playing path{animation:mv-draw 300ms}` na série | 200 ms na série; 300 ms só no Concluído | Gesto repetido dezenas de vezes: mais curto parece mais rápido |
| `.ex-check` sem estado `:active` visível (`styles.css:8` só aplica `brightness` sobre fundo transparente) | `.ex-check:active .ex-check-box{transform:scale(.92)}` | Retorno imediato ao toque |
| Painel de descanso aparece sem transição | `opacity` + `translateY(8px)`, 200 ms, `--mv-ease` | Explica de onde veio o painel |
| `CountUp` padrão de 600 ms | 350 ms | Faixa do ADR 006 |
| `.dt-macro-bar .bar>span{transition:width 300ms}` | `transform: scaleX()` + `transform-origin: left` | Só `transform` e `opacity` |
| `.ev-bar-track{transition:height 300ms}` | `scaleY` com origem embaixo | Idem |
| `.sheet` e `.ui-menu` com `cubic-bezier(.23,1,.32,1)` | `var(--mv-ease)` | Uma curva só no app |

O corte global de movimento reduzido (`styles.css:12, 60`) segue o ADR 006 ("troca imediata"). Fica como está.

---

## 4. Tema escuro: contraste real dos pares usados

Pares tirados dos seletores em uso. Mínimo de 4,5:1 para texto e 3:1 para componentes e ícones.

| Par (texto/frente sobre fundo) | Onde aparece | Razão | Resultado |
|---|---|---|---|
| `foreground` #F2F2F3 / `background` #121214 | Texto geral | 16,7 | ✓ |
| `foreground` / `card` #19191C | Cartões, rodapé da execução | 15,7 | ✓ |
| `foreground` / `surface-2` #202024 | Relógio do descanso (`treino.css:215`) | 14,5 | ✓ |
| `muted` #A1A1AA / `background` | Subtítulos, "Anterior" | 7,30 | ✓ |
| `muted` / `card` | Barra de abas inativa, rótulos | 6,85 | ✓ |
| `muted` / `surface-2` | "Descanso" 0,75rem (`treino.css:270`), aba inativa | 6,34 | ✓ |
| `muted` / `accent-soft` #26262B | Texto auxiliar em seleção | 5,88 | ✓ |
| `primary` #6C9BFF / `background` | Link, "Sugestão", aba ativa | 6,92 | ✓ |
| `primary` / `card` | Item ativo da barra inferior | 6,49 | ✓ |
| `primary` / `accent-soft` | `.badge.done`, pausa ativa (`treino.css:189`) | 5,57 | ✓ |
| `primary-foreground` #0B0B0C / `primary` | Botão principal, ✓ marcado | 7,28 | ✓ |
| `success` #4CC38A / `success-soft` #12352A | Descanso terminado (`treino.css:216, 271`), avisos de sucesso | 6,05 | ✓ |
| `success` / `card` | "Concluído hoje" (`inicio.css:23`) | 7,92 | ✓ |
| `warning` #F2B94B / `warning-soft` #3A2D0E | Lembrete de backup, `.badge.partial` | 7,57 | ✓ |
| `destructive` #FF7C8B / `destructive-soft` #3D1B24 | Erros, item perigoso do menu | 6,16 | ✓ |
| `destructive` / `card` | `.ex-problem`, erro de campo | 7,11 | ✓ |
| `ring` #8DB0FF / `background` · `card` · `surface-2` | Foco | 8,72 · 8,18 · 7,57 | ✓ |
| `ring` / `success-soft` | Foco nos botões do descanso terminado | 6,24 | ✓ |
| `input` #7A7A83 / `background` · `card` | Campos da execução, caixa do ✓ | 4,40 · 4,13 | ✓ (3:1) |
| `input` / `surface-2` | Campos genéricos (`styles.css:42`: fundo `secondary`) e botões do descanso | 3,82 | ✓ (justo) |
| `input` / `success-soft` | Borda dos botões no descanso terminado | 3,15 | ✓ (no limite) |
| `accent-dieta` #4ADE80 / `card` | Ícones da Dieta | 10,1 | ✓ |
| `accent-evolucao` #A78BFA / `card` | Ícones da Evolução | 6,45 | ✓ |
| `accent-brasa` #FBBF24 / `background` | Fogo da sequência, troféu | 11,2 | ✓ |
| Toast: `background` / `foreground` | `.ui-toast` | 16,7 | ✓ |

Pares abaixo de 3:1. Nenhum é texto; ficam os riscos de estado:

| Imp. | Par | Onde | Razão | Leitura | Correção |
|---|---|---|---|---|---|
| MÉDIO | `card` / `surface-2` | Aba ativa do Detalhe (`treino.css:168, 241`) | **1,08** | O estado selecionado quase não se vê. Sobram cor do texto e ícone azul | Aba ativa em `primary` sólido, igual ao segmentado (seção 1, Detalhe) |
| BAIXO | `accent-soft` / `background` | Linha de série feita (fundo dos campos) | 1,16 | O ✓ preenchido carrega o estado (6,92) | Aceitável; a linha ativa destacada (seção 2) ajuda |
| BAIXO | `--track` #2C2C31 / `surface-2` | Trilho da barra do descanso | 1,17 | O relógio em texto carrega o valor; o preenchimento sobre o trilho tem 5,14 | Aceitável |
| BAIXO | `secondary` / `card` | "Concluir treino" desabilitado | 1,08 | Desabilitado é isento, e a dica escrita está acima | Aceitável |
| BAIXO | `border` / `background` | Semanas futuras da faixa de 12 | 1,35 | O texto "Semana 05 de 12" e o `aria-label` levam a informação | Aceitável |

Mais um ponto do escuro, impacto **BAIXO** e esforço **P**:
- No modo automático, `--track`, `--ink`, `--ink-2` e `--shadow-sheet` só mudam com `[data-theme="dark"]` (`styles.css:84-85, 237-238`). Não há bloco `prefers-color-scheme` para eles.
- O `App.tsx:55-58` grava `data-theme` logo depois, então o efeito é só no primeiro quadro: trilhos claros piscam no escuro.
- Correção: repetir esses tokens no bloco `@media (prefers-color-scheme: dark)`.

Conferência no claro (para comparar):

| Par | Razão |
|---|---|
| `primary` / branco | 5,73 |
| `muted` / branco | 6,43 |
| `muted` / `surface-2` | 5,85 |
| `badge.done` | 4,99 |
| `warning` / `warning-soft` | 5,63 |
| `success` / `success-soft` | 5,63 |
| `input` / branco | 4,49 |
| Ícone dieta / branco | 3,30 |
| Ícone brasa / branco | 3,19 |
| Aba ativa (`card` / `surface-2`) | **1,06**, mesmo problema do escuro |

---

## 5. Execução com leitor de tela, foco e alvos

### O que o leitor ouve hoje e o que deve ouvir

| Momento | Hoje | Proposto | Evidência | Imp. | Esf. |
|---|---|---|---|---|---|
| Série marcada com valores digitados | Só a mudança de `aria-pressed`, falada ou não conforme o leitor; depois "Salvando…" e "Salvo neste aparelho" | "Série 2 registrada: 32,5 kg, 5 repetições. Descanso de 1 min 30 s." | `Executar.tsx:306-331`, `App.tsx:117` | ALTO | M |
| Série marcada com a sugestão | Toast "Registrado 32,5 kg × 5" + "Salvando…" + "Salvo…" | O mesmo texto acima (um só). O Desfazer continua no toast | `Executar.tsx:323`, `UndoToast.tsx:40` | ALTO | M |
| Recorde | `ex-copied` com "Recorde de carga…", concorrendo com as outras 2 regiões | Junto da série: "… 5 repetições. Recorde de carga. Descanso…" | `Executar.tsx:322, 493` | ALTO | M |
| Descanso começa | Nada | Dentro do anúncio da série | `Executar.tsx:285` | ALTO | M |
| Tempo restante (ao focar) | "Tempo de descanso restante, Supino", sem o tempo | "Descanso restante: 1 minuto e 23 segundos" (texto oculto + conteúdo, sem `aria-label`) | `Executar.tsx:129` | ALTO | P |
| −15 s / +15 s / Pular | "−15 s" (o sinal pode ser omitido), "Pular" sem contexto | "Tirar 15 segundos", "Somar 15 segundos", "Pular descanso" | `Executar.tsx:133-135` | MÉDIO | P |
| Descanso termina | "Descanso terminado. Próxima série." (bom) | "Descanso terminado. Próxima: série 3." | `Executar.tsx:139` | BAIXO | P |
| Série desmarcada | Nada | "Série 2 desmarcada." | `Executar.tsx:306` | BAIXO | P |
| Nome do ✓ | "Série 1 concluída, não pressionado" (soa contraditório) | "Série 1 feita", com `aria-pressed` (nome fixo, o estado vem do `pressed`) | `Executar.tsx:483` | MÉDIO | P |
| Troca de exercício (setas) | Nada; o foco fica na seta | "Exercício 2 de 10: Remada curvada" | `Executar.tsx:453-455` | MÉDIO | P |
| Entrar na execução | Foco no h1 oculto "Treino" | h1 "Upper A, em andamento" | `App.tsx:37, 101` | MÉDIO | P |
| Concluir | Foco em "Treino"; o h2 "Treino concluído!" não é anunciado | h1 "Treino concluído" com foco + resumo (seção 3C) | `Concluido.tsx:80` | MÉDIO | P |

Implementação sugerida para os itens ALTO:
- Uma função pura `setAnnouncement({ n, kg, reps, unit, record, restSec })`, com testes, que monta o texto.
- Uma região `role="status"` única da execução, sempre montada.
- Nessa rota, o toast fica `aria-hidden` (o Desfazer continua alcançável pelo Tab).
- O status global de salvamento fala só em erro.

### Foco visível
- Está bom:
  - Anel de 2 px com afastamento de 2 px (`styles.css:196`).
  - Campos com borda e contorno `ring` (`styles.css:195`).
  - `scroll-padding-bottom` acompanha a altura real do rodapé (`treino.css:262-263`), então o foco não fica escondido (WCAG 2.4.11).
  - Contraste do anel de 7,57 a 8,72 no escuro.
- **BAIXO, P**: o toast fica acima do rodapé (`treino.css:303`), mas a altura dele não entra no `scroll-padding`. Um campo focado pode ficar atrás do toast por 6 s. Somar a altura do toast quando ele estiver visível, ou colocar o toast dentro do rodapé.
- **MÉDIO, P**: as abas do Detalhe usam `role="tab"` sem setas do teclado, `aria-controls` nem `tabpanel` (`Detalhe.tsx:133-134`). Trocar por segmentado com `aria-pressed` (padrão do DESIGN §7) ou implementar o padrão de abas completo.

### Alvos de toque
- Toda a execução tem 48 × 48 px ou mais: confirmado no código (`treino.css:320-336`) e no handoff da Fase 2.
- No resto do app, 44 px ou mais.
- Única ressalva: o tamanho **visual** da caixa do ✓ (seção 2, BAIXO).

---

## Para quem implementa

| Agente | Itens |
|---|---|
| `frontend` | Os 10 do topo, as seções 1 a 3 e as correções de região e rótulo da seção 5 |
| `backend-dados` | Só a função pura do texto do anúncio, se ficar em `src/domain` |
| `qa-testes` | E2E: um anúncio por série (texto exato); rodapé não cobre a série ativa depois de marcar em 390 × 844; "Próximo: …" com o exercício completo; contraste das abas nos dois temas |

Decisão do dono, se quiser: opção "Mão esquerda" na execução (seção 2, BAIXO, G).
