# Proposta: cardápio recomendado pelo assistente (só no papel)

Data: 22/11/2026. Autor: agente `conteudo-treino-nutricao`. Status: **proposta, aguarda o dono**. Nenhum código foi mudado. Nenhum número do plano do dono muda: o cardápio do dono continua igual para quem não usar o assistente.

Ideia em uma frase: depois do assistente, o app monta as refeições da pessoa com uma regra fixa (sem servidor, sem IA) sobre uma tabela de alimentos que já vem dentro do app. As metas continuam vindo da conta que já existe (`buildDietTargetsFromAnswers`).

Aviso que aparece sempre junto do cardápio: "Este cardápio é uma sugestão automática e não substitui nutricionista ou médico. Se você tem alguma condição de saúde, procure um profissional."

---

## 1. Perguntas novas de dieta no assistente

Hoje são 9 telas. Para não passar de 10, propomos: **juntar "tempo por treino" e "local de treino" numa tela só** (economiza 1) e colocar as perguntas novas em **2 telas**, que só aparecem se a pessoa respondeu a tela de corpo (sexo, idade, altura, peso). Total: 10 telas no caminho completo, 8 para quem pula a dieta.

### Tela A: "Como você come?"
Título: **Como você come?**
Texto: "Isso ajuda o app a sugerir alimentos que fazem sentido para você."

1. **Tipo de alimentação** (obrigatória, uma opção):
   - Como de tudo
   - Vegetariano (como ovo e laticínios)
   - Vegano (nada de origem animal)
2. **Restrições** (opcional, marque quantas quiser):
   - Sem lactose
   - Sem glúten
   - Alergia a ovo
   - Alergia a peixe ou frutos do mar
   - Alergia a amendoim ou castanhas
   - Alergia a soja
   Aviso abaixo, fixo: "O app só tira esses alimentos da sugestão. Ele não garante que um produto seja livre de alérgenos: confira sempre o rótulo. Em caso de alergia, siga a orientação do seu médico."
3. **Refeições por dia** (obrigatória, padrão 4): 3 · 4 · 5 · 6

### Tela B: "Quanto você quer seguir?"
1. **Nível de dedicação** (obrigatória, padrão "Seguir cardápio"):
   - **Só bater a proteína**: "Eu como do meu jeito. Me mostre quanto de proteína comer e de onde tirar."
   - **Seguir cardápio**: "Quero refeições prontas, com quantidades."
2. **Alimentos que você não come** (opcional, marque quantos quiser; só aparece em "Seguir cardápio"):
   Frango · Carne vermelha · Peixe · Atum em lata · Ovo · Leite · Iogurte · Queijo · Tofu · Feijão · Lentilha ou grão-de-bico · Batata-doce · Aveia · Pão · Macarrão · Banana · Brócolis · Whey ou proteína em pó
   Texto: "Pode mudar depois na aba Dieta."

Regra: se a pessoa pular a tela de corpo, as telas A e B não aparecem e o app mantém o cardápio de exemplo do dono, como hoje.

---

## 2. Tabela de alimentos proposta (88 itens)

Fonte pretendida: **TACO, Tabela Brasileira de Composição de Alimentos (NEPA/Unicamp)**. Itens industrializados (whey, proteína vegana, bebida de soja, PTS) vêm do rótulo médio, não da TACO. **Todos os valores abaixo são aproximados e estão (a verificar)** item a item contra a TACO antes de entrar no app. **A licença da TACO para uso num repositório público MIT está (a verificar)**: não tenho acesso à internet e não afirmo nada sobre ela. Se não puder, alternativa: valores de rótulo médio redigidos pelo projeto, sem copiar a tabela.

