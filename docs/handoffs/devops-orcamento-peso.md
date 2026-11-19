# Handoff devops: revisão do orçamento de peso (19/11/2026)

## O que mudou
- `scripts/verify-build.ts`: limites JS 190 -> 215 KB gzip e CSS 24 -> 28 KB gzip; comentário aponta para o ADR 006. Nenhum `scripts/*.test.ts` fixava esses números.
- `docs/decisoes/006-biblioteca-de-icones-e-movimento.md`: seção "Revisão de 19/11/2026" (números antigos e novos, motivo, regra de nova revisão) e correção da divergência CSS 12 KB (ADR) x 24 KB (build).

## Resultados reais
- `npx vite build`: ok (aviso do Vite de chunk > 500 KB minificado, um único `index-*.js`).
- `node scripts/verify-build.ts`: ok. "JavaScript 196,1 KB de 215 KB; CSS 22,8 KB de 28 KB." 21 arquivos, 21 URLs de precache, CSP ok.
- `npm run test:config`: 9 passaram, 0 falharam.
- `npx tsc --noEmit -p .`: sem erros no momento da execução.

## Avaliação: carregar sob demanda (não implementado)
- Hoje tudo está em um só chunk (`index-*.js`, ~196 KB gzip). `App.tsx` importa `Assistente` estaticamente.
- Assistente de início (`src/features/assistente/`, ~25 KB de código-fonte): só é usado na primeira abertura ou quando reaberto no Perfil. `React.lazy(() => import(...))` com `Suspense` tiraria dele algo em torno de 5 a 8 KB gzip do JS inicial (estimativa). Boa candidata: baixo risco, rota isolada (`if (assistant ...) return <Assistente/>`). Atenção: `store.ts` (`openAssistant`, `useAssistantMode`) deve continuar no chunk principal; só o componente vai para o chunk separado.
- Página do exercício (`ExercicioPagina.tsx` + `data/exercise-guide.json`, 14 KB bruto): ganho menor (estimativa 3 a 6 KB gzip), mas o guia é importado por `src/domain/exerciseNotes.ts`; para render só sob demanda, o JSON também teria de ir para o chunk lazy, sem ser puxado pelo domínio.
- Ganho total esperado: ~10 KB gzip no carregamento inicial. Não reduz o total baixado na instalação, porque o precache baixa tudo.

## Service worker e offline
- O SW (`public/sw.js`) precacheia uma lista gerada no build, e `verify-build.ts` exige que todo arquivo do artefato (incluindo qualquer `assets/*.js`) esteja no precache. Chunks novos de import dinâmico entram automaticamente na lista e a verificação falha se algum faltar, então o offline continua garantido.
- Cuidado na implementação: testar no e2e a abertura do assistente e da página do exercício offline (após `PRECACHE_READY`), e manter `Suspense` com um fallback discreto.

## Recomendação
Fazer primeiro o lazy do `Assistente` (maior ganho e menor risco), depois avaliar a página do exercício. Medir de novo com `node scripts/verify-build.ts`. Se estourar 215/28 de novo, outra revisão no ADR 006.
