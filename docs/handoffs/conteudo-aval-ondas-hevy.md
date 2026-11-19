# Conteúdo: aval das ondas inspiradas no Hevy

Data: 19/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: PROPOSTA (aguarda o dono nos itens da seção 9).
ADR: [009-registro-de-treino-inspirado-no-hevy.md](../decisoes/009-registro-de-treino-inspirado-no-hevy.md). Base: `ux-inspiracao-hevy.md`, `conteudo-assistente-inicio.md`, `docs/ESPECIFICACAO.md` (3, 4, 9), `data/plan.json`, `src/domain/progression.ts`, `workout.ts`, `workoutRecord.ts`.

Tudo aqui é regra pura e determinística para o `frontend` e o `backend-dados`. Afirmações científicas estão marcadas **(a verificar)**; nenhum estudo foi conferido. Nada muda no plano de exemplo, no motor de semanas (`setsForWeek`) nem em `suggestNext`.

Convenções: `week` é o índice 0 a 11 usado em `setsForWeek` (semana leve quando `week % 4 === 3`). "Série de trabalho" = série com `kind` ausente (não é aquecimento). "Antes" = `previousSetAt`, a série de trabalho de mesmo índice na última sessão concluída do exercício (`lastPerformance`), contando só as séries de trabalho.

## 1. Campo vazio: placeholder e ✓ sem digitar

### Decisão

- Os campos vazios mostram **placeholder** (texto cinza, não valor). Nunca grava nada sem um toque em ✓.
- Tocar em ✓ com campo vazio grava exatamente o placeholder daquele campo e mostra o toast `Registrado 40 kg × 10. Desfazer` (sem ponto, glossário). Campo digitado vale o digitado.
- A carga do placeholder vem da **sugestão** (`suggestNext`); as repetições vêm do **"Antes"**, limitadas à faixa da semana. Motivo: a sugestão já aplica a dupla progressão da especificação (seção 3); repetir o "Antes" puro esconderia a subida de carga. As repetições do "Antes" são o que a pessoa de fato conseguiu, mais honesto que o topo da faixa.

### Regra (função pura `placeholderFor`)

Entrada: `ex`, `week`, `suggestion` (de `suggestNext`), `antes` (série de mesmo índice ou `null`), `anteriorHoje` (série de trabalho anterior já concluída hoje ou `null`), `placeholderAnteriorHoje`. Saída `{ kg: string | null, reps: string | null, podeConfirmar: boolean }`.

```
faixa = repRange(setsForWeek(ex, week).reps)        // pode ser null
leve  = week % 4 === 3

kg:
  1. se anteriorHoje existe e anteriorHoje.kg != placeholderAnteriorHoje.kg: kg = anteriorHoje.kg   // a pessoa mudou a carga hoje; segue a dela
  2. senão, se suggestion.kg != null:
       kg = leve && suggestion.reason === 'subir' ? cargaMaxDaUltimaSessao : suggestion.kg     // na semana leve não sobe carga
  3. senão: kg = null
reps:
  base = antes?.reps ?? anteriorHoje?.reps ?? (última série de trabalho do "Antes")?.reps ?? null
  se suggestion.reason === 'subir' e não leve: base = faixa?.min      // carga nova começa no piso da faixa
  se faixa e base != null: reps = clamp(base, faixa.min, faixa.max)
  se base == null: reps = null
podeConfirmar = reps != null && (ex.m !== 'kg' || kg != null)
```

- `m: 'bw'`: o kg é carga extra; vazio vale 0 e não impede o ✓. `m: 'rep'` e `'s'`: só repetições (ou segundos). `m: 'kgs'` (farmer): kg pela regra, segundos pelo "Antes".
- `podeConfirmar = false`: o ✓ não grava e mostra `Digite a carga` (ou `Digite as repetições`). O placeholder mostra a faixa (`8–12`) e `kg`.
- Série extra (índice maior que as do "Antes"): usa `anteriorHoje`.
- Aquecimento nunca entra como "Antes" nem como `anteriorHoje`.

