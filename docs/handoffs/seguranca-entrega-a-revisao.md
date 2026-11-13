# Segurança e privacidade: revisão pré-publicação (Fitnez, Entrega A)

Escopo: leitura apenas; nenhum código alterado. `npm.cmd audit`: 0 vulnerabilidades. Histórico Git: 1 commit, autor com e-mail noreply; sem segredos, e-mails, IPs ou caminhos locais nos arquivos versionados (varredura de `git ls-files`).

## Crítico
Nenhum.

## Alto
Nenhum.

## Médio

M1. `capturas/` (264 arquivos, 61 MB) está não rastreada e NÃO está no `.gitignore` (`git status` mostra `?? capturas/`). Um `git add .` publicaria tudo no repositório público. Amostras vistas (perfil-r3-dados/perfil-completo.png "Ana Souza", final-inicio-real.png, dbg.png) são sintéticas/vazias, mas as 264 imagens não foram todas inspecionadas. Correção (config, não aplicada): acrescentar `capturas/` ao `.gitignore` ou, se for versionar, conferir todas as imagens e reduzir o volume. `test-results/` já está ignorada (linha 5).

M2. Aviso "não substitui nutricionista ou médico" só existe na dieta (`src/features/dieta/Dieta.tsx:146` e `src/features/FoundationPages.tsx:24`). Não há aviso nas telas de Treino nem de Evolução (grep em `src/` não achou). Correção: frase curta (ex.: "Os treinos são sugestões gerais; consulte um médico antes de começar ou mudar a carga") em Treino, e nota em Evolução/Perfil sobre dados de saúde.

M3. Sem função "apagar todos os meus dados" (grep por apagar/limpar tudo/deleteDatabase: nada). A regra do projeto prevê opção de apagar tudo. Correção: botão em Perfil > Dados neste aparelho com confirmação, que apague IndexedDB, caches `treino12:*`, localStorage `treino12:*` e desregistre o service worker (decisão de UX do usuário).

M4. `.github/workflows/pages.yml:40,46` usa `VITE_BASE_PATH: /Projeto-Treino/`, mas o repositório público é `caua-manuel/fitnez` (Pages serviria em `/fitnez/`). Não é falha de segurança, mas o SW, o escopo e o precache dependem da base; com base errada o app publicado quebra. Confirmar a base antes do push (e `docs/PUBLICACAO.md`).

## Baixo

B1. CSP (injetada só no build por `vite.config.ts`, confirmada em `dist/index.html`): `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. Boa: sem `unsafe-inline`/`unsafe-eval`, sem hosts externos, `connect-src` restrito. Cobre SW (`worker-src`), fontes (`font-src`; CSS gerado aponta para `/Projeto-Treino/fonts/...`, mesma origem) e manifesto. `img-src 'self'` bloqueia `data:`/`blob:` e não há `public/img` hoje; se imagens opcionais forem adicionadas, ficam cobertas se forem arquivos próprios (fotos de progresso em blob exigiriam `blob:`, decisão futura). Notificações não precisam de diretiva. Limitações: meta CSP não suporta `frame-ancestors` (GitHub Pages não permite cabeçalhos; risco de clickjacking aceito, app sem ações sensíveis); `verify-build.ts` só confere que a string `Content-Security-Policy` existe e que não há script inline: sugerido assertar o conteúdo exato e a ausência de `unsafe-`. Em dev (`vite`) não há CSP, o que é esperado.

B2. `public/sw.js`: `notificationclick` (linha 25 em diante) fecha a notificação, normaliza a URL com `new URL(..., self.location.origin)` e, se a origem for diferente ou o caminho não começar pela base, usa `${BASE}#treino`: correto. `data.url` vem de `location.href` do próprio app. `open.navigate()` com `.catch`. Precache: `cache.addAll` (falha aborta a instalação, mantendo versão antiga); cache e prefixo versionados por hash do conteúdo; `activate` apaga só caches do mesmo prefixo (não afeta outras apps na mesma origem); fetch só trata GET, mesma origem, dentro da base e URLs exatas do precache; navegação serve o `index.html` do cache (fallback à rede). Atualização: nova versão fica em espera e só assume com `APPLY_UPDATE` (ação do usuário), depois `clients.claim`. Escopo = base. Sem achados; sugestão: no fallback `fetch(event.request)` da navegação, tratar falha offline com resposta de erro simples.

B3. `src/pwa/notifications.ts`: título fixo "Descanso terminado", corpo = nome do exercício (texto do plano, possivelmente editado pelo usuário). Não inclui nome do usuário, objetivo, cargas ou medidas; aparece na tela bloqueada. Aceitável; opcional usar texto genérico.

