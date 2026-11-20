# Handoff arquiteto: ADR 011

- Criado `docs/decisoes/011-pronto-para-amigos-e-ferramentas-da-academia.md` (adotada na arquitetura). Nenhum código de produto escrito.
- Medição local (build de 20/11/2026, gzip): JS inicial 192,8 KB + assistente 6,3 KB = 199,1 KB; CSS 22,7 + 1,0 = 23,7 KB.
- Demo isolada em banco próprio `treino12:demo:<base>`, escolhido por marca em `localStorage` antes de criar o repositório; o real nunca é aberto na demo. Gerador puro em `src/demo/`, só por `import()`.
- Lembrete de backup por 7 dias de uso (`meta.usage`, atualizado no primeiro `save` do dia); persistência e guia de instalar no primeiro treino real concluído (`meta.prompts`).
- Plano compartilhado `{ app: 'fitnez-plano', v: 1, name, plan, sched? }`, lista branca estrita, 200 KB, colisão de id renomeia, aplicação numa transação com desfazer.
- Fase 2: `restoreRest` puro (descanso vencido ao voltar), `useWakeLock`, `inputmode` corrigido nas repetições, alvos de 48 px, histórico rápido (5 sessões), anilhas na série, `weekSummary` + cartão canvas, `stagnation` (números do conteúdo).
- Orçamento revisado: inicial JS 205 / CSS 26 KB; total JS 250 / CSS 32 KB; por chunk sob demanda JS 20 / CSS 4 KB.

## Para cada agente
- `devops-github`: duas medidas e limite por chunk em `scripts/verify-build.ts`; checagem de que `src/demo/` só entra por `import()`.
- `backend-dados`: `dbName`, `createDemoRepository`, `meta.usage`/`meta.prompts`/`settings.planImport` com validação, `planShare`, `restoreRest`, `weekSummary`, `stagnation`, `backupDue`.
- `frontend`: `src/app/mode.ts`, faixa da demo, telas de compartilhar e resumo sob demanda, folhas de histórico e anilhas, Wake Lock, token `--tap-min` no `DESIGN.md`.
- `conteudo-treino-nutricao`: números da demo, "dia na meta" da dieta, regra completa da estagnação.
- `qa-testes`: testes listados em cada item do ADR.
- `seguranca-privacidade`: revisar 1.1, 1.3 e 2.5.

## Pendências do dono
Cinco decisões no fim do ADR (demo com assistente, 7 dias de uso, rotina no plano importado, observações no plano, dieta no cartão).
