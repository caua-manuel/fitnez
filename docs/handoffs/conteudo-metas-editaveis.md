# Especificação: metas de dieta editáveis

Data: 16/11/2026. Responsável: agente `conteudo-treino-nutricao`. Destinatários: `backend-dados` (domínio puro, formato salvo, migração, validação) e `frontend` (telas e textos). Origem: achado B3 de [seguranca-limpeza-publica.md](seguranca-limpeza-publica.md). Decisão registrada em [007](../decisoes/007-metas-de-dieta-editaveis.md).

Nenhum número atual muda. Esta especificação só torna os números editáveis. Nenhum código foi escrito nem alterado.

## 0. Resumo das decisões

- Editável: kcal e carboidrato por tipo de dia (5 tipos), proteína, gordura e água (estes três valem para todos os dias).
- Derivado: proteína em "automático" (peso x 2,4 g/kg, como hoje), calorias dos macros (só informativo), meta de copos de água (litros / 0,5), percentuais de progresso.
- Padrão = valores atuais. Enquanto o usuário não salvar nem confirmar, o app mostra "Meta de exemplo".
- Coerência kcal x macros: aviso, nunca bloqueio. Limites absolutos de cada campo: bloqueiam o salvamento (valor absurdo).
- Dias passados: preservam a meta do momento, por histórico de versões com data de vigência.
- Formato: um campo opcional novo em `settings`, sem subir a versão do estado (continua v3). Backups antigos importam sem mudança.

## 1. O que o usuário edita e o que é derivado

### 1.1 Campos editáveis

| Campo | Escopo | Unidade | Padrão atual (não mudar) |
| --- | --- | --- | --- |
| kcal do dia | por tipo de dia | kcal, inteiro | perna 2600; academia 2450; jiu-jitsu 2500; vôlei 2500; descanso 2100 |
| Carboidrato | por tipo de dia | g, inteiro | perna 340; academia 305; jiu-jitsu 315; vôlei 315; descanso 215 |
| Proteína | todos os dias | g, inteiro | automática: peso x 2,4 g/kg arredondado; 185 g sem peso válido (30 a 300 kg) |
| Gordura | todos os dias | g, inteiro | 55 |
| Água | todos os dias | L, múltiplo de 0,5 | 3 |

Os 5 tipos de dia são os de `DayType`: `perna`, `academia`, `jiujitsu`, `volei`, `descanso`. O texto de foco e a lista de ajustes de cada tipo (por exemplo "+50 g de arroz no almoço") continuam fixos: são sugestões do cardápio, não metas.

Por que carboidrato é editável por tipo de dia e não "o que sobra": calcular o restante pela fórmula daria 304 g na academia em vez de 305 g (e outros valores levemente diferentes), o que mudaria um número atual. Por isso os valores são guardados explicitamente. Para ajudar o usuário, a tela oferece o botão "Calcular pelo que sobra" (seção 6), que apenas preenche o campo; o usuário confirma ao salvar.

### 1.2 Proteína: modo automático ou manual

- Automático (padrão): proteína = `proteinTargetG(peso)` como hoje. No formato salvo, `proteinG: null`.
- Manual: o usuário desliga "Calcular pelo peso" e informa gramas. O peso do perfil deixa de alterar a meta. `proteinG: número`.
- "Voltar ao cálculo pelo peso" reativa o automático.
- Observação: no modo automático, a proteína dos dias passados também usa o peso atual do perfil (comportamento de hoje, não muda). Só os campos manuais e os demais valores são versionados por data.

### 1.3 Valores derivados (nunca salvos)

| Derivado | Fórmula |
| --- | --- |
| Calorias dos macros | `kcalFromMacros(p, c, g) = 4*p + 4*c + 9*g` (fatores de Atwater simplificados; arredondar para inteiro) |
| Diferença | `abs(kcalFromMacros - kcal)` |
| Tolerância | `max(100, round(0.05 * kcal))` kcal |
| Copos de água | `round(waterL * 1000 / 500)` (já existe em `Dieta.tsx`) |
| Proteína em g/kg | `proteinG / weightKg`, só quando há peso válido |

Os fatores 4/4/9 e a tolerância são simplificações de planejamento (a verificar: tabelas de composição e rótulos diferem em fibra, álcool e arredondamento). A tolerância de 5% (mínimo 100 kcal) é escolha de produto, não valor científico.

