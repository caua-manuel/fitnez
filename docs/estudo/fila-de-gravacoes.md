# Estudo: fila de gravações (commit otimista)

Arquivos: `src/app/commitQueue.ts` (a fila) e `src/app/DataProvider.tsx` (quem a cria e a expõe para as telas).
O repositório que ela chama está em `src/data/index.ts`; a regra de revisão vem do ADR 002.

## 1. O problema que a parte resolve

Toda alteração do usuário (marcar série, trocar tema, anotar peso) vira um `StateV3` novo gravado no IndexedDB. Gravar leva
alguns milissegundos a centenas deles, e o repositório recusa gravar sobre uma revisão que não é a esperada. Sem esta fila:

- a tela esperaria o disco a cada toque (o ✓ da série "demoraria");
- dois toques rápidos gerariam duas gravações sobre a mesma revisão, e a segunda daria `conflict` e se perderia;
- se outra aba (ou um `refresh` disparado pelo foco da janela) relesse o banco no meio da gravação, a tela voltaria ao valor
  antigo, o defeito do tema Escuro que derrubava o CI (`docs/handoffs/qa-ci-tema-escuro.md`);
- uma falha de gravação apagaria da tela o que a pessoa acabou de digitar.

A ideia: **aplicar na tela na hora (otimista), gravar em fila única e guardar as mutações ainda não gravadas para
reaplicá-las** sobre qualquer estado mais novo que chegar.

## 2. Fluxo passo a passo

### 2.1 Montagem em `DataProvider` (`src/app/DataProvider.tsx`)

1. Uma única instância por provedor: `createCommitter` é criado dentro de um `useRef` (`src/app/DataProvider.tsx:26-27`),
   com `onState` ligado a `setState` e `onError` ligado a `setError`.
2. `refresh` (`:29-38`) chama `repository.initialize()` e entrega o estado lido ao `committer.adopt(...)` (`:31`).
3. `refresh` roda na montagem e em todo evento `external-change` (`:47`), que o repositório emite quando outra aba grava
   (BroadcastChannel) ou quando a janela recebe foco (`src/data/index.ts:24-26`).
4. As telas chamam `commit(mutate)` de `useData()`; o provedor limpa o erro e repassa à fila (`:58`).
5. `run` (`:51-57`) é outro caminho, para ações longas (exportar, importar, pedir persistência): chama o repositório direto
   e depois `refresh`. Não passa pela fila.

### 2.2 Estado interno da fila (`src/app/commitQueue.ts:9-17`)

- `local`: o estado que a tela mostra (já com as mutações otimistas).
- `revision`: a última revisão confirmada pelo banco.
- `seq`: contador de mutações aceitas; `savedSeq`: até qual `seq` já está gravado.
- `pending`: lista `{ seq, mutate }` das mutações ainda não gravadas.
- `queue`: a corrente de Promises que garante uma gravação por vez.
- `reapply(base)` (`:17`): aplica todas as `pending`, em ordem, sobre uma cópia de `base`.

### 2.3 `commit(mutate)` (`src/app/commitQueue.ts:48-58`)

1. Sem `local` (dados ainda não abertos): erro e `false` (`:49`).
2. Roda `mutate` sobre uma cópia de `local` (`:51`). Se lançar erro: `onError`, `false`, e nada muda.
3. Recebe um `seq`, entra em `pending`, vira o novo `local` e vai para a tela **antes** de gravar (`:52-54`).
4. Encadeia `flush(mySeq)` na `queue` (`:55`). `queue = task.catch(...)` (`:56`) impede que uma falha trave as próximas.
5. Devolve a Promise: `true` se gravou, `false` se não.

### 2.4 `flush(mySeq)` (`src/app/commitQueue.ts:24-47`)

1. Se outra gravação já cobriu esta mutação (`savedSeq >= mySeq`), devolve `true` sem gravar (`:25`). Isso acontece quando
   vários toques rápidos entram antes da primeira gravação começar: a primeira leva todos de uma vez.
