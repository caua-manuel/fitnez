# UX: primeira abertura (Fase 1, item 4)

Responsável: `ux-acessibilidade`. Data: 20/11/2026. Só revisão: nada em `src/` foi alterado.
Escopo: assistente de início (`src/features/assistente/Assistente.tsx`, textos de `src/domain/onboarding.ts` e `src/application/onboarding.ts`), Início vazio (`src/features/inicio/Inicio.tsx`), primeira execução (`src/features/treino/Executar.tsx`) e textos novos do ADR 011 (demo, backup, instalar, compartilhar plano).
Pessoa de referência: amigo do dono, nunca viu o app, abre no celular, uma mão, pouco tempo.
Nenhum número de treino ou dieta muda aqui. Todas as mudanças são de texto, ordem ou visibilidade.

Limitação: revisão feita lendo o código. Não rodei o app nem leitor de tela; os números de linha são do commit `0a55e13`.

## O que a pessoa vê hoje, em ordem

1. Assistente, boas-vindas: "Responda 7 perguntas rápidas", mas a barra mostra "Passo 1 de 9".
2. Se toca em "Decidir depois", cai no Início com o plano do dono (rotina com jiu-jitsu e vôlei, "Semana 01 de 12"), como se fosse dela. Não há nenhum caminho no Início para montar o plano. No Perfil, a opção se chama "Refazer meu plano", mas ela nunca fez um.
3. No Início: "Pare 3 repetições antes da falha" (aceitável) e, na semana leve, só "Semana leve", sem dizer o que muda. A carga grande (número herói) não tem rótulo visível.
4. "Semana do Natal." e "Semana do Réveillon." aparecem nas semanas 6 e 7 do plano de **qualquer pessoa**, seja qual for a data de início (`src/domain/calendar.ts:3`).
5. Na execução: coluna "Antes" sem explicação, números em cinza que viram registro ao tocar na caixa (ninguém avisa), "A" nas linhas de aquecimento, "Não contam no volume", e o motivo de "Concluir treino" estar desligado só existe para leitor de tela.
6. No fim: "Volume 3.240 kg" e recordes com "1RM estimado".

## Apontamentos priorizados

### Crítico

| # | Problema | Correção |
| --- | --- | --- |
| C1 | Boas-vindas diz 7 perguntas; o fluxo tem 9 passos (`Assistente.tsx:240` x `STEPS`, N = 9). Quebra a confiança logo na primeira tela. | Texto gerado a partir de `N` (tabela, linha A3). |
| C2 | Início vazio, depois de "Decidir depois", mostra o plano do dono como se fosse da pessoa, sem caminho para montar o próprio. O assistente só reaparece na próxima sessão. | Cartão "Monte seu plano" no topo do Início quando `!isStartConfirmed(settings) && !hasUserData(state)`, com "Montar meu plano" (abre `openAssistant('primeira')`) e "Ver com dados de exemplo" (ver seção Demo). Nesse estado, o botão do cartão de hoje vira secundário ("Treinar com o plano padrão"), para manter uma única ação principal. |
| C3 | "Semana do Natal." e "Semana do Réveillon." estão presas ao número da semana (`calendar.ts:3`), não à data. Para um amigo que começa em 24/11, a "Semana do Natal" cai em 29/12. | `backend-dados`: só mostrar as notas 5 e 6 quando a semana do plano contém 25/12 ou 31/12 (por data), ou retirá-las. A nota da semana 12 ("testes de carga, medidas e fotos") é genérica e fica. |
| C4 | "Plano de exemplo" (usar o plano do dono de verdade) e "dados de exemplo" (passeio temporário da demo) ficam lado a lado na mesma tela. A pessoa não vai saber qual dos dois apaga ou guarda alguma coisa. | Renomear o primeiro para **"plano padrão"** em todo o assistente (A4 a A9). "Ver com dados de exemplo" fica como está no ADR. A meta de dieta "de exemplo" não muda (é outro contexto). |
| C5 | Primeira execução: o campo vazio grava a sugestão em cinza ao tocar na caixa da série, e nada explica isso. Sem histórico, a pessoa também não sabe que carga escolher. | Duas linhas novas na execução (E1 e E2), mostradas só enquanto fizer sentido (condições na tabela). |

