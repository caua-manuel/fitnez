# Frontend - correções da Dieta (QA de jornada de usuário)

- Círculo da lista: com opção escolhida marca/desmarca direto, com aviso em `role=status` e Desfazer (5 s). Sem opção, vira círculo tracejado com "+" e rótulo/aria-label "Escolher opção de <refeição>", e abre a refeição.
- Confirmação discreta: "Opção salva", "Opção duplicada" (com Desfazer), "Opção excluída" (8 s), creatina marcada/desmarcada, revisão dispensada (com Desfazer).
- Gerenciar opções: aviso quando os macros divergem mais de 10% das calorias (não bloqueia) e aviso de que a receita não muda ao editar itens; estado vazio.
- Nome da opção na lista passa a quebrar em 2 linhas (antes cortava em 1).
- Contraste AA do texto destrutivo (menu Excluir e botão "Excluir opção") verificado por teste nos dois temas.
- Pedidos a outras áreas: `src/ui/Thumb.tsx` busca MEAL_ICON com o id completo ("cafe-A"), então sempre cai em "garfo"; usar o prefixo da refeição. Domínio: a revisão semanal diz "Perda de 0,70 kg na semana, acima de 0,7 kg" (arredondamento em `weeklyReview`). `fmt` arredonda macros (34,5 g vira 35 g) por decisão de exibição.
- Observação: a porta 4173 do Playwright é compartilhada com outros agentes e gera falsos erros de console; rodei o e2e em 4203 com config temporária.
