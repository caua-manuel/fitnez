# Segurança e privacidade — Fase 1

12/11/2026. Responsável: agente real `seguranca_privacidade`. Revisão final encerrada; escrita liberada para o coordenador. Somente este handoff foi escrito pelo agente de segurança. Nenhum produto, dependência, semente, `legacy/`, skill ou dado pessoal foi alterado; sem commit, push ou publicação.

## Decisão da revisão

Sem achado crítico ou importante de segurança pendente que impeça o encerramento da fundação autorizada da Fase 1. O defeito importante de backup próprio irrestaurável foi reproduzido, corrigido pelo dono e reavaliado. A decisão considera os limites abaixo; não autoriza publicação nem avanço de fase e não declara validação de Safari físico ou de backups reais.

Foram lidos AGENTS.md, ESPECIFICACAO, ADRs 002/003, contratos, implementação de dados/interface/PWA e handoffs dos donos. Consultada a skill de verificação antes da conclusão; a skill de backend foi consultada, mas suas ações Supabase não se aplicam ao armazenamento exclusivamente local. Não foram lidos valores de `.env`, credenciais ou históricos pessoais.

## Crítico

Nenhum achado crítico confirmado no escopo examinado. A ausência de `.git` impede examinar histórico de commits; isto é uma limitação de cobertura, não uma afirmação de histórico limpo.

## Importante — achados resolvidos

1. **Backup próprio irrestaurável por crescimento da recuperação.** Antes da correção, diagnóstico sem alterar arquivos, carregando TS real com fake-indexeddb, produziu backup sintético de 6.324.221 bytes, restaurou-o e gerou outro de 18.983.516 bytes anunciado com sucesso; o próprio importador recusou este último por exceder 10 MiB. `confirmImport` acumulava bruto e snapshot integral e `export` não provava a capacidade de restauração.
   - Correção: `src/data/capacity.ts:6` valida o pacote completo; `:15` centraliza a montagem da recuperação; `:23` prova restauração em fundação vazia, incluindo bruto/snapshot e reserva de metadados. `src/data/index.ts:36` valida antes da transação e reconfere revisão dentro dela; `:73` protege save e `:77` prova export antes de marcar geração. Recusas não truncam originais nem gravam recuperação parcial.
   - Reavaliação independente: save sintético de 6 MiB recusado com revisão ainda 0; exports de 1.081.369, 2.206.394 e 4.465.474 bytes restauraram em bancos vazios; a próxima exportação foi recusada com estado integralmente idêntico. `npm.cmd test` executado nesta revisão: exit 0, 35/35. A rodada final do QA também executou esses 35 testes e verificou download/importação v3 em navegador real.
2. **Dependências com advisories no conjunto inicial.** Vite 8.3.1 e Vitest 5.0.2 foram substituídos por Vite 8.3.8 e Vitest 5.1.0, com lockfile real e versões exatas. O [handoff DevOps](devops-fase1.md) registra `npm.cmd audit --json --fetch-retries=0 --fetch-timeout=15000`, exit 0 e zero vulnerabilidades conhecidas. Este agente não repetiu a consulta de rede nem trata o resultado como garantia contra vulnerabilidades desconhecidas. Não foram adicionadas dependências; justificativas permanecem no ADR 003.

## Desejável — ajustes concluídos e proteção verificada

