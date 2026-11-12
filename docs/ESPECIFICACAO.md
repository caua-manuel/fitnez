# Especificação do sistema: Treino 12 semanas

## 1. Visão

Um app de uso diário, no celular, para executar um plano de 12 semanas que combina musculação (força e hipertrofia), jiu-jitsu e vôlei de praia, com dieta de recomposição corporal (ganhar músculo e perder gordura). O app deve responder, a qualquer momento, três perguntas: **o que eu treino hoje, quanto de carga uso e o que eu como**.

Usuário (perfil de exemplo, configurável): uma pessoa adulta com experiência de musculação e iniciante em jiu-jitsu, que treina 3 vezes por semana na academia, faz 2 aulas de jiu-jitsu (pode chegar a 3) e joga vôlei na praia no fim de semana. Paladar seletivo (pouca verdura), orçamento limitado, rotina puxada.

Referência de comportamento e visual: `legacy/index.html`.

## 2. Módulos e critérios de aceite

### 2.1 Hoje
- Mostra a data, a fase (pré-semana, semana N, bloco, deload ou concluído), o RIR da semana e a **faixa de progresso** de 12 semanas.
- Atalho para a dieta do dia com o total de refeições e de calorias.
- Mostra o treino do dia conforme a rotina da semana, ou o treino escolhido no seletor "Trocar treino de hoje".
- Por exercício: séries-alvo do bloco (metade no deload), repetições-alvo, nota do exercício, última carga usada, nota da última vez, linhas de série (carga, repetições, concluir) e "série extra".
- Ao concluir uma série: preenche carga e repetições vazias com os valores da última vez e inicia o **timer de descanso** (tempo configurável por exercício, com −15 s, +15 s e pular).
- Notas por exercício e do treino. Ao concluir o treino, mostra séries feitas e volume total (kg × repetições).
- Dias de jiu-jitsu: marcar aula, registrar "como terminou" (1 a 5: leve, ok, cansado, muito, destruído) e anotações.
- Dia de vôlei: marcar jogo ou trocar pelo treino alternativo (Lower B opcional).
- Dia de descanso: checklist do treino do condomínio (opcional).
- Qualquer dia pode ser aberto pela Agenda para registrar o que foi esquecido.
- **Aceite:** registrar uma série leva no máximo 2 toques quando a carga é a mesma da última vez.

### 2.2 Agenda
- As 12 semanas com 7 dias cada, o rótulo do treino de cada dia, o que foi feito, o dia atual e a nota da semana (Natal, Réveillon, testes).
- Cabeçalho de cada semana: bloco, RIR e quantos treinos e aulas foram feitos.
- Tocar em um dia abre o dia na tela Hoje.

### 2.3 Treinos (CRUD)
- Lista de treinos com nome, descrição, número de exercícios, séries no bloco 1 e dias da rotina em que aparece.
- **Rotina da semana:** escolher, para cada dia, aula com kimono, aula sem kimono, vôlei, descanso ou qualquer treino. A agenda se recalcula.
- Criar, renomear (nome, descrição, duração) e excluir treino, com confirmação e **desfazer**.
- Por exercício: nome, tipo de registro, séries e repetições para cada bloco, descanso, observação; adicionar, remover e reordenar.
- Tipos de registro: carga e repetições; peso do corpo mais carga extra; só repetições; só tempo; carga e tempo.
- Treino do condomínio: lista editável de itens.
- Remover um exercício não apaga o histórico de registros dele.
- **Aceite:** editar o plano nunca altera registros já feitos.

### 2.4 Dieta
- Cinco refeições: café da manhã, almoço, pré-treino ou lanche, pós-treino e jantar. Cada uma tem 3 opções (A, B e C) com itens, calorias, proteína, carboidrato e gordura (`data/diet.json`) e um texto curto "por quê" ligado ao treino.
- Por refeição: escolher a opção, marcar "comi" ou "pular", abrir a receita.
- **Tipo de dia** (calculado pelo treino do dia): define meta de calorias e de carboidrato, o foco do dia e os "ajustes de hoje" (ver seção 4).
- Resumo do dia: barras de calorias, proteína e carboidrato consumidos contra a meta do dia.
- Extras: contador de água (copos de 500 ml, meta conforme o tipo de dia) e checklist da creatina.
- Aba Treino da dieta: o que comer antes, durante e depois; jiu-jitsu às 6:30; cafeína opcional; sono.
- Aba Receitas (`data/recipes.json`) e aba Metas (tabela da semana, como ajustar, suplementos, vegetais, quentinha).
- Dicas por dia: jiu-jitsu em horário configurável (exemplo: 6:30), dias de rotina mais puxada.
- **Aceite:** trocar a opção de uma refeição atualiza os totais na hora.