### Exemplos (testes)

| # | Caso | Entrada | Saída kg / reps / podeConfirmar |
| --- | --- | --- | --- |
| 1 | Semana normal, manter | supino week 1, faixa 5–8; sugestão `manter` 40; antes 40×7 | `40` / `7` / sim |
| 2 | Semana normal, subir | week 1, faixa 5–8; sugestão `subir` 42,5 (última 40); antes 40×8 | `42.5` / `5` / sim |
| 3 | Semana leve | week 3, faixa 5–8; sugestão `subir` 42,5 (última 40); antes 40×8 | `40` / `8` / sim |
| 4 | Antes acima da faixa nova | week 4 (bloco 2), faixa 4–6; sugestão `manter` 45; antes 45×8 | `45` / `6` / sim |
| 5 | Primeira vez, `kg` | sugestão `sem-historico`, kg null; sem antes | `null` / `null` / não (mostra `kg` e `5–8`) |
| 6 | Primeira vez, série 2 | igual ao 5, série 1 registrada hoje 30×8 | `30` / `8` / sim |
| 7 | Mudou carga hoje | placeholder série 1 era 40; registrou 37,5×8; série 2 antes 40×7 | `37.5` / `7` / sim |
| 8 | `rep` sem histórico | `flexao`, faixa 5–12, sem antes | `null` / `null` / não |
| 9 | `bw` | `barra`, sugestão kg null (sem kg nas séries), antes `''`×6 | `null` / `6` / sim, grava kg `''` |

Observação sobre o caso 9: `suggestNext` ignora séries sem kg; para `bw`, a regra de reps usa o "Antes" mesmo assim.

## 2. Recordes pessoais

### Tipos (só estes três)

| Tipo | Definição | Texto na hora |
| --- | --- | --- |
| `maxKg` | maior carga numa série de trabalho concluída (reps ≥ 1) | `Recorde de carga: 62,5 kg × 6` |
| `maxE1rm` | maior 1RM estimado, Epley `kg × (1 + reps/30)` (a verificar), só com reps de 1 a 10 | `Recorde: 1RM estimado 77 kg` |
| `maxRepsAtKg` | mais repetições numa carga já usada antes (mesma carga exata) | `Recorde de repetições: 60 kg × 9` |

Fora: volume da série e da sessão **não** são recordes (variam com o número de séries e com a semana leve, o que geraria "recorde" falso). O volume aparece só como comparação no Concluído: `Volume 8.420 kg (+6% em relação à última vez)`.

### Regras

- Elegível: exercício com `m: 'kg'`; série de trabalho, `done === true`, kg > 0 e reps ≥ 1 numéricos (`parseNumber`). Excluídos: aquecimento, `bw`, `rep`, `s`, `kgs`.
- Primeira vez: sem histórico elegível antes de `beforeDay`, nada é recorde (é a marca inicial). Página do exercício mostra os valores como `Melhores marcas`.
- Recorde só se for **estritamente maior** que o melhor anterior (empate não conta). 1RM estimado: maior por pelo menos 0,5 kg, para não anunciar diferença de arredondamento.
- Dentro do mesmo dia, compara com o histórico antes do dia mais as séries anteriores do próprio dia (a 3ª série pode ser recorde mesmo que a 1ª já tenha sido).
- Uma linha por série, pela prioridade `maxKg` > `maxE1rm` > `maxRepsAtKg`.
- Contam treinos do plano, treinos livres e trocas (sob a ID do exercício feito). A semana leve conta normalmente.
- Exibição: kg com vírgula, 1RM arredondado para 0,5 kg (`Math.round(x*2)/2`). Rodapé da página do exercício: `O 1RM estimado é uma conta aproximada a partir das suas séries. Não é preciso testar a carga máxima.`
- Concluído: `Recordes de hoje: Supino 62,5 kg · Remada 1RM est. 58 kg` (o melhor tipo por exercício, até 3 exercícios; depois `e mais 2`).

