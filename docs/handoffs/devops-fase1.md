# Handoff — devops_github — conclusão da janela Fase 1

Data: 12/11/2026. Agente real `devops_github`.
**Escrita encerrada e liberada para backend/QA.** Não há outro agente deste
domínio escrevendo. Não foi criado commit, feito push ou executado deploy.

## Entrega

- Vite **8.3.8** e Vitest **5.1.0**, versões exatas com lockfile atualizado por
  npm real; nenhuma dependência nova. Justificativa registrada no ADR 003.
- `.github/workflows/pages.yml`: PR/main/manual, npm ci, audit, checks,
  Chromium/E2E, build na base real do repositório e upload somente de `dist/`.
  Actions fixadas por SHA oficial consultado na API GitHub; publicação apenas
  em main, com job e permissões próprios. Nenhum CI remoto foi executado.
- `scripts/verify-build.ts` integra `npm run build`: verifica base, manifesto,
  URLs do precache, arquivos permitidos, worker sem placeholders e CSP.
- CSP de produção já foi implementada em `vite.config.ts`, sem alterar
  `src/pwa/build.ts` ou `index.html` de desenvolvimento. Política indicada pela
  revisão de segurança: recursos locais; sem inline/eval/objetos/base/forms;
  sem `frame-ancestors` em meta. QA precisa testar navegador com o build CSP.
- `INICIO.md` substitui o kit antigo por instruções reais de operação, aponta
  `.codex/agents/` e `AGENTS.md` como fonte central e preserva as limitações da
  Fase 1. `docs/PUBLICACAO.md` documenta Pages, bases, comandos e teste no celular.
- `.gitignore` inclui capturas locais, eventos temporários Codex e PID preview.
  Não foram alterados `legacy/`, sementes, UI, dados ou testes de outros donos.

## Verificações reais

- `npm.cmd install --save-dev --save-exact vite@8.3.8 vitest@5.1.0 ...`: exit 0,
  seis pacotes atualizados.
- `npm.cmd audit --json --fetch-retries=0 --fetch-timeout=15000`: exit 0;
  **zero vulnerabilidades conhecidas** em todas as categorias.
- `npm.cmd run check`: exit 0; **3 testes de base e 27 testes de dados passaram**,
  TypeScript sem erro, build Vite passou e verificação do artefato passou.
- Builds separados com `VITE_BASE_PATH=/` e depois sem override: ambos npm build
  exit 0; cada um com nove arquivos/nove URLs de precache e CSP. Build final
  restaurado em `/Projeto-Treino/`. A consulta opcional de `actionlint` não
  encontrou o executável; não houve validação local do YAML por esse binário.
- HTML final 1,17 kB; JS 274,50 kB (gzip 86,54); CSS 10,24 kB (gzip 2,99).
- Nenhum E2E executado por este agente: a suíte ainda será criada pelo QA.

## Preview e próximo responsável

Preview iniciado oculto com Node/Vite, PID **19708**, porta **4173**. Logs locais
`.devops-preview-out.log` e `.devops-preview-errors.log`, PID em
`.devops-preview.pid`. Página e service worker responderam **HTTP 200** em
localhost. O processo não alterou firewall.

- Computador: `http://localhost:4173/Projeto-Treino/`.
- Celular na mesma rede: `http://<IPv4-local>:4173/Projeto-Treino/` (IPv4 de ipconfig,
  anunciado pelo Vite).
- HTTP LAN permite verificar layout/controles, mas PWA/clipboard/instalação no
  celular podem depender de HTTPS. Não foi criada URL pública.

QA pode reutilizar esse preview ou coordenar sua parada pelo PID específico;
não iniciar outro na mesma porta sem verificar. O build final pode mudar após
correções de dados; o preview serve os arquivos atualizados de `dist/`.

O relatório `docs/FASE-1.md` continua sob coordenação principal, que o atualizará
após backend/QA/segurança. Esta entrega não declara a Fase 1 concluída.