Etiquetas: **V** vegano, **Vg** vegetariano, **L** contém lactose, **G** contém glúten, **O** ovo, **Pe** peixe, **Am** amendoim/castanha, **S** soja. Refeição: **c** café, **a** almoço/jantar, **l** lanche, **pre** pré-treino, **pos** pós-treino. Custo: **$** barato, **$$** médio. Papel: **P** proteína, **C** carboidrato, **Gd** gordura, **Le** legume/verdura, **F** fruta.

Valores por porção: kcal / proteína g / carboidrato g / gordura g. **(a verificar)**

| # | Alimento | Porção | kcal | P | C | G | Papel | Etiquetas |
|---|---|---|---|---|---|---|---|---|
| 1 | Peito de frango grelhado | 100 g | 159 | 32,0 | 0 | 2,5 | P | a,pos,$ |
| 2 | Coxa de frango assada sem pele | 100 g | 215 | 28,0 | 0 | 11,0 | P | a,$ |
| 3 | Patinho moído refogado | 100 g | 219 | 35,9 | 0 | 7,3 | P | a,$$ |
| 4 | Alcatra grelhada | 100 g | 235 | 31,9 | 0 | 11,6 | P | a,$$ |
| 5 | Lombo de porco assado | 100 g | 210 | 35,7 | 0 | 6,4 | P | a,$$ |
| 6 | Fígado bovino grelhado | 100 g | 225 | 29,9 | 4,2 | 9,0 | P | a,$ |
| 7 | Tilápia grelhada | 100 g | 128 | 26,0 | 0 | 2,7 | P | Pe,a,$$ |
| 8 | Sardinha em lata (drenada) | 1 lata 85 g | 160 | 18,0 | 0 | 9,5 | P | Pe,a,l,$ |
| 9 | Atum em água (drenado) | 100 g | 118 | 26,0 | 0 | 1,0 | P | Pe,a,l,$$ |
| 10 | Salmão grelhado | 100 g | 230 | 26,0 | 0 | 14,0 | P | Pe,a,$$ |
| 11 | Ovo cozido | 1 un 50 g | 73 | 6,7 | 0,3 | 4,8 | P | Vg,O,c,l,$ |
| 12 | Clara de ovo | 1 un 33 g | 16 | 3,6 | 0,2 | 0 | P | Vg,O,c,$ |
| 13 | Peito de peru fatiado | 30 g | 35 | 6,0 | 0,5 | 0,8 | P | c,l,$$ |
| 14 | Iogurte natural desnatado | 170 g | 70 | 6,5 | 9,9 | 0,5 | P | Vg,L,c,l,$ |
| 15 | Iogurte grego natural | 100 g | 120 | 6,0 | 6,0 | 8,0 | P | Vg,L,l,$$ |
| 16 | Leite desnatado | 200 ml | 70 | 6,8 | 9,8 | 0,2 | P | Vg,L,c,$ |
| 17 | Leite integral | 200 ml | 120 | 6,0 | 9,0 | 6,5 | P | Vg,L,c,$ |
| 18 | Leite zero lactose semidesnatado | 200 ml | 90 | 6,0 | 9,0 | 3,0 | P | Vg,c,$ |
| 19 | Queijo minas frescal | 30 g | 79 | 5,2 | 1,0 | 6,1 | P | Vg,L,c,l,$$ |
| 20 | Queijo muçarela | 30 g | 99 | 6,8 | 0,9 | 7,6 | P | Vg,L,c,$$ |
| 21 | Queijo cottage | 50 g | 50 | 6,5 | 1,5 | 2,0 | P | Vg,L,c,l,$$ |
| 22 | Ricota | 50 g | 70 | 6,0 | 1,8 | 4,0 | P | Vg,L,c,$$ |
| 23 | Requeijão light | 20 g | 35 | 2,0 | 1,0 | 2,5 | Gd | Vg,L,c,$$ |
| 24 | Whey protein concentrado | 30 g | 120 | 24,0 | 3,0 | 1,5 | P | Vg,L,pos,l,$$ |
| 25 | Whey zero lactose (rótulo) | 30 g | 115 | 24,0 | 2,0 | 1,0 | P | Vg,pos,l,$$ |
| 26 | Proteína vegana em pó (rótulo) | 30 g | 115 | 22,0 | 3,0 | 2,0 | P | V,S?,pos,l,$$ |
| 27 | Tofu firme | 100 g | 64 | 6,6 | 2,1 | 4,0 | P | V,S,a,$$ |
| 28 | Proteína de soja texturizada (seca) | 30 g | 100 | 15,0 | 9,0 | 0,3 | P | V,S,a,$ |
| 29 | Tempeh | 100 g | 190 | 19,0 | 9,0 | 11,0 | P | V,S,a,$$ |
| 30 | Edamame cozido | 100 g | 120 | 11,0 | 9,0 | 5,0 | P | V,S,a,l,$$ |
| 31 | Bebida de soja (rótulo) | 200 ml | 80 | 6,0 | 6,0 | 3,6 | P | V,S,c,$ |
| 32 | Feijão carioca cozido | 1 concha 100 g | 76 | 4,8 | 13,6 | 0,5 | P/C | V,a,$ |
| 33 | Feijão preto cozido | 1 concha 100 g | 77 | 4,5 | 14,0 | 0,5 | P/C | V,a,$ |
| 34 | Lentilha cozida | 100 g | 93 | 6,3 | 16,3 | 0,5 | P/C | V,a,$ |
| 35 | Grão-de-bico cozido | 100 g | 120 | 7,0 | 20,0 | 2,0 | P/C | V,a,l,$ |
| 36 | Ervilha cozida | 100 g | 80 | 5,5 | 13,0 | 0,5 | P/C | V,a,$ |
| 37 | Arroz branco cozido | 100 g (4 col. sopa) | 128 | 2,5 | 28,1 | 0,2 | C | V,a,$ |
| 38 | Arroz integral cozido | 100 g | 124 | 2,6 | 25,8 | 1,0 | C | V,a,$ |
| 39 | Macarrão cozido | 100 g | 135 | 4,5 | 27,0 | 0,7 | C | V,G,a,$ |
| 40 | Macarrão sem glúten (arroz) cozido | 100 g | 130 | 2,5 | 28,0 | 0,5 | C | V,a,$$ |
| 41 | Batata-doce cozida | 100 g | 77 | 0,6 | 18,4 | 0,1 | C | V,a,pre,$ |
| 42 | Batata inglesa cozida | 100 g | 52 | 1,2 | 11,9 | 0 | C | V,a,$ |
| 43 | Mandioca cozida | 100 g | 125 | 0,6 | 30,1 | 0,3 | C | V,a,$ |
| 44 | Inhame cozido | 100 g | 97 | 2,1 | 23,2 | 0,1 | C | V,a,$ |
| 45 | Cuscuz de milho | 100 g | 113 | 2,2 | 25,3 | 0,7 | C | V,c,a,$ |
| 46 | Polenta cozida | 100 g | 70 | 1,5 | 15,0 | 0,3 | C | V,a,$ |
| 47 | Quinoa cozida | 100 g | 120 | 4,4 | 21,3 | 1,9 | C | V,a,$$ |
| 48 | Pão francês | 1 un 50 g | 150 | 4,0 | 29,3 | 1,6 | C | V?,G,c,l,pre,$ |
| 49 | Pão de forma integral | 2 fatias 50 g | 127 | 4,7 | 24,9 | 1,9 | C | V?,G,c,l,$ |
| 50 | Pão sem glúten | 2 fatias 50 g | 130 | 2,0 | 25,0 | 3,0 | C | c,l,$$ |
| 51 | Tapioca (goma) | 30 g | 70 | 0 | 17,0 | 0 | C | V,c,l,pre,$ |
| 52 | Aveia em flocos | 30 g (3 col. sopa) | 118 | 4,4 | 20,0 | 2,6 | C | V,G*,c,pre,$ |
| 53 | Granola sem açúcar | 30 g | 130 | 3,0 | 20,0 | 4,0 | C | V,G,c,$$ |
| 54 | Biscoito de arroz | 2 un 18 g | 70 | 1,4 | 15,0 | 0,5 | C | V,l,pre,$ |
| 55 | Milho verde cozido | 100 g | 100 | 3,3 | 22,0 | 1,0 | C | V,a,$ |
| 56 | Banana prata | 1 un 70 g | 69 | 0,9 | 18,2 | 0,1 | F | V,c,l,pre,$ |
| 57 | Maçã | 1 un 130 g | 73 | 0,4 | 19,9 | 0 | F | V,l,$ |
| 58 | Mamão papaia | 1/2 un 150 g | 60 | 0,8 | 15,0 | 0,1 | F | V,c,$ |
| 59 | Laranja | 1 un 150 g | 56 | 1,3 | 13,5 | 0,2 | F | V,l,$ |
| 60 | Manga | 100 g | 64 | 0,4 | 16,7 | 0,3 | F | V,l,$ |
| 61 | Melancia | 200 g | 66 | 1,8 | 16,2 | 0 | F | V,l,$ |
| 62 | Abacaxi | 100 g | 48 | 0,9 | 12,3 | 0,1 | F | V,l,$ |
| 63 | Uva | 100 g | 53 | 0,7 | 13,6 | 0,2 | F | V,l,$$ |
| 64 | Morango | 100 g | 30 | 0,9 | 6,8 | 0,3 | F | V,c,l,$$ |
| 65 | Uva-passa | 20 g | 60 | 0,6 | 15,0 | 0 | F | V,pre,$$ |
| 66 | Tâmara | 2 un 20 g | 56 | 0,4 | 15,0 | 0 | F | V,pre,$$ |
| 67 | Mel | 1 col. sopa 15 g | 46 | 0 | 12,0 | 0 | C | Vg,pre,$ |
| 68 | Azeite de oliva | 1 col. sopa 10 g | 88 | 0 | 0 | 10,0 | Gd | V,a,$$ |
| 69 | Pasta de amendoim integral | 1 col. sopa 15 g | 90 | 4,0 | 3,0 | 7,0 | Gd | V,Am,c,l,$$ |
| 70 | Amendoim torrado | 20 g | 113 | 5,4 | 4,0 | 8,8 | Gd | V,Am,l,$ |
| 71 | Castanha-do-pará | 10 g (2 un) | 64 | 1,5 | 1,2 | 6,3 | Gd | V,Am,l,$$ |
| 72 | Castanha de caju | 20 g | 114 | 3,7 | 5,8 | 9,3 | Gd | V,Am,l,$$ |
| 73 | Abacate | 100 g | 96 | 1,2 | 6,0 | 8,4 | Gd | V,c,l,$ |
| 74 | Semente de chia | 10 g | 50 | 1,7 | 4,2 | 3,1 | Gd | V,c,$$ |
| 75 | Coco ralado | 10 g | 60 | 0,6 | 1,0 | 6,0 | Gd | V,c,$ |
| 76 | Salada de folhas com tomate | 100 g | 20 | 1,0 | 3,5 | 0,2 | Le | V,a,$ |
| 77 | Brócolis cozido | 100 g | 25 | 2,1 | 4,4 | 0,5 | Le | V,a,$ |
| 78 | Cenoura cozida | 50 g | 15 | 0,4 | 3,4 | 0,1 | Le | V,a,$ |
| 79 | Abobrinha refogada | 100 g | 20 | 1,1 | 3,0 | 0,3 | Le | V,a,$ |
| 80 | Couve refogada | 50 g | 45 | 0,9 | 4,3 | 3,0 | Le | V,a,$ |
| 81 | Abóbora cabotiá cozida | 100 g | 48 | 1,4 | 10,8 | 0,7 | Le | V,a,$ |
| 82 | Beterraba cozida | 50 g | 25 | 0,7 | 5,0 | 0 | Le | V,a,$ |
| 83 | Chuchu cozido | 100 g | 17 | 0,4 | 4,1 | 0 | Le | V,a,$ |
| 84 | Vagem cozida | 100 g | 25 | 1,5 | 5,0 | 0,2 | Le | V,a,$ |
| 85 | Couve-flor cozida | 100 g | 19 | 1,2 | 3,9 | 0,3 | Le | V,a,$ |
| 86 | Pepino | 100 g | 10 | 0,9 | 2,0 | 0 | Le | V,a,$ |
| 87 | Repolho refogado | 100 g | 30 | 1,0 | 5,0 | 1,0 | Le | V,a,$ |
| 88 | Espinafre refogado | 50 g | 35 | 1,5 | 2,0 | 2,5 | Le | V,a,$ |

