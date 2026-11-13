# Componentes de interface compartilhados (src/ui)

Para os agentes das features adotarem. Substituem as cópias locais (`features/treino/Sheet.tsx`, `UndoToast.tsx`, `Menu.tsx`, `Folha`, `parts.tsx UndoToast`, seletor de período da Evolução).

## Sheet (`src/ui/Sheet.tsx`)
- `<Sheet title onClose initialFocus? className?>filhos</Sheet>`: renderiza em portal no `body`; `role="dialog"`, `aria-modal`, título `h2` associado por `aria-labelledby`.
- Foco inicial: `initialFocus` (seletor) ou o primeiro foco seguro (ignora `.destructive`, `.danger`, `[data-destructive]`). Armadilha de foco, Escape e fundo fecham, foco volta ao elemento de origem (ou `[data-focus-fallback]`, ou `#conteudo`).
- Isola o resto do app (`inert` + `aria-hidden` nos irmãos do portal, inclusive folhas empilhadas) e trava a rolagem do corpo. Rolável internamente, acima da tabbar (z 30/31).
- Classes úteis: `.sheet-body`, `.sheet-actions`. `ConfirmSheet({title, confirmLabel, cancelLabel?, destructive?, onConfirm, onCancel})` já vem com foco em "Cancelar".

## UndoToast (`src/ui/UndoToast.tsx`)
- `showToast(mensagem, desfazer?)`, `dismissToast()`; `ToastHost` já está montado uma vez em `App.tsx` (não monte outro).
- Tempo único de 6 s (`TOAST_MS`); pausa com foco ou ponteiro; Escape dispensa; região `role=status` persistente com só o texto (anúncio único); botão Desfazer fora da região, alcançável por Tab.

## Menu (`src/ui/Menu.tsx`)
- `<Menu label trigger items={[{label, onClick?|href?, danger?}]} align? />`: botão `aria-haspopup="menu"` + `aria-expanded`; itens `role=menuitem`; foco no primeiro item; setas, Home, End; Escape devolve o foco ao botão; Tab fecha; toque fora fecha.

## Select (`src/ui/Select.tsx`)
- `<Select label value options onChange trigger? />`: botão `aria-haspopup="listbox"`; `role=listbox` com `role=option` e `aria-selected`; foco na opção atual; setas, Home, End, Enter/Espaço, Escape, Tab. Uso previsto: período da Evolução.

## Outras mudanças de base
- `data.notice` agora some em 8 s, ao trocar de rota ou com o botão "Dispensar"; `data.clearNotice()` disponível. Região `role=status` persistente.
- Sino do cabeçalho abre a folha "Avisos" (backup pendente com dados do usuário, nova versão do app); ponto azul só com aviso.
- Interruptor desligado: trilho `#76849B` (claro) e `#6F82A8` (escuro), >= 3:1; ligado com polegar em `--primary-foreground`. Pendência para features: mostrar texto "Ligado/Desligado" ao lado do interruptor.

## Testes
- Unitários: `tests/unit/ui-base.test.ts` (estrutura/aria de Menu, Select, ToastHost) e contraste em `tests/unit/tokens.test.ts`.
- E2E: `tests/e2e/base-ui.spec.ts` cobre aviso, Sheet (via sino), inert, foco e Escape. Menu, Select e Toast com aviso não têm tela que os use ainda: o e2e de comportamento fica para quando as features adotarem.
