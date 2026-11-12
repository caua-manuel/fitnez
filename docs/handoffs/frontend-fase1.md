# Handoff — frontend — Fase 1

Agente real frontend; escrita sequencial encerrada e liberada para devops integrar PWA, depois QA.

- Implementados React real em src/main.tsx, app/DataProvider+App, features/FoundationPages+More, ui/components+styles, pwa/usePwa+build e public/sw.js; ícones copiados integralmente do legacy para public. Seis hashes antigos, retorno de rota desconhecida a Hoje, temas persistentes e automático com listener do sistema.
- Cinco abas de consulta/fundação, sem CRUD/registro/progressão/regras novas. Catálogo consumido do repositório e nunca de cópia paralela. Mais integra conflito de migração, backup download/clipboard com erro real, prévia/confirmação/cancelamento, geração/confirmação distintas, persistência e lembrete Hoje/Mais. A interface não chama IDB/localStorage.
- DESIGN aplicado: claro/escuro, 360px, desktop, SVG próprios consistentes, teclado/foco/safe area/reduced-motion e fontes locais sem rede. Seletor de arquivo com rótulos PT-BR próprios para não depender do idioma do navegador.

## Integração PWA pendente do dono devops

Em vite.config.ts importar pwaBuild de ./src/pwa/build.ts e adicionar plugins: [pwaBuild()]. O plugin nativo gera manifest, injeta seus links e ícones no HTML, enumera todos arquivos dist (incluindo bundles com sementes) e substitui marcadores de public/sw.js com base/cache/precache. Sem essa integração, dist/sw.js ainda é template e NÃO deve ser apresentado como PWA concluída. Não alterei config pertencente a devops.

SW namespace treino12+base codificada+hash de assets/template; instalação addAll integral; ativação remove apenas versões do mesmo prefixo; skipWaiting somente mensagem após clique. Aviso de atualização no app e reload somente controllerchange provocado pela ação manual. Disponível offline somente após mensagem de precache completo; dev mostra prévia local, sem promessa offline.

## Evidências reais

- npm.cmd run typecheck: exit0.
- npm.cmd test: 27/27 testes de dados passaram, exit0.
- npm.cmd run build: exit0; 29 módulos; JS274,23kB (gzip86,46), CSS10,24kB (gzip2,99), antes da integração do plugin.
- Chromium real disponível. Smoke via Playwright: seis rotas, largura360 sem overflow, tema escuro persiste reload, tema claro, desktop1280; pageErrors=[]; processo de servidor encerrado ao fim. Capturas .frontend-checks/mais-360.png e mais-desktop.png inspecionadas (anteriores ao último ajuste do seletor de arquivo/width desktop). Primeiro smoke falhou por acento perdido no pipe PowerShell; rerun com UTF8 explícito passou.
- Fluxos E2E completos/import/migração/offline/atualização aguardam QA após devops integrar plugin; não alego teste PWA realizado ou Safari físico.
- Skills lidas: frontend-design, Impeccable/craft-floor/operate, Emil, UIUX Pro Max/pro-rules, React/event-listeners e verification. Contexto Impeccable indisponível já comprovado pelo UX; fallback com DESIGN/especificação/legacy/handoffs. Python ausente: referências locais, sem alegar pesquisa executada. Direção existente prevalece sobre sugestões genéricas.

Nenhuma alteração em dados/regras/configs de outros donos, legacy, sementes ou skills. Sem commit/push/publicação. Fase2 não iniciada.

Revisão do coordenador: resultado explícito de persistência negada/erro poderia ser sobrescrito pela consulta de refresh. Corrigido no DataProvider, retendo resultado da solicitação nesta sessão e aplicando-o nas consultas seguintes, sem alterar backend. Smoke Playwright com persisted=false/persist=false confirmou negativa visível após solicitação e após salvar outro tema. Typecheck e 27 testes passaram novamente; build final JS274,50kB/gzip86,54, CSS10,24kB/gzip2,99.