Notas: "V?" no pão: alguns levam leite ou ovo, a etiqueta final depende da receita escolhida. "G*" na aveia: aveia comum pode ter contaminação com glúten; quem marcar "sem glúten" só recebe aveia se o dono aceitar mostrar "use aveia rotulada sem glúten" (a verificar). "S?" na proteína vegana: muitas são de ervilha, outras de soja; o app trata como soja para quem tem alergia (lado seguro).

---

## 3. Modelos de refeição

Cada refeição é um "molde" com papéis. O app escolhe um alimento por papel, respeitando restrições e "não como".

| Refeição | Molde |
|---|---|
| Café da manhã | 1 P (ovo, laticínio, whey ou bebida de soja) + 1 C (pão, aveia, cuscuz, tapioca) + 1 F; opcional 1 Gd |
| Almoço | 1 P + 1 C (arroz, batata, macarrão, mandioca) + 1 leguminosa (feijão, lentilha) + 1 Le + 1 Gd (azeite) |
| Jantar | igual ao almoço; a leguminosa é opcional |
| Lanche | 1 P (iogurte, queijo, whey, atum) + 1 C ou F; opcional 1 Gd |
| Pré-treino (1 a 2 h antes) | 1 C de digestão fácil (banana, pão, tapioca, aveia, batata-doce) + P pequena opcional; Gd no máximo 10 g |
| Pós-treino | 1 P (20 a 40 g de proteína) + 1 C |

