# Conteúdo: assistente de início (plano e metas para iniciante)

Data: 19/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: PROPOSTA (depende do dono, ver seção 9).
ADR: [008-assistente-de-inicio.md](../decisoes/008-assistente-de-inicio.md). Base: `docs/ESPECIFICACAO.md` (3, 4, 9), `data/plan.json`, ADR 007, `src/domain/dietTargets.ts`, `src/domain/profile.ts`, `src/domain/dayActivity.ts`.

**Revisão de 20/11/2026:** gestação, condição de saúde, 60 anos ou mais, descanso sem carga, duração de quem nunca treinou e escolha de dias foram alterados por [conteudo-revisao-10-perfis.md](conteudo-revisao-10-perfis.md) (ADR 012). Onde houver conflito, vale a revisão.

Tudo aqui é regra pura e determinística: mesma resposta, mesmo resultado. Números de referência e afirmações científicas estão marcados **(a verificar)**; nenhum estudo foi conferido nesta passada.

## 1. Perguntas (7 passos + 1 de segurança)

| # | Pergunta | Opções (chave) | Obrigatória | Padrão |
| --- | --- | --- | --- | --- |
| 0 | Segurança (antes de tudo) | `menor18`, `gestacao` (gestante ou amamentando), `condicao` (doença do coração, pressão alta, diabetes, doença nos rins, lesão ou cirurgia recente, outra em acompanhamento), `transtorno` (transtorno alimentar atual ou passado), `nenhum` | Sim (pode marcar várias) | nenhuma marcada; o botão "Nenhuma dessas" precisa ser tocado |
| 1 | Objetivo | `perder` (perder gordura), `massa` (ganhar massa), `recomp` (as duas coisas), `saude` (saúde e condicionamento) | Sim | `saude` pré-selecionado |
| 2 | Experiência | `nunca`, `iniciante` (menos de 1 ano ou parado há mais de 6 meses), `intermediario` (1 ano ou mais, com regularidade) | Sim | `nunca` |
| 3 | Dias por semana para musculação | 2, 3, 4, 5, 6 | Sim | 3 |
| 4 | Tempo por treino | `curto` (30 a 45 min), `medio` (45 a 60 min), `longo` (60 a 90 min) | Sim | `medio` |
| 5 | Onde treina | `academia`, `casa_equip` (casa com halteres, elástico e um banco ou cadeira firme), `casa_livre` (casa sem equipamento) | Sim | `academia` |
| 6 | Outras atividades fixas | `luta` (jiu-jitsu ou outra), `esporte` (vôlei, futebol, etc.), `corrida`, `nenhuma`; para cada uma, os dias da semana | Não | `nenhuma` |
| 7 | Dados físicos | sexo para a fórmula (`m`, `f`, `nao_informar`), idade, altura, peso; e rotina fora do treino: `pouco` (sentado a maior parte do dia), `moderado` (em pé ou andando parte do dia), `muito` (trabalho físico) | Não (todo o passo pode ser pulado) | vazio; rotina `pouco` |

Faixas de entrada reaproveitam `validateProfile`: idade 10 a 100, altura 100 a 250 cm, peso 30 a 300 kg. Idade, altura e peso entram no Perfil (`profile`); sexo e rotina são campos novos do assistente (ver seção 8). Para calcular metas é preciso idade, altura e peso; o sexo é opcional (usa média).

## 2. Divisão de treino

### 2.1 Quantos dias de musculação

Atualizado em 25/11/2026 (ADR 014, `conteudo-dias-pedidos.md`): não há mais teto por experiência.

```
fixas = número de dias com outra atividade (0 a 7)
dias = respostaDias
se transtorno alimentar: dias = min(dias, 4)        // daysReason 'teto'
se dias + fixas > 6: dias = max(2, 6 - fixas)       // daysReason 'atividades'
se fixas >= 6: dias = 2 e mostrar o aviso "semana-cheia"
```
Motivo: decisão do dono (respeitar os dias pedidos); pelo menos 1 dia de descanso por semana (a verificar).

### 2.2 Modelo pela quantidade de dias e experiência

| dias | nunca / iniciante | intermediário |
| --- | --- | --- |
| 2 | Corpo inteiro A, B | Corpo inteiro A, B |
| 3 | Corpo inteiro A, B, A (semana seguinte B, A, B: na prática o app usa a rotina fixa A, B, A) | Superior A, Pernas A, Corpo inteiro B |
| 4 | Superior A, Pernas A, Superior B, Pernas B | igual |
| 5 | Superior (= Superior B), Pernas A, Empurrar, Puxar, Pernas B | igual |
| 6 | Empurrar, Puxar, Pernas A, Empurrar, Puxar, Pernas B (iniciante: principais com 2 séries no bloco 1) | igual |

