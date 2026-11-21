# Handoff devops: orçamento em duas medidas e isolamento da demo (ADR 011)

O que mudou:
- `scripts/build-budget.ts` (novo): funções puras com os limites do ADR 011 (total JS 250 / CSS 32; carga inicial JS 205 / CSS 26; cada chunk sob demanda JS 20 / CSS 4, em KB gzip) e as checagens da demo.
- `scripts/verify-build.ts`: substitui a soma única de 215/28 KB pelas três medidas, imprime as três linhas e aponta para o ADR 011 no comentário.
  - Carga inicial: arquivos de `assets/` citados no `dist/index.html` por `script src`, `link rel=modulepreload` e `link rel=stylesheet`.
  - Chunk sob demanda: todo `assets/*.js|css` que não está na carga inicial.
- Isolamento da demo (passa hoje, sem `src/demo/`):
  - nenhum arquivo de `src/` fora de `src/demo/` importa `src/demo/` de forma estática (`import`, `import '...'`, `export ... from`). Isso vale também para `src/app/`;
  - são permitidos `import()` dinâmico e `import type`/`export type`, que somem na compilação;
  - os pontos de entrada `import()` para `src/demo/` dão o nome do chunk, e nenhum chunk com esse nome pode aparecer no `index.html`.
- `scripts/build-budget.test.ts` (novo, 10 casos). Ele entra no `test:config` por um `import` no fim de `scripts/csp-check.test.ts`, porque o pedido proibia editar `package.json`. Recomendo listar o arquivo direto no script `test:config` quando for permitido.

Para quem criar `src/demo/`: dê ao ponto de entrada um nome próprio (ex.: `src/demo/gerador.ts`). Se ele se chamar `index` (ou se a importação for `import('../demo')`), a checagem falha de propósito, porque o chunk se confundiria com o `index-*.js` principal.

Medidas atuais (`npm run build`, KiB gzip):
- Carga inicial: JS 192,8 de 205; CSS 22,7 de 26.
- Total: JS 199,1 de 250; CSS 23,7 de 32.
- Maior chunk sob demanda: JS `Assistente` 6,3 de 20; CSS `Assistente` 1,0 de 4 (2 chunks).

Verificado: `npm run test:config` (19 testes) e `npm run build` passam. Workflow do Pages sem mudança (já roda `npm run check`). Sem commit nem push.