### Importante

| # | Problema | Correção |
| --- | --- | --- |
| I1 | RIR aparece por extenso só no Início, e na sigla em Detalhe ("Repetições em reserva (RIR)") sem explicação. Na execução, onde a pessoa precisa dessa informação, não aparece. | Uma linha padrão em todos os lugares: "Pare com N repetições ainda sobrando" (I3, E3, D1). No assistente, uma linha sem número (A12). Singular: com "1", usar "1 repetição". |
| I2 | A semana leve não diz o que muda. O assistente usa "deload". | Início: "Semana leve: menos séries, sem subir carga". Assistente: frase sem "deload" (A11). |
| I3 | O aviso fixo (`AVISO_FIXO`) aparece no rodapé de todos os 9 passos. Repetir tanto faz a pessoa parar de ler. | Mostrar só nas boas-vindas e no resumo (`Assistente.tsx:319`). |
| I4 | O número herói do Início (carga) só tem rótulo para leitor de tela. "3 × 8–12" é lido como "3 multiplicado por 8 menos 12". | Rótulo visível "Carga sugerida" (I1) e `aria-label` na prescrição (I2). |
| I5 | "Concluir treino" desligado: o motivo é `visually-hidden` (`Executar.tsx:465`). DESIGN.md (seção 7) pede o motivo por escrito. | Mostrar a dica visível, pequena, acima do botão, enquanto `doneSets === 0`. |
| I6 | Quem nunca treinou e escolhe 5 dias recebe 3 (teto por experiência), e o resumo não explica por quê. | Linha no resumo quando `s.gymDays < answers.daysPerWeek` (A14). A regra não muda, só o texto. |
| I7 | Jargão nos subtítulos dos treinos: "core" (`onboarding.ts:140-145, 150`). "Recomposição" no objetivo. | "abdômen" e "Perder gordura e ganhar massa" (O1, A2). |
| I8 | Concluído: "Volume" e "1RM estimado" sem explicação. | "Total levantado" e "carga máxima estimada" (K1 a K3). |
| I9 | Início: atalho fixo "Instalar na tela inicial" no rodapé, além do cartão do ADR 1.4. Pelo ADR, depois do cartão a instalação fica só no Perfil. | Retirar `<InstalarApp compact />` do Início quando o cartão de instalar existir (`Inicio.tsx:363`). |
| I10 | A linha da dieta no Início mostra "2.300 kcal restantes" de uma meta de exemplo, como se fosse a da pessoa. | Com `isExampleTarget(settings)`, acrescentar " · meta de exemplo" (DR1). |
| I11 | Perfil: "Refazer meu plano" para quem nunca montou um plano. | "Montar meu plano" quando `settings.onboarding` não existe (P1). |

### Desejável

| # | Problema | Correção |
| --- | --- | --- |
| W1 | Dias já ocupados por outra atividade ficam desligados sem explicação (`Assistente.tsx:212`). | `aria-describedby` com "Já ocupado por {atividade}" e o mesmo texto em `title`, ou uma linha muted abaixo dos dias: "Dias já usados por outra atividade ficam desligados." |
| W2 | Texto de dor longo (`Assistente.tsx:30`). | Versão mais curta (A16). |
| W3 | Estilo inline na sugestão (`Executar.tsx:419`, `style={{ fontWeight: 400 }}`). | Classe CSS. |
| W4 | Repetições com `inputMode="decimal"` (`Executar.tsx:436`). | `numeric` (já previsto no ADR 011, 2.2). |
| W5 | Nomes de exercício em inglês no catálogo (Pallof, Face pull, Hip thrust, Stiff). | Fora deste escopo: revisar com o `conteudo-treino-nutricao`, mantendo o nome conhecido na academia entre parênteses. |

## Tabela para o frontend aplicar

Donos: `src/features/*` e `src/ui/*` = `frontend`; `src/domain/*` e `src/application/*` = `backend-dados`.

### Assistente

