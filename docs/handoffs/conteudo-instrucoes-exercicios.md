# Conteúdo: instruções curtas dos exercícios salvos

Data: 19/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: PROPOSTA. ADR: [009](../decisoes/009-registro-de-treino-inspirado-no-hevy.md).

Formato para converter em JSON: cada linha `id: execução | Erro comum: texto`. A parte antes de `|` vira `passos` (2 a 3 frases; o app pode quebrar por ponto). A parte depois vira `erro`. Os textos descrevem a execução; não prometem resultado. Valem para todos os exercícios as duas frases fixas abaixo, mostradas no rodapé da biblioteca (não repetir em cada exercício):

- `Comece com uma carga que você controla em todas as repetições. Técnica vem antes da carga.`
- `Dor forte, pontada ou formigamento: pare o exercício. Se a dor durar mais de 2 semanas, procure um fisioterapeuta ou médico.`

Sugestão de chave no JSON: `data/exercise-guide.json` com `{ "versao": 1, "itens": { "<id>": { "passos": "...", "erro": "..." } } }`. Uma ID sem texto não mostra a seção (sem erro).

## Plano de exemplo

```
supino: Deitado no banco, pés firmes no chão e escápulas encaixadas para trás. Desça os halteres até a linha do peito com os cotovelos a cerca de 45° do corpo e suba sem bater um no outro. | Erro comum: abrir os cotovelos a 90° e perder o encaixe dos ombros.
remada_a: Tronco inclinado à frente com a coluna neutra, ou peito apoiado no banco inclinado. Puxe a carga em direção ao umbigo levando os cotovelos para trás e desça com controle. | Erro comum: arredondar a lombar ou dar impulso com o tronco.
press_a: Sentado ou ajoelhado, abdômen firme e costas sem arquear. Empurre a carga para cima e à frente até quase estender o cotovelo e volte devagar até a altura do ombro. | Erro comum: arquear a lombar para ajudar a subir.
barra: Mãos na pegada neutra, corpo sem balançar. Puxe até o queixo passar a barra levando os cotovelos em direção às costelas e desça até quase estender os braços. | Erro comum: usar balanço das pernas para subir.
lat_a: Em pé, halteres ao lado do corpo e cotovelos levemente dobrados. Eleve os braços pela lateral até a altura dos ombros e desça em 2 a 3 segundos. | Erro comum: subir com impulso do tronco ou passar muito da altura do ombro.
face: Polia na altura do rosto, corda nas mãos. Puxe em direção à testa abrindo os cotovelos, altos, e gire as mãos para trás no final. | Erro comum: puxar para o peito com os cotovelos baixos.
rosca_a: Em pé, cotovelos parados ao lado do corpo. Dobre o cotovelo subindo o halter e desça até estender quase todo o braço. | Erro comum: balançar o tronco e levar o cotovelo à frente.
tri_a: De frente para a polia, cotovelos colados ao corpo. Estenda os cotovelos até o fim e volte até cerca de 90° sem mexer os ombros. | Erro comum: deixar os cotovelos abrirem ou subirem.
pallof: De lado para a polia ou o elástico, segure junto ao peito. Empurre os braços à frente e segure 2 segundos sem deixar o tronco girar; volte devagar. | Erro comum: girar o quadril ou prender a respiração.
farmer: Pegue um halter pesado em cada mão, ombros para trás e abdômen firme. Caminhe com passos curtos pelo tempo marcado, sem inclinar para os lados. | Erro comum: deixar os ombros caírem para a frente e arredondar as costas.
puxada: Sentado, coxas presas no apoio, pegada um pouco mais aberta que os ombros. Puxe a barra até o alto do peito levando os cotovelos para baixo e volte até esticar os braços. | Erro comum: jogar o tronco para trás ou puxar a barra atrás da nuca.
inclinado: Banco a cerca de 30°, escápulas encaixadas. Desça os halteres até a linha do alto do peito e suba com controle. | Erro comum: banco inclinado demais, o que tira o trabalho do peito.
press_b: Sentado com as costas apoiadas, halteres na altura das orelhas. Empurre para cima sem travar os cotovelos e desça até a altura do queixo. | Erro comum: tirar as costas do encosto e arquear a lombar.
remada_b: Na remada unilateral, apoie a mão e o joelho no banco; na baixa, sente com o peito alto. Puxe em direção ao quadril e estique o braço com controle na volta. | Erro comum: girar o tronco para puxar mais carga.
cruc: Cotovelos levemente dobrados e fixos durante todo o movimento. Abra os braços até sentir alongar o peito e feche à frente do corpo. | Erro comum: dobrar e esticar o cotovelo, virando um supino.
lat_b: De lado para a polia baixa, cabo passando à frente do corpo. Eleve o braço pela lateral até a altura do ombro e desça devagar. | Erro comum: inclinar o tronco para longe da polia para ajudar.
inverso: Tronco inclinado à frente ou peito apoiado no banco, cotovelos levemente dobrados. Abra os braços para os lados até a linha do corpo, apertando a parte de trás dos ombros. | Erro comum: juntar as escápulas com força e usar carga demais.
rosca_b: Cotovelos parados ao lado do corpo. Na alternada, suba um braço de cada vez; com barra W, suba os dois juntos e desça até quase esticar. | Erro comum: soltar a descida rápido demais.
tri_b: No francês, halter atrás da cabeça com os cotovelos apontando para cima; na corda, cotovelos junto ao corpo. Estenda os cotovelos até o fim e volte devagar. | Erro comum: abrir os cotovelos para os lados.
joelhos: Pendurado na barra, ombros ativos, sem balançar. Suba os joelhos (ou as pernas) enrolando o quadril para a frente e desça devagar. | Erro comum: só balançar as pernas sem enrolar o quadril.
pescoco: Sentado ou em pé, mão contra a cabeça. Faça força com o pescoço contra a mão, sem mexer a cabeça, em cada direção pelo tempo marcado, com força leve a moderada. | Erro comum: fazer força máxima de repente. Com dor no pescoço, não faça e procure um profissional.
salto_l: Pés na largura do quadril, desça um pouco e salte o mais alto possível. Aterrisse macio, com os joelhos dobrados e alinhados com os pés, e descanse entre os saltos. | Erro comum: aterrissar com os joelhos para dentro ou de perna esticada.
agach: Barra apoiada no alto das costas, pés na largura dos ombros, abdômen firme. Desça levando o quadril para trás e para baixo até onde mantiver a coluna neutra e suba empurrando o chão. | Erro comum: joelhos caindo para dentro ou lombar arredondando no fundo.
stiff: Joelhos levemente dobrados e fixos, carga perto das pernas. Leve o quadril para trás descendo até sentir alongar a parte de trás da coxa, com a coluna neutra, e volte apertando o glúteo. | Erro comum: arredondar as costas para descer mais.
bulg: Pé de trás apoiado no banco, pé da frente longe o bastante para o joelho ficar sobre o pé. Desça reto até o joelho de trás quase tocar o chão e suba pela perna da frente. | Erro comum: pé da frente muito perto do banco, o que joga o peso no joelho.
nordic: Joelhos sobre um apoio macio e calcanhares presos. Desça o tronco à frente o mais devagar possível, quadril estendido, e use as mãos para amortecer e voltar. | Erro comum: dobrar o quadril para facilitar. Comece pela mesa flexora se for a primeira vez.
hip_l: Costas apoiadas no banco na altura das escápulas, barra com proteção sobre o quadril. Suba o quadril até alinhar com o tronco, aperte o glúteo 1 segundo e desça. | Erro comum: arquear a lombar no alto em vez de estender o quadril.
pant_pe: Ponta dos pés no degrau ou na plataforma, joelhos quase esticados. Desça o calcanhar até alongar e suba o máximo possível, com pausa no alto. | Erro comum: repetições curtas e rápidas, quicando no fundo.
roll: De joelhos, mãos na roda, abdômen firme e quadril encaixado. Role à frente só até onde a lombar não afundar e volte puxando com o abdômen. | Erro comum: deixar a lombar afundar no fim do movimento.
copen_l: De lado, apoiado no antebraço, perna de cima sobre um banco. Eleve o quadril até alinhar o corpo e segure pelo tempo marcado; comece com o joelho apoiado no banco. | Erro comum: deixar o quadril cair ou girar o tronco.
salto_b: Mesmo cuidado do salto vertical: desça um pouco e salte. Aterrisse macio, joelhos alinhados, e desça da caixa andando, sem pular para trás. | Erro comum: caixa alta demais para o seu nível.
hip_b: Costas apoiadas no banco na altura das escápulas, barra com proteção sobre o quadril. Suba o quadril até alinhar com o tronco, aperte o glúteo 1 segundo e desça. | Erro comum: arquear a lombar no alto em vez de estender o quadril.
leg: Costas e quadril apoiados no encosto, pés na altura média da plataforma. Desça até onde o quadril não sair do encosto e empurre sem travar os joelhos. | Erro comum: descer demais e tirar o quadril do encosto, arredondando a lombar.
afundo: Dê um passo à frente (ou suba no degrau) com o tronco alto. Desça até os dois joelhos ficarem perto de 90° e volte empurrando com a perna da frente. | Erro comum: joelho da frente caindo para dentro.
mesa: Deitado de bruços, joelho alinhado com o eixo do aparelho e apoio acima do calcanhar. Dobre os joelhos trazendo o apoio em direção ao glúteo e volte devagar. | Erro comum: tirar o quadril do banco para ajudar a subir.
pant_sent: Sentado, apoio sobre as coxas perto dos joelhos e ponta dos pés na plataforma. Desça o calcanhar até alongar e suba o máximo possível, com pausa no alto. | Erro comum: amplitude curta e ritmo rápido.
med: De lado para uma parede forte, bola na altura do quadril. Gire o quadril e o tronco juntos e arremesse a bola contra a parede; pegue e repita, com espaço livre ao redor. | Erro comum: girar só com os braços, sem usar o quadril.
copen_b: De lado, apoiado no antebraço, perna de cima sobre um banco. Eleve o quadril até alinhar o corpo e segure pelo tempo marcado; comece com o joelho apoiado no banco. | Erro comum: deixar o quadril cair ou girar o tronco.
```

