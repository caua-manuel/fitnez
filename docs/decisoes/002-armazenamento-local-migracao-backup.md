# ADR 002 — Dados locais, migração e recuperação

Data: 11/11/2026. Responsável: papel `backend-dados`, após leitura do ADR 001.
Status: adotado para a Fase 1 com as atualizações do ADR 003 e contratos em ../CONTRATOS-FASE-1.md. Stack já aprovada pelo usuário.

## Contexto e alternativas

IndexedDB é requisito do usuário. Foram considerados acesso nativo, idb e Dexie. Na execução aprovada adotamos IndexedDB nativo conforme ADR 003, evitando dependência adicional. O adaptador usa Promises, mas sucesso exige transaction.oncomplete. Não haverá banco externo, sincronização ou autenticação.

O protótipo lê primeiro `treino12-v2` e depois `treino12-v1`. `normalize()`
preenche valores e descarta campos desconhecidos; não deve ser reutilizada como
migrador sem preservação do original. Não há fixture real de usuário v1 ou v2
no kit: existem sementes e o código que lê esses formatos. A compatibilidade
com backups reais ainda precisa ser comprovada na Fase 1 com cópias anônimas.

## Contrato único de armazenamento

O contrato será assíncrono e independente da interface:

| Operação | Responsabilidade |
| --- | --- |
| Inicializar | Abrir o banco, verificar versões e executar migração necessária |
| Ler | Consultar catálogo, configuração, dias e medidas por critérios explícitos |
| Salvar | Gravar uma alteração e seus metadados em uma transação; conferir revisão |
| Escutar | Notificar consumidores somente após commit; invalidar outras abas |
| Exportar | Ler um snapshot consistente e gerar pacote JSON validado |
| Preparar importação | Validar, migrar em memória e mostrar resumo antes de substituir |
| Confirmar importação | Conferir revisão novamente, guardar recuperação e trocar dados atomicamente |
| Consultar proteção | Informar persistência, estimativa de espaço e datas de backup |

Erros distinguem armazenamento indisponível, quota, conflito, versão incompatível
e validação. Nunca retornar sucesso se o commit falhar. Serializar gravações da
mesma sessão e verificar uma revisão crescente dentro da transação para evitar
que duas abas sobrescrevam o trabalho uma da outra. Não usar somente `ts` como
desempate: relógios e alterações simultâneas não estabelecem precedência segura.

Notificações entre abas usam `BroadcastChannel` quando disponível, com releitura
ao ganhar foco como fallback. `versionchange` fecha conexões antigas; atualização
bloqueada pede fechamento das outras abas, sem apagar ou recriar o banco.

## Esquema de referência e contrato adotado

O contrato concreto de StateV3, assinaturas e stores mínimos está em ../CONTRATOS-FASE-1.md. A tabela abaixo registra a separação conceitual; a Fase 1 pode usar state/active + recovery com catálogo/histórico separados logicamente, preservando transação única e exportação completa. Fotos não são criadas nem aceitas silenciosamente nesta fase.

Nome de banco com prefixo da aplicação e identificador estável da instalação
Pages, para distinguir projetos na mesma origem. Não derivar de uma rota de aba.
Fixar o identificador ao implementar; mudanças futuras exigem migração explícita.
Versão física inicial do banco: 1. Versão lógica do documento exportado: 3.
São versões distintas e devem evoluir por migrações numeradas e testadas.

| Object store | Chave | Conteúdo |
| --- | --- | --- |
| `meta` | nome | versão lógica, revisão, início, tema, rotina e estado de backup/migração |
| `catalog` | `active` | plano editável, dieta, receitas e revisão do catálogo |
| `days` | data civil | séries por exercício, conclusão, sensação, substituição, condomínio, notas e dieta |
| `measurements` | data civil | peso, cintura, braço e coxa; entradas originais preservadas |
| `snapshots` | identificador | metadados de exercícios, sessão e opções alimentares usados no histórico |
| `recovery` | identificador | originais importados, campos desconhecidos, hashes e snapshot anterior à restauração |
| `photos` | identificador | Blob e metadados locais, reservado para a Fase 4 |