Quais moldes entram em cada número de refeições (dia de academia):
- 3: café, almoço, jantar.
- 4: café, almoço, lanche pré-treino, jantar.
- 5: café, lanche, almoço, lanche pré-treino, jantar.
- 6: café, lanche, almoço, pré-treino, pós-treino, jantar.

Divisão da proteína: o mais igual possível entre as refeições, cada uma com pelo menos 20 g se der (a verificar: a ideia de "distribuir a proteína" é posicionamento comum em nutrição esportiva, não conferido aqui). Vegetarianos e veganos: almoço e jantar sempre com leguminosa.

---

## 4. Regra de ajuste das porções e de troca

Entrada: metas do tipo de dia (kcal, proteína, gordura, carboidrato) já calculadas pelo app. Saída: lista de refeições com alimento e quantidade.

Passo a passo (função pura, sempre o mesmo resultado para as mesmas respostas):
1. Escolhe os alimentos de cada molde: o primeiro da tabela (na ordem de preferência: mais barato, depois mais comum) que passa nos filtros. Varia o alimento de proteína entre almoço e jantar.
2. **Proteína primeiro**: divide a meta entre as refeições e ajusta a porção do alimento P de cada uma.
3. **Gordura**: põe azeite, castanha ou pasta de amendoim até chegar perto da meta.
4. **Carboidrato fecha as calorias**: aumenta ou diminui os alimentos C (e frutas) até as kcal caírem na tolerância.
5. Arredonda e confere de novo; se saiu da tolerância, ajusta o carboidrato de maior porção em um passo.

