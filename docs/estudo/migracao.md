# Estudo: migração do protótipo e leitura de backups

Arquivos: `src/data/migration.ts` (conversão), `src/data/validation.ts` (o que é aceito), `src/data/repair.ts` (conserto de
estado já salvo), `src/data/idb.ts` (IndexedDB com Promises) e `src/data/index.ts` (o repositório que orquestra tudo).
Decisão de origem: `docs/decisoes/002-armazenamento-local-migracao-backup.md`, seção "Migração de `treino12-v1` e `treino12-v2`".

## 1. O problema que a parte resolve

O protótipo em `legacy/` guardava tudo no `localStorage`, em duas chaves (`treino12-v1` e `treino12-v2`) mais o tema
(`treino-theme`). O app novo guarda um único objeto `StateV3` no IndexedDB. Esta parte faz a ponte, e também lê arquivos de
backup (v1, v2 ou v3). Sem ela:

- quem usava o protótipo abriria o app novo "zerado" e acharia que perdeu o histórico;
- um backup antigo não poderia ser restaurado;
- um arquivo malformado ou malicioso poderia gravar lixo que derruba a interface;
- com duas chaves legadas diferentes, o app escolheria uma "pelo timestamp" e descartaria a outra em silêncio (o ADR 002
  proíbe isso).

Princípio do ADR 002: **nunca perder dado em silêncio**. O texto bruto de cada fonte vai para `recovery`, e as chaves legadas
nunca são apagadas nem alteradas.

## 2. Fluxo passo a passo

### 2.1 Primeira abertura: `initialize` (`src/data/index.ts:53-80`)

1. Tudo passa por `enqueue` (`src/data/index.ts:32`), uma fila interna que impede duas operações do repositório ao mesmo tempo.
2. `readOptional` (`src/data/index.ts:29`) lê o estado ativo. Se já existe, aplica `repairStoredState` (ver 2.4) e devolve
   `migrationResult` (`src/data/index.ts:52`). **Migração só roda com o banco vazio.**
3. Banco vazio: começa de `foundation(now)` (`src/data/migration.ts:8`), o estado-semente (plano, dieta e receitas de `data/`,
   `revision: 0`, início padrão com `startConfirmed: false`).
4. Para cada chave legada (`src/data/index.ts:62-68`): lê com `getItem` (falha de leitura vira aviso); guarda o bruto em
   `recovery['legacy:<chave>']`; o tema é só copiado se for `auto`, `light` ou `dark`; as outras passam por `parse` e `migrate`.
   Se o JSON não tiver `v`, a versão é deduzida pelo nome da chave (v1 ou v2). Erro de uma fonte vira aviso, não derruba as outras.
5. Candidatos (`src/data/index.ts:69-73`): um só, ou dois equivalentes (comparando catálogo, configurações sem tema e
   histórico), adota o último da lista. Dois diferentes: `migrationCompleted: false` e `migrationSources` com o resumo de
   cada um, sem fundir nem escolher.
6. `migrationStatus` (`src/data/index.ts:74-76`): `completed`, `pending`, `invalid` (havia legado, nenhum aproveitável) ou `none`.
7. Grava com `commit(undefined, ...)` (`src/data/index.ts:78`). `expected === undefined` significa "só grave se o banco ainda
   estiver vazio" (`src/data/index.ts:37` e `:43`). Se outra aba migrou antes, o conflito é tratado relendo o que ela gravou.

### 2.2 A conversão: `migrate` (`src/data/migration.ts:9-15`)

1. `validateLegacy(v)` (`src/data/validation.ts:69`) recusa fotos, versão desconhecida ou futura, objeto sem nenhum campo
   conhecido, datas impossíveis (`civil`, `src/data/validation.ts:18`), plano e rotina inválidos e limites estourados.
2. `plan`, `sched` e `start` substituem os da semente se existirem. `start` presente marca `startConfirmed: true`.
3. Os mapas por data (`log`, `done`, `feel`, `over`, `cond`, `notes`, `diet`) são reagrupados por dia em `history.days[data]`.
4. `opt[data]` verdadeiro vira `over = plan.alt ?? 'LB'`, **só** se o dia não tiver `over` explícito (`:12`).
5. `meas` vira `history.measurements`. Um snapshot `migration-catalog` guarda o catálogo recebido, com o aviso de que ele não
   comprova o plano de cada dia passado (`:13`).
6. Campos desconhecidos (ex.: `custom`, `ts`) **não** entram no estado; sobrevivem apenas no bruto em `recovery`.

### 2.3 Arquivo de backup: `decode` (`src/data/migration.ts:16-21`)

1. `parse` (`src/data/validation.ts:31`): até 10 MiB, JSON válido, `safeJson` (`:19`) limita 200 000 nós e profundidade 64,
   recusa `__proto__`, `prototype`, `constructor` e objetos que não sejam JSON puro.
