# Frontend: app mais vivo em Treino, Dieta, Evolução e Perfil

Aplica o acabamento do ADR 006 (ícones Phosphor, acentos de seção, movimento discreto) às quatro telas restantes. Nenhuma regra, número ou texto de treino/dieta mudou; texto novo só nas ações de exportação CSV.

## Treino
- `tone-treino` na lista, no detalhe, na execução e no concluído; tiles e ícones no tom. Dias sem treino de academia (aula, jogo, descanso) usam tile neutro (`quiet`), para o tom marcar só os treinos.
- Menus com ícone (abrir, editar, duplicar, histórico); botões Duplicar/Excluir do editor com ícone; `ConfirmSheet` de restaurar (histórico) e de concluir (marca). Novo ícone `copiar` em `src/ui/icons.tsx`.
- Entrada em sequência na lista do plano e nos exercícios do detalhe (`stagger.ts`: `useStagger` aplica a classe no próprio `li`, sem quebrar `ul > li`; só na primeira visita da sessão); anel do plano no detalhe preenche e conta em 350 ms (`ProgressRing animate`); marca de série desenhada só ao concluir (`useJustTurnedOn`); selo de concluído do resultado desenhado.
- Resumo do concluído (duração, exercícios, séries, volume) ficou estático: os e2e leem esses números com o relógio pausado e a contagem ficaria em 0. Decisão consciente.

## Dieta
- `tone-dieta`: ícones dos indicadores, da água e da refeição no verde; números e progresso seguem neutros/azul.
- Anel de calorias preenche (350 ms) e conta; indicadores contam (`CountUp`); refeições e opções entram em sequência; marcas de consumido/creatina e "Consumido neste dia" desenhadas só no toque; menu de opções com editar/duplicar/lixeira.

## Evolução
- `tone-evolucao` nos ícones de cabeçalho, indicadores e linha de registro; indicador selecionado continua azul. Cartões entram em sequência (`Reveal`); peso conta. Gráficos já tinham animação própria (linha, barras).

## Perfil
- Números de Treinos, Refeições e Constância contam e levam o ícone no tom; objetivo em brasa e plano em treino (só os tiles).
- Exportar planilhas (CSV): três botões em "Backup e restauração" (cargas, medidas, dieta), gerados no aparelho com BOM e `csvFilename(tipo, hoje)`; aviso com o nome do arquivo. Sem dado pessoal embutido. "Apagar todos os meus dados" NÃO foi feito (aguarda a camada de dados).

## Testes
- `tests/unit/motion.test.ts`: `Reveal` exige `children` nas props; passado como prop (corrigido o teste, componente correto).
- `tests/unit/thumb.test.ts`: o ícone do tile agora é Phosphor duotone (sem `stroke-width`); o teste verifica `opacity="0.2"` do duotone (corrigido o teste, componente correto).

## Docs e fora do escopo estrito
- `DESIGN.md`: seção de acentos de seção e regras de movimento do ADR 006.
- `src/ui/icons.tsx`: ícone `copiar` (CopySimple, importação individual).
- `scripts/verify-build.ts` já trazia limite de CSS de 24 KB (o ADR diz 12 KB; hoje 20,3 KB). Não alterei; decisão do arquiteto.

## Limitações
- Movimento reduzido: confiado nos utilitários e na regra global `prefers-reduced-motion`; não testado em dispositivo. Sem Safari físico nem leitor de tela.
- Lembrete do ambiente: no Git Bash, rodar `vitest` a partir de `c:/...` (minúsculo) quebra todas as suítes; use `C:/Projeto-Treino`.