Nomes obrigatórios: os treinos de perna têm "Pernas" no nome para `dayTypeOf` (regex `/lower|perna/i`) os classificar como dia de perna. "Corpo inteiro" e "Superior" viram dia de academia.

### 2.3 Dias da semana (0 = segunda)

Ordem preferida por quantidade: 2 → [0, 3]; 3 → [0, 2, 4]; 4 → [0, 1, 3, 4]; 5 → [0, 1, 2, 4, 5]; 6 → [0, 1, 2, 3, 4, 5].
Algoritmo: (1) dias com atividade fixa ficam com ela (`luta` → `{k:'bjj', gi:true}`; `esporte` e `corrida` → ver seção 9, item 3); (2) percorrer a ordem preferida e depois os dias restantes de 0 a 6, pegando os livres até completar; (3) atribuir os treinos na ordem da tabela; (4) se um treino de "Pernas" cair na véspera ou no próprio dia de luta, esporte ou corrida, trocar com o próximo treino que não seja de pernas (uma passada só); (5) os demais dias ficam `{k:'rest'}`. Regra de fundo: pernas pesadas 36 a 48 h longe da luta e do esporte (seção 3 da especificação).

## 3. Exercícios

### 3.1 Vagas por treino (ordem de prioridade)

Cada treino é uma lista de vagas. O tempo define quantas entram, pegando as primeiras: `curto` 4, `medio` 6, `longo` 8 (Corpo inteiro) ou 7 (Superior e Pernas).

- **Corpo inteiro A:** joelho, empurrar horizontal, puxar vertical, quadril, ombro lateral, core, bíceps, panturrilha.
- **Corpo inteiro B:** quadril, empurrar vertical, puxar horizontal, unilateral, ombro posterior, core, tríceps, panturrilha.
- **Superior A:** empurrar horizontal, puxar vertical, empurrar vertical, puxar horizontal, ombro lateral, bíceps, tríceps.
- **Corpo inteiro B, quando a divisão tem 2 dias** (inclui semana cheia): quadril, empurrar inclinado, puxar horizontal, unilateral, ombro posterior, core, tríceps, panturrilha; subtítulo `Pernas, peito, costas e core` (ver `conteudo-ajuste-volume-assistente.md`).
- **Superior B (intermediário):** puxar horizontal, empurrar inclinado, puxar vertical, ombro lateral, ombro posterior, tríceps, bíceps.
- **Superior B (nunca e iniciante):** puxar horizontal, empurrar inclinado, ombro lateral, ombro posterior, tríceps, bíceps, empurrar vertical.
- **Pernas A:** joelho, quadril, unilateral, posterior isolado, panturrilha, core, core 2.
- **Pernas B:** quadril, joelho 2, unilateral, posterior isolado, panturrilha, core, core 2.
- **Empurrar (ADR 014):** empurrar horizontal, empurrar inclinado, empurrar vertical, ombro lateral, tríceps, ombro posterior, core.
- **Puxar (ADR 014):** puxar vertical, puxar horizontal, ombro posterior, bíceps, ombro lateral, core 2, core.

### 3.2 Exercício por vaga e local

IDs existentes de `data/plan.json` sem marca; novos com `*` (seção 3.3). Para `nunca` na academia, as vagas marcadas com (n) usam a opção entre parênteses.

| Vaga | Grupo (`g`) | academia | casa_equip | casa_livre |
| --- | --- | --- | --- | --- |
| joelho | quadríceps | `agach` (n: `leg`) | `goblet`* | `agach_livre`* |
| joelho 2 | quadríceps | `leg` | `goblet`* | `agach_livre`* |
| quadril | posterior e glúteos | `hip_b` | `ponte_h`* | `ponte_uni`* |
| unilateral | quadríceps | `afundo` (n: `afundo`; intermediário: `bulg`) | `bulg` | `afundo_livre`* |
| posterior isolado | posterior e glúteos | `mesa` | `stiff` | `stiff_uni`* |
| empurrar horizontal | peito | `supino` | `supino_chao`* | `flexao`* |
| empurrar inclinado | peito | `inclinado` | `supino_chao`* | `flexao`* |
| empurrar vertical | press | `press_b` | `press_b` | `pike`* |
| puxar vertical | costas | `puxada` | `puxada_elastico`* | `remada_mochila`* |
| puxar horizontal | costas | `remada_b` | `remada_b` | `remada_mochila`* |
| ombro lateral | ombro lateral | `lat_a` | `lat_a` | `ytw`* |
| ombro posterior | ombro posterior | `face` | `face_elastico`* | `ytw`* |
| bíceps | bíceps | `rosca_a` | `rosca_a` | (pula a vaga) |
| tríceps | tríceps | `tri_a` | `tri_b` | `flexao_fechada`* |
| panturrilha | panturrilha | `pant_pe` | `pant_degrau`* | `pant_degrau`* |
| core | core | `pallof` | `deadbug`* | `deadbug`* |
| core 2 | core | `prancha`* | `prancha`* | `prancha`* |

