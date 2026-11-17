# Revisão de conteúdo: folha "Suas metas diárias" (metas intuitivas)

Data: 16/11/2026. Responsável: agente `conteudo-treino-nutricao`. Revisão somente de texto, em modo de leitura: nenhum arquivo de `src/` ou de testes foi alterado. Destinatário: `frontend`.

Arquivos lidos: `src/features/dieta/MetasSheet.tsx`, `src/features/dieta/MetaDieta.tsx`, `src/domain/dietTargets.ts` (fatores, tolerância e avisos), `src/domain/diet.ts`, `src/domain/dayActivity.ts`, a seção 7 de `conteudo-metas-editaveis.md` e a tabela "Tipo de dia" de `docs/ESPECIFICACAO.md`. Glossário seguido: `revisao-textos-ptbr.md` (kcal, g, L com espaço e vírgula decimal; "macros" evitado; aviso rápido sem ponto final).

## Resultado

33 itens revisados: 28 aprovados e 5 a ajustar. Nenhum número do plano muda.

Conferências feitas:

- **Fatores 4/4/9:** `kcalFromMacros` usa 4 x proteína + 4 x carboidrato + 9 x gordura e a tolerância é `max(100, 5%)`. Bate com a seção 1.3 da especificação. O cálculo da frase está certo. O que falta é dizer "cerca de", porque 4/4/9 é simplificação (a verificar: tabelas de composição e rótulos diferem em fibra, álcool e arredondamento).
- **Tipos de dia:** os cinco contextos batem com a coluna "Quando" da tabela da especificação e com `dayTypeOf` (jiu-jitsu e vôlei vêm da atividade do dia; perna é treino cujo nome tem "lower" ou "perna"; os outros treinos de academia são "academia"; sem atividade é descanso). Os números iniciais (2.600/340, 2.450/305, 2.500/315, 2.500/315, 2.100/215) não aparecem hardcoded na folha: vêm de `dietTargets`.
- **Avisos de faixa (kcal, proteína, gordura, água):** vêm do domínio e são idênticos à seção 7.4 da especificação. Mantêm a recomendação de procurar profissional e não afirmam motivo científico.
- **Sem promessa de resultado:** nenhum texto garante perda de gordura, ganho de músculo ou efeito na saúde. Os dois pontos que se aproximam disso são os itens 9 e 13.

## Tabela de textos

Legenda: A = aprovado; AJ = ajustar.

