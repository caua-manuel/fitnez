# Proteção da edição manual do cardápio

Em Dieta → refeição → Gerenciar opções, salvar uma alteração real marca a opção como editada e mantém os alimentos internos (`foods`). Salvar com os mesmos valores fecha o formulário sem nova gravação. Duplicar copia a marca.

Nas opções editadas, Trocar abre a confirmação com foco em Cancelar. Cancelar, Esc ou tocar fora fecham a folha sem gravar. Trocar mesmo refaz os itens e totais pelo mecanismo existente. A troca mantém o nome atual e limpa a marca quando é concluída. Desfazer restaura a opção anterior completa, com a edição e a marca.

## Decisões

- A marca é opcional e vale a partir da primeira edição feita nesta versão. Cardápios antigos continuam válidos sem migração. O backup preserva a marca e recusa valores que não sejam booleanos. O compartilhamento de plano conserva seu formato de treino.
- A confirmação vale para a revisão exibida ao abrir a folha. Se outra gravação mudar essa revisão antes da troca, o app usa o aviso de conflito existente.
- As capturas novas ficam em `capturas/dieta/`, pasta já ignorada no Git. O `.gitignore` recebeu `.roast/` no commit separado `1ec10e8`.

## Verificação

- Antes da correção, o Chromium reproduziu a perda dos itens editados nos dois temas. A validação também aceitou três tipos inválidos para a marca.
- `npm.cmd run check` passou em `C:\Projeto-Treino`. Foram 20 testes de configuração e 1.427 testes em 60 arquivos. JS inicial gzip de 194,0 KB antes para 194,3 KB depois, com limite de 205 KB. JS total de 262,1 KB com limite de 300 KB. CSS inicial de 22,9 KB com limite de 26 KB.
- `npx.cmd playwright test dieta-confirma-troca.spec.ts --headed` passou nos três cenários. Em 390 × 844, foram conferidos os temas claro e escuro, o foco inicial, a navegação por Tab, Esc, alvos de toque, cancelamento, confirmação e Desfazer.
- Capturas conferidas em `capturas/dieta/confirma-troca-claro.png` e `capturas/dieta/confirma-troca-escuro.png`.
- Pendências da tarefa: nenhuma.

## Retorno

A branch da entrega é `codex/dieta-confirma-troca` e o commit da correção está marcado com `codex-dieta-ok`. Para voltar à branch anterior, use `git switch main`. O ponto de retorno anterior às alterações é a tag `ponto-seguro-dieta`, no commit `70effaa`.
