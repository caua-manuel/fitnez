# Fotos provisórias (frontend)

**Origem.** Recortes das telas de referência do dono (`docs/referencia-visual/tela-3`, `tela-5`, `tela-6`, `tela-7`, `tela-8`), usados como fotos provisórias. Resolução limitada (as referências são pequenas; os recortes foram ampliados com interpolação bicúbica e ficam levemente suaves). Foto de perfil da tela-2 não foi usada.

**Arquivos** (JPEG qualidade 90, todos abaixo de 20 KB; registrados em `src/ui/photos.ts`):

| Tipo | Id | Origem |
|---|---|---|
| meal | `cafe`, `almoco`, `lanche`, `jantar` | tela-3 (lista de refeições) |
| meal | `cafe-A` (Ovos, pão e leite) | tela-5, detalhe do café da manhã |
| meal | `almoco-A` (Arroz, feijão e frango) | tela-8, opção 1 |
| exercise | `inclinado` (Supino inclinado com halteres) | tela-6 |
| hero | `UA`, `UB` | tela-7, braço do cartão "Treino de hoje" (mesma imagem) |

Ficaram sem foto, de propósito, para não mostrar comida ou aparelho errado: almoco-B e almoco-C (macarrão com carne; bife com batata-doce), `supino` (o catálogo usa halteres; a referência mostra barra), demais opções, `pos` e demais exercícios.

**Como trocar.** Substitua o arquivo em `public/img/<meal|exercise|hero>/<id>.jpg` mantendo o nome (proporção 4:3 para refeição, 1:1 para exercício, 4:3 para hero; abaixo de 150 KB). Para um id novo, coloque o arquivo e inclua o id em `src/ui/photos.ts` (e, para hero, em `HERO_PHOTOS` em `src/features/inicio/Inicio.tsx`).

**Offline.** `src/pwa/build.ts` já inclui tudo o que está em `dist/` no precache; em `scripts/verify-build.ts` só foi liberado o padrão `img/(meal|exercise|hero)/<id>.jpg` na lista de arquivos permitidos.
