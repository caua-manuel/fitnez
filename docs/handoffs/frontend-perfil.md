# Frontend: aba Perfil (Tarefa 14)

- `src/features/perfil/Perfil.tsx` + `perfil.css` (classes `perfil-*`) + `metricas.ts` (funções puras: treinos concluídos, refeições registradas, constância). `src/features/More.tsx` removido; a lógica de backup, importação, migração e proteção foi movida sem mudar o comportamento. `App.tsx`: rota perfil monta `<Perfil />`; o h1 "Perfil" ficou só para leitores de tela.
- Conteúdo: avatar (iniciais ou ícone) com botão de edição, nome e objetivo editáveis (gravação por `commit`), três números reais ("—" sem registro), cartões Meu objetivo e Meu plano (phaseOf + barra), Preferências (tema Automático/Claro/Escuro, notificações via `src/pwa/notifications.ts`, "Dados neste aparelho" e "Backup e restauração" como seções recolhíveis).
- e2e `tests/e2e/fase1.spec.ts` adaptado às cinco abas (helper `expand` abre as seções recolhíveis).
- Pendência de outro dono: Dieta tem rolagem horizontal em 360 px (`dt-daynav-input`), o que reprova o teste de layout 360 px da Fase 1.
- Capturas: `capturas/perfil-r1`, `r2`, `r3` (+ `-escuro`, e `-dados` com dados sintéticos injetados).
