# Handoff — frontend — correção offline da Fase 1

12/11/2026. Agente real frontend. Escrita de produto encerrada e liberada para QA.

- Corrigido `public/sw.js`: recuperação estática usa URL absoluta normalizada e `ignoreVary: true` somente quando a URL exata pertence ao precache. O preview serve JS/CSS com `Vary: Origin`; a instalação e a reabertura usavam cabeçalhos diferentes, causando falta falsa no cache e falha offline.
- Origem, base e URL completa (incluindo busca) continuam restritas. Nenhuma gravação de cache em runtime, expansão para dados ou mudança no fallback de navegação. Limpeza mantém apenas o namespace próprio; atualização continua manual e sem recarga automática.
- `src/pwa/build.ts` já inclui o template do worker no hash, portanto a correção gera nova versão de cache; não precisou mudar. UI, dados, regras, configuração, testes, sementes e `legacy/` preservados.
- `npm.cmd run build`: exit 0; TypeScript e verificador passaram; base `/Projeto-Treino/`, nove arquivos e nove URLs de precache, CSP presente.
- `npm.cmd run test:e2e -- --grep "PWA produção"`: exit 0, **1/1 passou** em Chromium no preview existente da porta 4173. O teste percorreu seis rotas, recarregou offline e abriu nova página offline, mantendo tema. Sem alterar teste nem servidor. Rodada completa fica a cargo do QA.

Skills consultadas: depuração sistemática, testes web, verificação antes da conclusão e diretrizes locais de interface/React; correção restrita ao service worker, sem decisão visual nova. Sem commit, push, publicação ou início da Fase 2. Nenhuma mudança nos dados.
