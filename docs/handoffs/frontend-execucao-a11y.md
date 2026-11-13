# Frontend: execução e treino, correções da auditoria de acessibilidade

Escopo: `src/features/treino/`, itens 1, 4 (menu), 6, 10 e 12 de `ux-auditoria-final.md`.

- Rodapé da execução: descanso em uma linha (relógio, −15 s, +15 s, Pular) e "Concluir treino" de 44 px. Altura medida com ResizeObserver e publicada em `--ex-footer-h`, usada pelo espaçador, por `scroll-padding-bottom` e por `scroll-margin-bottom` dos campos. Em viewport baixo (até 26 rem) o rodapé vira estático.
- Rótulos estáveis com `aria-pressed`: "Série N concluída" e "Cronômetro do treino em pausa". Testes atualizados.
- "Remover do treino" (detalhe e editor) agora abre confirmação e mantém o Desfazer. "Desmarcar aula" não está em `features/treino` (é do Início).
- Menus ⋮: removido `aria-haspopup` (padrão disclosure) e o menu fecha quando o foco sai dele.
- `white-space:nowrap` removido de abas e fatos do detalhe. `.in-ghost` é de `features/inicio`: pedido pendente ao responsável.
- Não adotei Sheet/UndoToast/Menu de `src/ui` (conforme combinado).
- Testes novos: rodapé não cobre campo focado em 320x640 com descanso; aria-pressed estável; confirmação ao remover (detalhe e editor).