| arquivo:linha | texto atual | texto novo | motivo |
| --- | --- | --- | --- |
| A1 `src/features/assistente/Assistente.tsx:44` | Marque todas as que valerem. Essa resposta fica só neste aparelho. | Marque todas as que valerem. Essa resposta só ajusta o plano e não é guardada. | É o que o código faz (passo 0 nunca é gravado). "Fica no aparelho" sugere que é guardada. |
| A2 `Assistente.tsx:32` | As duas coisas (recomposição) | Perder gordura e ganhar massa | Tira o jargão. |
| A2b `Assistente.tsx:46` | Quanto você já treinou musculação? | Há quanto tempo você treina musculação? | Combina com as respostas ("Nunca treinei", "menos de 1 ano"). |
| A3 `Assistente.tsx:240` | Responda 7 perguntas rápidas e o app monta seus treinos e suas metas de dieta. Você pode mudar tudo depois. | `` `Responda ${N} perguntas rápidas e o app monta seus treinos e suas metas de dieta. Dá para mudar tudo depois.` `` | C1: número errado. Gerar a partir de `N`. |
| A4 `Assistente.tsx:241` | O plano de exemplo é de uma pessoa com experiência, que treina musculação, jiu-jitsu e vôlei. | O plano padrão é de quem já treina e faz musculação, jiu-jitsu e vôlei. | C4. |
| A5 `Assistente.tsx:245` | Usar o plano de exemplo | Usar o plano padrão | C4. |
| A6 `Assistente.tsx:251` | Quando o plano de exemplo começa? | Quando o plano padrão começa? | C4. |
| A7 `Assistente.tsx:252` | Plano de exemplo: {n} treinos, 12 semanas. Dá para trocar a data e refazer o plano em Perfil. | Plano padrão: {n} treinos, 12 semanas. Dá para trocar a data ou montar seu plano depois, em Perfil. | C4; "refazer" não faz sentido para quem não fez. |
| A8 `Assistente.tsx:257` e `:290` | Usar o plano de exemplo | Usar o plano padrão | C4. |
| A9 `Assistente.tsx:173` | Plano de exemplo: começa em {dd/mm} | Plano padrão: começa em {dd/mm} | C4. |
| A10 `Assistente.tsx:51` | Para calcular suas metas de dieta, informe os dados abaixo. Sem eles, o app usa metas de exemplo. | Servem só para calcular calorias e proteína. Sem eles, o app usa metas de exemplo. | Mais curto; diz para que serve. |
| A10b `Assistente.tsx:226` | Sexo (usado só na fórmula) | Sexo (só para a conta das calorias; não é guardado) | "Fórmula" é vago; o sexo de fato não é gravado. |
| A11 `Assistente.tsx:266` | {12} semanas · começa na segunda, {dd/mm}, com uma semana leve (deload) a cada 4. | {12} semanas · começa na segunda, {dd/mm}. A cada 4 semanas, uma semana leve, com menos séries, para o corpo recuperar. | I2: sem "deload", explicado em uma linha. |
| A12 `Assistente.tsx:269` (nova linha logo abaixo, `p.muted`) | (não existe) | Em cada série, pare antes de não aguentar mais: o app mostra quantas repetições deixar sobrando. | I1: apresenta a ideia do RIR sem sigla e sem número. |
| A13 `Assistente.tsx:279` | Meta de calorias: de {a} a {b} kcal por dia, conforme o tipo de dia. Proteína: {p} g. | Calorias: de {a} a {b} kcal por dia (mais nos dias de treino). Proteína: {p} g por dia. | Diz o que muda entre os dias; "por dia" na proteína. Os números não mudam. |
| A13b `Assistente.tsx:279` (caso único) | Meta de calorias: {a} kcal por dia. | Calorias: {a} kcal por dia. | Coerência com A13. |
| A14 `Assistente.tsx:269` (nova linha, só se `s.gymDays < preview.answers.daysPerWeek` e sem `semana-cheia`) | (não existe) | Para começar com segurança, o app montou {gymDays} dias. Dá para aumentar depois, em Perfil. | I6: explica o teto sem mudar a regra. Texto a confirmar com o `conteudo-treino-nutricao`. |
| A15 `Assistente.tsx:319` | `<p className="as-note">{AVISO_FIXO}</p>` em toda tela | Mostrar só quando `screen === 'boas-vindas' \|\| screen === 'resumo'` | I3. |
| A16 `Assistente.tsx:30` | Sentiu dor que passa de 4 em 10, dura mais de 2 semanas, ou vem com formigamento ou perda de força? Pare o exercício e procure um fisioterapeuta ou médico. | Dor acima de 4 em 10, que dura mais de 2 semanas ou vem com formigamento ou perda de força: pare o exercício e procure um fisioterapeuta ou médico. | W2. Mesmos limites, frase mais direta. |
| A17 `src/application/onboarding.ts:111` e `:119` | Os dados mudaram em outra aba. Recarregue antes de tentar novamente. | Seus dados mudaram em outra aba. Recarregue a página e tente de novo. | Mais natural; diz o que recarregar. |
| O1 `src/domain/onboarding.ts:140, 141, 144, 145, 150` | "… e core" | "… e abdômen" (ex.: "Pernas, peito, costas e abdômen"; "Pernas, glúteos e abdômen") | I7. Só o subtítulo; ids e exercícios não mudam. |
| P1 `src/features/perfil/Perfil.tsx:282` | Refazer meu plano / Responda as perguntas de novo; seus registros continuam salvos | Sem `settings.onboarding`: **Montar meu plano** / Responda algumas perguntas; seus registros continuam salvos. Com `settings.onboarding`: manter o texto atual. | I11. |

