# Front-end: pendências do Hoje (atalho, treino livre editável, aquecimento manual)

Data: 19/11/2026. Responsável: `frontend`. Sem dependência nova; sem mudança em `src/domain` nem na camada de dados.

## O que entrou

1. **Atalho "Treino de hoje"** (`src/pwa/build.ts`): aponta para a nova rota `#treino/_/hoje` (`TreinoView` `'hoje'` em `src/app/router.ts`; o `_` segue a convenção do "novo" e não colide com ID de treino). `TreinoHoje` (em `treino/Treino.tsx`) resolve o dia com `phaseOf` + `activityFor` e faz `location.replace`: dia de academia abre `Executar` do treino do dia (`?dia=`), treino já concluído abre o Concluído, e qualquer outro caso (esporte, descanso, antes do início, plano concluído) cai no `#inicio`, que já explica o dia. `scripts/verify-build.ts` aceita atalho com caminho (`#a/b_c`) e exige `Treino de hoje` em `${base}#treino/_/hoje`.
2. **Treino livre na execução** (`treino/Executar.tsx`): botão "Adicionar exercício" abaixo de "Adicionar série" (só no livre) abre a folha com busca e acrescenta o exercício no fim do `?ex=`. No menu ⋮ do exercício, enquanto ele não tem série feita nem valor digitado: "Mover para cima", "Mover para baixo" e "Remover do treino". Antes de mudar a lista, o que já foi digitado é gravado (`persist`). O cursor vai para o exercício escolhido ou movido, e a URL muda com `location.replace`.
3. **Aquecimento manual**: o número da série (ou o "A") é um botão de menu (`Opções da série N` / `Opções do aquecimento N`, que funciona por teclado), com "Marcar como aquecimento", "Marcar como série de trabalho" e, para "A" ainda não feito, "Dispensar aquecimento" (remove a linha sem gravá-la como série). A mudança de forma é gravada mesmo sem valores (`reshaped`), para que a linha dispensada não volte ao recarregar. Usa `kind: 'warm'`, e o domínio já tira o aquecimento de volume, recordes, progressão e "Antes".

## Verificação (resultados reais)

- `npm run typecheck` verde; `npm test` 536/536.
- `npm run build`: JS 199,0 KB de 215 KB; CSS 23,7 KB de 28 KB (gzip); artefato verificado.
- e2e novos em `tests/e2e/pendencias-hoje.spec.ts` (4 testes): atalho em dia de academia e em dia sem academia; adicionar, mover e remover no livre, sem perder a série concluída nem a digitada (com reload); dispensar, marcar por teclado e desmarcar o aquecimento (com `sets` 0 e depois 1). Todo reload espera a gravação com `expect.poll`.
- Ajuste em `hoje-livre-atalhos.spec.ts`: o teste do manifesto agora fixa o relógio numa quinta sem academia. Antes dependia da data real.
- Capturas em 390 px, claro e escuro, em `capturas/pendencias-hoje/`.

## Observações

- O alvo do número da série tem 44 px de altura, e um `::before` o alarga para 44 px sem alargar a coluna da grade.
- Um aquecimento marcado à mão numa linha sem sugestão do domínio não tem placeholder: o ✓ pede as repetições, como no aquecimento sem carga.
