# Frontend: reset visual global (premium minimalista)

## Diferenças encontradas (antes do reset) entre o app e as referências tela-1 a tela-8

| Item | Implementado antes | Referência |
| --- | --- | --- |
| Botão principal | Pílula total (999px), sombra azul brilhando, 56px | Retângulo de cantos ~14px, sem brilho, ~52px |
| Botão secundário | Texto e borda azuis | Neutro: borda cinza clara, texto quase preto |
| Segmentado | Pílula grande, ativo azul com sombra azul | Trilha cinza muito clara, raio 12, ativo azul sólido raio 10, sem sombra |
| Chips | Borda 1,5px, sombra, ativo com brilho azul | Cinza #F3F5F9, ativo azul sólido, sem sombra |
| Títulos | Peso 800 | ~700, espaçamento limpo |
| Barra inferior | Flutuante, arredondada, sombra (no computador) | Plana, largura total, linha fina no topo, ativo azul com traço curto |
| Cartões | Raio 20px, sombra 14px de blur, bordas fortes | Branco, borda 1px #E6EAF2, raio 16px, sombra quase invisível |
| Campos | Fundo azulado, borda 1,5px escura | Altura 48px, borda 1px #D5DBE7, foco azul 2px |
| Azul | Em títulos, bordas, rótulos, trilhas | Só em ação principal, item ativo, progresso, números selecionados |
| Ilustrações | Manequim e pratos em desenho animado | Fotos reais ou tiles discretos |
| Computador | Coluna de 30rem solta num branco enorme | (não coberto) Agora: folha de 430px sobre fundo #F3F5F9 |
| Trilha de anel/barras | #F0F4FA quase invisível | Cinza azulado visível (#E8EDF5) |

## O que foi feito

- `src/ui/styles.css`: tokens novos (`--radius-card` 16, `--radius-control` 12, `--radius-button` 14, `--radius-sheet` 24, `--shadow-card`, `--shadow-none`, `--shadow-blue: none`, `--border-hairline`, `--surface`, `--surface-2`, `--field-border`, `--track`, `--fw-*`, `--sheet-width`); componentes `.button`, `.segmented`, `.card`, `.badge`, `.chip`, `.list-row`, campos, `.tabbar`, `.sheet` redefinidos; mesmos nomes de classe. Bloco final com prefixo `body` corrige peso/raio de classes das áreas (`in-*`, `tr-*`, `dt-*`, `perfil-*`) que carregam CSS depois.
- Computador (a partir de 768px): `#root` vira folha de 430px, fundo da página #F3F5F9, borda 1px, sombra suave, cantos 24px; barra inferior contida na folha.
- `src/ui/tokens.ts`: paleta nova (texto #0F172A / #64748B, superfície #F7F9FC, borda #E6EAF2) e export `scale`. `tests/unit/tokens.test.ts` ganhou verificações da direção visual.
- Ícones: traço padrão 1,6 (barra inferior 1,6 e 1,9 no ativo).
- `src/ui/Thumb.tsx`: `Thumb({ kind: 'meal'|'exercise'|'hero', id?, group?, size?, label? })`.
- `scripts/capturas-desktop.cjs`: capturas em 1280x800.

## Como trocar o tile por fotos reais

Coloque os arquivos em `public/img/<tipo>/<id>.jpg` (ou `.webp`):

- `public/img/meal/cafe.jpg`, `almoco`, `lanche`, `pos`, `jantar`
- `public/img/exercise/<id do exercício>.jpg`
- `public/img/hero/<id do treino>.jpg`

O componente tenta `.jpg`, depois `.webp`; sem arquivo, mostra o tile minimalista. Depois de adicionar as fotos, o precache do service worker precisa ser regenerado (rodar `npm run build`).

## Pedidos para as áreas (não toquei em `src/features/*`)

- Trocar `MuscleIllustration`, `ExerciseIllustration`, `MealIllustration` e `HeroIllustration` por `Thumb`.
- Remover pesos 800 e raios 20px/999px hardcoded nos CSS das áreas e usar os tokens; depois apagar o bloco de ajustes `body ...` no fim de styles.css.
- Campos numéricos de série (treino) ainda mostram borda mais escura que a referência.

## Diferenças que ainda restam

- Manequim/pratos cartoon continuam nas telas até as áreas adotarem `Thumb`.
- Borda de campo #D5DBE7 tem contraste baixo (< 3:1) por exigência da referência; mitigado por fundo cinza e foco azul 2px.
- Faixa lateral azul dos cartões do plano e alguns tamanhos de fonte seguem do CSS das áreas.

## Verificação

`npm.cmd run build`, Vitest (168) e Playwright (59) passando. Quatro rodadas de capturas em 390x844 e 1280x800 (claro e escuro) comparadas com as referências.