### Início

| arquivo:linha | texto atual | texto novo | motivo |
| --- | --- | --- | --- |
| I1 `src/features/inicio/Inicio.tsx:93-94` | (rótulo só para leitor de tela) "Carga sugerida…" | Rótulo visível pequeno acima do número: **Carga sugerida** (mantém o `visually-hidden` do "acima da última vez") | I4: número sem rótulo não se entende. |
| I2 `Inicio.tsx:91` | `3 × 8–12` (sem rótulo) | Manter o visual; `aria-label="3 séries de 8 a 12 repetições"` (singular com 1 série) | I4: leitor de tela. |
| I2b `Inicio.tsx:95` | Escolha a carga na 1ª série | Primeira vez: você escolhe a carga na 1ª série | Deixa claro que é esperado, não um erro. |
| I3 `Inicio.tsx:301` | {Semana leve · }Pare {rir} repetições antes da falha | Semana normal: **Pare com {rir} repetições ainda sobrando**. Semana leve: **Semana leve: menos séries, sem subir carga · Pare com {rir} repetições ainda sobrando** | I1 e I2: RIR e semana leve explicados em uma linha cada. Com `rir === '1'`: "1 repetição". |
| I4 `Inicio.tsx:220` | Treinar sem mudar a data | Treinar hoje sem começar o plano | Diz o que acontece. |
| I5 `Inicio.tsx` (novo cartão antes da linha 308) | (não existe) | Ver "Cartão do Início vazio" abaixo. | C2. |
| I6 `Inicio.tsx:363` | `<InstalarApp compact />` | Retirar quando o cartão de instalar do Concluído existir. | I9. |
| DR1 `src/features/inicio/DietaResumo.tsx:16` | {n} kcal restantes | {n} kcal restantes · meta de exemplo (só com `isExampleTarget(settings)`) | I10. |
| CAL `src/domain/calendar.ts:3` | `5: 'Semana do Natal.', 6: 'Semana do Réveillon.'` presos ao número da semana | Por data (semana que contém 25/12 ou 31/12) ou retirar | C3 (`backend-dados`). |

### Execução (primeiro treino)

