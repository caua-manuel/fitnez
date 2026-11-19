# QA: falha do CI em "Treino livre" (run 44598078875, commit 89d8fa6)

## Causa raiz (comprovada): bug do teste, não do app
`tests/e2e/hoje-livre-atalhos.spec.ts`, teste "Treino livre: escolher da biblioteca, registrar, concluir...": o `page.reload()` vinha logo depois do clique em "Série 1 concluída", antes de a gravação assíncrona no IndexedDB terminar. A série não chegava a ser gravada e, depois do reload, aparecia sem marca (`aria-pressed="false"`). É a mesma classe de falha do tema escuro (`qa-ci-tema-escuro.md`).

Evidência no `trace.zip` da 1ª tentativa (artefato `playwright-evidencia`, tratado como dado não confiável):
- o `click` em "Série 1 concluída" termina em t = 215004,0 ms; o `reload` começa em t = 215007,4 ms, **3,4 ms depois**;
- o snapshot logo depois do clique mostra o botão com a classe `ex-check on`, ou seja, a interface marcou a série;
- o snapshot depois do reload e o `error-context.md` mostram `aria-pressed="false"` em 24 leituras durante 10 s.

Suspeitas descartadas: fuso UTC, dia da semana e base `/fitnez/` (a data gravada é `2026-11-11` e a URL `/fitnez/#treino/livre/executar?ex=supino` está correta nos snapshots); ordem de testes e estado compartilhado (cada teste usa um contexto novo, e a falha ocorre com o teste rodando sozinho).

Reprodução local com a simulação do runner (PowerShell: `CI=true`, `TZ=UTC`, `VITE_BASE_PATH=/fitnez/`, relógio fixado pelo teste):
- teste original, `--repeat-each=10`: 1 falha em 10, com o mesmo erro do CI;
- com a gravação atrasada em 800 ms e sem esperar por ela: falha sempre (Expected "true", Received "false").

## Correção (sem afrouxar)
- Antes do reload, o teste confirma a série marcada na interface e usa `expect.poll` para esperar a série gravada no IndexedDB (`history.days['2026-11-11'].log.supino[0].done === true`). Não há sleep.
- Teste novo de regressão: "Treino livre: série concluída sobrevive ao reload quando a gravação é lenta, desde que concluída". Ele atrasa a gravação em 800 ms de forma determinística, com o mesmo método do teste do tema.
- O app não mudou. A gravação é atômica, e só perde a série quem recarrega a página poucos milissegundos depois de tocar (mesma decisão registrada em `qa-ci-tema-escuro.md`, ADR 002 preservado).
- Revisei os outros `reload()` dos testes e2e: todos já esperam a gravação, seja com `expect.poll`, com leitura do banco ou com um `commit` aguardado antes do aviso.

## Resultados (simulação do runner)
- spec afetado `--repeat-each=10`: 80/80 verdes.
- `npm run check` (test:config 9/9, typecheck, vitest 536/536 em 36 arquivos, build com o artefato verificado para a base `/fitnez/`): verde.
- e2e completo, sem repetições automáticas: 178/178 verdes.

## Risco que sobrou
- Quem fecha ou recarrega a aba poucos milissegundos depois de marcar uma série perde só essa série, sem corromper os dados. Isso é aceito.