### 1.4 Coerência entre kcal e macros

- Avaliada para cada tipo de dia separadamente, com a proteína e a gordura globais e o carboidrato e as kcal daquele dia.
- Se `abs(kcalFromMacros - kcal) > tolerância`: aviso `macros-incoerentes` naquele tipo de dia. Não bloqueia o salvamento.
- Os padrões atuais passam: diferença de 5 kcal em todos os cinco tipos (por exemplo, academia 185 g, 305 g, 55 g = 2.455 kcal contra 2.450).

## 2. Meta de exemplo e restaurar padrão

### 2.1 Estado "meta de exemplo"

O app está em "meta de exemplo" quando `settings.dietTargets` não existe ou a versão mais recente tem `targets: null` (seção 5). Nesse estado:

- Dieta: selo "Meta de exemplo" ao lado do título das metas do dia, com a linha "Valores de exemplo do plano. Ajuste para o seu caso." e dois botões: "Ajustar metas" (abre a edição) e "Usar esta meta" (confirma a meta de exemplo sem alterar números).
- Perfil: na linha "Metas de dieta", o resumo "Meta de exemplo" no lugar de valores.
- Início: se exibir kcal ou macros de meta, acrescentar "(exemplo)" discreto. Opcional.

O selo some quando o usuário salva uma edição ou confirma "Usar esta meta". "Usar esta meta" grava uma versão com os valores padrão e `proteinG: null`, sem alterar nada de cálculo.

Quem já usa o app (dados existentes) também começa em "meta de exemplo", com os mesmos números de hoje. Isso é intencional e inofensivo: um toque em "Usar esta meta" confirma.

### 2.2 Restaurar padrão

- Botão "Restaurar padrão" na edição, com confirmação ("Restaurar as metas de exemplo? Suas metas atuais deixam de valer a partir de hoje.").
- Efeito: acrescenta uma versão `{ from: hoje, targets: null }`. Não apaga o histórico, então os dias passados continuam com a meta que valia neles.
- Volta ao estado "meta de exemplo" (selo reaparece).
- Aviso de resultado com desfazer (padrão já usado no app): "Metas restauradas" e a ação "Desfazer", que recoloca a lista de versões anterior.
- Dentro da edição, antes de salvar, "Restaurar padrão" também pode apenas recolocar os valores de exemplo nos campos (sem salvar). Recomendação: um só botão, com a ação imediata acima; sem modo intermediário.

## 3. Limites e avisos

Limites absolutos (bloqueiam salvar) servem para evitar valores absurdos ou erro de digitação. Não são recomendação clínica. Limites de aviso (não bloqueiam) sinalizam valores fora do que costuma ser usado sem acompanhamento. Todas as faixas de aviso que citam saúde estão marcadas "a verificar": nenhum estudo foi conferido para esta especificação.

| Campo | Mínimo absoluto | Máximo absoluto | Aviso abaixo de | Aviso acima de | Justificativa |
| --- | --- | --- | --- | --- | --- |
| kcal do dia | 1000 | 6000 | 1400 | 4500 | 1000 e 6000 cobrem de uma pessoa pequena em déficit forte a um atleta grande em ganho, e impedem digitar 200 ou 20000 por engano. Os avisos de 1400 e 4500 são prudência de produto (a verificar: faixas usadas em orientação nutricional). |
| Proteína (g) | 20 | 400 | menos de 0,8 g/kg (só com peso) | mais de 3,0 g/kg (só com peso) | O padrão do plano é 2,4 g/kg. 0,8 g/kg é citado de memória como referência de ingestão mínima para adultos e 3,0 g/kg como faixa alta já estudada em atletas (ambos a verificar). Sem peso, só valem os limites absolutos. |
| Carboidrato (g) | 0 | 800 | nenhum | nenhum | Planos com pouco carboidrato existem, então 0 é permitido. 800 g é teto de sanidade; a coerência com as kcal já avisa excessos. |
| Gordura (g) | 20 | 300 | 30 | nenhum | Abaixo de 20 g é provável erro de digitação. O aviso de 30 g é prudência de produto (a verificar: gordura mínima para vitaminas lipossolúveis e hormônios). |
| Água (L) | 1 | 6 | nenhum | 5 | Em múltiplos de 0,5 L (1 copo = 500 ml, como no registro). Acima de 5 L por dia o app avisa (a verificar: risco de excesso de água). O plano atual é 3 L. |

