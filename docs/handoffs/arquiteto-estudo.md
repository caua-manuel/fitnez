# Handoff: arquiteto, material de estudo

Data: 20/11/2026. Só documentação; nenhum arquivo em `src/`, `tests/` ou `docs/decisoes/` foi alterado.

Criados em `docs/estudo/`: `README.md`, `dupla-progressao.md`, `migracao.md`, `fila-de-gravacoes.md`. Cada um tem problema,
fluxo com caminho:linha, casos de borda, testes por caso (nomes copiados dos arquivos), glossário e um exercício sem solução.

Achados conferidos em execução avulsa (teste temporário fora do repositório, já descartável):
- `src/app/commitQueue.ts`: uma mutação que gera estado inválido fica em `pending`; todo commit seguinte falha com a mesma
  mensagem até recarregar a página. Virou o exercício de `fila-de-gravacoes.md`. Recomenda-se o `backend-dados`/`frontend`
  avaliar se corrige antes do dono.
- `src/domain/progression.ts`: faixa `"8 a 12"` (aceita pelo editor) desliga a progressão sem aviso. Exercício de
  `dupla-progressao.md`.

Achado só por leitura: `src/features/treino/Detalhe.tsx:45` monta o histórico sem `workingHistory`, descartando `kind`;
o aquecimento entra na sugestão do Detalhe. Para o `frontend` avaliar.

Exercício de `migracao.md` (`opt` para sessão inexistente) refina o passo 4 da migração no ADR 002; se for implementado, o
ADR precisa de nota.
