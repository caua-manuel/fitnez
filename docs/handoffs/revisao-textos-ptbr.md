# Revisão de textos em português do Brasil

Escopo: textos visíveis ao usuário (e rótulos acessíveis) em `src/app`, `src/features`, `src/ui`, `src/domain`, `src/data`, `src/pwa`, `index.html` e no manifest gerado em `src/pwa/build.ts`. Revisão somente leitura: nenhum arquivo de `src/` foi alterado. Quem aplicar deve atualizar os testes indicados na coluna "Motivo / teste".

Fora desta passada: conteúdo de `data/plan.json`, `data/diet.json` e `data/recipes.json` (nomes de exercícios, itens e receitas) e o código de `legacy/`. Números e regras de treino/dieta não foram tocados; só a redação.

Legenda de tipo: **ERRO** (erro real: ortografia, concordância, informação errada ou enganosa), **PADRÃO** (inconsistência de termo, formato ou tom; recomendado aplicar), **OPCIONAL** (preferência de estilo ou melhoria pequena).

## Glossário (termo escolhido)

| Conceito | Usar | Evitar |
| --- | --- | --- |
| Uma execução de treino | treino | sessão, workout |
| Repetição em bloco de exercício | série | set |
| Terminar o treino | concluir (Concluir treino, Treino concluído) | finalizar, terminar |
| Marcar aula/jogo/refeição | marcar, desmarcar; estado "feito" ou "consumido" | check, completar |
| Treino pela metade | em andamento | parcial |
| Semana de carga reduzida | semana leve (na 1ª menção: "semana leve (deload)") | deload sozinho |
| Repetições em reserva | RIR (na 1ª menção: "RIR (repetições em reserva)") | reps in reserve |
| Sem treino no dia | descanso | folga |
| Dados e arquivo de segurança | backup (baixar, copiar, importar, confirmar) | cópia (como sinônimo de backup), exportar |
| Onde ficam os dados | neste aparelho | dispositivo, celular |
| Funcionar sem internet | uso offline | acesso offline, modo offline |
| Lista de exercícios cadastrados | exercícios salvos (ou "seus exercícios") | catálogo |
| Opção de refeição | opção 1, 2, 3 | A, B, C na tela |
| Terceira aula de jiu-jitsu | 3ª aula | terceira aula |
| Ações do menu ⋮ | "Mais ações de X" | alternar entre "Mais ações" e "Mais opções" |
| Aviso rápido (toast) de uma frase | sem ponto final | com ponto final (só frases longas ou de duas orações levam ponto) |
| Unidades | "kg", "kcal", "g", "ml", "min", "s" com espaço; vírgula decimal; ponto de milhar acima de 999 | "10 MiB", "1800" |
| Datas | "9 nov 2026" curto; "23/11" só dia e mês | "09 nov 2026" com zero |

## Os 5 problemas mais importantes

1. `src/features/inicio/Inicio.tsx`: a escala "como terminou" diz 1 = exausto, 5 = ótimo, mas a regra da 3ª aula e a especificação tratam 5 como "destruído" (ruim). A pessoa pode marcar 5 achando que foi ótimo e perder a elegibilidade.
2. `src/features/perfil/Perfil.tsx`: orienta olhar "o aviso no topo" para ver "Disponível offline", mas esse aviso está em `visually-hidden` (`src/app/App.tsx`). Quem enxerga nunca o vê.
3. `src/features/dieta/Dieta.tsx`: "Tomada hoje" e "Ajustes de hoje" aparecem também ao navegar para outro dia, o que dá informação errada.
4. `src/domain/jiujitsu.ts`: "falta aulas, sono" (concordância) e `src/features/treino/Detalhe.tsx`: "1 séries feitas".
5. Inconsistência de termos: "cópia" x "backup" x "exportar", "catálogo" (jargão), "Parcial" x "Em andamento", "Folga" x "Descanso", "deload" x "semana leve", "acesso offline" x "uso offline".

