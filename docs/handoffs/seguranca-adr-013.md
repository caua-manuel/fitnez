# Segurança: ADR 013 (cardápio no assistente) e correções da execução

Revisão estática antes da publicação. Sem commit.

## Crítico
Nenhum.

## Importante
Nenhum.

## Desejável
- src/application/generatedDiet.ts:53: o registro `diet-undo` em `recovery` guarda uma cópia do bloco `food` anterior, com as restrições. Ele fica só no aparelho, é apagado por "Apagar tudo" (eraseAll.ts:59 limpa o store `recovery`) e vai junto no backup local, o que é esperado. Sugestão: dizer na tela de backup que o arquivo inclui as restrições alimentares.
- Um cardápio gerado (catalog.diet) deixa ver as restrições de forma indireta (por exemplo, nenhuma opção com leite). Hoje o compartilhamento usa só `catalog.plan` (planShare.ts:27,75), então não há vazamento. Manter assim se o compartilhamento de dieta vier no futuro.

## Conferido, sem problema
- `food` fica fora do compartilhamento de plano e do CSV (onboarding.ts:535; planShare só usa o plano). Nenhum `fetch` ou URL externa nas pastas revisadas.
- Validação: `checkFoodAnswers` aceita só listas fechadas, chaves permitidas e objeto simples, sem duplicatas e com limites. `foods` do cardápio (validation.ts:56) aceita no máximo 8 itens, id `^[a-z0-9_-]{1,40}$` e qtd finita entre 0 e 2000.
- `mealEligibility` (mealPlan.ts:54) bloqueia menor de 18 anos, gestação, amamentação, transtorno, condição, IMC < 18,5, falta de dados e quem escolheu "só proteína". A aplicação recusa antes de gerar.
- Rascunho (rascunho.ts): guarda só números (`^[0-9.,]{0,8}$`), a chave passa por `storageKey` (separada na demo) e tem o prefixo `treino12:`, então "Apagar tudo" a remove.
- O aviso de alergia (food.ts:7) não promete segurança: manda conferir o rótulo e seguir o médico.
- Nenhum `innerHTML`, `eval` ou script externo: a CSP não muda.
