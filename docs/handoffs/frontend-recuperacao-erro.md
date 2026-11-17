# Frontend: rede de proteção contra erro de renderização

Data: 2026-11-16. Responde ao achado B1 da auditoria (lado da interface).

- `src/ui/ErrorBoundary.tsx` (classe) envolve o `DataProvider` e o `App` em `src/main.tsx`. Não usa `useData` nem componentes do app. CSS próprio em `src/ui/recovery.css` (a CSP de produção bloqueia `<style>` em linha, por isso é arquivo; tokens próprios, claro/escuro por `prefers-color-scheme` e `data-theme`).
- Tela: título com foco, "Seus dados continuam guardados neste aparelho", e três ações: "Tentar de novo" (recarrega), "Baixar backup dos meus dados" e "Apagar tudo e recomeçar" (confirmação em duas etapas, avisa que não tem volta e sugere o backup).
- Backup de recuperação: lê o IndexedDB direto (`readRawState`, usando `open`/`request` de `src/data/idb.ts`) e grava o estado como está, com as cópias de `recovery` incorporadas, no mesmo envelope `{ v: 3, app, exportedAt, state }`. Não passa por `transferableText` porque ele valida e recusaria justamente o estado quebrado. Se a leitura falhar, a tela diz que os dados não foram apagados.
- Apagar: reaproveita `eraseAllData` com a revisão lida do banco, depois limpa o hash e recarrega.
- Erro só em `console.error` (nome do erro e pilha de componentes), nada enviado, sem dados pessoais na tela.
- Perfil: cartão de backup agora diz "O backup é um arquivo de texto com todos os seus dados de saúde. Guarde em lugar seguro."; a etapa 1 de "Apagar todos os meus dados" ganhou "O arquivo é texto puro: guarde em lugar seguro."
- Teste: `tests/e2e/recuperacao-erro.spec.ts` (5 casos). O erro é injetado semeando `history.days = null` no IndexedDB; não usa o perfil malformado porque a leitura tolerante do agente de dados já o repara.

Limites: o ErrorBoundary não captura erros em manipuladores de evento nem assíncronos fora da renderização. O arquivo de recuperação do estado quebrado pode não ser aceito pela importação normal enquanto estiver inválido.