## Transversais

| Onde | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| Toasts em `src/features/treino/planActions.ts`, `NovoTreino.tsx`, `EditarExercicio.tsx`, `EditarTreino.tsx`, `Biblioteca.tsx`, `src/features/inicio/Inicio.tsx` | `Treino duplicado.` `Treino excluído.` `Exercício removido do treino.` `Treino criado.` `Exercício salvo.` `Exercício adicionado ao treino.` `Treino salvo.` `Treinos originais restaurados.` `Aula desmarcada.` `Jogo desmarcado.` `Treino de volta à rotina.` `Registrando hoje.` | os mesmos sem o ponto final (ex.: `Treino duplicado`) | PADRÃO | Dieta e Perfil já usam toast sem ponto (`Perfil salvo`, `Opção salva`). TESTE: `tests/e2e/entrega-a-editor.spec.ts` linhas ~75 (`Exercício salvo.`), ~106 (`Treino excluído.`), ~208 (`/^Treino salvo.$/`). A mesma `Treino salvo.` aparece também no texto fixo `✓ Treino salvo.` (linha ~207), que pode ficar. |
| Setas literais: `← Voltar`, `← Voltar aos treinos`, `← Voltar ao treino` (Executar, Detalhe, EditarTreino, EditarExercicio, Concluido) | `← Voltar aos treinos` | mesma frase com a seta em `<span aria-hidden="true">` | OPCIONAL | Leitor de tela lê o símbolo da seta. |
| Aviso de saúde repetido em `Treino.tsx`, `Detalhe.tsx`, `Perfil.tsx`, `Evolucao.tsx` | `Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.` | manter o texto; mover para uma constante única | OPCIONAL | Quatro cópias podem divergir. A Dieta usa outra versão, específica de alimentação, e está correta. |

## src/app/App.tsx

| Linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| 60 | `Preparando acesso offline…` e `Acesso offline indisponível` e `Sem conexão · acesso offline não confirmado` | `Preparando o uso offline…` e `Uso offline indisponível` e `Sem conexão · uso offline não confirmado` | PADRÃO | Glossário "uso offline" (igual ao index.html). Texto só para leitor de tela. TESTE: `Disponível offline` e `Sem conexão · disponível offline` são verificados em `tests/e2e/fase1.spec.ts` (~34); manter esses dois. |
| 60 | `Prévia local · offline disponível no build` | `Versão de desenvolvimento · o uso offline funciona só na versão publicada` | OPCIONAL | "build" é jargão. |
| 100 | `Guarde uma cópia dos seus dados` | `Faça um backup dos seus dados` | PADRÃO | Mistura "cópia" e "backup" na mesma frase. Mesmo texto em `src/ui/components.tsx` e `Perfil.tsx`. Nenhum teste encontrado. |
| 93 | `Seus dados não foram abertos. Use a ação acima para tentar novamente.` | `Não foi possível abrir seus dados. Use o botão acima para tentar de novo.` | OPCIONAL | Mais direto; "ação acima" é vago. |
| 84 | `Atenção à recuperação` | `Aviso sobre a recuperação dos dados` | OPCIONAL | Título solto e pouco claro. |
| 85 | `Encontramos duas fontes diferentes` | `Encontramos dois históricos diferentes` | OPCIONAL | "Fontes" é jargão. Manter o link `Escolher origem dos dados` (TESTE `tests/e2e/fase1.spec.ts` ~28). |
| 29 | `Acompanhe seus resultados e veja sua evolução.` | `Acompanhe seus resultados.` | OPCIONAL | Redundante com o título "Evolução". |

## src/pwa

