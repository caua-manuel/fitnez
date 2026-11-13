# Sistema visual — Fitnez (Treino + Dieta)

Status: reescrito em 12/11/2026 pelo agente ux_acessibilidade para a reconstrução Fitnez (Entrega A). Substitui o sistema da Fase 1. Fontes: `docs/superpowers/specs/2026-11-12-fitnez-reconstrucao-design.md`, `docs/superpowers/plans/2026-11-12-fitnez-entrega-a.md` e as telas `docs/referencia-visual/tela-1.png` a `tela-8.png`. Os valores abaixo foram calculados por luminância sRGB (fórmula WCAG 2.x) e copiados literalmente para `src/ui/tokens.ts` e `src/ui/styles.css`. Nada aqui declara interface testada no navegador; a verificação visual cabe ao frontend e ao QA.

## 1. Direção

App pessoal usado na academia ou no tatame, com uma mão, mão suada, luz forte e pouco tempo entre séries. A identidade das telas: **azul vivo sobre fundo branco, cartões de raio grande com borda fina, ícones de linha, títulos pesados e curtos, uma ação principal azul por tela, barra inferior de cinco abas**. A informação mais importante vem primeiro: em Início, o treino de hoje; na execução, a série atual; na Dieta, as calorias restantes.

Regras de honestidade visual (antiobjetivos do design): nenhum número, nome ou gráfico dos mockups ("João Silva", 1.850 kcal, +12%, 83%) aparece sem vir dos dados reais. Sem registro, mostra-se estado vazio. Sem fotos de comida ou de atletas: as telas de referência usam fotografia, o app usa ícones e ilustração de linha (sem imagens remotas, offline garantido).

Desvios intencionais das telas, por acessibilidade e honestidade: (a) botões "Salvar" e "Registrar" soltos somem, pois o salvamento é automático e visível; (b) texto auxiliar cinza claro das telas é escurecido para AA; (c) os rótulos azuis claros sobre fundo azul claro (ex.: "-5 cm") usam o par primário/accent-soft com 4,5:1 ou mais.

## 2. Tokens de cor (claro e escuro)

Nomes estáveis; um valor por papel e tema. Em CSS: `--background`, `--foreground` etc., sob `:root` (claro) e `[data-theme="dark"]` (escuro). Automático usa `prefers-color-scheme` e `color-scheme` correspondente. O tema escuro é simétrico: mesmos papéis, mesma hierarquia, primário mais claro e texto sobre primário escuro.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `background` | `#FFFFFF` | `#0A1020` | Fundo do app |
| `foreground` | `#0B1730` | `#EEF3FF` | Texto principal, ícones de linha |
| `card` | `#FFFFFF` | `#121B30` | Cartões, folhas (sheet), barra inferior |
| `secondary` | `#F0F4FA` | `#1A2640` | Trilho do segmentado, campos, chips, trilho de anel e barra |
| `muted-foreground` | `#5F6F86` | `#A6B4D0` | Subtítulos, ajuda, rótulos de eixos |
| `border` | `#DDE4EF` | `#2A3858` | Borda de cartão e separador (decorativo) |
| `input` | `#76849B` | `#7D90B8` | Contorno de campos e caixas de marcar (identifica o controle) |
| `primary` | `#0A58F0` | `#6C9BFF` | Botão principal, aba ativa, anel, linha de gráfico, seleção |
| `primary-foreground` | `#FFFFFF` | `#06112B` | Texto e ícone sobre `primary` |
| `accent-soft` | `#E4EDFF` | `#1B2F63` | Fundo de seleção, chip "Concluído", variação nos gráficos |
| `ring` | `#0A58F0` | `#8DB0FF` | Contorno de foco |
| `success` | `#0F6B45` | `#4CC38A` | Texto e ícone de confirmação |
| `success-soft` | `#DDF3E8` | `#12352A` | Fundo de confirmação |
| `warning` | `#8A5100` | `#F2B94B` | Texto e ícone de atenção |
| `warning-soft` | `#FFEECB` | `#3A2D0E` | Fundo de atenção |
| `destructive` | `#B3202F` | `#FF7C8B` | Erro e ação destrutiva |
| `destructive-soft` | `#FDE4E7` | `#3D1B24` | Fundo de erro |

