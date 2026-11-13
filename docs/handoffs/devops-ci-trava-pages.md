# DevOps: CI multiplataforma e trava do Pages

- playwright.config.ts: comando npm/npm.cmd por plataforma; URL e preview derivados de VITE_BASE_PATH (padrão /Projeto-Treino/) e E2E_PORT (padrão 4173).
- tests/e2e/fase1.spec.ts: goto relativo ('#treino') no lugar da base hardcoded.
- pages.yml: VITE_BASE_PATH=/fitnez/ no job; configure-pages, upload e job publicar só com vars.PUBLICAR_PAGES == 'true' em main.
- docs/PUBLICACAO.md: passo a passo do dono. Pages não habilitado; nada publicado, sem commit/push.
