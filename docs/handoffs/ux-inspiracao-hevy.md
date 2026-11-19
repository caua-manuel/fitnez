# UX: inspiração no Hevy (registro de treino)

Autor: ux_acessibilidade. Este é só um documento: nada em `src/` nem nos testes foi alterado. Sem capturas: li o código (`treino/Executar.tsx`, `Concluido.tsx`, `Biblioteca.tsx`, `evolucao/Evolucao.tsx`, `domain/workout.ts`, `progression.ts`, `restTimer.ts`, `planEdit.ts`, `evolution.ts`, `muscleGroups.ts`).

Sobre o Hevy, descrevo o que sei do app até 2026. Os pontos marcados **(incerto)** precisam ser conferidos no app antes de citar como referência. Ficam de fora o feed social, os seguidores, a conta na nuvem, os rankings e o Hevy Coach, porque nada disso combina com o Fitnez.

## 1. Comparação

| Funcionalidade do Hevy | No Fitnez | Vale trazer? |
|---|---|---|
| Coluna "Anterior" em cada série (valores da última vez na mesma linha) | **Parcial.** `Executar.tsx` mostra "Último desempenho" em uma linha única acima da tabela (`lastPerformance`) | **Sim.** Ter o valor de antes ao lado da série elimina a memória e a digitação. É o ganho mais alto do Hevy |
| Marcar a série em um toque | **Parcial.** `toggle` copia a série anterior da mesma sessão, mas na 1ª série exige digitar | **Sim.** No 1º toque, usar o "anterior" ou a sugestão, com Desfazer. Precisa do aval do conteúdo |
| Tipos de série (aquecimento W, normal, drop D, até a falha F) | **Não** (`SetEntry` tem só kg, reps e done) | **Sim, parcial.** Só **aquecimento** (fica fora do volume e dos recordes). Drop e falha não: o plano trabalha com RIR e fica fora do escopo do iniciante |
| Descanso automático por exercício | **Sim.** `ex.rest`, `RestPanel`, ±15 s, vibração e notificação | Já existe. Ajuste: lembrar o último valor digitado em `askRest` para aquele exercício |
| Superset | **Não** | **Não por agora.** Complica a navegação "um exercício por tela". Pode voltar mais tarde se o conteúdo pedir |
| Notas por exercício (fixa e da sessão) | **Parcial.** A dica `ex.t` é do plano; não há nota da pessoa | **Sim.** A nota fixa ("banco na posição 4") ajuda muito na academia. Texto curto, local |
| Recordes pessoais (maior carga, maior volume na série, 1RM estimado, mais repetições) com aviso na hora | **Não.** Só a variação em `strengthChange` | **Sim**, com carga, repetições na carga e 1RM estimado. O aviso é discreto, uma linha, sem confete |
| Resumo ao concluir com recordes e volume | **Parcial.** `Concluido.tsx` mostra duração, exercícios, séries e volume | **Sim.** Somar os recordes do dia e a comparação com o mesmo treino da vez anterior |
| Histórico e gráfico por exercício | **Parcial.** `strengthSeries` aparece na Evolução para os principais exercícios; não há página por exercício | **Sim.** Página do exercício: lista de sessões, gráfico e recordes |
| Calendário / mapa de frequência | **Parcial.** Faixa de 12 semanas e `consistency` | **Não como calendário.** A faixa de 12 semanas já é a identidade. Basta tocar na semana para ver os dias |
| Distribuição por grupo muscular (mapa do corpo na semana) **(incerto: o formato exato do mapa)** | **Não** (o dado existe: `muscleGroupOf`) | **Sim, em barras**, sem boneco: "séries por grupo na semana". Útil para o intermediário |
| Volume semanal | **Parcial.** `weeklyValues` e `totalVolume` | **Sim**, junto com o item acima (séries por semana entendem-se melhor que kg totais) |
| Medidas corporais | **Sim.** `MeasureForm.tsx`, `measurements.ts` | Já existe |
| Biblioteca de exercícios com instruções e busca | **Parcial.** Há busca e filtro em `Biblioteca.tsx` e a dica `ex.t`; faltam instruções em passos | **Sim, curto.** 3 a 4 passos e 1 erro comum por exercício. Conteúdo do conteudo-treino-nutricao |
| Rotinas e pastas | **Parcial.** Há treinos (sessões); não há pastas | **Não.** O plano é um só, de 12 semanas; pastas são ruído |
| Duplicar rotina | **Sim.** `duplicateSession` | Já existe |
| Calculadora de anilhas **(incerto: confirmar se está na versão grátis)** | **Não** | **Sim, P.** Barra de 20 kg, anilhas comuns, um toque na carga. Ajuda muito o iniciante |
| Treino livre / vazio | **Não** | **Sim, simples.** "Treino livre": escolhe os exercícios da biblioteca e registra fora do plano |
| Reordenar e trocar exercício durante o treino | **Parcial.** `moveExercise` só no editor; no treino, as setas navegam mas não reordenam | **Sim, trocar.** "Aparelho ocupado: trocar por..." (variação do mesmo grupo) só na sessão do dia. Reordenar: um "Fazer depois" basta |
| Duração do treino | **Sim.** Cronômetro com pausa; duração no Concluído | Já existe |
| Aquecimento sugerido **(incerto: o Hevy tem calculadora de aquecimento em versão recente)** | **Não** | **Sim, depois.** 2 séries (50% × 8, 70% × 4) só nos compostos. Precisa do aval do conteúdo |
| Widget / atalhos | **Não** (B9) | **Sim.** `shortcuts` no manifesto. Widget não existe no PWA |
| Sequência de semanas (streak) | **Não** | **Sim, discreto.** "6 semanas seguidas" na faixa. A semana conta pela meta do plano e nunca pune quem descansa |

