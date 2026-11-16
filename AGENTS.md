# Treino 12 semanas — instruções permanentes

## Como a IA deve trabalhar

- Stack aprovada: React + TypeScript + Vite, com CSS próprio. A Fase 1 e a reconstrução do app (Início, Treino, Dieta, Evolução e Perfil) estão concluídas; novas fases exigem aval do usuário.
- Arquitetura, front-end, dados, testes, segurança e deploy são feitos pelos subagentes personalizados em .codex/agents/. O agente principal orquestra, revisa e integra; não escreve diretamente código desses domínios.
- Acione explicitamente o agente certo e aguarde sua entrega: arquiteto, frontend, backend_dados, ux_acessibilidade, qa_testes, seguranca_privacidade, devops_github e conteudo_treino_nutricao.
- Paralelismo somente para leitura, análise, revisão e testes. Para escrita, um agente por pasta ou arquivo por vez. Cada agente deixa resumo curto em docs/handoffs/.
- Não simule subagentes como se tivessem sido executados. Se uma limitação impedir acioná-los, registre o bloqueio real.
- Sem backend nem banco externo: IndexedDB no aparelho, backup JSON e hospedagem estática no GitHub Pages. Restauração transacional conforme ADR 002.
- Preserve legacy/ integralmente. Não altere números de treino/dieta sem revisão do conteudo_treino_nutricao e registro do motivo.
- Poucas dependências; justifique cada uma em ADR. Regras de negócio ficam em funções puras fora dos componentes e com testes. Confira o caminho base do Pages.
- Tome decisões técnicas e registre em docs/decisoes/. Não publique, não faça push nem avance de fase sem autorização correspondente.

## Como falar comigo

- Faça todo o trabalho técnico. Não explique conceitos de programação. Toda comunicação e interface em português do Brasil.
- Pergunte somente decisões do usuário sobre aparência, comportamento, treino ou dieta, sempre com recomendação e resposta curta para confirmar.
- Ao fim de cada fase, pare e entregue: resumo de até cinco linhas, passo a passo curto para testar no celular e o que mudou nos dados. Aguarde aval antes da próxima fase.

# Instruções do projeto e Agent Skills

## Consulta obrigatória por tipo de tarefa

Antes de iniciar planejamento, banco de dados, testes, depuração ou interface,
leia os arquivos `SKILL.md` correspondentes na organização abaixo e siga suas
instruções, incluindo as referências e os recursos auxiliares aplicáveis.

| Categoria | Localização e ponto de entrada |
| --- | --- |
| Planejamento e fluxo de desenvolvimento | `./agents/planejamento/superpowers/SKILL.md`; selecione as skills em `./agents/planejamento/superpowers/skills/`, especialmente `brainstorming`, `writing-plans` e `executing-plans` |
| Descoberta de skills | `./agents/planejamento/find-skills/SKILL.md` |
| Backend, dados e Supabase | `./agents/backend-dados/supabase/SKILL.md` |
| Testes de aplicação web com Playwright | `./agents/testes-debug/webapp-testing/SKILL.md` |
| Depuração sistemática | `./agents/testes-debug/systematic-debugging/SKILL.md` |
| Estética de interfaces | `./agents/frontend-ui/frontend-design/SKILL.md` |
| React e Next.js: boas práticas | `./agents/frontend-ui/vercel-react-best-practices/SKILL.md` |
| Roast / Auditoria Crítica | `./agents/auditoria-roast/`; escolha a skill na seção abaixo |

Para uma tarefa que atravesse categorias, consulte todas as skills pertinentes.
Antes de concluir, consulte também a skill Superpowers
`./agents/planejamento/superpowers/skills/verification-before-completion/SKILL.md`
e verifique o resultado com evidências adequadas ao trabalho.

As 15 skills do Superpowers, as outras cinco skills da instalação inicial e
as três variações de Roast estão instaladas
individualmente em `./.claude/skills/` para descoberta pelo Claude Code. As pastas
por categoria em `./agents/` são cópias locais completas, sem necessidade de
privilégios para symlinks no Windows. Ao atualizar uma skill, sincronize todas
as cópias; commits, locais e hashes estão em `./agents/skill-installations.json`.
O nome local `vercel-react-best-practices` corresponde à pasta upstream
`skills/react-best-practices` do repositório `vercel-labs/agent-skills`.

Resolva referências e scripts a partir da pasta da skill consultada. Instalar as
skills não instala os runtimes e pacotes das aplicações: a execução de testes
Playwright requer Python e Playwright configurados conforme a skill, e ações
Supabase exigem as ferramentas e credenciais pertinentes à tarefa.

## Roast / Auditoria Crítica — `agents/auditoria-roast/`

Leia o `SKILL.md` correspondente antes de iniciar a auditoria solicitada:

| Comando | Quando acionar | Instruções locais | Instalação Claude Code |
| --- | --- | --- | --- |
| `/roast-me` | Revisar hábitos de prompt, uso do agente e desperdício de tokens, com base nos dados efetivamente disponíveis | `./agents/auditoria-roast/roast-prompts/SKILL.md` | `./.claude/skills/roast-me/` |
| `/roast-idea` | Testar ideias, propostas e premissas de PRDs antes da implementação; questionar público, alternativas, viabilidade e evidências | `./agents/auditoria-roast/roast-idea/SKILL.md` | `./.claude/skills/roast-idea/` |
| `/roast` | Auditar falhas de código e do repositório com evidências, incluindo segurança, arquitetura e fluxos aplicáveis ao produto | `./agents/auditoria-roast/roast-repo/SKILL.md` | `./.claude/skills/roast-repo/` (nome upstream: `roast`) |