B4. Importação de backup: `Perfil.tsx:113` recusa >10 MiB antes de ler o arquivo; `src/data/validation.ts:25` repete o limite em bytes UTF-8; `JSON.parse` em texto, sem eval; `safeJson` (linhas 12-22) limita nós (200 mil) e profundidade (64), exige protótipo simples e recusa `__proto__`/`constructor`/`prototype` (JSON.parse cria `__proto__` como chave própria, então `Object.entries` a detecta). Validação de esquema por campo; fotos/anexos recusados. Prévia com token único (`prepareImport` -> `confirmImport`, `src/data/index.ts:74-75`) e cópia de recuperação em `recovery` na mesma transação (ADR 002; testes em `tests/integration/repository.test.ts`). Observação: "Copiar backup" coloca dados de saúde na área de transferência (o texto da tela já avisa que contém dados pessoais).

B5. XSS: grep em `src/` por `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacent`, `eval(`, `new Function`, `document.write`: zero ocorrências fora de testes. Nome, objetivo, nomes de treino/exercício, opções e receitas são renderizados como texto pelo React (ex.: `Perfil.tsx` `{name}`, `FoundationPages.tsx` `{o.name}`, `{item}`). Nome e objetivo têm `maxLength` 40/80 só na digitação; importados não têm limite de tamanho por campo além dos 10 MiB totais (efeito: só layout). CSP sem `unsafe-inline` é a segunda camada.

B6. localStorage: só `treino12:descanso` (`src/features/treino/Executar.tsx:18-34`: id do treino, dia, exId, `endsAt`, `total`; sem dado pessoal) e uma chave de sessionStorage `treino12:treino-novo` (id). Leitura em try/catch, valida `id`, `day` e `endsAt` numérico, mas não valida `total`/`exId` (tipo). Corrigir: checar `typeof total === 'number' && Number.isFinite(total)` e `typeof exId === 'string'`. `src/data/index.ts:15` lê localStorage legado do protótipo apenas para migração.

B7. Dependências: `package.json` tem só `react` e `react-dom` 19.3.0 (versões exatas) em produção; dev: playwright, @types, fake-indexeddb, typescript, vite, vitest. `npm.cmd audit`: "found 0 vulnerabilities". CI roda `npm audit --audit-level=moderate`, usa actions fixadas por SHA e `persist-credentials: false`. Sem scripts, CDN ou fontes externos (grep por `http(s)://` em `src`, `index.html`, `public/sw.js`: nada além de namespaces). Sem analytics/rastreadores.

B8. Licenças: fonte Figtree self-hospedada com `public/fonts/Figtree-OFL.txt` (SIL OFL 1.1), incluída no build (permitida em `verify-build.ts`). Pastas de skills sem LICENSE próprio: `.claude/skills/roast-idea`, `.claude/skills/roast-me`, `agents/auditoria-roast/roast-idea`, `agents/auditoria-roast/roast-prompts`, `agents/frontend-ui/vercel-react-best-practices` (já apontado em `seguranca-limpeza-github.md`). Skills de terceiros têm LICENSE nas demais pastas e proveniência em `agents/skill-installations.json`/`sources.json`. Sem LICENSE do próprio Fitnez (decisão do dono). Correção: copiar a licença upstream (MIT, conferir) para essas pastas ou removê-las do versionamento.

B9. Higiene do repositório: `.gitignore` cobre `.codex-*`, `.devops-preview*`, logs, `.env*`, `dist`, `test-results`, `playwright-report` e os `.prototipo-dist*` (alteração ainda não commitada). Vi um arquivo temporário transitório `src/features/dieta/Dieta.tsx.tmp.*` durante a revisão (não casa com `*.tmp`); sugerido acrescentar `*.tmp.*` ao `.gitignore`. Há grande quantidade de alterações e arquivos novos não commitados (handoffs, `public/fonts/`, `src/domain/*`): conferir `git status` antes de commitar para não esquecer `public/fonts/`, necessário ao build. `docs/referencia-visual/tela-*.png` já estão versionadas: confirmar que não têm dado pessoal real (não inspecionadas). Handoffs: busca por e-mail, IP, `C:\Users` e nome pessoal não encontrou nada.

## Correções de configuração sugeridas (não aplicadas)
1. `.gitignore`: `capturas/` e `*.tmp.*`.
2. Confirmar `VITE_BASE_PATH` do workflow para `/fitnez/` (ou nome real).
3. Reforçar `scripts/verify-build.ts` para validar o texto da CSP.
4. LICENSE nas skills citadas em B8.

Pendências de produto (decisão do usuário): botão "apagar tudo" (M3) e avisos de saúde em Treino/Evolução (M2). Nenhuma nova coleta ou envio de dados foi encontrada.
