# Sistema visual — Treino 12 semanas

Status: direção adotada para a Fase 1 em 11/11/2026 pelo agente real ux_acessibilidade. Substitui a base neutra provisória. Fonte de verdade: referência visual `legacy/index.html`, pedido atual e ADR 003. A implementação e a validação no navegador são etapas seguintes; este documento não declara interface testada.

## Contexto e direção

App pessoal de treino e alimentação, usado com uma mão na academia, no tatame e ao ar livre. A direção preserva o azul, os fundos azulados, títulos compactos, superfícies simples e a faixa de 12 segmentos do protótipo. Prioridade: leitura rápida, toque confortável e estado dos dados inequívoco. React + TypeScript + Vite e CSS próprio, sem biblioteca UI adicional.

As cinco primeiras abas apresentam conteúdo preservado e estados de fundação. Não exibir séries editáveis, conclusão de treino, metas calculadas, progressão ou gráficos fictícios. Mais concentra as ações funcionais desta fase. Não promover esta fundação como plano diário já calculado.

## Cores

Tokens normativos para CSS. Os nomes semânticos novos podem ter aliases para os nomes do protótipo (`--background`/`--bg`, `--foreground`/`--ink`, `--card`/`--surface`, `--primary`/`--accent`). Um único valor por papel e tema.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--background` | `#ECEFF4` | `#0B1322` | Fundo do app |
| `--foreground` | `#13203B` | `#EAF0FF` | Texto principal |
| `--card` | `#FFFFFF` | `#131F36` | Superfície de grupos |
| `--secondary` | `#F3F5F9` | `#1A2845` | Campos e superfície auxiliar |
| `--muted-foreground` | `#56657F` | `#9AA9C9` | Ajuda e informação secundária |
| `--border` | `#D3DAE6` | `#263759` | Separação decorativa |
| `--input` | `#71809A` | `#7185AD` | Contorno identificável de controles |
| `--primary` | `#1F4FD8` | `#7C9CFF` | Ação e seleção atuais |
| `--primary-foreground` | `#FFFFFF` | `#0B1322` | Texto da ação principal |
| `--accent-soft` | `#E2E9FC` | `#1E2F5C` | Fundo da seleção |
| `--ring` | `#1F4FD8` | `#7C9CFF` | Foco externo |
| `--success` | `#116C49` | `#4CC38A` | Confirmação em texto |
| `--success-soft` | `#DCF2E7` | `#14352A` | Fundo de confirmação |
| `--warning` | `#8A5200` | `#F2B94B` | Atenção em texto |
| `--warning-soft` | `#FAE9C6` | `#3A2D0E` | Fundo de atenção |
| `--destructive` | `#B61D32` | `#F0586B` | Erro e ação de substituição |
| `--destructive-soft` | `#FBE3E6` | `#3C1A22` | Fundo de erro |

Verde e vermelho claros foram escurecidos em relação ao protótipo para texto pequeno sobre os respectivos fundos suaves. Razões calculadas por luminância sRGB: texto principal/card 16,19 claro e 14,41 escuro; texto auxiliar/card 5,89 e 6,96; azul/card 6,63 e 6,31; sucesso/fundo suave 5,48 e 6,03; erro/fundo suave 5,37 e 4,63. Bordas de campo contra superfícies auxiliares: 3,66 e 3,95. São pares específicos calculados, não certificação da interface inteira. Separador decorativo não identifica sozinho um campo.

Usar texto e forma além da cor. Erros ficam visíveis até resolução/dispensa consciente. Evitar `opacity` global em controles desabilitados que torne seus rótulos ilegíveis; manter texto auxiliar explicando o motivo. Temas automático/claro/escuro seguem o repositório; automático acompanha mudanças do sistema com `color-scheme` correspondente.

## Tipografia

Preservar caráter das famílias do legado sem download obrigatório: `--font-body: 'Figtree', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`; `--font-heading: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif`. Os primeiros nomes só são usados se disponíveis localmente; não adicionar links Google Fonts. Fallback de sistema é a entrega offline aceita nesta fase. Fonte distribuída futuramente exige licença local e precache.

