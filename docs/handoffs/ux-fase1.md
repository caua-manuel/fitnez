# Handoff — ux_acessibilidade — Fase 1

Agente real ux_acessibilidade. Escrita sequencial concluída; somente DESIGN.md e este handoff foram alterados.

- DESIGN.md reconciliado com cores, superfícies, títulos compactos e faixa de 12 segmentos do legacy; direção operacional, seis abas e estados honestos da fundação.
- Tokens claro/escuro, fallback offline sem download de fontes, mobile 360px/desktop, teclado/foco/safe area/reduced-motion e fluxos reais de Mais documentados. Verde/vermelho claros escurecidos para texto sobre fundos suaves.
- Leitura: AGENTS.md, especificação, definição TOML, DESIGN anterior, legacy, ADR003/CONTRATOS, frontend-design, Impeccable (document/operate), Emil, UI/UX Pro Max (quick-reference/dados UX e stack React), React best practices (event listeners/estado derivado), verification-before-completion.
- Impeccable context executado e falhou: engine 0.1.22 ausente, cache fora da área gravável. Aplicado fallback previsto, sem bypass; PRODUCT.md não existe, contexto veio de especificação/legacy/ADRs. Não criados sidecars fora da propriedade autorizada.
- Pesquisa Python não executável: python ausente; Get-Command python3/py não encontrou alternativas. Usados dados/referências locais, sem alegar resultado de pesquisa. shadcn não será utilizado.
- Contraste sRGB calculado via Node: texto/card 16,19/14,41, auxiliar/card 5,89/6,96, azul/card 6,63/6,31, sucesso/suave 5,48/6,03, erro/suave 5,37/4,63 e contorno/superfície auxiliar 3,66/3,95 (claro/escuro). Isso valida pares escolhidos, não UI completa.

## Apontamentos para implementação

| Prioridade | Antes | Depois / correção sugerida | Motivo |
| --- | --- | --- | --- |
| Crítico | Possível confirmação antes do commit | Mostrar salvo/importado apenas após retorno do repositório; erro persistente e nova tentativa | Evitar falsa proteção dos dados |
| Crítico | Importação sem contexto | Prévia de contagens, aviso de substituição e confirmar/cancelar explícitos; conflito de fontes requer escolha | Evitar substituição involuntária |
| Importante | Verde/vermelho legacy em fundo suave abaixo de 4,5 para texto pequeno | Usar tokens ajustados do DESIGN | Contraste legível |
| Importante | Fontes remotas no legado | Fallback local documentado e nenhum link obrigatório remoto | Offline íntegro |
| Importante | Seis abas em 360px e barra fixa | Seis alvos de 60px de altura, rótulo visível, safe area e espaço de conteúdo reservado | Uso com uma mão e foco não encoberto |
| Desejável | Movimento decorativo repetido | Transições discretas somente para feedback; teclado/reduced-motion sem deslocamento | Rapidez e conforto |

UI ainda não existe para inspeção nesta etapa: não realizados screenshots, navegação real, teste de leitor de tela ou Safari físico. Frontend/QA devem validar a checklist do DESIGN no app executável. Sem código de UI, dependência, regra de treino/dieta ou alteração em legacy/data/skills. Sem commit/push/publicação. Escrita liberada.
