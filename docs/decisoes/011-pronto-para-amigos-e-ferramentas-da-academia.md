# ADR 011: Pronto para amigos (Fase 1) e ferramentas da academia (Fase 2)

Data: 20/11/2026. Responsável: agente `arquiteto`.
Status: ADOTADA na arquitetura (fases autorizadas pelo dono). Números de treino e dieta dos itens 1.1, 2.5 e 2.6 dependem do `conteudo-treino-nutricao`.

Documentos de origem: ADR 002 (armazenamento e backup), ADR 006 (orçamento), ADR 008 (assistente), ADR 009 (registro Hevy), [devops-orcamento-peso.md](../handoffs/devops-orcamento-peso.md).

## Princípios que valem para todos os itens

- Regra em função pura em `src/domain/` (sem `Date.now`, `Math.random`, DOM ou IndexedDB; a data e o relógio entram como parâmetro). Gravação em `src/application/` ou `src/data/`. Tela em `src/features/`. API do navegador em `src/pwa/`.
- Toda gravação nova passa por `repository.save` (uma transação, conflito por revisão). Nada novo em `localStorage` além de conveniência descartável.
- O estado continua `v: 3`. Campos novos são opcionais, validados em `src/data/validation.ts` quando presentes; backups antigos importam sem conversão.
- Nenhuma dependência nova. Canvas, Wake Lock, Vibration, Web Share e Storage API são nativos e sempre detectados antes do uso.
- Donos de pasta: `backend-dados` em `src/domain/`, `src/application/`, `src/data/`; `frontend` em `src/features/`, `src/ui/`, `src/app/`, `src/pwa/`, `DESIGN.md`; `qa-testes` em `tests/`; `devops-github` em `scripts/`, `public/sw.js`, CI. `seguranca-privacidade` revisa 1.1, 1.3 e 2.5 antes da entrega.

## Fase 1: pronto para amigos

### 1.1 Modo demonstração

Decisão: **banco do IndexedDB separado**, escolhido na inicialização por uma marca.
- Banco real: `treino12:<base>` (sem mudança). Banco da demo: `treino12:demo:<base>`. O `BroadcastChannel` segue o nome do banco, então abas de modos diferentes não se misturam.
- Marca: `localStorage['treino12:<base>:modo'] = 'demo'`, lida de forma síncrona em `src/main.tsx` antes de criar o repositório. Em modo demo o repositório real **nunca é criado**; não há caminho de código que abra o banco real. Por isso a demo não toca o estado real nem os backups reais.
- `src/data/demo.ts` (novo): `createDemoRepository(options)` reutiliza `createRepository` com o nome do banco da demo e `storage: null` (não lê o protótipo legado) e recusa, com `RepositoryError('validation')`, `export`, `prepareImport`, `confirmImport`, `confirmBackup`. `protection()` devolve `persistence: 'unavailable'` e `backupDue: false`. `createRepository` ganha a opção `dbName` (só `src/data/` a usa).
- Chaves auxiliares também ganham o modo: `src/app/mode.ts` (novo) expõe `appMode()` e `storageKey(nome)`; o descanso (`treino12:descanso`), o cursor da execução e as marcas de sessão passam a usar `storageKey`. Na demo vira `treino12:demo:descanso` etc.
- `ErrorBoundary.tsx` usa o nome do banco do modo ativo (hoje calcula o real por conta própria).
- Entrar: botão "Ver com dados de exemplo" no passo de boas-vindas do assistente e no Início vazio (só se `hasUserData` for falso e o modo for real). Ordem: carrega o gerador por `import()`, grava a demo no banco da demo (`initialize` + `save`), **só então** grava a marca e recarrega. Se a gravação falhar, a marca não é escrita e o app segue no modo real.
- Sair: "Sair da demonstração" (faixa fixa discreta no topo em todas as telas da demo e no Perfil). Ordem: apaga a marca, `indexedDB.deleteDatabase` do banco da demo, recarrega. Na abertura em modo real, o app sempre chama `deleteDatabase` da demo (idempotente), para limpar uma saída interrompida. Outras abas escutam o evento `storage` da marca e recarregam.
- Na demo ficam desligados: backup, importar, compartilhar plano, apagar tudo, pedir persistência, lembrete de backup, guia de instalar e notificações. O assistente pode rodar (grava na demo).
- Gerador: `src/demo/generate.ts`, função pura `demoState(today: DayIso, empty: StateV3): StateV3`. Determinística: PRNG com semente fixa no próprio arquivo, nenhum relógio interno. Início do plano = segunda-feira de 4 semanas antes da semana de `today`, então hoje cai na semana 5. Contém: plano de exemplo e rotina de fábrica, treinos feitos nos dias da rotina (com 1 falta e 1 treino parcial), cargas subindo pela própria regra `suggestNext` (para ficar coerente com o app), a semana leve (semana 4) com metade das séries e sem subir carga, medidas semanais, dieta registrada em parte dos dias, perfil fictício sem nome real. O resultado passa por `validateState`. `src/demo/` só pode ser importado por `import()`.
- Números do perfil fictício, cargas iniciais, ritmo de progresso, medidas e adesão à dieta: `conteudo-treino-nutricao` define.
- Testes: unidade (mesma entrada dá saída idêntica; `validateState` aceita; nenhuma data depois de `today`; hoje = semana 5; cargas não caem fora da semana leve); integração com `fake-indexeddb` (entrar e sair não muda nenhum byte do banco real; demo recusa export/import; sair apaga o banco da demo; marca sem banco cai no real com demo vazia regenerável); verificação estática (nenhum `import` estático de `src/demo/`); e2e (entrar, navegar, sair, voltar ao estado vazio real; offline depois do precache).
- Peso: gerador fora da carga inicial (estimativa 3 a 5 KB gzip, chunk sob demanda). `mode.ts` e a faixa, menos de 1 KB inicial.