## Exercícios para casa (assistente de início)

```
goblet: Segure o halter em pé junto ao peito, cotovelos para baixo. Desça entre as pernas até onde mantiver a coluna neutra e suba empurrando o chão. | Erro comum: deixar o halter afastar do peito e o tronco cair à frente.
agach_livre: Pés na largura dos ombros, braços à frente para equilibrar. Desça como se fosse sentar numa cadeira e suba empurrando o chão. | Erro comum: tirar os calcanhares do chão.
ponte_h: Deitado de costas, joelhos dobrados e halter sobre o quadril. Suba o quadril até alinhar joelhos, quadril e ombros, aperte o glúteo e desça. | Erro comum: subir arqueando a lombar.
ponte_uni: Deitado de costas, uma perna dobrada com o pé no chão e a outra no ar. Suba o quadril sem deixar um lado cair e desça devagar; faça os dois lados. | Erro comum: quadril torto, caindo para o lado da perna no ar.
afundo_livre: Dê um passo à frente com o tronco alto. Desça até o joelho de trás quase tocar o chão e volte; apoie a mão na parede se precisar. | Erro comum: passo curto demais, com o joelho da frente indo muito à frente do pé.
stiff_uni: Em pé numa perna, joelho levemente dobrado. Leve o quadril para trás e incline o tronco, com a perna de trás subindo alinhada, e volte; segure numa parede se precisar. | Erro comum: arredondar as costas ou girar o quadril para fora.
supino_chao: Deitado no chão, joelhos dobrados e halteres sobre o peito. Desça até o cotovelo tocar o chão de leve e suba sem bater os halteres. | Erro comum: deixar o cotovelo cair com força no chão.
flexao: Mãos um pouco mais abertas que os ombros, corpo reto da cabeça aos pés. Desça o peito até perto do chão e empurre de volta; se for difícil, use as mãos num apoio alto ou os joelhos no chão. | Erro comum: deixar o quadril afundar ou subir.
flexao_fechada: Mãos na largura dos ombros e cotovelos junto ao corpo. Desça o peito até perto das mãos e empurre de volta, corpo reto. | Erro comum: abrir os cotovelos para os lados.
pike: Mãos e pés no chão, quadril alto formando um V invertido. Dobre os cotovelos levando a cabeça em direção ao chão, entre as mãos, e empurre de volta. | Erro comum: baixar o quadril e virar uma flexão comum.
puxada_elastico: Elástico bem preso no alto da porta, longe da dobradiça. Puxe até a altura do queixo levando os cotovelos para baixo e volte devagar. | Erro comum: elástico mal preso. Confira antes de cada série.
remada_mochila: Mochila com peso firme, tronco inclinado à frente e coluna neutra. Puxe em direção ao umbigo levando os cotovelos para trás e desça com controle. | Erro comum: arredondar as costas ou puxar com impulso.
face_elastico: Elástico preso na altura do rosto. Puxe em direção à testa com os cotovelos altos e abertos e volte devagar. | Erro comum: puxar para o peito com os cotovelos baixos.
ytw: Deitado de bruços, testa num apoio baixo. Eleve os braços formando Y, depois T, depois W, com os polegares para cima, sem levantar o peito do chão. | Erro comum: usar impulso ou erguer a lombar.
pant_degrau: Ponta dos pés na borda de um degrau, mão no corrimão. Desça o calcanhar até alongar e suba o máximo possível, devagar. | Erro comum: soltar o corrimão e perder o equilíbrio.
deadbug: Deitado de costas, braços para o alto e joelhos dobrados a 90°. Estenda o braço e a perna opostos até perto do chão, volte e troque o lado, com a lombar encostada no chão. | Erro comum: deixar a lombar sair do chão ao estender a perna.
prancha: Antebraços no chão sob os ombros, corpo reto da cabeça aos pés e abdômen firme. Segure pelo tempo marcado respirando normalmente. | Erro comum: quadril afundando ou alto demais.
```

Observações: `hip_l` e `hip_b`, `copen_l` e `copen_b`, `salto_l` e `salto_b` são o mesmo exercício em dias diferentes; o texto se repete de propósito. Os ângulos (45°, 30°, 90°) são referências de execução usuais, não regra (a verificar).
