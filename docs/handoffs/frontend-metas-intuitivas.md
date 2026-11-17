# Front-end: folha de metas intuitiva

A folha "Ajustar metas" (Dieta e Perfil > Metas de dieta) foi refeita para ser entendida por quem não sabe o que é macro. Nenhuma regra, limite ou número mudou; `src/domain`, `src/data`, `src/application` e `data/` não foram tocados. A validação, os avisos, as versões, "Restaurar padrão" e "Desfazer" continuam vindo de `dietTargets.ts` e `metasActions.ts`.

## Estrutura nova da folha (`src/features/dieta/MetasSheet.tsx`, `metas.css`)

1. Título "Suas metas diárias" e uma frase: quanto você pretende comer e beber por dia, que calorias e carboidrato mudam com o tipo de dia e, se for meta de exemplo, que os valores atuais são um exemplo para ajustar. Discreto: "Valores de exemplo, ainda não confirmados".
2. Quadro "Em vigor hoje" com o tipo do dia atual: calorias (e carboidrato), proteína ("pelo seu peso" ou "definida por você"), gordura e água (com copos).
3. "Valem para todos os dias": proteína (chave "Proteína: calcular pelo peso" com a explicação), gordura e água, cada uma com ajuda curta. Fica antes dos tipos de dia porque a conferência de cada tipo depende da proteína e da gordura.
4. "Calorias e carboidratos por tipo de dia": cinco blocos recolhíveis (botão com `aria-expanded` e `aria-controls`; região `role="group"` nomeada). Cada cabeçalho mostra nome, contexto ("Dias de treino de perna", "Dias dos outros treinos de academia", "Dias de aula de jiu-jitsu", "Dias de vôlei", "Dias sem treino", conforme a tabela "Tipo de dia" da especificação), os valores atuais e a marca "Hoje". Só o tipo do dia de hoje abre aberto. Ao salvar com erro, os blocos com erro abrem e o foco vai ao primeiro campo inválido.
5. Campos "Calorias do dia" e "Carboidratos do dia", com ajuda ligada por `aria-describedby`.
6. Conferência por bloco: "Seus macros (proteína, carboidrato e gordura) somam X kcal; as calorias do dia são Y. Está batendo." ou "... Não está batendo: faltam/sobram N kcal. Você ainda pode salvar." (neutra, ícone de aviso, nunca vermelha). O critério é a tolerância de `macroTolerance`. O aviso `macros-incoerentes` do domínio deixou de ser exibido porque esta frase diz o mesmo; os demais avisos de saúde continuam e não bloqueiam.
7. "Completar o carboidrato" (antes "Calcular pelo que sobra"): ajuda "Preenche o carboidrato com as calorias que sobram depois da proteína e da gordura. Agora: A g. Completando: B g." (antes e depois, ao vivo), e depois do toque "Carboidrato: de A g para B g." com botão "Desfazer" local (também anunciado por `role="status"`).
8. Aviso de saúde curto (duas linhas) no fim, com "Saiba mais"/"Mostrar menos" que expande o texto completo da especificação (`aria-expanded`).
9. Barra fixa: "Cancelar" e "Salvar metas". "Restaurar padrão" segue fora do exemplo.

O foco inicial vai ao parágrafo de abertura (`tabIndex=-1`), para o leitor de tela ler o propósito antes dos campos.

## Testes

`tests/e2e/metas-dieta.spec.ts` atualizado para os novos rótulos e estrutura (11 testes, nenhuma verificação afrouxada): o helper abre os cinco blocos; o teste de coerência usa a nova frase; o de "Completar" confere antes/depois, conferência batendo e Desfazer. Novos: abertura com propósito, resumo, só o dia de hoje aberto, aviso curto que expande, e erro em bloco recolhido (abre e foca). O texto exato do aviso `macros-incoerentes` deixou de ser verificado porque a tela agora mostra a frase equivalente da conferência.

## Capturas (fora do versionamento)

`capturas/metas-intuitivas/` (390 px, claro e escuro; `shoot.mjs` gera de novo com um preview em 4192): topo, "todos os dias", bloco aberto, conferência divergindo, antes/depois, batendo, aviso curto, aviso expandido e blocos recolhidos. Sem rolagem horizontal (largura 390 na página e na folha).

## Lacunas

- Sem teste em leitor de tela nem em aparelho físico.
- A frase da conferência não é região viva (anunciar a cada tecla seria ruidoso); fica ligada ao campo por `aria-describedby`.
- "Proteína: ajuda a manter e ganhar músculo" e "Dias mais puxados pedem mais carboidrato, que é a energia do treino" são explicações gerais minhas, não da especificação; vale o `conteudo-treino-nutricao` conferir.
- O quadro "Em vigor hoje" mostra as metas salvas, não o que está sendo digitado.

## Ajustes da revisão de conteúdo (conteudo-revisao-metas-intuitivas.md)

Aplicados os cinco ajustes e os dois opcionais, só em texto: ajuda da proteína ("Gramas por dia."), subtítulo dos tipos de dia ("No plano de exemplo, ..."), conferência sem "macros" ("Proteína, carboidrato e gordura somam cerca de X kcal; as calorias do dia são Y kcal. A diferença é pequena." ou "A soma está N kcal abaixo|acima das calorias do dia. Você ainda pode salvar."), nota "O carboidrato já era N g.", aviso de saúde compacto com "Saiba mais", frase "Dias que já passaram mantêm a meta que valia neles." na abertura e "Dias de outros treinos de academia". Aviso compacto registrado na ADR 007. As frases "Proteína: ajuda a manter e ganhar músculo" e "Dias mais puxados..." citadas em Lacunas acima foram substituídas.
