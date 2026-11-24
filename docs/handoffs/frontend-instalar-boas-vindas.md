# Frontend: "Adicionar à tela de início" nas boas-vindas

- `src/features/assistente/Assistente.tsx`: a tela "Vamos montar seu plano" ganhou `<InstalarApp compact label="Adicionar à tela de início" />` no fim do rodapé, abaixo de "Decidir depois". É um link de texto discreto, sem fundo, com 48 px de altura. Fica escondido quando o app já está instalado (`useInstall` → `installed`).
- O comportamento vem de `InstalarApp`: com `beforeinstallprompt` dispara a instalação nativa; no iPhone abre a folha com os 3 passos (Compartilhar → Adicionar à Tela de Início → Adicionar); nos outros navegadores mostra a explicação genérica. A folha (`ui/Sheet`) cuida do foco e do Escape.
- As regras `ia-*` saíram de `perfil.css` e foram para `src/features/perfil/instalar.css`, importado por `InstalarApp.tsx`, porque o assistente não carrega `perfil.css`. `.ia-link` passou de 44 px para 48 px de altura mínima.
- Os convites do 1º treino (`Concluido.tsx`) e do Perfil não mudaram.
- Testes: `tests/e2e/instalar-inicio.spec.ts` com 3 casos. `adr011-academia` e `assistente-inicio` continuam passando.
- Capturas: `docs/antes-depois/depois/instalar-boas-vindas-{claro,escuro}.png` e `instalar-iphone-{claro,escuro}.png`.