Regras: se a mesma ID cair duas vezes no mesmo treino (por exemplo `ytw` ou `remada_mochila` em casa_livre), a segunda vaga é pulada e entra a próxima da lista; vaga pulada não conta no limite de tempo. Ficam fora do assistente para iniciante: `nordic`, `salto_l`, `salto_b`, `roll`, `copen_l`, `copen_b`, `med`, `pescoco`, `barra`, `farmer`, `joelhos` (técnica ou impacto maiores; a pessoa pode adicioná-los depois). `stiff` na academia só para `intermediario`, no lugar de `mesa`.

### 3.3 Exercícios novos necessários (formato de `plan.ex`)

`s` e `r` abaixo são os do perfil `iniciante`; a seção 4 diz como trocar por experiência. Todos com `g` (campo previsto na seção 8 da especificação).

| id | `n` | `g` | `m` | `s` | `r` | `rest` | `t` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `goblet` | Agachamento goblet com halter | quadríceps | kg | [3,3,4] | ["8–12","8–10","6–10"] | 120 | Halter junto ao peito, desça até onde mantiver a coluna neutra. |
| `agach_livre` | Agachamento livre com peso do corpo | quadríceps | rep | [3,3,4] | ["12–20","12–20","15–25"] | 90 | Fácil demais? Faça a descida em 3 segundos. |
| `ponte_h` | Ponte de glúteo com halter | posterior e glúteos | kg | [3,3,4] | ["10–15","10–15","8–12"] | 90 | Halter sobre o quadril, aperte o glúteo no alto. |
| `ponte_uni` | Ponte de glúteo com uma perna | posterior e glúteos | rep | [3,3,4] | ["8–12","10–15","12–15"] | 60 | Repetições por lado. Comece com as duas pernas se precisar. |
| `afundo_livre` | Afundo com peso do corpo | quadríceps | rep | [2,3,3] | ["8–12","10–15","12–15"] | 60 | Repetições por perna. Apoie a mão na parede se perder o equilíbrio. |
| `stiff_uni` | Stiff com uma perna, sem carga | posterior e glúteos | rep | [2,3,3] | ["8–12","10–12","10–15"] | 60 | Repetições por perna. Coluna neutra, quadril vai para trás. |
| `supino_chao` | Supino no chão com halteres | peito | kg | [3,3,4] | ["8–12","8–10","6–10"] | 120 | Deitado no chão; o cotovelo encosta e sobe. |
| `flexao` | Flexão de braço | peito | rep | [3,3,4] | ["5–12","8–15","10–20"] | 90 | Se não sair 5, faça com as mãos num apoio alto ou de joelhos. |
| `flexao_fechada` | Flexão com mãos próximas | tríceps | rep | [2,3,3] | ["5–10","6–12","8–15"] | 60 | Cotovelos junto ao corpo. Use apoio alto se precisar. |
| `pike` | Flexão pike (ombros) | press | rep | [2,3,3] | ["5–10","6–12","8–12"] | 90 | Quadril alto, cabeça vai em direção ao chão entre as mãos. |
| `puxada_elastico` | Puxada com elástico | costas | rep | [3,3,4] | ["10–15","10–15","12–15"] | 90 | Elástico preso no alto da porta, puxe até o queixo. |
| `remada_mochila` | Remada curvada com mochila | costas | kg | [3,3,4] | ["10–15","10–15","8–12"] | 90 | Mochila com livros ou garrafas; anote o peso aproximado. Coluna neutra. |
| `face_elastico` | Face pull com elástico | ombro posterior | rep | [2,3,3] | ["12–15","12–15","15–20"] | 60 | Puxe em direção ao rosto, cotovelos altos. |
| `ytw` | Y, T e W deitado de bruços | ombro posterior | rep | [2,2,3] | ["8–10","10–12","10–12"] | 45 | Repetições de cada letra. Movimento lento. |
| `pant_degrau` | Panturrilha num degrau | panturrilha | rep | [2,3,3] | ["12–20","12–20","15–25"] | 45 | Segure no corrimão; desça o calcanhar e suba devagar. |
| `deadbug` | Dead bug | core | rep | [2,3,3] | ["6–8","8–10","8–12"] | 45 | Repetições por lado. Lombar encostada no chão. |
| `prancha` | Prancha | core | s | [2,3,3] | ["20–30","30–40","30–45"] | 45 | Segundos. Corpo reto, sem afundar o quadril. |

