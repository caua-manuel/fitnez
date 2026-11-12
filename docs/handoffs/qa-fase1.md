# QA — Fase 1

12/11/2026. Agente real `qa_testes`. Escrita encerrada; liberada para revisão final de segurança. Escopo limitado à fundação autorizada pelo ADR 003; nenhum código de produto alterado pelo QA.

## Execução final e resultado

| Comando / ambiente | Resultado observado |
| --- | --- |
| `npm.cmd run check` | exit 0: 3 testes de base, TypeScript, 35 testes de dados, build e verificação de artefato |
| `npm.cmd run test:e2e` | exit 0: 17/17 passaram em 19,4 s, Chromium headless v1248 |
| Produção | `http://127.0.0.1:4173/Projeto-Treino/`, preview existente reutilizado, CSP ativa, 9 arquivos/URLs de precache |
| Erros do navegador | Nenhum `pageerror` ou `console.error` na rodada final; monitoramento inclui páginas secundárias. Sem supressão de erros de rede/CSP |

Arquivos QA: `playwright.config.ts` e `tests/e2e/fase1.spec.ts`. Relatório HTML local em `playwright-report/index.html`; resultados e capturas em `test-results/` (artefatos ignorados pelo Git, regenerados a cada execução). Nenhuma dependência nova ou mudança de package/config de produto.

## Cobertura verificada

- Seis hashes legados, navegação e rota desconhecida voltando a Hoje; foco no título ao navegar; todas as rotas sem overflow horizontal em 360 e 1280 px, claro e escuro. Preferências persistem após reload; automático acompanha mudança do sistema. Percurso de teclado até o atalho de conteúdo e foco de destino; preferência de movimento reduzido emulada.
- Importações v1 e v2 sintéticas: prévia focada sem gravação, cancelamento sem alteração, confirmação explícita, séries órfãs e números literais com vírgula preservados, reabertura e conteúdo do download v3. Originais/cópia anterior permanecem recuperáveis.
- Backup v3 efetivamente baixado, lido e importado pela interface em contexto com banco vazio; histórico equivalente, sem confirmar automaticamente backup no destino. Geração mantém lembrete, confirmação explícita o remove. Os 35 testes de dados incluem relógio futuro/sete dias e limites integrais da restauração própria.
- JSON inválido/versão futura e token obsoleto por alteração de tema: erro visível, sem substituir estado/recovery/revisão. Conflito v1/v2 persiste ao reabrir, bloqueia tema/importação até escolha explícita e preserva ambas as chaves e originais.
- StorageManager negado, rejeitando e concedido, com resultados visíveis também após salvar outro tema; clipboard negado com alternativa download; IndexedDB indisponível informa erro e não anuncia salvamento volátil.
- Falha entre writes em IndexedDB real: teste injeta `QuotaExceededError` em `IDBObjectStore.put` de `state`, após writes de `recovery`. Importação falha, não anuncia sucesso, documento e store físico `recovery` permanecem iguais, inclusive após reload. Leitura QA reúne ambos os stores para detectar recuperação órfã. É falha injetada, não esgotamento físico de disco.
- PWA: aguarda aviso de precache completo e controlador; corta rede, visita seis rotas, recarrega e abre outra página offline, mantendo tema e acesso ao catálogo. Teste usa build, sem desativar service worker/CSP e sem ajustar servidor para contornar falha.

## Defeito encontrado e regressão

A primeira rodada completa teve 14/16 passando: o teste de teclado pressupunha foco inicial no começo do documento, enquanto o app foca o h1; o percurso do próprio teste foi corrigido para respeitar esse comportamento. A rodada seguinte teve 15/16 passando, com defeito de produto offline reproduzido duas vezes.

Reprodução vermelha: mesmo após `Disponível offline`, nove URLs cacheadas e controlador pronto, reload offline produzia página vazia e dois erros `net::ERR_FAILED` para `/Projeto-Treino/assets/index-CzPxyENZ.js` e `/Projeto-Treino/assets/index-Xy4J6w9Y.css`. Diagnóstico real mostrou request de precache sem headers, resposta `Vary: Origin` e request de módulo com `Origin: http://127.0.0.1:4173`. `cache.match(event.request)` falhava por essa diferença e tentava rede indisponível.

Encaminhado ao frontend, que corrigiu somente a correspondência de assets explicitamente precacheados, usando URL absoluta normalizada e `ignoreVary`, com restrições de GET/origem/base preservadas. Ver [frontend-offline-fase1.md](frontend-offline-fase1.md). Nenhum teste ou servidor foi relaxado para ocultar o defeito. Após correção, check e os 17 E2E completos passaram; teste de rollback browser foi acrescentado antes da rodada final. Não restou teste falhando ou erro de console nessa rodada.

O defeito de recuperação/capacidade identificado antes desta janela tem suas regressões nos 35 testes de dados, todos reexecutados pelo QA: exportação prometida restaura em banco vazio, limite inclui snapshot/brutos/invólucro e recusas não alteram geração/revisão/recovery. Ver [dados-correcao-fase1.md](dados-correcao-fase1.md).

## Capturas e inspeção

Capturas completas de Mais, inspecionadas na matriz claro/escuro e celular/desktop:

- `test-results/fase1-rotas-layout-360px-e-tema-Claro/mais-360-Claro.png`
- `test-results/fase1-rotas-layout-360px-e-tema-Escuro/mais-360-Escuro.png`
- `test-results/fase1-rotas-layout-1280px-e-tema-Claro/mais-1280-Claro.png`
- `test-results/fase1-rotas-layout-1280px-e-tema-Escuro/mais-1280-Escuro.png`

Sem corte horizontal de controles/textos observado. Navegação fixa aparece no ponto correspondente à altura do viewport nas capturas de página inteira; há espaço de rolagem final. A matriz automatizada verifica as seis rotas, enquanto as quatro capturas de referência documentam Mais.

## Limitações e risco restante

Fixtures são explicitamente SINTÉTICOS. O kit não fornece backup real do usuário; compatibilidade com dados reais anonimizados continua sem prova. Não executados Safari/iPhone físico, instalação pelo menu do celular, leitor de tela, auditoria completa de contraste, esgotamento real de quota ou transição entre dois builds para validar aviso de atualização. Esses limites não são convertidos em aprovação desses cenários.

Recuperação integral cresce em restaurações repetidas e pode impedir futuras operações por capacidade; recusas conservam os dados. Browser/contexto novo não equivale a desligar/reiniciar um aparelho. Reload e nova página offline foram testados no mesmo contexto, com armazenamento preservado.

As regras de calendário/deload/dieta/progressão, CRUD, registro de séries e seus casos de borda pertencem às próximas fases; não foram antecipados. Validação de conteúdo continua com seu dono. Hashes de legacy/sementes e audit de dependências são consolidados pelo coordenador/segurança, sem alegar execução desses checks pelo QA.

Skills consultadas: testes web, depuração sistemática, Superpowers/TDD e verification-before-completion; contratos e ADRs lidos. O runner Node `@playwright/test` aprovado no ADR foi usado, em vez do exemplo Python da skill local, pois Python está indisponível neste ambiente conforme handoffs e a stack de testes foi definida pelo arquiteto. Não se alegou execução do helper Python.

Nenhuma mudança nos dados pessoais, sementes, `legacy/`, skills ou regras de treino/dieta; testes usam contextos descartáveis sintéticos. Sem commit, push, deploy ou início da Fase 2.