| Arquivo / linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `usePwa.ts` 13 | `Este navegador ou endereço não permite instalar o acesso offline.` | `Este navegador ou endereço não permite o uso offline.` | PADRÃO | "Instalar o acesso" soa estranho; glossário. É exibido como aviso em `App.tsx`. |
| `usePwa.ts` 13 | `Acesso offline e instalação são verificados no build de produção em HTTPS ou localhost.` | `O uso offline e a instalação só funcionam na versão publicada (HTTPS) ou em localhost.` | OPCIONAL | Só aparece em desenvolvimento; evita "build". |
| `notifications.ts` 37 | corpo da notificação: só o nome do exercício (título `Descanso terminado`) | corpo `Próxima série: <nome do exercício>` | OPCIONAL | O corpo sozinho não diz o que fazer. TESTE: `tests/unit/notifications.test.ts` (~27) confere o título; conferir o corpo antes de alterar. |

## src/features/inicio

| Linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `Inicio.tsx` 180 | `(1 = exausto, 5 = ótimo)` | `(1 = leve, 5 = destruído)` | ERRO | A escala está invertida em relação à especificação e a `src/domain/jiujitsu.ts`, que penaliza a nota 5 ("destruído"). Os botões `Nota 4 de 5` não mudam (TESTE `tests/e2e/entrega-a-inicio.spec.ts` usa só o aria-label). Sugestão: também citar as pontas no aria-label dos botões 1 e 5 (ex.: `Nota 1 de 5, leve`), sem alterar `Nota 4 de 5`. |
| `Inicio.tsx` 245 | `Hoje vira Semana 01, dia 3, e o Início passa a mostrar o treino de hoje.` | `Hoje passa a ser o dia 3 da semana 1, e o Início passa a mostrar o treino de hoje.` | PADRÃO | "Semana 01" com maiúscula no meio da frase e verbo "vira" informal. O número do dia é calculado no código; só a moldura muda. |
| `Inicio.tsx` 194 | `Marcar jogo` | `Marcar jogo como feito` | PADRÃO | Paralelo com `Marcar aula como feita` (TESTE `tests/e2e/entrega-a-inicio.spec.ts` usa só o da aula). |
| `Inicio.tsx` 218 | `Semana de deload` | `Semana leve (deload)` | PADRÃO | Glossário; `Detalhe.tsx` já diz "semana leve". |
| `Inicio.tsx` 215 | `Olá, ${name}!` e `Olá!` | `Olá, ${name}` e `Olá` | OPCIONAL | Menos exclamação, tom adulto. TESTE: `tests/e2e/entrega-a-inicio.spec.ts` ~85 busca `Olá!`. |
| `Inicio.tsx` 146 | `O plano ainda não começou, então este dia não é registrado como parte dele.` | `O plano ainda não começou. Este dia não conta como parte dele.` | OPCIONAL | Mais curto. |
| `Inicio.tsx` 203 | `Se quiser, faça o treino do condomínio (opcional).` | `Treino do condomínio (opcional).` | OPCIONAL | "Se quiser" e "opcional" dizem o mesmo. |
| `TerceiraAula.tsx` 27 | `Terceira aula de jiu-jitsu` | `3ª aula de jiu-jitsu` | PADRÃO | O resumo e a especificação usam "3ª aula". TESTE: conferir se algum teste busca o título (nenhuma ocorrência encontrada). |
| `SemanaFaixa.tsx` 4 | `Folga` | `Descanso` | PADRÃO | `semana.ts` e o resto do app dizem "Descanso" (o rótulo acessível já diz "Domingo: Descanso"). |

## src/domain/jiujitsu.ts

| Linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| 89 | `Ainda não: falta ${falta.join(', ')}.` (resulta em `Ainda não: falta aulas, sono (sem dados).`) | `faltam` quando houver mais de um item, `falta` quando for um só | ERRO | Concordância. TESTE: `tests/unit/jiujitsu.test.ts` ~42 (`/^Ainda não: falta/`, continua válido) e `tests/e2e/entrega-a-inicio.spec.ts` ~298 (`Ainda não: falta sono (sem dados).`, caso de um item, não muda). |

## src/features/perfil

| Linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `Perfil.tsx` 268 | `O acesso offline estará pronto quando o aviso no topo indicar “Disponível offline”.` | `O uso offline estará pronto quando aparecer “Disponível offline” aqui, em Dados neste aparelho.` | ERRO | O aviso do topo é `visually-hidden` em `App.tsx` (só leitor de tela). Para valer, exibir o estado numa linha da lista de fatos desta seção. TESTE: `tests/e2e/fase1.spec.ts` ~34 busca `Disponível offline`; conferir o seletor. |
| `Perfil.tsx` 195 | `Dados físicos` (título do formulário que também edita nome e objetivo) | `Editar perfil` | PADRÃO | O formulário tem nome, objetivo e dados físicos. TESTE: `tests/e2e/fase1.spec.ts` usa o botão `/^Dados físicos/` da lista, que permanece. |
| `Perfil.tsx` 282 | `Arquivo de backup JSON (até 10 MiB)` | `Arquivo de backup JSON (até 10 MB)` | PADRÃO | "MiB" é jargão para o usuário. |
| `Perfil.tsx` 170 | `Este arquivo tem mais de 10 MiB. Escolha um backup menor. Seus dados atuais continuam intactos.` | `Este arquivo tem mais de 10 MB. Escolha um backup menor. Seus dados atuais continuam intactos.` | PADRÃO | Mesmo motivo. |
| `Perfil.tsx` 276 | `Última geração` e `Cópia confirmada` | `Último backup gerado` e `Último backup confirmado` | PADRÃO | Glossário (backup). |
| `Perfil.tsx` 278 | `Já guardei a cópia` | `Já guardei o backup` | PADRÃO | TESTE: `tests/e2e/fase1.spec.ts` ~24 clica nesse botão. |
| `Perfil.tsx` 278 | `Cópia confirmada. O lembrete reaparecerá em sete dias.` | `Backup confirmado. O lembrete volta em 7 dias.` | PADRÃO | Glossário e número em algarismo, como no resto do app. |
| `Perfil.tsx` 179 | `Guarde uma cópia dos seus dados` | `Faça um backup dos seus dados` | PADRÃO | Igual a `App.tsx` e `components.tsx`. |
| `Perfil.tsx` 269 | `Para mudar de endereço ou aparelho, exporte e importe o backup.` | `Para mudar de endereço ou aparelho, baixe e importe o backup.` | PADRÃO | O botão se chama "Baixar backup". |
| `Perfil.tsx` 258 | `Avisos de fim de descanso. No iPhone, instale o app na tela inicial. Lembretes com o app fechado exigem um serviço de envio, que ainda não está ativo.` | `Avisa quando o descanso entre séries termina. No iPhone, instale o app na tela inicial. Lembretes com o app fechado ainda não estão disponíveis.` | OPCIONAL | Longo para celular; "serviço de envio" é jargão. |
| `Perfil.tsx` 250 | `Escolha o formato de exibição` | `Automático, claro ou escuro` | OPCIONAL | Diz o que há para escolher. |
| `Perfil.tsx` 197, 200 | placeholders `Seu nome` e `Defina seu objetivo` | `Como quer ser chamado` e `Ex.: ganhar massa e perder gordura` | OPCIONAL | O placeholder repete o rótulo. |
| `Perfil.tsx` 234 | `Última medida de peso: 82 kg em 12/11. O peso do perfil e o peso medido na Evolução são independentes.` | `Último peso medido: 82 kg, em 12/11. Ele não muda o peso do perfil sozinho.` | OPCIONAL | Mais claro e curto. |
| `Perfil.tsx` 268 | `Para acesso rápido, use “Adicionar à Tela de Início” no menu do navegador.` | `Para abrir mais rápido, instale o app: use “Adicionar à Tela de Início” (iPhone) ou “Instalar app” (Android) no menu do navegador.` | OPCIONAL | Cobre os dois sistemas. |
| `Perfil.tsx` 218-220 | `<dd>` antes de `<dt>` dentro de `<dl>` (Treinos, Refeições, Constância) | inverter a ordem (`<dt>` antes de `<dd>`) e manter a aparência por CSS | OPCIONAL | Marcação inválida para leitor de tela (acessibilidade, não texto). |