### 1.2 Proteção contra perda

- `navigator.storage.persist()`: pedido **uma vez, automaticamente, ao concluir o primeiro treino real** (momento de valor; no Firefox aparece permissão e faz sentido aí). Se negado, não repete sozinho; o botão do Perfil continua. O Perfil já mostra o estado (manter). Registrar `meta.prompts.persistAskedAt`.
- "Dia de uso" = dia civil local em que houve pelo menos uma gravação por `repository.save`. Abrir sem gravar não conta (não há dado novo a perder). Sem gravação extra: o contador é atualizado dentro da mesma transação do primeiro `save` do dia.
- Contrato: `meta.usage?: { lastDay: DayIso; daysSinceBackup: number }` (inteiro de 0 a 100000). `confirmBackup` zera `daysSinceBackup`. Relógio para trás (`today < lastDay`) não conta nem zera.
- Regra pura em `src/domain/userData.ts`: `nextUsage(usage, today)` e `backupDue({ usage, lastBackupConfirmedAt, hasUserData, snoozedOn, today })`: devido quando há dados do usuário, `daysSinceBackup >= 7` e não adiado hoje. Substitui o cálculo por 7 dias de calendário em `protection()`. Sem `meta.usage` (estado antigo), conta a partir da próxima gravação.
- Lembrete: o `BackupReminder` atual no Início, com "Fazer backup agora" (gera e oferece o arquivo, depois pergunta "Guardou o arquivo?" para confirmar) e "Agora não" (`meta.prompts.backupSnoozedOn = today`, some até o dia seguinte). O Perfil mostra data do último backup gerado e confirmado (já existe).
- Contrato `meta.prompts?: { persistAskedAt?: number; installShownAt?: number; backupSnoozedOn?: DayIso }`, validado quando presente.
- Testes: unidade de `nextUsage`/`backupDue` (mesmo dia não conta duas vezes; 7º dia dispara; adiado só hoje; relógio para trás); integração (o contador vai na mesma transação do `save`; `confirmBackup` zera; backup v3 sem `meta.usage` importa); e2e do lembrete com relógio simulado.
- Peso: menos de 1 KB inicial.

