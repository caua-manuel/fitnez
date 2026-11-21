# Segurança e privacidade: telas do ADR 011 (resumo da semana, compartilhar plano, ligação da demo) e varredura do repositório

Revisão somente leitura de `src/` e `tests/`, em 20/11/2026. Continua [seguranca-adr-011.md](seguranca-adr-011.md).

Resumo: os achados A1, M1 e M2 da revisão anterior estão fechados de ponta a ponta. O M3 foi fechado pela metade: as observações já vêm desmarcadas e com prévia, mas a prévia não lista tudo o que vai no arquivo (M-T1). O cartão do resumo da semana não tem achado alto nem médio. A varredura não encontrou dado pessoal real, segredo, IP local nem o nome de usuário do Windows em arquivos rastreados ou novos.

## Alto

Nenhum.

## Médio

### M-T1. A prévia das observações não cobre tudo o que sai no arquivo
- `src/features/compartilhar/Compartilhar.tsx:40-41` monta a prévia só com os exercícios dos treinos de `plan.order`.
- `src/domain/planShare.ts:206` e `:214` (`buildPlanShare`) também exportam o treino `plan.alt` e os treinos citados pelos dias de academia da rotina (com "Incluir minha semana" marcado, que é o padrão). As observações dos exercícios desses treinos saem no arquivo sem aparecer na prévia. Como observação costuma ter dado de saúde ("dor no ombro", "hérnia"), a pessoa pode enviar algo que não viu.
- Detalhe menor: a prévia mostra o texto com `trim()`, mas o arquivo leva o texto original (`planShare.ts:239`).
- Correção (frontend): gerar a prévia a partir do próprio resultado, sem lista paralela. Por exemplo, chamar `buildPlanShare(state, { name: name.trim() || 'x', includeNotes: true, includeSched: sched })` e listar `Object.entries(built.file.plan.ex).filter(([, e]) => e.t)`. Assim a prévia segue também a opção da semana. Acrescentar um teste com uma observação num exercício que só aparece no treino `alt` e outra num treino citado só pela rotina.

## Baixo

- B-T1. O cartão leva por padrão a linha de adesão à dieta ("na meta em X de Y dias registrados"), que é um dado de saúde leve (`src/features/resumo/content.ts:69`, `src/domain/weekSummary.ts:95-98`). Ela já some quando o assistente esconde os números da dieta. Sugestão para o dono decidir: uma opção "Incluir a dieta", marcada ou não, como a de peso e cintura.
- B-T2. A recuperação do ErrorBoundary na demo (`src/ui/ErrorBoundary.tsx:82-89`) não tem teste automatizado. `eraseAllData` e a assinatura `meta.demo` têm (`tests/integration/seguranca-dados.test.ts:55-110`). Sugestão: um teste de componente ou e2e com a marca de demo que force o erro e confira que só aparece "Sair da demonstração" e que o banco real não muda.
- B-T3. O arquivo de plano leva textos livres da pessoa além das observações: nomes de treino, `sub`, `min` e o rótulo dos dias de esporte (`planShare.ts:217-230`). Não é falha, porque a tela diz o que vai. Fica só o registro de que esses campos também podem ter algo pessoal.
- B-T4. Ainda abertos da revisão anterior (fora do escopo desta): B1 a B6 e M4 de `seguranca-adr-011.md`. Não conferi a poda de `recovery` nesta rodada, embora exista `src/data/recoveryPrune.ts`.

## Conferido sem achado

### 1. Resumo da semana (`src/features/resumo/`)
- Conteúdo padrão do PNG: semana, período, treinos do plano, séries, total levantado, recordes (nome do exercício e carga) e a linha da dieta. Não entram nome, idade, altura, peso, medidas nem fotos. `drawCard` desenha só campos de `CardContent` (`draw.ts:147-234`), e `cardContent` não recebe o perfil.
- Peso e cintura: o estado é `useState(false)` local, sem gravação (`ResumoSemana.tsx:52`). O domínio só lê as medidas com `body: true` (`weekSummary.ts:169`). Ao fechar a folha, o componente sai da tela e a opção volta desmarcada. O texto da tela avisa isso.
- Metadados: `canvas.toBlob('image/png')` (`draw.ts:262`) não grava EXIF, data nem caminho. O nome do arquivo é só `fitnez-semana-N.png` (`content.ts:74`). As capturas PNG do repositório também não têm blocos de texto.
- Object URL: revogado depois de 30 s (`ResumoSemana.tsx:29`). No compartilhamento nativo, não se cria URL.
- CSP: a prévia é o próprio `<canvas>`, sem `<img src="blob:">` e sem `data:`. Isso é compatível com `img-src 'self'` (`vite.config.ts:17`). O download por `<a download href="blob:">` não depende de `img-src`.
- Não há rede: nem `fetch`, nem `sendBeacon`, nem analytics. A Figtree é local.