2. `v > 3`: erro `future-version`. `v === 3`: exige `app: 'treino12'`, `exportedAt` numérico finito e `validateState` (`:80`).
3. Qualquer outro: `migrate` (caminho legado).
4. Quem chama é `prepareImport` (`src/data/index.ts:82`), que **só monta a prévia** e guarda um token. Nada é gravado até
   `confirmImport` (`src/data/index.ts:83`), que confere a revisão de novo.

### 2.4 Estado já salvo e inválido: `repairStoredState` (`src/data/repair.ts:10`)

Antes de a validação cobrir `settings.profile`, um backup podia gravar um perfil malformado. Na leitura, cada campo inválido do
perfil volta ao padrão (nome e objetivo vazios, número removido); se o perfil nem for objeto, é removido. O original vai para
`recovery['invalid-profile:<instante>']`. `initialize` grava o reparo uma única vez (`src/data/index.ts:57`).

### 2.5 Escolha entre fontes: `selectMigration` (`src/data/index.ts:84`)

Lê o bruto **de `recovery`** (não do `localStorage`, que pode ter mudado), roda `migrate` de novo, mantém tema e recuperação
atuais e marca `completed`. Enquanto a escolha não acontece, `ensureSelected` (`src/data/index.ts:50`) bloqueia `save`,
importação e confirmação de backup.

### 2.6 Infraestrutura em `src/data/idb.ts`

`open` (`:4`) cria as stores `state` e `recovery` e trata aba bloqueando; `completed` (`:6`) só resolve no `oncomplete` da
transação (sucesso real, não só "pedido aceito"); `asError` (`:3`) traduz `QuotaExceededError`, `VersionError` e
`SecurityError` em mensagens em português.

## 3. Casos de borda

1. Primeira abertura sem protótipo: estado-semente, status `none`.
2. v1 com `opt`, vírgulas decimais, exercícios órfãos, dieta e campos desconhecidos: nada se perde.
3. Reabrir depois de migrar não migra de novo (idempotência).
4. `over` explícito vence `opt`; plano personalizado não é trocado pela semente.
5. Duas fontes diferentes: pede escolha, não favorece o maior `ts`, bloqueia gravações até escolher.
6. Duas fontes equivalentes: adota uma sem pedir escolha.
7. Conflito pendente e `localStorage` alterado depois: a escolha usa o bruto preservado.
8. Uma fonte quebrada e outra válida: usa a válida, guarda a quebrada, avisa.
9. Todas as fontes inválidas: status `invalid`, restauração por arquivo continua possível.
10. Falha de quota durante a migração: nada é marcado, a origem fica intacta, a próxima abertura tenta de novo.
11. `start` legado preservado e confirmado; sem `start`, início padrão não confirmado.
12. Tema legado inválido: vira aviso e fica na recuperação.
13. `localStorage` inacessível (navegador bloqueia): vira aviso.
14. Versão futura: recusada com `future-version`.
15. Datas impossíveis (`2026-02-30`, `9999-99-99`): recusadas.
16. JSON quebrado, lista no lugar de objeto, chave `__proto__`, profundidade e tamanho excessivos: recusados sem gravar.
17. Fotos ou anexos no arquivo: recusados.
18. Backup v3 com `app` diferente de `treino12` ou `exportedAt` inválido: recusado.
19. Duas abas abrindo o app vazio ao mesmo tempo: a segunda adota o que a primeira gravou.
20. Perfil inválido já gravado: reparado, original preservado, reparo gravado uma vez.
21. `opt` aponta para uma sessão que não existe no plano migrado (sem `alt` e sem `LB`).

## 4. Testes que provam cada caso

Arquivo `R` = `tests/integration/repository.test.ts`; `P` = `tests/integration/plan-start.test.ts`;
`V` = `tests/integration/validation-import.test.ts`; `L` = `tests/unit/validation-limits.test.ts`.

