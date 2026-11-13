# Frontend, Entrega A, Tarefas 7 e 8

- `src/app/commitQueue.ts` (novo): `createCommitter`, fila única, atualização otimista, reaplicação da mutação em conflito (uma tentativa), `false` sem perder o valor local em falha. `DataProvider` expõe `commit`; `run`/`refresh` mantidos (refresh readota o estado preservando mutações ainda não gravadas).
- `src/app/router.ts`: `parseRoute`/`hrefFor` (hash). `App.tsx`: cabeçalho Fitnez (Logo, sino e avatar para Perfil), h1 único com foco por rota, link Pular para o conteúdo, status Salvando…/Salvo neste aparelho, aviso de atualização do PWA, `TabBar` de 5 abas escondida em treino/executar.
- `src/ui/icons.tsx`, `TabBar.tsx` novos; `styles.css` ganhou estilos do cabeçalho; `BackupReminder` aponta para `#perfil`.
- Telas: Início e Treino são marcadores honestos (Tarefas 9 a 12 substituem); Dieta e Evolução usam `FoundationPages`; Perfil renderiza `More`. Não apagar `FoundationPages` até a Tarefa 14.
- Verificar: `npx.cmd vitest run tests/unit/router.test.ts tests/integration/commit.test.ts` e `npm.cmd run typecheck`. Nota: o Vitest falha com "Cannot read properties of undefined" se o cwd for `/c/...` no Git Bash; use `C:/...`.
- O e2e da Fase 1 quebra nos rótulos antigos (adaptar na Tarefa 14).
