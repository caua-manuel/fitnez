# ADR 001 — Arquitetura e opções de front-end

Data: 11/11/2026. Responsável: papel `arquiteto`.
Status: adotado. React + TypeScript + Vite + CSS próprio aprovados explicitamente pelo usuário; execução limitada à Fase 1.

## Contexto e limites

O projeto Treino 12 semanas será usado diariamente no celular. O pedido e
`../ESPECIFICACAO.md` definem hospedagem estática no GitHub Pages, funcionamento
offline, IndexedDB e backup JSON. Sem servidor, login, banco externo ou
sincronização entre aparelhos nesta entrega. Essas restrições já são decisões
do usuário e não dependem de nova aprovação.

A elaboração inicial comparou opções. Nesta execução o agente real arquiteto foi acionado por spawn_agent; os demais agentes seguem a sequência do usuário, com um único escritor por vez. ADR 003 e docs/CONTRATOS-FASE-1.md prevalecem sobre propostas anteriores de implementação.

## Evidências do protótipo

- `legacy/index.html:17`: temas com azul, superfícies claras/escuras e fontes
  Barlow Condensed e Figtree. Referência visual prioritária para a implementação;
  os tokens neutros de `DESIGN.md` são provisórios e deverão ser reconciliados
  pelo papel `ux-acessibilidade` na Fase 1.
- `legacy/index.html:266`: seis abas com rotas por fragmento: Hoje, Agenda,
  Treinos, Dieta, Evolução e Mais. Manter os identificadores antigos
  `#hoje`, `#calendario`, `#treinos`, `#dieta`, `#progresso`, `#mais`.
- `legacy/index.html:360`: estado v2 em `treino12-v2`, fallback `treino12-v1` e
  normalização com conversão de `opt` para substituições de treino.
- `legacy/index.html:389`: falhas de gravação local são capturadas sem aviso.
  A nova interface deverá distinguir alteração pendente, gravação concluída e erro.
- `legacy/index.html:400`: integração opcional com `window.claude.use('db')`.
  Esse caminho não integra a arquitetura nova; o protótipo permanece preservado.
- `legacy/index.html:452`: o deload usa a coluna do bloco atual, enquanto a
  especificação menciona o bloco anterior. Registrar como divergência para o
  papel `conteudo-treino-nutricao` antes da Fase 2; nenhuma regra foi alterada.
- `legacy/index.html:723`: gráficos consultam o catálogo atual. O novo histórico
  precisa de metadados próprios para sobreviver à edição dos exercícios.
- `legacy/sw.js`: cache básico, atualização com `skipWaiting()` e exclusão de
  todos os outros caches da origem. A nova PWA deve controlar atualizações e
  excluir somente caches de seu próprio namespace.
- Fontes externas do Google no HTML não estão incluídas no precache atual.
  Para offline previsível, empacotar fontes licenciadas ou usar fallback local.

As sementes foram analisadas: 38 exercícios, quatro treinos, sete dias de rotina,
cinco refeições com três opções cada e 11 receitas. Plano, rotina, cardápio e
receitas coincidem com os valores embutidos no protótipo. Todas as referências
de exercícios e receitas das sementes resolvem. Isso verifica consistência
estrutural, não comprova regras de treino ou exatidão nutricional.

## Opções de stack

Todas geram arquivos estáticos; offline e dados locais serão camadas próprias.
A comparação de manutenção é uma avaliação arquitetural para este projeto,
não um benchmark de bibliotecas.

| Opção | Vantagens | Desvantagens | Manutenção |
| --- | --- | --- | --- |
| JavaScript com módulos ES + Vite + CSS | Caminho mais próximo do protótipo; poucos conceitos e dependências; reaproveitamento gradual | Atualização do DOM, formulários e estado precisam de disciplina manual; maior risco de acoplamento conforme as telas crescem | Menor barreira inicial; maior trabalho manual para evoluir a interface |
| React + TypeScript + Vite + CSS | Componentes reutilizáveis; organização explícita de estado e formulários; tipos ajudam a evoluir contratos de dados; aproveita a skill React instalada | Adiciona componentes, hooks, JSX e TypeScript; requer evitar efeitos e estado duplicado | Estrutura explícita; organização consistente para manter seis abas e CRUD |
| Svelte + TypeScript + Vite + CSS | Componentes próximos de HTML/CSS e atualização reativa; organização por tela | Introduz compilador e regras de reatividade específicas; skill React instalada não se aplica | Alternativa viável para quem prefere templates; adota o modelo Svelte |

## Decisão aprovada