Regras de formato:
- kcal, proteína, carboidrato e gordura: números inteiros, sem vírgula. Entrada aceita texto com espaços nas pontas.
- Água: aceita vírgula ou ponto (usar `parseNumber` de `workout`), valor múltiplo de 0,5.
- Campo vazio é erro de campo obrigatório (nenhum campo fica sem valor ao salvar).
- Valores negativos, `NaN`, infinitos e texto não numérico são erro.

### 3.1 Aviso de saúde que acompanha a edição

Texto fixo, sempre visível na tela de edição (sem esconder em ajuda):

> Estas metas são estimativas e valores de exemplo. O app não substitui nutricionista ou médico. Procure um profissional antes de mudar muito a sua alimentação, e também se você tem alguma condição de saúde, usa medicamentos, está grávida ou amamentando, tem menos de 18 anos ou já teve transtorno alimentar. Dor persistente, tontura ou outros sintomas também pedem avaliação profissional.

Quando houver qualquer aviso de faixa de saúde (kcal baixa ou alta, proteína fora de g/kg, gordura baixa, água alta), acrescentar uma linha em destaque sob o campo, com o texto da seção 6.4. Avisos não bloqueiam salvar.

## 4. Casos de teste (funções puras)

Funções propostas, em um módulo novo `src/domain/dietTargets.ts` (nome indicativo; `backend-dados` decide a assinatura exata, mantendo estes comportamentos):

- `kcalFromMacros(p, c, g): number`
- `macroTolerance(kcal): number`
- `validateDietTargets(input, ctx?: { weightKg?: number }): { ok: true; value: DietTargets; warnings: Warning[] } | { ok: false; errors: Record<string, string> }`
- `resolveDietTargets(settings, dateCivil, profile?): DayTargetBase` (devolve, por tipo de dia, kcal e carboidrato; e proteína, gordura e água globais)
- `dayTargetFor(type, dateCivil, settings, profile): DayTarget` (compatível com `DayTarget` atual; `dayTargetForProfile` passa a ser um invólucro para o caso sem edição)
- `pushDietTargetsVersion(versions, today, targets | null): versions`
- `carbsFromRest(kcal, p, g): number` = `max(0, round((kcal - 4*p - 9*g) / 4))`

### 4.1 Cálculo e coerência

| # | Entrada (kcal, p, c, g) | Saída esperada |
| --- | --- | --- |
| 1 | 2450, 185, 305, 55 | `kcalFromMacros` 2455; tolerância 123 (`round(122,5)` = 123); diferença 5; sem aviso |
| 2 | 2600, 185, 340, 55 | 2595; tolerância 130; diferença 5; sem aviso |
| 3 | 2500, 185, 315, 55 | 2495; diferença 5; sem aviso |
| 4 | 2100, 185, 215, 55 | 2095; tolerância 105; diferença 5; sem aviso |
| 5 | 2000, 150, 285, 40 | 2100; tolerância 100; diferença 100 (igual à tolerância); sem aviso (limite inclusivo) |
| 6 | 2000, 150, 286, 40 | 2104; diferença 104 > 100; aviso `macros-incoerentes` |
| 7 | 2000, 185, 305, 55 | 2455; diferença 455; aviso `macros-incoerentes`; `ok: true` (salva) |
| 8 | 2450, 185, 340, 55 | 2595; diferença 145 > 123; aviso |
| 9 | `carbsFromRest(2450, 185, 55)` | 304 |
| 10 | `carbsFromRest(1000, 200, 100)` | 0 (resultado negativo vira 0) |

### 4.2 Limites absolutos (cada linha vale por campo, mantendo os demais válidos)

