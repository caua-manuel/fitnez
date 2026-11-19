# Conteúdo: ajuste de volume semanal do assistente de início

Data: 19/11/2026. Responsável: agente `conteudo-treino-nutricao`. Status: PROPOSTA para implementação (o dono ainda pode revisar).
Base: `docs/handoffs/conteudo-assistente-inicio.md` (3.1, 4.2, 7), `docs/handoffs/dados-assistente-inicio.md` (pendências), `src/domain/onboarding.ts` (lido, não editado). ADR: [010-ajuste-volume-assistente.md](../decisoes/010-ajuste-volume-assistente.md).

Todos os números de volume são escolhas de produto **(a verificar)**. Nenhum estudo foi conferido nesta passada.

## 1. Problema

Séries semanais no bloco 1 (`s[0]`), contando só peito, costas, quadríceps e posterior e glúteos, como a seção 4.2 manda. A implementação atual dá:

| Perfil | Fora da faixa | Faixa atual |
| --- | --- | --- |
| 4 (iniciante, 4 dias, médio, academia) | costas 12 | 6 a 10 |
| 11 (intermediário, 5 dias, longo, academia) | costas 15, quadríceps 15, posterior 15 | 8 a 14 |
| 12 (nunca, 2 dias, médio, academia) | peito 2 | 4 a 8 |
| 15 (intermediário, 2 dias, longo, academia) | peito 3; costas, quadríceps, posterior 6 | 8 a 14 |

## 2. Decisões (caso a caso)

### 2.1 Perfil 4: muda a REGRA (Superior B para nunca e iniciante)

Superior A e Superior B têm duas puxadas cada (vertical e horizontal), todas principais: 4 exercícios de costas por semana contra 2 de peito. Para quem está começando isso desequilibra costas e peito e passa do teto de recuperação proposto (a verificar). Rebaixar a segunda puxada para acessória não funciona, porque o exercício é compartilhado por ID entre os treinos (`remada_b` e `puxada` aparecem nos dois) e herdaria as séries do primeiro treino processado.

Nova regra: para `nunca` e `iniciante`, Superior B usa outra lista de vagas, sem a puxada vertical; a 7ª vaga (só no `longo`) passa a ser empurrar vertical.

- **Superior B (nunca e iniciante):** puxar horizontal, empurrar inclinado, ombro lateral, ombro posterior, tríceps, bíceps, empurrar vertical.
- **Superior B (intermediário):** sem mudança.

`nunca` não chega a 4 dias (teto 3), mas a regra vale para os dois por simplicidade.

### 2.2 Perfil 11: muda a FAIXA (intermediário até 16)

Com 5 dias, o intermediário treina cada grupo grande 3 vezes por semana (Superior/Pernas + Corpo inteiro A). O excesso é de 1 série e vem da 3ª exposição, que é justamente o motivo de quem pede 5 dias. Tirar a vaga do Corpo inteiro A esvaziaria o treino. Faixas mais altas para quem já treina são comuns na literatura de volume (a verificar). Nova faixa do intermediário: **8 a 16**. Nenhuma combinação possível do assistente passa de 15 (em casa, as IDs repetidas são puladas e o volume cai).

### 2.3 Perfis 12 e 15: muda a REGRA (Corpo inteiro B com 2 dias) e a FAIXA aceita mínimo menor com 2 dias

Com 2 dias, Corpo inteiro A tem o único exercício de peito (empurrar horizontal) e Corpo inteiro B tem empurrar vertical (`press_b`, grupo `press`). Peito fica com 1 exercício por semana, metade de costas. Isso é desequilíbrio, não teto natural, então a regra muda:

- **Corpo inteiro B quando a divisão tem 2 dias** (inclui a "semana cheia"): empurrar inclinado no lugar de empurrar vertical. Lista: quadril, empurrar inclinado, puxar horizontal, unilateral, ombro posterior, core, tríceps, panturrilha. Subtítulo: `Pernas, peito, costas e core`. Ombro anterior segue trabalhado pelo supino e pelo inclinado; ombro lateral entra no Corpo inteiro A a partir do `medio` (a verificar).
- Com 3 dias (A, B, A) nada muda: B aparece uma vez e A duas.

Depois disso, cada grupo grande recebe 1 exercício principal por treino, 2 por semana. Com 2 dias isso é o teto natural: chegar a 8 séries exigiria 4 séries por exercício ou 2 exercícios do mesmo grupo no treino, alongando a sessão de quem só tem 2 dias. Frequência de 2 vezes por semana por grupo é o que a seção 4.2 cita como referência (a verificar). Então a FAIXA aceita, **com 2 dias**, mínimo de 2 × séries principais do bloco 1: nunca 4, iniciante 6, intermediário 6. Perfil 15 fica em 6 (aceito); perfil 12 fica em 4 (dentro da faixa normal).

## 3. Regra exata (pseudocódigo)

