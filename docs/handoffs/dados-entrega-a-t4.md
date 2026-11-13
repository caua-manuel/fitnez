# Handoff dados: Entrega A, Tarefa 4 (sugestão de carga)

- Criados `src/domain/progression.ts` e `tests/unit/progression.test.ts` (TDD: falha vista antes).
- `suggestNext` é puro e somente sugere; nada grava nem preenche carga. Reusa `parseNumber`, `SetEntry` e `setsForWeek` de `workout.ts` (não alterado).
- Regras: sem histórico -> kg null; topo da faixa em todas as séries previstas -> +2,5 kg (superior) ou +5 kg (inferior); senão manter; volume caindo em 2 sessões seguidas (3 pontos) -> reduzir (mantém a carga da última sessão, a redução de séries é decisão do usuário); estagnação = últimas 3 sessões sem superar a primeira em carga máxima nem repetições totais.
- Entradas inválidas são ignoradas (sessões sem série válida contam como sem histórico); nunca devolve NaN.
- Pendente para revisão do `conteudo-treino-nutricao`: o "reduzir" não sugere corte de 30-40% das séries, apenas sinaliza.
