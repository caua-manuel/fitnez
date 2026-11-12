# Contratos concretos — Fase 1

Autor: agente real arquiteto. Status: contrato adotado pelo ADR 003; implementação e tipos ficam a cargo de backend_dados. Este documento contém assinaturas, não implementação de produto. Alterações de nomes precisam ser refletidas aqui e no handoff antes de frontend consumir.

## Composição, módulos e valores

Exportar `createRepository(options)` de `src/data/index.ts`. Exportar tipos de `src/application/repository.ts`; interface não importa arquivos internos de data. App cria uma instância e a passa ao provedor React. `options` admite `basePath`, `now: () => number`, `indexedDB`, `storage` e `storageManager` para testes; defaults usam APIs do aparelho com feature detection. Importar sementes intactas da raiz data via build, nunca buscá-las remotamente.

Identificador de aplicação/exportação: `treino12`. Banco físico versão 1, nome `treino12:<encodeURIComponent(basePath)>`; a mesma base normalizada usada pelo Vite. Não usar hash da aba, versão de build ou host como parte variável do nome. Nunca excluir banco para resolver erro. `localStorage` serve somente como fonte legada de leitura no adaptador.

Valores JSON preserváveis: null, boolean, número finito, string, array e objeto simples. Recusar recursivamente as chaves `__proto__`, `prototype`, `constructor`. Tipos indexados podem admitir campos adicionais JSON, sem apagá-los ao projetar o estado conhecido.

## Estado lógico v3

`StateV3` é um documento JSON com esta forma contratual:

```text
v: 3
revision: inteiro seguro >= 0
catalog: { plan: objeto no formato da semente plan.plan,
           diet: objeto no formato data/diet.json,
           recipes: objeto/array no formato data/recipes.json,
           revision: inteiro seguro >= 0 }
settings: { start: dia civil YYYY-MM-DD, sched: array de 7 entradas legadas,
            theme: 'auto' | 'light' | 'dark' }
history: { days: Record<dia civil, DayRecord>,
           measurements: Record<dia civil, objeto de medida legado> }
snapshots: Record<id, objeto JSON>
recovery: Record<id, objeto JSON>
meta: { initializedAt: instante ms, updatedAt: instante ms,
        migrationCompleted: boolean,
        lastBackupGeneratedAt: instante ms | null,
        lastBackupConfirmedAt: instante ms | null }
```

`DayRecord`: `log` (mapa exercício → array original de séries), `done` (boolean), `feel` (número), `over` (id de sessão), `cond` (mapa), `notes` (mapa) e `diet` (objeto), todos opcionais quando inexistentes na origem. Campos adicionais são preservados. Medidas e séries mantêm strings literais, inclusive vírgulas, vazios, zeros e séries extras. Datas além das 12 semanas são válidas se forem dias civis reais. Não descartar órfãos ou exigir referência existente no catálogo. As chaves legadas log/done/feel/over/cond/notes/diet convergem por união de datas, sem criar valores falsos para campos ausentes.

A semente data/plan.json contém `start`, `sched` e `plan`; somente o campo `plan` vira catalog.plan. Não confundir o invólucro com o plano. Originais legados completos, strings brutas e tema ficam em recovery com identificação da origem; isso preserva campos desconhecidos. Snapshots de migração referenciam o catálogo recebido e identificam proveniência `migration`, sem alegar que descrevem fielmente um treino antigo. Migração v1 `opt[data]` truthy vira `over[data]` para plan.alt ou LB apenas quando não houver over explícito. Não normalizar catálogo personalizado sobre sementes.

Stores físicos mínimos: `state` com chave `active`, `recovery` com chave id. O documento state separa logicamente catálogo/histórico/snapshots; recovery físico permite guardar originais e cópia anterior sem confundir a UI. É permitido optar pelos stores detalhados do ADR 002, desde que a leitura exportada mantenha a forma acima e todas as escritas correlatas usem uma única transação. Não criar store de fotos nesta fase. recovery exportado deve reunir os registros físicos de forma consistente.

## Repositório assíncrono

```text
initialize(): Promise<Initialization>
read(): Promise<StateV3>
save(input: { state: StateV3, expectedRevision: number }): Promise<StateV3>
subscribe(listener: (event: RepositoryEvent) => void): () => void
export(): Promise<{ text: string, filename: string, generatedAt: number,
                   revision: number }>
prepareImport(text: string): Promise<ImportPreview>
confirmImport(input: { token: string, expectedRevision: number }): Promise<StateV3>
protection(input?: { requestPersistence?: boolean }): Promise<Protection>
selectMigration(input: { sourceId: string, expectedRevision: number }): Promise<StateV3>
confirmBackup(input: { expectedRevision: number }): Promise<StateV3>
close(): void
```

