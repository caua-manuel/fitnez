# Front-end: Evolução com quadril

- Formulário "Registrar medidas": Peso, Cintura, Quadril (chave `q`), Coxa, Braço; validação por `validateMeasurement`.
- Cartão "Medidas": lista só as medidas com dados (Cintura, Quadril, Coxa, Braço), valor atual e chip de variação. Cada linha é um botão (48 px); tocar mostra a mini-série com descrição acessível e tabela equivalente. O tile "Cintura" do topo permanece.
- Estados vazios: sem medidas no período, "Sem medidas registradas neste período."; uma só medida, sem variação inventada.
- Aviso de saúde discreto no fim da tela (inclusive no estado vazio).
- Testes: `tests/e2e/entrega-a-evolucao.spec.ts` (13 casos, dados sintéticos).
- Observação: a porta 4173 do webServer é compartilhada; execuções paralelas de outros agentes derrubaram o preview e causaram falhas de conexão intermitentes.