Tolerâncias (o dia inteiro, contra a meta):
- kcal: de -5% a +5%.
- Proteína: de -5% a +15% (passar um pouco é aceito; os cereais e o feijão somam proteína).
- Gordura: de -10% a +15%, e nunca abaixo de 40 g (mesmo piso do app).
- Carboidrato: livre, é o que fecha as calorias.

Arredondamento para medida caseira:
- Carnes, peixes, tofu, arroz, batatas, massas, legumes: passos de 10 g (mostrar "≈ 4 colheres de sopa" quando houver medida).
- Ovo, pão, fruta, lata: unidade inteira (meia unidade só para pão e fruta grande).
- Aveia, PTS, whey, proteína em pó: passos de 10 g (1 colher de sopa ≈ 10 g, a verificar).
- Azeite, pasta de amendoim: passos de 5 g (meia colher de sopa).
- Leite, iogurte, bebida vegetal: passos de 50 ml ou 50 g.

Limites por refeição (mínimo / máximo):
- Carne, frango, peixe: 80 / 250 g. Tofu: 80 / 250 g. PTS seca: 20 / 80 g.
- Ovos: 1 / 4 unidades por refeição.
- Whey ou proteína em pó: 0 / 40 g por refeição e no máximo 2 doses por dia.
- Arroz, macarrão, batatas, mandioca: 50 / 400 g. Pão: 1 / 3 unidades. Aveia: 20 / 80 g.
- Azeite: 5 / 15 g por refeição. Castanhas e pasta de amendoim: 10 / 30 g.
- Legumes: mínimo 100 g no almoço e no jantar, sem máximo.
Se não der para fechar dentro dos limites, mostra o cardápio mais próximo e o aviso: "Não deu para chegar exatamente na meta com estes alimentos. Fique perto e veja a evolução semanal."