### 2.5 Evolução
- Contagem de treinos, aulas e jogos feitos.
- Curva da melhor série de cada exercício com carga (carga ou repetições, conforme o caso).
- Registro de medidas (peso, cintura, braço, coxa) com a diferença para a primeira medida.
- **Novo:** gráfico de séries semanais por grupo muscular (ver 8), peso médio semanal e cintura ao longo das semanas.

### 2.6 Mais
- Tema (automático, claro, escuro) e data de início do plano.
- Backup (baixar, copiar, importar), restaurar treinos originais, apagar registros (com confirmação).
- Guia rápido: semana-tipo, blocos e RIR, progressão, cuidados com dor, critérios da 3ª aula.

### 2.7 Transversais
- PWA instalável, funciona offline.
- Armazenamento local (IndexedDB), com backup em JSON e lembrete semanal de backup (seção 7).
- Confirmações para ações destrutivas e "desfazer" quando possível.

## 3. Regras do plano de treino

**Calendário**
- A data de início pode ser qualquer dia; o plano usa a **segunda-feira da semana** escolhida. Padrão: `2026-11-16`.
- `idx` = dias desde a segunda inicial. Antes de 0 é "pré-semana"; de 84 em diante é "concluído".
- `semana w = floor(idx / 7)`, de 0 a 11. `dia da semana = idx % 7` (0 é segunda).
- Bloco: semanas 0 a 3 é bloco 1 (B1), 4 a 7 é B2, 8 a 11 é B3.
- **Deload nas semanas 3, 7 e 11** (as semanas 4, 8 e 12 para o usuário): faz metade das séries, `max(1, ceil(n / 2))`, com a coluna do bloco anterior.
- RIR por semana: `3, 2–3, 2, 4, 2, 1–2, 1–2, 4, 2, 1–2, 1–2, 4`.
- Notas: semana 6 (Natal), semana 7 (Réveillon), semana 12 (testes de carga, medidas e fotos).

**Rotina padrão** (editável): segunda aula com kimono; terça Lower; quarta Upper A; quinta aula sem kimono; sexta Upper B; sábado vôlei (ou Lower B opcional); domingo descanso ou treino do condomínio.

**Restrições de agenda**
- Aulas sem kimono só existem na terça e na quinta; com kimono, nos outros dias.
- Pernas pesadas ficam 36 a 48 horas longe do jiu-jitsu e do vôlei.

**Progressão (dupla progressão)**
- Quando completar o topo da faixa de repetições em todas as séries, dentro do RIR do bloco, subir a carga no treino seguinte: +2 a 2,5 kg em membros superiores e +5 kg em inferiores (em halteres, o próximo par).
- Exercícios pesados (supino, remada, agachamento, stiff, hip thrust): parar com 1 a 3 repetições na reserva.
- Se o desempenho cair em 2 treinos seguidos ou a dor passar de 3 a 4 em 10: cortar 30 a 40% das séries na semana.
- **Novo:** o app sugere a próxima carga automaticamente (função pura, testada) e avisa quando um exercício estagna por 3 treinos.

**3ª aula de jiu-jitsu**
- Só depois da semana 5, quando: (1) 3 semanas seguidas com 2 aulas sem "destruído" (nota 5) no registro; (2) sono de 7 h ou mais (autodeclarado); (3) cargas do Upper A e do Lower estáveis ou subindo.
- **Novo:** o app mostra um indicador de elegibilidade com base nos registros.

**Dor e cuidados:** até 3 em 10 ajustar e seguir; acima de 4 em 10 trocar o exercício; mais de 24 h ou piora semana a semana reduzir volume; mais de 2 semanas ou com formigamento, perda de força ou travamento procurar fisioterapeuta esportivo ou ortopedista.

## 4. Regras da dieta

**Metas**
- Gasto estimado: 2.700 a 2.800 kcal por dia (Mifflin-St Jeor com fator de atividade de 1,55 a 1,6, para valores de exemplo configuráveis de peso, altura e idade). Média do plano: cerca de 2.450 kcal por dia.
- Proteína: cerca de 2,4 g/kg por dia (valor de exemplo: 185 g), em 5 refeições. Gordura: cerca de 55 g. Carboidrato: o restante.
- Água: 2,5 a 3 L por dia.
- Refeição livre: 1 por semana, até 1.000 kcal, sem compensar.

**Tipo de dia**

| Tipo | Quando | kcal | Carboidrato | Ajustes sobre o cardápio base |
| --- | --- | --- | --- | --- |
| Perna pesada | Treino cujo nome contém "Lower" ou "perna" | 2.600 | 340 g | +50 g de arroz no almoço, +1 banana no pré-treino |
| Academia (superior) | Outros treinos de academia | 2.450 | 305 g | Nenhum |
| Jiu-jitsu | Dia de aula | 2.500 | 315 g | Banana opcional antes da aula; sódio e água |
| Vôlei | Dia de vôlei | 2.500 | 315 g | Água de coco 300 ml; 1 banana antes |
| Descanso | Sem treino | 2.100 | 215 g | Pular o lanche da tarde |

