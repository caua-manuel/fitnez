# Dados: apagar todos os dados do usuário

## Operação
Arquivo novo: `src/application/eraseAll.ts` (nenhum arquivo existente foi alterado; `src/data/` fica fora do escopo e não foi tocado, por isso a operação é uma função ao lado do repositório, não um método dele).

```ts
eraseAllData(options: {
  expectedRevision: number;           // revisão que a interface está vendo (state.revision)
  basePath?: string; now?: () => number;
  indexedDB?: IDBFactory | null; storage?: KeyedStorage | null; session?: KeyedStorage | null; // só para testes
}): Promise<{ state: StateV3; storageWarnings: string[] }>
```

Comportamento:
1. Uma única transação IndexedDB (`state` e `recovery`): limpa os dois stores e grava o estado de fábrica. Ou tudo ou nada. A revisão sobe (`revisão atual + 1`), então abas antigas recebem `conflict` ao tentar salvar.
2. Só depois do commit, remove do `localStorage` as chaves `treino12-v1`, `treino12-v2`, `treino-theme` e `treino12:*`, e do `sessionStorage` as `treino12:*`. Chaves de outros apps ficam. Falha aqui vira texto em `storageWarnings` (o banco já foi apagado).
3. Não mexe no Cache Storage (o cache do service worker só guarda o app, então o app continua abrindo offline).
4. Avisa pelo `BroadcastChannel` do repositório: toda instância aberta (esta aba e outras) emite `external-change`.
Erros: `conflict` (revisão desatualizada, nada apagado), `quota`/`transaction`/`blocked`/`unavailable` (nada apagado, storage intocado). Idempotente (rodar de novo dá estado de fábrica, revisão +1).

## Como a interface chama
```ts
const { run, state } = useData();
await run(() => eraseAllData({ expectedRevision: state!.revision }), 'Todos os dados foram apagados.');
```
`run` já chama `refresh()` depois (re-lê o estado e entrega ao `committer`), e o `external-change` também dispara refresh. Os dados em memória passam a refletir o vazio sem recarregar.

Recomendação: depois de sucesso, **recarregar a página** (`window.location.hash = ''; window.location.reload()`) é o caminho mais seguro, porque estado só de React (cronômetro de descanso em andamento, rascunhos de formulário, tela atual) não passa pelo repositório. Tecnicamente não é obrigatório para os dados. Exibir `storageWarnings` se não vier vazio. Pedir confirmação forte na UI e oferecer exportar backup antes (a operação não gera backup e não é reversível; apaga também `recovery`, as cópias do protótipo e os snapshots).

## Inventário de persistência
| Local | Conteúdo | Tratamento |
|---|---|---|
| IndexedDB `treino12:<base>` store `state`, chave `active` | catálogo (plano, dieta, receitas), configurações (perfil, tema, notificações, início), histórico (dias, medidas, notas), snapshots, meta (datas de backup) | limpo e regravado com estado de fábrica |
| IndexedDB, store `recovery` | cópias brutas do protótipo, `before-import`, imports | limpo |
| localStorage `treino12-v1`, `treino12-v2`, `treino-theme` | dados legados do protótipo (somente leitura pelo app) | removidas |
| localStorage `treino12:descanso` | cronômetro de descanso (`Executar.tsx`) | removida (prefixo `treino12:`) |
| sessionStorage `treino12:cursor:<dia>:<id>`, `treino12:treino-novo` | cursor do exercício, aviso de treino novo | removidas |
| Cache Storage (service worker, `public/sw.js`) | apenas arquivos do app | preservado de propósito |
| Fotos | não existem; `validation.ts` recusa fotos/anexos | nada a apagar |
| Cookies, analytics | não usados | nada a apagar |

Atenção para o futuro: qualquer chave nova de armazenamento do app deve usar o prefixo `treino12:` para ser coberta.

## Testes
`tests/unit/eraseAll.test.ts` (7 testes, fake-indexeddb): apaga tudo e volta ao padrão (perfil, tema, plano editado, medidas, dias, recovery, datas de backup), sem resíduo (reinicializar não ressuscita o protótipo e o estado equivale a uma primeira abertura), idempotência, banco ainda não inicializado, conflito de revisão sem apagar nada, falha na transação (quota) sem apagar nada, storage sem `removeItem` vira aviso.

## Resultados
- `npm run typecheck`: sem erros.
- `npm test`: 26 arquivos, 271 testes, todos passando.

Observação de ambiente: quando o comando foi executado com o diretório escrito como `/c/Projeto-Treino` no Git Bash, o vitest falhou em todos os arquivos ("Cannot read properties of undefined (reading 'config')", inclusive nos testes antigos), provavelmente por duplicar o módulo por causa da grafia do caminho. Com `cd 'C:\Projeto-Treino'` tudo passa. Não é problema do código.
