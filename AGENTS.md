# Fitnez (Treino 12 semanas): instruções para agentes

Leia este arquivo e `docs/handoffs/PARA-O-CODEX.md` antes de qualquer tarefa. Responda sempre em português do Brasil, curto.

## O que é o app
PWA de treino e dieta de 12 semanas, sem servidor: dados no aparelho (IndexedDB), backup em JSON, hospedagem estática no GitHub Pages. Uso pessoal e de amigos. O dono não programa: não explique conceitos, entregue o resultado e como testar.

## Stack
React 19, TypeScript, Vite, CSS próprio (`DESIGN.md` tem os tokens), Vitest (unidade e integração com `fake-indexeddb`), Playwright (ponta a ponta em celular). Quase nenhuma dependência de produção; qualquer nova exige ADR em `docs/decisoes/`.

## Comandos (na raiz, `C:\Projeto-Treino`)
- `npm run dev`: servidor local (porta 5173).
- `npm run typecheck`, `npm test` (Vitest), `npm run build`.
- `npm run check`: config, tipos, testes, build e orçamento de peso. É o portão de qualquer entrega.
- `npx playwright test <arquivo>`: ponta a ponta; veja "Armadilhas" no handoff.

**Aviso do Vitest:** o terminal precisa abrir em `C:\Projeto-Treino` com **C maiúsculo**. Com `c:\...` minúsculo o Vitest carrega o módulo duas vezes e falha com `Cannot read properties of undefined (reading 'config')`. Não é bug do código.

## Regras inegociáveis
- **Sem push e sem publicação.** Só commits locais pequenos. Publicar é com o dono.
- **Não mude números de treino e dieta** (séries, repetições, RIR, descanso, calorias, macros), **regras de volume e regras de segurança** (menor de 18, gestação, amamentação, transtorno alimentar, condição de saúde, IMC). Se a tarefa exigir, pare e registre em "Não decidir sozinho".
- **Preserve `legacy/`** sem alterar.
- Interface e textos em português do Brasil, linguagem simples. Nunca invente texto de saúde: use só os que já existem no domínio.
- Poucas dependências.
- Regra de negócio fica em `src/domain/` (funções puras, sem interface e sem acesso a dados) **com teste de unidade**.
- **Nunca mude o formato guardado** (`StoredAnswers`, `Plan`, registros, backup) sem migração e teste de migração.
- Não mexa em `src/app/commitQueue.ts` (exercício de estudo do dono).

## Como trabalhar
1. Uma tarefa por vez, só a que o dono pediu. Não faça "já que estou aqui".
2. Tarefa média ou grande: escreva o plano em 5 linhas antes de editar.
3. Teste que falha primeiro (vermelho, depois verde). Bug: reproduza em teste antes de corrigir.
4. Antes de dizer "pronto", cole a saída de `npm run check` (resumo: testes, orçamento) e `git diff --stat`. Sem isso, não está pronto.
5. Commit local pequeno por tarefa, mensagem em português no formato `tipo(área): resumo`.
6. Interface: confira em 390x844, tema claro e escuro, teclado e foco, antes e depois, no navegador de verdade (não só teste).
7. Reaproveite componentes e padrões do app; leia `DESIGN.md` antes de mexer em tela.
8. Respostas curtas: o que mudou, o que testou, o que falta. Sem colar arquivos inteiros.

## Não decidir sozinho
Pare e pergunte ao dono (com recomendação e resposta curta para confirmar) quando for:
- número ou regra de treino, dieta, volume, descanso, tempo ou segurança;
- texto de saúde novo, aviso de segurança ou orientação ao usuário;
- mudar formato de dados, migração, backup ou chave de armazenamento;
- aparência nova que o `DESIGN.md` não cobre, ou fluxo novo de tela;
- nova dependência, mudança de CI, publicação, push ou versão do service worker;
- qualquer tarefa marcada BLOQUEADA nos handoffs: "BLOQUEADO PARA O CODEX: o dono revisa quando voltar ao Claude".
Não existem agentes nem skills no Codex: não os invoque nem finja que foram executados.

## Onde está o resto
`docs/decisoes/` (ADRs, a decisão vigente de cada tema), `docs/handoffs/` (entregas e `PARA-O-CODEX.md`), `docs/especificacoes/` (specs a implementar), `README.md` e `DESIGN.md`.
