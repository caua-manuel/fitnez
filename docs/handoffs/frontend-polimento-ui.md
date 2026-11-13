# Polimento da base visual (UI)

- Thumb: ícone da refeição pelo prefixo do id (`almoco-a` usa `almoco`); tom do tile por opção A/B/C (`thumb-opt-a|b|c`); exercício usa id, depois grupo, depois ícone padrão; traço 1.6.
- Fotos: o Thumb só pede imagem para ids listados em `src/ui/photos.ts`. Para adicionar uma foto, coloque o arquivo em `public/img/<kind>/<id>.jpg` (ou `.webp`) e inclua o id no conjunto do kind. Sem id no manifesto, tile direto e nenhuma requisição.
- Campos: borda `--input` `#76849B` claro (3,79:1 sobre branco, 3,59:1 sobre `#F7F9FC`) e `#7D90B8` escuro; `#8A96AB` foi reprovado (2,99:1). `--field-border` agora espelha `--input`.
- Muted claro `#64748B` falhava sobre `#F3F5F9` (4,36:1); passou a `#5F6F86` (4,69:1). Escuro já passava.
- Pendência: `src/features/inicio/inicio.css:46` (`grayscale` no tile hero) continua necessário, pois o hero ainda usa `--primary` azul; fora do meu escopo.