## src/ui/components.tsx

| Linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| 9 | `Guarde uma cópia dos seus dados` | `Faça um backup dos seus dados` | PADRÃO | Igual aos outros dois lugares. |
| 22 | `Ainda não registrada` (data do backup) | `Ainda não feito` | OPCIONAL | Fica correto com "backup gerado/confirmado" (masculino). |

## src/features/perfil/DataInicioSheet.tsx

| Linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| 54 | `O plano sempre começa numa segunda-feira: usamos a segunda-feira da semana escolhida` | `O plano começa sempre numa segunda-feira. Usaremos a segunda da semana escolhida` | OPCIONAL | Frases mais curtas. |

## src/features/treino

| Arquivo / linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `Detalhe.tsx` 155 | `{n} séries feitas` (resulta em `1 séries feitas`) | usar `plural(n, 'série feita', 'séries feitas')` | ERRO | Concordância no singular. Nenhum teste encontrado. |
| `Treino.tsx` 32 | `Plano (12 semanas)` | `Plano de 12 semanas` | PADRÃO | Mesma expressão usada em Perfil e Início. |
| `util.ts` 62 | `Parcial` | `Em andamento` | PADRÃO | O Início já diz "Em andamento" para o mesmo estado. TESTE: `tests/e2e/entrega-a-treino.spec.ts` ~84 (`/Upper A.*Quarta-feira.*Parcial/`). |
| `Executar.tsx` 332 | `Conclua ao menos uma série para finalizar.` | `Conclua ao menos uma série para concluir o treino.` | PADRÃO | Glossário (concluir). Texto só para leitor de tela. |
| `Executar.tsx` 281 | aria-label `Cronômetro do treino em pausa` | `Pausar cronômetro do treino` | PADRÃO | O rótulo descreve um estado, não a ação, e o botão alterna com `aria-pressed`. TESTE: `tests/e2e/entrega-a-executar.spec.ts` ~210. |
| `Detalhe.tsx` 153 | `{formatKg(wk.volume)} kg de volume` (ex.: `4200 kg de volume`) | `4.200 kg de volume` (usar `toLocaleString('pt-BR')`) | PADRÃO | `Concluido.tsx` já usa separador de milhar; hoje os dois divergem. |
| `Detalhe.tsx` 140 | `Meta da Semana 1 de 12 (semana leve)` | `Meta da semana 1 de 12 (semana leve)` | PADRÃO | Maiúscula indevida no meio da frase. TESTE: conferir `tests/e2e/entrega-a-treino.spec.ts` ~198 (`Semana 1 de 12`), que provavelmente se refere ao anel de progresso. |
| `Cartao.tsx` 48 | `os exercícios continuam no catálogo` | `os exercícios continuam salvos` | PADRÃO | "Catálogo" é jargão (glossário). |
| `Biblioteca.tsx` 41 | aria-label `Filtrar por grupo` | `Filtrar treinos` | PADRÃO | Os filtros são Todos, Superiores e Inferiores, não grupos musculares. |
| `EditarTreino.tsx` 37 (Picker) | `Ou escolha um que já existe no seu catálogo.` | `Ou escolha um exercício que você já tem salvo.` | PADRÃO | Glossário. |
| `EditarTreino.tsx` 43 | `Todos os exercícios do catálogo já estão neste treino.` | `Todos os seus exercícios já estão neste treino.` | PADRÃO | Glossário. |
| `EditarTreino.tsx` 44 | aria-label `Exercícios do catálogo` | `Exercícios salvos` | PADRÃO | Glossário. |
| `EditarTreino.tsx` 111 | `Este exercício não existe mais no catálogo.` | `Este exercício não está mais salvo.` | PADRÃO | Glossário. |
| `EditarTreino.tsx` 135 | `os exercícios continuam no catálogo` | `os exercícios continuam salvos` | PADRÃO | Igual a `Cartao.tsx`. |
| `EditarExercicio.tsx` 46 | `Voltar a Editar treino` | `Voltar para Editar treino` | PADRÃO | Regência mais natural. |
| `Executar.tsx` 301 e `Detalhe.tsx` 72 | `(só uma sugestão; você define a carga)` depois de `Sugestão:` | `(a carga é sua decisão)` | OPCIONAL | "Sugestão" aparece duas vezes na mesma linha. |
| `Executar.tsx` 272 e `Detalhe.tsx` 45 | `reduzir a carga (50 kg) e manter 5–8` | `reduzir a carga (50 kg) e manter 5–8 repetições` | OPCIONAL | Falta a unidade. |
| `Executar.tsx` 324 | `Este exercício não tem tempo definido.` | `Este exercício não tem descanso definido.` | OPCIONAL | "Tempo" pode ser confundido com tempo de execução. |
| `Executar.tsx` 318 | `Não foi possível salvar agora. O que você digitou continua na tela; conclua uma série ou o treino para tentar de novo.` | `Não foi possível salvar. O que você digitou continua na tela. Conclua uma série para tentar de novo.` | OPCIONAL | Mais curto. |
| `Concluido.tsx` 34 | `Treino concluído!` | `Treino concluído` | OPCIONAL | Tom mais sóbrio. TESTE: nenhuma busca encontrada; conferir antes. |
| `Biblioteca.tsx` 53 | `Tem Supino com halteres` | `Inclui Supino com halteres` | OPCIONAL | TESTE: `tests/e2e/entrega-a-treino.spec.ts` ~189. |
| `util.ts` 75 | `09 nov 2026` (formatDay) | `9 nov 2026` | OPCIONAL | `shortDay` já escreve `9 nov`; zero à esquerda é desnecessário. Conferir testes que comparam datas formatadas. |
| `EditarTreino.tsx` 106-107 | aria-labels `Subir X` e `Descer X` | `Mover X para cima` e `Mover X para baixo` | OPCIONAL | Mais claro para leitor de tela. |
| `EditarTreino.tsx` 74, 93 | toast `Treino salvo.` e texto `✓ Treino salvo.` em `role="status"` | manter só um dos dois | OPCIONAL | Anúncio duplicado. TESTE: `tests/e2e/entrega-a-editor.spec.ts` ~207-208 verifica os dois. |

