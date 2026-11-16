# Fitnez

Treino e dieta em um só lugar. O Fitnez é um aplicativo web instalável (PWA) para acompanhar um plano de 12 semanas de treino (musculação, jiu-jitsu e vôlei de praia) e uma dieta por refeição, com progresso e medidas. Seus dados ficam no próprio aparelho e o app funciona sem internet.

## Recursos

- Plano de 12 semanas com o treino do dia, execução série a série, cronômetro de descanso e histórico de cargas.
- Dieta por refeição com opções A, B e C, receitas, calorias, macros e água.
- Evolução: peso, medidas e constância em gráficos simples.
- Tema claro, escuro ou automático.
- Instalável na tela inicial e disponível offline depois da primeira abertura.
- Backup e restauração dos dados em arquivo JSON.

## Stack

React 19, TypeScript e Vite, com CSS próprio e fonte Figtree distribuída com o app. Sem back-end: os dados ficam no IndexedDB do aparelho. Hospedagem estática (GitHub Pages). Testes com Vitest e Playwright.

## Como rodar

Requer Node 24 ou superior.

```
npm.cmd ci
npm.cmd run dev
npm.cmd test
npm.cmd run build
```

Outros comandos: `npm.cmd run check` (configuração, tipos, testes e build), `npm.cmd run test:e2e` (Playwright) e `npm.cmd run preview` (servir o build). Em sistemas que não sejam Windows, use `npm` no lugar de `npm.cmd`.

## Estrutura de pastas

- `src/` aplicação: `domain/` regras, `data/` e `application/` persistência e casos de uso, `features/` telas, `ui/` design system, `pwa/` geração do manifesto e do service worker.
- `data/` plano, dieta e receitas (JSON).
- `public/` ícones, fontes, fotos (`img/`) e `sw.js` modelo.
- `tests/` testes unitários, de integração e e2e.
- `docs/` especificação, decisões e entregas por área; `legacy/` protótipo original, preservado.
- `DESIGN.md` sistema visual.

## Como trocar as fotos

As miniaturas de refeições, exercícios e treinos usam arquivos em `public/img/<meal|exercise|hero>/<id>.jpg`. Substitua o arquivo mantendo o nome. Para um id novo, coloque o arquivo e inclua o id em `src/ui/photos.ts`. Sem foto, o app mostra um ícone discreto. Depois de mudar fotos, rode `npm.cmd run build` para atualizar o cache offline. Detalhes e proporções em `docs/handoffs/frontend-fotos.md`.

## Aviso de saúde

O Fitnez não substitui nutricionista, médico ou profissional de educação física. Consulte um profissional antes de mudar treino ou dieta e pare qualquer exercício que cause dor.

## Privacidade

Treinos, medidas e anotações ficam somente neste aparelho. Não há conta, analytics nem envio de dados a terceiros. Faça backup em JSON periodicamente, pois limpar os dados do navegador apaga o histórico. Nenhum dado pessoal é guardado neste repositório.

## Como usar (para qualquer pessoa)

1. Abra o app no navegador do celular ou do computador e, se quiser, instale na tela inicial (menu do navegador, "Instalar app" ou "Adicionar à tela inicial").
2. Em Perfil, escolha a data de início do plano e informe seus dados físicos. O plano de treino e as metas de dieta que vêm de fábrica são um exemplo e podem ser ajustados ao seu caso.
3. Use as abas Início, Treino, Dieta e Evolução no dia a dia. Tudo funciona sem internet depois da primeira abertura.
4. Em Perfil, baixe um backup em JSON de vez em quando. Você também pode exportar cargas, medidas e dieta em CSV para abrir em planilha.
5. Para zerar tudo, use "Apagar todos os meus dados" no Perfil. Isso não tem volta, por isso baixe um backup antes.

Seus dados ficam só no seu aparelho. Para ter o seu próprio endereço, faça um fork do repositório e publique no GitHub Pages seguindo `docs/PUBLICACAO.md`.

## Licença

MIT. Veja o arquivo `LICENSE`.
