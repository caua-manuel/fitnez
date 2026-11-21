# Segurança e privacidade: ADR 011 (compartilhar plano, modo demo, novos campos do backup)

Revisão somente leitura de `src/` e `tests/`. Escopo: itens 1.1 (demo), 1.2 (`meta.usage`, `meta.prompts`) e 1.3 (compartilhar plano) do [ADR 011](../decisoes/011-pronto-para-amigos-e-ferramentas-da-academia.md).

Testes executados: `npx vitest run tests/unit/planShare.test.ts tests/integration/plan-share.test.ts`, com 50 de 50 aprovados. Também passei entradas hostis pelo `parsePlanShare` num script descartável, fora do repositório (resultados abaixo).

Resumo: o núcleo do compartilhamento está sólido. A lista branca é estrita em todos os níveis, o tamanho é conferido antes do `JSON.parse`, há proteção contra `__proto__`, `constructor` e `prototype`, contra profundidade e contra números não finitos, os ids são restritos, e a exportação sai limpa de dados pessoais. Os riscos reais estão na demonstração, que ainda não está ligada no `main.tsx`: dois caminhos de código abrem o banco real sem olhar o modo. Isso precisa ser corrigido antes de ligar a demo.

## Alto

### A1. "Apagar tudo" e a recuperação do ErrorBoundary sempre abrem o banco real
- `src/application/eraseAll.ts:42` usa sempre `databaseName(base)`, ou seja, o banco real. O comentário diz que a função fica desligada na demonstração, mas nada no código garante isso.
- `src/features/perfil/ApagarDados.tsx:30` chama `eraseAllData` sem conferir `appMode()`.
- `src/ui/ErrorBoundary.tsx:16` recalcula por conta própria o nome do banco real (`treino12:<base>`), em vez de usar `dbName()` de `src/app/mode.ts`. As linhas 64 e 65 leem e apagam esse banco. O ADR 011 (1.1) pede explicitamente que o ErrorBoundary use o banco do modo ativo.
- Efeito, assim que a demo for ligada: um erro de tela dentro da demo leva a pessoa a uma recuperação que mostra e oferece apagar os dados reais. E qualquer "Apagar tudo" que escape da interface na demo destrói o banco real. Isso quebra a regra do ADR de que "não há caminho de código que abra o banco real".
- Correção:
  1. No ErrorBoundary, trocar a constante local por `dbName()` de `src/app/mode.ts`. Na demo, a recuperação deve oferecer só "Sair da demonstração" (apagar o banco da demo e a marca), nunca o apagar do banco real.
  2. Defesa em profundidade em `eraseAllData`: receber o nome do banco por opção, ou recusar com `RepositoryError('validation')` quando `readMode(localStorage, base) === 'demo'`.
  3. Esconder e desativar `ApagarDados` na demo.
  4. Teste de integração: com a marca de demo, `eraseAllData` e a recuperação do ErrorBoundary não alteram nenhum byte do banco real.

## Médio

### M1. Marca de demo sem banco de demo válido prende dados reais num banco que não exporta
- `src/app/mode.ts:12-14` aceita a marca `'demo'` sem conferir mais nada. `src/data/demo.ts:56` chama `createRepository`, e o `initialize` cria um estado de fábrica vazio no banco da demo.
- Cenários: marca adulterada (qualquer página da mesma origem pode gravá-la, e no GitHub Pages todos os sites de projeto da mesma conta compartilham a origem), saída interrompida, ou o navegador despejou o IndexedDB mas manteve o localStorage. A pessoa vê um app vazio, acha que está no modo real e registra treinos de verdade num banco onde `export` é recusado (`demo.ts:59`). Ao sair, `deleteDemoDatabase` apaga tudo.
- O ADR pede que uma "marca sem banco caia no real com demo vazia regenerável". O código atual não faz isso.
- Correção: gravar uma assinatura no estado gerado (por exemplo `meta.demo = true`, validada em `validateState`). Na abertura em modo demo, se o banco da demo não tiver essa assinatura, chamar `clearDemoMark()`, `deleteDemoDatabase()` e recarregar no modo real. A faixa "Você está na demonstração" precisa estar sempre visível, para a pessoa nunca confundir os modos.

### M2. Ler o arquivo de plano antes de checar o tamanho
- `src/domain/planShare.ts:169` mede o texto com `TextEncoder`, mas a essa altura o arquivo inteiro já está na memória. Ainda não existe a tela (`src/features/compartilhar/`). Se ela fizer `await file.text()` antes de olhar o tamanho, um `.json` de centenas de MB trava ou derruba a aba.
- Correção, para o frontend: `if (file.size > PLAN_SHARE_LIMITS.bytes) recusar` **antes** de `file.text()`, com `accept="application/json,.json"` no input. Fazer o mesmo na importação de backup (10 MiB), se ainda não for feito.