Faixas e tempos de descanso acima são escolhas de produto coerentes com o plano atual (a verificar). `g` também deve ser preenchido nas IDs existentes usadas (seção 3.2) para o gráfico por grupo.

## 4. Volume, repetições, RIR e semana leve

### 4.1 Séries e repetições por experiência

Cada vaga é **principal** (joelho, joelho 2, quadril, empurrar horizontal/inclinado/vertical, puxar vertical/horizontal) ou **acessória** (as demais). O assistente sobrescreve `s` e, para exercícios com `m` `kg` ou `bw`, também `r`:

| Experiência | principal `s` | principal `r` | acessória `s` | acessória `r` | `rest` principal / acessória |
| --- | --- | --- | --- | --- | --- |
| nunca | [2,3,3] | ["10–12","8–12","8–12"] | [2,2,3] | ["12–15","12–15","10–15"] | 120 / 60 |
| iniciante | [3,3,4] | ["8–12","8–10","6–10"] | [2,3,3] | ["12–15","10–15","10–12"] | 120 / 60 |
| intermediario | [3,4,4] | ["6–10","6–8","5–8"] | [3,3,4] | ["10–12","10–12","8–12"] | 150 / 60 |

Exercícios com `m` `rep` ou `s` mantêm o `r` da seção 3.3 (faixa progressiva de repetições ou segundos) e só trocam `s`. Core usa `rest` 45.

### 4.2 Alvo semanal por grupo (verificação, não gera nada)

Faixa de séries semanais por grupo no bloco 1 (soma de `s[0]` por `g`, contando cada treino tantas vezes quantas aparece na rotina) (a verificar): nunca 4 a 8; iniciante 6 a 10; intermediário 8 a 16 (era 14; ajuste de 19/11/2026, ADR 010). O teste confere que, para cada perfil da seção 7, peito, costas, quadríceps e posterior e glúteos nunca passam do máximo e não ficam abaixo do mínimo, com duas exceções: tempo `curto` não tem mínimo; com 2 dias, o mínimo é 2 × séries principais do bloco 1 (nunca 4, iniciante 6, intermediário 6), porque 1 exercício principal por grupo em cada um dos 2 treinos é o teto natural sem alongar a sessão. Regra exata e valores por perfil: `conteudo-ajuste-volume-assistente.md`. Fonte citada de memória: volume e frequência de 2 vezes por semana por grupo, Schoenfeld, Ogborn e Krieger (2016 e 2017) (a verificar).

### 4.3 RIR e semana leve

- Semana leve (deload) igual à de hoje: semanas 4, 8 e 12, metade das séries pelo motor atual (`setsForWeek`). Nada muda no motor.
- RIR (repetições em reserva) para quem marcou `nunca` ou `iniciante`: proposta `3, 3, 3, 4, 2–3, 2–3, 2, 4, 2, 2, 2, 4` (nunca abaixo de 2). Exige um campo opcional de RIR por plano (`plan.rir`, 12 textos); sem ele, o app usa a sequência atual da especificação. Proximidade da falha: Refalo et al. (2023) (a verificar).
- Progressão: a dupla progressão atual, sem mudança. Para exercícios `rep`/`s`: quando todas as séries chegam ao topo da faixa, vale ir para a variação mais difícil indicada na nota.

## 5. Duração do plano

Manter **12 semanas**. Motivos: o calendário, os blocos, a semana leve, a Agenda e os testes já dependem de 12 semanas; 12 semanas são tempo suficiente para o iniciante aprender os movimentos e ver progresso de carga; ao concluir, o app oferece montar o próximo plano pelo assistente (com a experiência sugerida subindo um nível). Outra duração exigiria mudar o motor de calendário, sem ganho claro.

## 6. Metas de dieta

### 6.1 Quando NÃO calcula

