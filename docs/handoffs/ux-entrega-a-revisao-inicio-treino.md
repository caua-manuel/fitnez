# UX Entrega A: revisão de Início e Treino

Escopo: leitura de `src/app/App.tsx`, `src/features/inicio/Inicio.tsx`, `src/features/treino/*.tsx`, `treino.css`, `src/ui/styles.css`, `DESIGN.md` e telas de referência tela-7 (Início), tela-4 (Meus Treinos), tela-3 e tela-2 (cabeçalho e padrões).
Limitação: `test-results/` só tem `.last-run.json`; não existem capturas (inicio-*-360.png etc.). Tudo abaixo vem do código e das referências, sem inspeção visual no navegador. Confirmar em 360x800 após as correções.

## Prioridade alta

1. **Saudação e semana vêm depois de h1, faixa de status e aviso (Início).** Em `App.tsx` linhas 45 e 48 e em `Inicio.tsx` linha 113.
   - Tornar o h1 visualmente oculto só no Início (a tela-7 não mostra título): `<h1 ref={heading} tabIndex={-1} className={route.tab==='inicio' ? 'visually-hidden' : undefined}>`. A classe `.visually-hidden` já existe e não impede o `focus()`.
   - Remover a margem do wrapper: `<div className={route.tab==='inicio' ? undefined : 'page-heading'}>`. Sem isso restam 28px vazios (`.page-heading{margin-bottom:1.75rem}`).
   - Mover `<BackupReminder />` para depois do bloco `.shortcuts`, como `warning-soft` compacto. Não deve ficar antes da saudação.
   - Resultado esperado: logo, saudação, "Semana 04 de 12" e anel acima da dobra, como na tela-7.

2. **Faixa "Disponível offline / Salvo neste aparelho" compete com o cabeçalho (todas as telas).** `App.tsx` linha 45, `.system-status`.
   - Tirar a faixa fixa do topo. Manter um `<div role="status" className="visually-hidden">` permanente.
   - "Salvo neste aparelho" aparece como texto discreto por ~3 s só após gravar (DESIGN seção 8: só depois de gravar).
   - "Disponível offline" vai para Perfil, em "Dados neste aparelho". Estados de erro ou "Preparando…" podem continuar como aviso, só quando houver problema.
   - Se for mantida a linha, mover para o rodapé do `main` (acima da barra), `font-size:.875rem` (hoje .75rem, pequeno demais).

3. **Seletor Treino/Dieta do Início não mostra o ativo em azul.** `Inicio.tsx` linha 126 usa `className="segmented soft"`, e `.segmented.soft>[aria-pressed=true]` dá fundo branco com texto azul sobre trilho cinza quase igual. A tela-7 tem pílula azul cheia com ícone.
   - Trocar por `className="segmented"`.
   - Semântica: "Dieta" é link de navegação dentro de `role="group"` com botão `aria-pressed="true"` que não faz nada. Usar dois `<a>` com `aria-current="page"` no Treino e ajustar o seletor CSS `.segmented>[aria-current=page]`, ou aceitar o desvio e registrar.
   - Trocar os `&nbsp;` por `gap:8px` no CSS.

4. **Opção selecionada em "Trocar treino de hoje" não aparece.** `Inicio.tsx` linha 138. `button.button.secondary` (especificidade 0,2,1) vence `button[aria-pressed=true]` (0,1,1), então ativo e inativo ficam idênticos.
   - Adicionar em `styles.css`: `.button.secondary[aria-pressed=true]{background:var(--accent-soft);border-width:2px}`.
   - Acrescentar texto "Selecionado" ou ícone de marca dentro do botão ativo (não depender só de cor).
   - Para o seletor de nota 1 a 5 (`.segmented.soft`), o ativo é branco sobre cinza claro: acrescentar `box-shadow:0 0 0 2px var(--primary) inset` ou `font-weight:800`.

5. **Campo de data sem estilo e abaixo de 48px.** `Inicio.tsx` linha 145. `input[type=date]` não está na regra de campos (`styles.css` linha 40 cobre text, search, number e sem type).
   - Adicionar `input[type=date]` ao seletor; `min-height:48px;width:100%`.
   - O `label` precisa de texto mais explicativo, por exemplo "Dia do registro".
   - Após escolher a data o `notice-day` já avisa; está correto.

6. **Estado Concluído/Pendente sem ícone e fora do padrão (Treino).** `Treino.tsx` linha 41, `.tr-badge` em `treino.css`.
   - DESIGN seção 6: Concluído em `accent-soft` com texto `primary` e ícone de marca; Parcial `warning-soft`; Pendente `secondary` com círculo vazio. Hoje Concluído usa `success-soft` e nenhum estado tem ícone.
   - Mudar `.tr-badge.done{background:var(--accent-soft);color:var(--primary)}` (4,87:1 no claro, 4,76:1 no escuro).
   - Inserir SVG `aria-hidden` de 16px antes do texto: marca no done, círculo vazio no pending, relógio ou meio círculo no partial.
   - Dias de descanso, jiu-jitsu e vôlei em "Meu plano" não têm etiqueta, e isso está certo.

7. **Estado vazio da Biblioteca incompleto e sem aviso ao leitor de tela.** `Biblioteca.tsx` linha 30.
   - Texto atual: "Nenhum treino encontrado." Trocar por "Nenhum treino encontrado para esta busca." mais botão secundário "Limpar busca" (`setQuery(''); setFilter('todos')`).
   - Envolver a lista e o vazio em `<div aria-live="polite">`.
   - Marcador `.tr-empty` hoje só tem texto cinza; adicionar `text-align:center` e padding de 32px.