### Exemplos (testes de `personalRecords` e `recordForSet`)

| # | Histórico antes | Série de hoje | Resultado |
| --- | --- | --- | --- |
| 1 | 60×8, 60×8 | 62,5×6 | `maxKg` (e1rm 75 < 76, não conta) |
| 2 | 60×8 (e1rm 76) | 60×9 | é `maxRepsAtKg` e `maxE1rm` (78 contra 76); mostra `maxE1rm` pela prioridade |
| 3 | 60×8 | 57,5×10 | e1rm 76,67 vs 76: +0,67 ≥ 0,5, `maxE1rm` 76,5 kg |
| 4 | 60×8 | 40×15 | nada (reps > 10 fora do 1RM; 40 kg nunca usado antes, sem `maxRepsAtKg`) |
| 5 | nenhum | 50×10 | nada (primeira vez) |
| 6 | 60×8 | 60×8 | nada (empate) |
| 7 | 60×8 | aquecimento 70×1 | nada (aquecimento) |
| 8 | `barra` (bw) 0×10 | 0×12 | nada (`bw` excluído) |

Contas: 60 × (1 + 8/30) = 76; 62,5 × 1,2 = 75; 60 × 1,3 = 78; 57,5 × (1 + 10/30) = 76,67.

## 3. Séries semanais por grupo muscular

### Faixas (a verificar)

| Experiência | grupos grandes (`peito`, `costas`, `quadriceps`, `posterior-gluteos`) | grupos menores (`press`, `ombro-lateral`, `ombro-posterior`, `biceps`, `triceps`, `panturrilha`) |
| --- | --- | --- |
| nunca | 4 a 8 | 2 a 6 |
| iniciante | 6 a 10 | 3 a 8 |
| intermediário | 8 a 16 | 4 a 10 |

- Grandes: os mesmos números da seção 4.2 do assistente, incluindo o ajuste da ADR 010 (intermediário 8 a 16). Decisão de 19/11/2026: ver `conteudo-divergencias-ondas.md`. Menores: recebem também trabalho indireto dos compostos (supino para tríceps, remada para bíceps), por isso a faixa é menor (a verificar). `core` e exercícios sem `g` aparecem sem rótulo de faixa.
- Experiência: `settings.onboarding.experiencia`; sem ela (plano de exemplo ou quem não usou o assistente), intermediário.

### Regra (`weeklySetsByGroup` e `groupStatus`)

- Conta séries de trabalho concluídas, 1 série = 1 grupo (`g` do exercício feito, incluindo troca e treino livre), na semana do calendário do plano (segunda a domingo).
- Piso efetivo: `piso = min(min da faixa, séries previstas pelo plano ativo para o grupo naquela semana)`; se o plano não prevê o grupo na semana, `piso = min da faixa`. Motivo: o app não chama de "abaixo" quem cumpriu o próprio plano.
- `abaixo` se n < piso; `dentro` se piso ≤ n ≤ max; `acima` se n > max.
- Semana em andamento: nunca mostra `abaixo` (mostra só o número; `acima` pode aparecer). Semana leve: sem rótulos, com a linha `Semana leve: menos séries é o esperado`.
- Textos: `abaixo da faixa`, `dentro da faixa`, `acima da faixa`. Ajuda: `Faixa de referência para sua experiência. Não é regra: dor, cansaço e sono também contam.` Nada de vermelho para `acima`.

### Exemplos

| # | Experiência | Grupo, séries, semana | Saída |
| --- | --- | --- | --- |
| 1 | iniciante | peito 5, semana encerrada | `abaixo` |
| 2 | iniciante | peito 5, semana em andamento | sem rótulo |
| 3 | iniciante | biceps 3 | `dentro` |
| 4 | intermediário (sem onboarding) | quadriceps 17 | `acima` (15 e 16 = `dentro`) |
| 4b | intermediário, plano de exemplo bloco 1 (prevê quadriceps 7, panturrilha 3) | quadriceps 7 / quadriceps 6 / panturrilha 3 / panturrilha 2, semana encerrada | `dentro` / `abaixo` / `dentro` / `abaixo` |
| 5 | nunca | costas 8 | `dentro` |
| 6 | qualquer | peito 3, week 3 (leve) | sem rótulo |
| 7 | qualquer | core 9 | sem rótulo |

