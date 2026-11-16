# Frontend: preparação para publicação

## 1. Primeira abertura guiada
- `src/app/App.tsx`: quando `isStartConfirmed(settings)` é falso e o app abre no Início, aparece `DataInicioSheet` com `firstRun` ("Quando o plano começa?"), uma vez por sessão (marca `treino12:inicio-oferecido` em sessionStorage, limpa por "Apagar tudo"). Não abre durante conflito de migração.
- `DataInicioSheet`: texto curto ("plano de exemplo começa na segunda-feira sugerida"), botões Salvar, "Manter a segunda-feira sugerida" (grava só `startConfirmed = true`) e "Decidir depois". `useSetPlanStart` agora grava `startConfirmed = true` também, para que Salvar com a própria data sugerida confirme (o `save` só confirma quando a data muda).
- Decisão: só abre quando a rota inicial é o Início (abertura normal do app). Quem entra por link direto em outra aba não é interrompido; o banner do Início com data futura segue igual.

## 2. Apagar todos os meus dados
- `src/features/perfil/ApagarDados.tsx`, no fim do Perfil ("Zona de risco", discreta: borda neutra, vermelho só no texto e no ícone do botão).
- Etapa 1: o que será apagado, cache do app não afetado, sem volta, "Baixar backup antes" (reaproveita o backup do Perfil), Continuar, Cancelar. Etapa 2: confirmação final com botão destrutivo (foco inicial em Cancelar).
- Chama `eraseAllData({ expectedRevision })` por `run`; `storageWarnings` aparecem numa terceira etapa com "Recarregar o app"; sem avisos, `hash = ''` e recarrega. Erro do `run` aparece na própria folha.

## 3. Textos (ERRO e PADRÃO de `revisao-textos-ptbr.md`)
Aplicados: toasts sem ponto final; offline ("uso offline"); "Faça um backup dos seus dados" (App, components, Perfil); Perfil (Editar perfil, 10 MB, "Último backup gerado/confirmado", "Já guardei o backup", "Backup confirmado. O lembrete volta em 7 dias.", "baixe e importe"); Início (Marcar jogo como feito, Semana leve (deload), moldura do "Começar o plano", 3ª aula, Descanso); Treino (plural de séries feitas, 4.200 kg, Meta da semana, Plano de 12 semanas, Em andamento, concluir, Pausar cronômetro do treino, "salvos" no lugar de "catálogo", Filtrar treinos, Voltar para Editar treino); Dieta (Tomada neste dia, Ajustes do dia, "g de g").
- Offline no Perfil: o estado agora aparece como subtítulo sempre visível do cartão "Dados neste aparelho"; na rota do Perfil o aviso oculto do App é omitido para não duplicar.
- Fonte de migração: a tela mostra "Protótipo (versão N)" (feito na interface; o `label` em `src/data/index.ts` continua igual ao id).
- Removido `src/features/FoundationPages.tsx` (nada o renderizava) e o `Placeholder` sem uso do App.
- Limites: nome do treino e do exercício usam `NAME_MAX` (120); descrição do treino 160, igual ao validador.
- Testes atualizados: `entrega-a-editor`, `entrega-a-inicio` (3ª aula; o teste "Desmarcar aula" tinha o relógio em fevereiro com dados de novembro, corrigido para 2026-11-12), `entrega-a-treino`, `entrega-a-executar`, `entrega-b-dieta`, `fase1`, `base-ui` (o sino agora espera a escolha da data).

## 4. Metas de exemplo
Dieta: linha "Metas de exemplo, para ajustar ao seu perfil." sob os indicadores. Perfil: mesma frase sob a meta de proteína (lista e formulário). Nenhum número ou regra mudou.

## Divergências e pedidos
- **Escala "como terminou" (Início)**: a tela diz "1 = exausto, 5 = ótimo", mas `docs/ESPECIFICACAO.md` (linha 20) define 1 leve, 2 ok, 3 cansado, 4 muito, 5 destruído, e `src/domain/jiujitsu.ts` (linhas 60-65) penaliza a nota 5. Deixado como está até decisão do dono; a correção é só texto: "(1 = leve, 5 = destruído)".
- **`src/domain/`**: `jiujitsu.ts` linha 89 ("falta aulas, sono": concordância, ERRO) e `exerciseDraft.ts` linha 79 (1800 segundos, PADRÃO) não foram alterados.
- **`src/data/`**: mensagens PADRÃO de `idb.ts` (IndexedDB, "Exporte") e `index.ts` (revisão da prévia; rótulo da fonte igual ao id) não foram alteradas; o rótulo da fonte foi resolvido na interface.

## Testes
`tests/e2e/publicacao.spec.ts` (9 testes): primeira abertura (usuário novo, manter, escolher outra data, salvar a sugerida, decidir depois) e apagar (conteúdo da folha, backup antes, cancelar sem apagar, confirmar volta à primeira abertura).

## Fora do escopo / sem verificar
Sem Safari físico, leitor de tela ou movimento reduzido em aparelho. As capturas rodaram com o service worker bloqueado, então mostram "Uso offline indisponível".
