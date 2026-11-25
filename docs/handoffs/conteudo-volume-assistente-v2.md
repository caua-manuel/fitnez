# Conteúdo: gerador do assistente v2 (exercícios novos, dores, objetivo, prioridade, retorno, tempo, variedade)

Data: 25/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: PROPOSTA para implementação (dono aprovou refazer o gerador; números aguardam confirmação). ADR: [015-volume-assistente-v2.md](../decisoes/015-volume-assistente-v2.md).
Base lida: `conteudo-assistente-inicio.md` (3, 4), `conteudo-ajuste-volume-assistente.md`, ADR 010 e 014, `onboarding.ts` (TEMPLATES, VOLUME, SLOT_COUNT), `weeklySets.ts` (GROUP_RANGES), `swap.ts` (SWAP_GROUPS, `swapOptions`). Nenhum `.ts` foi alterado.

Todos os números e escolhas de produto: **a verificar**. Nenhum estudo foi conferido nesta passada; não há citação científica neste documento.

Termos: "exp" = `effectiveExperience` depois da regra da seção 5. "Bloco" = bloco de 4 semanas (índices 0, 1, 2 de `s`).

## 1. Dois exercícios novos (feito)

| id | n | g | m | s | r | rest | Arquivos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rosca_elastico` | Rosca com elástico | biceps | rep | [2,3,3] | ["10–15","12–15","12–20"] | 45 | `data/plan.json` (fim de `plan.ex`), `data/exercise-guide.json` (`itens`) |
| `lat_elastico` | Elevação lateral com elástico | ombro-lateral | rep | [2,3,3] | ["12–15","12–20","15–20"] | 45 | idem |

- Sessões, `order`, `sched`, ids existentes: intactos. Os dois ficam fora de qualquer sessão do plano padrão.
- Prompts de pose: `docs/ilustracoes/PROMPTS.md`.
- Para o `backend-dados`/`frontend`: `muscleGroupOf` já lê `g` (conferir `muscleGroups.ts`, onde `lat_a`, `rosca_a` etc. estão mapeados por id; se o mapa por id tiver prioridade sobre `g`, incluir os dois ids). Incluir em `SWAP_GROUPS`: `rosca_elastico` no padrão `biceps` e `lat_elastico` no padrão `ombro lateral`, em `casa_equip` (e em `casa_livre` só se o dono criar o local "tenho elástico", ver dúvida 1). `BEGINNER_SWAP_EXCLUDED` não precisa mudar. Como `m` = `rep`, o gerador mantém as repetições do catálogo e só troca `s`.
- Slots do gerador: sem decisão do dono (dúvida 1), não mudam; `biceps` em `casa_equip` continua `rosca_a` (halter) e `ombroLat` continua `lat_a`.
- Teste sugerido: todo id de `plan.ex` tem item em `exercise-guide.json` e vice-versa.

## 2. Dores por região

### 2.1 Comportamento da tela

| Item | Regra |
| --- | --- |
| Pergunta | "Alguma região incomoda quando você treina?" Múltipla escolha, entre o passo de local e o de atividades fixas (posição a critério do `ux`). |
| "Nenhuma" | Pré-selecionada (diferente do passo 0, porque não é segurança). Exclusiva: marcar uma região desmarca "Nenhuma"; desmarcar a última região volta a "Nenhuma". Com "Nenhuma", o plano é idêntico ao de hoje (nenhuma lista é aplicada). |
| Várias regiões | União das listas a evitar. |
| Privacidade | Dado de saúde: fica só em memória, como o passo 0; não entra em `StoredAnswers`, backup nem compartilhamento. O que fica gravado é o plano já trocado. Ao refazer o assistente a tela volta em "Nenhuma". A verificar com o dono (dúvida 2). |
| Quando trocar | Para cada vaga, se o id escolhido está na lista a evitar: pegar `swapOptions(id, place, exp, presentes)`, remover os ids evitados e usar o primeiro. Sem opção: pular a vaga (não conta no limite de tempo; a próxima vaga entra). Vale para qualquer experiência e local. |
| Ordem especial | Troca de vaga de quadríceps por dor no quadril: ordem `leg`, `goblet`, `sentar_levantar`, `agach_livre`, `agach` (o `agach` só se exp não for `nunca`). |
| Mínimo de variedade | Depois das trocas vale a seção 7 (mínimo de 5 exercícios em médio e longo). |
| Efeito no volume | O grupo que perde exercícios pode ficar abaixo do mínimo da faixa; o motor de status já usa `planned` como piso (`groupStatus`). Não compensar em outro grupo. |

### 2.2 Exercícios a evitar por região (ids do catálogo de `data/plan.json`)

| Região | Evitar (ids) | Critério |
| --- | --- | --- |
| `ombro` | `supino`, `inclinado`, `press_a`, `press_b`, `pike`, `barra`, `cruc`, `lat_a`, `lat_b`, `lat_elastico`, `ytw`, `puxada`, `puxada_elastico`, `flexao_fechada`, `tri_b`, `prancha`, `joelhos`, `roll` | Empurrar acima da cabeça ou com amplitude grande no ombro, elevações laterais, puxadas acima da cabeça, apoio e suspensão na barra. Ficam: `supino_chao` (amplitude limitada), `face`, `face_elastico`, `inverso`, remadas, `tri_a`, roscas, `pallof`, `deadbug`. |
| `joelho` | `agach`, `leg`, `goblet`, `agach_livre`, `sentar_levantar`, `bulg`, `afundo`, `afundo_livre`, `salto_l`, `salto_b`, `nordic` | Tudo que dobra o joelho sob carga ou com impacto. Ficam: pontes, `hip_b`/`hip_l`, `stiff`, `stiff_uni`, `mesa`, panturrilhas. |
| `lombar` | `agach`, `stiff`, `stiff_uni`, `remada_a`, `remada_mochila`, `farmer`, `roll`, `med`, `joelhos`, `salto_l`, `salto_b` | Carga sobre a coluna, tronco inclinado com carga, rotação com impulso, carregar peso, impacto. Ficam: `leg`, `goblet`, `hip_b`, pontes, `mesa`, `remada_b`, puxadas, `deadbug`, `prancha`, `pallof`. |
| `punho_cotovelo` | `flexao`, `flexao_fechada`, `pike`, `rosca_a`, `rosca_b`, `rosca_elastico`, `tri_a`, `tri_b`, `barra`, `farmer`, `joelhos`, `roll` | Apoio nas mãos com punho estendido, roscas e extensões de tríceps (cotovelo), pegada e suspensão prolongadas. Ficam: `supino`, `supino_chao`, `inclinado`, presses, puxadas, remadas, pernas, core sem apoio de mãos. |
| `quadril` | `bulg`, `afundo`, `afundo_livre`, `copen_l`, `copen_b`, `ponte_uni`, `stiff_uni`, `salto_l`, `salto_b` | Unilaterais com muita exigência do quadril, adução e impacto. Ficam: agachamentos bilaterais, `ponte`, `ponte_h`, `hip_b`, `stiff`. |

Critério conservador de propósito: lista evita o que mais exige a região; não promete tratar nem diagnosticar. Ids não listados continuam permitidos.

### 2.3 Onde não sobra alternativa segura (padrão de movimento sem troca)

| Região | Padrão sem alternativa | Onde | Resultado |
| --- | --- | --- | --- |
| `ombro` | empurrar vertical | todos os locais | vaga pulada; ombro anterior continua trabalhado por `supino_chao` e `flexao` |
| `ombro` | ombro lateral | todos | vaga pulada |
| `ombro` | tríceps | `casa_equip`, `casa_livre` (academia usa `tri_a`) | vaga pulada |
| `ombro` | ombro posterior | `casa_livre` (`ytw` evitado) | vaga pulada |
| `ombro` | empurrar horizontal | `casa_livre` | `flexao` NÃO está na lista: fica, com a nota "apoio alto" do catálogo (única opção); a tela de revisão avisa |
| `joelho` | todo o quadríceps (joelho, joelho 2, unilateral) | todos | vagas puladas; as sessões de pernas ficam com quadril, posterior, panturrilha e core. Não repor com exercício de outro grupo (estouraria o posterior) |
| `lombar` | puxar (vertical e horizontal) | `casa_livre` (`remada_mochila` evitada) | costas sem exercício em casa sem equipamento; avisar na revisão |
| `punho_cotovelo` | bíceps e tríceps | todos | vagas puladas |
| `punho_cotovelo` | empurrar (peito e press) | `casa_livre` | sem empurrar; avisar na revisão |
| `quadril` | nenhum | todos | sempre sobra troca (bilateral no lugar do unilateral; `ponte` no lugar de `ponte_uni`) |

Trocas esperadas que o teste deve conferir (academia, iniciante, médio): ombro: `supino`→`supino_chao`, `puxada`→`remada_a` (ou `remada_b` se `remada_a` não puder), `lat_a` pulada; joelho: `agach` e `afundo` puladas; lombar: `agach`→`leg`; `stiff` (intermediário)→`mesa`; punho: `rosca_a`, `tri_a` puladas; quadril: `afundo`→`leg` (ou `goblet` se `leg` já estiver no treino).

### 2.4 Textos (pt-BR, linguagem simples, sem diagnóstico, sem pedir causa)

| Região | Rótulo curto | Forma para a frase ({regiao}) |
| --- | --- | --- |
| `ombro` | Ombro | do ombro |
| `joelho` | Joelho | do joelho |
| `lombar` | Lombar (parte de baixo das costas) | da lombar |
| `punho_cotovelo` | Punho ou cotovelo | do punho ou cotovelo |
| `quadril` | Quadril | do quadril |
| `nenhuma` | Nenhuma | |

| Texto | Conteúdo |
| --- | --- |
| Título da tela | `Alguma região incomoda quando você treina?` |
| Frase de ajuda | `Marque onde você sente dor ou desconforto ao treinar. O app troca os exercícios que mais exigem essa região. Você não precisa dizer a causa.` |
| Linha de troca (revisão) | `Troquei {de} por {para}, por causa da dor {regiao}.` |
| Linha sem troca possível | `Tirei {de} por causa da dor {regiao}. Não há troca segura com o seu equipamento.` |
| Aviso de segurança | `Dor forte ou que piora: pare e procure um fisioterapeuta ou médico.` |
| Rodapé do bloco | `O app só evita os exercícios que mais exigem essa região. Ele não trata nem diagnostica, e não substitui um profissional.` |

`{de}` e `{para}` são os nomes (`n`) dos exercícios. Se a mesma vaga é pulada em dois treinos, mostrar uma linha por exercício, não por treino. Com mais de 6 linhas, agrupar: `Troquei {k} exercícios por causa da dor {regiao}. Veja a lista.`. O aviso de segurança aparece sempre que alguma região é marcada. O aviso de dor já existente na revisão (4 em 10, 2 semanas, formigamento) continua.

## 3. Objetivo muda o volume dentro da faixa

Faixas (`GROUP_RANGES`): grupos grandes (peito, costas, quadríceps, posterior e glúteos) nunca 4–8, iniciante 6–10, intermediário 8–16; pequenos (press, ombro lateral, ombro posterior, bíceps, tríceps, panturrilha) nunca 2–6, iniciante 3–8, intermediário 4–10.

| Objetivo | Posição `f` (0 = mínimo, 1 = máximo) | Justificativa |
| --- | --- | --- |
| `saude` | 0 | Dose mínima eficaz, sessões mais curtas e fáceis de manter. |
| `perder` | 0,33 | Em déficit calórico a recuperação é menor; manter o músculo não pede volume alto. |
| `recomp` | 0,5 | Meio da faixa (déficit leve e proteína alta, contexto do plano padrão). |
| `massa` | 1 | Topo da faixa, com superávit que sustenta a recuperação. |

Fórmula pura: `alvoSeries(exp, objetivo, tipo) = min + round(f × (max − min))` (round meio para cima). `objetivo` já é o efetivo (`perder` vira `saude` com IMC baixo etc., como em `buildDietTargetsFromAnswers`: o assistente deve usar o objetivo efetivo da dieta). Alvo semanal no bloco 1, por grupo.

| exp / tipo | saude | perder | recomp | massa |
| --- | --- | --- | --- | --- |
| nunca, grande (4–8) | 4 | 5 | 6 | 8 |
| nunca, pequeno (2–6) | 2 | 3 | 4 | 6 |
| iniciante, grande (6–10) | 6 | 7 | 8 | 10 |
| iniciante, pequeno (3–8) | 3 | 5 | 6 | 8 |
| intermediário, grande (8–16) | 8 | 11 | 12 | 16 |
| intermediário, pequeno (4–10) | 4 | 6 | 7 | 10 |

Como o gerador chega no alvo (regra pura): (1) montar as sessões como hoje; (2) calcular o previsto por grupo com `plannedSetsByGroup`-equivalente no bloco 1; (3) para cada grupo, escolher o total atingível mais próximo do alvo dentro de [mínimo efetivo, teto da seção 4], empate na direção do objetivo (massa e recomp para cima; saúde e perder para baixo); (4) ajustar somando ou tirando 1 série por vez nos exercícios do grupo, sempre dentro de 2 a 5 séries por exercício principal e 2 a 4 por acessório, aplicando a mesma diferença aos três blocos de `s` (mantém a forma da progressão); exercício que aparece em dois treinos vale 2 por unidade. O mínimo efetivo mantém as exceções do ADR 010 (curto sem mínimo; 2 dias com mínimo 2 × séries principais). O tempo (seção 6) vence o alvo.

## 4. Prioridade muscular

Pergunta: peito, costas, ombros, braços, glúteos, pernas, equilibrado (padrão). Soma total N por experiência (dentro de 2 a 4), dividida entre os grupos da opção:

| Opção | Grupos do app | nunca (N = 2) | iniciante (N = 3) | intermediário (N = 4) |
| --- | --- | --- | --- | --- |
| peito | peito | +2 | +3 | +4 |
| costas | costas | +2 | +3 | +4 |
| ombros | ombro-lateral / ombro-posterior / press | +1 / +1 / 0 | +1 / +1 / +1 | +2 / +1 / +1 |
| bracos | biceps / triceps | +1 / +1 | +2 / +1 | +2 / +2 |
| gluteos | posterior-gluteos | +2 | +3 | +4 |
| pernas | quadriceps / posterior-gluteos | +1 / +1 | +2 / +1 | +2 / +2 |
| equilibrado | nenhum | 0 | 0 | 0 |

Regras:
1. Alvo final do grupo = `min(teto, alvoSeries(objetivo) + soma)`. A soma vale sobre o alvo do objetivo (seção 3), no bloco 1.
2. Teto do grupo prioritário = máximo da faixa + excesso: **nunca 0, iniciante 1, intermediário 2**; **sem excesso quando o objetivo efetivo é `perder`** (déficit). Grupos não prioritários: teto = máximo da faixa. Avaliação da sugestão de "até 2 acima do máximo": só faz sentido para quem tem base de recuperação; para nunca e iniciante o excesso fica em 0 e 1 (a verificar).
3. Nunca tirar do mínimo dos outros: se o tempo exigir corte, cortar primeiro os acessórios de grupos não prioritários, nunca abaixo do mínimo efetivo; se não couber, reduzir a soma da prioridade em 1 por vez.
4. Em `gluteos`, as séries extras vão primeiro para o padrão quadril (`hip_b`, `ponte_h`, `ponte`, `ponte_uni`) e só depois para o posterior da coxa. Em `pernas`, quadríceps: primeiro bilateral, depois unilateral.
5. Grupo sem exercício no plano (por exemplo bíceps em `casa_livre`, ou região com dor): a parte dele não é aplicada nem repassada; na revisão: `Não deu para dar mais volume a {grupo} com o seu equipamento.`.
6. Quem marcou menor de 18 ou transtorno alimentar: não oferecer prioridade (fica `equilibrado`). Condição de saúde, amamentação e 60+ usam exp `nunca`: soma 2, excesso 0. A verificar com o dono (dúvida 4).
7. A prioridade soma séries, não exercícios; o limite de exercícios por tempo (seção 7) não muda.

Exemplos (alvos semanais no bloco 1, para os testes):

| Entrada | Alvo do grupo |
| --- | --- |
| nunca, massa, costas | min(8, 8 + 2) = 8 (teto 8, excesso 0) |
| iniciante, recomp, peito | min(11, 8 + 3) = 11 (teto 10 + 1) |
| iniciante, saude, gluteos (posterior-gluteos) | min(11, 6 + 3) = 9 |
| intermediário, massa, ombros | lateral min(12, 10 + 2) = 12; posterior min(12, 10 + 1) = 11; press min(12, 10 + 1) = 11 |
| intermediário, perder, pernas | quadríceps min(16, 11 + 2) = 13; posterior min(16, 11 + 2) = 13 |
| intermediário, massa, peito | min(18, 16 + 4) = 18 (teto 16 + 2) |
| intermediário, perder, peito | min(16, 11 + 4) = 15 (sem excesso) |

## 5. "Treinou nos últimos 3 meses?"

| Item | Regra |
| --- | --- |
| Quando perguntar | Só para `iniciante` e `intermediario`. Resposta padrão: sim. Campo não sensível; pode ser guardado nas respostas. |
| Sim | Nada muda. |
| Não | exp efetiva = `iniciante` para volume (`VOLUME`, `GROUP_RANGES`, `PRINCIPAL_SETS_6_DIAS`), exercícios (Superior B sem puxada vertical, `afundo` e `mesa` no lugar de `bulg` e `stiff`, divisão de 3 dias Corpo inteiro A, B, A) e RIR. Quem marcou `iniciante` já está nessa linha: na prática só muda o intermediário. |
| RIR | Muda só porque o iniciante já usa `RIR_BEGINNER` (sem treino abaixo de 2 em reserva); nenhum RIR novo. |
| Combinação | `effectiveExperience` existente (menor de 18, condição, amamentação, 60+) continua mandando: `nunca` vence. |
| Texto na revisão | `Como você ficou mais de 3 meses sem treinar, o plano começa com o volume de quem está voltando e sobe aos poucos, de 4 em 4 semanas. Se as primeiras semanas ficarem fáceis, refaça o assistente.` |

## 6. Tempo por sessão

### 6.1 Modelo de estimativa (minutos = segundos / 60, arredondar para cima)

`total = G + W + Σ T + Σ_exercícios [ s × E + (s − 1) × R ]`, calculado com o maior `s` entre os blocos (pior bloco) e com os exercícios que o gerador realmente colocou (já sem vagas puladas).

| Parte | Valor | Observação |
| --- | --- | --- |
| G, aquecimento geral | 5 min | Todos os tempos e locais. |
| W, aquecimento específico | 2 séries de aproximação no primeiro principal com carga (`m` = `kg`) do treino; 1 série em cada um dos demais principais com carga. Cada série = 75 s (30 s de execução + 45 s para trocar a carga) | Principais sem carga (`rep`, `bw`) e acessórios: 0. Em treino de 4 principais com carga: 150 + 3 × 75 = 375 s. |
| E, execução por série | 40 s; 80 s se o exercício é "por lado" ou "por perna" (unilateral); `m` = `s`: máximo da faixa em segundos (mínimo 20), ×2 se por lado; faixa com topo de 20 repetições ou mais: 60 s | Valor médio, a verificar. |
| R, descanso entre séries | `rest` do exercício | Conta `s − 1` vezes. |
| T, transição entre exercícios | 60 s na academia, 45 s em casa; conta uma por exercício (inclui chegar ao primeiro) | Ir ao aparelho, ajustar. |

Ajuste proposto em `VOLUME` (a verificar): descanso do exercício principal com carga passa a depender do tempo: **curto 90 s; médio 120 s (todas as experiências); longo como hoje (nunca e iniciante 120 s, intermediário 150 s)**. Acessórios 60 s e core 45 s não mudam. Sem esse ajuste, o intermediário em médio estimaria de 66 a 69 min e o curto passaria de 50 min.

Encaixe (se a estimativa passar do máximo do tempo escolhido; ordem de corte):
1. Tirar 1 série dos acessórios no bloco mais pesado (mínimo 2), do último para o primeiro.
2. Tirar 1 série dos principais no bloco mais pesado (mínimo 2).
3. Remover a última vaga, enquanto restarem o mínimo de exercícios da seção 7.
Se ainda passar: aceitar e registrar `duracao-reduzida`-equivalente na revisão (`Alguns treinos podem passar do tempo escolhido.`). Estimativa abaixo do mínimo prometido (por exemplo bloco 1 do iniciante em longo) é aceita; se a estimativa ficar mais de 5 min abaixo do mínimo e houver vaga na lista, incluir a próxima vaga.

### 6.2 Exemplos de sessões (academia, pior bloco)

| # | Sessão | Parâmetros | Estimativa | Dentro de |
| --- | --- | --- | --- | --- |
| 1 | nunca, Corpo inteiro A, curto: `leg`, `supino`, `puxada`, `hip_b` (3 séries, descanso 90 s) | 4 × 300 s = 1200 s; T 4 min; G 5; W 6,25 | 35 min | curto (30 a 45) |
| 2 | iniciante, Corpo inteiro A, curto (4 séries no bloco 3, descanso 90 s) | 4 × 430 s = 1720 s; T 4; G 5; W 6,25 | 44 min | curto |
| 3 | intermediário, Superior A, curto: `supino`, `puxada`, `press_b`, `remada_b` (4 séries, 90 s) | igual ao 2 | 44 min | curto |
| 4 | iniciante, Corpo inteiro A, médio, 6 exercícios, bloco 3, descanso 120 s: 4 principais × 520 s + `lat_a` 3 séries 240 s + `pallof` 3 séries 330 s | 2650 s; T 6; G 5; W 6,25 = 62 min; depois do passo 1 (acessórios 3→2 séries, −225 s) | 58 min | médio (45 a 60) |
| 5 | intermediário, Superior A, médio, bloco 3, descanso 120 s: 4 principais × 520 s + `lat_a` e `rosca_a` com 4 séries (340 s cada) | 2760 s; T 6; G 5; W 6,25 = 64 min; depois do passo 1 (acessórios 4→3, −200 s) | 60 min | médio |
| 6 | intermediário, Corpo inteiro A, longo, 8 exercícios, bloco 3, descanso 150 s: 4 × 610 s + 340 + 455 + 340 + 340 | 3915 s; T 8; G 5; W 6,25 | 85 min | longo (60 a 90) |
| 7 | iniciante, Corpo inteiro A, longo, 8 exercícios | bloco 3: 71 min; bloco 1: 54 min | 54 a 71 min | longo (bloco 1 um pouco abaixo; aceito) |

Pernas A (iniciante, médio, bloco 3) estima cerca de 52 min. Em casa a transição é menor e quase não há aquecimento específico (poucos principais com carga), então as estimativas caem.

### 6.3 Textos prometidos

Confirmados sem mudança: `curto` "30 a 45 min", `medio` "45 a 60 min", `longo` "60 a 90 min" (`DURATION_TEXT`). Condição: o encaixe da seção 6.1 e o descanso por tempo. Sem o ajuste de descanso e sem encaixe, "30 a 45 min" e "45 a 60 min" não se sustentam para quem treina com 4 séries por exercício. Opcional, a verificar: mostrar na revisão a estimativa "cerca de {n} min por treino" ao lado do texto.

## 7. Mínimo de variedade

| Tempo | Mínimo | Adequado | Observação |
| --- | --- | --- | --- |
| curto | 4 | 4 (`SLOT_COUNT`) | Com 4 exercícios cabe 1 por padrão principal; é o limite do tempo, não falta de variedade. |
| médio | 5 | 6 | Sessão com menos de 5 é inaceitável: confirmado. |
| longo | 5 | 7 a 8 | Idem. |

Regra: depois de pular vagas (null, repetidas, dor), se restarem menos de 5 exercícios em médio ou longo, completar com o primeiro destes que ainda não esteja no treino e não esteja evitado: academia `pallof`, `prancha`, `pant_sent`, `mesa`, `face`; casa `deadbug`, `prancha`, `pant_degrau`, `ytw`, `ponte`. Se ainda faltar (caso extremo: 60+ em `casa_livre` com dor no joelho em Pernas), aceitar com 4 e mostrar `Poucos exercícios disponíveis com as suas limitações.`. Teste: nenhuma combinação válida do assistente gera sessão de médio ou longo com menos de 5 exercícios, exceto esse caso extremo (que o teste deve listar).

## 8. Para quem implementa

- `backend-dados`: nada além do que já está feito nos dois JSON (seção 1); conferir testes que contam exercícios do catálogo ou do guia.
- `frontend` (funções puras, com exemplos das seções 2 a 7): `avoidListFor(regions)`, `targetSets(exp, goal, kind)`, `priorityBoost(exp, option)`, `groupCap(exp, goal, group, prioritized)`, `effectiveExpForVolume(answers)`, `estimateMinutes(session, place)` e `fitToDuration(...)`. Os números ficam em constantes nomeadas.
- Testes sugeridos: tabelas das seções 3 e 4 (alvos), seção 2.3 (trocas), seção 6.2 (estimativas, tolerância de 1 min), seção 7 (mínimos).

## 9. Dúvidas ao dono (recomendação primeiro; resposta curta basta)

1. Casa com elástico: criar o local "Em casa, só com elástico" (recomendo) ou deixar `rosca_elastico` e `lat_elastico` só como troca em `casa_equip` (hoje sem halter e sem bíceps/lateral em `casa_livre`)?
2. Dor: guardar as regiões marcadas junto com as respostas (recomendo que NÃO, por ser dado de saúde, como o passo 0)? E nos casos sem alternativa (costas em casa sem equipamento com dor lombar; empurrar em casa sem equipamento com dor em punho ou cotovelo), aceitar o treino sem esse padrão (recomendo, com aviso na revisão)?
3. Objetivo `perder` na posição 0,33 da faixa (recomendo), em vez de 0,25 ou 0,5?
4. Prioridade muscular: esconder a pergunta para menor de 18 e transtorno alimentar (recomendo) e limitar o excesso acima do máximo a 0 (nunca), 1 (iniciante) e 2 (intermediário), sem excesso em `perder` (recomendo)?
5. Descanso dos exercícios principais: 90 s no curto e 120 s no médio (recomendo, para caber nos tempos prometidos) ou manter 120 e 150 s e aceitar treinos mais longos que o prometido?
6. "Treinou nos últimos 3 meses?": perguntar só a quem marcou intermediário (recomendo, pois para iniciante não muda nada) ou a ambos, como você pediu?