| # | Campo e entrada | Resultado |
| --- | --- | --- |
| 11 | kcal 999 | erro `kcal` |
| 12 | kcal 1000 | válido, com aviso `kcal-baixa` |
| 13 | kcal 6000 | válido, com aviso `kcal-alta` |
| 14 | kcal 6001 | erro |
| 15 | kcal 1399 / 1400 / 4500 / 4501 | aviso baixa / sem aviso / sem aviso / aviso alta |
| 16 | proteína 19 / 20 / 400 / 401 | erro / válido / válido / erro |
| 17 | carboidrato -1 / 0 / 800 / 801 | erro / válido / válido / erro |
| 18 | gordura 19 / 20 / 300 / 301 | erro / válido (aviso `gordura-baixa`) / válido / erro |
| 19 | gordura 29 / 30 | aviso `gordura-baixa` / sem aviso |
| 20 | água 0,5 / 1 / 6 / 6,5 | erro / válido / válido (aviso `agua-alta`) / erro |
| 21 | água "3,5" (texto com vírgula) | válido, 3,5 |
| 22 | água 2,75 | erro (não é múltiplo de 0,5) |
| 23 | água 5 / 5,5 | sem aviso / aviso `agua-alta` |
| 24 | kcal 2450,5 ou "2450,5" | erro (inteiro) |
| 25 | kcal vazio, "abc", `NaN`, `Infinity`, -100 | erro em cada caso |
| 26 | proteína " 185 " (espaços) | válido, 185 |

### 4.3 Proteína por g/kg (só com peso válido)

| # | Entrada | Resultado |
| --- | --- | --- |
| 27 | proteína manual 63, peso 80 | aviso `proteina-baixa` (63 < 0,8 x 80 = 64) |
| 28 | proteína manual 64, peso 80 | sem aviso |
| 29 | proteína manual 240, peso 80 | sem aviso (240 = 3,0 x 80, limite inclusivo) |
| 30 | proteína manual 241, peso 80 | aviso `proteina-alta` |
| 31 | proteína manual 63, sem peso | sem aviso de g/kg (só limites absolutos) |
| 32 | proteína manual 63, peso 29 (inválido) | sem aviso de g/kg |

### 4.4 Resolução da meta por data (inclui dias passados)

Estado de exemplo (padrão atual) = `settings.dietTargets` ausente.

| # | Situação | Resultado |
| --- | --- | --- |
| 33 | sem `dietTargets`, sem peso, tipo academia | kcal 2450, carb 305, prot 185, gord 55, água 3 |
| 34 | sem `dietTargets`, peso 80, academia | prot 192 (`round(80 x 2,4)`), demais iguais |
| 35 | sem `dietTargets`, peso 29, academia | prot 185 |
| 36 | versões `[{from:'2026-11-10', targets:T}]`, T: academia 2300/280, prot manual 160, gord 60, água 3,5; data 2026-11-10, tipo academia, peso 80 | kcal 2300, carb 280, prot 160 (manual ignora o peso), gord 60, água 3,5 |
| 37 | mesmas versões; data 2026-11-09 | padrão atual (meta do momento: ainda não havia edição) |
| 38 | mesmas versões; data futura 2026-12-01 | meta T |
| 39 | T com `proteinG: null`, peso 80, data >= from | prot 192 |
| 40 | versões `[{from:'2026-11-10', T}, {from:'2026-11-20', targets:null}]`; data 2026-11-15 / 2026-11-20 | meta T / padrão atual |
| 41 | `pushDietTargetsVersion` com `from` igual ao da última versão | substitui a última (não duplica) |
| 42 | `pushDietTargetsVersion` na 101ª versão | remove a mais antiga e muda o `from` da nova mais antiga para `'1970-01-01'` (limite de 100) |
| 43 | `pushDietTargetsVersion` com `from` anterior ao da última versão (relógio voltou) | erro `validation` ou `from` ajustado para o da última (backend-dados escolhe um; o teste confirma que a lista continua ordenada) |

### 4.5 Sanidade

| # | Teste |
| --- | --- |
| 44 | Para os 5 tipos, `dayTargetFor` sem edição devolve exatamente `kcal`, `carbs`, `waterL` e `fat` atuais (regressão de "nenhum número muda"). |
| 45 | `progress(totals, target)` continua igual para a meta padrão (nenhuma divisão por zero: meta de carboidrato 0 devolve razão 0, já tratado por `ratio`). |
| 46 | Copos de água: água 3 -> 6 copos; 3,5 -> 7 copos; 1 -> 2 copos. |

## 5. Dias passados: preservam a meta do momento

