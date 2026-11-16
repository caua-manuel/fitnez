# Dados: exportação CSV

Exportação de cargas, medidas e dieta em CSV, como funções puras em `src/domain/csv.ts` (sem relógio, sem DOM, sem acesso ao repositório, sem dependência nova). Contrato: `tests/unit/csv.test.ts` (17 testes, expectativas não alteradas). Nenhuma mudança no formato dos dados gravados.

## Assinaturas

```ts
export type CsvCell = string | number | boolean | null | undefined;
export interface CsvOptions { separator?: string; bom?: boolean }
export type CsvKind = 'cargas' | 'medidas' | 'dieta';

export function toCsv(rows: ReadonlyArray<ReadonlyArray<CsvCell>>, options?: CsvOptions): string;
export function csvFilename(kind: CsvKind, date: string): string; // fitnez-<tipo>-<AAAA-MM-DD>.csv
export function exportLoadsCsv(days: Record<string, DayRecord> | null | undefined, plan: Plan | null | undefined): string;
export function exportMeasuresCsv(measures: Record<string, Payload> | null | undefined): string;
export function exportDietCsv(days: Record<string, DayRecord> | null | undefined, catalog: Record<MealKey, DietOption[]> | null | undefined): string;
```

## Formato
- Separador `;`, linhas com CRLF, sem quebra final, vírgula decimal, datas `AAAA-MM-DD` em ordem crescente. Sem dados, sai só o cabeçalho.
- Campos com aspas, separador ou quebra de linha vão entre aspas (aspas dobradas).
- Texto que começa com `=`, `+`, `-`, `@`, TAB ou CR recebe apóstrofo na frente (proteção contra fórmula). Valores do tipo número não recebem, inclusive negativos.
- `null`, `undefined`, `NaN` e infinito viram célula vazia. Booleano vira `sim` ou `não`.
- Valor digitado que é número simples (`22,5` ou `22.5`) sai como número com vírgula; qualquer outro texto (`meio`, `8-10`) é mantido.
- Os três `export*Csv` devolvem o texto **sem BOM**; o BOM é responsabilidade de quem monta o arquivo (ver abaixo).

### Cargas
`data;treino;exercício;grupo muscular;série;carga (kg);repetições;concluída`
- Uma linha por série; dentro do dia, na ordem em que os exercícios estão em `log`.
- Treino: nome dos treinos do dia (`listWorkouts`) que contêm o exercício, unidos por ` + ` quando há mais de um. Sem registro de treino no dia, usa o treino do plano só quando ele é o único que contém o exercício; caso contrário fica vazio.
- Exercício que não existe mais no plano: `Exercício removido`, sem treino nem grupo.
- Séries sem carga, sem repetições e não concluídas são omitidas; a numeração das demais é a posição original.

### Medidas
`data;peso (kg);cintura (cm);quadril (cm);coxa (cm);braço (cm)` (chaves `p`, `c`, `q`, `t`, `b`).

### Dieta
`data;refeição;opção;nome;kcal;proteína (g);carboidrato (g);gordura (g);consumida;água (copos de 500 ml);creatina`
- Uma linha por refeição com opção escolhida ou marcada, depois uma linha `Total do dia`.
- Refeição consumida usa a cópia gravada em `consumed`, que prevalece sobre o cardápio atual; refeição não consumida mostra os valores do cardápio.
- `consumida` é `sim` só quando marcada e não pulada, igual a `dayTotals`. O total usa `dayTotals` (soma só do consumido), arredondado a 2 casas.
- Água e creatina aparecem só na linha de total. Dia sem refeição, sem água e sem creatina não gera linha.

## Como a interface monta o download

```ts
import { csvFilename, exportLoadsCsv, exportMeasuresCsv, exportDietCsv } from '../../domain/csv';

const text = exportLoadsCsv(state.history.days, state.catalog.plan);
// ou exportMeasuresCsv(state.history.measurements)
// ou exportDietCsv(state.history.days, catalog)  -> o mesmo catálogo Record<MealKey, DietOption[]> que a tela Dieta já usa
const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }); // BOM para o Excel abrir os acentos
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = csvFilename('cargas', hojeIso); a.click();
URL.revokeObjectURL(url);
```

- `hojeIso` é a data local `AAAA-MM-DD` que a tela já calcula; o domínio não lê o relógio.
- Para um CSV avulso, `toCsv(linhas, { bom: true })` já devolve com BOM.
- O arquivo sai do aparelho só por ação do usuário; nada é enviado a terceiros. O CSV é para leitura em planilha e **não substitui o backup JSON** (não há importação de CSV).

## Verificação
- `tests/unit/csv.test.ts`: 17 de 17 passam.
- Typecheck e suíte completa: falhas apenas em arquivos de interface em edição por outro agente (`tests/unit/motion.test.ts` no typecheck, `tests/unit/thumb.test.ts` na suíte). Nenhuma em `csv`.