## src/features/treino (formulários) e src/domain/exerciseDraft.ts, planEdit.ts

| Arquivo / linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `exerciseDraft.ts` 79 | `O descanso vai até 1800 segundos (30 min).` | `O descanso máximo é 30 min (1.800 s).` | PADRÃO | Formato de número e unidade. |
| `exerciseDraft.ts` 71 | `Informe as repetições, por exemplo 8–12.` (também quando o tipo é só tempo) | `Informe as repetições (ou o tempo, no tipo "Só tempo"), por exemplo 8–12.` | OPCIONAL | O rótulo do campo muda para "Tempo". |
| `exerciseDraft.ts` 7 | `Peso do corpo + carga extra` | `Peso do corpo e carga extra` | OPCIONAL | Os outros tipos usam "e". |
| `Campos.tsx` 69 | placeholder `5–8` também para o tipo "Só tempo" | `30` (ou `30–45`) quando o tipo for tempo | OPCIONAL | O exemplo não combina com segundos. |
| `planEdit.ts` 17, 59 | `Treino inexistente: ${id}` e `Exercício inexistente: ${id}` | `Este treino não existe mais.` e `Este exercício não existe mais.` | OPCIONAL | Mostram o id interno ao usuário. TESTE: `tests/unit/planEdit.test.ts` ~49 busca `inexistente`. |

## src/features/dieta

