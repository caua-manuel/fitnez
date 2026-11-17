# Segurança: auditoria completa (repositório público e app)

Data: 2026-11-16. Auditoria somente leitura, refeita do zero (o relatório `seguranca-limpeza-publica.md` não foi tomado como verdade). Estado analisado: `main` em `da2b3dd` (igual a `origin/main`), mais 3 arquivos modificados e 2 não rastreados de outros agentes. Nenhum valor sensível é reproduzido aqui: só tipo, arquivo, linha ou commit.

## Resposta direta

- Há vazamento de dado sensível no repositório ou no histórico: **não, com uma ressalva de baixo impacto**. Não há e-mail pessoal, nome real, caminho de usuário, IP, token, chave nem foto com metadados nos 8 commits nem na árvore atual. A única coisa que sobrou é um peso corporal (kg) usado como valor de teste em fixtures de dois commits antigos (`8e079a2` e `eb20e9e`, achado A1), sem nome ligado. Fora do repositório, o perfil público do GitHub exibe um e-mail pessoal (achado A2), escolha da conta, não do código.
- Há brecha explorável: **não há brecha remota**. Não há XSS, injeção, requisição externa, segredo nem workflow explorável. Existe um defeito real de robustez: um arquivo de backup malicioso ou malformado deixa o app em tela branca permanente (achado B1, MÉDIO; exige que o próprio usuário importe o arquivo).

## Resumo dos achados

| # | Gravidade | Tema |
| --- | --- | --- |
| B1 | MÉDIO | Backup com `settings.profile.name` que não é texto derruba o app (tela branca persistente) |
| A1 | BAIXO | Peso de teste igual ao perfil real em 2 commits antigos (irrecuperável, sem nome) |
| A2 | BAIXO | E-mail pessoal visível no perfil público do GitHub (fora do repositório) |
| B2 | BAIXO | Importação sem teto de tamanho por campo e sem validação de `profile`, `snapshots`, `recovery` |
| B3 | BAIXO | CSP só por `<meta>`: sem `frame-ancestors`; `verify-build.ts` não confere as diretivas |
| B4 | BAIXO | Origem compartilhada `caua-manuel.github.io` e chaves legadas de `localStorage` |
| C1 | BAIXO | Configurações do GitHub: Dependabot desligado, wiki ligada, sem proteção de branch |
| D1 | BAIXO | Pastas de terceiros: três skills sem arquivo de licença; scripts com rede opcional |
| I1 a I8 | INFORMATIVO | Pontos verificados sem problema ou apenas para registro |

Nenhum achado CRÍTICO ou ALTO.

## A. Vazamento de dados sensíveis

### A1. BAIXO. Peso de teste no histórico

- Onde: commits `8e079a2` e `eb20e9e`. `tests/e2e/fase1.spec.ts` linhas 5, 23 e 24; `tests/integration/repository.test.ts` linhas 7, 14 e 27 (campo de peso em medidas sintéticas). Não está mais no HEAD nem na árvore pendente.
- Evidência: `git grep` do valor em todas as revisões (`git rev-list --all`): 2 revisões, 2 arquivos. O valor coincide com o peso do perfil local ignorado pelo Git (`perfil-pessoal.backup.json`), comparado sem imprimir. Altura e idade do perfil não aparecem em nenhuma revisão (busca por valor e por padrões `idade`, `age`, `cm`, `anos`). O mesmo vale para a data de início do plano: aparece nos mesmos fixtures, em `docs/ESPECIFICACAO.md:145` e em `legacy/index.html:357` (`DEFAULT_START`); é uma data civil sem identificação.
- Risco: um número de saúde sem nome, sem e-mail e sem ligação com a pessoa além do usuário público do GitHub. Já está público; o repositório tem 0 forks (`gh api .../forks` vazio).
- Correção: nenhuma obrigatória. Reescrever o histórico não compensa (8 commits, 0 forks, mas as execuções do Actions e os links já referenciam os SHAs). Se o dono quiser zero rastro, a única forma é recriar o repositório. Decisão do dono.