2. `covered = seq` (`:26`): esta gravação vai levar tudo que existe até agora.
3. `attempt` (`:27-31`): `repository.save({ state, expectedRevision })`. Ao gravar, atualiza `revision` e `savedSeq`, tira
   de `pending` o que foi coberto e, **só se não chegou mutação nova durante a gravação** (`seq === covered`), troca `local`
   pela versão gravada (`:30`).
4. Conflito (`:36-43`): outra aba gravou antes. Lê o banco (`repository.read()`), reaplica as `pending` sobre o estado novo,
   mostra e tenta **uma** vez mais com a revisão nova. Se falhar de novo: `onError` e `false`.
5. Outro erro (`:44-45`): `onError` e `false`. As `pending` **continuam** guardadas e `local` continua com o valor digitado;
   a próxima gravação leva tudo junto.

### 2.5 `adopt(state)` (`src/app/commitQueue.ts:19-23`)

Chamado por `refresh`. Atualiza `revision` e, se há `pending`, mostra `reapply(state)` em vez do estado lido. É isso que
impede um `refresh` no meio de uma gravação de desfazer a troca de tema na tela.

### 2.6 Contrato que as mutações precisam respeitar

Uma mutação pode rodar **mais de uma vez**: no `commit`, em cada `adopt` enquanto estiver pendente e no conflito. Ela precisa
ser função do rascunho recebido: sem efeitos colaterais, sem ler variável externa que mude entre as execuções e devolvendo o
rascunho. Exemplo: `s => { s.settings.theme = 'dark'; return s; }` é seguro; uma mutação que gera `Date.now()` lá dentro
gravaria um valor diferente a cada reaplicação.

### 2.7 Desenho em texto

```
tela -> commit(m) -> local = m(local) -> onState (tela já mudou)
                  -> pending += m
                  -> queue: flush -> repository.save(local, revision)
                                       ok        -> revision++, pending -= cobertas
                                       conflict  -> read() -> reapply(pending) -> save de novo (1 vez)
                                       erro      -> onError, pending ficam
outra aba / foco -> refresh -> initialize() -> adopt(lido) -> tela = reapply(pending sobre lido)
```

## 3. Casos de borda

1. Dois commits seguidos: os dois gravam, em ordem, e a tela muda antes do disco.
2. Vários commits antes da primeira gravação: uma gravação só cobre todos; as outras devolvem `true` sem gravar.
3. Conflito de revisão (outra aba gravou): a mutação é reaplicada sobre o estado novo e as duas alterações sobrevivem.
4. Conflito duas vezes seguidas: desiste, `onError`, `false`.
5. Falha comum de gravação: `false`, o valor fica na tela, a próxima gravação leva o pendente junto.
6. Mutação que lança erro: `false`, estado intacto, nada vai para a fila.
7. Commit antes de os dados abrirem (`local` nulo): erro "Seus dados ainda não foram abertos." e `false`.
8. `refresh` (foco, outra aba) antes, durante ou depois da gravação: não desfaz a alteração na tela nem no banco.
9. Mutação nova chega durante uma gravação: a resposta da gravação não substitui `local`, para não apagar a mais nova.
10. Mutação que produz estado **inválido** (ex.: tema `'roxo'`): `repository.save` recusa com `validation`, mas a mutação
    continua em `pending`. Todo commit seguinte, mesmo válido, falha com a mesma mensagem, e `adopt` reaplica o valor inválido
    na tela, até recarregar a página.
11. Mutação reaplicada várias vezes: precisa ser repetível (seção 2.6).
12. Série concluída com gravação lenta e recarga da página logo depois de gravar: a série continua concluída.

## 4. Testes que provam cada caso

Arquivo `C` = `tests/integration/commit.test.ts`, dentro de `describe('commit com atualização otimista')`.

