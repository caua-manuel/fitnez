# Front-end: assistente de início (ADR 008)

Data: 19/11/2026. Responsável: agente `frontend`. Arquivos em `src/features`, `src/app` e `tests/e2e`; nada em `src/domain` nem em `src/application`.

## Entregue
- `src/features/assistente/` (`Assistente.tsx`, `store.ts`, `assistente.css`) abre em tela cheia (`role=dialog`, sem cabeçalho nem barra inferior). Telas: boas-vindas (Montar meu plano / Usar o plano de exemplo / Decidir depois), 9 passos ("Passo k de N", Voltar, Pular nos opcionais 7 e 8, Continuar fixo embaixo), resumo "Seu plano" com Alterar por bloco (Treinos, Semana tipo, Dieta), avisos de segurança, aviso de dor e aviso fixo. Para confirmar, chama `applyOnboarding`. O toast "Plano pronto. Bom treino." tem Desfazer (`undoOnboarding`).
- Os radios e checkboxes são nativos, dentro de `fieldset`. O foco vai para o h1 a cada tela. Enter avança, Escape volta. Nada vem marcado no passo de segurança.
- O assistente abre na primeira abertura (data não confirmada, uma vez por sessão), no lugar da antiga folha `DataInicioSheet firstRun`. A outra entrada é Perfil > "Refazer meu plano", que vem preenchido com `answersFromStored`; os passos 0 e 7 voltam vazios. Em Perfil também há "Voltar ao plano anterior" enquanto `canUndoOnboarding` for verdadeiro.
- No plano de exemplo, a data de início é escolhida com "Nesta segunda" (padrão, igual ao antigo "Manter a segunda sugerida"), "Na próxima segunda" ou "Outra data".
- Esporte: Treino (rótulo e ícone), cartão do Início com "Marcar como feito" (grava `acts.esporte`), faixa da semana e tipo de dia na Dieta ("Dia de esporte"). Em MetasSheet, a linha Esporte aparece quando a rotina tem esse tipo de dia; sem meta própria, parte da meta do vôlei.
- RIR: todas as chamadas a `phaseOf` recebem `rirSequence(plan)`.
- Dieta: com `hideDietNumbers`, o anel, os macros, a meta e as kcal da lista ficam ocultos; o Início mostra só as refeições. Com `dietTargetsDisabled`, aparece a meta de exemplo com aviso, sem "Usar esta meta".
- Semana cheia: o aviso diz que os 2 treinos curtos ficam em Treinos, fora da rotina.

## Pendências e limitações
- Pedido ao `backend_dados`: o tipo `Plan` em `repository.ts` não tem `rir`. Por isso usei `plan as { rir?: unknown }` nas chamadas.
- Não há histórico do navegador por passo. O botão Voltar do sistema não volta um passo, e o rascunho não fica guardado ao fechar o app; guardá-lo exigiria gravar as marcações de saúde. Também não há cartão de retomada.
- Com `hideDietNumbers`, as kcal das opções ainda aparecem dentro da tela de cada refeição.
- Capturas em `capturas/assistente-*` (390 px, claro e escuro).