### A2. BAIXO. E-mail pessoal no perfil público do GitHub

- Onde: perfil do usuário (`gh api users/<usuário>` retorna o campo `email` preenchido, de provedor privado; não é o noreply). Não está no repositório.
- Risco: coletores de e-mail. Não ligado ao código, mas "não dar mole" inclui isto.
- Correção (ação do dono): GitHub, Settings, Public profile, trocar "Public email" para "Don't show my email address"; Settings, Emails, ligar "Keep my email addresses private" e "Block command line pushes that expose my email". Não consegui ler essas duas últimas opções (o token do `gh` não tem o escopo `user`).

### Resultado das varreduras (histórico completo, 8 commits, todos já no remoto)

| Busca | Escopo | Resultado |
| --- | --- | --- |
| Autor e committer (`git log --all --format`) | 8 commits | Todos com o nome do usuário público e o e-mail `noreply` do GitHub. Nenhum e-mail pessoal. `git config --local` tem `user.name` e `user.email` iguais ao noreply (o global é pessoal, mas o local prevalece). |
| E-mails em todo o conteúdo de todas as revisões | `git grep` por revisão | Só exemplos de terceiros (`test@example.com`, `john@example.com`, endereços de autores em fixtures de skills e no `package-lock`) e o noreply em docs. |
| Nome de usuário do sistema, `C:\Users`, `/home`, `/Users` | todas as revisões | Só texto descritivo em relatórios e exemplos de terceiros (`/Users/me/...`, `/Users/janderswag/...`). Nenhum caminho real. |
| IPs | todas as revisões, exceto lock | Apenas versões `124.0.0.0`/`127.0.0.0` (user agent e loopback). Nenhum IP privado, de VPN ou público. |
| Tokens e chaves (`ghp_`, `gho_`, `github_pat_`, `AKIA`, `sk-`, PEM, JWT, `xox`, `AIza`) | todas as revisões | Só fixtures de teste de detecção de segredos de terceiros (`AKIAIOSFODNN7EXAMPLE`, `ghp_aaaa...`) em `.claude/skills/roast-repo` e `agents/auditoria-roast/roast-repo`. Nenhum segredo real. |
| `password=`, `secret=`, `apiKey`, `firebase`, URLs com credenciais | todas as revisões | Nenhum no código do projeto. `legacy/` não tem configuração do Firebase. |
| Telefone, CPF, endereço, bairro, cidade, faculdade | árvore atual e docs | Nenhum. Menção a rotina (jiu-jitsu, vôlei, treino do condomínio) sem identificar ninguém. |
| Arquivos removidos (`--diff-filter=D`) | 6 arquivos | Todos código-fonte de telas antigas (`FoundationPages.tsx`, `More.tsx`, `Folha.tsx`, `Menu.tsx`, `Sheet.tsx`, `UndoToast.tsx`); conteúdo antigo conferido, sem dado pessoal. |
| Nomes que existiram na história e não estão no HEAD | `git log --all --name-only` | Só esses 6. Backup pessoal, capturas, logs do Codex e `.prototipo-dist*` nunca foram adicionados. |
| Objetos soltos | `git fsck --lost-found` | 2 blobs de relatórios de QA, só locais (nunca enviados), sem dado pessoal. |
| Metadados de imagens (EXIF, GPS, XMP) | 17 PNG/JPG fora de `agents/` e skills | Nenhum EXIF nem GPS. Os 9 JPEG de `public/img/` têm só o cabeçalho JFIF. Os 4 ícones de `public/` e `legacy/` não têm metadados. Os 8 PNG de `docs/referencia-visual/` têm um bloco C2PA (credencial de conteúdo) que indica geração por IA e data de geração, sem dado pessoal (ver I5). |
| Árvore atual, rastreada e não rastreada (`git ls-files -c -o --exclude-standard`, 1.024 arquivos) | tudo | Mesmos resultados; ver abaixo. |
| `.gitignore` | `git status --ignored` | `perfil-pessoal*`, `*.local.*`, `.env*`, `.codex-*`, `.prototipo-dist*/`, `capturas/`, `dist/`, `test-results/`, `playwright-report/` ignorados e fora do índice. Lacuna desejável: padrões para backups e CSV exportados pelo app (`treino12-backup-*.json`, `fitnez-*.csv`). |
| Arquivos pendentes de outros agentes | `git status` | `MetasSheet.tsx`, `metas.css`, `metas-dieta.spec.ts`, `frontend-metas-intuitivas.md`: sem dado pessoal. `tests/e2e/zz-tmp-repro.spec.ts` é um teste temporário; apagar antes de commitar (não vaza nada, só polui). |
| `package.json` | campos | `private: true`, sem `author`, `repository` nem `homepage`. |

