# ADR 003 — Execução autorizada da Fase 1

Data: 11/11/2026. Responsável: agente real `arquiteto`.
Status: adotado para a Fase 1, conforme pedido explícito do usuário.

> **Nota (12/11/2026): superada.** O escopo da Fase 1 (seis abas de fundação) foi substituído pela reconstrução Fitnez. Escopo, dados e notificações passam a ser regidos pelo [ADR 004](004-reconstrucao-fitnez-e-push.md). Permanecem válidos deste ADR: camadas, IndexedDB nativo, service worker nativo, base do Pages configurável, lista de dependências e donos de pasta.

## Contexto e alternativas

React + TypeScript + Vite + CSS próprio foram aprovados pelo usuário. A comparação de alternativas permanece no ADR 001 como histórico, sem reabrir a escolha. O escopo atual é a fundação utilizável com seis abas, proteção dos dados e PWA. A especificação completa descreve também fases futuras; não autoriza antecipá-las.

Para IndexedDB foram considerados acesso nativo, idb e Dexie. Adotamos acesso nativo: evita dependência de runtime, mantém a transação explícita e permite provar o commit real. Para offline, adotamos service worker nativo com lista de precache produzida no build; vite-plugin-pwa não será instalado. O custo é manter pequenos adaptadores e testes transacionais próprios.

## Decisão e limites