| # | Texto atual | Veredito | Texto proposto | Motivo |
| --- | --- | --- | --- | --- |
| 1 | `Suas metas diárias` (título da folha) | A | sem mudança | Claro. A especificação sugeria "Metas de dieta"; o título atual funciona, desde que a linha do Perfil e o aria-label de `MetaDieta` sigam chamando de "Metas de dieta". |
| 2 | `Aqui você define quanto pretende comer e beber por dia. As calorias e o carboidrato mudam conforme o tipo de dia: treino de perna, jiu-jitsu, descanso e assim por diante.` | A | sem mudança | Descreve o que a tela faz, sem prometer nada. Sugestão opcional: acrescentar "Dias que já passaram mantêm a meta que valia neles." (frase da seção 7.3 da especificação), porque evita a dúvida "isso muda meu histórico?". Hoje só a confirmação de restaurar diz isso. |
| 3 | `Os valores atuais são um exemplo: ajuste ao seu caso.` | A | sem mudança | Deixa claro que o número não é recomendação individual. |
| 4 | `Valores de exemplo, ainda não confirmados` | A | sem mudança | Alinhado à ideia de "Meta de exemplo". |
| 5 | `Em vigor hoje` e subtítulo `Dia de perna` (e equivalentes) | A | sem mudança | Texto de estado, sem orientação. |
| 6 | `pelo seu peso`, `definida por você`, `{n} copos` (notas do resumo) | A | sem mudança | `Math.round(waterL * 2)` equivale a `waterCups` (500 ml por copo). |
| 7 | `Valem para todos os dias` e `Estes três não mudam com o tipo de dia.` | A | sem mudança | Correto: proteína, gordura e água são globais na especificação. |
| 8 | `Proteína: calcular pelo peso`, `Proteína calculada pelo seu peso: 2,4 g por kg, ou {n} g por dia.`, `Proteína calculada pelo seu peso. Informe o peso em Perfil; até lá, usamos 185 g.`, `Desligado: você define a proteína em gramas.` | A | sem mudança | 2,4 g/kg é o valor do plano de exemplo e aparece como cálculo do app, não como recomendação. Coerente com a seção 1.2 da especificação. |
| 9 | `Gramas por dia. Ajuda a manter e ganhar músculo.` | AJ | `Gramas por dia.` (opcional, para quem quiser explicar: `Gramas por dia. Junto com o treino, a proteína faz parte da manutenção e da construção do músculo.`) | A ideia geral é amplamente aceita (a verificar: posicionamentos de sociedades de nutrição esportiva), mas "ajuda a ganhar músculo" lido sozinho soa como promessa de resultado, e logo abaixo de um campo que o usuário pode zerar ou aumentar. Não é errada nem perigosa; só foge do tom neutro das outras ajudas. Para manter coerência com as ajudas de gordura e água (só dizem a unidade), a versão curta é a recomendada. |
| 10 | `Gramas por dia. Entra na conta das calorias.` (gordura) | A | sem mudança | Verdadeiro (a gordura tem calorias e entra na soma 4/4/9) e sem promessa. |
| 11 | `Litros por dia, de 0,5 em 0,5. Cada copo do registro tem 500 ml.` | A | sem mudança | Bate com a seção 7.3 e com `waterCups`. |
| 12 | `Calorias e carboidratos por tipo de dia` | A | sem mudança | Plural é natural em português e o Início já usa "Carboidratos". A especificação usava o singular; não precisa mudar. |
| 13 | `Dias mais puxados pedem mais carboidrato, que é a energia do treino. Toque em um tipo de dia para ajustar.` | AJ | `No plano de exemplo, dias de treino mais pesado têm mais carboidrato, uma das fontes de energia do treino. Toque em um tipo de dia para ajustar.` | A ideia é correta em linhas gerais (a verificar: orientações de nutrição esportiva sobre carboidrato por volume de treino). Dois problemas de redação: (a) "pedem" soa como regra para o usuário, quando é uma escolha do plano de exemplo, e o usuário pode editar; (b) "a energia do treino" sugere fonte única, mas gordura e proteína também fornecem energia. A versão proposta descreve o plano de exemplo e usa "uma das fontes". Também confere com a tabela real: perna 340 g > jiu-jitsu e vôlei 315 g > academia 305 g > descanso 215 g. |
| 14 | `Dias de treino de perna` (perna) | A | sem mudança | Bate com "Treino cujo nome contém 'Lower' ou 'perna'". |
| 15 | `Dias dos outros treinos de academia` (academia) | A | sem mudança | Bate com "Outros treinos de academia". Opcional: `Dias de outros treinos de academia` (preposição mais natural). |
| 16 | `Dias de aula de jiu-jitsu` | A | sem mudança | Bate com "Dia de aula". |
| 17 | `Dias de vôlei` | A | sem mudança | Bate com "Dia de vôlei". Observação: se o usuário troca o jogo pelo treino alternativo (Lower B), `dayTypeOf` mantém o tipo vôlei; o contexto continua correto. |
| 18 | `Dias sem treino` (descanso) | A | sem mudança | Bate com "Sem treino". |
| 19 | `Quanto você quer comer nesse tipo de dia, em kcal.` | A | sem mudança | Neutro. |
| 20 | `Em gramas, nesse tipo de dia.` | A | sem mudança | Neutro. |
| 21 | `Seus macros (proteína, carboidrato e gordura) somam {sum} kcal; as calorias do dia são {kcal}. Está batendo.` e `Não está batendo: faltam|sobram {n} kcal. Você ainda pode salvar.` | AJ | Se bate: `Proteína, carboidrato e gordura somam cerca de {sum} kcal; as calorias do dia são {kcal} kcal. A diferença é pequena.` Se não bate: `Proteína, carboidrato e gordura somam cerca de {sum} kcal; as calorias do dia são {kcal} kcal. A soma está {n} kcal abaixo|acima das calorias do dia. Você ainda pode salvar.` | Três ajustes. (1) Os fatores 4/4/9 estão aplicados corretamente, mas é uma estimativa: falta "cerca de", como já fazem o aviso do domínio e a seção 7.4. (2) "macros" é jargão que o glossário manda evitar; o parêntese ajuda, mas basta o nome completo. (3) "faltam/sobram" não diz o que falta ou sobra (as calorias dos nutrientes ou as do dia?). `diff = soma - kcal`: negativo significa que a soma dos nutrientes está abaixo das calorias do dia; "abaixo|acima" é inequívoco. "Está batendo" é informal e pode passar a ideia de "certo/errado"; "A diferença é pequena" descreve sem julgar. Atenção a testes que busquem `Seus macros` ou `Está batendo`. |
| 22 | `Completar o carboidrato` e `Preenche o carboidrato com as calorias que sobram depois da proteína e da gordura. Agora: {a} g. Completando: {b} g.` | A | sem mudança | Descreve exatamente `carbsFromRest` (kcal menos 4 x proteína menos 9 x gordura, dividido por 4, mínimo 0). Exemplo conferido: academia 2.450, 185, 55 dá 304 g, contra 305 g do plano; por isso o botão só preenche e mostra os dois valores antes de o usuário salvar. |
| 23 | `O carboidrato já estava certo: {n} g.` | AJ | `O carboidrato já era {n} g.` | "Certo" dá a ideia de que existe um valor correto, quando o cálculo é só "o que sobra". Descrever sem julgar. |
| 24 | `Carboidrato: de {x} para {y} g`, `Carboidrato voltou ao valor anterior.`, `Preencha as calorias do dia, a proteína e a gordura com números inteiros para completar o carboidrato.` | A | sem mudança | Descritivos e claros. Em `Carboidrato: de {x} g para {y} g` está correto; só confirmar a unidade nos dois valores. |
| 25 | `Estas metas são estimativas, não orientação médica. Antes de mudar muito a sua alimentação, converse com um nutricionista ou médico.` (aviso curto, sempre visível) | AJ | `Estas metas são estimativas e valores de exemplo. O app não substitui nutricionista ou médico. Antes de mudar muito a sua alimentação, converse com um profissional.` | O aviso do projeto exige dizer que o app não substitui nutricionista ou médico. O texto curto atual diz só "não orientação médica" e não traz a frase de não substituição nem a menção a condições de saúde. A seção 3.1 e a 7.6 da especificação pedem o texto completo sempre visível, "sem esconder em ajuda". Recomendação preferida: mostrar o texto completo (item 26) sempre, sem o botão "Saiba mais", porque são quatro frases curtas. Se o dono preferir o formato compacto, usar o texto proposto acima como versão curta, e manter "Saiba mais" apenas para as condições (gravidez, menos de 18 anos, medicamentos, transtorno alimentar). |
| 26 | `Estas metas são estimativas e valores de exemplo. O app não substitui nutricionista ou médico. Procure um profissional antes de mudar muito a sua alimentação, e também se você tem alguma condição de saúde, usa medicamentos, está grávida ou amamentando, tem menos de 18 anos ou já teve transtorno alimentar. Dor persistente, tontura ou outros sintomas também pedem avaliação profissional.` (aviso expandido) | A | sem mudança no texto | Idêntico à seção 3.1. O único ponto é de exibição: hoje fica oculto por padrão atrás de "Saiba mais" (ver item 25). |
| 27 | `Saiba mais` e `Mostrar menos` | A | sem mudança | Rótulos claros, com `aria-expanded`. Só ficam se o item 25 optar pelo formato compacto. |
| 28 | `Restaurar padrão`, `Restaurar as metas de exemplo?`, `Suas metas atuais deixam de valer a partir de hoje. Os dias anteriores não mudam.`, `Restaurar`, `Cancelar`, `Salvar metas` | A | sem mudança | Iguais à seção 7.3. |
| 29 | `Corrija os campos destacados para salvar.` e `Não foi possível salvar as metas. O que você digitou continua na tela. Tente de novo.` | A | sem mudança | Iguais às seções 7.5. |
| 30 | Avisos exibidos vindos do domínio: `kcal-baixa`, `kcal-alta`, `proteina-baixa`, `proteina-alta`, `gordura-baixa`, `agua-alta` | A | sem mudança | Idênticos à seção 7.4; não afirmam motivo científico, só pedem conferir ou procurar profissional. Limiares seguem "a verificar" (seção 3). O aviso `macros-incoerentes` do domínio é filtrado na folha e substituído pela frase do item 21; a regra da tolerância continua a do domínio. |
| 31 | `Meta de exemplo`, `Ainda não foi confirmada.` (oculto para leitor de tela) e `Valores de exemplo do plano. Ajuste para o seu caso.` (`MetaDieta.tsx`) | A | sem mudança | Iguais à seção 7.2. |
| 32 | `Ajustar metas` e `Usar esta meta` (`MetaDieta.tsx`) | A | sem mudança | "Usar esta meta" apenas confirma o valor de exemplo; não recomenda. |
| 33 | `Metas de dieta` (aria-label da seção em `MetaDieta.tsx`) | A | sem mudança | Coerente com a linha do Perfil. |