### GitHub (somente leitura)

| Item | Resultado |
| --- | --- |
| Repositório | público, 0 forks, 0 issues, 0 PRs, sem webhooks, sem releases, licença MIT detectada |
| Secret scanning e push protection | ativados; 0 alertas |
| Dependabot (alertas e atualizações de segurança) | desligados (C1) |
| Code scanning | sem análise (404) |
| Actions: permissões | token padrão `read`, `can_approve_pull_request_reviews: false`; ações permitidas: todas; aprovação de PR de fork: `first_time_contributors` |
| Variáveis | só `PUBLICAR_PAGES = true` (valor não sensível). Secrets: 0 |
| Ambiente `github-pages` | política de implantação restrita à branch `main` (correto) |
| Pages | `build_type: workflow`, HTTPS forçado; ainda não publicado: o último push falhou no teste e2e de tema escuro (flaky, não é segurança) e o job `publicar` foi pulado; `https://caua-manuel.github.io/fitnez/` responde 404 agora. A variável `PUBLICAR_PAGES` foi criada depois dessa execução; é preciso reexecutar o workflow |
| Proteção de branch e rulesets | nenhuma (único colaborador: o dono; ver C1) |
| Artefatos do Actions | nenhum guardado |
| Logs das 7 execuções | baixados e varridos: sem e-mail, sem caminho de usuário, sem segredo; o token aparece mascarado (`***`) |
| Outros 14 repositórios do mesmo usuário | todos públicos, nenhum com Pages; só o Fitnez usa a origem (ver B4) |

## B. Brechas no app

### B1. MÉDIO. Backup com `profile.name` não textual derruba o app de forma persistente

- Onde: `src/data/validation.ts:48` (`validateState` não valida `settings.profile`); quebra em `src/app/App.tsx:77` (`profile?.name ... .trim()`) e `src/features/inicio/Inicio.tsx:68`; `src/main.tsx:8` não tem `ErrorBoundary`.
- Evidência (executado no navegador, Chromium via Playwright, contra o preview em 4181): importar um backup v3 válido em que `settings.profile = { name: { a: 1 }, goal: 5 }` é aceito, e depois do recarregamento o `#root` fica vazio (`TypeError: trim is not a function`). Para sair disso é preciso limpar os dados do site no navegador. Outros 7 casos malformados testados (perfil como texto, `weightKg` textual, `workouts` inválido, `order` e `sess.ex` apontando para itens inexistentes, `diet.consumed` lixo, agenda com treino inexistente, `migrationSources` lixo) abriram normalmente.
- Risco: negação de serviço contra o próprio usuário, por arquivo que ele escolhe importar (por exemplo um "backup" recebido de terceiros). Não há execução de código nem acesso a dados de outros. O app guarda o estado anterior em `recovery` (`before-import`), mas a tela branca impede de usá-lo.
- Correção: (1) validar `settings.profile` em `validateState` e na migração (nome e objetivo texto com no máximo 60 e 140 caracteres, idade, altura e peso números finitos nas faixas de `src/domain/profile.ts`); (2) tornar a leitura tolerante (`typeof name === 'string'`); (3) colocar um `ErrorBoundary` na raiz que ofereça "Exportar dados" e "Apagar dados e recomeçar". Pedir ao agente `backend_dados` e ao `frontend`, com teste de regressão.

