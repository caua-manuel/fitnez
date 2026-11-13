# Frontend, Entrega A, Tarefa 10: Treino (plano, biblioteca e detalhe)

- Criados em `src/features/treino/`: `Treino.tsx` (controle Meu plano/Biblioteca e roteamento das views), `Biblioteca.tsx`, `Detalhe.tsx`, `util.ts` (datas locais, estado do dia, tipo superior/inferior via `muscleGroupOf` + `isLower`), `treino.css`.
- `App.tsx`: apenas importa e renderiza `<Treino route={route} />` na aba treino.
- Rotas `executar`, `concluido` e `editar` mostram o marcador "Esta tela chega na próxima etapa." (Tarefas 11 e 12); links gerados por `hrefFor`.
- Sugestão (`suggestNext`) só aparece com histórico, rotulada "Sugestão", nunca preenche carga; o menu de três pontos tem "Editar exercício" (rota `editar`) e "Ver histórico do treino".
- Sem gravação nesta tarefa (somente leitura), portanto nenhum `commit` foi necessário.
- Teste: `tests/e2e/entrega-a-treino.spec.ts` (8 testes, 360x800, fixtures sintéticas importadas como backup v3 pela tela Perfil atual).
- Dependência: o e2e usa `#backup-file` e "Confirmar importação" do `More.tsx`; se a Tarefa 14 mudar esses seletores, ajustar `seed()`.
