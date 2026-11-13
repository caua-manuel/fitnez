# Frontend Treino: vários treinos por dia e componentes compartilhados

- Bug N1: toda gravação usa `upsertWorkout` e toda leitura `getWorkout`/`isDone`/`listWorkouts` (`util.ts`, `Executar`, `Detalhe`, `Concluido`, `Treino`, `Biblioteca`). `statusOf(day, id)` agora é por treino; `acts.gym` só vale em dia sem registro por treino.
- Aviso ao iniciar treino com exercícios já registrados hoje por outro treino ("Estes exercícios já têm séries registradas hoje"), sem apagar nada.
- Detalhe concluído hoje: "Ver resultado" + "Refazer hoje" (reabre a execução; as séries ficam). Anel com legenda e rótulo "Semana N de 12: X% do plano". "Concluído" agora tem "Ver treino" (antes "Ver resultado").
- "Continuar treino" retoma no exercício em que estava (sessionStorage `treino12:cursor:<dia>:<treino>`), com fallback no primeiro incompleto.
- Migração: Sheet/ConfirmSheet, showToast (6 s), Menu (⋮ do cartão, do exercício e do editor). Removidos `Sheet.tsx`, `UndoToast.tsx`, `Menu.tsx` locais e o CSS morto (`tr-pop`, `tr-menu`, `ed-toast*`, etc.). Textos "desfazer por 8 segundos" agora dizem 6.
- Sem Select no módulo (não há seletor).
- Pedido a outro dono: `src/features/inicio/Inicio.tsx:68` ainda diz "Use Trocar treino de hoje"; o botão é "Trocar treino". Em Treino já é "Trocar treino". Também pendentes em Inicio/Perfil: `metricas.ts` e `Inicio.tsx:69/86` (ver dados-varios-treinos-dia.md).
- Testes: e2e atualizados (menuitem, status do toast, "Ver treino") e novos: Detalhe concluído, dois treinos no dia, teclado do menu, aviso de sobreposição, cursor, concluir A e B.
