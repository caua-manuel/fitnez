# DevOps: evidência e repetição do e2e no CI

## Mudanças
- `.github/workflows/pages.yml`: novo passo após "Testar fluxos e modo offline no navegador", `if: ${{ !cancelled() }}`, `actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2`, artefato `playwright-evidencia` (`test-results/` e `playwright-report/`), `retention-days: 7`, `if-no-files-found: ignore`. Sem nova permissão (o job segue com `contents: read` e `pages: read`).
- `playwright.config.ts`: `retries: process.env.CI ? 1 : 0`. O reporter já era `list` + `html` (open never), então não mudou. `trace: 'retain-on-failure'` e `screenshot: 'only-on-failure'` mantidos: `on-first-retry` gravaria só a repetição, não a primeira falha.

## Conferência da action
- Tag v7.0.2, publicada em 07/10/2026 (40 dias antes de 16/11/2026), não é pré-lançamento.
- `git/ref/tags/v7.0.2` é do tipo `commit` (tag leve) e aponta para `cf430e030ddbb5b0abf93d22962f4752f3646cd9`; `commits/v7.0.2` devolve o mesmo SHA.

## Privacidade
Os specs e2e criam todos os dados no navegador de teste (perfil, treinos, refeições fictícios); nenhum lê arquivos pessoais, e a busca por e-mail e caminhos de usuário nos specs não achou nada. Screenshots, traces e o HTML contêm só as telas desses testes. Artefatos de repositório público são baixáveis por qualquer pessoa autenticada; manter dados reais fora dos specs. Retenção de 7 dias.

## Resultados
- YAML: sem `actionlint` nem Python na máquina; parse estrito com a biblioteca `yaml` instalada fora do projeto (pasta temporária): válido, passo na posição certa. Não validado por actionlint.
- `npm run test:config`: 9 de 9 verdes.
- `npm run build`: verde; JS 172,8 KB de 190 KB, CSS 22,0 KB de 24 KB; artefato verificado.
- `CI=true E2E_PORT=4297 npx playwright test tests/e2e/fase1.spec.ts`: 23 de 23 verdes (o preview da porta 4181 não foi tocado).

## Riscos
- Com `if: !cancelled()` o artefato é enviado em toda execução (o relatório HTML sempre existe), ocupando alguns MB por 7 dias.
- Repetição pode mascarar falha intermitente no status do job; confirme o `flaky` no log e no relatório.
- Primeira execução real do passo só acontece depois do push; o upload não foi testado no GitHub.