| arquivo:linha | texto atual | texto novo | motivo |
| --- | --- | --- | --- |
| E1 `src/features/treino/Executar.tsx:416-419` (nova linha, só quando nenhuma série foi concluída em todo o histórico: `Object.keys(state.history.days).length === 0` e nenhuma série `done` hoje) | (não existe) | Os números em cinza são a sugestão. Toque na caixa da série para registrar assim, ou digite o que fez. | C5. Some sozinha depois da primeira série. |
| E2 `Executar.tsx:416-419` (nova linha, só com `ctx.previous.length === 0` e exercício com carga) | (não existe) | Primeira vez neste exercício: escolha uma carga que dê para fazer {reps} repetições com boa técnica, parando com {rir} ainda sobrando. | C5 + I1. {reps} = `plannedNow.reps`; {rir} = `rirSequence(plan)[week]`. Com E2 na tela, não mostrar E3. |
| E3 `Executar.tsx:416` (nova linha `muted` logo abaixo de `ex-plan`, quando não houver E2) | (não existe) | Pare com {rir} repetições ainda sobrando | I1: a informação aparece onde é usada. |
| E4 `Executar.tsx:423` | Antes | Anterior | "Antes" parece "antes desta série". |
| E5 `Executar.tsx:435` (`aria-label`) | Antes: … / Antes: sem registro | Última vez: … / Última vez: sem registro | Coerência com E4; mais claro para leitor de tela. |
| E6 `src/domain/warmup.ts:7` (`WARMUP_TEXT`) | Aquecimento sugerido: séries leves para preparar o movimento. Não contam no volume. | Linhas "A" são aquecimento: séries leves para preparar o movimento. Não contam como séries do treino. | Explica o "A" e tira "volume". |
| E7 `Executar.tsx:457` | Descanso (s) / Este exercício não tem tempo definido. | Descanso (segundos) / Este exercício não tem tempo de descanso definido. | Sem abreviação no rótulo. |
| E8 `Executar.tsx:465` | (dica só para leitor de tela) Conclua ao menos uma série para concluir o treino. | Mesma frase, **visível** (`p.muted` pequeno acima do botão), enquanto `doneSets === 0`. | I5. |
| E9 `Executar.tsx:419` | (só uma sugestão; você define a carga) | (sugestão; você decide a carga) | Mais curto, mesmo sentido. Trocar o `style` inline por classe (W3). |

### Concluído

| arquivo:linha | texto atual | texto novo | motivo |
| --- | --- | --- | --- |
| K1 `src/features/treino/Concluido.tsx:53` | Volume | Total levantado | I8. Opcional: `title`/linha de ajuda "Soma de carga × repetições". |
| K2 `src/features/treino/recordText.ts:8` | Recorde: 1RM estimado {x} kg | Recorde: carga máxima estimada {x} kg | I8. |
| K3 `recordText.ts:14` | {nome} 1RM est. {x} kg | {nome} máx. estimado {x} kg | I8. |
| K4 `Concluido.tsx` (depois de `ok-actions`, linha 58) | (não existe) | Ver "Cartão de instalar" abaixo. | ADR 011, 1.4. |

### Detalhe do treino

| arquivo:linha | texto atual | texto novo | motivo |
| --- | --- | --- | --- |
| D1 `src/features/treino/Detalhe.tsx:148` | Repetições em reserva (RIR) / {rir} | Esforço (RIR) / {rir} · pare com {rir} repetições ainda sobrando | I1: a sigla aparece com a explicação ao lado. |

## Textos novos

### Demonstração (ADR 011, 1.1)

**Onde fica o botão**
- Assistente, boas-vindas: no **conteúdo** (não no rodapé), logo abaixo dos dois parágrafos de apresentação, separado por uma linha fina. O rodapé continua com três itens ("Montar meu plano", "Usar o plano padrão", "Decidir depois"), para não disputar com a ação principal. Botão em estilo `as-link`, alvo de 48 px ou mais, ícone `play` à esquerda.
- Início vazio: dentro do cartão "Monte seu plano" (abaixo), como segunda ação.
- As duas só aparecem com `hasUserData` falso e modo real.

**Texto exato**
- Pergunta curta acima do botão (só no assistente, em negrito): **Só quer conhecer o app?**
- Botão: **Ver com dados de exemplo**
- Linha de apoio (`muted`): **Mostra o app depois de 4 semanas de uso, com dados inventados. Seus dados não mudam.**
- Carregando (no lugar do botão, `role="status"`): **Preparando os dados de exemplo…**
- Erro (`role="alert"`): **Não foi possível abrir a demonstração. Seus dados não mudaram. Tente de novo.**