Trocar este alimento (botão em cada item):
- Mostra até 3 opções do **mesmo papel** (P por P, C por C), que passem nas restrições e em "não como".
- Ordena pela diferença de macros, com a quantidade recalculada para dar **as mesmas kcal** e, se o papel é P, **a mesma proteína** (prioridade da proteína).
- Aceita a troca se, depois de recalcular, a refeição continua com proteína em até ±5 g e kcal em até ±10% do que era. Senão a opção não aparece.
- A troca fica salva para a pessoa; o resto do dia não muda.

Exemplo para teste: almoço com frango 150 g (239 kcal, 48 g P). Trocar por tilápia: 185 g → 237 kcal, 48,1 g P (arredonda para 190 g: 243 kcal, 49,4 g P). Aceita.

---

## 5. Quando NÃO gera cardápio

Nestes casos o app não monta refeições nem sugere quantidades. Mostra só orientação geral (e as metas, quando o app já as mostra hoje) e o texto: "Para o seu caso, o ideal é montar a alimentação com nutricionista ou médico. O app mostra só orientações gerais."

1. Gestação ou amamentação (ADR 012, P2: hoje já fica sem metas de dieta).
2. Transtorno alimentar informado (ADR 012, P3; sem metas de dieta, como hoje).
3. Condição de saúde marcada no passo 0 (diabetes, doença renal, cardíaca etc.).
4. Menor de 18 anos. Observação: o ADR 012 bloqueia o **plano** só abaixo de 14; aqui a proposta é mais restrita só para o **cardápio** (de 14 a 17 ficam metas gerais, sem cardápio). Decisão do dono.
5. IMC abaixo de 18,5, com qualquer objetivo (o app hoje só troca "perder" por "saúde" nesse caso).
6. Sem idade, altura ou peso (`sem-dados`): fica o cardápio de exemplo do dono, como hoje.

Coerência com o código: são os casos em que `buildDietTargetsFromAnswers` devolve `kind: 'none'`, mais os itens 4 e 5, que seriam uma regra nova só do cardápio.

---

## 6. Cinco cardápios de exemplo (dia de academia)