| Caso | Arquivo | Teste |
| --- | --- | --- |
| 1 | C | `it('dois commits seguidos gravam ambos, em ordem, e a tela muda na hora')` |
| 2 | C | coberto **indiretamente** pelo mesmo teste (o segundo commit entra antes do primeiro `flush`); nenhuma asserção conta gravações |
| 3 | C | `it('conflito de revisão reaplica a mutação sobre o estado novo e preserva as duas alterações')` |
| 4 | — | **sem teste** |
| 5 | C | `it('falha de gravação devolve false e mantém o valor local; a próxima tentativa grava tudo')` |
| 6 | C | `it('mutação que lança erro devolve false sem alterar o estado')` |
| 7 | — | **sem teste** |
| 8 | C | `it('releituras concorrentes (foco, outra aba) em qualquer instante nunca desfazem a troca de tema')` (60 rodadas com atrasos pseudoaleatórios) |
| 9 | — | **sem teste dedicado**; o teste do caso 8 passa por esse caminho só por acaso |
| 10 | — | **sem teste** (vira o exercício da seção 6) |
| 11 | — | **sem teste** (é contrato, não verificado) |
| 12 | `tests/e2e/hoje-livre-atalhos.spec.ts` | `test('Treino livre: série concluída sobrevive ao reload quando a gravação é lenta, desde que concluída')` |

O caso 10 foi conferido em execução avulsa (fora de `tests/`): depois de um commit com tema `'roxo'`, um commit seguinte que só
grava uma nota também devolveu `false`, as duas mensagens foram "Tema inválido." e a nota não chegou ao banco.

O tema em ponta a ponta tem ainda `tests/e2e/fase1.spec.ts`, ``test(`rotas, layout ${width}px e tema ${theme}`)``, que
anexa um diagnóstico quando falha.

## 5. Glossário

- **Commit otimista:** mostrar o resultado antes de o disco confirmar, desfazendo ou reaplicando se der errado.
- **Mutação (`Mutate`):** função `(rascunho) => rascunho` que descreve uma alteração do usuário.
- **Pendente (`pending`):** mutação aceita na tela e ainda não confirmada no banco.
- **`seq` / `savedSeq`:** numeração das mutações e até onde já foi gravado.
- **Revisão (`revision`):** contador do banco; gravar exige dizer qual revisão se esperava. Diferente: `conflict`.
- **Conflito (`conflict`):** outra aba ou outra gravação mudou o banco desde a última leitura.
- **`adopt`:** aceitar um estado lido do banco, preservando por cima as mutações pendentes.
- **`refresh`:** reler o banco (`initialize`) e entregar à fila; disparado na abertura, no foco e por outra aba.
- **`external-change`:** evento do repositório que significa "o banco pode ter mudado fora daqui".

## 6. Exercício: mutação inválida não pode travar a fila

**Enunciado.** Hoje (caso 10) uma única mutação que gera estado inválido fica para sempre em `pending` e faz falhar todas as
gravações seguintes. Mude `flush` para que, quando o erro tiver `code === 'validation'`, as mutações cobertas por aquela
tentativa sejam descartadas e a tela volte ao último estado confirmado com as pendentes restantes reaplicadas. A mensagem de
erro continua aparecendo. Falhas que não são de validação (quota, transação) continuam como hoje: pendentes guardadas.

**Onde mexer.** Só `src/app/commitQueue.ts`, dentro de `flush`. Você vai precisar guardar o último estado confirmado (hoje
a fila guarda só a `revision`). Não mexa em `src/data/` nem em `DataProvider.tsx`.

**Teste a escrever primeiro** (novo `it` em `tests/integration/commit.test.ts`, reaproveitando `setup`, `committerFor` e
`note`):

- `c.commit(s => { (s.settings as any).theme = 'roxo'; return s; })` devolve `false` e `errors` tem uma mensagem;
- `seen.at(-1)!.settings.theme` volta ao tema anterior (não fica `'roxo'`);
- `c.commit(note('2026-11-17', 'depois'))` devolve `true`;
- `(await r.read()).history.days['2026-11-17'].notes?.x` é `'depois'` e o tema gravado não é `'roxo'`.

Veja o teste falhar no terceiro item antes de mudar o código.

**Critério de pronto.**

- O teste novo passa e os cinco testes atuais de `tests/integration/commit.test.ts` continuam passando, em especial
  `it('falha de gravação devolve false e mantém o valor local; a próxima tentativa grava tudo')` (falha genérica continua
  guardando o pendente).
- `npm test` e `npm run typecheck` sem erros.
- Só `src/app/commitQueue.ts` e `tests/integration/commit.test.ts` foram alterados.
