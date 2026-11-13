# Frontend: Entrega A, Tarefa 9 (Início)

- Criado `src/features/inicio/Inicio.tsx` (relógio injetável `now`, padrão Date.now; toda gravação via `commit`). `App.tsx` só importa e renderiza `<Inicio />` na rota inicio. Estilos do Início ao fim de `src/ui/styles.css`.
- Cobre: saudação, Semana NN de 12, bloco/RIR/deload, anel, cartão por Activity (gym, bjj com nota 1 a 5, vôlei, descanso com checklist), Trocar treino de hoje (`over`), Registrar outro dia, aviso de backup, pré-semana, plano concluído, atalhos.
- Links para o treino: `hrefFor` (`#treino/<id>/executar?dia=...`, `#treino/<id>/concluido`). Nenhum arquivo de `src/features/treino/` tocado.
- Teste: `tests/e2e/entrega-a-inicio.spec.ts` (5 testes, 360x800, dados sintéticos, relógio fixado por `page.clock`).
- Pendência de revisão UX: Trocar treino é painel inline, não folha modal.