Se marcar `menor18`, `gestacao`, `condicao` ou `transtorno` no passo 0, ou se faltar idade, altura ou peso: **não gera metas personalizadas**. Fica a meta de exemplo atual (`settings.dietTargets` intacto, selo "Meta de exemplo") e aparece o texto da seção 10 (passo de segurança ou "sem dados"). Nos quatro casos de segurança, o objetivo `perder` é tratado como `saude` em todo o texto e nenhum déficit é proposto. Pendência do dono: se, nesses casos, a aba Dieta deve esconder as metas numéricas (recomendo para `transtorno`).

### 6.2 Fórmulas (todas a verificar)

```
s = { m: 5, f: -161, nao_informar: -78 }        // -78 = média de +5 e -161
TMB = 10*peso + 6,25*altura - 5*idade + s      // Mifflin-St Jeor (a verificar)
F = { pouco: 1,2; moderado: 1,3; muito: 1,45 } // rotina fora do treino (a verificar)
extra = { descanso: 0, academia: 200, perna: 250, jiujitsu: 350, volei: 300 }  // kcal do treino (a verificar)
IMC = peso / (altura/100)^2
objetivoEfetivo = objetivo
  se objetivo = perder e IMC < 18,5: saude      (aviso "imc-baixo")
  se objetivo = massa  e IMC >= 30:   saude     (aviso "imc-alto-massa")
ajuste = { perder: -0,20; recomp: -0,10; massa: +0,10; saude: 0 }[objetivoEfetivo]
r50(x) = Math.round(x/50)*50
kcal[t] = r50((TMB*F + extra[t]) * (1 + ajuste))
kcal[t] = min(4500, max(kcal[t], r50(TMB), 1400))   // nunca abaixo da TMB nem de 1.400
pesoRef = IMC > 30 ? 25 * (altura/100)^2 : peso
proteina = r5(pesoRef * { perder: 2,0; recomp: 2,0; massa: 1,8; saude: 1,6 }[objetivoEfetivo])   // r5 = Math.round(x/5)*5
gordura = max(40, r5(0,8 * pesoRef))
carb[t] = carbsFromRest(kcal[t], proteina, gordura)
agua = min(4, max(2, Math.round(0,035*peso*2)/2))
```
Saída: um `DietTargets` com os 5 tipos de dia sempre preenchidos (mesmo os que a rotina não usa), `proteinG` manual (número, não `null`, porque o g/kg do assistente difere do automático de 2,4), `fatG`, `waterL`. Salvo com `withDietTargetsVersion(atual, hoje, metas)`; deve passar em `validateDietTargets` sem erro. Limites de `LIMITS` sempre respeitados pelas fórmulas (kcal 1.400 a 4.500 está dentro de 1.000 a 6.000; gordura ≥ 40; água 2 a 4).

Tipos de dia: `jiujitsu` vale para qualquer luta; `volei` vale para esporte e corrida (ver seção 9, item 3). O tipo `perna` só aparece se houver treino "Pernas".

Proteína alta e déficit leve seguem o contexto do plano padrão; para `perder` o déficit é de 20% (mais agressivo que o padrão do app), compensado pelo piso da TMB. Distribuição de proteína: Schoenfeld e Aragon (2018) (a verificar).

## 7. Exemplos de entrada e saída (testes unitários)

Legenda: obj, exp, dias pedidos, tempo, local, atividades fixas (dia), sexo/idade/altura/peso/rotina. Saída kcal em descanso / academia / perna / jiu-jitsu / vôlei; carb na mesma ordem; P, G em g; água em L.

