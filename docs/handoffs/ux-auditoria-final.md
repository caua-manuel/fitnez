# Auditoria final de acessibilidade (WCAG 2.2 AA) e UX: Fitnez

Método: leitura de `src/app`, `src/ui`, `src/features/*` e CSS, mais as capturas `scratchpad/final`, `capturas/r3` e `scratchpad/c2/r3`. Não houve execução do app: nada abaixo foi testado com leitor de tela real nem com zoom real. Itens marcados "(inferido)" dependem de confirmação em dispositivo.

## Contraste calculado (fórmula de `src/ui/tokens.ts`)

| Par | Razão | Resultado |
|---|---|---|
| muted #5F6F86 sobre #FFFFFF | 5,12 | passa |
| muted sobre #F3F5F9 (surface-2) | 4,69 | passa por pouco |
| muted sobre #F7F9FC | 4,88 | passa |
| muted sobre accent-soft #EAF1FF | 4,51 | passa por pouco (sem folga) |
| primary #0A58F0 sobre #FFFFFF / accent-soft / #F3F5F9 | 5,74 / 5,06 / 5,26 | passa |
| branco sobre primary | 5,74 | passa |
| borda de campo #76849B sobre #FFFFFF / #F3F5F9 | 3,79 / 3,47 | passa (>= 3) |
| warning sobre warning-soft; success sobre success-soft; destructive sobre branco | 5,6 / 5,6 / 6,6 | passa |
| ícone #7A8BA8 sobre #F3F5F9 (`.thumb`) | 3,16 | passa só como gráfico |
| Escuro: muted #A6B4D0 sobre #162036; primary #6C9BFF sobre #0B1220 | 7,6 / 6,9 | passa |
| Interruptor desligado `#D9DEE8` sobre branco (`.switch`) | 1,35 | FALHA 1.4.11 (exige 3) |
| Interruptor desligado escuro `#35476B` sobre #0B1220 | 2,0 | FALHA 1.4.11 |

Texto cinza sobre #F3F5F9 e azul sobre branco passam. O ponto frágil é o interruptor.

## Lista priorizada (18 itens)

### CRÍTICO

**1. Rodapé fixo da execução cobre as séries e esconde o foco (2.4.11, 1.4.4, 1.4.10, uso com uma mão).**
`src/features/treino/treino.css:120` (`.ex-footer{position:fixed;...}`) e `Executar.tsx:299` (`ex-spacer` de 120 ou 280 px). Com o descanso ativo o rodapé tem ~470 px de 1688 na captura `c2/r3/exec-1.png` (28% da tela): só 1 linha de série fica visível. `scroll-margin-block:7rem` (112 px, styles.css) é menor que o rodapé, então o campo focado por Tab fica atrás dele. Em zoom 200% ou 320 px de largura o rodapé pode ocupar quase a tela e o conteúdo vira inalcançável (inferido).
Correção: tornar o descanso compacto em uma linha (relógio + "−15 / +15 / Pular" em 56 px) e limitar a altura do rodapé; ajustar o scroll dinâmico:
```css
.ex-footer{max-height:40vh;overflow:auto}
.ex-wrap{--footer-h:140px;scroll-padding-bottom:calc(var(--footer-h) + 16px)}
.ex-wrap input,.ex-wrap button{scroll-margin-bottom:calc(var(--footer-h) + 16px)}
@media (max-height:480px),(min-resolution:2dppx) and (max-width:480px){.ex-footer{position:static}}
```
e mover `style={{height: rest||askRest?280:120}}` para uma variável CSS medida com ResizeObserver do próprio rodapé.

**2. Aviso de sucesso antigo vaza para todas as telas (confusão e anúncio indevido).**
`DataProvider.tsx:52-53` define `notice` e nunca o limpa; `App.tsx:70` o renderiza em toda rota. Em `c2/r3/exec-1.png` o texto "Backup importado. Os dados anteriores estão preservados" aparece no meio do treino. Além disso `role="status"` é montado já com texto (alguns leitores não anunciam).
Correção: limpar por timeout e ao trocar de rota, e mantê-lo em região persistente.
```tsx
// App.tsx
useEffect(()=>{ if(data.notice){ const t=setTimeout(data.clearNotice,6000); return ()=>clearTimeout(t);} },[data.notice]);
useEffect(()=>{ data.clearNotice(); },[routeKey]);
<div role="status">{data.notice ? <p className="success">{data.notice}</p> : null}</div>
```
(adicionar `clearNotice` ao provider).