| Caso | Arquivo | Teste |
| --- | --- | --- |
| 1 | R | `it('inicializa sementes sem modificar catálogo e retorna cópias')` |
| 2 | R | `it('migra v1 sem perder vírgulas, órfãos, opt, dieta e campos desconhecidos')` |
| 3 | R | o mesmo teste do caso 2 (última asserção: segundo `initialize` igual ao primeiro) |
| 4 | R | `it('mantém catálogo personalizado, séries extras e over explícito sobre opt')` (via importação, não via `localStorage`) |
| 5 | R | `it('conflito de origens exige escolha sem favorecer timestamp')` |
| 6 | — | **sem teste** |
| 7 | R | `it('preserva conflito e originais ao reabrir mesmo com localStorage alterado')` |
| 8 | R | `it('guarda fontes inválidas sem substituir fonte válida')` |
| 9 | R | `it('fontes todas inválidas ficam explícitas e permitem restauração após reabrir')` |
| 10 | R | `it('falha de migração não marca sucesso e permite nova tentativa sem mexer na origem')` |
| 11 | P | `it('migração legada com start preserva a data e marca confirmada')`, `it('migração legada sem start usa o padrão e deixa a escolha para o usuário')`, `it('protótipo salvo em treino12-v2 via initialize mantém a data e fica confirmado')` |
| 12 | — | **sem teste** (o caso 2 cobre só o tema válido `dark`) |
| 13 | — | **sem teste** |
| 14 | R | `it.each(...)('recusa importação inválida/futura sem alterar dados: %s')` com `{"v":99}`: **parcial**, confere só que rejeita, não o código `future-version` |
| 15 | R | `it('valida datas impossíveis com erro de validação útil')` e o `it.each` acima com `2026-02-30` |
| 16 | R | o `it.each` acima e `it('recusa profundidade e tamanho excessivo antes de substituir')` |
| 17 | R | `it('recusa fotos e valores de série malformados sem substituição')` |
| 18 | — | **sem teste** |
| 19 | — | **sem teste** (o caminho em `src/data/index.ts:78` nunca é exercitado) |
| 20 | V | `it('perfil com nome objeto: abre, devolve perfil corrigido e preserva o original em recovery')`, `it('perfil que nem é objeto também é tratado sem perder o resto')`, `it('perfil válido não cria recuperação nem altera a revisão')`; L: `it('corrige só os campos inválidos, guarda o original e não altera a entrada')`, `it('perfil que nem é objeto é removido e preservado')` |
| 21 | — | **sem teste** (vira o exercício da seção 6) |

Limites por campo dos legados também têm `it('v1 sem nenhum campo novo e só com start')` e
`it('limites de legado: dias, medidas')` em L.

## 5. Glossário

- **Legado / protótipo:** o app de arquivo único em `legacy/`, com dados no `localStorage`.
- **v1, v2, v3:** formatos. v1 e v2 são do protótipo; v3 é `{ app: 'treino12', v: 3, exportedAt, state }`.
- **StateV3:** o objeto único guardado em `state/active` no IndexedDB (catálogo, configurações, histórico, snapshots,
  recuperação e metadados).
- **Semente / foundation:** o estado inicial montado a partir de `data/plan.json`, `data/diet.json` e `data/recipes.json`.
- **Revisão (`revision`):** contador que sobe a cada gravação. Uma gravação diz qual revisão esperava encontrar; se o banco
  estiver em outra, dá `conflict` (outra aba gravou antes).
- **Recovery:** store separada com originais que não podem se perder: brutos legados, estado anterior a uma restauração,
  perfis reparados.
- **Snapshot `migration-catalog`:** cópia do catálogo recebido na migração, marcada como não comprobatória do passado.
- **`opt` (v1):** marca de "treino alternativo" do protótipo; vira `over` (substituição do treino do dia).
- **`migrationStatus`:** `none`, `completed`, `pending` (aguardando escolha) ou `invalid`.
- **Transação:** no IndexedDB, grava tudo ou nada; o sucesso só vale no `oncomplete`.
- **Idempotente:** rodar de novo não muda o resultado nem duplica dados.

## 6. Exercício: `opt` para uma sessão que não existe

**Enunciado.** Em `src/data/migration.ts:12`, um dia com `opt` verdadeiro vira `over = plan.alt ?? 'LB'`. Se o backup v1
traz um plano personalizado **sem** `alt` e **sem** a sessão `LB`, o dia passa a apontar para um treino inexistente. Mude a
regra: só criar `over` quando o destino existir em `plan.sess`. Nada se perde, porque o bruto continua em `recovery`.

**Onde mexer.** `src/data/migration.ts`, função `migrate`, linha do `opt`. Não altere `validateLegacy` nem `data/plan.json`.
Como isso refina o passo 4 da migração do ADR 002, registre o motivo num handoff seu em `docs/handoffs/` para o arquiteto
atualizar o ADR.

**Teste a escrever primeiro** (arquivo novo `tests/unit/migration.test.ts`, chamando `migrate` direto, como já faz
`it('v1 sem nenhum campo novo e só com start')` em `tests/unit/validation-limits.test.ts`):

- monte um plano a partir de `data/plan.json`, remova `sess.LB`, tire `LB` de `order` e apague `alt`;
- `migrate({ v: 1, plan, opt: { '2026-11-17': true }, notes: { '2026-11-17': { x: 'a' } } }, agora)`: o dia existe (por
  causa da nota) e `over` é `undefined`;
- com o mesmo plano e `alt: 'UA'`, `over` é `'UA'`;
- com o plano-semente sem mudanças, `over` continua `'LB'`.

Veja o teste falhar no primeiro item antes de mudar o código.

**Critério de pronto.**

- O teste novo passa; `npm test` inteiro passa, em especial
  `it('migra v1 sem perder vírgulas, órfãos, opt, dieta e campos desconhecidos')` (que espera `'LB'`) e
  `it('mantém catálogo personalizado, séries extras e over explícito sobre opt')`.
- `npm run typecheck` sem erros.
- Só `src/data/migration.ts`, o teste novo e o seu handoff foram alterados.