Pendência para o `backend-dados` (teste de consistência, não muda dados): somar as séries do plano de exemplo por grupo em cada bloco e conferir contra a faixa intermediária; se algum grupo ficar fora, avisar este agente, que decide se é o plano ou a faixa.

## 4. Trocar exercício só hoje

### Regra

- A lista vem do mesmo `g` e do mesmo padrão (tabela abaixo), primeiro o mesmo padrão, depois o grupo. Filtra pelo local (`settings.onboarding.local`; sem ele, academia, que mostra tudo). Exclui a própria ID e as já presentes no treino do dia.
- Para `nunca` e `iniciante`, não aparecem `nordic`, `roll`, `med`, `salto_l`, `salto_b`, `copen_l`, `copen_b`, `barra` (mesma lista do assistente).
- O exercício trocado usa: **séries do original** (`setsForWeek(original, week).sets`, para manter o volume da semana), **repetições, descanso e progressão do novo** (`setsForWeek(novo, week).reps`, `novo.rest`, `suggestNext` com o histórico do novo).
- Sem equivalente: a folha mostra `Sem troca equivalente aqui. Você pode fazer depois ou pular hoje.`

### Tabela (ordem = ordem na folha)

| Grupo / padrão | academia | casa_equip | casa_livre |
| --- | --- | --- | --- |
| peito, empurrar | `supino`, `inclinado`, `supino_chao`, `flexao`, `cruc` | `supino_chao`, `flexao` | `flexao` |
| costas, puxar vertical | `puxada`, `barra`, `puxada_elastico` | `puxada_elastico` | `remada_mochila` |
| costas, puxar horizontal | `remada_a`, `remada_b`, `remada_mochila` | `remada_b`, `remada_mochila` | `remada_mochila` |
| press | `press_a`, `press_b`, `pike` | `press_b`, `pike` | `pike` |
| ombro-lateral | `lat_a`, `lat_b` | `lat_a` | (sem troca) |
| ombro-posterior | `face`, `inverso`, `face_elastico`, `ytw` | `inverso`, `face_elastico`, `ytw` | `ytw` |
| biceps | `rosca_a`, `rosca_b` | `rosca_a`, `rosca_b` (alternada) | (sem troca) |
| triceps | `tri_a`, `tri_b`, `flexao_fechada` | `tri_b` (francês), `flexao_fechada` | `flexao_fechada` |
| quadriceps, bilateral | `agach`, `leg`, `goblet`, `agach_livre` | `goblet`, `agach_livre` | `agach_livre` |
| quadriceps, unilateral | `bulg`, `afundo`, `afundo_livre` | `bulg`, `afundo`, `afundo_livre` | `afundo_livre` |
| posterior-gluteos, quadril | `hip_b`, `hip_l`, `ponte_h`, `ponte_uni` | `ponte_h`, `ponte_uni` | `ponte_uni` |
| posterior-gluteos, posterior da coxa | `stiff`, `mesa`, `nordic`, `stiff_uni` | `stiff`, `stiff_uni` | `stiff_uni` |
| panturrilha | `pant_pe`, `pant_sent`, `pant_degrau` | `pant_degrau` | `pant_degrau` |
| core | `pallof`, `deadbug`, `prancha`, `joelhos`, `roll`, `med` | `deadbug`, `prancha` | `deadbug`, `prancha` |
| sem grupo (`farmer`, `pescoco`, `salto_l`, `salto_b`, `copen_l`, `copen_b`) | sem troca | sem troca | sem troca |