- **Prévias retidas na sessão:** o repositório passou a guardar uma única prévia. Novo preparo, inclusive inválido, invalida tokens anteriores; contador de tentativa impede que preparo concorrente antigo repovoe o mapa (`src/data/index.ts:74`). Tokens consumidos/obsoletos são recusados; a confirmação usa candidato privado e revisão transacional.
- **Todas as fontes legadas inválidas:** marcador explícito `migrationStatus=invalid`, `migrationCompleted=false`, brutos e avisos preservados. A importação corretiva continua possível; diagnóstico independente confirmou transição para `completed`. Não se criou bloqueio permanente por falta de fonte válida. Ver [correção de dados](dados-correcao-fase1.md).
- **CSP em produção:** `vite.config.ts` injeta recursos locais, sem `unsafe-inline`/`unsafe-eval`, com `object-src 'none'`, `base-uri 'none'` e `form-action 'none'`. A meta está presente em `dist/index.html:4`. O QA executou os 17 E2E no build com CSP ativa e registrou zero `pageerror`/`console.error`, sem suprimir erros de rede/CSP. Download/importação e PWA foram incluídos. Não se promete proteção `frame-ancestors` por meta.
- **Dados no aparelho:** IndexedDB guarda estado e recuperação; localStorage legado é fonte de leitura. Backup inclui histórico e originais e a interface avisa que contém dados de saúde. Cópia/download são ações explícitas; geração e confirmação de guarda são distintas. Persistência é solicitada por ação e não promete evitar limpeza manual. Não há armazenamento de fotos nesta fase; anexos não suportados são recusados na importação.
- **Entrada não executável:** validação recursiva recusa `__proto__`, `prototype` e `constructor`, versões futuras, formatos/datas/tipos inválidos, mais de 10 MiB UTF-8, 64 níveis ou 200 mil nós. React apresenta texto; buscas operacionais não encontraram `eval`, HTML importado executável, analytics ou transporte externo de histórico. As únicas chamadas `fetch` em src/public são fallbacks do SW restritos à origem/base.
- **Segredos e artefato público:** busca por padrões conhecidos de chaves AWS/GitHub/OpenAI e chaves privadas em src/public/scripts/tests/index/package não encontrou correspondências; nenhum valor sensível foi impresso. `.gitignore` cobre `.env*`, dependências, dist, logs e artefatos locais de QA. Inspeção do dist final encontrou nove arquivos: HTML, manifesto, SW, quatro ícones e bundles JS/CSS com sementes; sem docs, legacy ou arquivos de histórico/backup. A lista permitida é verificada pelo build e o workflow envia somente dist.

## Revisão do ajuste offline final

`public/sw.js:27` mantém guarda GET/origem/base. `PRECACHE_URLS` normaliza a lista estática e a correspondência de `:34` exige URL completa exata, incluindo query, antes de usar `ignoreVary:true`. Isso resolve `Vary: Origin` dos assets do preview sem ampliar a lista de recursos nem introduzir gravação de cache em runtime. O cache é preenchido apenas por `addAll(PRECACHE)` na instalação; dados IndexedDB, backups e fotos não entram nele. Navegação continua retornando o shell. Limpeza só remove versões do namespace próprio; atualização continua manual.

Evidência do [QA final](qa-fase1.md): `npm.cmd run check` exit 0 (3 testes de configuração, TypeScript, 35 de dados, build/verificador); 17/17 E2E em Chromium, seis rotas e reabertura offline, CSP ativa e sem erros de console/página. Rollback foi provocado entre writes no IndexedDB do navegador e conferido nos stores físicos state/recovery e após reload. É falha injetada, não disco fisicamente cheio. Ver também [correção offline](frontend-offline-fase1.md). Esses comandos finais foram executados pelo QA; não foram repetidos por segurança sem nova evidência.

## Risco residual e correção sugerida para trabalho posterior

**Capacidade da recuperação integral:** restaurações sucessivas acumulam brutos e snapshots. Importação, save ou reexportação futura podem ser recusados por tamanho/profundidade/nós; um estado legado grande pode continuar legível e ainda assim não ser exportável neste formato. Exportação anunciada com sucesso prova restauração em fundação vazia; destino ocupado pode recusar para preservar seu anterior. Isto não garante reexportação ilimitada após restores. A recusa preserva dados e informa erro; não foi aprovado apagamento automático para abrir espaço. Sugestão futura: projetar deduplicação/versionamento da recuperação e eventual formato de transferência maior, com testes de equivalência e decisão explícita sobre retenção. Não aumentar limite isoladamente nem remover originais silenciosamente. Limitação registrada também no contrato/ADR e no handoff de dados.

## Limites de cobertura

- Sem `.git` neste workspace: histórico de segredos e arquivos anteriormente publicados não auditados. Antes de publicação, revisar o repositório Git real; achado de credencial exigiria revogação/rotação, sem expor valor no relatório.
- Fixtures são sintéticos identificados; não há backup real do usuário para comprovar compatibilidade. Não foi necessário acessar dados pessoais reais.
- Sem Safari/iPhone físico, instalação pelo menu do celular, esgotamento real de quota ou teste entre dois builds para atualização. Evidências Chromium e fake-indexeddb não substituem esses cenários.
- Não há botão de apagar tudo nem fotos nesta fundação; essas funções não foram antecipadas do escopo futuro. Quando forem implementadas, a revisão deverá abranger IndexedDB, recuperação, fontes legadas e aviso sobre cópias externas sob controle do usuário.

Escrita deste agente encerrada. Coordenador pode integrar o relatório final da Fase 1, mantendo as limitações acima.
