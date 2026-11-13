# Frontend Dieta: refino final

- Meta por peso: `useDietDay` usa `dayTargetForProfile(tipo, settings.profile)`; anel, barras e cartões seguem a meta (80 kg: 192 g; sem perfil: 185 g). Testes e2e novos em `tests/e2e/entrega-b-dieta.spec.ts`.
- Ícone de Pós-treino: vem de `MEAL_ICON` em `src/ui/Thumb.tsx` (`pos: 'agua'`, gota). Pedido ao dono de `src/ui`: trocar por ícone de shake/proteína.
- Tema escuro: capturas de Dieta, refeição, gerenciar e dia futuro conferidas; sem problemas de legibilidade encontrados, nenhum CSS alterado.
- Dia futuro: tela abre sem erro, com 0 kcal e meta do tipo de dia.
- Pendência de ambiente: execuções paralelas do Playwright de outros agentes causam falhas intermitentes (ENOENT em test-results); os testes passam isolados.
