# Segurança: auditoria de limpeza para repositório público

Data: 2026-11-16. Auditoria somente leitura, sobre `git ls-files` mais os arquivos ainda não versionados (`git status`). Nenhum valor pessoal está reproduzido aqui: só arquivo, linha e tipo do dado.

## Resposta direta

O próximo commit pode subir limpo do ponto de vista de dados pessoais: sim. Não encontrei nome, e-mail, caminho de usuário, IP, token, idade, peso, altura ou medidas reais em arquivo versionado ou pendente de commit, nem credencial em workflow, e `npm audit` retorna 0 vulnerabilidades.

Não pode subir "pronto para qualquer pessoa usar" ainda: faltam o arquivo LICENSE (README diz "A definir"), a data de início fixa do plano em `data/plan.json:2` (vira data passada para quem abrir depois) e a configuração de e-mail do Git (item B1), que exporia um e-mail pessoal no próximo commit.

## Achado de topo para a decisão sobre o histórico

Nada mais grave que o peso de teste. Histórico tem 6 commits. Não há nome real, e-mail pessoal, credencial, caminho de usuário nem IP no histórico. Detalhes na seção 4. A decisão de não reescrever se mantém.

## A. Bloqueia a subida

Nenhum achado de dado pessoal bloqueia. O único bloqueio é de configuração, tratado como B1 por ser ação do dono e não de arquivo. Pelo critério do pedido ("pronto para qualquer pessoa"), tratar como bloqueio: LICENSE ausente (C1) e data fixa (B2).

## B. Corrigir antes de subir

B1. Autor do próximo commit vai expor e-mail pessoal.
- Onde: `C:/Users/<usuário>/.gitconfig` (escopo global; não há `user.*` local no repositório). O `user.email` global é um e-mail pessoal de provedor privado (tipo: e-mail pessoal), diferente do `noreply` usado nos 6 commits existentes. O `user.name` global tem formato diferente do nome dos commits antigos (ponto no lugar de hífen).
- Risco: qualquer commit feito sem `--author` sai com esse e-mail, e ele fica público e imutável no histórico.
- Correção: no repositório, `git config --local user.name "caua-manuel"` e `git config --local user.email "caua-manuel@users.noreply.github.com"` (mesmo valor dos commits atuais). Em GitHub, Settings, Emails, ligar "Keep my email addresses private" e "Block command line pushes that expose my email". Conferir com `git log -1 --format='%an <%ae>'` antes do `git push`.

B2. Data de início do plano fixa no seed.
- Onde: `data/plan.json:2` (campo `start`, data civil de segunda-feira específica), consumido em `src/data/migration.ts:7` (`foundation()` grava como `settings.start`).
- Tipo: data pessoal usada como valor real. É a mesma data do perfil pessoal do dono, e hoje é a data de hoje; para qualquer pessoa que abra o app depois, o plano já "começou" (semana N de 12) ou até já terminou (após cerca de 12 semanas).
- Troca pelo app: sim. `src/features/perfil/DataInicioSheet.tsx` (acessível por Perfil, Meu plano), com desfazer. Primeira abertura conduz a isso: não. A tela Início só mostra o texto de "plano começa em..." (`src/features/inicio/Inicio.tsx:155`) quando a data está no futuro; com a data no passado, nada convida a ajustar.
- Correção: o seed deve nascer sem data própria. Opções: (a) `foundation()` usar o dia atual (segunda-feira da semana corrente ou a próxima) em vez de `seedPlan.start`, e remover `start` de `data/plan.json`; ou (b) manter o campo só como referência e abrir `DataInicioSheet` na primeira abertura. Os botões "Começar o plano hoje" e "Treinar agora" em `Inicio.tsx` já existem para o caso de data futura. Requer validação do agente de dados (`validation.ts`) e atualização de testes que usam essa data como fixture.

B3. Metas de dieta fixas pressupõem uma pessoa.
- Onde: `src/domain/profile.ts:8-9` (`DEFAULT_PROTEIN_G`, `DEFAULT_FAT_G`, usados em `profile.ts:42` e `:46`); `src/domain/diet.ts:21-27` (tabela `TARGETS` de kcal e carboidrato por tipo de dia); `src/domain/diet.ts:33-35` (proteína e gordura padrão e água diária); `src/domain/profile.ts:10` (2,4 g/kg), exibido em `src/features/perfil/Perfil.tsx:112`.
- Tipo: metas de calorias, proteína, gordura, carboidrato e água de um perfil específico (adulto em recomposição com déficit leve), tratadas como "meta do usuário".
- Troca pelo app: proteína sim, indiretamente (muda com o peso informado em Perfil, `Perfil.tsx:112`). Kcal, carboidrato, gordura e água: não há tela para editar (nenhuma ocorrência de edição de meta em `Perfil.tsx`). Primeira abertura conduz: não; só `Perfil.tsx:288` traz o aviso de que são estimativas.
- Observação: pelo seu pedido, não proponho mudar os números do plano. Proponho tornar a situação honesta: rotular na Dieta e no Perfil como "meta de exemplo do plano" até o usuário informar peso, ou permitir editar a meta diária. Mínimo aceitável antes de subir: texto claro de que são valores de exemplo (via agente de frontend e conteúdo).