Corpo e campos 1rem, entrelinha 1,5; ajuda 0,875rem; rótulos de navegação 0,75rem; h1 2,5rem, h2 1,75rem, h3 1,375rem. Títulos compactos 1,1–1,2; pesos 600/700, corpo 400/500. Fonte condensada apenas em títulos, nunca em texto corrido, botões ou formulários. Números tabulares onde ajudar a comparar dados; sem fonte monoespaçada decorativa. Linha de prosa até 65ch. Rótulos em caixa de frase. Não bloquear zoom nem usar tamanho mínimo que cause corte de conteúdo.

## Layout e navegação

- Base de espaçamento: 4, 8, 12, 16, 24, 32 e 48px, preferencialmente expressos em rem. Margem lateral 16px no celular, 24–32px em telas maiores. Grupos separados por 24px, itens relacionados por 8–12px.
- Em 360px: uma coluna, largura disponível integral, `min-width: 0` nos filhos, conteúdo longo quebra linha; ações de backup/importação empilham. Não esconder overflow para mascarar quebra. Campos usam largura disponível e fonte de 16px.
- Conteúdo principal até 60rem no desktop, centralizado. Acima de 48rem, grupos independentes podem formar duas colunas; ordem visual e DOM permanecem equivalentes. Não esticar parágrafos e formulários de confirmação por toda a largura.
- Seis links persistentes: Hoje `#hoje`, Agenda `#calendario`, Treinos `#treinos`, Dieta `#dieta`, Evolução `#progresso`, Mais `#mais`. Manter hash e histórico Voltar/Avançar. Rota desconhecida abre Hoje.
- No celular, barra inferior de seis colunas iguais com ícone consistente e rótulo visível, alvo de pelo menos 44px de largura e 60px de altura. Em 360px cada coluna tem 60px. Essa exigência explícita de seis abas prevalece sobre a recomendação genérica de até cinco; não ocultar uma aba ou mudar a hierarquia. A barra usa toda a largura e os alvos contíguos não se sobrepõem. Fora da barra, preferir 8px entre ações.
- No desktop, manter as seis opções visíveis, podendo usar barra superior. Seleção: `aria-current="page"`, cor e destaque de fundo/traço. Navegação é link, ação é botão. Não usar `role="tab"` em navegação de páginas.
- Respeitar `env(safe-area-inset-*)`. Reservar espaço inferior igual à barra mais safe area e 24px; controles focados nunca ficam escondidos sob navegação ou aviso. `scroll-margin`/`scroll-padding` devem considerar elementos fixos.
- Um h1 por tela e hierarquia h2/h3 sem saltos artificiais. Link inicial “Pular para o conteúdo”. Na mudança de rota, tornar título/conteúdo principal localizável por leitor de tela e gerir foco sem prender navegação ou interferir na operação de backup.

## Forma, profundidade e identidade

Cartões de 14px de raio, campos/botões de 10–12px, bordas de 1px. Agrupar por função; listas de exercícios e refeições usam linhas/separadores dentro de grupos, sem cartão a cada frase. Sem gradientes, vidro, sombras repetidas ou decoração adicional. Sombra discreta só em sobreposição.

A faixa de 12 segmentos e ponta curta mantém a identidade do protótipo. Nesta fase é referência visual do plano: rótulo “Plano de 12 semanas” e explicação de que o acompanhamento diário estará disponível na próxima fase. Não preencher semanas, destacar semana atual nem usar `progressbar` sem cálculo validado. Pode ser decorativa (`aria-hidden`) com texto equivalente fora dela.

## Componentes e estados