| # | Entrada | Treino | kcal | carb | P / G / água |
| --- | --- | --- | --- | --- | --- |
| 1 | recomp, iniciante, 3, medio, academia, nenhuma; m/30/175/80/pouco | Corpo inteiro A, B, A em seg, qua, sex; 6 exercícios | 1900 / 2050 / 2100 / 2200 / 2150 | 169 / 206 / 219 / 244 / 231 | 160 / 65 / 3 |
| 2 | perder, nunca, 3, curto, casa_livre, nenhuma; f/25/162/60/moderado | Corpo inteiro A, B, A; 4 exercícios; `flexao`, `agach_livre` etc. | 1400 (piso) / 1550 / 1600 / 1650 / 1600 | 118 / 155 / 168 / 180 / 168 | 120 / 50 / 2 |
| 3 | saude, nunca, 2, curto, casa_equip, nenhuma; sem dados | Corpo inteiro A, B em seg, qui | meta de exemplo (nada salvo) | exemplo | exemplo |
| 4 | massa, iniciante, 4, medio, academia, nenhuma; m/22/180/70/pouco | Superior A, Pernas A, Superior B, Pernas B em seg, ter, qui, sex | 2250 / 2500 / 2550 / 2650 / 2600 | 314 / 376 / 389 / 414 / 401 | 125 / 55 / 2,5 |
| 5 | recomp, iniciante, 3, medio, academia, luta (seg, qui); f/35/165/70/moderado | seg e qui ocupados; preferidos livres qua e sex, depois ter; Corpo inteiro A, B, A em ter, qua, sex; luta seg e qui | 1650 / 1800 / 1850 / 1950 / 1900 | 149 / 186 / 199 / 224 / 211 | 140 / 55 / 2,5 |
| 6 | perder, nunca, 3, medio, academia, nenhuma; m/40/178/105/pouco (IMC 33,1) | Corpo inteiro A, B, A; `leg` no lugar de `agach` | 1950 (piso TMB) / 2050 / 2100 / 2150 / 2150 | 181 / 206 / 219 / 231 / 231 | 160 (peso de referência 79,2) / 65 / 3,5 |
| 7 | recomp, nunca, 3, medio, academia; marca `menor18`, 16 anos | Corpo inteiro A, B, A; RIR para iniciante | não calcula; meta de exemplo; aviso "menor18" | — | — |
| 8 | perder, iniciante, 3, medio, casa_equip; marca `gestacao` | Corpo inteiro A, B, A; aviso para liberar o treino com o médico | não calcula | — | — |
| 9 | perder, iniciante, 4, medio, academia; marca `transtorno` | Superior/Pernas 4 dias | não calcula; sem déficit; aviso "transtorno" | — | — |
| 10 | perder, iniciante, 3, medio, academia; f/28/160/47/moderado (IMC 18,4) | Corpo inteiro A, B, A | objetivo vira saude: 1500 / 1700 / 1750 / 1850 / 1800 | 210 / 260 / 273 / 298 / 285 | 75 / 40 / 2 (piso) |
| 11 | saude, intermediario, 5, longo, academia, corrida (dom); nao_informar/45/170/75/muito | 5 + 1 = 6, ok; Superior A, Pernas A, Superior B, Pernas B, Corpo inteiro A em seg, ter, qua, sex, sáb; sáb é véspera da corrida e recebe Corpo inteiro (não Pernas), sem troca | 2200 / 2400 / 2450 / 2550 / 2500 | 295 / 345 / 358 / 383 / 370 | 120 / 60 / 2,5 |
| 12 | perder, nunca, 6, medio, academia, luta (seg, ter, qui), esporte (sáb); m/30/175/80/pouco | teto 3; 3 + 4 > 6, então 2 dias: Corpo inteiro A, B em qua, sex | 1750 (piso TMB) / 1850 / 1900 / 1950 / 1900 | 131 / 156 / 169 / 181 / 169 | 160 / 65 / 3 |
| 13 | recomp, intermediario, 4, curto, casa_equip, nenhuma; sem dados | Superior A, Pernas A, Superior B, Pernas B; 4 exercícios por treino | meta de exemplo | — | — |
| 14 | perder, iniciante, 3, medio, academia; marca `condicao` (pressão alta) | Corpo inteiro A, B, A | não calcula; aviso "condicao" | — | — |
| 15 | massa, intermediario, 2, longo, academia, nenhuma; m/30/175/80/pouco | Corpo inteiro A, B em seg, qui; 8 exercícios | 2300 / 2550 / 2600 / 2700 / 2650 | 284 / 346 / 359 / 384 / 371 | 145 / 65 / 3 |

Volume semanal no bloco 1 (peito / costas / quadríceps / posterior e glúteos; seção 4.2): 1, 5, 8, 10, 14 = 6 / 9 / 8 / 9; 2, 6, 7 = 4 / 6 / 6 / 6; 3 = 4 / 4 / 4 / 4 (Corpo inteiro B com inclinado: `supino_chao`); 4, 9 = 6 / 9 / 10 / 10 (Superior B sem puxada vertical); 11 = 9 / 15 / 15 / 15; 12 = 4 / 4 / 4 / 4 (Corpo inteiro B com `inclinado`); 13 = 6 / 12 / 12 / 12; 15 = 6 / 6 / 6 / 6 (2 dias, mínimo 6; Corpo inteiro B com `inclinado`).