`Initialization` é união discriminada:

```text
{ status: 'ready', state: StateV3, warnings: string[] }
{ status: 'migration-conflict', state: StateV3,
  sources: Array<{ id: string, label: string, version: 1|2,
                   days: number, measurements: number, warnings: string[] }> }
```

`state` de conflito é fundação de sementes sem histórico escolhido, migrationCompleted false. Originais de todas as fontes ficam preservados. UI bloqueia operações que substituem estado/confirmam backup enquanto a escolha estiver pendente; exportação de recuperação pode ser oferecida sem marcar backup confirmado. `selectMigration` escolhe apenas fonte conhecida preparada pelo repositório, confere revisão e efetiva seleção+originais+marcador num único commit. `initialize` repetido devolve mesmo conflito ou estado já migrado, sem duplicar recovery. Não escolher maior ts. Fontes semanticamente equivalentes podem deduplicar o estado ativo mantendo ambos originais; fontes diferentes apresentam seleção explícita. Fonte inválida jamais substitui válida; produzir aviso e preservar bruto. Se todas inválidas, oferecer fundação com aviso e recuperação dos brutos, sem alegar migração bem-sucedida.

`save`: clone validado, revisão conferida dentro da transação readwrite, revisão nova = revisão atual + 1; timestamps vêm de now(). Metadata operacional e recovery existentes não podem desaparecer por snapshot obsoleto do cliente. Mudança tema usa cópia de read() e save com expectedRevision. O repositório serializa escritas desta instância; concorrência entre instâncias é resolvida pela revisão na transação. `read` e retornos são cópias, não referências mutáveis internas.

`RepositoryEvent`: `{ status: 'saving'|'saved'|'error'|'external-change', revision?: number, error?: RepositoryError }`. Sucesso e listeners de dados somente após `transaction.oncomplete`, nunca após request.onsuccess. Erro pode ser propagado também por rejeição; UI o mantém visível e não diz “salvo”. BroadcastChannel por banco + releitura no foco como fallback; close fecha canal/conexão, versionchange fecha conexão e pede reabertura/fechamento de outras abas sem reset.

`RepositoryError`: erro com `code: 'unavailable'|'quota'|'conflict'|'validation'|'future-version'|'blocked'|'transaction'`, `message` PT-BR. Falha mantém o estado anterior; UI permite nova tentativa/leitura em conflito. Ausência IndexedDB não ativa silenciosamente armazenamento volátil.

## Importação e exportação

Pacote novo: `{ app: 'treino12', v: 3, exportedAt: instante ms, state: StateV3 }`. Identificador e versão obrigatórios. Importação legada aceita objeto v1/v2 (v ausente somente quando campos estruturais reconhecíveis do protótipo o identificarem); rejeitar array/nulo/objeto vazio e formatos desconhecidos. Conferir tipos conhecidos em profundidade, dias civis, inteiros/limites, arrays e registros; não basta procurar propriedade v. Limites explícitos: 10 MiB de texto UTF-8, profundidade 64, 200 mil nós JSON. Sem avaliação/HTML executável. Campo anexos/fotos não suportado com conteúdo deve ser recusado com mensagem, nunca descartado.

`ImportPreview`: `{ token: string, sourceVersion: 1|2|3, expectedRevision: number, summary: { days: number, measurements: number, exercises: number, sessions: number }, warnings: string[] }`. Preparar não grava/substitui dados. token opaco identifica candidato validado mantido privado no repositório, vinculado à revisão de preparo. UI mostra quantidades e substituição antes da confirmação explícita; pode cancelar descartando o preview. confirmImport rejeita token inválido/consumido ou revisão alterada. Conteúdo usado na confirmação vem do candidato privado, não da UI.

Confirmação prepara fora da transação e grava snapshot anterior em recovery + estado substituto + revisão atual+1 no MESMO commit. Falta de quota, erro de store ou aborto desfaz ambos. Importação não confia na revisão/timestamps operacionais recebidos: mantém datas locais de geração/confirmação de backup e initializedAt, atualiza updatedAt. Guardar bruto importado em recovery. Nunca truncar histórico ou recovery para “fazer caber”.