| Arquivo / linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `Dieta.tsx` 130 | `Tomada hoje` (ao ver outro dia) | `isToday ? 'Tomada hoje' : 'Tomada neste dia'` | ERRO | Informação errada em dias passados ou futuros. `Ainda não tomada` está correto. O aria-label `Creatina tomada` fica (TESTE `tests/e2e/entrega-b-dieta.spec.ts` ~94-98). |
| `Dieta.tsx` 112 | `Ajustes de hoje` (ao ver outro dia) | `isToday ? 'Ajustes de hoje' : 'Ajustes do dia'` | ERRO | Mesmo problema. Nenhum teste encontrado. |
| `Dieta.tsx` 67 | `{fmt(value)} g / {fmt(goal)} g` | `{fmt(value)} g de {fmt(goal)} g` | PADRÃO | O Início usa "g de g". |
| `Dieta.tsx` 109 | `Registrar o lanche` e `Registrar o pós-treino` | `Registrar o pré-treino ou lanche` e manter o do pós-treino | OPCIONAL | O nome da refeição é "Pré-treino ou lanche". |
| `Dieta.tsx` 140 | `Registre seu peso e cintura em Evolução.` | `Registre peso e cintura na aba Evolução para receber a revisão.` | OPCIONAL | Explica o motivo. |
| `Refeicao.tsx` 62 | `Opção trocada: Almoço opção 2` | `Opção trocada: Almoço, opção 2` | OPCIONAL | Vírgula separa nome e opção. TESTE: `tests/e2e/entrega-b-dieta.spec.ts` ~243. |
| `Refeicao.tsx` 90 | `P 30 g`, `C 40 g`, `G 10 g` | manter o visual e acrescentar `aria-label` (ou `title`) `Proteína 30 g`, `Carboidrato 40 g`, `Gordura 10 g` | OPCIONAL | Letras soltas não são claras para leitor de tela. |
| `Refeicao.tsx` 39 | `Preparo: ${r.t}` seguido do título `Modo de preparo` | se `t` for o tempo, `Tempo de preparo: ${r.t}` | OPCIONAL | Dois "preparo" seguidos. Conferir o conteúdo de `data/recipes.json`. |
| `GerenciarOpcoes.tsx` 61 | `Os macros somam cerca de 540 kcal, diferente das calorias informadas. Você pode salvar assim.` | `Proteína, carboidrato e gordura somam cerca de 540 kcal, diferente das calorias informadas. Você pode salvar assim.` | OPCIONAL | "Macros" é jargão. |
| `GerenciarOpcoes.tsx` 128 | `Mantenha ao menos uma opção: com uma só, Excluir não aparece no menu.` | `Mantenha ao menos uma opção. Com uma só, não é possível excluir.` | OPCIONAL | Mais direto. |
| `GerenciarOpcoes.tsx` 120 | aria-label `Mais ações da opção 1, X` | manter | OPCIONAL | Decisão: padronizar o menu ⋮ em "Mais ações de X" nos treinos também (`Cartao.tsx`, `Detalhe.tsx`, `EditarTreino.tsx` hoje dizem "Mais opções de X"); em refeição "opções" colide com "opção". TESTE: `tests/e2e/entrega-a-treino.spec.ts` ~167, 178, 274, 280, 319 usariam o novo nome. |

## src/features/evolucao

| Linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `Evolucao.tsx` 104 | `Conclua séries com carga em exercícios de kg para ver a força.` | `Conclua séries com carga para ver a força.` | OPCIONAL | "Exercícios de kg" é jargão interno. |
| `Evolucao.tsx` 175 | `Constância de treinos` | `Constância` | OPCIONAL | O cálculo inclui aulas e jogos. TESTE: `tests/e2e/entrega-a-evolucao.spec.ts` ~117, 134 (nome da região). |
| `Evolucao.tsx` 81, 137 | rótulos `S1`, `S2`... na tabela acessível (coluna "Semana") | `Semana 1`, `Semana 2`... só na tabela oculta | OPCIONAL | Abreviação lida letra a letra. Os rótulos do gráfico e o aria-label (`em S1 a 48 kg em S3`, TESTE ~113-120) podem ficar. |

