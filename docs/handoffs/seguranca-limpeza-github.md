# Segurança: limpeza para o primeiro push público

- `.gitignore` ampliado: node_modules, dist, relatórios/resultados de teste, logs, pids, temporários, `.codex-*`, `.devops-preview*`, `.env*`.
- Varredura de segredos, e-mails, caminhos Windows e chaves: nada encontrado nos arquivos versionáveis.
- IPs locais (192.168.x.x) e IP de VPN removidos de INICIO.md, docs/FASE-1.md, docs/PUBLICACAO.md e handoffs (viraram `<IPv4-local>`).
- Perfil pessoal (idade, peso, altura, faculdade) generalizado em docs/ESPECIFICACAO.md; PROMPT.md em terceira pessoa. Regras, kcal, macros e `data/*.json` intactos.
- `legacy/` e `data/`: sem dado pessoal; nada alterado.
- README.md criado na raiz.
- Fora do escopo: histórico git (ainda inexistente); LICENSE do Fitnez (decisão do dono); licenças de pastas de skills sem LICENSE próprio (roast-idea, roast-prompts/roast-me, vercel-react-best-practices, impeccable/ui-ux-pro-max têm LICENSE na raiz).
- Skills vendorizadas: `agents/` 9,0 MB e `.claude/skills/` 2,8 MB; recomendação: versionar (AGENTS.md depende delas), após confirmar licenças.