Conta do perfil 1 (para conferir o teste): TMB = 800 + 1093,75 − 150 + 5 = 1748,75; ×1,2 = 2098,5; descanso 2098,5 × 0,9 = 1888,65 → 1900; carb descanso = (1900 − 640 − 585) / 4 = 168,75 → 169.
Conta do perfil 15: base 2098,5; ×1,1: descanso 2308,35 → 2300; academia 2528,35 → 2550; perna 2583,35 → 2600; jiu-jitsu 2693,35 → 2700; vôlei 2638,35 → 2650; P = r5(144) = 145; carb descanso (2300 − 580 − 585)/4 = 283,75 → 284; academia (2550 − 1165)/4 = 346,25 → 346.

Exemplos de divisão sem dieta, para o teste de `planFromAnswers`: (a) intermediário, 3 dias, sem atividade → Superior A seg, Pernas A qua, Corpo inteiro B sex; (b) iniciante, 6 dias → teto 4; (c) nunca, 5 dias → 3; (d) casa_livre, Corpo inteiro A, medio → `agach_livre`, `flexao`, `remada_mochila`, `ponte_uni`, `ytw`, `deadbug` (bíceps pulado; a 6ª vaga é core); (e) luta todos os dias (7) → 2 dias de musculação e aviso "semana-cheia" (os 2 treinos ficam nos dias de menor índice entre os preferidos, coexistindo com a luta; ver seção 9, item 4).

## 8. Quem já usa o app e o plano de exemplo

- **Primeira abertura sem dados** (sem `log`, `done`, `meas`, `settings.dietTargets` e com o plano igual à semente): tela de boas-vindas com "Montar meu plano" (assistente), "Usar o plano de exemplo" (o plano atual de `data/plan.json` e as metas de exemplo, como hoje) e "Explorar primeiro" (igual ao exemplo, e o convite volta no Perfil).
- **Quem já usa:** o assistente nunca abre sozinho. Fica em Perfil, "Refazer meu plano". Antes de aplicar, uma tela de revisão mostra o que muda (treinos, rotina, metas) e pede confirmação. Ao aplicar: (1) guarda um instantâneo de `plan`, `sched`, `start` e `settings.dietTargets` anteriores; (2) troca o plano e a rotina; (3) metas entram como nova versão a partir de hoje (dias passados mantêm a meta do momento, ADR 007); (4) registros, notas e medidas não são tocados; IDs repetidas (`supino`, `leg`...) continuam o histórico de carga; (5) aviso com "Desfazer" e, em Perfil, "Voltar ao plano anterior" enquanto houver instantâneo (1 nível, substituído no próximo uso do assistente).
- **Data de início:** passo final pergunta "Começar quando?" com padrão na próxima segunda-feira; quem já usa pode manter a data atual.
- **Respostas guardadas:** em `settings.onboarding` (respostas, data, versão do conteúdo `1`) para refazer com tudo preenchido. Sexo e condição de saúde são dados sensíveis: ficam só neste aparelho, entram no backup e podem ser apagados em Perfil. Recomendo não guardar as marcações do passo 0, só o resultado ("não calcular metas").

## 9. Pendências que dependem do dono

1. Aprovar os números marcados "a verificar" (fatores 1,2/1,3/1,45, extras por tipo de dia, déficit de 20% e 10%, g/kg de proteína, pisos) ou revisá-los com nutricionista antes de divulgar.
2. Menores de 18: o assistente monta treino com RIR conservador e não calcula dieta (proposta), ou bloqueia o assistente inteiro.
3. Esporte e corrida: hoje a rotina só tem `bjj`, `volei`, `gym` e `rest`. Proposta mínima: usar `volei` com rótulo "Esporte" quando vier do assistente (exige um campo de rótulo no dia da rotina). Alternativa: novo tipo `esporte`. Sem decisão, só `luta` e `esporte = vôlei` funcionam por completo.
4. Semana com atividade fixa em 6 ou 7 dias: aceitar musculação no mesmo dia da atividade (proposta) ou recomendar só a atividade.
5. RIR próprio para iniciante (`plan.rir`) ou manter a sequência atual para todos.
6. Esconder metas numéricas na aba Dieta quando houver `transtorno`.

## 10. Textos dos passos (pt-BR, glossário de `revisao-textos-ptbr.md`)