Fontes utilizadas:

- Prompts: `https://github.com/ericrisco/rsc-harness`, skill `roast-me`,
  instalada com a CLI `skills`, que registrou sua origem em `./skills-lock.json`.
- Ideias: `https://github.com/mfranzon/roast-me`.
- Repositório: `https://github.com/janderswag/roast-skill` (Roast & Rebuild).

Os dois últimos repositórios foram identificados pela descrição do pedido,
pois os links recebidos continham apenas `https://github.com`. A skill de ideias
foi trazida da subpasta upstream `.claude/skills/roast-me/` para a raiz da
instalação `roast-idea`; seu nome no frontmatter foi adaptado para `roast-idea`
e o gatilho genérico da descrição foi desambiguado para evitar colisão com a
auditoria de prompts. As demais instruções foram preservadas.

Resolva scripts, módulos e referências a partir da pasta local consultada.
Por exemplo, caminhos upstream `~/.claude/skills/roast/runner/...` correspondem
a `./.claude/skills/roast-repo/runner/...` nesta instalação. Não presuma a
existência de uma instalação global.

Roast & Rebuild é uma auditoria de leitura: reporte achados verificáveis e
recomendações, sem aplicar correções automaticamente. Para prompts, siga as
regras de acesso e privacidade da skill e declare quando faltarem histórico ou
métricas; não invente consumo de tokens. A instalação não executa auditorias
nem instala as dependências opcionais dos runners.

Sincronize as cópias em `agents/` e `.claude/skills/` ao atualizar. Fontes,
commits disponíveis, adaptações e hashes constam em
`./agents/skill-installations.json`; para `roast-me`, o hash de origem informado
pela CLI está também em `./skills-lock.json`.

## Regras adicionais de interface

Antes de criar ou editar qualquer código de interface, leia este arquivo,
`./DESIGN.md` e os quatro arquivos de skills locais:

1. `./agents/frontend-ui/frontend-design/SKILL.md` — direção estética e composição.
2. `./agents/impeccable/SKILL.md` — refinamento, crítica e auditoria.
3. `./agents/emil-design-eng/SKILL.md` — animações e microinterações.
4. `./agents/ui-ux-pro-max/SKILL.md` — pesquisa de UI/UX e orientação por stack,
   incluindo shadcn/ui.

Para interfaces React ou Next.js, leia também
`./agents/frontend-ui/vercel-react-best-practices/SKILL.md`.
A cópia anterior em `./agents/frontend-design/` foi preservada por compatibilidade;
o caminho categorizado acima é o ponto de consulta preferencial.

Siga as regras dessas skills e consulte as referências, scripts e dados auxiliares
que elas indicarem conforme a tarefa. Isso vale para páginas, componentes,
estilos, layouts, formulários, navegação, estados e animações.

## Fluxo obrigatório

- Confira o pedido, o público, a identidade visual e os padrões existentes antes
  de escolher a direção visual. Registre lacunas; os valores iniciais de
  `DESIGN.md` são provisórios e não representam uma marca aprovada.
- Use `DESIGN.md` como fonte central de tokens e padrões. Atualize-o quando uma
  decisão visual for adotada, mantendo documentação e implementação coerentes.
- Priorize instruções explícitas do usuário e restrições do projeto. Em caso de
  conflito entre as skills, preserve acessibilidade, comportamento funcional e
  consistência com o sistema visual documentado; registre a decisão relevante.
- Reaproveite componentes existentes. Quando shadcn/ui for utilizado, consulte
  também `./agents/ui-ux-pro-max/data/stacks/shadcn.csv` e aplique os tokens
  semânticos do projeto.
- Verifique o resultado em tamanhos de tela relevantes, navegação por teclado,
  foco, contraste, estados de erro/carregamento e movimento reduzido. Informe
  limitações de validação quando não houver aplicação executável.

## Caminhos locais e ferramentas

As skills foram vendorizadas em `./agents/`. Resolva caminhos de scripts e
referências a partir da pasta da respectiva skill. Exemplos upstream com
`.claude/skills/`, `.agents/skills/`, `.agent/skills/` ou `CLAUDE_PLUGIN_ROOT`
devem apontar para a cópia local correspondente; não presuma plugins instalados.

- Impeccable no PowerShell: `& ./agents/impeccable/scripts/impeccable.cmd context`.
  Mantenha o diretório de trabalho na raiz do projeto e siga o procedimento de
  fallback documentado na skill se o launcher não funcionar. O launcher pode
  baixar seu engine no primeiro uso.
- Pesquisa UI/UX: `python ./agents/ui-ux-pro-max/scripts/search.py "form accessibility" --stack shadcn`.
  Requer Python 3; tente `python3` ou `py -3` quando disponíveis. Se não houver
  interpretador funcional, consulte os dados e referências locais e informe a
  limitação, sem alegar que a pesquisa foi executada.

Não altere as cópias upstream apenas para adaptar exemplos de caminhos.
Fontes, commits e hashes dos arquivos originais estão em `./agents/sources.json`.
Preserve licenças e atribuições ao atualizar as skills.