B4. Persona do dono em instruções de agentes versionados.
- Onde: `.claude/agents/conteudo-treino-nutricao.md:16` e o equivalente em `.codex/agents/conteudo_treino_nutricao.toml:3` (linha longa de `developer_instructions`).
- Tipo: perfil de saúde pessoal descrito como "contexto do usuário" (objetivo corporal, faixa de déficit calórico, preferências alimentares, orçamento). Sem nome nem medidas, mas é o único lugar em que o perfil real do dono aparece descrito.
- Correção: trocar por redação neutra ("perfil de exemplo, configurável", como já está em `docs/ESPECIFICACAO.md:5`), ou ignorar esses dois arquivos de agentes no Git se forem de uso só do dono.

## C. Opcional / desejável

C1. Falta arquivo de licença.
- Não existe `LICENSE*` na raiz (verificado por listagem). `README.md:52` diz "Licença: A definir".
- Correção: criar `LICENSE` com texto MIT, ano 2026, titular `caua-manuel` (decisão já tomada pelo dono), e trocar `README.md:52` por "MIT, veja LICENSE". Sem licença, por padrão o código fica "todos os direitos reservados" e ninguém pode legalmente reutilizá-lo, o que contradiz "qualquer pessoa usar". Esta é a pendência mais importante do item 7; tratar como obrigatória para a promessa de uso público.

C2. README.
- Já tem: descrição, recursos, stack, como rodar, estrutura, aviso de saúde (`README.md:42-44`) e privacidade com dados só no aparelho e sem analytics (`README.md:46-48`).
- Falta: instruções de uso para quem não é desenvolvedor (abrir o endereço do Pages, instalar na tela inicial, fazer backup/restaurar, onde apagar tudo), nota de que a data de início e o perfil são ajustados em Perfil, e como publicar o próprio Pages (hoje só em `docs/PUBLICACAO.md`). Também citar que os exercícios e a dieta são um plano de exemplo.
- `package.json` tem scripts `dev`/`preview` com `--host 0.0.0.0` (e `vite.config.ts:24-25`): expõe o servidor de desenvolvimento na rede local. É prática de teste em celular; registrar no README ou usar `localhost` por padrão.

C3. Capturas de referência visual.
- `docs/referencia-visual/tela-1.png` a `tela-8.png` (inspecionei tela-1, tela-5 e tela-8): são mockups com nome fictício e números genéricos, sem dado do dono. Pesam cerca de 1,3 a 1,7 MB cada. Sem ação de privacidade; opcionalmente conferir a origem/direitos das imagens e, no futuro, comprimir.

C4. Textos que mencionam "o dono" ou o perfil como papel (por exemplo `docs/decisoes/005-decisoes-do-dono-13-nov.md`, seção 3, linha 35): só o papel e o repositório; sem valores. Nome de usuário do GitHub e URL do repositório aparecem em `docs/PUBLICACAO.md:69`, `docs/decisoes/004-reconstrucao-fitnez-e-push.md:14`, `docs/decisoes/005-decisoes-do-dono-13-nov.md:35`, `docs/handoffs/arquiteto-entrega-a-t0.md:4` e `docs/handoffs/seguranca-entrega-a-revisao.md:19`: são públicos por definição, sem ação.

C5. Código de terceiros vendorizado.
- `agents/` (cerca de 9,0 MB) e `.claude/skills/` (cerca de 2,8 MB), cerca de 700 arquivos versionados. As ocorrências de caminhos, tokens de exemplo e e-mails que a busca retornou nessas pastas são fixtures e documentação dos próprios pacotes de terceiros (por exemplo `.claude/skills/roast-repo/runner/fixtures/parsers/gitleaks-sample.json`, `.claude/skills/roast-repo/runner/src/__tests__/redact.test.ts`), não segredos reais. `docs/handoffs/seguranca-limpeza-github.md:12` já registra que pastas sem LICENSE próprio ficam pendentes. Recomendação: antes de subir, confirmar licença das pastas sem LICENSE ou excluí-las do Git (`.gitignore`) se não forem necessárias a quem usa o app. Não afeta privacidade.