Os padrões não estão no `plan.json`. Proposta: o `backend-dados` guarda esta tabela como constante do domínio (`SWAP_GROUPS`), sem mexer nos dados. `hip_l` e `hip_b` são o mesmo movimento; trocar um pelo outro não faz sentido no mesmo dia, mas a regra "já presente no treino" resolve.

### Exemplos

| # | Entrada | Saída |
| --- | --- | --- |
| 1 | `supino`, academia, iniciante, treino com `inclinado` | `supino_chao`, `flexao`, `cruc` |
| 2 | `puxada`, iniciante, academia | `puxada_elastico` (`barra` excluída para iniciante), depois o horizontal: `remada_a`, `remada_b`, `remada_mochila` |
| 3 | `lat_a`, casa_livre | vazio, texto "Sem troca equivalente" |
| 4 | troca `supino` por `flexao` na week 1 (bloco 1) | 4 séries (`setsForWeek(supino,1).sets`) de `5–12` (`setsForWeek(flexao,1).reps`), descanso 90 |
| 5 | `farmer` | vazio |

## 5. Aquecimento

### Série marcada pela pessoa

`SetEntry.kind = 'warm'`, rótulo `A` em texto. Fica fora de: volume, recordes, `suggestNext`, "Antes", contagem de séries, séries por grupo e sequência de semanas. Não conta para "treino concluído".

### Aquecimento sugerido (`warmupSets`)

- Só nos compostos com `m: 'kg'`: `agach`, `leg`, `hip_b`, `hip_l`, `stiff`, `supino`, `inclinado`, `supino_chao`, `press_a`, `press_b`, `remada_a`, `remada_b`, `puxada`, `goblet`.
- Só no **primeiro** exercício do treino com aquele `g` (o segundo exercício do mesmo grupo já está aquecido).
- Base: o kg do placeholder da 1ª série (seção 1). Sem base (primeira vez), não sugere.
- Quantidade: base < 20 kg: nenhuma; 20 a 39,5 kg: 1 série (50% × 8); 40 kg ou mais: 2 séries (50% × 8, 70% × 4). Arredonda ao múltiplo de 2,5 kg mais próximo; descarta a série se der ≥ base ou < 2,5 kg. Percentuais e repetições são prática comum de academia (a verificar).
- Semana leve: igual.
- As séries sugeridas aparecem como linhas `A` vazias com placeholder; só gravam com ✓; podem ser apagadas.
- Texto: `Aquecimento sugerido: séries leves para preparar o movimento. Não contam no volume.` Antes do treino, na tela do primeiro exercício: `Comece com 5 min de aquecimento leve, como bicicleta ou caminhada.` (a verificar como recomendação; é prática comum).

### Exemplos

| # | Exercício, base | Saída |
| --- | --- | --- |
| 1 | `supino` 60 | 30 × 8, 42,5 × 4 (42 → 42,5) |
| 2 | `leg` 120 | 60 × 8, 85 × 4 (84 → 85) |
| 3 | `goblet` 24 | 12,5 × 8 (12 → 12,5; corrigido em 19/11/2026, vale a regra) |
| 4 | `goblet` 18 | nenhuma |
| 5 | `inclinado` 50, depois de `supino` no mesmo treino | nenhuma (peito já aquecido) |
| 6 | `lat_a` 10 | nenhuma (não é composto) |
| 7 | `agach` sem histórico | nenhuma |

## 6. Sequência de semanas (`weekStreak`)

### Regra