Catálogo e histórico ficam separados. Alterar ou remover um exercício não apaga
suas séries. IDs não são reaproveitados; exclusão do catálogo é lógica quando
houver referências. O histórico novo captura nome, tipo de registro, metas e
versão de catálogo ao iniciar um dia/exercício; trocar o catálogo não reescreve
esse snapshot. Mesmo cuidado com a opção alimentar consumida e seus macros.

No histórico antigo esses snapshots não existem. Preservar o catálogo recebido
como referência de migração, sem afirmar que representa exatamente o dia passado.
Referências órfãs continuam acessíveis pelo ID e pelo conteúdo bruto recuperável.

Os valores digitados em séries e medidas permanecem como texto, incluindo
vírgulas e zeros. Conversão numérica ocorre em funções puras; vazio não equivale
automaticamente a zero. Nenhuma normalização de armazenamento muda séries,
repetições, calorias ou porções das sementes.

## Migração de `treino12-v1` e `treino12-v2`

1. Abrir IndexedDB e conferir marcador de migração e existência de dados ativos.
   Se já houver uso novo, não importar automaticamente por cima dele.
2. Ler, sem modificar, as duas chaves e `treino-theme`. Verificar tipos, datas
   reais, mapas, arrays e referências; registrar o conteúdo bruto de cada fonte.
3. Fonte única válida: preparar importação. Duas fontes equivalentes: deduplicar
   a importação ativa, preservando ambas. Duas fontes diferentes com histórico:
   preparar comparação e seleção de origem na tela de migração; não fundir nem
   descartar uma delas pelo maior timestamp. Uma fonte vazia não deve vencer
   outra com registros por ser mais recente.
4. Para v1, aplicar a conversão observada: `opt[data]` verdadeiro vira
   substituição para `plan.alt` ou `LB`, somente se não existir `over[data]`.
   Completar estruturas ausentes com sementes identificadas. Campos desconhecidos
   ficam em `recovery`; versão futura não é convertida silenciosamente.
5. Preservar as seções conhecidas: `start`, `plan`, `sched`, `log`, `done`,
   `feel`, `over`, `cond`, `meas`, `notes`, `diet` e `ts` de origem. Datas fora
   das 12 semanas e exercícios removidos também fazem parte do histórico.
6. Preparar conversão e hashes antes da transação. Gravar dados ativos, originais,
   versão e marcador de migração na mesma transação IndexedDB. Só apresentar
   conclusão após commit e releitura de conferência; não fazer rede ou cálculo
   demorado dentro da transação.
7. Se houver aborto, quota ou fechamento, manter a origem intacta e permitir
   nova tentativa. A marcação transacional torna a operação idempotente.
8. Não remover nem atualizar as chaves legadas; elas são uma fonte preservada.
   Não usá-las como sincronização paralela depois da migração.

### Limite de origem e troca de endereço

Protocolo, host e porta definem a origem do armazenamento. Um app aberto em
localhost, em outro domínio ou em outro navegador não acessa automaticamente os
dados do app atual. Para esse cenário, o usuário exporta no protótipo e importa
no novo app. Um subcaminho diferente do mesmo `usuario.github.io` pode compartilhar
a origem, mas precisa considerar o escopo do service worker e a instalação PWA.
Não prometer acesso entre perfis, aparelhos ou contextos isolados do navegador.

## Backup e restauração

Pacote JSON identificado por aplicação, versão lógica 3, data de exportação,
revisão, catálogo, configurações, histórico, snapshots, recuperação e anexos.
Fotos são Blobs locais; quando existirem, o backup completo as serializa com
metadados e base64. Não omitir fotos silenciosamente. Um hash de integridade
detecta corrupção acidental, mas não comprova autoria nem criptografa o arquivo.

Exportar com leitura transacional consistente; calcular hashes e serializar
fora da transação. Nunca enviar o conteúdo para servidor. Backup copiado para a
área de transferência ou salvo no Drive/iCloud fica sob controle do usuário.

Restaurar aceita pacote novo ou JSON v1/v2 legado. Antes de gravar: verificar
identificador, versão, tipos, tamanhos, datas, chaves perigosas e anexos; não
executar conteúdo, mesclar protótipos nem renderizar HTML importado. Rejeitar
arquivo truncado, formato desconhecido e versão futura com mensagem útil.