C6. Fixtures de teste usam a mesma data de início do dono.
- `tests/e2e/base-ui.spec.ts:3`, `tests/e2e/entrega-a-inicio.spec.ts` (várias linhas, por exemplo 5, 21, 69, 97), `tests/integration/repository.test.ts:7` e outros. Como a data civil é a mesma do perfil real, trocar por uma data neutra evita a associação; só mudaria quando B2 for feita (os testes dependem da data semeada). Em `scripts/capturas.cjs:26` e `scripts/capturas-desktop.cjs:26` o relógio simulado usa data da mesma semana; sem dado pessoal.

## 1. Dados pessoais em arquivos versionados e pendentes

Buscas feitas sobre arquivos versionados e não versionados que entram no commit (`git ls-files -o --exclude-standard`), excluindo imagens e fontes binárias:
- Nome de pessoa, e-mail pessoal, nome de usuário do sistema: nenhuma ocorrência fora de `docs/` com o usuário público do GitHub (C4). Ocorrências em `agents/ui-ux-pro-max/data/*.csv|json` são dados de fontes/produtos de terceiros.
- Caminhos `C:\Users\...`, `/Users/...`: nenhum no código do projeto. Resultados em `.claude/skills/roast-repo/*` e `agents/*` são exemplos de terceiros. `legacy/index.html:408` é um caminho de documento Firebase (`data/users/...`), sem dado real; `legacy/` não contém configuração do Firebase (sem `apiKey`, `projectId` etc.).
- IPs locais: nenhum IP real. `docs/handoffs/seguranca-limpeza-github.md:5` apenas descreve que foram removidos (menciona o padrão `192.168.x.x` sem valor completo).
- Tokens e chaves (`ghp_`, `github_pat_`, `AKIA`, blocos PEM, `password=`, `secret=`): só fixtures de terceiros em `.claude/skills/roast-repo` e `agents/auditoria-roast/roast-repo` (testes de detecção de segredo). Nenhum do projeto.
- Idade, peso, altura, medidas, objetivo corporal: comparei o conteúdo do perfil real (`perfil-pessoal.backup.json`, ignorado) com todos os arquivos versionados e pendentes. Nome: nenhum achado. Peso, altura, idade: nenhum achado; as coincidências de número são subcadeias de outros valores (por exemplo `tests/unit/profile.test.ts:27`, `docs/handoffs/frontend-reset-visual.md:24`) sem relação com o perfil. Objetivo: aparece como persona em B4 e, genérico, em `docs/ESPECIFICACAO.md:5` ("perfil de exemplo, configurável"), sem problema.
- Medidas corporais: o backup pessoal não tem medidas; nenhuma medida pessoal em fixtures. Os valores nos mockups de `docs/referencia-visual/` são fictícios.
- `public/img/**`: 9 fotos de refeição, exercício e treino; sem marcadores EXIF/GPS (verificação por busca de bytes). `public/` e `index.html` sem dado pessoal. `public/sw.js`, `legacy/manifest.webmanifest` e manifesto gerado: sem dado pessoal.
- `.github/workflows/pages.yml`: sem uso de `secrets.*`, `permissions: contents: read` por padrão, `persist-credentials: false`, ações fixadas por hash, publicação travada por variável `PUBLICAR_PAGES`. Sem segredos.
- `.claude/` e `.codex/`: apenas definições de agentes e skills, sem `settings.local.json` versionado e sem `user.*`. Ver B4.

## 2. Valores padrão no código

| Item | Onde | Específico de uma pessoa? | Troca pelo app? | Primeira abertura conduz? |
| --- | --- | --- | --- | --- |
| Perfil (nome, objetivo, idade, peso, altura) | `src/domain/profile.ts`, `src/domain/userData.ts:6,15` | Não: nasce vazio (todos opcionais) | Sim, em Perfil | Parcial: `Inicio.tsx:215` mostra "Olá!" sem nome; sem convite explícito ao perfil |
| Data de início do plano | `data/plan.json:2`, `src/data/migration.ts:7` | Sim (B2) | Sim (`DataInicioSheet.tsx`) | Não |
| Metas kcal e carboidrato por dia, gordura, água, proteína sem peso | `src/domain/diet.ts:21-35`, `src/domain/profile.ts:8-10` | Pressupõem um perfil (B3) | Só proteína (via peso) | Não |
| Agenda semanal (aulas de jiu-jitsu, vôlei, dias de academia) | `data/plan.json` (`sched`, a partir da linha 3), `src/domain/dayActivity.ts:3,11` | Pressupõe rotina (2 aulas de jiu-jitsu, vôlei no fim de semana), sem dado identificador | Parcial: editor de treino e opção de 3ª aula (`TerceiraAula.tsx`); não encontrei edição da agenda de aulas | Não |
| Plano de treino e cardápio | `data/plan.json`, `data/diet.json`, `data/recipes.json` | Conteúdo de exemplo; sem identificador | Sim (editor de treino, gerenciar opções da dieta) | Não |

