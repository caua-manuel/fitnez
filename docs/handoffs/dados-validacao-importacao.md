# Dados: validação de importação e leitura tolerante (B1 e B2)

Data: 2026-11-16. Responde aos achados B1 e B2 de `seguranca-auditoria-completa.md`. Sem dependência nova; sem mudança de formato (continua v3), portanto sem migração nova.

## O que passou a ser validado (`validateState`, `validateLegacy`, `validatePlan`)

- `settings.profile` (B1): objeto; nome e objetivo texto (até 60 e 140); idade, altura e peso números finitos (nunca texto), nas faixas do formulário (idade 10 a 100 inteira, altura 100 a 250 inteira, peso 30 a 300). A regra vive em `checkStoredProfile` (`src/domain/profile.ts`), que reaproveita `validateProfile`; as constantes `PROFILE_NAME_MAX` e `PROFILE_GOAL_MAX` agora são exportadas e usadas pelo próprio formulário. Mensagem: `Perfil do backup inválido. Nome: esperado texto.` e semelhantes. `NaN` e `Infinity` já eram barrados antes por `safeJson` ("Valor: esperado número finito.").
- Outros campos de `settings` lidos pela interface: `notifications` (objeto com `enabled` e `restEnd` booleanos), `sleepOk` (mapa de booleanos), `dietReviewDismissed` (texto). `theme`, `start`, `startConfirmed`, `sched` e `dietTargets` já eram validados.
- Dia: `workout`, `workouts` (sessionId texto, situação `partial`/`done`, números finitos), `acts` (booleanos). Antes não eram checados.
- Catálogo: grupo muscular `g` (texto), `sub` e `min` do treino (só texto se presentes), `t`, `uso` e `dica` das receitas (texto se presentes). O resto já era checado.
- `snapshots` e `recovery`: cada entrada precisa ser objeto (mensagem nomeia o campo).
- Nota: o campo `custom` citado no pedido não existe no código nem no modelo atual; a lista de itens do condomínio é `plan.cond` (por dia, `day.cond`) e foi coberta.

Backups legítimos: v1, v2 e v3 sem os campos novos continuam passando (testes com fixtures sintéticas, incluindo `{"v":1,"start":"..."}` e as sementes do app). Nenhum valor é convertido ou truncado.

## Limites (`src/domain/limits.ts`) e justificativa

Regra: texto livre com folga de pelo menos 2x sobre o `maxLength` da interface, porque o protótipo antigo (v1/v2) não tinha limite e um backup legítimo antigo não pode ser recusado; quantidades em escala de décadas de uso. Maior texto das sementes: 130 caracteres. Excedeu: rejeita com `campo: use no máximo N caracteres (recebido: M).` ou `campo: no máximo N itens (recebido: M).`; nunca trunca.

| Limite | Valor | Justificativa |
| --- | --- | --- |
| Nome do perfil / objetivo | 60 / 140 | Iguais ao formulário |
| Nome de treino, exercício, opção de dieta e receita | 200 | Interface: `NAME_MAX` 120 (opção: 120); folga para legado |
| Descrição do treino | 320 | Interface 160 (2x) |
| Duração do treino | 40 | Interface 20 (2x) |
| Observação do exercício | 600 | Interface 300 (2x) |
| Nota do dia | 2000 | Interface 300 (observação da aula); a nota é de formato livre no legado; é o valor sugerido na auditoria |
| Carga, repetições, tempo, medidas, escolha de opção | 100 | Interface 30 |
| Ids, chaves, `over`, `alt` | 200 | Ids reais têm menos de 20 |
| Item de ingrediente, passo, item do condomínio | 1000 | Maior real: 130 |
| Texto de receita (`t`, `uso`, `dica`) | 2000 | Maior real: 130 |
| Dias e medidas no histórico (e nos campos legados `log`, `notes`, `meas` etc.) | 20.000 cada | Cerca de 55 anos de registros diários |
| Exercícios / treinos no plano | 1000 / 500 | Plano real tem dezenas |
| Exercícios por treino / ordem / itens de condomínio | 200 / 1000 / 200 | Idem |
| Colunas de séries por exercício | 20 | Interface usa 3 (blocos); `MAX_SETS` é 12 |
| Exercícios com registro no dia / séries por exercício | 500 / 200 | `MAX_SETS` 12 |
| Entradas por dia (`notes`, `cond`, `pick`, `eaten`, `skip`) | 500 | Dependem do número de exercícios e refeições |
| Treinos por dia | 100 | O app permite poucos por dia |
| Refeições / opções por refeição / itens por opção | 50 / 1000 / 200 | Sementes: 5 / poucas / menos de 10 |
| Receitas / linhas por receita | 1000 / 200 | Sementes: poucas dezenas |
| `sleepOk` | 520 semanas | 10 anos |
| `snapshots` / `recovery` (entradas) | 200 / 400 | Cada restauração adiciona 2 entradas ao `recovery`; 400 equivale a cerca de 200 restaurações, e o teto de 10 MiB do arquivo chega muito antes. Snapshots reais: 1 (`migration-catalog`) |
| Tamanho de cada snapshot | 1.048.576 caracteres serializados | O snapshot real (catálogo) tem dezenas de KB. Para o `recovery` não há teto por entrada: ele guarda texto bruto de backups e estados anteriores inteiros, e o limite global de 10 MiB (já existente em `parse` e `backupText`) o contém; um teto menor por entrada poderia impedir restaurar. |

