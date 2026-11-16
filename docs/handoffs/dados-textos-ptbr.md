# Dados: correções de texto pt-BR (domain e data)

Só redação, sem mudar números nem regras. Itens ERRO e PADRÃO de `revisao-textos-ptbr.md` em `src/domain/` e `src/data/`.

| Arquivo | Antes | Depois |
| --- | --- | --- |
| `src/domain/jiujitsu.ts` | `Ainda não: falta aulas, sono (sem dados).` | `falta` com um item, `faltam` com dois ou mais |
| `src/domain/exerciseDraft.ts` | `O descanso vai até 1800 segundos (30 min).` | `O descanso máximo é 30 min (1.800 s).` |
| `src/data/idb.ts` | `Exporte um backup; os dados anteriores foram mantidos.` | `Baixe um backup; ...` |
| `src/data/idb.ts` | `IndexedDB não está disponível. Não é possível salvar neste navegador.` | `O armazenamento do navegador não está disponível. Não é possível salvar seus dados aqui.` |
| `src/data/index.ts` | `A revisão da prévia não corresponde aos dados atuais.` | `Os dados mudaram depois da prévia. Selecione o arquivo novamente.` |

Não alterados: `label` da fonte de migração (a interface resolve o rótulo), `dietTargets.ts`, regra da 3ª aula, escala "como terminou" e os itens OPCIONAIS (mensagens "legado", `capacity.ts`, `planEdit.ts`).

Testes ajustados: `tests/unit/planEdit.test.ts` (regex do descanso máximo) e `tests/unit/jiujitsu.test.ts` (concordância). Nenhum e2e depende das strings alteradas (`Ainda não: falta sono (sem dados).` é o caso de um item).
