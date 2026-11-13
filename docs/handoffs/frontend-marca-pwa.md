# Frontend: marca Fitnez no PWA

- Ícones regenerados do SVG de `src/ui/Logo.tsx` (só o símbolo) com Playwright: `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (símbolo a 60%, margem de segurança) e `apple-touch-icon.png` (180). Fundo branco, halter azul `#0A58F0` e folha verde; o azul sobre branco ficou melhor que branco sobre azul porque preserva a folha verde.
- Manifesto (`src/pwa/build.ts`, só nome e cores): name e short_name "Fitnez", description em português, orientation portrait, background `#FFFFFF`, theme `#0A58F0`.
- `index.html`: título "Fitnez", description e dois `theme-color` (claro `#0A58F0`, escuro `#0B1220`).
- `README.md` reescrito e `DESIGN.md` sincronizado com `tokens.ts` e `styles.css`.
- Pendência para devops: o prefixo de cache em `build.ts` ainda é `treino12:` e o plugin se chama `treino12-pwa-nativa` (interno, não visível).
