# Handoff — devops_github — fundação Fase 1

Agente real devops_github. Escrita sequencial concluída; próximo dono pode avançar.

- Criados package.json/package-lock.json, tsconfig.json, vite.config.ts, vitest.config.ts, index.html, scripts/base-path.ts e seu teste Node; src/domain/.gitkeep. .gitignore inclui artefatos locais/testes.
- Dependências reais instaladas: React/ReactDOM 19.3.0, TS 6.0.3, Vite 8.3.1, Vitest 5.0.2, fake-indexeddb 6.2.5, @playwright/test 1.64.1 e @types. Justificativas e versões no ADR003; nenhum extra.
- Base padrão /Projeto-Treino/, override VITE_BASE_PATH validado, derivação do repositório no CI e suporte a Pages raiz. Target Safari16; dev 0.0.0.0:5173 e preview 0.0.0.0:4173.
- index.html é apenas o documento de entrada para /src/main.tsx, a ser criado pelo frontend. Não houve escrita de UI/dados, legacy, sementes ou skills.

## Evidências reais

- `node --version`: v24.19.0; `npm.cmd --version`: 11.17.0.
- Primeiro `npm.cmd install --fetch-retries=0 --fetch-timeout=10000 --logs-dir=./.npm-logs --no-audit --no-fund`: EACCES ao acessar registry.npmjs.org/@playwright%2ftest; log local em .npm-logs. npm.ps1 também é bloqueado pela política local, por isso usar npm.cmd.
- Nova tentativa `npm.cmd install --offline --fetch-retries=0 --logs-dir=./.npm-logs --no-audit --no-fund`: exit 0. `npm.cmd ls --depth=0`: todos os dez pacotes de dependências declarados presentes nas versões exatas, exit 0. Lockfile não foi simulado.
- `npm.cmd run test:config`: 3 testes, 3 passaram; cobre base padrão/override/CI/raiz e rejeição de caminhos inválidos.
- `npm.cmd run typecheck`: exit 0 na fundação atual.
- `npm.cmd test -- --passWithNoTests`: runner Vitest 5.0.2 executou, encontrou ZERO testes de produto. Não conta como suíte de produto aprovada.
- `npx.cmd vite --version`: 8.3.1; `npx.cmd playwright --version`: 1.64.1.
- `npm.cmd run build`: Vite executou e falhou por ausência de /src/main.tsx, ainda não implementado pelo dono frontend. Nenhum stub foi criado para esconder a pendência.

## Continuidade

Backend pode consumir os pacotes já instalados e escrever testes nos includes de vitest.config.ts. Frontend cria main.tsx e o restante da aplicação; não importar IndexedDB/localStorage na UI. Manifest/SW/precache e CI/Pages/docs/LAN continuam nas etapas seguintes; browsers Playwright ainda não foram instalados/verificados por este agente. Nenhum commit, push ou publicação. Depois da UI executar novamente typecheck, test e build sem passWithNoTests.