As metas abaixo usei a conta atual do app (Mifflin, fator da rotina, +200 kcal no dia de academia, ajuste do objetivo, proteína e gordura por kg). Os pesos e alturas são inventados para o exemplo. **Valores dos alimentos (a verificar)**; conferir as metas rodando o app antes de virar teste.

### (a) Homem, 30 anos, 180 cm, 80 kg, rotina moderada, onívoro, ganhar massa, 4 refeições
Meta: **2.750 kcal · 145 g P · 65 g G · ~396 g C**

| Refeição | Itens | kcal | P | C | G |
|---|---|---|---|---|---|
| Café | 2 pães franceses, 3 ovos, 1 banana, 200 ml leite desnatado | 658 | 35,8 | 87,5 | 17,9 |
| Almoço | arroz 300 g, feijão 150 g, frango 150 g, salada 100 g, azeite 10 g | 845 | 63,8 | 108,3 | 15,4 |
| Lanche pré-treino | aveia 60 g, 1 banana, 1 maçã, pasta de amendoim 15 g | 468 | 14,1 | 81,1 | 12,3 |
| Jantar | macarrão 300 g, patinho moído 100 g, brócolis 100 g, azeite 10 g | 737,5 | 51,6 | 85,4 | 20,0 |
| **Total** | | **2.708** | **165,3** | **362,3** | **65,6** |
| Contra a meta | | -1,5% | +14% | -8% | +1% |

### (b) Mulher, 25 anos, 165 cm, 62 kg, moderada, vegetariana, perder gordura, 3 refeições
Meta: **1.600 kcal · 125 g P · 50 g G · ~162 g C**

| Refeição | Itens | kcal | P | C | G |
|---|---|---|---|---|---|
| Café | 2 ovos, iogurte desnatado 170 g, whey 30 g, aveia 30 g, 1 banana | 523 | 49,2 | 51,7 | 14,3 |
| Almoço | arroz 100 g, lentilha 150 g, tofu 150 g, 1 ovo, salada 100 g, azeite 5 g | 500,5 | 29,6 | 59,6 | 17,0 |
| Jantar | PTS 60 g (seca), queijo minas 60 g, batata-doce 150 g, brócolis 100 g, feijão 100 g | 574,5 | 48,2 | 65,6 | 14,0 |
| **Total** | | **1.598** | **127,0** | **176,9** | **45,3** |
| Contra a meta | | -0,1% | +1,6% | +9% | -9% |

Nota: com 3 refeições e 125 g de proteína, só fecha com whey e PTS. Sem pó de proteína, o app deveria sugerir 4 refeições.

### (c) Homem, 40 anos, 175 cm, 85 kg, rotina parada, sem lactose, recomposição, 5 refeições
Meta: **2.050 kcal · 170 g P · 70 g G · ~185 g C**

| Refeição | Itens | kcal | P | C | G |
|---|---|---|---|---|---|
| Café | pão integral 2 fatias, 3 ovos, 1 banana | 415 | 25,7 | 44,0 | 16,4 |
| Lanche | whey zero lactose 30 g, 1 maçã, castanha-do-pará 20 g | 321 | 27,4 | 25,3 | 14,1 |
| Almoço | arroz 150 g, feijão 100 g, frango 150 g, salada 100 g, azeite 15 g | 659 | 57,6 | 59,3 | 19,8 |
| Pré-treino | atum 100 g, 1 pão francês | 268 | 30,0 | 29,3 | 2,6 |
| Jantar | tilápia 150 g, batata 200 g, brócolis 100 g, azeite 10 g | 409 | 43,5 | 28,2 | 14,6 |
| **Total** | | **2.072** | **184,2** | **186,1** | **67,5** |
| Contra a meta | | +1,1% | +8% | +1% | -4% |

(Na tabela o whey zero lactose tem 115 kcal; nas contas usei 120 kcal e 24 g P, a diferença é de 5 kcal.)