Recomendação: **usar a meta que valia no dia**, por histórico de versões com data de vigência.

Por quê:
- Percentuais e "restante" de dias já fechados não mudam depois que o usuário ajusta a meta. Quem baixa as kcal hoje não vê de repente que ontem "estourou" a meta.
- Não exige varrer nem reescrever registros antigos (dias sem registro continuam sem ocupar espaço).
- Ao contrário de gravar a meta dentro de cada dia, funciona também para dias nunca tocados e para quem registra atrasado um dia anterior (usa a meta que valia naquele dia).
- Já existe precedente no app: a refeição consumida guarda cópia dos números do momento (`consumed`), pelo mesmo motivo.

Alternativa descartada (usar sempre a meta atual): é mais simples, mas reescreve a história e confunde a Evolução e a constância. Alternativa descartada (cópia da meta em cada `DietDay`): cresce o arquivo e não cobre dias sem registro.

Regras:
- Quando o usuário salva, grava-se uma versão com `from` = data civil de hoje (relógio do aparelho, via o mesmo relógio injetável usado nos testes). Salvar duas vezes no mesmo dia substitui a versão do dia.
- A meta de um dia é a da última versão com `from <= data do dia`. Antes da primeira versão vale a meta de exemplo. Datas futuras usam a versão mais recente.
- Não há edição retroativa de metas passadas. Dono pode decidir depois (ver seção 8).
- Exceção documentada: a proteína em modo automático usa sempre o peso atual do perfil (como hoje).

## 6. Formato salvo, esquema e migração

### 6.1 Campos novos

Em `state.settings` (estado `StateV3`), campo opcional:

```
settings.dietTargets?: {
  schema: 1,
  versions: Array<{
    from: 'AAAA-MM-DD',          // data civil de vigência, ordem crescente
    targets: DietTargets | null  // null = meta de exemplo (restaurar padrão)
  }>                             // até 100 itens
}

DietTargets = {
  days: {                        // os 5 tipos, todos obrigatórios
    perna:    { kcal: int, carbs: int },
    academia: { kcal: int, carbs: int },
    jiujitsu: { kcal: int, carbs: int },
    volei:    { kcal: int, carbs: int },
    descanso: { kcal: int, carbs: int }
  },
  proteinG: int | null,          // null = automática pelo peso
  fatG: int,
  waterL: número (múltiplo de 0,5)
}
```

- Ausência de `settings.dietTargets` equivale a `versions: []` e significa "meta de exemplo". Não gravar o campo para quem não editou.
- "Meta confirmada" não tem campo próprio: é a existência de uma versão com `targets` diferente de `null` como a mais recente.
- Nenhum dado de meta vai para `history`, `catalog` nem para o perfil (`settings.profile`). O perfil continua só com dados pessoais.

### 6.2 Validação (`src/data/validation.ts`, `validateState`)

- `settings.dietTargets` ausente: válido.
- Presente: `schema === 1`; `versions` é lista de até 100 itens; cada `from` é data civil válida (usa `civil`), em ordem estritamente crescente; `targets` é `null` ou um `DietTargets` completo com todos os campos dentro dos limites absolutos da seção 3 (mesmos números da função pura; fonte única de constantes).
- Erro de tipo ou limite: rejeitar o backup com erro `validation` e a mensagem "As metas de dieta do backup são inválidas." (sem detalhar o valor). Consistente com os demais campos de `settings`.
- Compatibilidade futura: os limites absolutos só podem ser ampliados em versões futuras. Estreitar um limite exige migração, para não invalidar backups salvos.

### 6.3 Versão e migração

- A versão do estado continua 3. O campo é aditivo e opcional; nenhum backup v1, v2 ou v3 existente precisa de conversão. A migração de v1 e v2 (`migrate`) não cria o campo.
- Backups antigos continuam importando sem alteração e resultam em "meta de exemplo".
- Backup novo importado em versão anterior do app: o campo é ignorado (a validação atual não rejeita chaves desconhecidas em `settings`), mas é perdido se o usuário exportar de novo naquela versão. Aceitável; não exige bump de versão. Registrar no ADR.
- "Apagar tudo" (`eraseAll`) já remove `settings`; nada específico a fazer. Confirmar em teste de integração.
- Importação por substituição transacional (ADR 002): `dietTargets` entra no mesmo estado validado; sem fluxo extra.
- Persistência: ação do repositório que recebe a nova lista de `versions` e grava com o mecanismo de revisão atual (como a data de início do plano). Desfazer = regravar a lista anterior.