## Prioridade média

8. **Ícone de "Registrar outro dia" é a casa.** `Inicio.tsx` linha 144 usa `<Icon name="inicio">`.
   - `src/ui/icons.tsx` só tem inicio, treino, dieta, evolucao, perfil, sino. Adicionar `editar` (lápis): `<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>`.
   - Usar `<Icon name="editar" size={20} />` e tornar o ícone `aria-hidden`.
   - Para "Minutos" do cartão (linha 59), o ícone é o halter; a referência usa relógio. Adicionar `relogio` (`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`).
   - Ainda na linha 59: `sess.min` é impresso cru; usar `minutesLabel(sess.min)` de `treino/util.ts` para igualar o formato "55 min" das outras telas.

9. **Hierarquia da saudação e do anel mais fracas que a referência.** `styles.css` regras `.hero-title` e `.ring`.
   - `.hero-title{font-size:1.75rem;font-weight:800;line-height:1.1}` (hoje 1,5rem; a referência destaca "Semana 04 de 12" como o maior texto).
   - A saudação `Olá!` com `font-size:1.0625rem`, mantida em `muted-foreground`.
   - Anel 96px para 104px: `.ring{width:104px;height:104px}`, `.ring::before{inset:11px}`, e acrescentar `flex:none` para ele não encolher.
   - Anel com `role="img"`; DESIGN pede `role="progressbar"` com `aria-valuenow/min/max` ("Semana 4 de 12, 33%").
   - Nomes longos: adicionar `.hero p,.hero-title{overflow-wrap:anywhere}`; hoje "Olá, <nome de 80 caracteres>!" estoura a coluna em 360px.

10. **Ações secundárias do Início ocupam altura demais.** `Inicio.tsx` linhas 135 a 146.
    - "Trocar treino de hoje" e "Registrar outro dia" empilhados somam ~120px, empurrando os atalhos abaixo da dobra. A tela-7 tem os dois lado a lado.
    - Agrupar em `<div className="pair">` com `display:grid;grid-template-columns:1fr 1fr;gap:8px` e `.pair .button{font-size:1rem;padding:0 8px;min-height:48px}`; permitir quebra de linha (já há `overflow-wrap:anywhere` na base).
    - As áreas expansíveis (lista de treinos e data) ocupam a largura inteira abaixo do par.
    - Atalhos: ícone em quadro `accent-soft` 40px e seta ">" à direita como na tela-7 (`.shortcut svg` hoje sem quadro).

11. **Campo de busca, abas do detalhe e caminho sem saída (Treino).**
    - Busca (`Biblioteca.tsx` linha 25): sem lupa e sem cor de placeholder definida; o padrão do navegador fica abaixo de 4,5:1 sobre `secondary`. Adicionar `input::placeholder{color:var(--muted-foreground);opacity:1}` e ícone de lupa à esquerda (`padding-left:44px`, SVG `aria-hidden`).
    - Abas do detalhe (`Detalhe.tsx` linha 72): `role="tablist"` sem `role="tabpanel"`, sem `aria-controls` e sem setas. Adicionar tabpanel com `aria-labelledby` e `onKeyDown` para Esquerda/Direita/Home/End, com `tabIndex` roving.
    - O ativo em `.segmented.soft` fica branco sobre cinza claro; acrescentar `box-shadow:0 1px 3px rgb(11 23 48/.18)` ao ativo.
    - Rotas ainda não entregues (`Treino.tsx` linha 57: "Esta tela chega na próxima etapa.") ficam atrás de "Começar treino" e "Editar exercício", que são as ações principais. Reescrever o texto para o usuário ("Esta tela ainda não está disponível neste teste.") e dar a ela um `h2`. Registrar para o orquestrador que o fluxo central está bloqueado até a execução entrar.
    - Menu ⋮ do exercício (`Detalhe.tsx` linha 40): não fecha com Escape nem devolve o foco ao botão.

## Prioridade baixa

12. **Detalhes de acabamento e fidelidade.**
    - "← Voltar aos treinos" (`Detalhe.tsx` linha 59): a seta é texto e o leitor lê "seta para a esquerda". Usar um SVG `aria-hidden` e rótulo "Voltar".
    - Biblioteca usa `h3` sem `h2` antes (`Biblioteca.tsx` linha 35). Acrescentar `<h2 className="visually-hidden">Treinos</h2>` ou trocar por `span` como em "Meu plano".
    - Frase "(só uma sugestão; você define a carga)" repete em cada cartão (`Detalhe.tsx` linha 50). Mostrar uma vez acima da lista.
    - Cartões da lista não têm ícone de halter em quadro `secondary`, data e menu ⋮ como na tela-4; a tela-4 tem "Meus Treinos" com subtítulo, enquanto o app mostra só "Treino". Acrescentar `<p className="muted">Seu plano e a biblioteca de treinos</p>` abaixo do h1.
    - Carregamento: `App.tsx` linha 51 mostra apenas "Abrindo seus dados…"; DESIGN pede esqueleto da silhueta, estático com movimento reduzido.
    - Sino e avatar levam ao mesmo destino (Perfil). Aceitável hoje, mas o sino deve levar ao aviso de backup quando houver ponto azul.

## Verificado e sem problema

Alvos de 44px em `.icon-button`, `.chip`, `.link-button`, `.tr-menu` e `.tr-back`; botão principal 52px; foco 3px com offset 3px sem remoção; `aria-pressed` em filtros; `aria-current` na barra; nomes longos de treino e exercício quebram (`overflow-wrap:anywhere` em `.tr-row .grow>span`, h2 e h3); contraste dos tokens conforme a tabela 2.1 do DESIGN.
