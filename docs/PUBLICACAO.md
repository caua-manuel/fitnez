# Publicação e operação — Fase 1

Data: 12/11/2026. Responsável: agente `devops_github`.
Situação: configuração local, sem commit, push ou publicação executados.

## Comandos locais

Requer Node 24 ou superior. No PowerShell, usar os launchers `npm.cmd` e
`npx.cmd` quando a política do sistema impedir os arquivos `.ps1`.

```powershell
npm.cmd ci
npm.cmd run check
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run preview
```

A suíte E2E é entregue pelo `qa_testes`; a existência desse comando não significa
que seus testes já foram executados. Consulte o handoff de QA e `FASE-1.md`.
Desenvolvimento: `npm.cmd run dev`, porta 5173. Prévia do build: porta 4173.
Ambos escutam em `0.0.0.0` para permitir teste na mesma rede.

Use o IPv4 local do adaptador Ethernet/Wi-Fi (`ipconfig`); ignore adaptadores de VPN.

## Caminho base

`scripts/base-path.ts` é compartilhado pelo Vite e pela verificação do artefato.
Padrão local: `/Projeto-Treino/`. `VITE_BASE_PATH` explícito tem prioridade e é
validado. No CI, `GITHUB_REPOSITORY=dono/repositorio` produz `/repositorio/`;
`dono/dono.github.io` produz `/`.

Para conferir temporariamente a base raiz no PowerShell:

```powershell
$env:VITE_BASE_PATH = '/'
npm.cmd run build
Remove-Item Env:VITE_BASE_PATH
npm.cmd run build
```

O último comando restaura a base local padrão. Mudar a base também muda o
namespace de armazenamento da aplicação; manter o endereço publicado estável.
Antes de mudar endereço ou base em uso, exportar o backup e importar no destino.

## Workflow preparado

`.github/workflows/pages.yml` executa em pull requests, pushes para `main` e
disparo manual. As Actions estão fixadas por SHA oficial verificado em
12/11/2026. O fluxo:

1. Instala o lockfile com `npm ci` e verifica advisories moderados ou superiores.
2. Executa testes de base, TypeScript, testes unitários/integração e build.
3. Instala Chromium e executa o E2E; build, preview e E2E usam `VITE_BASE_PATH=/fitnez/` (nome do repositório). Localmente o padrão segue `/Projeto-Treino/`; o `playwright.config.ts` deriva URL e preview da mesma variável (`E2E_PORT` troca a porta, padrão 4173) e escolhe `npm`/`npm.cmd` por plataforma.
4. Somente em `main` **e** com a variável de repositório `PUBLICAR_PAGES` igual a `true`, envia `dist/` e publica no ambiente `github-pages`. Sem a variável, o workflow só verifica e constrói (trava de publicação; o Pages não está habilitado e a publicação aguarda autorização do dono).

Pull requests não recebem permissões de publicação. O job de verificação tem
leitura de conteúdo/Pages; somente o job de publicação recebe `pages: write`
e `id-token: write`. Não há token de terceiros no código. A configuração de
Pages precisa existir no repositório; o workflow não habilita o serviço
silenciosamente nem concede permissões a si mesmo.

## Habilitar no GitHub após autorização de publicação

Passo a passo do dono (não executado até a autorização):

- **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- **Settings → Secrets and variables → Actions → Variables → New repository variable**: nome `PUBLICAR_PAGES`, valor `true`.
- Rodar o workflow (push em `main` ou *Run workflow*). Endereço esperado: `https://caua-manuel.github.io/fitnez/`. Para voltar a bloquear, apagar a variável ou mudar o valor.

Detalhes:

1. Revisar os dados pessoais da documentação antes de criar um repositório
   público. O GitHub Free oferece Pages para repositórios públicos; requisitos
   de outros planos devem ser conferidos na conta utilizada.
2. Criar o repositório, configurar o remoto e enviar os arquivos da aplicação,
   o lockfile e o workflow para `main`, excluindo backups, fotos, segredos,
   logs locais e `node_modules` conforme `.gitignore`.
3. Em **Settings → Pages → Build and deployment → Source**, selecionar
   **GitHub Actions**. Verificar que o ambiente `github-pages` aceita `main`.
4. Executar o workflow e aguardar a conclusão dos checks e da publicação.
   O endereço verdadeiro será mostrado pelo job; não foi criado nesta entrega.
5. Abrir esse HTTPS no celular, esperar “Disponível offline”, instalar pela
   opção do navegador e então testar sem rede.

Esses passos documentam uma publicação futura. Nenhum envio ao GitHub foi
realizado nesta tarefa. Sem repositório/remote configurados não é possível
alegar que o CI remoto passou.

## Artefato, PWA e atualizações

`npm run build` gera manifesto e service worker nativos e verifica `dist/`
automaticamente. A verificação recusa arquivos inesperados, marcadores não
substituídos, manifesto/base divergentes ou recursos fora do precache.
Sementes ficam nos bundles; documentos, backups e históricos não entram no
artefato. Isso não protege documentos publicados no próprio repositório.

O cache tem namespace da aplicação/base e hash dos assets e do template SW.
Só versões antigas do mesmo namespace são removidas. A nova versão é oferecida
por aviso e aplicada por ação do usuário, aguardando operações de dados. O build
inclui CSP via meta antes dos scripts; o modo de desenvolvimento não recebe essa
política para manter HMR sem permissões extras no build de produção.

GitHub Pages não permite configurar todos os cabeçalhos HTTP pela aplicação.
`frame-ancestors` não é declarado em meta porque seria ignorado; não afirmar
proteção de cabeçalho inexistente. Nenhum recurso remoto obrigatório é liberado
pela CSP desta fase. Caso futura funcionalidade exija outra origem ou estilo
inline, deverá passar por revisão específica, sem adicionar `unsafe-inline`
ou `unsafe-eval` por conveniência.

## Referências oficiais

- [Deploy de Vite no GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).
- [Workflows personalizados do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
