# Por onde começar

Guia curto para quem abre este repositório pela primeira vez. O que o app faz
está no [README](README.md). As regras de trabalho estão em [AGENTS.md](AGENTS.md).

## Situação

- O Fitnez está publicado em <https://caua-manuel.github.io/fitnez/>. Todo push
  na `main` passa pelas verificações do CI e, se elas passarem, publica uma nova
  versão (variável de repositório `PUBLICAR_PAGES=true`).
- Cinco abas: Início (o "Hoje"), Treino, Dieta, Evolução e Perfil. Há também o
  assistente de início, que monta plano e metas na primeira abertura.
- Sem back-end: os dados ficam no IndexedDB do aparelho, com backup e
  restauração por JSON (restauração transacional, ADR 002).

## Rodar no computador

Requer Node 24 ou superior. No PowerShell use `npm.cmd`; em outros sistemas, `npm`.

```powershell
npm.cmd ci
npm.cmd run dev        # desenvolvimento, porta 5173, sem service worker
npm.cmd run check      # configuração, tipos, testes unitários e build
npx.cmd playwright install chromium
npm.cmd run test:e2e   # ponta a ponta no Chromium
npm.cmd run preview    # build servido na porta 4173
```

Endereço local: `http://localhost:4173/Projeto-Treino/` (o build publicado usa
a base `/fitnez/`). O service worker guarda uma cópia antiga entre versões:
para conferir uma versão nova, use aba anônima ou uma porta diferente.

## Testar no celular

Com `npm.cmd run preview` aberto e o celular na mesma rede, abra
`http://<IPv4 do computador>:4173/Projeto-Treino/` (o IPv4 aparece em `ipconfig`).
Instalação, offline e área de transferência exigem HTTPS no celular; para isso,
use o endereço publicado.

## Mapa do repositório

| Local | Uso |
| --- | --- |
| `src/domain/` | Regras de treino, dieta e datas em funções puras, com teste |
| `src/data/`, `src/application/` | IndexedDB, migração, validação, backup e casos de uso |
| `src/app/` | Provedor de dados, fila de gravações e rotas |
| `src/features/` | Telas por aba; `src/ui/` é o design system |
| `src/pwa/` | Manifesto, service worker e instalação |
| `tests/` | Unitários e integração (Vitest) e ponta a ponta (Playwright) |
| `data/` | Plano, dieta e receitas de exemplo |
| `docs/decisoes/` | ADRs (decisões técnicas com o porquê) |
| `docs/handoffs/` | Entregas e evidências de cada agente especialista |
| `.claude/agents/`, `.codex/agents/` | Os oito agentes especialistas |
| `agents/`, `.claude/skills/` | Skills de terceiros vendorizadas, cada uma com sua licença |
| `DESIGN.md` | Tokens e padrões visuais |
| `legacy/` | Protótipo original, preservado sem alterações |

## Como o trabalho é feito

O agente principal orquestra; arquitetura, telas, dados, testes, segurança,
publicação e conteúdo de treino/dieta ficam com os agentes especialistas.
Cada decisão técnica vira ADR e cada entrega deixa um handoff. Números de
treino e dieta só mudam com revisão do agente `conteudo-treino-nutricao`.

## Dados e saúde

Limpar os dados do navegador apaga o histórico; faça backup em JSON de vez em
quando (Perfil). Treino e dieta são estimativas e não substituem acompanhamento
profissional.