**React + TypeScript + Vite, com CSS próprio.** O app tem formulários de séries,
editor de treinos, dieta e histórico com estados relacionados. Componentes
explícitos ajudam a manter esses fluxos e seus testes conforme o produto cresce.
TypeScript verifica contratos no desenvolvimento, mas não substitui a validação
de dados importados em tempo de execução.

JavaScript modular é a segunda opção quando se prefere controlar o DOM diretamente. Svelte é a terceira opção
se o usuário preferir sua sintaxe. A separação de domínio e dados será a mesma.

## Arquitetura comum às opções

Fluxo: interface → casos de uso → domínio puro + contrato de repositório →
adaptador IndexedDB. A interface não acessa IndexedDB nem `localStorage`
diretamente. Domínio não importa React, Svelte, DOM ou banco.

Estrutura adotada para implementação da Fase 1:

```text
src/
  app/                  inicialização, composição e navegação por fragmento
  features/
    hoje/ agenda/ treinos/ dieta/ evolucao/ mais/
  ui/                   componentes compartilhados e tokens
  domain/               calendário, progressão, totais, revisão e elegibilidade
  application/          casos de uso e contrato único do repositório
  data/                 IndexedDB, validação, migrações e backup
  pwa/                  estado offline e atualização segura
public/                 manifesto, ícones e fontes locais licenciadas
tests/
  unit/ integration/ e2e/ fixtures/
.github/workflows/      verificações e publicação, na Fase 1
```

Datas do plano são dias civis `YYYY-MM-DD`, sem conversão automática para UTC.
Timers usam instante final e recalculam ao retornar ao app; não dependem de
`setInterval` continuar ativo com o celular bloqueado. Não prometer alerta
sonoro ou execução de timer em segundo plano no iOS.

## Dependências adotadas e motivo

React/ReactDOM, TypeScript e Vite compõem a stack aprovada; Vitest, fake-indexeddb, Playwright e pacotes @types dão suporte à verificação. A lista mínima, justificativas e donos estão no ADR 003. IndexedDB nativo e service worker nativo substituem as propostas anteriores de idb e vite-plugin-pwa. Não há biblioteca UI, roteador ou fonte remota obrigatória. Instalar dependências locais necessárias está autorizado na Fase 1, com versões compatíveis e lockfile.

## Offline, build e privacidade

- Precache do shell, bundles, ícones, sementes e fontes usadas; dados mutáveis
  ficam em IndexedDB. Disponibilidade offline começa após cache concluído.
- Configurar alvo de build e verificar APIs no Safari 16; transpilar JavaScript
  não fornece automaticamente APIs ausentes do navegador.
- Testar build na raiz e em subcaminho, além de migração do service worker antigo.
  Cache e IndexedDB têm namespaces por aplicação; não limpar dados de outros
  projetos hospedados na mesma origem `usuario.github.io`.
- Publicar somente `dist/`. Não incluir docs, históricos, backups ou fotos no
  artefato. Como o repositório poderá ser público, o papel de segurança deve
  revisar os dados pessoais já presentes na especificação antes da publicação.
- Sem analytics, fontes remotas obrigatórias ou coleta de saúde por terceiros.

## Responsabilidades e próximos passos

| Papel | Área principal |
| --- | --- |
| arquiteto | ADRs, contratos e integração entre camadas |
| frontend | `src/app`, `src/features`, componentes e integração da PWA |
| ux-acessibilidade | sistema visual, seis abas em 360px, foco e teclado |
| backend-dados | `src/data`, contrato de armazenamento com arquiteto e migrações |
| conteudo-treino-nutricao | regras de `src/domain`, sementes e divergências de conteúdo |
| qa-testes | testes por camada, fixtures anônimos e testes de navegador |
| seguranca-privacidade | revisão de importações, dependências e exposição de dados |
| devops-github | build, precache, CI, artefato e deploy Pages |

Mudanças em contratos compartilhados passam pelo arquiteto. Escrita de produto sequencial conforme a ordem do usuário. Fase 1 autorizada; publicação e Fase 2 exigem autorização posterior.

## Fontes técnicas consultadas em 11/11/2026

- [Deploy estático e GitHub Pages — Vite](https://vite.dev/guide/static-deploy.html#github-pages).
- [Componentes e estado — React](https://react.dev/learn/thinking-in-react).
- [Visão geral — Svelte](https://svelte.dev/docs/svelte/overview).
- [Atualização mediante aviso — Vite PWA](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html).
- [IndexedDB com Promises — idb](https://github.com/jakearchibald/idb).

## Decisões pendentes do usuário

Nenhuma para executar a Fase 1. Stack e armazenamento já aprovados. Recomendação: concluir e verificar a fundação antes de autorizar publicação ou Fase 2.