**Boas-vindas.** Título: `Vamos montar seu plano`. Texto: `Responda 7 perguntas rápidas e o app monta seus treinos e suas metas de dieta. Você pode mudar tudo depois.` Botões: `Montar meu plano`, `Usar o plano de exemplo`, `Explorar primeiro`. Nota: `O plano de exemplo é de uma pessoa com experiência, que treina musculação, jiu-jitsu e vôlei.`

**Passo 0. Antes de começar.** `Alguma destas situações vale para você?` Opções: `Tenho menos de 18 anos`, `Estou grávida ou amamentando`, `Tenho uma condição de saúde (coração, pressão alta, diabetes, rins, lesão ou cirurgia recente, ou outra em acompanhamento)`, `Tenho ou já tive transtorno alimentar`, `Nenhuma dessas`. Rodapé: `Essa resposta fica só neste aparelho.`

**Passo 1. Objetivo.** `Qual é seu objetivo principal?` `Perder gordura`, `Ganhar massa muscular`, `As duas coisas (recomposição)`, `Saúde e condicionamento`.

**Passo 2. Experiência.** `Quanto você já treinou musculação?` `Nunca treinei`, `Pouco (menos de 1 ano, ou parado há mais de 6 meses)`, `Treino há 1 ano ou mais`.

**Passo 3. Dias.** `Quantos dias por semana você pode fazer musculação?` Ajuda: `Escolha o que cabe numa semana normal, não na melhor semana.`

**Passo 4. Tempo.** `Quanto tempo você tem por treino?` `30 a 45 min`, `45 a 60 min`, `60 a 90 min`.

**Passo 5. Local.** `Onde você vai treinar?` `Academia`, `Em casa, com halteres e elástico`, `Em casa, sem equipamento`.

**Passo 6. Outras atividades.** `Você faz outra atividade em dias fixos?` `Luta (jiu-jitsu ou outra)`, `Esporte`, `Corrida`, `Nenhuma`. Depois: `Em quais dias?` Ajuda: `O app evita treino pesado de pernas na véspera dessas atividades.`

**Passo 7. Seus dados (opcional).** `Para calcular suas metas de dieta, informe:` `Sexo (usado só na fórmula)`: `Masculino`, `Feminino`, `Prefiro não informar`; `Idade`, `Altura (cm)`, `Peso (kg)`; `Como é seu dia fora do treino?` `Sentado a maior parte do tempo`, `Em pé ou andando parte do dia`, `Trabalho físico`. Botão secundário: `Pular esta etapa`. Ajuda: `Sem esses dados, o app usa metas de exemplo.`

**Revisão.** Título: `Seu plano`. `Musculação: {n} dias por semana ({nomes dos treinos}).` `{n} semanas, com uma semana leve (deload) a cada 4.` `Meta de calorias: de {min} a {max} kcal por dia, conforme o tipo de dia. Proteína: {p} g.` Pergunta: `Começar quando?` Botões: `Começar o plano`, `Voltar`. Para quem já usa: `Seus registros, notas e medidas continuam salvos. Você pode voltar ao plano anterior em Perfil.`

**Avisos.**
- Fixo (rodapé do assistente e da revisão): `As metas são estimativas e o plano é uma sugestão geral. O app não substitui nutricionista, médico ou educador físico.`
- `menor18`: `Para quem tem menos de 18 anos, o app monta só um treino leve e não calcula metas de dieta. Converse com um médico ou nutricionista, e treine com orientação de um educador físico.`
- `gestacao`: `Na gravidez e na amamentação, o app não calcula metas de dieta. Peça ao seu médico liberação para o treino e procure um nutricionista.`
- `condicao`: `Com uma condição de saúde, o app não calcula metas de dieta. Peça liberação ao seu médico antes de começar e procure um nutricionista.`
- `transtorno`: `O app não vai calcular calorias nem sugerir déficit. Se quiser apoio com alimentação, procure um nutricionista ou psicólogo.`
- `sem-dados`: `Sem idade, altura e peso, usamos metas de exemplo. Você pode informar depois em Perfil.`
- `imc-baixo`: `Seu peso já está baixo para sua altura, então o app não sugere déficit de calorias. Converse com um nutricionista.`
- `imc-alto-massa`: `O app sugere manter as calorias por enquanto. Um nutricionista pode ajustar sua meta.`
- `semana-cheia`: `Sua semana já tem muita atividade. O app montou 2 treinos curtos de musculação; descanse pelo menos 1 dia.`
- Dor (na revisão): `Sentiu dor que passa de 4 em 10, dura mais de 2 semanas, ou vem com formigamento ou perda de força? Pare o exercício e procure um fisioterapeuta ou médico.`