O cardápio base (qualquer combinação de A, B e C) tem de 2.360 a 2.560 kcal e de 173 a 211 g de proteína.

**Tempo das refeições:** almoço completo 2 a 4 h antes do treino (1 a 2 g de carboidrato por kg); lanche de pré-treino 60 a 90 min antes (carboidrato fácil e proteína, pouca gordura e fibra); shake de pós-treino com cerca de 30 g de proteína e 40 a 60 g de carboidrato em até 1 a 2 h; jantar com 40 g ou mais de proteína.

**Jiu-jitsu às 6:30:** em jejum com água (café sem açúcar se quiser), shake logo após a aula, café da manhã reforçado cerca de 1 hora depois; mini pré opcional (1 banana ou 1 fatia de pão com mel, 20 a 30 minutos antes) se faltar fôlego; jantar da véspera com bom carboidrato.

**Hidratação:** 150 a 250 ml a cada 15 a 20 minutos durante o treino; água de coco ou pitada de sal em aula ou jogo de mais de 1 hora no calor; pesar antes e depois (1,2 a 1,5 L por kg perdido). Cafeína opcional: cerca de 3 mg/kg, 30 a 60 minutos antes, nunca depois das 16h.

**Suplementos:** whey 30 g por dia (conferir que dê cerca de 24 g de proteína); creatina monohidratada 5 g por dia, todos os dias.

**Revisão semanal (função pura, testada)**
- Entradas: média do peso da semana (3 pesagens em jejum), cintura (1 medida por semana), força (carga ou repetições nos exercícios principais).
- Regras:
  - Peso e cintura iguais por 2 semanas seguidas (variação de peso menor que 0,15 kg e cintura sem diminuir): sugerir **−130 kcal** (50 g de arroz no almoço e no jantar).
  - Perda maior que 0,7 kg por semana, ou força caindo em 2 treinos seguidos, ou fome e cansaço excessivos: sugerir **+130 a 170 kcal** (50 g de arroz no almoço e no jantar, ou 1 banana com 1 colher de doce de leite). Antes de cortar calorias, revisar o carboidrato do pré-treino.
  - Perda de 0,2 a 0,4 kg por semana com a cintura diminuindo: manter.
- Os ajustes são **sugestões**; o usuário confirma.

**Aviso fixo:** as calorias e proteínas são estimativas (tabelas TACO e USDA) e variam com marca, preparo e porção. O app não substitui nutricionista ou médico.

## 5. Modelo de dados (estado v2)

Um único documento JSON por usuário:

```json
{
  "v": 2,
  "ts": 1731360000000,
  "start": "2026-11-16",
  "plan": {
    "ex":   { "<id>": { "n": "Supino com halteres", "s": [4,5,5], "r": ["5–8","4–6","3–5"], "m": "kg", "t": "nota", "rest": 150 } },
    "sess": { "<id>": { "name": "Upper A", "sub": "Força: peito, costas e ombros", "min": "70 a 80 min", "ex": ["<id>"] } },
    "order": ["UA","UB","LW","LB"],
    "alt": "LB",
    "cond": ["Mobilidade ...", "..."]
  },
  "sched": [ {"k":"bjj","gi":true}, {"k":"gym","s":"LW"}, {"k":"gym","s":"UA"}, {"k":"bjj","gi":false}, {"k":"gym","s":"UB"}, {"k":"volei"}, {"k":"rest"} ],
  "log":   { "YYYY-MM-DD": { "<exId>": [ { "kg": "22", "reps": "8", "done": true } ] } },
  "done":  { "YYYY-MM-DD": true },
  "feel":  { "YYYY-MM-DD": 1 },
  "over":  { "YYYY-MM-DD": "<sessId>" },
  "cond":  { "YYYY-MM-DD": { "0": true } },
  "meas":  { "YYYY-MM-DD": { "p": "70,0", "c": "86", "b": "35", "t": "58" } },
  "notes": { "YYYY-MM-DD": { "_s": "nota do treino", "<exId>": "nota do exercício" } },
  "diet":  { "YYYY-MM-DD": { "pick": {"cafe":"A"}, "eaten": {"cafe":true}, "skip": {}, "water": 4, "crea": true } }
}
```