- UI → application → data; domain contém apenas funções puras. UI nunca usa IndexedDB/localStorage diretamente. O contrato obrigatório está em [CONTRATOS-FASE-1](../CONTRATOS-FASE-1.md).
- Estado lógico v3; revisão crescente; catálogo separado do histórico; originais, campos desconhecidos, órfãos e snapshots preservados. ADR 002 continua a reger recuperação transacional.
- Nenhuma nova regra de treino/dieta, progressão, CRUD ou registro de séries nesta fase. As cinco primeiras abas mostram sementes e estados de fundação claramente identificados. Mais é funcional para temas, backup/importação, migração e proteção.
- Datas e números das sementes não mudam. Divergência do deload legado/especificação fica pendente para revisão de conteúdo antes da Fase 2; não é resolvida nesta fundação.
- Não criar fotos, backend, login ou banco externo. Não editar legacy/, data/*.json nem skills vendorizadas.
- Somente um agente escreve por vez. Revisões e leituras podem ser paralelas. Cada entrega registra evidências em docs/handoffs/; defeitos retornam ao dono.

## Pastas e donos

| Área | Dono de escrita |
| --- | --- |
| docs/decisoes/, contratos | arquiteto |
| package.json/lock, configs TS/Vite, index.html, scripts build/CI e docs operacionais | devops_github |
| src/application/, src/data/ e testes de dados | backend_dados |
| DESIGN.md | ux_acessibilidade |
| src/main.tsx, src/app/, src/features/, src/ui/, src/pwa/, public/ | frontend |
| src/domain/ e regras/números de conteúdo | conteudo_treino_nutricao, somente mediante escopo autorizado |
| tests/e2e/, fixtures/configs de testes e complementos de testes | qa_testes |
| revisão segurança/dependências/dist e handoff | seguranca_privacidade |

A pasta src/domain/ pode ser criada vazia com .gitkeep; não implementar regras novas para preencher a estrutura. Testes de lembrete/validação de dados pertencem ao domínio operacional dos dados, não às regras de treino.

## Dependências mínimas justificadas

| Pacote | Motivo |
| --- | --- |
| react e react-dom | UI escolhida pelo usuário e renderização DOM |
| typescript | Verificação dos contratos sem custo de runtime |
| vite | Desenvolvimento e build estático com base Pages |
| @types/react, @types/react-dom, @types/node | Tipos das bibliotecas e configuração/scripts Node |
| vitest | Testes executáveis de funções e dados |
| fake-indexeddb | Transações IndexedDB em testes locais determinísticos |
| @playwright/test | Navegador real, PWA, offline e fluxos de interface |

Vite suporta TSX sem plugin React; usar transformação JSX automática na configuração TS. Não adicionar plugin, biblioteca UI, roteador, idb, pacote PWA, fontes remotas ou state manager por conveniência. Cada extra necessário exige registro adicional do devops neste ADR. Versões exatas e compatíveis com Node instalado serão verificadas por npm install e lockfile; não presumir versões disponíveis. Meta JS/CSS: Safari 16. Não prometer Safari físico com base apenas em Chromium/WebKit.

## Build e offline

Base padrão /Projeto-Treino/. VITE_BASE_PATH explícito tem prioridade, aceita apenas caminho absoluto local normalizado (sem protocolo, query, fragmento, barras invertidas ou segmentos . e ..). Em CI, derivar /<repo>/ de GITHUB_REPOSITORY; repo <owner>.github.io usa /. Vite, manifest start_url/scope, SW e precache compartilham a mesma base. Dev 0.0.0.0:5173; preview 0.0.0.0:4173.

Build produz lista completa dos assets do shell, ícones e sementes (sementes podem estar embutidas em bundles). Registrar SW somente no build, no escopo da base. Cache prefixado por treino12 + base codificada + versão build. Instalação só conclui após precache íntegro; ativação remove apenas versões antigas do mesmo prefixo. Sem skipWaiting automático. UI oferece atualização e aplica apenas por ação explícita após término das gravações. Nenhum reload automático. Não armazenar backup/dados de saúde em Cache Storage; nenhum recurso obrigatório remoto. Offline é informado após shell em cache, não apenas após registro do SW.

## Sequência e evidências de execução

Este documento e os handoffs formam o ledger da execução solicitada, sem novo gate de aprovação técnica. O coordenador acompanha:

- [x] Arquitetura: stack reconciliada, contratos e este ADR.
- [x] devops_github: dependências instaladas, configs, scripts.
- [x] backend_dados: implementação e testes de migração/backup/rollback/revisão.
- [x] ux_acessibilidade: DESIGN.md coerente com legacy.
- [x] frontend: seis abas, Mais real, temas e offline.
- [x] qa_testes: tsc, Vitest, build e Playwright; devolver falhas aos donos.
- [x] seguranca_privacidade: revisão concreta e correções dos donos.
- [x] devops_github: CI/Pages configurados sem publicação, endereço LAN real e instruções celular.
- [x] Coordenador: hashes legacy/sementes vs FASE-0, relatório FASE-1 e checks finais reais.

Fixtures são sintéticos identificados; o kit não contém backup real do usuário. Nenhum commit, push ou publicação; Fase 2 não iniciada. O resumo final registra limitações reais, sem transformar checks não executados em aprovação.

## Consequências e decisões do usuário

O acesso nativo reduz dependências e exige testes de conclusão e aborto transacional. A restauração conserva recuperação no mesmo commit, podendo recusar por quota em vez de sacrificar os dados atuais. Persistência/instalação não substituem backup externo. Dados de cada origem/aparelho permanecem separados.

Decisões pendentes do usuário para executar Fase 1: nenhuma. Publicar e iniciar Fase 2 exigirão autorização posterior; recomendação: aguardar a entrega e a validação desta fase.

## Fundação verificada pelo devops_github

Node disponível: 24.19.0; npm.cmd: 11.17.0. Versões fixadas e instaladas, confirmadas por npm ls: react/react-dom 19.3.0; TypeScript 6.0.3; Vite 8.3.1; Vitest 5.0.2; fake-indexeddb 6.2.5; @playwright/test 1.64.1; @types/node 26.6.6; @types/react e @types/react-dom 19.3.0. Nenhuma dependência extra foi adicionada. package-lock.json é a resolução real produzida/validada pelo npm.

A tentativa inicial de acesso ao registro recebeu EACCES; a tentativa posterior `npm.cmd install --offline --fetch-retries=0 --logs-dir=./.npm-logs --no-audit --no-fund` concluiu com exit 0, e `npm.cmd ls --depth=0` confirmou todos os pacotes instalados. Não houve bypass de sandbox/política do PowerShell: foi usado o launcher normal npm.cmd.

Vite usa a transformação TSX automática indicada pelo tsconfig, sem plugin React. A base compartilhada está em scripts/base-path.ts, com testes executáveis pelo próprio Node 24, sem dependência extra. Vitest separa testes unitários/integração dos testes e2e. Build completo aguarda src/main.tsx do frontend; isso não equivale a aprovação do build da aplicação.

## Atualização operacional — 12/11/2026

O agente devops_github atualizou Vite de 8.3.1 para **8.3.8** e Vitest de
5.0.2 para **5.1.0**, com versões exatas e lockfile real, para corrigir os
advisories identificados. Nenhuma dependência nova foi adicionada. O audit
pós-atualização retornou zero vulnerabilidades conhecidas; isso não substitui
revisão de código ou futuras consultas de advisories.

O build agora verifica a integridade de base/manifesto/precache e o conjunto de
arquivos públicos com `scripts/verify-build.ts`, usando somente Node. O workflow
de CI testa na base controlada `/Projeto-Treino/` e reconstrói na base real de
`GITHUB_REPOSITORY` antes do upload de `dist/`. Actions fixadas por SHA oficial.
Não foi executado CI remoto nem deploy.

A CSP é injetada **somente no build** por plugin local em vite.config.ts, sem
alterar o código PWA do frontend ou exigir pacote adicional. Usa recursos locais,
sem scripts/estilos inline, objetos, alterações de base ou envio de formulários;
não declara `frame-ancestors` em meta. QA deve validar console e fluxos com essa
política no build, não apenas no modo de desenvolvimento.

## Ajuste de capacidade da Fase 1 — 12/11/2026

A revisão de segurança encontrou crescimento de recuperação capaz de produzir backup de mais de 10 MiB anunciado como válido. A correção mantém o formato lógico v3 e o banco físico 1: nenhuma transformação destrutiva nem nova dependência. O contrato passa a exigir pré-validação da representação integral antes da transação, prova de restauração em fundação vazia antes de anunciar exportação e recusa preservadora quando o orçamento não comporta os originais. `save` não introduz diretamente estado cujo backup falharia nessa prova. Restaurações repetidas ainda podem esgotar o orçamento; a operação/reexportação é recusada sem truncar dados. Detalhes, status explícito de fontes inválidas e validade da prévia constam no adendo de CONTRATOS-FASE-1.md.

Encerramento do ledger em 12/11/2026: QA final com 3 testes de configuração, 35 de dados e 17 E2E aprovados; revisão de segurança sem achado crítico/importante pendente no escopo da fundação. Relatório e limites em ../FASE-1.md. Aguardando validação do usuário; sem publicação ou Fase 2.