Atenção para quem mexe na interface depois: se algum `maxLength` for aumentado acima de metade destes valores, atualizar `LIMITS`, senão o app grava um dado que a validação recusa. Os `maxLength` em `src/features/` são literais (`OBS_MAX` 300, 160, 20, 300, 30, 120); não pude centralizá-los porque `src/features/` está fora do meu escopo.

## Estado já salvo e inválido (leitura tolerante)

Escolha: reparo em memória de cada leitura, com gravação única no `initialize`, em vez de validar tudo e recusar o banco.

- Por que não recusar: recusar o estado salvo inteiro impediria abrir o app e até exportar o backup; ADR 002 manda nunca apagar dados em silêncio.
- `src/data/repair.ts` (`repairStoredState`, função pura) é aplicado em toda leitura do IndexedDB (`readOptional`, usado por `read`, `initialize` e `commit`). Se `settings.profile` é inválido, cada campo inválido volta ao padrão (nome e objetivo vazios; idade, altura e peso removidos); se o perfil nem é objeto, é removido. O restante do estado fica igual.
- O perfil original completo é guardado em `recovery['invalid-profile:<instante>']` com `kind`, `createdAt`, `fields` e `profile`. Nada é apagado.
- No `initialize`, o reparo é gravado uma vez (revisão +1, transação normal). Se a gravação falhar (conflito, quota), o app abre com a versão reparada só em memória e tenta de novo na próxima abertura. Reabrir não duplica a entrada de recuperação (teste).
- A ideia de camada extra: a interface (`App.tsx`, `Inicio.tsx`) continua lendo `profile.name` com `trim`; com o reparo, o valor sempre chega como texto. Um `ErrorBoundary` (B1, item 3) é trabalho do frontend e já aparece no repositório (`src/ui/ErrorBoundary.tsx`), não toquei.
- Só o perfil é reparado, porque foi o único caso que a auditoria reproduziu como tela branca (os outros 7 malformados abriram normalmente). Os demais campos novos agora são validados na entrada; um estado salvo que os viole (só possível por importação anterior a esta correção) seria rejeitado em `save`/`commit` com mensagem de validação, sem perder dados. Se isso aparecer em uso real, ampliar `repairStoredState`.
- Observação sobre `save`: ele valida de forma síncrona e lança antes de devolver a Promise (comportamento anterior, mantido). Quem chama dentro de `await` com try/catch já recebe o erro.

## Testes novos

- `tests/unit/validation-limits.test.ts` (49): payload exato do B1 e variações (nome objeto ou nulo, objetivo array, idade e altura texto, peso `NaN`, `Infinity`, `null`, faixas e limites exatos), demais campos de `settings`, dia e catálogo, cada limite do B2 no limite e um acima, mensagens, legados v1/v2/v3 sem campos novos, sementes dentro dos limites, `repairStoredState`.
- `tests/integration/validation-import.test.ts` (14): prévia recusa perfil malicioso sem alterar o estado, `save` recusa, nota no limite e acima, v1/v2 importam sem conversão de valores, v3 sem campos novos importa, ida e volta exportar e importar (perfil, notificações, treinos do dia), estado salvo inválido abre, é reparado e preservado em `recovery`, reabrir não duplica, salvar depois funciona, perfil válido não gera reparo.
- Dados todos sintéticos; sem nome, e-mail, caminho ou IP.

## Resultados reais

- `npm run typecheck`: sem erros.
- `npm test`: 32 arquivos, 388 testes, todos passaram (antes: 30 arquivos, 325 testes).
- Não rodei e2e (outros agentes estão usando).

## Arquivos

- Novos: `src/domain/limits.ts`, `src/data/repair.ts`, `tests/unit/validation-limits.test.ts`, `tests/integration/validation-import.test.ts`.
- Alterados: `src/data/validation.ts`, `src/data/index.ts`, `src/domain/profile.ts`.