### B2. BAIXO. Importação sem teto por campo e com estruturas livres

- Onde: `src/data/validation.ts` (`safeJson` limita 10 MiB, 200 mil nós e profundidade 64; `snapshots` e `recovery` aceitam qualquer objeto; textos sem limite individual).
- Evidência (Vitest temporário, sem versionar): aceitos, depois de importar: nota de 4 MB, nome de exercício de 2 MB, `snapshots.x` de 1 MB, datas `0000-01-01` e `9999-12-31`, nome de treino com HTML. Recusados: `__proto__`, `constructor.prototype`, `prototype` em `notes` (todos com `Arquivo contém chave perigosa`), `1e999` (infinito), texto no lugar de número, profundidade 70, 210 mil chaves, 5 MB num campo (excede a capacidade de backup e recuperação), `dietTargets` absurdo, `feel` fora da faixa, `app` diferente de `treino12`, versão futura. A restauração é transacional (uma transação do IndexedDB; teste de aborto existente em `tests/integration/repository.test.ts`) e o estado anterior é guardado.
- Risco: lentidão ou travamento do próprio navegador com arquivo gigante dentro do limite; não corrompe dados nem afeta terceiros.
- Correção: limites de tamanho por texto (por exemplo 200 caracteres em nomes e 2.000 em notas) e validação das estruturas de `snapshots` e `recovery`. Desejável.

### B3. BAIXO. CSP por `<meta>` e verificação do build

- Onde: `vite.config.ts:12-17` (CSP injetada só no build); `scripts/verify-build.ts:56` (só confere se a string `Content-Security-Policy` existe).
- Conteúdo da CSP gerada: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. Sem `unsafe-inline` nem `unsafe-eval`. Conferida em `dist/index.html` e num build com a base `/fitnez/`. No navegador não houve nenhuma violação de CSP nem erro de console (o app aplica estilos pelo CSSOM, permitido).
- O que a CSP não cobre no GitHub Pages: não há cabeçalhos HTTP, e `frame-ancestors`, `report-uri` e `sandbox` são ignorados em `<meta>`. Logo o app pode ser colocado em `<iframe>` de outro site (clickjacking). Impacto real baixo: os navegadores atuais particionam o armazenamento de iframes de terceiros (o invasor veria um banco vazio) e apagar tudo exige três cliques (`src/features/perfil/ApagarDados.tsx`). Aceitável.
- Correção desejável: (1) `verify-build.ts` deve afirmar as diretivas (`script-src 'self'`, ausência de `unsafe-`, `connect-src 'self'`, `object-src 'none'`); (2) opcional, um quebra-quadros em módulo (`if (window.top !== window.self) ...`), que a CSP atual permite por ser `script-src 'self'`; (3) opcional, `<meta name="referrer" content="no-referrer">` e `upgrade-insecure-requests`.

### B4. BAIXO. Origem compartilhada e chaves legadas

