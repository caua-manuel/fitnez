# Verificações de integração — orquestrador externo

Data de referência do usuário: 11/11/2026. Este registro contém execução e
revisão; nenhum código de produto foi escrito pelo orquestrador externo.

- Oito TOMLs conferidos: exatamente `name`, `description` e
  `developer_instructions`; corpos equivalentes aos Markdown sem cabeçalho,
  referências atualizadas para AGENTS.md e sem override de modelo/raciocínio.
- Instalação de dependências desbloqueada com rede autorizada: `npm.cmd install
  --no-fund --no-audit --fetch-retries=0 --fetch-timeout=20000`, exit 0, 48 pacotes
  adicionados. `npm.cmd ls --depth=0` confirmou as versões declaradas.
- `npx.cmd playwright install chromium` terminou com exit 0 com rede autorizada:
  Chromium 1248, headless shell, FFmpeg e utilitário de diagnóstico instalados
  para permitir os testes reais posteriores.

## Achados para o dono devops_github antes da conclusão

`npm.cmd audit --json --fetch-retries=0 --fetch-timeout=15000` identificou três
advisories no conjunto inicial: Vite 8.3.1 (alta), Vitest 5.0.2 e seu
`@vitest/mocker` (moderadas). O próprio npm indica correções compatíveis:
**Vite 8.3.8 e Vitest 5.1.0**. Solicitar ao agente devops_github atualização das
versões exatas e do lockfile em sua próxima janela de escrita exclusiva;
justificar no ADR e repetir os checks afetados e o audit. Não usar `audit fix
--force`. Registro é evidência de revisão, não correção já aplicada.

## Achado de integração para frontend/QA

Na leitura de `More.tsx` e `DataProvider.tsx`, o botão de persistência passa
`repository.protection({requestPersistence:true})` para `run`, mas não utiliza
o resultado. `run` chama `refresh`, que consulta `protection()` novamente e
pode trocar a resposta explícita `denied` por `not-requested`, ou ocultar o erro
da solicitação. Solicitar ao frontend que preserve e exiba o resultado real
da ação; QA deve testar `persist()` retornando `false` e rejeitando, além de
concessão. Não alterar código diretamente pelo orquestrador externo.
