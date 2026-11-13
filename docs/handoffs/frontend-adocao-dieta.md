# Frontend: adoção da direção visual na Dieta

- `MealIllustration` (pratos cartoon) trocado por `Thumb kind="meal"` em lista de refeições (id = refeição), cartões de opção e gerenciar (id = `<refeição>-<opção>`, ex.: `almoco-a`). Fotos: `public/img/meal/<id>.jpg`.
- Anel de calorias com traço de 8 px (só o número em 800), barras de macro com 4 px, copos de água em traço fino, cartões hairline de 16 px, botões retangulares sem brilho, secundários neutros.
- Cartão de opção selecionado: borda azul de 1,5 px e fundo azul muito claro; "Opção N" virou texto cinza (sem pílula); barra fixa "Marcar como consumido" plana, com linha fina no topo.
- Títulos 700, mais respiro entre seções. Formulário e folha seguem os campos novos (borda 1 px, foco azul 2 px).

## Pendências
- Sem foto, o `Thumb` mostra o mesmo ícone de talher para opções (`MEAL_ICON` só conhece ids de refeição). Pedido a `src/ui`: aceitar prefixo da refeição (`almoco-a` usar o ícone de `almoco`).
- Nenhuma foto de refeição existe em `public/img/meal/` ainda.
- Capturas feitas no relógio falso (o aviso offline é artefato).