**3. Interruptor desligado sem contraste (1.4.11).**
`styles.css:174-182` (`--switch-off:#D9DEE8` / `#35476B`). Correção: trilho com 3:1 e contorno.
```css
.switch{--switch-off:#8593A8}          /* 3,1:1 sobre branco */
[data-theme="dark"] .switch{--switch-off:#6F82A8}  /* >= 3:1 sobre #0B1220 */
.switch::before{box-shadow:inset 0 0 0 1px var(--field-border)}
```
Também acrescentar texto de estado ao lado ("Ligado"/"Desligado"), pois hoje só a posição da bolinha informa.

### ALTO

**4. Menu "⋮" anuncia padrão que não implementa (4.1.2, 2.1.1).**
`src/features/treino/Menu.tsx:20-24`: `aria-haspopup="true"` sem `role="menu"` nos itens; o foco não entra no menu ao abrir; sem setas; Tab sai e deixa o menu aberto; clique fora não devolve foco. `GerenciarOpcoes.tsx:161` usa `role="menuitem"`, então há dois padrões diferentes.
Correção: ou padronizar como menu (role="menu", itens `role="menuitem"`, foco no primeiro item ao abrir, setas, Escape devolve foco, Tab fecha), ou, mais simples, tratar como disclosure: remover `aria-haspopup`, manter `aria-expanded` e fechar em `onBlur` quando o foco sai do contêiner.
```tsx
<div onBlur={e=>{ if(!box.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
```

**5. Seletor de período declara listbox mas não é (4.1.2).**
`Evolucao.tsx:37-41`: `role="listbox"` com `<button role="option">`, sem foco no item, sem setas, sem `aria-activedescendant`. Correção: trocar por três botões `aria-pressed` em `.segmented` (4/8/12 semanas), mais curto e igual ao padrão do resto do app; ou menu de botões simples sem roles de listbox.

**6. Rótulo mutável + aria-pressed = anúncio contraditório (4.1.2).**
`Executar.tsx:289` ("Reabrir série 1" com `aria-pressed=true`), `parts.tsx:55` e `Dieta.tsx:99` ("Desmarcar Almoço" com `aria-pressed=true`), `Executar.tsx:261`. O leitor lê "Desmarcar X, botão, pressionado", ambíguo. Correção: rótulo fixo descrevendo o objeto e o estado só por `aria-pressed`: "Série 1 concluída", "Almoço consumido", "Cronômetro do treino em pausa".

**7. Barra fixa "Marcar como consumido" + tabbar consomem ~195 px (uso com uma mão e zoom).**
`dieta.css:127,239` (`.dt-sticky{position:sticky;bottom:calc(64px+...)}`) com 2 linhas (mensagem + botão) sobre a tabbar de 64 px; em `final/09-refeicao.png` ela cobre a opção 2 e o texto de ajuda. Em zoom 200% ocupa quase metade da tela útil (inferido). Correção: tirar o texto de ajuda da barra (usar `aria-describedby` no botão desabilitado e texto no cabeçalho da lista), manter só o botão de 52 px, e `scroll-padding-bottom:9rem` em `main` nessa rota. Alternativa melhor: ao tocar numa opção, marcar com um botão no próprio cartão selecionado.

**8. Folhas e diálogos: foco e fundo (2.4.3, 4.1.2).**
`Sheet.tsx` e `Folha.tsx`: o foco preso só funciona com o foco dentro; clicar em área não focável e apertar Tab escapa para a página atrás; o fundo não é `inert`; `Sheet.tsx` FOCUSABLE não inclui `[tabindex]` (Folha inclui): duas cópias divergentes. A tabbar (z 5) e o conteúdo ficam navegáveis por leitor de tela. Correção: unificar em um componente, aplicar `inert` ao `#root` irmão e travar rolagem.
```tsx
useEffect(()=>{ const app=document.getElementById('conteudo'); const bar=document.querySelector('.tabbar');
  app?.setAttribute('inert',''); bar?.setAttribute('inert','');
  return ()=>{ app?.removeAttribute('inert'); bar?.removeAttribute('inert'); }; },[]);
```
Observação: o `.sheet` deve ficar fora de `main` (portal) para não ficar `inert` junto. O retorno de foco ao abridor existe e está correto em ambos; mantenha.