**Faixa fixa no topo (todas as telas da demo)**
- Texto: **Dados de exemplo**
- Botão: **Sair da demonstração**
- Contêiner `role="region"` com `aria-label="Modo demonstração"` (não `alert`). Fundo `secondary`, texto `foreground`, ícone `info` junto do texto (não depender da cor). Botão com 44 px ou mais. A faixa fica fora da ordem do "Pular para o conteúdo" e não pode cobrir o foco (somar sua altura ao `scroll-padding-top`). Em 360 px, o texto quebra para duas linhas se precisar; o botão nunca encolhe.
- Confirmação ao sair (folha): título **Sair da demonstração?**; texto **Os dados de exemplo somem. Seus dados reais continuam como estavam.**; botões **Sair** (principal) e **Continuar vendo** (secundário). Sem "Desfazer": a saída recarrega e a demo pode ser aberta de novo; a confirmação compensa isso.
- Perfil, linha na demo: **Sair da demonstração** / **Volta ao app com seus dados; os de exemplo somem.**
- Recursos desligados na demo (backup, importar, compartilhar plano, apagar tudo, notificações, instalar), no lugar da ação: **Indisponível na demonstração. Saia para usar com seus dados.**

### Cartão do Início vazio (C2)

Condição: `!isStartConfirmed(state.settings) && !hasUserData(state)`, modo real. Fica no topo, logo após o cabeçalho da faixa de 12 semanas.
- Rótulo pequeno: **Primeiro passo**
- Título (h2): **Monte seu plano**
- Texto: `` `${N} perguntas rápidas e o app monta treinos e metas de dieta para você.` ``
- Principal: **Montar meu plano**
- Secundário: **Ver com dados de exemplo** + a linha de apoio da demo.
- Linha final (`muted`): **Abaixo está o plano padrão, se quiser treinar já.**
- Nesse estado, o botão do cartão de hoje passa a secundário: **Treinar com o plano padrão**.

### Lembrete de backup (ADR 011, 1.2; substitui `src/ui/components.tsx:9`)

- Título: **Guarde uma cópia dos seus dados**
- Texto: **Seus registros ficam só neste aparelho. Com uma cópia em arquivo, você não perde nada se o navegador limpar os dados.**
- Principal: **Fazer backup agora**
- Secundário: **Agora não**
- Depois de "Agora não", toast: **Lembramos de novo amanhã.**
- Gerando: **Preparando o arquivo…**
- Depois de gerar, pergunta (no mesmo cartão, foco no título): título **Guardou o arquivo?**; texto **Envie para seu e-mail, Drive ou WhatsApp. Confirme só depois de guardar fora deste aparelho.**; botões **Sim, guardei** (principal) e **Ainda não** (secundário).
- "Sim, guardei", toast: **Backup confirmado.**
- "Ainda não": o cartão volta ao estado inicial, sem adiar o lembrete.
- Erro: **Não foi possível gerar o arquivo. Tente de novo ou use Perfil > Backup.**
- Acessibilidade: `aside` com `aria-labelledby` no título; nada de `role="alert"` (é rotina). A troca para "Guardou o arquivo?" é anunciada com `role="status"`.

### Cartão de instalar no fim do primeiro treino (ADR 011, 1.4)

Em `Concluido.tsx`, depois de `ok-actions`, para não disputar com "Voltar ao início".
- Título (h3): **Deixe o Fitnez na tela inicial**
- Texto: **Abre mais rápido e funciona sem internet, como um app.**
- Principal do cartão (estilo secundário, já que a tela tem "Voltar ao início"): **Instalar**
- Link: **Agora não**
- Depois de "Agora não", toast: **Você pode instalar depois, em Perfil.**
- O pedido de armazenamento persistente acontece no mesmo momento, sem cartão nem texto extra. Se o navegador mostrar a própria janela, não somar mensagem do app.

