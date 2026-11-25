# 016. Ilustrações dos exercícios

Data: 25/11/2026. Status: implementado.

## Contexto

A folha **Como fazer** mostra os passos e o erro comum já presentes no guia, junto com imagens que podem ser abertas durante o treino.

## Decisões

- As ilustrações foram geradas por IA. Cada quadro é um WebP de 1024 × 1024, com limite de 60 KB, em `public/img/exercise/<id>-<quadro>.webp`. Em geral são dois quadros por exercício. `ytw` tem três. `pescoco` e `prancha` têm um.
- Os exercícios `hip_b`, `salto_b` e `copen_b` usam as imagens de `hip_l`, `salto_l` e `copen_l`, respectivamente. Cada ID mantém os seus passos e o seu erro comum.
- A folha é carregada sob demanda. Os WebP ficam fora do precache inicial e entram no cache na primeira visualização. O cache de ilustrações tem limite de 40 quadros.
- A preparação em segundo plano pede imagens da mesma origem, só dos exercícios do plano. Ela roda sem bloquear a interface e é pulada se o navegador informar economia de dados, conexão 2G ou 3G, ou estiver offline.
- Com movimento reduzido, os quadros aparecem lado a lado. Nos outros casos, os quadros alternam e podem ser pausados.
- Os GIFs são usados só no README. `rosca_elastico` e `lat_elastico` ainda usam o ícone de exercício. O mesmo ícone aparece se algum quadro falhar.

## Verificação

Os testes conferem a cobertura do catálogo, o peso dos WebP, a folha e a preparação offline. O roteiro manual fica no [Guia de teste](../GUIA-DE-TESTE.md#como-fazer-ilustrações).