**9. Desfazer curto e inconsistente (2.2.1, regra do projeto).**
`UndoToast.tsx` (8 s com Desfazer, 4 s sem) e `parts.tsx` `UndoToast` (usado com `duration={5000}` em `Dieta.tsx:147`, apesar do comentário "8 s"). Dois componentes, dois tempos, e o da Dieta é `role=status` montado com conteúdo (anúncio pouco confiável), enquanto o do Treino usa região persistente. Correção: um só componente (o de Treino, região persistente), 10 s com Desfazer, pausa em foco/hover (já existe), e fechamento manual com Escape. Remover "Desmarcar consumo" sem Desfazer (`Refeicao.tsx:93`).

### MÉDIO

**10. Ações destrutivas sem confirmação e/ou sem desfazer, de forma desigual.**
`Detalhe.tsx:62` e `EditarTreino.tsx:114` ("Remover do treino") têm desfazer mas nenhuma confirmação; `Inicio.tsx:114` "Desmarcar aula" apaga a nota `feel` sem aviso nem desfazer; `Refeicao.tsx:93` idem. Regra do projeto exige confirmar e oferecer desfazer. Correção: "Remover do treino" abre `ConfirmDialog` (texto: "O exercício sai só deste treino. O histórico fica guardado.") e mantém o desfazer; "Desmarcar aula" preserva `feel` até 10 s via toast com Desfazer.

**11. Ruído de leitor de tela: três regiões `role=status` fixas em `main` mais as locais.**
`App.tsx:81-82`: "Salvando…" e "Salvo neste aparelho" mudam a cada `commit`, ou seja, a cada série marcada (2 anúncios) somados ao `ex-copied`, ao toast e ao "Preparando acesso offline…". Correção: anunciar só erro de salvamento e a primeira confirmação por sessão; `offlineText` só quando muda para "Disponível offline" ou "Sem conexão"; manter o texto visível para o olho.
```tsx
<p className="visually-hidden" role="status">{data.saving ? '' : justSaved ? 'Salvo' : ''}</p>
```

**12. Reflow a 320 px / zoom 200%: botões com `nowrap`.**
`inicio.css:33` (`.in-ghost{white-space:nowrap;font-size:.9375rem}`) em grade `1.3fr/1fr`: "Registrar outro dia" e "Trocar treino" estouram ou cortam em ~160 px por coluna; `styles.css:146` (`.segmented.soft>*{white-space:nowrap}`) idem nos rótulos. Em `capturas/r3/inicio.png` o texto já quebra no limite. Correção:
```css
@media (max-width:23.75rem){.in-pair{grid-template-columns:1fr}.in-ghost{white-space:normal;line-height:1.2;padding:8px}}
.segmented.soft>*{white-space:normal}
```
e `.tabbar span{font-size:.75rem}` aceitável, mas os rótulos de 12 px (`.ev-tile-label`, `.ev-axis`, `.dt-pct`, `.tabbar`) não crescem em zoom de texto fixo: usar `clamp(.75rem,3.2vw,.875rem)` nos rótulos de gráficos e abas.

**13. Gráficos: texto alternativo está bom, mas é lido em duplicidade e a troca de métrica não é anunciada.**
`Charts.tsx` usa `role="img"` com `aria-label` e `Evolucao.tsx` acrescenta tabelas `visually-hidden`: bom, porém o leitor lê o resumo e depois a tabela inteira. Ao alternar o `Tile` (`aria-pressed`) nada é anunciado (o gráfico é recriado por `key`). Correção: envolver o cartão em `aria-live="polite"` só com o `h2` + resumo, ou mover o foco para o `h2` do gráfico depois da troca; `aria-describedby` do `role=img` apontando para a tabela em vez de repeti-la.

**14. Duplicação de navegação em Início gera carga cognitiva.**
`Inicio.tsx:153-156` (segmentado "Treino | Dieta" com `aria-current="page"` fixo em "Treino"), `Inicio.tsx:196-197` (atalhos "Dieta" e "Evolução") e a tabbar inferior: três caminhos para Dieta numa tela só. O segmentado também usa `<nav aria-label="Seção">` com `aria-current` que nunca muda (rótulo estático, sem função para o leitor). Correção: remover o segmentado (a tabbar cobre) ou fazê-lo trocar o conteúdo ("Hoje" mostra treino e dieta do dia). Preferência: remover e manter os 2 atalhos.