| Componente | Contrato de experiência |
| --- | --- |
| Botão principal | Azul, rótulo direto, altura mínima 48px; secundário com superfície/contorno, mínimo 44px; sem ícone isolado para ação central |
| Campo | Label visível associado, ajuda/erro via `aria-describedby`, `aria-invalid` quando inválido; preservar entrada após erro |
| Tema | Grupo “Tema” com Automático/Claro/Escuro; botões `aria-pressed` ou radios nativos; opção atual inequívoca |
| Salvamento | Região `role="status"` discreta: “Salvando…”; “Salvo neste aparelho” somente após commit; erro persistente com mensagem e tentar novamente/reler |
| Inicialização | “Abrindo seus dados…” com espaço reservado; falha: “Não foi possível abrir os dados neste aparelho” e ação de nova tentativa; não apresentar sucesso ou sessão vazia falsa |
| Fundação | Texto breve por aba: conteúdo consultável; funções ainda indisponíveis explicadas em texto, sem botões mortos que pareçam funcionar |
| Estado vazio | “Ainda não há registros neste aparelho”; distinguir ausência de histórico de erro de abertura e de migração pendente |
| Aviso semanal | Hoje e Mais: “Guarde uma cópia dos seus dados” e atalho “Fazer backup”; geração recente sem confirmação continua indicada |
| Backup | “Baixar backup”, “Copiar backup” e “Já guardei a cópia”; datas separadas “Última geração” e “Cópia confirmada”; não afirmar arquivo salvo pelo clique |
| Importação | Campo de arquivo com label e limite 10 MiB; selecionar prepara prévia, nunca importa automaticamente; exibir versão e contagens de dias/medidas/exercícios/treinos |
| Confirmação de importação | Aviso “Os dados atuais serão substituídos. Uma cópia de recuperação será preservada neste aparelho.”; ação “Confirmar importação” e “Cancelar”; preservar prévia se falhar; após commit anunciar conclusão |
| Conflito de migração | Explicar “Encontramos duas fontes diferentes”; comparar rótulos e contagens; seleção explícita e confirmação, sem marcar fonte pelo timestamp; demais alterações ficam bloqueadas com motivo visível |
| Proteção | Persistência concedida/negada/indisponível/erro em texto; botão “Pedir armazenamento persistente”; explicar que backup continua necessário |
| Offline/atualização | “Disponível offline” somente após cache concluído; atualização oferece “Atualizar agora” e “Depois”; aguardar gravações, nunca recarregar automaticamente |

Prévia/confirmar importação pode ser bloco inline com título e foco no resumo após validar; reduz complexidade e mantém contexto. Se frontend usar `<dialog>`, dar nome acessível, foco inicial seguro em Cancelar, Escape, contenção de foco e retorno ao botão de origem. Mensagem de erro usa `role="alert"` uma única vez por falha; mensagens de rotina usam status educado. Não anunciar o mesmo evento em várias regiões.

Não oferecer apagar dados/restaurar padrão nesta fase. A recuperação transacional de importação protege o estado anterior; não exibir “Desfazer” sem mecanismo realmente integrado. Durante ação assíncrona, impedir confirmação duplicada com texto de andamento e estado desabilitado explicável. Conteúdo de JSON importado é sempre texto, jamais HTML.

## Movimento e teclado

Troca de abas e estados de gravação sem coreografia de entrada. Transição opcional de cor/opacity até 120ms; pressionamento por ponteiro pode usar escala 0,98 por 100ms, somente se não prejudicar alvo/foco. Não animar teclado. Hover apenas com `(hover: hover) and (pointer: fine)`. Não usar `transition: all`, blur, pulsos, shimmer contínuo ou animação de largura.

Com `prefers-reduced-motion: reduce`, retirar transformações, animações e smooth scroll; feedback textual permanece imediato. Foco: contorno 3px no token ring com offset 3px; manter espaço externo para não cortar, inclusive em botão azul, cuja separação do anel depende do fundo. Não remover outline. Fluxo integral por Tab/Shift+Tab/Enter/Espaço/Escape conforme controles nativos. Não prender foco no conteúdo nem inventar atalhos globais.

## Verificação e lacunas

Antes de aceitar UI: conferir 360×800, desktop 1280×800, zoom/refluxo, claro/escuro/automático, nomes longos importados, leitura sem cor, campos/erros/andamento, navegação por teclado, foco não encoberto e movimento reduzido. Conferir as seis rotas e Voltar/Avançar, importação cancelada/inválida/futura/conflitante e backup offline.

A paleta foi calculada; layout e comportamento ainda exigem navegador e inspeção visual pelo frontend/QA. Não há evidência de teste em Safari físico, leitor de tela ou celular nesta entrega documental. Nenhuma marca nova foi aprovada: adotou-se a referência legada solicitada. Não há novas decisões de aparência pendentes para executar a Fase 1.

## Histórico

- 11/11/2026: base neutra provisória criada.
- 11/11/2026: reconciliada pelo agente ux_acessibilidade com legado azul, dois temas, fonte offline, navegação de seis abas e estados reais do contrato v3. Ajustados verde/vermelho claros e borda de controles para contraste.