```
SUPB_INICIO = [puxH, empInc, ombroLat, ombroPost, triceps, biceps, empV]   // nunca e iniciante
CIB_2DIAS   = [quadril, empInc, puxH, unilateral, ombroPost, core, triceps, panturrilha]

vagas(treino, exp, dias):
  se treino = SUPB e exp em {nunca, iniciante}: devolve SUPB_INICIO
  se treino = CIB e dias = 2:                   devolve CIB_2DIAS   (sub: "Pernas, peito, costas e core")
  senão: devolve a lista da seção 3.1

// "dias" é o número final de treinos da divisão (depois de teto, atividades fixas e semana cheia).
// O resto (limite por tempo, IDs repetidas puladas, séries por principal/acessória) não muda.

faixa(exp) = { nunca: [4, 8], iniciante: [6, 10], intermediario: [8, 16] }
séries(grupo) = soma, nos treinos da rotina (com repetição: A, B, A conta A duas vezes),
                de s[0] de cada exercício com g = grupo
verificação, para peito, costas, quadríceps, posterior e glúteos:
  max: séries(grupo) <= faixa(exp).max                        // sempre
  min: se tempo = curto: sem mínimo
       senão se dias = 2: séries(grupo) >= 2 * s_principal[0](exp)   // nunca 4, iniciante 6, intermediário 6
       senão: séries(grupo) >= faixa(exp).min
```

Atenção ao grupo: `press_b` e `pike` têm `g` = `press`, não peito; `afundo`, `bulg` e `afundo_livre` contam em quadríceps.

## 4. Valores esperados (bloco 1, peito / costas / quadríceps / posterior e glúteos)

Perfis afetados:

| # | Treinos gerados (exercícios) | Antes | Depois | Verificação |
| --- | --- | --- | --- | --- |
| 4 | Sup A: supino, puxada, press_b, remada_b, lat_a, rosca_a. Sup B: remada_b, inclinado, lat_a, face, tri_a, rosca_a. Pernas A: agach, hip_b, afundo, mesa, pant_pe, pallof. Pernas B: hip_b, leg, afundo, mesa, pant_pe, pallof | 6 / 12 / 10 / 10 | 6 / 9 / 10 / 10 | faixa 6 a 10, ok |
| 9 | igual ao 4 (mesmas respostas de treino) | 6 / 12 / 10 / 10 | 6 / 9 / 10 / 10 | ok |
| 11 | sem mudança de regra | 9 / 15 / 15 / 15 | 9 / 15 / 15 / 15 | faixa 8 a 16, ok |
| 12 | CI A: leg, supino, puxada, hip_b, lat_a, pallof. CI B: hip_b, inclinado, remada_b, afundo, face, pallof | 2 / 4 / 4 / 4 | 4 / 4 / 4 / 4 | faixa 4 a 8, ok |
| 15 | CI A: agach, supino, puxada, hip_b, lat_a, pallof, rosca_a, pant_pe. CI B: hip_b, inclinado, remada_b, bulg, face, pallof, tri_a, pant_pe | 3 / 6 / 6 / 6 | 6 / 6 / 6 / 6 | 2 dias: mínimo 6, máximo 16, ok |
| 3 | CI A: goblet, supino_chao, puxada_elastico, ponte_h. CI B: ponte_h, supino_chao, remada_b, bulg | 2 / 4 / 4 / 4 | 4 / 4 / 4 / 4 | curto; ok |

Perfis sem mudança (para o teste conferir que continuam iguais): 1 = 6 / 9 / 8 / 9; 2 = 4 / 6 / 6 / 6 (curto); 5 = 6 / 9 / 8 / 9; 6 = 4 / 6 / 6 / 6; 7 = 4 / 6 / 6 / 6 (menor de 18, vira `nunca`); 8 (casa_equip, iniciante, 3 dias): peito 6, costas 9 (`puxada_elastico` e `remada_b`), quadríceps 8 (`goblet` 3 + 3 + `bulg` 2), posterior 9 (`ponte_h` 3 + 3 + 3) = 6 / 9 / 8 / 9; 10 e 14 = iguais ao 1; 13 = 6 / 12 / 12 / 12 (intermediário, curto, sem mudança de regra).

Conta do perfil 4 (Superior B nova, `medio` = 6 vagas): costas = Sup A puxada 3 + remada_b 3 + Sup B remada_b 3 = 9 (`remada_b` é o mesmo exercício nos dois treinos, com `s` principal [3,3,4]).

Conta do perfil 15: Corpo inteiro com 2 dias, cada grupo 1 principal por treino com `s[0]` = 3; peito supino 3 + inclinado 3 = 6.

## 5. Para quem implementa

- `src/domain/onboarding.ts`: `TEMPLATES` ganha a variante de Superior B por experiência e a de Corpo inteiro B por número de dias (função `slotsFor(key, exp, days)` ou equivalente). Nada mais muda.
- Testes: incluir a verificação de volume da seção 3 para todos os perfis da seção 7 da especificação, com os números da tabela acima.
- Seção 4.2 e 3.1 de `conteudo-assistente-inicio.md` já estão atualizadas.