### (d) Mulher, 35 anos, 160 cm, 58 kg, moderada, vegana, saúde, 4 refeições
Meta: **1.800 kcal · 95 g P · 45 g G · ~254 g C**

| Refeição | Itens | kcal | P | C | G |
|---|---|---|---|---|---|
| Café | aveia 40 g, bebida de soja 200 ml, 1 banana, pasta de amendoim 15 g | 396 | 16,8 | 53,9 | 14,2 |
| Almoço | arroz 200 g, feijão 150 g, tofu 150 g, salada 100 g, azeite 5 g | 530 | 23,1 | 83,3 | 12,4 |
| Lanche pré-treino | pão integral 2 fatias, proteína vegana 30 g, 1 maçã, castanha-do-pará 10 g | 379 | 28,6 | 49,0 | 10,2 |
| Jantar | macarrão 150 g, PTS 30 g, lentilha 100 g, brócolis 100 g, azeite 5 g | 464,5 | 30,2 | 70,2 | 7,4 |
| **Total** | | **1.769,5** | **98,7** | **256,4** | **44,2** |
| Contra a meta | | -1,7% | +4% | +1% | -2% |

Texto extra para veganos: "Na alimentação vegana, a vitamina B12 costuma precisar de suplemento (a verificar). Converse com um nutricionista ou médico."

### (e) "Só bater a proteína": homem, 28 anos, 175 cm, 75 kg, moderado, recomposição, 4 refeições
Meta mostrada: **150 g de proteína por dia** (calorias só como referência: ~2.200 kcal no dia de academia).
O app não monta cardápio. Mostra a meta dividida e "atalhos" de proteína:

| Refeição | Proteína-alvo | Exemplos que batem (escolha um) |
|---|---|---|
| Café | 35 g | 3 ovos + 200 ml de leite (26,9 g) + 1 fatia de queijo minas 30 g (5,2 g) = 32 g |
| Almoço | 40 g | frango 125 g (40 g) |
| Lanche | 35 g | whey 30 g (24 g) + iogurte desnatado 170 g (6,5 g) + ... ou atum 130 g (34 g) |
| Jantar | 40 g | patinho moído 110 g (39,5 g) ou tilápia 155 g (40,3 g) |
| **Total** | **150 g** | arroz, feijão e pão do dia somam mais uns 10 a 20 g |

Texto da tela: "Coma do seu jeito. Tente ter uma fonte de proteína em cada refeição e marque no app quando bater a meta."

---

## 7. Riscos e decisões do dono

1. **Licença da TACO (a verificar)**: pode ou não copiar os valores num repositório público MIT? Se não, usar valores próprios de rótulo médio.
2. **Menor de 18 sem cardápio**: aceita ser mais restrito que o ADR 012 (que bloqueia o plano só abaixo de 14)?
3. **IMC abaixo de 18,5 sem cardápio** para qualquer objetivo: aceita?
4. **Telas**: aceita juntar "tempo" e "local de treino" numa tela e ter 2 telas novas de dieta (10 no total)?
5. **Pó de proteína** (whey, proteína vegana) entra por padrão no cardápio ou só se a pessoa marcar que usa? Sem ele, metas altas com 3 refeições não fecham (exemplo b).
6. **Tolerâncias**: kcal ±5% e proteína de -5% a +15% estão boas?
7. **Alergias**: o app só tira alimentos e manda conferir rótulo. Aceita esse limite, sem prometer "livre de alérgeno"?
8. **Variedade**: o cardápio é fixo (mesmo dia toda semana) com botão de troca, ou deve girar sozinho entre 2 ou 3 versões?
9. Risco técnico: a tabela soma ~10 KB no app; é pouco para o PWA offline, mas confirmar com o orçamento do ADR 006.
10. Registro: se aprovado, abrir ADR em `docs/decisoes/` com estas regras antes de qualquer código.
