# Front-end: "Hoje" em 3 segundos, treino livre, atalhos e voltar no assistente

Data: 19/11/2026. Responsável: `frontend`. Contratos: `ux-fase-indispensavel.md` (C1, C6, B1 a B6, B9, D), `ux-inspiracao-hevy.md`, `dados-ondas-hevy.md`, `devops-orcamento-peso.md`. Sem dependência nova. Nada mudou em `src/domain`, em `src/application` nem em `src/data`.

## O que entrou

- **Início = "Hoje"** (`inicio/Inicio.tsx`, `DietaResumo.tsx`, `inicio.css`):
  - Topo: "Qua, 11 nov · Semana 06 de 12", faixa de 12 semanas (`role="img"`), "Pare N repetições antes da falha" no lugar de "RIR" (com "Semana leve" e nota da semana) e "N semanas seguidas" (`weekStreak`, só com `show`).
  - Um cartão com o treino, a duração, os exercícios e o 1º exercício pendente: séries × repetições e a carga sugerida como número herói (`suggestNext` + `placeholderFor` na série 0). A seta ↑ só aparece se a carga for maior que a melhor da última sessão, porque na semana leve o placeholder não sobe. Botão principal Começar/Continuar treino.
  - O menu ⋮ "Mais opções do dia" reúne Registrar outro dia, Trocar treino (ou Data de início antes e depois do plano) e Treino livre.
  - Uma linha da dieta: próxima refeição não marcada e kcal restantes, ou "N de 5 refeições" com `hideDietNumbers`. Ela leva direto à refeição.
  - Descanso, aula, vôlei e esporte mostram "Amanhã: …" e a faixa da semana. No descanso, o condomínio fica recolhido em "Opcional: treino do condomínio" (abre sozinho se algum item foi marcado).
  - A 3ª aula virou um bloco recolhido que mostra o veredito no resumo. Observações e nota da aula continuam como estavam.
  - Saíram o segmentado Treino/Dieta, os atalhos Dieta/Evolução, o anel de 88 px, a saudação, a foto do herói, `useTilt` e `mv-par`. Instalar e o lembrete de backup ficaram no rodapé.
  - Textos: "Fiz a aula", "Joguei hoje" e "Treinar sem mudar a data".
- **Treino livre** (`treino/Livre.tsx`, rota `#treino/livre`): busca na biblioteca de exercícios (`plan.ex`), escolha numerada na ordem e botão "Começar com N exercícios", que leva a `#treino/livre/executar?ex=a,b`. A escolha fica na URL e sobrevive a recarregar. `Executar` usa `sessionId 'livre'` (`FREE_SESSION_ID`) com `freeExercises` (`treino/util.ts`): os escolhidos mais os registrados no dia que não são de outro treino. Concluir não grava `acts.gym`, e `weekStreak` e a faixa da semana ignoram o livre (`semana.ts` passou a usar `planWorkoutsDone`). O Concluído mostra "Treino livre" e não compara volume. As entradas ficam em Treino ("Treino livre", acima de Meu plano/Biblioteca) e no menu ⋮ do Início.
- **Router**: `?ex=` em `executar` (`parseRoute`/`hrefFor`).
- **Casts de `rirSequence`** removidos nos 6 arquivos. **Paliativo de carga** do placeholder removido de `Executar.tsx`.
- **hideDietNumbers**: kcal e macros saem das opções da refeição (`Refeicao.tsx`) e da lista de Gerenciar opções.
- **Atalhos do PWA** (`src/pwa/build.ts`, `SHORTCUTS`): "Treino de hoje" → `#inicio`, "Registrar peso" → `#evolucao` e "Dieta" → `#dieta`, todos relativos à base. O ícone é o 192 px já em precache. `scripts/verify-build.ts` agora exige pelo menos 3 atalhos, URL dentro da base com hash e ícones no precache.
- **Assistente**:
  - Carregado sob demanda: `React.lazy` em `App.tsx`, com fallback "Abrindo o assistente…". `store.ts` continua no chunk principal, e o chunk `Assistente-*.js/.css` entra no precache.
  - Voltar do celular: enquanto houver passo para voltar, fica uma entrada de guarda no histórico (`pushState` sem URL nova e sem respostas). Cada voltar recua um passo, e a guarda sai ao fechar. Nada das respostas vai para o histórico nem para o armazenamento.
- `DESIGN.md`: faixa de 12 semanas, número herói e linha de lista.

## Verificação (resultados reais)

- `npm run typecheck` ok. `npm test`: 36 arquivos, 536 testes ok. `npm run test:config`: 9 ok.
- `npx vite build` + `node scripts/verify-build.ts`: "JavaScript 198,3 KB de 215 KB; CSS 23,6 KB de 28 KB". O resultado ficou em 23 arquivos e 23 URLs de precache, com o chunk do assistente à parte.
- e2e completo (`E2E_PORT=4291 npx playwright test`): **177 passed, 0 failed**. Novos testes em `tests/e2e/hoje-livre-atalhos.spec.ts`: carga sugerida no cartão; esporte com amanhã, semana e menu; hideDietNumbers; treino livre de ponta a ponta; atalhos do manifesto abrindo as rotas; voltar no assistente; assistente offline depois do SW pronto. Ajustados sem afrouxar: `entrega-a-inicio.spec.ts` (menu ⋮, "Fiz a aula", condomínio recolhido, 3ª aula recolhida e a linha da dieta no lugar do segmentado) e `escala-instalar.spec.ts` ("Fiz a aula"). Em `recuperacao-erro.spec.ts`, "apagar tudo" agora fecha o assistente com "Decidir depois" antes de ir ao Perfil: havia uma corrida entre o goto e a abertura do assistente, que falhou 2 de 4 vezes isolado.
- Capturas reais 390 px, claro e escuro, em `capturas/hoje/inicio-{treino,descanso,esporte}-{light,dark}-390.png`. Corrigido depois de olhar: espaços grandes entre o título e a duração (margens globais de `.inicio p`/`.card h2`), o rótulo da dieta que quebrava em duas linhas e a 3ª aula ocupando meia tela.

## Pendências

1. Os atalhos usam o ícone do app. Ícones monocromáticos de 96 px por atalho dependem de arte nova.
2. "Treino de hoje" abre o Início (o "Hoje"). Uma rota direta para a execução precisaria de uma rota nova.
3. No treino livre ainda não dá para adicionar um exercício durante a execução. É preciso voltar à escolha, e os exercícios já registrados vêm marcados.
4. O lembrete de backup continua como aviso amarelo no rodapé (D4 sugere uma linha simples). Esse componente é compartilhado.
