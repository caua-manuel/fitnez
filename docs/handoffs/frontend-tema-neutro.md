# Frontend: tema neutro (sem azul de fundo)

Troca de todos os fundos, superfícies, bordas e cinzas azulados por neutros em `src/ui/tokens.ts`, `src/ui/styles.css`, `src/ui/illustrations.css`/`.tsx`, `src/features/treino/treino.css`, `tests/unit/tokens.test.ts`, `DESIGN.md` e `index.html`.

- Escuro: página `#0B0B0C` (novo `--page`), app `#121214`, cartão `#19191C`, superfície `#202024`, borda `#2C2C31`, texto `#F2F2F3`, auxiliar `#A1A1AA`, campo `#7A7A83`, selo suave `#26262B`, trilha `#2C2C31`.
- Claro: página `#F4F4F5`, superfície `#F7F7F8`, borda `#E6E6E8`, texto `#111113`, auxiliar `#5E5E66`, campo `#767680`, selo suave `#EFEFF1`, trilha `#E8E8EA`.
- Azul da marca (`#0A58F0` / `#6C9BFF`) só em ação, item ativo, progresso, link e foco. Manifesto mantido (branco e azul da marca); `theme-color` escuro `#0E0E10`.
- Ilustrações e tiles neutralizados (fundo, corpo, banco, chão, metal). Sombras agora pretas neutras.
- Verificado: capturas 390 px e 1280x800 em claro e escuro; testes, typecheck e Playwright passam.
