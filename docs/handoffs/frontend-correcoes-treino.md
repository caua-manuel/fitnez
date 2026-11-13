# Front-end: correções funcionais de Treino

Origem: `docs/handoffs/qa-jornada-usuario.md` (G1, M4, M5, M6, M8, M9, M10, M11).

- G1: itens destrutivos dos menus ⋮ com texto `--destructive` sobre fundo neutro (`editor.css`); AA no claro e no escuro, validado por teste de estilo computado.
- Detalhe: "Continuar treino" quando há treino parcial hoje; a tabela de séries foi trocada por "Meta: N séries · faixa" e "Hoje: X de N séries feitas". A Execução abre no primeiro exercício com série pendente (`firstIncomplete` em `util.ts`).
- Execução: aviso "Usei 70 kg × 8 da série anterior." e campos com estilo sugerido por 2,5 s. "Concluir treino" com exercícios intocados abre confirmação (`ConfirmDialog` ganhou `tone` e `cancelLabel`).
- Biblioteca: busca por nome de exercício, com a linha "Tem Supino com halteres".
- Treino criado: faixa "Treino criado. Para usá-lo num dia da semana, toque em Trocar treino, no Início." com "Começar agora". O botão no Início se chama "Trocar treino", por isso o texto não diz "de hoje".
- Textos: `repsText` não acrescenta "repetições" a "10 por lado" e "30-40 s"; a aba Detalhes mostra "Meta da Semana 1 de 12".
- Salvamento: "Treino salvo." no aviso e inline no editor.

Fora do escopo, observado: o rótulo "Biblioteca" ativo no controle segmentado tem texto claro sobre azul claro (baixo contraste); fica em `Treino.tsx`/estilos compartilhados.
