# Licenças das skills vendorizadas sem LICENSE local (achado D1)

Data: 16/11/2026. Somente levantamento; nada foi alterado.

## Pastas sem arquivo de licença

| Skill | Pastas | Origem registrada em `agents/skill-installations.json` |
| --- | --- | --- |
| `roast-idea` | `.claude/skills/roast-idea`, `agents/auditoria-roast/roast-idea` | `https://github.com/mfranzon/roast-me`, commit `556dd64...`, `git clone`, caminho `.claude/skills/roast-me`; com alterações locais (arquivos movidos para a raiz, frontmatter renomeado) |
| `roast-me` | `.claude/skills/roast-me`, `agents/auditoria-roast/roast-prompts` | `https://github.com/ericrisco/rsc-harness`, caminho `skills/roast-me`, `npx skills add`, commit nulo, hash do CLI registrado, sem alterações locais |
| `vercel-react-best-practices` | `.claude/skills/vercel-react-best-practices`, `agents/frontend-ui/vercel-react-best-practices` | `https://github.com/vercel-labs/agent-skills`, commit `1a2c79d...`, caminho `skills/react-best-practices` |

Todas as demais skills vendorizadas têm `LICENSE` ou `LICENSE.txt` local.

## O que dá para afirmar

- `agents/sources.json` não registra licença para essas três; só lista arquivos
  de LICENSE de outras fontes. `skill-installations.json` também não traz campo
  de licença para elas.
- `vercel-react-best-practices`: o frontmatter do `SKILL.md` local declara
  `license: MIT` e `author: vercel`. É uma declaração dentro do próprio arquivo,
  não substitui o texto da licença do repositório de origem.
- `roast-idea` e `roast-me`: nenhum arquivo local menciona licença. Sem o
  LICENSE da origem não é possível afirmar os termos (os repositórios de origem
  não foram consultados na rede neste levantamento). Ausência de licença em um
  repositório público normalmente significa todos os direitos reservados, o que
  não autoriza redistribuição.
- `roast-idea` foi modificada localmente, o que torna a atribuição mais
  relevante.

## Recomendação (decisão do dono)

1. **Verificar a licença na origem** de cada um dos três repositórios (arquivo
   LICENSE e página do repositório no GitHub), na versão do commit registrado.
2. Se a origem for permissiva (por exemplo MIT): **adicionar o arquivo de
   licença de origem** em cada pasta e manter, com atribuição (repositório,
   commit, alterações locais).
3. Se a origem não tiver licença ou for restritiva: **retirar do repositório
   público** (as skills continuam úteis localmente se adicionadas ao
   `.gitignore`) ou pedir permissão ao autor.
4. Enquanto isso não for decidido, a opção mais segura para um repositório
   público é a 3, em especial para `roast-idea` e `roast-me`. Para
   `vercel-react-best-practices`, a declaração MIT local torna a opção 2 a mais
   provável.