### 1.3 Compartilhar plano entre amigos

Formato (arquivo `fitnez-plano-<nome>.json`):
```
{ "app": "fitnez-plano", "v": 1, "name": "texto até 60", "plan": { "ex", "sess", "order", "alt"?, "cond"?, "rir"? }, "sched"?: [7 dias] }
```
- Lista branca estrita: qualquer chave fora dela, em qualquer nível, **rejeita** o arquivo (não ignora em silêncio). Exercício: `n, s, r, m, t?, rest?, g?`. Treino: `name, sub?, min?, ex`. Rotina: `k, s?, gi?, label?`.
- Nunca sai: histórico, medidas, dieta e metas, perfil, assistente, notas pessoais (`settings.exerciseNotes`), anilhas, data de início, `meta`, `recovery`. As observações de exercício (`t`) vão por padrão, com opção "Incluir observações" na tela de exportar.
- Limites: arquivo até 200 KB (checado antes do `JSON.parse`); até 150 exercícios e 30 treinos; ids `^[a-z0-9_-]{1,40}$`; textos nos limites da interface (nome 120, descrição 160, observação 300); `s` e `r` com 3 colunas (blocos); séries inteiras de 1 a 10; descanso de 0 a 600 s; `g` só dos grupos de `muscleGroups.ts`; `m` só `kg|bw|rep|s|kgs`; rotina com 7 dias e `gym.s` apontando para treino existente; `safeJson` (sem `__proto__`, sem profundidade excessiva). `v > 1` dá "arquivo de versão mais nova".
- Módulos: `src/domain/planShare.ts` (puro): `buildPlanShare(state, { name, includeNotes })`, `parsePlanShare(text)` devolvendo `{ ok, value, warnings } | { ok: false, error }`, `planShareDiff(currentPlan, shared)` (treinos e exercícios novos, iguais, renomeados). `src/application/planShare.ts`: `applyPlanShareToState`, `undoPlanShareInState`, `applyPlanShare(repo, …)`, `undoPlanShare(repo, …)`, no mesmo molde de `src/application/onboarding.ts`.
- Colisão de id: mesmo id com mesmo nome normalizado e mesmo `m` = mesmo exercício (o histórico continua). Mesmo id com nome ou `m` diferente = o importado ganha id livre (`id-2`, `id-3`…), porque o histórico é indexado por id e não pode mudar de sentido. Exercícios meus fora do plano importado ficam no catálogo (histórico preservado).
- Aplicar: uma única gravação troca `plan.sess`, `plan.order`, exercícios, `rir`, `alt`, `cond` e (se o arquivo trouxer e a pessoa marcar) a rotina; data de início escolhida na revisão (mesmo passo do assistente). Registros, metas, perfil e notas não mudam. O estado anterior vai para `recovery['plan-import-undo:<t>']`; `settings.planImport?: { v: 1, appliedOn, name, undoKey }`. Desfazer: toast com "Desfazer" e "Voltar ao plano anterior" no Perfil, um nível, como no assistente.
- Tela: `src/features/compartilhar/` (novo, carregado por `import()`), com exportar (nome, opção de observações, Web Share com arquivo quando houver, senão download) e importar (arquivo → revisão → confirmar). A revisão reaproveita o resumo de plano do assistente: o `frontend` extrai o resumo para um componente comum em `src/features/assistente/` usado pelas duas telas. Entrada no Perfil.
- Testes: unidade (ida e volta exporta → importa dá o mesmo plano; nada pessoal no arquivo, conferido por lista de chaves; cada chave desconhecida rejeita; cada limite rejeita no valor+1 e aceita no valor; colisão de id renomeia; rotina apontando para treino inexistente rejeita); integração (aplicar é uma transação; desfazer devolve plano e rotina idênticos; registros intactos; conflito de revisão); e2e (exportar, importar em outro contexto do navegador, revisar, aplicar, desfazer).
- Peso: tudo sob demanda (estimativa 5 a 7 KB gzip), exceto a entrada no Perfil.

