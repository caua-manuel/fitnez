# Frontend: "Adicionar à tela de início" nas boas-vindas

- `src/features/assistente/Assistente.tsx`: a tela "Vamos montar seu plano" ganhou `<InstalarApp compact label="Adicionar à tela de início" />` no fim do rodapé, abaixo de "Decidir depois". É um link de texto discreto, sem fundo, com 48 px de altura. Fica escondido quando o app já está instalado (`useInstall` → `installed`).
- O comportamento vem de `InstalarApp`: com `beforeinstallprompt` dispara a instalação nativa; no iPhone abre a folha com os 3 passos (Compartilhar → Adicionar à Tela de Início → Adicionar); nos outros navegadores mostra a explicação genérica. A folha (`ui/Sheet`) cuida do foco e do Escape.
- As regras `ia-*` saíram de `perfil.css` e foram para `src/features/perfil/instalar.css`, importado por `InstalarApp.tsx`, porque o assistente não carrega `perfil.css`. `.ia-link` passou de 44 px para 48 px de altura mínima.
- Os convites do 1º treino (`Concluido.tsx`) e do Perfil não mudaram.
- Testes: `tests/e2e/instalar-inicio.spec.ts` com 3 casos. `adr011-academia` e `assistente-inicio` continuam passando.
- Capturas: `docs/antes-depois/depois/instalar-boas-vindas-{claro,escuro}.png` e `instalar-iphone-{claro,escuro}.png`.

## Botão no fim do Início

- `src/features/inicio/InstalarInicio.tsx`: botão secundário de largura total "Adicionar à tela de início" (contorno, sem fundo, 48 px, ícone `baixar` à esquerda), renderizado em `Inicio.tsx` abaixo da faixa da semana. Mesmo comportamento do `InstalarApp` (instala direto com `beforeinstallprompt`; iPhone abre os 3 passos; outros, a explicação genérica), reaproveitando `InstallSheet`, agora exportado. Some em standalone. Estilo `.in-instalar` em `inicio.css`.
- Sem carregamento sob demanda: `InstalarApp` já está na carga inicial (importado por Perfil, Concluído e Assistente), então `import()` não separaria nada. Carga inicial: 189,3 KB de 205 KB.
- Testes: +3 casos em `tests/e2e/instalar-inicio.spec.ts` (aparece, passos do iPhone, some em standalone).
- Capturas: `docs/antes-depois/depois/instalar-inicio-{claro,escuro}.png`.