**15. Sino de notificações e avatar levam ao mesmo destino.**
`App.tsx:62-63`: ambos para `#perfil`; o sino sem aviso é um falso atalho e o `bell-dot` só aparece em atualização do app. Alvos adjacentes iguais confundem leitor e toque. Correção: remover o sino e mostrar o aviso de atualização como o banner já existente; ou apontar para `#perfil` com âncora na seção de lembretes e rótulo "Lembretes".

### BAIXO

**16. Hierarquia de títulos e h1 oculto.**
`App.tsx:68`: h1 só para leitor de tela em Início, Treino e Perfil (ok), mas na refeição o h1 é "Almoço" e a tela mostra um `<p aria-hidden>` com o mesmo nome (`Refeicao.tsx:19`), e em `Refeicao.tsx` a receita usa `h4/h5` sem `h3` (salta nível). Em Executar o h1 oculto é "Treino" e o h2 é o exercício; deveria ser o nome do treino. Correção: `<h1 className="dt-topbar-title">` visível na refeição; receita `h3/h4`; título do h1 da execução = `sess.name`.

**17. Tabela de séries em `div`s.**
`Executar.tsx:283-295`: cabeçalho `aria-hidden` e linhas sem semântica; cada campo tem `aria-label` completo (bom), mas o leitor não percebe "linha 2 de 4". Correção: `role="table"/"row"/"columnheader"/"cell"` ou `<ul>` com `<li aria-label="Série 2">`. Aviso: o cabeçalho de 15 px com a cor `--foreground` e as colunas desalinhadas com 28 px na primeira coluna.

**18. Movimento e microtextos.**
`prefers-reduced-motion` está coberto globalmente (`styles.css:12,60`); porém a barra e o anel não têm alternativa para o `animation-delay` inline de `Charts.tsx:113` (neutralizado pelo `!important`: ok). Pendências de texto: "Reler dados e tentar novamente" é longo para botão; "Pedir armazenamento persistente" (`Perfil.tsx:240`) é jargão, trocar por "Proteger meus dados neste aparelho"; "RIR 3" (`Inicio.tsx:146`) sem explicação, usar "Reserva de 3 repetições (RIR 3)"; "Barlow Condensed" prevista no DESIGN.md não é carregada (`styles.css` só declara Figtree; `h1,h2,h3{font-family:inherit}`): decidir e registrar a fonte única.

## Resumo dos demais critérios (sem falha encontrada)

- Teclado: ordem natural, `Pular para o conteúdo` funciona (`App.tsx:58`), foco movido ao h1 a cada rota, `:focus-visible` 2 px com `--ring` em todos os temas; o radio visualmente oculto da Dieta tem `:has(:focus-visible)` (`dieta.css:264`). Sem atalhos de teclado personalizados.
- Alvos de toque: tabbar 62-64 px, ícones 44 px, checks 44-48 px, copos 44 px, steppers 44 px: ok. O espaço entre "Excluir" e itens vizinhos no menu é 4 px (`treino.css:26`), mitigado pelo `ConfirmDialog` com foco inicial em "Cancelar" (`Sheet.tsx:38`), boa prática.
- Imagens decorativas: `Thumb`, ilustrações e ícones usam `aria-hidden`; `focusable="false"` nos SVG de gráficos.
- Primeira experiência: Evolução vazia (`final/11-evolucao.png`) é clara, com título, explicação e botão; Início sem dados mostra "Semana 01 de 12" com anel de 8%, que é decorrido do plano e não progresso (rótulo do anel diz "Semana 1 de 12, 8%": acrescentar "do plano"). O cartão do treino de hoje usa imagem placeholder cinza com halteres duplicando o ícone do botão (`final/01-inicio.png`): remover para ficar mais limpo.
- Fidelidade "premium minimalista": coerente (hairlines, raios 12-16, azul só em ação e progresso). Desvio: `capturas/r3/inicio.png` ainda mostra sombras azuis nos botões e gradiente diagonal no cartão, que `styles.css` já neutraliza; confirmar que a build congelada é a de `final/`.