- Onde: `src/application/eraseAll.ts:16-17`, `src/data/index.ts:54` (chaves legadas `treino12-v1`, `treino12-v2`, `treino-theme`); banco IndexedDB `treino12:<base codificada>` (`src/data/index.ts:11`), cache `treino12:<base>:<hash>` (`src/pwa/build.ts:25`).
- Situação: o app roda em `caua-manuel.github.io/fitnez/`. Armazenamento web é por origem, não por pasta: qualquer outro projeto publicado em `caua-manuel.github.io` (hoje nenhum dos outros 14 repositórios tem Pages) leria o IndexedDB e o `localStorage` do Fitnez, e um XSS lá exporia os dados daqui. O prefixo `treino12:` e o nome do banco por base evitam colisão acidental, mas não são barreira de segurança. O service worker tem escopo `/fitnez/` e só apaga caches com o próprio prefixo (verificado em `public/sw.js`).
- Dois efeitos colaterais: na primeira abertura o app lê e preserva em `recovery` as chaves legadas se existirem na origem (de outro app com o mesmo nome de chave); "Apagar tudo" remove essas chaves legadas mesmo que sejam de outro app (verificado no navegador: a chave `outro-app:chave` foi preservada; `treino-theme` seria removida).
- Correção: não publicar outros sites em `caua-manuel.github.io` sem domínio próprio; se for publicar, que sejam estáticos sem dados e com CSP. As chaves legadas só importam para quem usou o protótipo antigo; avaliar remover a leitura legada quando ninguém mais depender dela.

### Verificações do app sem problema (resumo, detalhes em I1 a I4)

