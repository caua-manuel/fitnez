# DevOps: endurecimento da verificação do build

Data: 16/11/2026. Sem commit, push ou mudança de configuração no GitHub.

## Mudanças

- `scripts/csp-check.ts` (novo): verificador puro das diretivas da CSP e de URLs remotas.
- `scripts/verify-build.ts`: substitui a checagem da string da CSP por esse verificador, e confere também o CSS e o manifesto do `dist`.
- `scripts/csp-check.test.ts` (novo) e `package.json` (`test:config` agora roda os dois arquivos de teste).
- `docs/PUBLICACAO.md`: seções "Limites de segurança do GitHub Pages" e checklist de endurecimento do repositório (não executada).
- `docs/handoffs/devops-licencas-skills.md`: levantamento D1.

## O que passa a ser verificado

`default-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'` exatos; `script-src` exatamente `'self'`; sem `unsafe-inline`, `unsafe-eval`, `unsafe-hashes` em script/default; `connect-src` somente `'self'`; nenhuma diretiva com origem externa, curinga, `data:` ou `blob:`; nenhuma URL `http(s)://` ou `//` em `src`/`href`/`srcset` de script, link, img, source, iframe, embed, object, áudio e vídeo; nenhum `<style>` embutido; nenhum `url()` ou `@import` remoto no CSS e no manifesto. A CSP é lida decodificando entidades (o Vite emite `&#39;`).

## Prova de que falha com entrada ruim

`scripts/csp-check.test.ts` injeta num HTML sintético: `unsafe-inline`, `unsafe-eval`, `default-src` ausente ou `*`, `object-src 'self'`, `base-uri 'self'`, `form-action` ausente, `connect-src` e `script-src` com origem externa, meta de CSP ausente, scripts/links/imagens/fontes remotos, `<style>` embutido e CSS remoto. Todos são reprovados. Durante a implementação o build real falhou uma vez (6 erros) por causa de `&#39;` não decodificado, o que confirmou que a falha interrompe `npm run build`; corrigido e coberto por teste.

## Resultados reais

- `npm run test:config`: 9 testes, 9 passaram, 0 falharam.
- `npm run build`: passou (typecheck, vite build, verify-build). JS 172,4 KB de 190 KB; CSS 21,6 KB de 24 KB; 21 arquivos, 21 URLs de precache. O aviso de chunk maior que 500 kB é do Vite e já existia.

## Licenças

Ver `docs/handoffs/devops-licencas-skills.md`. Resumo: `roast-idea`, `roast-me` e `vercel-react-best-practices` não têm LICENSE local; só a última declara `license: MIT` no frontmatter. Recomendação: conferir a licença na origem; adicionar o LICENSE e manter com atribuição se permissiva, ou retirar do repositório público se não houver licença. Decisão do dono.
