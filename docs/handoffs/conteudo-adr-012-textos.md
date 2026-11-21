# Conteúdo: textos e trocas pendentes do ADR 012

Data: 20/11/2026. Responsável: agente `conteudo-treino-nutricao`. Base: `docs/handoffs/dados-adr-012.md` (pendências), `data/exercise-guide.json` e `src/domain/swap.ts` (lidos, não editados).
Quem aplica: `frontend` (textos de tela e do passo 0) e `backend-dados` (`data/exercise-guide.json` e `src/domain/swap.ts`).

## 1. Tela de bloqueio `menor14`

- Título: `Ainda não dá para montar seu plano`
- Texto: `Abaixo dos 14 anos, o treino precisa de orientação de perto, de um adulto e de um professor de educação física. Por isso o app não monta um plano nem calcula metas de dieta. Converse com seus pais ou responsáveis antes de começar a treinar.`
- Ações: `Voltar` (volta ao passo dos dados, para corrigir a idade se ela foi digitada errada) e `Explorar o app`. Não há "Começar o plano".
- Motivo: a idade mínima foi adotada por precaução. Criança e adolescente novo podem treinar força com supervisão, mas o app não supervisiona (a verificar).

## 2. Amamentação

- Passo 0: a opção atual `Estou grávida ou amamentando` vira duas:
  - `Estou grávida` → `gestacao` (bloqueia);
  - `Estou amamentando` → `amamentacao` (conduta de condição de saúde).
- Aviso `amamentacao`: `Durante a amamentação, o app monta um começo leve e não calcula metas de dieta, porque a amamentação muda quanto você precisa comer e beber. Antes de começar, peça liberação ao seu médico, principalmente nos primeiros meses depois do parto, e procure um nutricionista. Beba água antes e depois do treino.`
- A caixa de confirmação é a mesma da condição de saúde: `Meu médico me liberou para fazer musculação.`
- Motivo: a amamentação aumenta a necessidade de energia e de líquidos (a verificar), e o corpo no pós-parto pede liberação antes de voltar a treinar. Não há motivo para bloquear como na gravidez.

## 3. Guia de execução (`data/exercise-guide.json`)

O texto de `sentar_levantar.passos` hoje é a observação do plano. Ele diz onde apoiar, mas não diz como fazer o movimento.

Texto final:

```json
"ponte": {
 "passos": "Deitado de costas, joelhos dobrados e pés no chão, afastados na largura do quadril. Suba o quadril até ficar alinhado com os joelhos, aperte o glúteo por 1 segundo e desça devagar.",
 "erro": "subir demais arqueando a lombar, em vez de subir apertando o glúteo."
},
"sentar_levantar": {
 "passos": "Sente na ponta de uma cadeira firme encostada na parede, pés afastados na largura do quadril. Incline o tronco um pouco à frente e levante empurrando o chão com os pés; volte a sentar devagar, sem cair na cadeira. Se precisar, apoie as mãos nos joelhos.",
 "erro": "sentar de uma vez, sem controlar a descida, ou deixar os joelhos se fecharem para dentro."
}
```

## 4. Grupos de troca (`src/domain/swap.ts`)

Os dois exercícios entram nos grupos existentes. Não precisa de grupo novo.

| Grupo (padrão) | academia | casa_equip | casa_livre |
| --- | --- | --- | --- |
| posterior-gluteos (`quadril`) | `hip_b`, `hip_l`, `ponte_h`, **`ponte`**, `ponte_uni` | `ponte_h`, **`ponte`**, `ponte_uni` | **`ponte`**, `ponte_uni` |
| quadriceps (`bilateral`) | `agach`, `leg`, `goblet`, `agach_livre`, **`sentar_levantar`** | `goblet`, `agach_livre`, **`sentar_levantar`** | `agach_livre`, **`sentar_levantar`** |

A ordem importa, porque `swapOptions` mostra as opções nessa ordem:
- **`ponte`:** fica antes de `ponte_uni`, então quem tem a ponte com uma perna vê primeiro a versão mais fácil. Quem tem `ponte` (60+ ou nunca treinou, em casa sem equipamento) vê `ponte_uni` como opção. Isso é aceitável: o exercício é feito deitado e não tem risco de queda.
- **`sentar_levantar`:** fica por último no padrão bilateral, então quem tem agachamento livre ainda vê primeiro as opções com carga. Quem tem `sentar_levantar` vê `agach_livre` primeiro, depois `afundo_livre`, que vem do outro padrão do mesmo grupo.

Motivo: os dois trabalham os mesmos grupos que os vizinhos de lista (`g` igual: `posterior-gluteos` e `quadriceps`). Sem isso, a pessoa veria "Sem troca equivalente".