## src/data (mensagens que chegam à tela)

| Arquivo / linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `idb.ts` 4 | `IndexedDB não está disponível. Não é possível salvar neste navegador.` | `O armazenamento do navegador não está disponível. Não é possível salvar seus dados aqui.` | PADRÃO | "IndexedDB" é jargão. TESTE: `tests/e2e/fase1.spec.ts` ~32 só verifica que há `alert`. |
| `idb.ts` 3 | `Não há espaço para salvar. Exporte um backup; os dados anteriores foram mantidos.` | `Não há espaço para salvar. Baixe um backup; os dados anteriores foram mantidos.` | PADRÃO | Glossário (baixar, não exportar). |
| `index.ts` 75 | `A revisão da prévia não corresponde aos dados atuais.` | `Os dados mudaram depois da prévia. Selecione o arquivo novamente.` | PADRÃO | "Revisão" é termo interno. |
| `index.ts` 64 | rótulo da fonte de migração igual ao id (`treino12-v1`, `treino12-v2`) | `Protótipo (versão 1)` e `Protótipo (versão 2)` | PADRÃO | O id interno aparece como opção na tela "Escolher origem dos dados". TESTE: conferir `tests/e2e/fase1.spec.ts` ~28, que pode selecionar pelo texto. |
| `index.ts` 74 | `Backup legado: o catálogo de migração não comprova o plano usado em cada registro passado.` | `Backup antigo: ele não guarda qual treino você seguia em cada dia passado.` | OPCIONAL | Jargão (legado, catálogo, comprova). |
| `index.ts` 58 | `Tema legado desconhecido preservado na recuperação.` | `Tema antigo não reconhecido; foi guardado na recuperação.` | OPCIONAL | Mesmo motivo. |
| `capacity.ts` 10 | `A operação excede a capacidade de backup e recuperação: ... nenhum original foi truncado.` | `Não há espaço suficiente para gerar o backup com segurança. Os dados anteriores foram mantidos.` | OPCIONAL | Linguagem técnica. A mensagem interna pode seguir no `Error` e a amigável ir para a tela. |

## index.html e manifest (src/pwa/build.ts)

| Arquivo / linha | Texto atual | Texto proposto | Tipo | Motivo / teste |
| --- | --- | --- | --- | --- |
| `index.html` 9 | `<title>Fitnez</title>` | `<title>Fitnez: treino e dieta</title>` | OPCIONAL | Título de aba e de histórico mais descritivo. |
| `index.html` 8 e manifest | `Fitnez: treino e dieta em um só lugar, com seus dados guardados neste aparelho e uso offline.` / `Treino e dieta em um só lugar, com seus dados guardados neste aparelho e uso offline.` | sem alteração | OPCIONAL | Revisados e corretos; `lang: pt-BR`, `name` e `short_name` ok. |

## Observações fora do escopo de redação

- `src/features/FoundationPages.tsx` (textos como "próxima fase", "Mais") é importado em `App.tsx`, mas não é renderizado. Recomenda-se removê-lo em vez de revisar os textos.
- Campo do nome do treino tem `maxLength={160}` mas `NAME_MAX = 120` (e descrição `maxLength={200}` contra limite de 160 no validador): a pessoa pode digitar mais do que o aceito e ver erro. Ajustar os limites, não o texto.
- Mensagens de `src/data/validation.ts` (ex.: `Séries: inteiro inválido.`) hoje não chegam à tela, porque a importação mostra um texto genérico; se um dia forem exibidas, precisam de revisão.
- Nomes de treino semente `Upper A`, `Lower` são anglicismos, mas `dayTypeOf` e `jiujitsu.ts` reconhecem treinos por esses nomes. Só renomear junto com a regra.