`export` obtém snapshot consistente dos stores numa transação e serializa fora dela. Registrar lastBackupGeneratedAt apenas quando texto foi gerado com sucesso, por transação com revisão verificada; se concorrência invalidar o snapshot, repetir ou rejeitar conflito. Retorno revision corresponde à revisão após registro da geração. Não alegar que o arquivo foi guardado só por clicar download. Nome treino12-backup-<data>-r<revision>.json. Cópia via clipboard deve mostrar falha real e alternativa download quando indisponível. confirmBackup exige geração prévia válida nesta instalação e grava confirmação explícita; não presume sucesso de download/clipboard.

## Proteção e lembrete

`Protection`: `{ persistence: 'granted'|'denied'|'unavailable'|'error'|'not-requested', usage?: number, quota?: number, lastBackupGeneratedAt: number|null, lastBackupConfirmedAt: number|null, backupDue: boolean }`. Consultar persisted/estimate independentemente; APIs ausentes não bloqueiam app. persist somente por ação do usuário. Erro tem mensagem útil. backupDue = sem confirmação OU confirmação no futuro OU now-confirmedAt >= 7*24*60*60*1000. Geração não reseta lembrete. Reavaliar em initialize/protection e ao voltar ao foco; clock injetável em testes.

## Interface/PWA e critério de integração

Rotas: Hoje #hoje, Agenda #calendario, Treinos #treinos, Dieta #dieta, Evolução #progresso, Mais #mais. Rota desconhecida retorna Hoje. Sem router extra. Tema 'auto' segue prefers-color-scheme com listener; salvar preferência via repository. Mais integra initialize/conflito, save/erros, export/cópia, preview/confirmação e protection/confirmBackup; aviso semanal também em Hoje. Hooks React não fazem I/O direto em componentes.

Frontend implementa SW/manifest/aviso; devops integra geração do precache ao build se necessário, por escrita sequencial combinada. Não usar plugin obrigatório. Somente dist é artefato Pages. Teste offline usa build em /Projeto-Treino/ com SW pronto antes de cortar rede, navega nas seis rotas e reabre. QA verifica UI a 360px e desktop, foco/teclado/reduced-motion/temas, ausência console errors e todos os caminhos de dados. Os testes transacionais devem provocar falha real entre writes e provar rollback de recovery e estado. Hashes legacy/data devem permanecer iguais à FASE-0.

## Correção de capacidade e recuperação — 12/11/2026

Toda escrita monta o candidato completo e valida sua representação de backup fora da transação IndexedDB, incluindo o invólucro, os bytes UTF-8, a profundidade e a contagem de nós. Só então abre a transação readwrite, confere novamente a revisão e grava estado/recuperação juntos. Mantêm-se 10 MiB, profundidade 64 e 200 mil nós; o limite não aumentou. Originais nunca são truncados para caber.

`save` também simula exportação e restauração em fundação vazia. `export` valida o pacote completo e simula a restauração com bruto importado e snapshot anterior, usando o mesmo montador de `confirmImport`, antes de registrar geração. A fundação simulada reserva espaço para timestamps locais maiores. Assim, todo backup anunciado cabe na restauração em banco vazio. Uma instalação com dados adicionais pode recusar importação pelo custo de preservar seu estado anterior.

A preservação integral ainda cresce com restaurações sucessivas. Uma operação ou reexportação posterior pode ser recusada antes de alterar estado/recovery/revisão ou registrar geração; não há promessa de restaurações ilimitadas. Deduplicação/versionamento de representação fica para decisão futura. Estado já existente que não caiba no orçamento continua legível; uma exportação inviável retorna erro, sem anunciar arquivo válido.

`meta.migrationStatus` é um marcador operacional aditivo opcional: `none`, `completed`, `pending` ou `invalid`. Sem fontes: `none` e `migrationCompleted=true` para compatibilidade; todas as fontes inválidas: `invalid` e `migrationCompleted=false`, com brutos e avisos preservados. Somente fontes válidas pendentes de escolha bloqueiam substituição; `invalid` permite importação corretiva. Estados v3 anteriores sem marcador continuam aceitos.

O repositório mantém apenas a última prévia privada. Qualquer nova tentativa de `prepareImport`, inclusive inválida, expira tokens anteriores; tentativa concorrente mais antiga também não recria uma prévia obsoleta. Cancelamento pela UI pode apenas descartar a prévia visível; não há método público de cancelamento nem lista acumulada de candidatos.