Testes de integração sugeridos: (a) backup v3 sem o campo importa e a meta é a de exemplo; (b) backup v3 com o campo válido importa e `resolveDietTargets` devolve os valores; (c) backup com `kcal` 999 é rejeitado; (d) round-trip exportar e importar preserva `versions`; (e) backup v2 legado importa sem o campo.

## 7. Texto da interface (português do Brasil)

Segue o glossário de [revisao-textos-ptbr.md](revisao-textos-ptbr.md): "kcal", "g", "ml", "L" com espaço e vírgula decimal; avisos rápidos curtos sem ponto final; "backup", "neste aparelho"; "descanso"; "3ª aula" não se aplica. Evitar o termo "macros" na tela, usando "proteína, carboidrato e gordura".

### 7.1 Entrada na Perfil

- Linha da lista: "Metas de dieta"; resumo "Meta de exemplo" ou "Metas personalizadas".
- Texto de proteína no Perfil (substitui o texto fixo de `Perfil.tsx`): com automática e peso: "Meta de proteína: 192 g por dia, 2,4 g por kg"; manual: "Meta de proteína: 160 g por dia (definida por você)"; sem peso e automática: "Meta de proteína: 185 g por dia (exemplo)".

### 7.2 Dieta

- Selo: "Meta de exemplo"
- Linha: "Valores de exemplo do plano. Ajuste para o seu caso."
- Botões: "Ajustar metas" e "Usar esta meta"
- Aviso rápido ao usar: "Meta confirmada"
- Rótulo de acesso do selo: "Meta de exemplo: ainda não foi confirmada"

### 7.3 Tela de edição ("Metas de dieta")

- Título: "Metas de dieta"
- Introdução: "Defina quanto você quer comer e beber por dia. Você pode mudar quando quiser. Dias que já passaram mantêm a meta que valia neles."
- Aviso de saúde: texto da seção 3.1.
- Seção "Por tipo de dia": subtítulo "Calorias e carboidrato"; linhas "Perna", "Academia", "Jiu-jitsu", "Vôlei", "Descanso"; rótulos de campo "Calorias (kcal)" e "Carboidrato (g)".
- Linha informativa por tipo de dia: "Proteína, carboidrato e gordura somam cerca de 2.455 kcal." (valor calculado, vírgula de milhar).
- Botão por tipo de dia: "Calcular carboidrato pelo que sobra" (ajuda: "Preenche o carboidrato com o que resta das calorias depois da proteína e da gordura.")
- Seção "Todos os dias": "Proteína (g)", com chave "Calcular pelo peso" e ajuda: "Usa 2,4 g por kg do peso do seu perfil." Sem peso: "Informe seu peso em Perfil para calcular. Enquanto isso, usamos 185 g." Com a chave desligada: campo "Proteína (g)" com ajuda "Defina o valor em gramas por dia."
- "Gordura (g)", ajuda: "Gramas por dia."
- "Água (L)", ajuda: "De 0,5 em 0,5 L. Cada copo do registro tem 500 ml."
- Botões: "Salvar metas", "Cancelar", "Restaurar padrão".
- Confirmação de restaurar: título "Restaurar as metas de exemplo?", corpo "Suas metas atuais deixam de valer a partir de hoje. Os dias anteriores não mudam.", botões "Restaurar" e "Cancelar".
- Avisos rápidos: "Metas salvas", "Metas restauradas" (com ação "Desfazer").

### 7.4 Avisos (não bloqueiam)