### 1.4 Guia "instalar no celular"

- Momento: na tela de treino concluído (`Concluido.tsx`) do **primeiro treino real concluído**, uma vez só, se o modo de instalação não for `installed` e não estiver na demo. Cartão discreto com "Instalar" (abre o `InstalarApp` existente) e "Agora não". Grava `meta.prompts.installShownAt` ao mostrar, mesmo se dispensado. Depois fica só no Perfil (já existe).
- O pedido de persistência (1.2) acontece no mesmo momento, sem segunda interrupção visual.
- Regra pura `shouldOfferInstall({ prompts, installMode, demo, firstWorkoutDone })` em `src/domain/userData.ts`. Testes de unidade e um e2e.

## Fase 2: academia

### 2.1 Tela acesa, vibração e descanso

- Confirmado: `endsAt` é persistido em `localStorage` (`treino12:descanso`, com treino e dia) e o restante sempre sai de `restRemaining(endsAt, agora)`. Falhas atuais: a leitura descarta o descanso já vencido (ao voltar depois do fim, o "acabou" não aparece) e o relógio só atualiza no próximo intervalo de 500 ms.
- Decisão: mover a leitura para regra pura `restoreRest(raw, { id, day, now })` em `src/domain/restTimer.ts`, devolvendo `ativo`, `terminado` (venceu há até 10 min: mostra "Descanso terminou") ou `nada`. Atualizar o relógio no `visibilitychange`. A chave passa por `storageKey` (1.1).
- Wake Lock: `src/pwa/wakeLock.ts`, hook `useWakeLock(ativo)`: pede ao abrir a execução, pede de novo ao voltar à aba (o navegador solta ao esconder), solta ao concluir ou sair. Sem suporte ou com erro: silencioso, sem aviso.
- Vibração: já existe no fim do descanso; mover para `src/pwa/haptics.ts` com detecção e respeito a uma futura opção de desligar. iPhone não vibra (sem suporte); aceito.
- Testes: unidade de `restoreRest`; e2e com relógio simulado (sair, avançar, voltar e ver o tempo certo ou "terminou"); e2e de Wake Lock com a API simulada (pedido, nova tentativa ao voltar, liberação ao concluir).

### 2.2 Teclado, alvos e polegar

- `inputmode`: `decimal` para carga, peso e medidas (aceita vírgula); `numeric` para repetições, segundos e kcal. Hoje as repetições da execução usam `decimal`: corrigir.
- Alvo mínimo de toque de 48 × 48 px em toda a execução (token `--tap-min: 48px` em `DESIGN.md`). Ações principais (concluir série, descanso, próximo, concluir treino) no rodapé fixo ou na metade de baixo da tela.
- Testes: e2e em 360 × 740 medindo a caixa de cada botão e campo da execução (≥ 48 px) e conferindo o atributo `inputmode` de cada campo.

### 2.3 Histórico rápido por exercício

- Regra: `exerciseHistory` (`src/domain/records.ts`) já existe; a tela usa as 5 primeiras sessões, sem aquecimento. Sem regra nova.
- Tela: folha `HistoricoRapido.tsx` em `src/features/treino/`, aberta pelo nome do exercício ou pelo menu dele na execução. Não navega e não desmonta a execução (séries digitadas e descanso continuam).
- Testes: unidade (limite de 5, ordem, aquecimento fora); e2e (abrir no meio de uma série, fechar e ver o que foi digitado intacto).
- Peso: cerca de 1 KB inicial.

### 2.4 Calculadora de anilhas dentro da série