Contagem: 28 aprovados (itens 1 a 8, 10 a 12, 14 a 20, 22, 24, 26 a 33) e 5 a ajustar (9, 13, 21, 23, 25).

## Respostas diretas às perguntas

- **"Proteína: ajuda a manter e ganhar músculo"** (`Gramas por dia. Ajuda a manter e ganhar músculo.`): correta em linhas gerais (a verificar), inofensiva, não dá orientação individual, mas pode soar como promessa. Ajustar para a versão neutra (item 9).
- **"Dias mais puxados pedem mais carboidrato, que é a energia do treino"**: correta em linhas gerais (a verificar), inofensiva. Ajustar para descrever o plano de exemplo e dizer "uma das fontes de energia" (item 13).
- **Tom em relação ao aviso de não substituição:** os textos de orientação são neutros e a folha não dá diagnóstico nem prescrição. A lacuna é o aviso curto, que não traz a frase "O app não substitui nutricionista ou médico" (item 25).
- **Contextos dos tipos de dia:** conferidos com a tabela da especificação e com `diet.ts` e `dayActivity.ts`: todos corretos.
- **Frase de soma dos macros:** fatores 4/4/9 corretos; ajustar "cerca de", jargão e direção da diferença (item 21).

## Lista final de ajustes para o frontend