Mostrar resumo do que será substituído e confirmação explícita. Antes da troca,
preparar cópia do estado atual em `recovery`; gravar recuperação e restauração
em uma única transação. Se faltar espaço para preservar o anterior, abortar;
nunca apagar os dados atuais para tentar abrir espaço automaticamente. Oferecer
exportação externa antes da tentativa. Estimativa de quota é apenas indicativa.

Recuperação dentro do mesmo banco protege contra erro de importação, mas não
contra limpeza dos dados do navegador. Uma atualização futura deve tratar a
retenção de snapshots sem apagar a última recuperação automaticamente.

## Persistência e lembrete semanal

- Detectar `navigator.storage.persisted`, `persist` e `estimate` antes de usar.
  Pedir persistência em contexto de interação e exibir estado concedido, negado,
  indisponível ou erro em Mais; uma negativa não bloqueia o uso do app.
- Não prometer que persistência ou instalação na tela inicial impedem limpeza
  manual, perda do aparelho ou falha do armazenamento. Backup externo é necessário.
- Registrar `lastBackupGeneratedAt` depois de gerar o arquivo com sucesso.
  O navegador nem sempre informa se o usuário realmente o guardou; identificar
  a data como geração, sem afirmar verificação do arquivo no destino.
- Permitir confirmação de que a cópia foi guardada e registrar
  `lastBackupConfirmedAt`. Mostrar aviso em Hoje e Mais se nunca houve confirmação
  ou se passaram sete dias. Se houver geração mais recente não confirmada,
  informar isso e permitir confirmar ou gerar novamente.
- Reavaliar o lembrete na abertura e ao retomar o app. É aviso dentro do app,
  sem depender de cron, push, internet ou execução em segundo plano.
- Importar backup antigo não deve declarar backup recente confirmado. Metadados
  da instalação atual prevalecem para esse controle operacional.

## Matriz mínima de testes para a Fase 1

| Cenário | Evidência esperada |
| --- | --- |
| Instalação sem dados | Sementes corretas e estado vazio identificado |
| v1 com `opt`, tema e vírgulas | Valores preservados e substituição convertida |
| v2 editado, séries extras e dieta | Todas as seções preservadas, sem restaurar o plano padrão sobre o personalizado |
| Duas chaves conflitantes | Ambas preservadas; seleção explícita, sem perda por timestamp |
| JSON inválido ou versão futura | Erro visível; banco e originais intactos |
| Interrupção/quota durante migração | Rollback; reinício seguro e sem duplicação |
| Reexecução da migração | Marcador e hashes impedem duplicação |
| Exclusão/edição de exercício | Histórico e snapshots continuam consultáveis |
| Exportar e reimportar | Equivalência de catálogo, histórico e anexos |
| Restauração com falha | Dados ativos anteriores integralmente mantidos |
| Escritas em duas abas | Revisão detecta conflito; nenhuma sobrescrita silenciosa |
| Persistência negada/ausente | App continua e informa proteção disponível |
| Sete dias, sem backup ou relógio alterado | Lembrete verificável com relógio controlado e sem ocultar aviso por data futura |
| Offline e reabertura no navegador | Série gravada reaparece após recarregar sem rede |

Unidade e integração podem usar IndexedDB simulado; transações, quota, troca de
versão e service worker exigem também testes com navegador real. WebKit no CI
ajuda, mas não equivale a validar o dispositivo iPhone com Safari 16.

## Fontes técnicas consultadas em 11/11/2026

- [Transações e migrações — IndexedDB/MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).
- [Persistência — StorageManager/MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist).
- [Origens, quota e remoção — Storage API/MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- [Wrapper idb e cuidados com transações](https://github.com/jakearchibald/idb).

## Consequências

Gravação transacional, migração preservada e backup reduzem riscos sem prometer
ausência absoluta de perda. Há custo de implementação e testes em troca de
histórico durável e recuperação verificável. O adaptador remoto é apenas uma
possibilidade do contrato, não código ou serviço a implementar agora.


