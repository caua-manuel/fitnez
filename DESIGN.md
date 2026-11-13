# Sistema visual — Fitnez

Fonte da verdade do visual entregue. Os valores abaixo espelham `src/ui/tokens.ts` e `src/ui/styles.css`; em caso de divergência, vale o código. Histórico das mudanças em `docs/handoffs/frontend-reset-visual.md` e `docs/handoffs/frontend-polimento-ui.md`.

## 1. Direção

Premium minimalista, usado com uma mão na academia ou no tatame: fundo branco, cartões com borda fina, ícones de linha, títulos curtos e uma ação principal azul por tela. A informação mais importante vem primeiro (treino de hoje, série atual, calorias restantes). Nenhum número ou gráfico aparece sem vir dos dados reais; sem registro, mostra-se estado vazio.

## 2. Tokens de cor

Variáveis CSS em `:root` (claro). O escuro vale com `data-theme="dark"` ou, no modo automático, por `prefers-color-scheme: dark`. Mesmos papéis nos dois temas.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `background` | `#FFFFFF` | `#0B1220` | Fundo do app |
| `foreground` | `#0F172A` | `#EEF3FF` | Texto principal e ícones |
| `card` | `#FFFFFF` | `#111A2E` | Cartões, folhas, barra inferior |
| `secondary` | `#F7F9FC` | `#162036` | Campos, chips, trilhos de barra e anel |
| `muted-foreground` | `#5F6F86` | `#A6B4D0` | Texto auxiliar |
| `border` | `#E6EAF2` | `#243250` | Borda fina de cartão e separador (decorativa) |
| `input` | `#76849B` | `#7D90B8` | Contorno de campos e caixas de marcar |
| `primary` | `#0A58F0` | `#6C9BFF` | Ação principal, item ativo, progresso |
| `primary-foreground` | `#FFFFFF` | `#06112B` | Texto sobre `primary` |
| `accent-soft` | `#EAF1FF` | `#1B2F63` | Seleção, chip "Concluído" |
| `ring` | `#0A58F0` | `#8DB0FF` | Foco |
| `success` / `success-soft` | `#0F6B45` / `#DDF3E8` | `#4CC38A` / `#12352A` | Confirmação |
| `warning` / `warning-soft` | `#8A5100` / `#FFEECB` | `#F2B94B` / `#3A2D0E` | Atenção |
| `destructive` / `destructive-soft` | `#B3202F` / `#FDE4E7` | `#FF7C8B` / `#3D1B24` | Erro e ação destrutiva |

Auxiliares: `--leaf` `#4DB33D` (folha da marca), `--surface` `#F7F9FC` e `--surface-2` `#F3F5F9` (fundo da página no desktop; no escuro ambos `#162036`), `--field-border` igual a `input`.

### Contraste (mínimo 4,5:1 para texto, 3:1 para componentes)

- `primary` sobre branco e branco sobre `primary`: 5,73:1.
- `input` (contorno de campo): 3,79:1 sobre branco e 3,59:1 sobre `#F7F9FC`. O cinza `#8A96AB` foi reprovado (2,99:1).
- `muted-foreground` `#5F6F86` sobre `#F3F5F9`: 4,69:1 (o antigo `#64748B` dava 4,36:1).
- `border` é decorativo, abaixo de 3:1 de propósito; campos e caixas de marcar usam `input`.
- `tests/unit/tokens.test.ts` recalcula os pares com a função `contrast`.

Informação nunca depende só de cor: concluído = ícone + texto; erro = ícone + texto.

### Regras de uso do azul

O azul (`primary`) aparece somente em: botão principal, item ativo (aba, segmentado, chip), progresso (anel, barras, faixa de semanas), número selecionado, foco e a marca. Não colorir títulos, bordas, rótulos comuns nem trilhos. Botão secundário é neutro (borda `input`, texto `foreground`).

## 3. Tipografia

- Família única: **Figtree** (variável, 300 a 900, distribuída em `public/fonts/` com licença OFL, pré-cacheada para uso offline), com fallback `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Fonte condensada e itálico não são mais usados, nem na marca.
- Pesos: 400 corpo, 500 slogan, 600 negrito e h3, 700 títulos (h1, h2) e palavra "Fitnez", 800 apenas em números de destaque (`.stat`, `.display`, anel).
- Escala: h1 1,75rem, h2 1,25rem, h3 1,0625rem, corpo e campos 1rem (evita zoom do iOS), pequeno 0,875rem, indicador 1,5rem. Rótulo de aba nunca abaixo de 0,75rem.
- Números tabulares em séries, cargas, calorias, cronômetro e gráficos. Nomes longos quebram linha (`overflow-wrap: anywhere`); nunca rolagem horizontal em 360 px.

## 4. Forma, sombra e espaço

- Raios: cartão 16, campo e cartão interno 12, botão 14, folha 24, chip e segmentado em pílula (999) só onde a forma é de rótulo; ícone-botão circular.
- Sombras: cartão `0 1px 2px rgb(16 24 40 / .04)` (nenhuma no escuro); botão sem sombra; folha desktop `0 24px 64px -16px rgb(16 24 40 / .16), 0 2px 8px rgb(16 24 40 / .04)`. Sem brilho azul, gradiente, vidro ou desfoque.
- Cartão: fundo `card`, borda 1px `border`, padding 16 (24 acima de 48rem).
- Espaço: 4, 8, 12, 16, 24, 32, 48 px. Margem lateral 20 px (16 px em telas até 25rem). Reservar abaixo do conteúdo a altura da barra inferior mais a área segura.

## 5. Casca e desktop "folha"

Celular: coluna única, cabeçalho com marca à esquerda, sino e avatar (44 px). A partir de 48rem, `#root` vira uma **folha de 430 px** centralizada (borda 1px, raio 24, sombra suave) sobre `--surface-2`; a barra inferior fica contida na folha e as folhas de baixo (`.sheet`) respeitam a mesma largura. O foco do produto é o celular.

