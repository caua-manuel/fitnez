# Estudo do código

- [dupla-progressao.md](dupla-progressao.md): como o app sugere a próxima carga (`src/domain/progression.ts`) e preenche cada série (`src/domain/setPlaceholder.ts`).
- [migracao.md](migracao.md): como os dados do protótipo e os backups v1, v2 e v3 entram no IndexedDB sem perder nada (`src/data/migration.ts` e vizinhos, ADR 002).
- [fila-de-gravacoes.md](fila-de-gravacoes.md): como cada alteração aparece na hora e é gravada em fila única, sobrevivendo a conflitos entre abas (`src/app/commitQueue.ts`, `src/app/DataProvider.tsx`).