- Regra: `platesPerSide` existe. Sem regra nova.
- Tela: mover `AnilhasSheet` de `ExercicioPagina.tsx` para `src/features/treino/Anilhas.tsx`. Na série ativa de exercício com barra, botão de anilhas ao lado da carga, preenchido com a carga digitada ou o placeholder; quando a conta não fecha, "Usar X kg" coloca a carga possível no campo (não grava a série).
- Testes: e2e (abrir da série, usar a carga, o campo muda e a série não é concluída sozinha).

### 2.5 Resumo da semana e cartão compartilhável

- Regra pura `src/domain/weekSummary.ts`: `weekSummary({ days, plan, sched, start, today, targets, onboarding, week })` devolve treinos feitos e previstos, séries e volume (sem aquecimento), recordes da semana (`recordsOfDay`), aderência à dieta e, só se pedido, variação de peso e cintura. Semana = semana do plano (segunda a domingo); antes do início, nada. A definição de "dia na meta" vem do `conteudo-treino-nutricao`.
- Com `hideDietNumbers` ou `dietTargetsDisabled`, a dieta **não aparece** no resumo nem no cartão (nem como opção).
- Cartão: `src/features/resumo/` (novo, sob demanda). Canvas 1080 × 1350 desenhado com a fonte local Figtree (após `document.fonts.ready`) e cores do `DESIGN.md`; `canvas.toBlob('image/png')` (PNG do canvas não carrega metadados). Com `navigator.canShare({ files })`, Web Share com arquivo; senão download por `URL.createObjectURL` + `<a download>`, revogado depois. A prévia mostra o mesmo conteúdo em texto real (acessível).
- Privacidade por padrão: sem nome, peso, medidas, idade ou fotos. Peso e cintura só por opção marcada na hora, nunca lembrada (não é salva). `seguranca-privacidade` revisa o conteúdo do cartão.
- Entrada: Evolução ("Resumo da semana") e um cartão discreto no Início na primeira abertura da semana seguinte.
- Testes: unidade do `weekSummary` (semana leve, semana vazia, recordes, dieta escondida pelas marcações, opção de peso); unidade do desenho com canvas simulado (os textos desenhados não contêm peso sem a opção); e2e (gerar, cair no download sem Web Share).
- Peso: regra ~1,5 KB inicial (aparece no Início); cartão e tela sob demanda (estimativa 4 a 6 KB).

### 2.6 Aviso de estagnação

- Regra pura `src/domain/stagnation.ts`: `stagnation({ ex, sessions, week, rirOfWeek, experience })` devolve `null` ou `{ motivo, acao: 'deload' | 'trocar' | 'repeticoes', sessoes }`. Usa `exerciseHistory` e as regras do plano (semana leve, faixa de repetições, dupla progressão). Nunca avisa em semana leve, nas 2 primeiras semanas nem com menos sessões que o mínimo.
- Números (quantas sessões sem progresso, o que conta como progresso, quando sugerir cada ação, texto) são do `conteudo-treino-nutricao`. Nada é implementado antes da especificação dele.
- Ações concretas pelos caminhos que já existem: "Trocar só hoje" (`swapOptions`); "Ajustar repetições" (edição do plano com desfazer, `planEdit.ts`); semana leve: só orientação, sem mexer no plano sozinho.
- Tela: linha discreta no cabeçalho do exercício na execução e na página do exercício. Sem cor de alerta.
- Testes: unidade com a tabela de casos que o conteúdo entregar; e2e de uma sugestão e de cada ação.
- Peso: ~1 a 2 KB inicial.

## Orçamento de peso (revisão do ADR 006)

Medido hoje (gzip): JS inicial 192,8 KB (`index-*.js`) + 6,3 KB sob demanda (assistente) = 199,1 KB; CSS inicial 22,7 KB + 1,0 KB = 23,7 KB. Estimativa das duas fases: +6 a 9 KB na carga inicial e +15 a 20 KB sob demanda, total de 220 a 228 KB, acima dos 215 KB. Carregar sob demanda não reduz o total (o precache baixa tudo), só a abertura.