### 2. Compartilhar plano (`src/features/compartilhar/Compartilhar.tsx`)
- `file.size > PLAN_SHARE_LIMITS.bytes` é conferido antes de `file.text()` (`:158` e `:161`), com `accept="application/json,.json"` (`:171`). A importação de backup também confere 10 MiB antes de ler (`src/features/perfil/Perfil.tsx:201-202`). Isso fecha o M2.
- As observações começam desmarcadas (`:32`) e, quando marcadas, mostram uma prévia (`:73-77`). A ressalva está no M-T1.
- O nome do plano começa vazio (`:31`), com `autoComplete="off"`, e não vem do perfil.
- Não há `innerHTML`, `dangerouslySetInnerHTML`, `insertAdjacentHTML`, `eval` nem `new Function` em `src/`. Tudo o que vem do arquivo é renderizado como texto do React.
- A tela fica indisponível na demo (`:181`). A aplicação valida o arquivo de novo antes de gravar (revisão anterior).

### 3. Ligação da demo: A1 e M1 fechados de ponta a ponta
- `src/main.tsx:12-13`: o modo é lido uma vez, e na demo o repositório real nunca é criado.
- A1:
  - `ErrorBoundary.tsx:19` usa `dbName()` do modo ativo.
  - Na demo, a recuperação oferece só "Sair da demonstração" e "Tentar de novo", sem backup nem apagar (`:82-89`).
  - `ApagarDados.tsx:145` não aparece na demo e passa `mode: appMode()` (`:150`).
  - `eraseAll.ts:47-48` recusa antes de abrir o IndexedDB se `mode === 'demo'` **ou** se houver a marca no localStorage. Isso também protege uma aba real aberta antes de outra aba entrar na demo.
  - Há testes de "nenhum byte do banco real muda".
- M1:
  - O gerador assina `meta.demo = true` (`src/demo/generate.ts:69`).
  - `main.tsx:23-24` volta ao modo real (`exitDemo`) se a assinatura não estiver lá.
  - O banco real descarta `meta.demo` ao ler e ao gravar (`src/data/index.ts:38` e `:50`).
  - Importar um backup com `meta.demo` é recusado (`index.ts:100`), e a validação exige booleano (`validation.ts:90`).
  - A faixa "Dados de exemplo" fica fixa (`src/app/demo.tsx:78-85`), e o evento `storage` da marca recarrega as outras abas (`demo.tsx:50-52`).
  - Em erro de abertura na demo (`main.tsx:25`), a tela renderiza ainda na demo, e a recuperação é a da demo. O banco real continua intocado.

## 4. Varredura do repositório

Escopo: 1129 arquivos (`git ls-files` mais `git ls-files --others --exclude-standard`), a partir de `C:/Projeto-Treino`. Padrões buscados:
- e-mails;
- o nome de usuário do Windows do dono;
- `C:\Users`, `C:/Users` e `/Users/`;
- `192.168.*` e `10.0.*`;
- tokens: `ghp_`, `github_pat_`, `gho_`, `sk-`, `AKIA`, `AIza`, `xox*`, JWT `eyJ`, `sbp_`, `npm_` e chaves privadas PEM;
- atribuições do tipo `password`, `secret`, `token` ou `api_key` com valor.

O histórico do Git não entrou nesta rodada; foi coberto em `seguranca-auditoria-completa.md`.

| Achado | Onde | Classificação |
| --- | --- | --- |
| Nome de usuário do Windows do dono | nenhuma ocorrência | sem achado |
| Caminhos `C:\Users` / `C:/Users` | só `docs/handoffs/seguranca-limpeza-publica.md:22`, com o usuário trocado por `<usuário>` | sem achado |
| IPs locais | nenhum IP real. `docs/handoffs/seguranca-limpeza-github.md:5` cita só o padrão `x.x` | sem achado |
| E-mails | nenhum e-mail pessoal. Só exemplos de terceiros nas skills vendorizadas (`agents/`, `.claude/skills/`) | sem achado |
| Tokens e chaves | só valores falsos de teste nas skills vendorizadas (por exemplo `.claude/skills/roast-repo/runner/src/__tests__/redact.test.ts:6-54` e as cópias em `agents/auditoria-roast/roast-repo/`) e a chave de exemplo pública da AWS citada em `docs/handoffs/seguranca-auditoria-completa.md:49` | baixo (falsos, documentados) |
| Atribuições de segredo com valor em arquivos do projeto | nenhuma | sem achado |
| Login público do GitHub do dono (endereço do Pages e do repositório, titular da licença) | `INICIO.md:8`, `LICENSE:3`, `docs/PUBLICACAO.md:4,74,124`, `docs/decisoes/004-...md:14`, `005-...md:35` e handoffs | informativo: é público e intencional |
| Capturas novas `docs/antes-depois/antes/*.png` (14 arquivos, não rastreados) | perfil e evolução mostram nome, idade, peso, altura e cintura | sem achado: são os dados fictícios do gerador da demo (perfil "Exemplo", conferido com `tests/unit/demo-generate.test.ts:104` e `:177-180`), sem blocos de metadados |
| `legacy/index.html:408` | caminho de coleção do Firestore do protótipo, sem credencial | sem achado |
| `.gitignore` | cobre `.env*`, `perfil-pessoal*` e `*.local.json` (`:10-12`, `:32-33`) | ok |

Antes do commit: as capturas em `docs/antes-depois/` podem ser publicadas como estão. Se forem refeitas, devem continuar saindo da demo e nunca do aparelho do dono.