No claro, `background` e `card` são ambos branco, como nas telas; o cartão se separa pela borda de 1px e por sombra mínima (seção 6). No escuro, `card` é mais claro que `background`.

### 2.1 Razões de contraste calculadas

Mínimos: 4,5:1 para texto normal, 3:1 para texto grande (18px negrito ou 24px) e componentes de interface. Valores arredondados para duas casas; margens pequenas foram propositalmente evitadas.

| Par | Mínimo | Claro | Escuro |
| --- | --- | --- | --- |
| `foreground` / `background` | 4,5 | 17,80 | 17,06 |
| `foreground` / `card` | 4,5 | 17,80 | 15,43 |
| `foreground` / `secondary` | 4,5 | 16,13 | 13,54 |
| `muted-foreground` / `card` (texto auxiliar) | 4,5 | 6,46 | 8,21 |
| `muted-foreground` / `secondary` | 4,5 | 5,85 | 7,21 |
| `primary-foreground` / `primary` (botão principal) | 4,5 | 5,73 | 6,92 |
| `primary` / `card` (texto, aba ativa, links) | 4,5 | 5,73 | 6,34 |
| `primary` / `secondary` | 4,5 | 5,19 | 5,57 |
| `primary` / `accent-soft` (chip de seleção) | 4,5 | 4,87 | 4,76 |
| `input` / `secondary` (borda de campo / superfície) | 3 | 3,83 | 4,69 |
| `input` / `card` (borda de campo / cartão) | 3 | 4,23 | 5,35 |
| `ring` / `background` (foco) | 3 | 5,73 | 8,83 |
| `success` / `success-soft` | 4,5 | 5,63 | 6,04 |
| `warning` / `warning-soft` | 4,5 | 5,63 | 7,56 |
| `destructive` / `destructive-soft` | 4,5 | 5,51 | 6,16 |
| `destructive` / `card` | 4,5 | 6,64 | 6,94 |
| `border` / `card` | decorativo | 1,28 | 1,47 |

Valores finais de campo: borda 1px `input` (`#76849B` claro, 3,59:1 sobre `#F7F9FC` e 3,79:1 sobre branco; `#7D90B8` escuro), fundo `#FFFFFF`/`secondary`, raio 12, foco `ring` 2px; `#8A96AB` foi testado e reprovado (2,99:1 sobre branco). `muted-foreground` claro passou a `#5F6F86` (4,69:1 sobre `#F3F5F9`; o antigo `#64748B` dava 4,36).

`border` é só separação decorativa (abaixo de 3:1 de propósito): nenhum campo, botão secundário ou caixa de marcar usa `border` como único contorno; eles usam `input`. Estes são pares calculados, não certificação da interface inteira. O frontend deve repetir o cálculo em `tests/unit/tokens.test.ts` (função `contrast`).

Regras de uso: informação nunca depende só de cor (concluído = ícone de marca + texto "Concluído"; pendente = círculo vazio + "Pendente"; erro = ícone + texto). Série concluída usa caixa marcada, não só cor. Em gráficos, o valor vem em texto ao lado ou em tabela alternativa.

## 3. Tipografia