Observação: números de treino e dieta não foram alterados nem recomendados para alteração.

## 3. `.gitignore`

Confirmado com `git check-ignore -v` e `git status --ignored`: `perfil-pessoal*` (cobre `perfil-pessoal.backup.json` na raiz), `.prototipo-dist*/` (11 pastas), `capturas/`, `dist/`, `test-results/`, `playwright-report/`, `.frontend-checks/`, `.npm-logs/`, `.codex-*` (logs e jsonl), `.devops-preview*`, `.env*`, `*.local.json` e `*.local.md` estão ignorados, e nenhum arquivo desses está no índice (`git ls-files` sem correspondência). Nada escapou.

Lacunas menores, desejáveis: padrões genéricos para backups exportados pelo app (por exemplo `*.backup.json`, `treino12-*.json`, `fitnez-*.json`) e para fotos de progresso; o padrão `perfil-pessoal*` só pega o nome atual.

## 4. Histórico do Git (6 commits, sem reescrever)

Commits: `8e079a2` (12/11), `eb20e9e`, `404a614`, `9c3a73d`, `8a12e19`, `c28254c` (13/11).
- Peso corporal de teste: aparece nos commits `8e079a2` e `eb20e9e`, como valor de medida em fixtures (`tests/e2e/fase1.spec.ts` linhas 5 e 23 ou 24, e `tests/integration/repository.test.ts` linhas 7, 14 e 27). Tipo: peso em kg usado como valor de medição sintética. Não está mais no HEAD nem nos arquivos pendentes. É o item que o dono já decidiu aceitar. Não achei idade nem altura do dono no histórico.
- Nenhum e-mail, nome real, caminho de usuário, IP local ou credencial no histórico do projeto (as ocorrências em `8e079a2` são só fixtures de segurança de terceiros em `.claude/skills/roast-repo` e `agents/`; a linha de `seguranca-limpeza-github.md` apenas menciona a remoção de IPs).
- Histórico contém `docs/handoffs/` e documentos de decisão que citam o repositório e o usuário público do GitHub: público por natureza.
- O arquivo de backup pessoal, capturas, logs e `.prototipo-dist*` nunca foram adicionados em nenhum commit (verificado por `--diff-filter=A` em todos os refs).

## 5. Autor e e-mail dos commits

- Todos os 6 commits: autor e committer iguais ao usuário público do GitHub, com e-mail `noreply` do GitHub. Isso é o que ficará público; não há exposição de e-mail pessoal.
- Remoto `origin`: repositório público do mesmo usuário.
- Configuração atual: ver B1, o `user.email` global não é o `noreply`. Corrigir antes do próximo commit.

## 6. npm audit e workflows

- `npm audit` (todos os níveis): found 0 vulnerabilities.
- Workflow único `.github/workflows/pages.yml`: roda `npm audit --audit-level=moderate`, sem segredos, ações fixadas por SHA. Sem achados.

## 7. O que falta para "qualquer pessoa usar"

| Requisito | Estado |
| --- | --- |
| README com instalação e como rodar | Existe (`README.md`), voltado a desenvolvedores; ver C2 para uso por usuário final |
| Aviso de dados só no aparelho | Existe: `README.md:46-48` e, no app, `Perfil.tsx:288` (aviso de estimativas) |
| Aviso de que não é orientação médica | Existe: `README.md:42-44` e `Perfil.tsx:288` |
| LICENSE (MIT, `caua-manuel`) | Não existe (C1) |
| Opção de apagar tudo no app | Não verifiquei nesta auditoria (fora do escopo pedido); conferir no Perfil se há "apagar todos os dados" |

## Lista curta de ações, em ordem

1. Criar `LICENSE` (MIT, 2026, `caua-manuel`) e atualizar `README.md:52`.
2. Configurar `user.name` e `user.email` locais para o `noreply` e ligar o bloqueio de e-mail no GitHub.
3. Tornar a data de início neutra (`data/plan.json:2` e `src/data/migration.ts:7`) e conduzir a primeira abertura ao ajuste.
4. Rotular as metas de dieta como exemplo ou torná-las editáveis (`diet.ts`, `profile.ts`, `Perfil.tsx`).
5. Neutralizar a persona em `.claude/agents/conteudo-treino-nutricao.md:16` e `.codex/agents/conteudo_treino_nutricao.toml:3`.
6. Opcionais: ampliar `.gitignore` para backups exportados, completar o README para usuário final, revisar licenças de `agents/` e `.claude/skills/`.