## 6. Navegação

Barra inferior plana de 5 colunas: Início, Treino, Dieta, Evolução, Perfil; ícone de linha (traço 1,6, 1,9 no ativo) mais rótulo visível. Altura mínima 64 px mais área segura, alvos de 44 px ou mais, linha fina no topo. Ativa em `primary` com traço curto, `aria-current="page"`. Um h1 por tela; a cada rota o foco vai ao h1; link "Pular para o conteúdo". A barra some na execução do treino.

## 7. Componentes

| Componente | Contrato |
| --- | --- |
| Botão principal | `primary`/`primary-foreground`, 52 px, raio 14, texto 700, largura total quando é a ação da tela; uma por tela; desabilitado em `secondary` com motivo escrito. |
| Botão secundário | Fundo `card`, contorno `input`, texto `foreground`, mínimo 48 px. |
| Destrutivo | Texto `destructive` sobre `destructive-soft`; exige confirmação e oferece Desfazer por 8 s. |
| Ícone-botão | 44×44 px, `aria-label` obrigatório. |
| Segmentado | Trilho cinza claro, raio 12, opção ativa azul sólida raio 10, sem sombra; `aria-pressed` ou radios nativos. |
| Chip | Fundo `surface-2`, ativo azul sólido, sem sombra, alvo de 44 px. |
| Cartão e linha de lista | Borda hairline, raio 16, sombra quase invisível; item clicável com 44 px ou mais. |
| Campo | 48 px, borda 1px `input`, raio 12, foco `ring` 2px; label visível; erro com `aria-invalid` e texto. |
| Linha de série | Caixa de marcar 44 px, repetições e carga (`inputMode="decimal"`, aceita vírgula), concluir copia o último valor (2 toques). |
| Anel e barra de progresso | Trilho cinza azulado visível, preenchimento `primary`, valor em texto junto; `role="progressbar"` só com valor calculado. Faixa de 12 semanas com concluídas em `primary`, atual contornada. |
| Gráficos | SVG próprio; `role="img"` com resumo e valores em texto; sem dados, estado vazio. |
| Interruptor | `role="switch"`, 44 px de alvo, texto "Ativadas/Desativadas". |
| Folha (`.sheet`) | Sobe do rodapé, raio superior 24, fecha com Escape e toque fora, foco contido, retorno ao origem. |
| Aviso e toast | `role="status"` (rotina) ou `role="alert"` (erro); Desfazer de 44 px por 8 s. |
| Marca (`Logo.tsx`) | Halter robusto em `primary` com folha `--leaf` e nervura `card`; palavra "Fitnez" em peso 700 sem itálico; slogan "TREINO + DIETA" em caixa alta, peso 500, espaçamento 0,22em, só no cabeçalho principal. Ícones do PWA usam só o símbolo sobre branco. |
| Thumb (`Thumb.tsx`) | `Thumb({ kind: 'meal' \| 'exercise' \| 'hero', id, group, size, label })`. Mostra foto de `public/img/<kind>/<id>.jpg` (ou `.webp`) apenas para ids listados em `src/ui/photos.ts`; sem foto, tile minimalista com ícone de linha (por refeição, grupo muscular ou padrão) e tom por opção A, B ou C; hero usa composição em `accent-soft`. Sem requisição para ids fora do manifesto. Sem ilustrações de desenho animado. |

## 8. Estados

Todo estado vazio, de erro ou de carregamento tem título curto, uma frase e uma ação, em português, sem culpar a pessoa. Carregando: "Abrindo seus dados…". Falha ao salvar: "Não foi possível salvar. O que você digitou continua na tela." Evolução sem dados: texto com atalho para registrar. Dieta sem registro: "Nada marcado hoje". Importação de backup sempre com prévia e confirmação; conteúdo importado é texto, nunca HTML. Offline: "Disponível offline" só após o cache; atualização com "Atualizar agora" e "Depois".

## 9. Movimento

Movimento só explica mudança de estado: transições de cor e opacidade de 120 a 150 ms, escala 0,98 ao pressionar, folha em 200 ms. Proibido `transition: all`, pulsos e animação de layout. Com `prefers-reduced-motion: reduce` tudo vira troca imediata. Hover só com `(hover: hover) and (pointer: fine)`.

## 10. Acessibilidade (WCAG 2.2 AA)

Contraste conforme a seção 2; foco visível `ring` nunca removido e não encoberto pela barra; teclado completo; alvos de 44 px; tamanhos em rem com zoom até 200%; `env(safe-area-inset-*)` e `viewport-fit=cover`; `lang="pt-BR"`, datas e números em pt-BR.

## 11. PWA e identidade

Nome e nome curto "Fitnez", `display: standalone`, `orientation: portrait`, `lang: pt-BR`. `background_color` `#FFFFFF`; `theme_color` `#0A58F0` (meta `theme-color` `#0B1220` no escuro). Ícones 192, 512, maskable 512 e apple-touch 180: símbolo halter com folha, sem texto, sobre fundo branco; o maskable usa o símbolo a 60% da largura para caber na zona segura de 80%.

## 12. Verificação

360×800 e 1280×800 (folha), zoom de 200%, claro, escuro e automático, nomes longos, teclado completo, movimento reduzido, estados vazio, erro e carregamento. Capturas: `scripts/capturas.cjs` e `scripts/capturas-desktop.cjs`. Lacuna assumida: sem teste em Safari físico nem leitor de tela.