- Corpo e títulos: `'Figtree', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. As telas usam sans geométrica pesada nos títulos; Figtree 800 cobre isso.
- `'Barlow Condensed', 'Arial Narrow', Impact, sans-serif` apenas na marca (palavra "Fitnez" em itálico, `Logo.tsx`) e em números grandes (cronômetro, número no anel). Nunca em texto corrido, botão ou campo. Sem download obrigatório e sem Google Fonts; usa-se a fonte se existir no aparelho, senão o fallback (entrega offline aceita). Fonte distribuída no futuro exige licença local e pré-cache.
- Escala: corpo e campos 1rem (16px, evita zoom do iOS), entrelinha 1,5; ajuda 0,875rem; rótulo de aba 0,75rem (nunca menor); título de tela (h1) 2rem/800 com entrelinha 1,1; h2 1.375rem/700; h3 1.125rem/700; número grande de resumo 1.75rem/800; cronômetro 3rem/700.
- Números tabulares (`font-variant-numeric: tabular-nums`) em séries, carga, calorias, cronômetro e gráficos. Subtítulo de tela em `muted-foreground`. Rótulos em caixa de frase. Linha de prosa até 65ch. Não bloquear zoom. Nomes longos quebram linha (`overflow-wrap: anywhere`), nunca cortam nem geram rolagem horizontal em 360px.

## 4. Espaçamento, forma e profundidade

- Escala: 4, 8, 12, 16, 24, 32, 48px, de preferência em rem. Margem lateral 16px no celular; 24 a 32px acima de 48rem. Entre grupos 24px; entre itens relacionados 8 a 12px.
- Raios: cartão 20px; cartão interno, folha e campo de agrupamento 16px; campo e botão 14 a 16px; chip, segmentado e etiqueta em pílula (999px); caixa de marcar 8px; ícone-botão circular.
- Cartão: fundo `card`, borda 1px `border`, raio 20px, padding 16px. Sombra só em sobreposição (folha, aviso) e opcionalmente de 0 1px 2px em cartões no claro; sem gradientes, vidro ou desfoque. Exceção de identidade: o cartão "Treino de hoje" pode ter faixa diagonal em `accent-soft`/`primary` à direita, decorativa (`aria-hidden`), sem foto.
- Conteúdo até 60rem centralizado; no desktop o foco é o celular, com a mesma coluna centralizada de até 30rem para telas de execução e de formulário. Reservar espaço inferior = altura da barra + safe area + 24px.

## 5. Navegação

- **Barra inferior fixa de 5 colunas iguais**: Início, Treino, Dieta, Evolução, Perfil, nesta ordem, ícone de linha de 24px mais rótulo visível 0,75rem. Altura mínima 64px mais `env(safe-area-inset-bottom)`; cada alvo de pelo menos 44px de largura e a altura completa da barra. Fundo `card`, borda superior 1px `border`. Aba ativa: ícone e rótulo em `primary` com ícone preenchido ou de traço mais grosso, mais um traço de 3px de `primary` sob o item (ver tela-1); `aria-current="page"` no link ativo. É navegação por links (hash), sem `role="tab"`.
- **Cabeçalho**: logo à esquerda (Logo com ou sem slogan "TREINO + DIETA"), sino com ponto azul quando houver aviso, avatar circular que leva ao Perfil; alvos de 44px. Telas internas trocam a logo por seta de voltar (rótulo acessível "Voltar") e título centralizado ou à esquerda.
- Um h1 por tela. A cada mudança de rota o foco vai ao h1 (`tabindex="-1"`). Link inicial "Pular para o conteúdo". Rota desconhecida abre Início. A barra some na execução do treino (tela cheia) para liberar espaço e evitar toque acidental.
- Desktop: a mesma barra, centralizada na largura da coluna ou barra superior com as mesmas cinco opções; ordem DOM igual à visual.

## 6. Componentes

| Componente | Contrato visual e de experiência |
| --- | --- |
| Botão principal | Fundo `primary`, texto `primary-foreground` 1.0625rem/700, altura 52px, raio 16px, largura total quando é a ação da tela; ícone de linha opcional à esquerda (ex.: play em "Começar treino"). Uma por tela. Estado pressionado: escala 0,98 em 100ms. Desabilitado: fundo `secondary`, texto `muted-foreground`, motivo escrito perto; nunca `opacity` global. |
| Botão secundário | Fundo `card`, contorno 1.5px `primary` ou `input`, texto `primary` ou `foreground`, altura mínima 48px, mesmo raio. |
| Botão destrutivo | Texto `destructive` sobre `destructive-soft` ou contorno `destructive`; exige confirmação e oferece Desfazer (seção 9). |
| Ícone-botão | Alvo 44×44px, ícone 24px, rótulo acessível obrigatório (`aria-label`). O menu de três pontos (⋮) de exercício e treino segue isso. |
| Controle segmentado | Trilho `secondary`, raio 999px, padding 4px, altura 48px; cada opção ocupa partes iguais; opção ativa em `primary` com `primary-foreground` (ou `card` com texto `primary` quando for secundário, como abas Exercícios/Detalhes/Histórico). Usado em Treino/Dieta (Início), Meu plano/Biblioteca, Plano do dia/Cardápio, Geral/Treinos/Medidas, Claro/Escuro/Automático. Semântica: grupo rotulado com botões `aria-pressed` ou radios nativos; abas com conteúdo trocado na mesma tela usam `role="tablist"` com setas. Navegação entre páginas não usa segmentado. |
| Chips de filtro | Pílula 40px de altura com alvo de toque de 44px; ativo em `primary` com texto `primary-foreground` e contorno de 2px, inativo em `card` com contorno `input`; `aria-pressed`. |
| Anel de progresso | SVG, traço 10 a 12px, ponta arredondada, trilho `secondary`, preenchimento `primary`, começando no topo, sentido horário. Texto central (percentual ou kcal) em fonte condensada. `role="progressbar"` com `aria-valuenow/min/max` e rótulo ("Semana 4 de 12, 33%") somente com valor calculado; senão decorativo com texto equivalente. Na Dieta o valor passa a mostrar "restantes" em `warning` se a meta foi excedida, com ícone e texto, nunca só cor. |
| Barra de progresso | Altura 8px, raio 999px, trilho `secondary`, preenchimento `primary`, valor numérico visível ao lado ("112 g / 150 g"). Faixa de 12 semanas do plano: 12 segmentos, concluídos em `primary`, atual com contorno `primary`, futuros em `secondary`; o texto "Semana 04 de 12" acompanha. |
| Cartão de treino (lista) | Cartão com faixa lateral de 4px em `primary`, ícone de halter em quadro `secondary`, título, linha de data, "N exercícios" e "≈ N min", etiqueta de estado à direita (Concluído em `accent-soft`/`primary` com ícone de marca; Parcial em `warning-soft`/`warning`; Pendente em `secondary` com círculo vazio) e ⋮. O cartão inteiro é um alvo de 44px ou mais; o ⋮ é um botão separado. |
| Linha de série (execução) | Colunas: caixa de marcar 44×44px, número da série, campo de repetições, campo de carga (kg), botão de concluir. Campos 48px de altura, `inputMode="decimal"`, `enterKeyHint="next"`, texto centralizado 1.125rem tabular, contorno `input`. Aceitam vírgula. Concluir copia carga e repetições do último valor se vazios (2 toques por série repetida). Série concluída: caixa marcada em `primary` com ícone de marca e linha em `accent-soft`. "Adicionar série" como botão secundário em linha cheia. |
| Campo de texto e busca | Label visível associado (na busca, ícone de lupa e `aria-label`), altura 48px, fundo `secondary` ou `card`, contorno 1.5px `input`, raio 14px. Ajuda e erro via `aria-describedby`; `aria-invalid` no erro com ícone e texto em `destructive`; entrada preservada após erro. |
| Interruptor (notificações) | Trilho 52×32px, alvo de 44px, `role="switch"` com `aria-checked`; ligado em `primary` com marca visível, desligado em `secondary` com contorno `input`; sempre texto "Ativadas/Desativadas" ou descrição ao lado. Se a permissão estiver negada ou indisponível, fica desabilitado com explicação escrita. |
| Linha de configuração | Ícone de linha em quadro 40px, título 1rem/700, descrição em `muted-foreground`, seta ">" à direita; cartão inteiro como link ou botão de 56px ou mais. |
| Gráficos (SVG) | Desenhados à mão em SVG, sem biblioteca. Linha 2.5px `primary` com pontos de 4px, área sob a linha com `primary` a 14% de opacidade, grade horizontal em `border`, rótulos de eixo 0,75rem `muted-foreground` (S1 a S12; kg ou cm no eixo Y). Barras de constância: valor feito em `primary`, previsto em `secondary`, rótulo S1 a S12 abaixo. Todo gráfico tem `role="img"`, `aria-label` com resumo ("Carga média de 62 kg a 80 kg em 12 semanas") e uma tabela ou lista de valores equivalente (visualmente oculta ou em "Ver dados"). Poucos pontos: desenhar os pontos sem linha enganosa. Sem dados: estado vazio, nunca curva de exemplo. |
| Seletor de período | Cartão-campo com ícone de calendário e texto "Últimas 12 semanas", abre folha com 4, 8, 12 semanas; botão com `aria-haspopup`. |
| Cartão de indicador (Força, Peso, Cintura, Constância) | Quatro colunas em grade de 2x2 em 360px, ou 4x1 se couber com texto de 0,75rem; ícone, valor 1.5rem/800, rótulo; selecionado em `accent-soft` com contorno `primary` e `aria-pressed`; variação com sinal e texto ("−3,8 kg"), nunca só cor. |
| Folha (sheet) | Sobe do rodapé, fundo `card`, raio superior 24px, alça visual, título, fecha com Escape, botão Fechar e toque fora; foco inicial seguro, contenção de foco, retorno ao elemento de origem; sombra de sobreposição e véu `foreground` a 40%. |
| Aviso e toast | Faixa acima da barra inferior, `role="status"` para rotina, `role="alert"` uma só vez para erro. Toast de Desfazer dura 8 s, com botão "Desfazer" de 44px e pausa enquanto tem foco ou toque. |
| Marca | `Logo.tsx`: halter azul (`primary`) com folha verde (`success`), palavra "Fitnez" em itálico condensado e slogan "TREINO + DIETA" em caixa alta com espaçamento largo. Sem slogan em telas internas. Decorativa em cabeçalho (`alt` vazio), com `aria-label="Fitnez"` quando for o único identificador. |

## 7. Telas: ordem da informação

- **Início**: saudação ("Olá!" ou "Olá, <nome>!"), "Semana 04 de 12" em destaque, foco da semana (RIR, bloco, deload) e anel ao lado; controle segmentado Treino/Dieta; cartão "Treino de hoje" (nome, duração, nº de exercícios) com **Começar treino** (ou Continuar treino); abaixo "Trocar treino de hoje" e "Registrar outro dia"; dois atalhos, Dieta e Evolução. Em dia de jiu-jitsu, vôlei e descanso o cartão muda conforme o plano (ver design D4).
- **Treino**: segmentado "Meu plano" e "Biblioteca"; busca; chips Todos/Superiores/Inferiores; lista de cartões de treino. Detalhe: voltar, título, duração, exercícios, anel de progresso da semana, **Começar treino**, abas Exercícios/Detalhes/Histórico, cartão por exercício com séries, repetições da semana, último desempenho e "Sugestão" rotulada.
- **Execução** (tela cheia): cabeçalho com voltar, tempo decorrido e pausa; "Exercício 1 de N", nome e grupo; linhas de série; "Adicionar série"; **Concluir treino** fixo no rodapé. Setas anterior e próximo (44px) trocam de exercício.
- **Treino concluído**: marca de sucesso em `primary` com ícone de marca, "Treino concluído!", três indicadores reais (duração, exercícios, séries; volume em kg) e botões Ver resultado e Voltar ao início.
- **Dieta**: título e seletor de dia com setas; anel de kcal (consumidas de meta do tipo de dia) com barras de proteína, carboidrato e gordura; três indicadores (meta, consumidas, restantes); lista "Refeições de hoje" com estado marcado/não registrado; água em copos; Adicionar refeição. Tela de refeição: "Escolher opção" com opções A/B/C em cartões de rádio e **Marcar como consumido**; aba "Gerenciar opções" com ⋮ por opção e "Adicionar nova opção".
- **Evolução**: seletor de período, quatro indicadores, gráfico de força, peso, medidas, constância. Sem registros: estado vazio com texto e atalho para registrar.
- **Perfil**: avatar com iniciais ou ícone (sem foto obrigatória), nome e objetivo editáveis, números reais, "Meu plano" com barra, Preferências (tema, notificações), Dados neste aparelho, Backup e restauração (comportamento da Fase 1 preservado: baixar, copiar, importar com prévia e confirmação, proteção de armazenamento).

## 8. Estados: vazio, erro e carregamento

Todo estado tem título curto, uma frase de explicação e uma ação. Texto em português, sem jargão e sem culpar a pessoa.

| Situação | Texto base | Ação |
| --- | --- | --- |
| Carregando dados | "Abrindo seus dados…" com esqueleto da silhueta da tela e espaço reservado (sem pulo de layout); o esqueleto não pulsa sob movimento reduzido. | nenhuma |
| Falha ao abrir | "Não foi possível abrir os dados neste aparelho." mais o motivo curto. `role="alert"`. | "Tentar de novo" |
| Falha ao salvar | "Não foi possível salvar. O que você digitou continua na tela." persistente até resolver. | "Tentar salvar de novo" |
| Conflito de revisão (outra aba) | "Os dados mudaram em outra aba. Juntamos a sua alteração." ou, se falhar, mantém o valor local e avisa. | "Tentar de novo" |
| Salvamento | "Salvando…" e "Salvo neste aparelho" em `role="status"`, só após gravar. | nenhuma |
| Treino sem histórico | "Sem registro anterior" e nenhuma sugestão inventada. | "Começar treino" |
| Evolução sem dados | "Ainda não há registros suficientes. Conclua um treino ou registre seu peso para ver a evolução." | "Ir para Treino", "Registrar medidas" |
| Dieta sem registro do dia | "Nada marcado hoje" | "Escolher opção" |
| Biblioteca sem resultado | "Nenhum treino encontrado para esta busca." | "Limpar busca" |
| Pré-semana | "Seu plano começa em N dias." | "Ver plano" |
| Plano concluído | "Você concluiu as 12 semanas." | "Ver evolução" |
| Notificações negadas ou indisponíveis | "As notificações estão bloqueadas neste aparelho. Ative nas configurações do navegador." No iPhone: "Instale o app na tela inicial para receber avisos." Interruptor desabilitado com o motivo escrito. | "Como ativar" |
| Exercício ou treino removido | O histórico aparece como "Exercício removido". | nenhuma |
| Offline | "Disponível offline" só depois do cache concluído; atualização: "Atualizar agora" e "Depois", nunca recarregar sozinho. | |

Aviso semanal de backup: "Guarde uma cópia dos seus dados" com atalho "Fazer backup", em `warning-soft`. Importação: nunca importa ao selecionar o arquivo; prévia com versão e contagens, depois "Confirmar importação" e "Cancelar"; mensagem "Os dados atuais serão substituídos. Uma cópia de recuperação será preservada neste aparelho." Conflito de migração: "Encontramos duas fontes diferentes" com escolha explícita. Conteúdo de JSON importado é sempre texto, jamais HTML.

## 9. Ações destrutivas e desfazer

Excluir treino, exercício, opção de dieta ou série extra: (1) pedir confirmação com folha de nome claro ("Excluir Upper A?") e consequência ("O histórico dos treinos feitos continua salvo."), foco inicial em Cancelar; (2) após confirmar, toast "Treino excluído" com **Desfazer** por 8 s (guarda o estado anterior e regrava por `commit`); (3) remover da sessão não apaga o exercício nem o histórico. Nenhum "Desfazer" aparece sem o mecanismo realmente integrado.

## 10. Timer de descanso

- Aparece ao concluir uma série, em folha fixa acima do botão Concluir treino (não cobre campos focados; a rolagem considera a altura da folha). Mostra "Descanso", o tempo restante grande (fonte condensada tabular, ex.: `2:30`), um anel ou barra de `primary` consumindo, e botões **−15 s**, **+15 s** e **Pular** de 48px de altura, alvo de 44px ou mais, lado a lado.
- O tempo vem do carimbo `endsAt` (nunca de contagem de ticks); recarregar a página retoma o restante. Anúncio para leitor de tela: sem `aria-live` a cada segundo; `role="timer"` sem anúncio contínuo e uma única mensagem `role="status"` ao terminar ("Descanso terminado. Próxima série."). Ao terminar vibra se existir e avisa por notificação local se permitida; a folha muda para `success-soft` com ícone de marca e texto, não só cor.
- O tempo padrão vem do `rest` do exercício (ex.: 150 s no supino) e é editável por exercício; sem `rest` definido, a folha oferece o campo.

## 11. Movimento (respeitando reduced-motion)

Princípio: movimento ajuda a entender uma mudança de estado, nunca decora. Troca de aba e de rota sem coreografia. Permitido: transição de cor e opacidade de até 120 a 150ms com `ease-out`; escala 0,98 por 100ms ao pressionar; folha sobe em 200ms (`transform`/`opacity`); anel e barra de progresso preenchem em até 300ms no primeiro carregamento; marca de série concluída em 120ms. Proibido: `transition: all`, desfoque, pulsos, brilho contínuo, animação de largura e altura de layout, animação ao abrir teclado. Hover só com `(hover: hover) and (pointer: fine)`. Cronômetro e anel de descanso atualizam sem animar o texto.

Com `prefers-reduced-motion: reduce`: remover transformações, animações e smooth scroll; transições viram troca imediata; esqueletos ficam estáticos; folha aparece sem deslizar; feedback textual permanece imediato. Nada depende de animação para comunicar estado.

## 12. Acessibilidade (WCAG 2.2 AA)

- **Contraste**: tabela da seção 2.1; ícone ou texto sobre foto não existe (sem fotos). Controles desabilitados mantêm rótulo legível.
- **Foco visível**: contorno de 3px na cor `ring`, offset de 3px, nunca removido; em botão azul o anel precisa se distinguir do fundo (offset externo). Elementos focados não ficam sob a barra inferior ou a folha do timer (`scroll-padding-bottom`/`scroll-margin`). Ordem de foco igual à visual.
- **Teclado**: fluxo completo por Tab, Shift+Tab, Enter, Espaço e Escape; setas em grupos de abas e segmentados; sem armadilha de foco, sem atalhos globais.
- **Rótulos e estados**: todo campo com label visível; ícone-botão com `aria-label`; `aria-pressed` em alternadores e filtros; `aria-current="page"` na aba atual; `aria-expanded` e `aria-haspopup` em menus; `role="switch"` nos interruptores; erro com `aria-invalid` e `aria-describedby`; status com região educada, erro com `role="alert"` uma vez.
- **Toque**: alvos de 44×44px ou mais, 8px entre alvos vizinhos; botão principal 52px; campos de série 48px. Operação com uma mão: ação principal ao alcance do polegar, no terço inferior (Concluir treino e Começar treino ficam fixos ou perto dele).
- **Texto**: tamanhos em rem, zoom até 200% sem perda de conteúdo nem rolagem horizontal; sem texto como imagem; ícones decorativos com `aria-hidden`; informação nunca só por cor.
- **Região segura**: respeitar `env(safe-area-inset-*)`; `viewport-fit=cover`.
- **Linguagem**: `lang="pt-BR"`; datas e números em pt-BR (vírgula decimal, "12 de nov", "1.480 kcal").

## 13. Verificação

Antes de aceitar a interface: 360×800 e 1280×800, zoom de 200%, claro, escuro e automático, nomes longos (80 caracteres) em treino e exercício, leitura sem cor, teclado completo, foco não encoberto, movimento reduzido, cinco rotas com Voltar e Avançar, estados vazio, erro e carregamento de cada tela, timer após recarregar. Lacunas assumidas: sem teste em Safari físico, leitor de tela ou celular nesta entrega documental; o layout fino ainda precisa de inspeção visual no navegador.

## Histórico

- 11/11/2026: base neutra provisória e depois reconciliada com o legado azul de seis abas (Fase 1).
- 12/11/2026: reescrito para o Fitnez: cinco abas, branco e azul vivo (`#0A58F0`, escurecido do `#0F5FFF` das telas para 5,73:1 com branco), cartões de 20px, anel, segmentado, gráficos SVG, tema escuro simétrico, timer de descanso.