## 2. Lista final em ondas (fundida com `ux-fase-indispensavel.md` e o assistente)

O marcador **[aval]** indica que o item precisa do conteudo-treino-nutricao.

### Onda 1: maior utilidade por esforço

**1. Coluna "Antes" na série e série em um toque (M) [aval]**
```
Série  Antes      Reps  kg     [ ]
1      40×10      [10]  [40]   [✓]
2      40×9       [ 9]  [40]   [ ]
```
- Os campos vazios mostram como placeholder a sugestão (ou o "Antes"). Tocar em ✓ sem digitar confirma esses valores, com o toast "Registrado 40 kg × 10. Desfazer".
- Domínio: `previousSetAt(days, exId, day, index)`, ou seja, a série de mesmo índice na última sessão concluída. A regra para preencher pela sugestão de `suggestNext` (ou só pelo "Antes") **fica para o conteúdo decidir**.
- A11y: a coluna recebe `aria-label` por série ("Antes: 40 kg, 10 repetições").

**2. Recordes na hora e no Concluído (M) [aval]**
```
✓ Série 3  ·  Recorde: 62,5 kg × 6
Concluído:  Recordes de hoje: Supino 62,5 kg · Remada 1RM est. 58 kg
            Volume 8.420 kg (+6% vs última vez)
```
- Domínio: `personalRecords(days, exId, beforeDay)` → { maxKg, maxRepsAtKg, maxE1rm }. Para o 1RM estimado, **Epley `kg × (1 + reps/30)`, marcada "a verificar"**, só com reps ≤ 10 [aval]. Ficam fora as séries de aquecimento e os exercícios `bw`/`s`. O 1º registro não conta como recorde.
- A mensagem usa `role="status"`, o texto "Recorde" e um ícone, sem depender da cor brasa.

**3. "Hoje" que responde em 3 s (M)**: item C1 da proposta anterior. O cartão mostra o 1º exercício e a carga sugerida, e a linha da dieta logo abaixo.

**4. Atalhos do PWA (P)**: item C7. "Treino de hoje", "Marcar refeição" e "Registrar peso".

### Onda 2

**5. Assistente de início (G) [aval]**: seção A da proposta anterior, com as regras de `conteudo-assistente-inicio.md`.

**6. Página do exercício (M)**
```
Supino reto                     [nota]
Recordes  62,5 kg · 1RM 70 kg est.
[gráfico carga máxima, 12 semanas]
+5 kg em 4 semanas
19/11  62,5×6, 60×8, 60×8
12/11  60×8, 60×8, 57,5×9
```
- Fica em Biblioteca → exercício, e no treino ao tocar no nome. Domínio: `exerciseHistory(days, exId)` e `strengthChange`, que já existe. A frase de conclusão vem do item C5.

**7. Nota fixa por exercício (P)**
- Uma linha abaixo do nome em Executar ("Banco na posição 4"), editável em uma folha. Domínio: `notes[exId]` em userData, até 140 caracteres, incluída no backup e no CSV.

**8. Calculadora de anilhas (P)**
```
62,5 kg  →  cada lado: 20 + 1,25     (barra 20 kg)
```
- Abre ao tocar e segurar, ou pelo botão "Anilhas" no campo kg. Domínio: `platesPerSide(total, bar=20, available=[25,20,15,10,5,2.5,1.25])`, função pura, com aviso quando não fecha. Em Perfil, dá para mudar a barra.

### Onda 3

**9. Séries por grupo muscular na semana e resumo semanal (M) [aval]**
```
Semana 5   Peito ████████ 10   Costas ██████ 8   Pernas ███ 4 (abaixo)
```
- Domínio: `weeklySetsByGroup(days, plan, week)` via `muscleGroupOf`, sem contar o aquecimento. As faixas "abaixo/ok" de séries por grupo [aval]. Junto vem o cartão de resumo semanal (C4).

**10. Trocar exercício no treino de hoje (M) [aval]**
- "..." → "Trocar por" mostra as variações do mesmo grupo (do conteúdo). A troca vale só para o dia e o plano não muda. Domínio: `log[exIdNovo]` com `meta.swaps[{from,to}]`. "Fazer depois" leva o exercício para o fim da fila do dia.

**11. Série de aquecimento e aquecimento sugerido (M) [aval]**
- Um toque longo no número da série marca "A" (rótulo em texto, não só em cor). Domínio: `SetEntry.kind?: 'warm'`, fora de volume, recordes e `suggestNext`. A sugestão de 2 séries só nos compostos depende do aval.

**12. Treino livre e sequência de semanas (M)**
- Treino livre: "Treinar sem plano" → escolhe da Biblioteca → Executar com `sessionId: 'livre'`, que conta para os recordes e não para a constância do plano.
- Sequência: na faixa, "6 semanas seguidas" quando a meta semanal do plano foi cumprida. Domínio: `weekStreak(days, plan)`, e a semana leve (deload) conta como cumprida [aval].

Não entram: superset, pastas, tipos drop e falha, mapa do corpo ilustrado, social e conta.