- `m` (tipo de registro): `kg`, `bw` (peso do corpo + carga extra), `rep`, `s` (tempo), `kgs` (carga e tempo).
- `ts` (milissegundos) decide qual versão vence na sincronização (a mais recente).
- Os valores de carga e repetições são texto digitado (aceita vírgula); converter com cuidado.
- `data/plan.json`, `data/diet.json` e `data/recipes.json` são as sementes (plano padrão, cardápio e receitas).
- **Sugestão de evolução:** separar o catálogo (plano, dieta, receitas) do histórico (log, medidas, notas) e adicionar `g` (grupo muscular) a cada exercício.

## 6. Requisitos não funcionais

- **Desempenho:** abrir em menos de 2 segundos em celular intermediário, interação sem atraso perceptível.
- **Offline:** abrir e registrar sem internet; sincronizar depois (se houver sincronização).
- **Tamanho:** o app inteiro (sem fotos) deve continuar leve.
- **Navegadores:** Safari iOS 16+, Chrome Android atual, desktop atual.
- **Teste:** funções de regra de negócio com cobertura alta; fluxos principais com teste de ponta a ponta; teste de migração com dados reais do protótipo.

## 7. Armazenamento e back-end

**Decisão: sem back-end e sem banco de dados externo.** O GitHub Pages só hospeda arquivos estáticos (HTML, CSS e JavaScript), e isso basta: toda a lógica roda no navegador e os dados ficam no próprio aparelho.

**Como guardar os dados**
- **IndexedDB** como armazenamento principal (mais espaço e mais confiável que `localStorage`), com migração automática das chaves do protótipo.
- Uma **interface única de armazenamento** (ler, salvar, exportar, importar), para que um adaptador remoto possa ser plugado no futuro sem reescrever o app.
- **Backup e restauração em JSON** sempre disponíveis, com validação do arquivo importado.

**Riscos e proteções (obrigatórios)**
- O navegador pode apagar dados do site: ao limpar os dados do navegador, ou, no iPhone, em sites que ficam muitos dias sem uso e não foram instalados na tela inicial. Proteções:
  1. Pedir **armazenamento persistente** (`navigator.storage.persist()`) e mostrar o resultado em Mais.
  2. Orientar a **instalar o app na tela inicial** (no iPhone isso reduz muito o risco de limpeza automática).
  3. **Lembrete semanal de backup** dentro do app (por exemplo, aviso na aba Mais e na tela Hoje quando passar de 7 dias sem backup) e indicação da data do último backup.
  4. Botão de backup fácil e que gere um arquivo para guardar no Drive, iCloud ou WhatsApp.
- Cada aparelho tem seus próprios dados. Para trocar de aparelho, exportar e importar o backup.

**Fora do escopo agora (possível no futuro):** sincronização entre aparelhos. Se um dia for necessária, o caminho é um serviço de back-end gratuito consumido direto pelo front-end (por exemplo Supabase ou Firebase), com login e regras de acesso por usuário, entrando como adaptador opcional. Isso não exige servidor próprio e funciona com o GitHub Pages, mas depende de um terceiro e do plano gratuito dele.

## 8. Melhorias já previstas

1. **Grupos musculares:** campo `g` em cada exercício (peito, costas, ombro lateral, ombro posterior, press, bíceps, tríceps, quadríceps, posterior e glúteos, panturrilha, core) e gráfico de séries semanais por grupo contra a tabela-alvo do plano (peito 9/12/10, costas 12/14/12, ombro lateral 6/8/6, ombro posterior 6/6/5, press 6/6/5, bíceps 5/7/5, tríceps 5/7/5, quadríceps 7/8/7, posterior e glúteos 8/10/8, panturrilha 3/4/3, core 9/10/9 por bloco).
2. Sugestão automática de carga e alerta de estagnação.
3. Revisão semanal da dieta com sugestões (seção 4).
4. Lista de compras da semana a partir das opções escolhidas.
5. Lembretes (treino, creatina, água): só se houver solução gratuita confiável.
6. Exportar CSV de cargas, medidas e dieta.
7. Fotos de progresso (frente, lado, costas) nas semanas 1, 4, 8 e 12, guardadas apenas no aparelho.
8. Modelos de treino e duplicar treino.

## 9. Fontes e cuidados científicos (a verificar)

Citadas de memória; o agente `conteudo-treino-nutricao` deve conferir antes de afirmar em tela:
- Frequência de 2 vezes por semana por grupo muscular e volume semanal: Schoenfeld, Ogborn e Krieger (2016 e 2017).
- Proximidade da falha: Refalo et al. (2023).
- Treino concorrente: Wilson et al. (2012).
- Nordic curl e lesão de posterior: Petersen et al. (2011).
- Distribuição de proteína por refeição: Schoenfeld e Aragon (2018).
- Carboidrato, hidratação e tempo das refeições: posicionamentos do ACSM e da ISSN.
- Creatina: posicionamento da ISSN (Kreider et al., 2017). Cafeína: posicionamento da ISSN.