### M3. Observações de exercício (`t`) podem levar dado de saúde no arquivo compartilhado
- `src/domain/planShare.ts:226` só inclui `t` com `includeNotes`, e o ADR decidiu que a opção vem **marcada** por padrão. Na prática, as observações costumam ter coisas como "dor no ombro", "joelho operado" ou "evitar por hérnia", que são dados de saúde indo para terceiros.
- A exportação em si está correta. Conferi com estado hostil: chaves extras em exercício, treino e rotina, `start` e `s` em dia de esporte não saem. Histórico, medidas, dieta, perfil, `exerciseNotes`, anilhas, `meta` e `recovery` também ficam de fora.
- Correção, para o frontend: na tela de exportar, mostrar a lista das observações que vão sair (prévia) ao lado do "Incluir observações", ou deixar a opção desmarcada por padrão. A escolha é do dono, já que muda a decisão 4 do ADR. O nome do plano também não deve vir pré-preenchido com o nome do perfil.

### M4. `recovery` cresce sem poda a cada aplicar ou desfazer plano
- `src/application/planShare.ts:366-367` e `:408` gravam um plano completo em `recovery` a cada aplicação e a cada desfazer. O `commit` só faz `put` (`src/data/index.ts:143`) e o `save` funde `current.recovery` (`index.ts:180`), então nada nunca sai.
- `validateState` limita `recovery` a 400 registros (`src/data/validation.ts:285`, `L.recovery`). Passado esse limite, **toda** gravação falha. Antes disso, o backup cresce rumo ao teto de 10 MiB da importação (`validation.ts:234`), e um backup que não volta é perda de dados. O problema já existia com o assistente e com `before-import`, que guarda o estado inteiro. O compartilhamento acelera o crescimento.
- Correção, para backend-dados: na mesma transação do `commit`, apagar do store `recovery` os registros `plan-import-undo:*` e `before-plan-import-undo:*` além dos 3 mais recentes (o desfazer só usa 1 nível). Fazer o mesmo com `onboarding-undo`. Acrescentar um teste com mais de 400 aplicações.

## Baixo (resumo)

- B1. `src/domain/planShare.ts:147,150`: a rotina aceita `s` em qualquer tipo de dia e `label` fora de `esporte`, por exemplo `{k:'rest', s:'A'}`. Sem impacto hoje, mas fica fora da lista branca "por tipo". Sugestão: `s` só com `gym`, `gi` só com `bjj`, `label` só com `esporte`.
- B2. `planShare.ts:53-59`: os textos aceitam caracteres de controle e de direção bidi (U+202E e semelhantes), que permitem disfarçar nomes na revisão. Sugestão: rejeitar `[\u0000-\u001F\u007F‪-‮⁦-⁩]`.
- B3. `planShare.ts:22`: ids como `toString`, `hasOwnProperty` e `valueOf` são aceitos (a lista de reservados só tem 3 nomes). O domínio usa `own()`, mas várias telas fazem `plan.ex[id]?.` e `plan.sess[id]` sem `hasOwn`. Hoje isso só é explorável por id ausente vindo da rota, um problema antigo. Sugestão: rejeitar ids que existam em `Object.prototype` (`id in Object.prototype`).
- B4. `planShare.ts:266-268`: a renomeação `<id de 40>-2` gera um id de 42 caracteres. É aceito pelo `validatePlan` (L.id 200), mas faz `buildPlanShare` falhar depois ("identificador inválido"). Sugestão: cortar a base para caber em 40.
- B5. `src/data/validation.ts:272-274`: `planImport`, `usage` e `prompts` são validados por campo, mas aceitam chaves extras e datas no futuro (`usage.lastDay` em 9999 congelaria a contagem). Hoje são inertes: `restoredState` descarta o `meta` importado (`src/data/capacity.ts:17`), e o desfazer passa pelo `validateState` completo no `save`. Sugestão: recusar datas depois de hoje mais 1 dia no `usage` e no `prompts`.
- B6. Chaves de sessão fora do `storageKey`: `src/features/treino/util.ts:127` (cursor), `src/features/treino/Detalhe.tsx:27`, `src/app/App.tsx:28`, `src/features/treino/NovoTreino.tsx:48`. O ADR (1.1) pede que passem pelo modo. O impacto é só de conveniência de interface.

## Conferido sem achado
- Não há `dangerouslySetInnerHTML` nem `innerHTML` em `src/`. Todos os `href` vêm de `hrefFor` com ids restritos a `[A-Za-z0-9_-]`, e nada do arquivo vira `src` ou `href`. O texto do arquivo só é renderizado como texto do React.
- `__proto__` cru no JSON é rejeitado ("chave perigosa"), assim como profundidade acima de 12, `v` como texto e nomes só com espaços. O nome do arquivo baixado é normalizado (`planShareFilename`).
- `applyPlanShareToState` valida o arquivo de novo antes de gravar (`src/application/planShare.ts:357`), e o desfazer passa pelo `validateState` no `save`.
- Na demo, `export`, `prepareImport`, `confirmImport` e `confirmBackup` são recusados, `storage: null` não lê o protótipo legado e o `BroadcastChannel` segue o nome do banco da demo (`src/data/demo.ts:56-62`). Uma marca com qualquer valor diferente de `'demo'`, ou um erro de acesso, cai no modo real (`src/app/mode.ts:13`).