- Semana = semana do calendário do plano (segunda a domingo, a partir de `start`). Pré-semana não conta.
- `meta` = número de dias `gym` na rotina (`sched`). Plano de exemplo: 3.
- Semana normal **cumprida** se treinos do plano concluídos ≥ `max(1, meta − 1)`. Motivo: a vida tem imprevistos; perder 1 treino na semana não apaga a constância.
- Semana leve (week 3, 7, 11): cumprida com ≥ 1 treino do plano. Motivo: a semana leve existe para recuperar.
- Depois da semana 12: continua com a mesma regra de semana normal.
- Treino livre não conta (UX); jiu-jitsu e vôlei não contam (são aulas, não treinos do plano).
- **Tolerância:** 1 semana não cumprida não quebra a sequência se nenhuma das 3 semanas anteriores também tiver sido perdoada. Ela não soma no número. Duas seguidas não cumpridas quebram.
- Semana em andamento: soma se já cumprida; se não, não quebra nem soma.
- Mostra só com 2 ou mais: `6 semanas seguidas`. Ao quebrar, não mostra nada (sem mensagem de perda). Proibido: "você perdeu", "não falhe", contador regressivo.

### Exemplos (meta 3, mínimo 2; L = semana leve)

| # | Treinos por semana (da 1ª à atual) | Saída |
| --- | --- | --- |
| 1 | 3, 2, 3 | 3 |
| 2 | 3, 3, 1, 1(L) | 3 (a 3ª é perdoada; a L com 1 cumpre) |
| 3 | 3, 0, 0, 3 | 1 (não mostra) |
| 4 | 2, 0, 2, 0, 2 | 1, nada mostrado (a 2ª é perdoada; a 4ª não pode, porque houve perdão nas 3 anteriores, e quebra) |
| 5 | 3, 3, atual com 1 em andamento | 2 |
| 6 | meta 2: 1, 1, 1 | 3 (mínimo `max(1, 1) = 1`) |

## 7. Instruções da biblioteca

Em [conteudo-instrucoes-exercicios.md](conteudo-instrucoes-exercicios.md): os 55 exercícios salvos (38 do plano de exemplo e os 17 do assistente), 2 a 3 frases e 1 erro comum cada, mais 2 frases fixas de segurança no rodapé.

## 8. Calculadora de anilhas (`platesPerSide`)

- Padrão configurável em Perfil: barra 20 kg (opções 20, 15, 10 e `sem barra`); anilhas por lado `[25, 20, 15, 10, 5, 2.5, 1.25]` kg, pares ilimitados; a pessoa pode desmarcar as que a academia não tem.
- Algoritmo: `lado = (total − barra) / 2`; guloso da maior para a menor (com estas anilhas o guloso dá o menor número de anilhas). Sobra > 0,001: retorna a combinação mais próxima abaixo e o aviso.
- Saídas: `{ perSide: number[], achieved: number, exact: boolean }`, ou erro `abaixo-da-barra`.
- Textos: `Cada lado: 20 + 1,25 (barra 20 kg)`; `Não fecha com essas anilhas. Mais perto: 61 kg`; `Carga menor que a barra`; `Só a barra`.
- Aparece só em exercícios com barra (`agach`, `stiff`, `hip_b`, `hip_l`, `remada_a` com barra, `rosca_b` com W). Os de halteres e máquinas não mostram o botão (a carga é por halter ou da máquina).

| # | Entrada | Saída |
| --- | --- | --- |
| 1 | 62,5, barra 20 | [20, 1.25], 62,5, exato |
| 2 | 100, barra 20 | [25, 15], 100, exato |
| 3 | 61, barra 20 | lado 20,5 → [20], 60, não exato |
| 4 | 20, barra 20 | [], exato (`Só a barra`) |
| 5 | 15, barra 20 | erro `abaixo-da-barra` |
| 6 | 47,5, barra 15 | [15, 1.25], exato |
| 7 | 60, barra 20, sem a de 20 | [15, 5], exato |

Conta do exemplo 3: o mais perto abaixo é 60 (lado 20); com 1,25 daria 62,5, acima. O aviso mostra 60 kg.

## 9. Pendências do dono

1. Aprovar as faixas da seção 3 e os percentuais da seção 5 (a verificar) ou revisar com educador físico.
2. Confirmar a tolerância de 1 semana da sequência (seção 6) e o mínimo `meta − 1`.
3. Confirmar que volume não vira recorde (seção 2).

Aviso fixo que continua valendo em todas essas telas: `Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.`
