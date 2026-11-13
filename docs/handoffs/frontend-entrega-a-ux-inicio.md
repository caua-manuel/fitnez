# Frontend Entrega A: correções de UX do Início e da casca

Itens aplicados (ver `ux-entrega-a-revisao-inicio-treino.md`): 1, 2, 3, 4, 5, 6 (só Início), 8, 9 e 10 (só Início), 11 (só casca).

- Início: h1 visualmente oculto; saudação e "Semana NN de 12" no topo; aviso de backup depois dos atalhos; segmentado Treino/Dieta como `nav` com `aria-current`, ativo em azul; "Trocar treino" e "Registrar outro dia" lado a lado; opção trocada mostra marca e "Selecionado"; nota 1 a 5 com contorno no ativo; campo de data estilizado, rótulo "Dia do registro"; anel 104 px com `role="progressbar"`; atalhos com quadro de ícone e seta; minutos com relógio.
- Casca: faixa de status do topo removida. "Salvo neste aparelho" aparece discreto por 3 s ao fim do salvamento, no fim do `main` (região `role="status"` permanente, oculta fora disso). Texto de offline fica numa região oculta.
- Ícones novos em `src/ui/icons.tsx`: `editar`, `relogio`, `seta`, `marca`.
- Desvio: `.hero-title` ficou em 1.5rem (1.75rem quebrava a linha em 360 px ao lado do anel).
- `sess.min` do plano já traz a unidade ("70 a 80 min"); só se acrescenta " min" quando falta.

Pedidos a outros donos
- `src/features/More.tsx`: o texto "quando o aviso no topo indicar Disponível offline" ficou obsoleto; mostrar o estado de offline em "Dados neste aparelho".
- Treino (item 6 etiquetas, 7, 11 busca/abas, 12): pendentes com o agente de Treino.