- XSS: `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, `sendBeacon`, `XMLHttpRequest`, `WebSocket`: zero no código de `src/` (os poucos achados no bundle são de dentro do React, e o único `fetch(` é o polyfill de `modulepreload` do Vite, mesma origem). Todos os `href` do app são internos (`hrefFor`) ou `blob:` de download; o `src` das imagens vem de `img/<tipo>/<id>.<ext>` na mesma origem (ids restritos por `src/ui/photos.ts`). Teste no navegador: nome de treino, exercício, nota e perfil com `"><img src=x onerror=...>`, `<svg onload>` e `javascript:`, em todas as abas: 0 diálogos disparados e 0 elementos injetados.
- CSV (`src/domain/csv.ts`): prefixo de apóstrofo para texto iniciado em `=`, `+`, `-`, `@`, TAB ou CR, aplicado em todas as colunas de texto (treino, exercício, grupo, carga e repetições digitadas, opção, nome, medidas). Testado com `=1+1`, `@SUM(A1)`, `-5`, `+3`, TAB e CR iniciais, `=HYPERLINK(...)`, `=cmd|...` no nome do exercício: todos neutralizados. Valores com espaço antes (` =1+1`) são cortados pelo `trim` e depois protegidos. Caso colateral inofensivo: texto digitado `-5` sai como `'-5`. O caractere de largura total `＝` e `|calc` não são fórmulas. Sem problema.
- Armazenamento: IndexedDB (`state`, `recovery`), `localStorage` só `treino12:descanso` (+ legadas), `sessionStorage` com `treino12:cursor:*`, `treino12:treino-novo`, `treino12:inicio-oferecido`; Cache Storage só com o app (nunca dados do usuário). "Apagar tudo" testado no navegador: apaga `state`, `recovery`, perfil, notas e as chaves `treino12:*`; o banco volta ao estado de fábrica; chaves de outros apps ficam. O que não apaga (e não é vazamento): cache e service worker do próprio app, permissão de notificações do navegador, e os arquivos de backup/CSV que o usuário já baixou, que estão fora do alcance do app (o texto do app já diz que não há como desfazer; vale acrescentar a frase sobre os arquivos baixados).

## C. Configurações do GitHub (ação do dono)

### C1. BAIXO

- Dependabot alerts e security updates desligados (`security_and_analysis`). Ligar em Settings, Code security. Com 12 dependências exatas e `npm audit` limpo hoje, é só para os próximos meses.
- Private vulnerability reporting desligado. Ligar (opcional) e/ou criar `SECURITY.md`.
- Wiki ligada e vazia: desligar se não for usada.
- Sem proteção de branch nem rulesets: para um único mantenedor é aceitável; se quiser, exigir o job `verificar-e-construir` antes de publicar.
- Ações permitidas: todas (`sha_pinning_required: false`). O workflow já fixa as 5 ações por SHA; conferi cada SHA contra a tag oficial (`actions/checkout` v7.0.1, `setup-node` v7.1.0, `configure-pages` v6.0.0, `upload-pages-artifact` v5.0.0, `deploy-pages` v5.0.1): batem. Opcional: ligar a exigência de SHA nas configurações.

### Workflow `.github/workflows/pages.yml`: o que um PR de fork consegue

Sem `pull_request_target`, sem `${{ github.event... }}` em `run:`, sem segredos, `permissions: contents: read` (job de publicação com `pages: write` e `id-token: write` só nele), `persist-credentials: false`, publicação só em `push` na `main` e com `PUBLICAR_PAGES == 'true'`, e ambiente restrito à `main`. Um PR de fork roda `npm ci` e testes com token somente leitura, sem segredos, e só depois de aprovado manualmente na primeira contribuição. Não consegue publicar no Pages nem exfiltrar algo. Risco residual: consumo de minutos de CI por código malicioso no PR (mitigado pela aprovação de primeira contribuição).

## D. Dependências e pastas de terceiros

### Cadeia de suprimentos

- `npm audit` (inclui dev): 0 vulnerabilidades. `npm audit signatures`: 54 pacotes com assinatura de registro verificada, 25 com atestado.
- `package-lock.json` (lockfile v3): 85 pacotes, todos com `integrity`; nenhum `resolved` fora de `registry.npmjs.org`; as 12 dependências diretas com versão exata (sem `^` nem `~`). Único `hasInstallScript`: `fsevents` (opcional, só macOS, do ecossistema do Vite). Nomes conferidos um a um: sem typosquatting. Licenças: MIT, Apache-2.0, MPL-2.0 (lightningcss), ISC, BSD-3-Clause, 0BSD; compatíveis com publicar sob MIT.
- Produção carrega 4 dependências (`react`, `react-dom`, `motion`, `@phosphor-icons/react`).

### D1. BAIXO. `agents/` (9,0 MB), `.claude/skills/` (2,8 MB), `.codex/`

Quem clonar e abrir com um agente de IA:

- Execução automática: **nenhuma**. Não há `settings.json`, `settings.local.json`, `hooks`, `.mcp.json`, `.vscode`, `.devcontainer` nem `.husky` versionados. `.codex/config.toml` só liga o recurso de subagentes. Nenhum `SKILL.md` declara `hooks:` nem usa injeção de comando por `!` no cabeçalho. `allowed-tools` só em `roast-repo/SKILL.md` (Bash, Read, Grep, Glob, Agent), usado apenas se o usuário invocar `/roast`.
- Prompt injection: varri `SKILL.md`, agentes e Markdown por caracteres Unicode ocultos (bidi, largura zero, tags), por frases do tipo "ignore as instruções anteriores", "não conte ao usuário" e "envie para http": **zero ocorrências**. Comentários HTML existem em poucos arquivos (`visual-companion.md`, `feedback-issue-template.md`, `impeccable/reference/*`) e são do próprio upstream, sem instruções ocultas. Os 6 agentes de `.claude/agents/` têm a ferramenta Bash, o que é normal para o projeto.
- Scripts executáveis (115 arquivos `.py`, `.cjs`, `.js`, `.sh`, `.cmd` fora de testes), sem `curl | sh`, `eval`, `base64` decodificado e executado, leitura de `~/.ssh`, `.env` ou tokens. Comportamentos com rede ou dados locais, todos acionados só por uso explícito da skill:
  - `roast-repo` (runner): gera `roast.json` localmente e imprime um `curl` para o site do fornecedor; o texto da skill afirma que nunca envia sozinho (conferi `cta.ts`: só imprime). `live-lighthouse.ts` consulta a API PageSpeed do Google com a URL informada; `live-install.ts` roda `npm install playwright-chromium`.
  - `brainstorming/scripts/server.cjs`: servidor local (127.0.0.1, com chave por sessão); carrega um logo remoto de `primeradiant.com` (equivale a um ping de telemetria) a menos que `DISABLE_TELEMETRY` esteja definida.
  - `agents/impeccable/scripts/impeccable.cmd` e `impeccable`: baixam o binário do motor de `github.com/pbakaus/impeccable/releases` na primeira vez (o `AGENTS.md` pede para rodar o `context`); só executam após conferir o SHA-256 contra `engine-checksums.txt` local (falha fechada). Binário de terceiros: aceitar conscientemente.
  - `roast-me` e `diagnosing-superpowers`: leem transcrições de sessões em `~/.claude/projects`, `~/.codex/sessions`, `~/.gemini` por desenho, e `diagnosing-superpowers` pode abrir issue no GitHub do fornecedor sob aprovação. Contêm prompts do usuário: só invocar de propósito.
- Licenças: cada pacote principal traz o seu `LICENSE`. **Sem arquivo de licença local**: `.claude/skills/roast-idea`, `.claude/skills/roast-me`, `.claude/skills/vercel-react-best-practices` (e as cópias em `agents/auditoria-roast/roast-idea`, `agents/auditoria-roast/roast-prompts`, `agents/frontend-ui/vercel-react-best-practices`). Origens em `agents/skill-installations.json` e `agents/sources.json`. O `LICENSE` MIT da raiz cobre só o código do projeto; o conteúdo de terceiros mantém as licenças dele.
- Correção recomendada: trazer o `LICENSE` upstream dessas três skills ou documentar a licença na `README` de `agents/`; se não forem necessárias a quem só usa o app, mover `agents/` e `.claude/skills/` para fora do repositório público ou deixar claro no `README.md` que são ferramentas de desenvolvimento de terceiros. A pasta ignorada `runner/dist/` aparece localmente e está fora do Git (correto).

## E. Artefato publicado (`dist/`)

- O `dist/` local usa a base `/Projeto-Treino/` (padrão local). Refiz o build com `VITE_BASE_PATH=/fitnez/` numa pasta temporária (como o CI faz) e inspecionei esse. O `dist/` existente não foi alterado.
- Conteúdo: `index.html`, `manifest.webmanifest`, `sw.js`, 1 JS, 1 CSS, 2 fontes `woff2` (+ licença OFL), 4 PNG e 9 JPEG. Sem `.map`, sem `sourceMappingURL`, sem comentário interno, sem o nome de usuário do sistema, sem caminhos de usuário nem o nome do dono no JS, CSS ou service worker. Nenhum dado de perfil no bundle (peso e plano de exemplo do dono ausentes; `data/plan.json` não traz mais data de início).
- URLs absolutas no bundle: só namespaces XML (`w3.org`) e `react.dev/errors/`. Nenhuma fonte, imagem, script ou API remota; fontes são locais (`/fitnez/fonts/...`).
- `scripts/verify-build.ts`: impõe lista fechada de arquivos (qualquer `.map` ou arquivo extra reprova), base coerente, precache completo, ausência de script inline, `sw.js` sem marcadores, CSP presente (apenas a presença: ver B3) e orçamentos de tamanho.
- Manifest: `id`, `start_url` e `scope` iguais à base; ícones locais. Service worker: só GET da mesma origem dentro da base e só URLs do precache; não guarda dados do usuário; atualização só quando o usuário aceita (`skipWaiting` por mensagem).

## F. Privacidade do usuário final

- O aviso do `README.md` ("somente neste aparelho, sem conta, sem analytics, sem envio a terceiros") **bate com a realidade**: no navegador, as requisições do app foram só de mesma origem (documento, script, estilo, fonte, imagem); `connect-src 'self'`; zero `fetch` de rede, `sendBeacon`, rastreador ou fonte remota. O `legacy/` (não publicado) carrega Google Fonts: só afetaria quem servir essa pasta.
- Dados de saúde (perfil, medidas, anotações, refeições) ficam em IndexedDB, em texto puro, sem criptografia, no aparelho. O backup JSON exportado é texto puro e, além do estado atual, inclui a área `recovery` (cópias anteriores e arquivos importados antes): quem compartilhar um backup compartilha também esse histórico. O CSV é texto puro. Vale uma linha no `README.md` e na tela de backup avisando: "o arquivo não é criptografado; guarde em local seguro". Fotos de progresso não existem (a importação recusa `photos`, `fotos`, `attachments`, `anexos`).
- Os mockups de `docs/referencia-visual/` mostram nome fictício e um rosto aparentemente gerado por IA, sem pessoa real identificável.

## G. Informativo

- I1. Nenhum `unsafe-inline` nem `unsafe-eval` na CSP; sem `eval` nem `new Function` no código.
- I2. Restauração de backup transacional e com prévia obrigatória, token de prévia que expira, recusa de versão futura e revisão otimista contra outra aba.
- I3. `npm run dev` e `preview` escutam em `0.0.0.0` (`package.json`, `vite.config.ts:24-25`): expõem o servidor local na rede. Prática de teste em celular; para quem clona, preferir `localhost` ou documentar.
- I4. O repositório já tem `LICENSE` MIT (titular: o usuário público) e o README está atualizado.
- I5. Os 8 PNG de `docs/referencia-visual/` e as fotos recortadas deles (`public/img/`) vêm de imagens geradas por IA (credencial C2PA com ferramenta e data de geração). Sem dado pessoal; a titularidade de imagens geradas é decisão do dono.
- I6. Estado do Git local: `git config --local` já aponta para o noreply; o `user.email` global continua pessoal (só vale fora deste repositório).
- I7. `skills-lock.json` e `agents/*.json` registram origem e hash das skills; úteis para conferir adulteração.
- I8. O último run do Actions falhou por um teste e2e instável de tema escuro (`tests/e2e/fase1.spec.ts:17`: esperava `data-theme="dark"` e recebeu `light`; causa não investigada aqui); precisa de correção para o deploy sair (não é segurança, mas bloqueia a publicação).

## Ações que exigem o dono

1. Perfil público do GitHub: ocultar o e-mail público e ligar "Keep my email addresses private" e "Block command line pushes that expose my email" (A2). Não consegui verificar essas duas opções (escopo `user` ausente no `gh`).
2. Configurações do repositório: ligar Dependabot alerts e security updates, ligar private vulnerability reporting, desligar a wiki (C1).
3. Decidir sobre o peso de teste no histórico (A1): recomendo aceitar; só recriar o repositório se quiser zero rastro.
4. Reexecutar o workflow depois de corrigir o teste instável, para o Pages publicar (a variável `PUBLICAR_PAGES` já está `true`).
5. Não publicar outros sites na origem `caua-manuel.github.io` sem avaliar (B4).
6. Decidir o destino de `agents/` e `.claude/skills/` (licenças e peso, D1).

Correções de código (via agentes, não feitas aqui): B1 (prioridade), B2, B3.

## O que não consegui verificar

- Configurações da conta GitHub que exigem o escopo `user` do token: e-mail privado, bloqueio de push com e-mail exposto e 2FA (`two_factor` retornou nulo).
- Alertas do Dependabot e do code scanning (desligados ou sem análise, então não há dados); configuração `admin:repo_hook` não concedida ao token.
- Se a wiki aceita edição pública (a API não informa essa opção).
- Comportamento real em iPhone, Safari e instalação no celular: testei só em Chromium (Playwright). A abertura de CSV no Excel e no LibreOffice não foi feita: a conclusão sobre fórmulas vem do conteúdo gerado e das regras conhecidas de OWASP.
- O site publicado: ainda responde 404, então o cabeçalho HTTP real do GitHub Pages (por exemplo, se há `X-Frame-Options` ou outros) não pôde ser conferido; revisar quando for ao ar.
- Revisão de licenças só por presença de arquivo `LICENSE` e pelos metadados de origem; não li cada licença de cada skill para checar compatibilidade jurídica.
- `git grep` cobre texto; arquivos binários além de imagens (fontes `woff2`) não foram abertos.
