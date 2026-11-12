# Fitnez

PWA de treino e nutrição para um plano de 12 semanas: musculação, jiu-jitsu e vôlei de praia, com dieta por refeição (opções A, B e C), receitas, progresso e medidas. Funciona sem internet.

## Stack

React 19, TypeScript e Vite, com CSS próprio. Sem back-end: os dados ficam no aparelho (IndexedDB), com backup e restauração em JSON. Hospedagem estática no GitHub Pages. Testes com Vitest e Playwright.

## Como rodar

Requer Node 24 ou superior.

```
npm.cmd ci
npm.cmd run dev
```

Outros comandos: `npm.cmd run check` (configuração, tipos, testes e build), `npm.cmd run test:e2e` (Playwright) e `npm.cmd run preview` (servir o build).

## Privacidade

Seus dados de treino, medidas e anotações ficam somente no seu aparelho. Não há conta, analytics nem envio a terceiros. Faça backups em JSON periodicamente.

## Aviso

O Fitnez não substitui nutricionista, médico ou profissional de educação física. Consulte um profissional antes de mudar treino ou dieta.

## Estrutura

`src/` aplicação, `data/` plano, dieta e receitas, `docs/` especificação e decisões, `legacy/` protótipo original (preservado), `tests/` testes.
