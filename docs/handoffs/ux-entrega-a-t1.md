# Handoff ux_acessibilidade — Entrega A, Tarefa 1 (design)

Mudou: `DESIGN.md` reescrito como sistema visual do Fitnez (5 abas, azul vivo, cartões 20px, segmentado, anel, gráficos SVG, tema escuro simétrico, estados, timer, movimento, WCAG AA). Nada em `src/` foi tocado.

Para o frontend (copiar literalmente): tabela da seção 2 de `DESIGN.md` (17 tokens, claro e escuro). Primário `#0A58F0` (claro) e `#6C9BFF` (escuro).

Contrastes calculados à mão (sem ferramenta de execução disponível; o teste `tokens.test.ts` deve confirmar): foreground/card 17,80 e 15,43; muted-foreground/card 6,46 e 8,21; primary-foreground/primary 5,73 e 6,92; input/secondary 3,83 e 4,69. Todos acima de 4,5 (texto) e 3 (borda de campo). Se o teste calcular valor abaixo do mínimo, corrigir o token e o DESIGN.md juntos.

Decisões que o dono pode vetar: (1) sem fotos de comida e atletas, só ícones; (2) fonte condensada só na marca e em números grandes, títulos em Figtree 800; (3) botões "Salvar/Registrar" soltos das telas não existem (salvamento automático); (4) `border` é decorativo (1,28 e 1,47), campos usam `input`.