1. `MetasSheet.tsx`, ajuda da proteína manual: trocar por `Gramas por dia.` (item 9).
2. `MetasSheet.tsx`, subtítulo da seção de tipos de dia: trocar por `No plano de exemplo, dias de treino mais pesado têm mais carboidrato, uma das fontes de energia do treino. Toque em um tipo de dia para ajustar.` (item 13).
3. `MetasSheet.tsx`, frase de conferência: usar `Proteína, carboidrato e gordura somam cerca de {sum} kcal; as calorias do dia são {kcal} kcal.` seguida de `A diferença é pequena.` (quando bate) ou `A soma está {n} kcal abaixo|acima das calorias do dia. Você ainda pode salvar.` (quando não bate). Mantêm-se os mesmos cálculos (`kcalFromMacros`, `macroTolerance`). Atualizar os testes que buscam `Seus macros`, `Está batendo` ou `Não está batendo` (item 21).
4. `MetasSheet.tsx`, nota de "Completar o carboidrato": trocar `O carboidrato já estava certo: {n} g.` por `O carboidrato já era {n} g.` (item 23). Conferir testes que busquem o texto antigo.
5. `MetasSheet.tsx`, aviso de saúde: preferido, mostrar sempre o texto completo `SAUDE` (sem o botão "Saiba mais"); alternativa, trocar `SAUDE_CURTO` por `Estas metas são estimativas e valores de exemplo. O app não substitui nutricionista ou médico. Antes de mudar muito a sua alimentação, converse com um profissional.` e manter o texto completo atrás de "Saiba mais" (item 25). Em ambos os casos, o texto completo continua exatamente igual ao da seção 3.1.
6. Opcional: acrescentar `Dias que já passaram mantêm a meta que valia neles.` à introdução (item 2) e usar `Dias de outros treinos de academia` no contexto da academia (item 15).

Nenhum número, limite ou regra de treino ou dieta foi alterado, então não há novo registro em `docs/decisoes/`. Se o dono escolher o formato compacto do aviso (item 25), registrar a escolha na ADR 007.

## Pendências "a verificar"

- Proteína e massa muscular (item 9) e carboidrato por volume de treino (item 13): consenso geral, sem estudo conferido para esta revisão.
- Fatores 4/4/9 (item 21): simplificação de planejamento.
- Limiares de aviso (1.400 e 4.500 kcal, 0,8 e 3,0 g/kg, 30 g de gordura, 5 L de água): prudência de produto, como na seção 3 da especificação; recomenda-se revisão com nutricionista antes de divulgação ampla.