| Código | Texto |
| --- | --- |
| `macros-incoerentes` | "Proteína, carboidrato e gordura somam cerca de {x} kcal, diferente das calorias informadas ({y} kcal). Você pode salvar assim." |
| `kcal-baixa` | "Calorias abaixo de 1.400 kcal por dia costumam pedir acompanhamento profissional. Converse com um nutricionista ou médico antes de seguir." |
| `kcal-alta` | "Calorias acima de 4.500 kcal por dia são incomuns. Confira se o valor está certo." |
| `proteina-baixa` | "Proteína abaixo de 0,8 g por kg do seu peso. Confira se o valor está certo." |
| `proteina-alta` | "Proteína acima de 3,0 g por kg do seu peso. Se você tem doença nos rins ou outra condição, converse com um médico ou nutricionista." |
| `gordura-baixa` | "Gordura abaixo de 30 g por dia. Peça orientação a um nutricionista antes de manter uma meta tão baixa." |
| `agua-alta` | "Mais de 5 L de água por dia é muito. Se sentir mal-estar, procure um profissional de saúde." |

Todos os limiares destes avisos são "a verificar" (seção 3); não afirmar na tela o motivo científico, só a recomendação de conferir ou procurar profissional.

### 7.5 Erros (bloqueiam salvar)

| Campo | Mensagem |
| --- | --- |
| kcal fora do limite | "Calorias: informe um valor entre 1.000 e 6.000 kcal." |
| Proteína fora do limite | "Proteína: informe um valor entre 20 e 400 g." |
| Carboidrato fora do limite | "Carboidrato: informe um valor entre 0 e 800 g." |
| Gordura fora do limite | "Gordura: informe um valor entre 20 e 300 g." |
| Água fora do limite | "Água: informe um valor entre 1 e 6 L." |
| Água não múltiplo de 0,5 | "Água: use valores de 0,5 em 0,5 L. Exemplo: 3 ou 3,5." |
| Inteiro inválido | "{Campo}: use um número inteiro, sem vírgula. Exemplo: 185." |
| Vazio | "{Campo}: preencha este campo." |
| Não numérico | "{Campo}: use só números." |
| Resumo (no topo, `role="alert"`) | "Corrija os campos destacados para salvar." |
| Falha ao salvar | "Não foi possível salvar as metas. O que você digitou continua na tela. Tente de novo." |

Rótulo de erro usa o mesmo estilo de `validateProfile` ("Campo: ...").

### 7.6 Acessibilidade

- Cada aviso fica logo abaixo do campo ou da linha do tipo de dia, associado por `aria-describedby`; erros em `aria-invalid` e anúncio por região `role="alert"`.
- Aviso de saúde é texto fixo, não tooltip.
- Mover o foco para o primeiro campo com erro ao tentar salvar.

## 8. Pontos que dependem do dono

1. Aplicar a nova meta só a partir de hoje (recomendado) ou permitir "aplicar também aos dias anteriores desta semana". Recomendo só a partir de hoje.
2. Os limites de aviso de saúde (1.400 e 4.500 kcal, 0,8 e 3,0 g/kg, 30 g de gordura, 5 L de água) são prudência de produto, a verificar. Recomendo manter assim e revisar com nutricionista antes de divulgar amplamente.
3. Se quem já usa o app (o dono) vê o selo "Meta de exemplo" uma vez, até tocar em "Usar esta meta". Recomendo que sim, por ser o mesmo comportamento para todos.

## 9. Não incluído nesta entrega

- Sugestões da revisão semanal (+/- kcal) continuam só como texto; não alteram a meta sozinhas. Aplicar a sugestão à meta fica para uma fase futura.
- Cálculo de gasto energético por Mifflin-St Jeor a partir do perfil (existe só na especificação textual) não entra aqui; pode alimentar uma sugestão de meta depois, com a ressalva "a verificar".
- Edição dos textos de foco e ajustes por tipo de dia.

## 10. Tarefas por agente

`backend-dados`: módulo puro com as funções da seção 4, constantes de limites compartilhadas com a validação, campo `settings.dietTargets` e `validateState`, ação do repositório (salvar e restaurar com desfazer), testes de unidade (tabela da seção 4) e de integração (seção 6.3).

`frontend`: tela de edição (Sheet) a partir de Perfil, selo e botões na Dieta, atualização do texto de proteína no Perfil, uso de `dayTargetFor` em `useDietDay.ts` e `Dieta.tsx` (água em copos), textos da seção 7, testes de interface (selo some ao confirmar, avisos não bloqueiam, erros bloqueiam).

`conteudo-treino-nutricao`: ao final, atualizar a seção 4 de `docs/ESPECIFICACAO.md` ("valores de exemplo configuráveis") e revisar os textos aplicados.