Decisão: o orçamento passa a ter **dois números**, porque eles medem custos diferentes. A carga inicial é paga a cada abertura no celular (análise e execução); o total é pago uma vez na instalação e fica offline.

| Medida | JS gzip | CSS gzip |
| --- | --- | --- |
| Carga inicial: arquivos citados em `dist/index.html` (`script src`, `modulepreload`, `stylesheet`) | ≤ 205 KB | ≤ 26 KB |
| Total: todos os arquivos de `assets/` | ≤ 300 KB (era 250 KB; revisto em 23/11/2026 por decisão do dono: margem para o cardápio do ADR 013 e animações; inicial inalterado em 205 KB) | ≤ 32 KB |
| Cada chunk sob demanda | ≤ 20 KB | ≤ 4 KB |

- Sob demanda obrigatoriamente: gerador da demo (`src/demo/`), compartilhar plano (`src/features/compartilhar/`), cartão e tela do resumo (`src/features/resumo/`), assistente (já é).
- Recomendado para devolver margem à carga inicial: página do exercício com `data/exercise-guide.json` sob demanda (3 a 6 KB, ver handoff do devops).
- Regra mantida: estourar qualquer número exige nova revisão registrada aqui; não se sobe o limite só no script.
- Para o `devops-github` (`scripts/verify-build.ts`): manter a soma total com os novos limites; acrescentar a soma da carga inicial lendo `dist/index.html`; acrescentar o limite por chunk dos demais `assets/*.js|css`; imprimir as três medidas; comentário apontando para este ADR. Verificação nova: nenhum arquivo fora de `src/app/` importa `src/demo/`, e o chunk do gerador não aparece em `index.html`.

## Ordem de implementação

1. Base: `src/app/mode.ts` e `storageKey`, `dbName` no repositório, `meta.usage` e `meta.prompts` com validação, orçamento em duas medidas no script (`backend-dados`, `devops-github`).
2. 1.2 proteção contra perda e 1.4 momento de instalar (sem dependência de conteúdo).
3. 1.3 compartilhar plano (sem dependência de conteúdo; revisão de segurança).
4. 1.1 demonstração: infraestrutura de isolamento primeiro; o gerador depois da especificação do conteúdo.
5. 2.1, 2.2, 2.3 e 2.4 (sem dependência de conteúdo).
6. 2.5 resumo e cartão, após o conteúdo definir "dia na meta".
7. 2.6 estagnação, após a especificação do conteúdo.

Dependem do `conteudo-treino-nutricao`: 1.1 (números da demo), 2.5 (aderência à dieta), 2.6 (toda a regra). Os itens 1.2, 1.3, 1.4, 2.1 a 2.4 não dependem.

## Consequências

- Campos novos opcionais: `meta.usage`, `meta.prompts`, `settings.planImport`; registro `plan-import-undo` em `recovery`. Versão do estado continua 3.
- O lembrete de backup muda de "7 dias de calendário" para "7 dias de uso"; quem usa pouco vê menos lembretes.
- A demo existe só no aparelho e some ao sair; nada dela entra em backup.
- `docs/ESPECIFICACAO.md` (seção 2.7) deve citar demonstração, compartilhar plano e resumo da semana.

## Decisões do dono (com recomendação)

1. Demo pode usar o assistente e editar o plano (tudo some ao sair)? Recomendo sim.
2. Lembrete de backup por 7 dias de uso, em vez de 7 dias de calendário? Recomendo sim.
3. Ao importar plano de amigo, trocar também a rotina da semana se o arquivo trouxer? Recomendo perguntar na revisão, desmarcado por padrão.
4. Observações dos exercícios vão no plano compartilhado? Recomendo sim por padrão, com opção de tirar.
5. Cartão da semana mostra aderência à dieta por padrão? Recomendo sim (exceto quando as metas estão escondidas); peso e medidas só se marcar.