### Compartilhar e importar plano (ADR 011, 1.3)

**Entrada no Perfil**
- Linha: **Compartilhar plano** / **Envie seu plano a um amigo ou use o de outra pessoa**

**Tela** (h1 **Compartilhar plano**), duas seções:

*Enviar meu plano* (h2)
- Campo: **Nome do plano**, ajuda **Quem receber vê este nome. Até 60 caracteres.**; valor inicial, o nome da pessoa no perfil + " " ou vazio. Erro: **Dê um nome ao plano.**
- Caixa: **Incluir observações dos exercícios** (marcada), ajuda **Dicas de execução que estão no plano.**
- Linha "o que vai": **Vai: treinos, exercícios, séries, repetições, descansos e sua semana de treino.**
- Linha "o que não vai": **Não vai: histórico, medidas, dieta, perfil e suas anotações pessoais.**
- Botão com Web Share: **Enviar plano**. Sem Web Share: **Baixar arquivo**.
- Sucesso (download): **Arquivo salvo: fitnez-plano-{nome}.json**
- Erro: **Não foi possível criar o arquivo. Tente de novo.**

*Usar o plano de um amigo* (h2)
- Botão: **Escolher arquivo**, ajuda **O arquivo .json que seu amigo mandou (começa com fitnez-plano).**
- Lendo: **Lendo o arquivo…**
- Erros (`role="alert"`, sempre com a ação):
  - não é plano / JSON inválido: **Este arquivo não é um plano do Fitnez. Confira se escolheu o arquivo certo.**
  - acima de 200 KB: **Arquivo grande demais para ser um plano (máximo 200 KB).**
  - `v > 1`: **Este plano veio de uma versão mais nova do Fitnez. Atualize o app e tente de novo.**
  - chave desconhecida ou limite: **O arquivo tem informações que o Fitnez não reconhece. Por segurança, ele não foi usado.**
  - rotina aponta para treino inexistente: **O plano está incompleto: a semana cita um treino que não existe.**

**Revisão** (tela própria, foco no h1)
- h1: **Revisar “{nome}”**
- Resumo comum ao assistente (treinos, semana tipo).
- Diferenças: **{n} treinos, {m} exercícios.** e, quando houver, **{k} exercícios você já tem: o histórico deles continua.** e **{j} exercícios entram como novos, para não misturar com o seu histórico.**
- Caixa (desmarcada por padrão, só se o arquivo trouxer a semana): **Usar também a semana do amigo**, ajuda **Desmarcado, seus dias de treino continuam como estão.**
- Data de início: o mesmo bloco "Começar quando?" do assistente.
- Linha fixa: **Seus registros, medidas, dieta e perfil não mudam.**
- Principal: **Usar este plano**. Secundário: **Cancelar**.
- Erro ao gravar: **Não foi possível aplicar o plano. Nada mudou. Tente de novo.**; conflito: **Seus dados mudaram em outra aba. Recarregue a página e tente de novo.**

**Depois de aplicar**
- Toast (8 s, com **Desfazer**): **Plano “{nome}” aplicado.**
- Desfazer, toast: **Plano anterior restaurado.**
- Perfil, linha existente (`Perfil.tsx:287`): título **Voltar ao plano anterior**, subtítulo novo **Desfaz o último plano aplicado (seu ou de um amigo)**.
- Folha de confirmação: título **Voltar ao plano anterior?**; texto **O plano atual sai e o anterior volta. Seus registros continuam.**; botões **Voltar** e **Cancelar**.

## Verificação sugerida ao `qa-testes`

- 360 × 740: boas-vindas sem rolagem até "Decidir depois" com o bloco da demo; faixa da demo com o botão de 44 px; cartão do Início vazio com uma só ação principal.
- Leitor de tela: prescrição "3 séries de 8 a 12 repetições"; faixa anunciada como região; troca para "Guardou o arquivo?" anunciada.
- Um plano começado em 24/11 não mostra "Semana do Natal" em 29/12 (C3).
- Primeira execução sem histórico: E1 e E2 aparecem; depois da primeira série, E1 some.
