# Handoff frontend: Entrega A, Tarefa 1 (sistema visual e marca)

- Criados: `src/ui/tokens.ts` (`palette`, `contrast`), `src/ui/Logo.tsx` (`Logo({ size?, withTagline? })`), `tests/unit/tokens.test.ts`.
- Reescrito: `src/ui/styles.css`. Os tokens vêm primeiro (`:root`, `[data-theme="dark"]` e automático por `prefers-color-scheme`). Depois vem o CSS da Fase 1, mantido para as telas antigas. Por último as regras novas, que prevalecem: `.card`, `.button` (`.secondary`, `.destructive`, `.block`), `.icon-button`, `.chip`, `.segmented`, `.ring` (usa `--value` de 0 a 100), `.bar`, `.tabbar` (5 colunas), `.sheet`, foco de 3px, safe area, `prefers-reduced-motion`.
- Contrastes verificados pelo teste: os pares do DESIGN.md 2.1 passam nos dois temas. Nenhuma divergência.
- Pendências: o CSS antigo e o novo coexistem até a troca das telas (limpar na Tarefa 14). Sem verificação visual no navegador. `icons.tsx` não foi criado.
