# Front-end: metas de dieta editáveis (ADR 007)

Interface das metas usando só a API de `src/domain/dietTargets.ts`. Nenhum número nem regra de dieta mudou; `src/domain`, `src/data`, `src/application` e `data/` não foram tocados.

## O que mudou

- `src/features/dieta/useDietDay.ts`: `dayTargetFor(type, dia, state.settings)` no lugar de `dayTargetForProfile`. Sem metas salvas o resultado é idêntico (testes existentes passam sem mudar expectativa).
- `src/features/dieta/metasActions.ts` (novo): `save`, `confirmExample` e `restore`. Gravam por `commit` (fila que chama `repository.save`, com try/catch para erro síncrono), com `settingsWithDietTargets` e `withDietTargetsVersion(previous, localDayOf(Date.now()), ...)`. Avisos "Metas salvas", "Meta confirmada" e "Metas restauradas", todos com "Desfazer" (regrava o valor anterior; `undefined` remove o campo).
- `src/features/dieta/MetaDieta.tsx` (novo): selo discreto "Meta de exemplo" com a linha "Valores de exemplo do plano. Ajuste para o seu caso." e as ações "Ajustar metas" e "Usar esta meta" (links azuis, sem fundo). Depois de confirmar ou editar, sobra só o atalho "Ajustar metas". Substitui a antiga frase "Metas de exemplo, para ajustar ao seu perfil." na Dieta (sem duplicar).
- `src/features/dieta/MetasSheet.tsx` e `metas.css` (novos): folha "Metas de dieta" com intro, aviso de saúde fixo, calorias e carboidrato por tipo de dia, soma informativa, "Calcular pelo que sobra" (só preenche o campo e anuncia o valor), proteína (chave "Calcular pelo peso" ou manual), gordura, água, "Restaurar padrão" (com confirmação; só aparece fora do exemplo), barra fixa com "Cancelar" e "Salvar metas". Valores iniciais de `targetsToInput(effectiveDietTargets(...))`; validação por `validateDietTargets(..., { weightKg })`. Erros só depois da primeira tentativa de salvar, bloqueiam, ficam junto ao campo (`aria-invalid`, `aria-describedby`), resumo `role="alert"` e foco no primeiro campo inválido. Avisos aparecem ao vivo, sem bloquear. Falha ao salvar: texto da seção 7.5 com o que foi digitado preservado. Teclado numérico (`inputMode`), rótulos visíveis.
- `src/features/perfil/Perfil.tsx`: nova linha "Metas de dieta" (resumo "Meta de exemplo" ou "Metas personalizadas") que abre a mesma folha; texto de proteína vem de `resolveDietTargets` (manual: "(definida por você)"); a nota de exemplo no Perfil só aparece enquanto `isExampleTarget`.
- `tests/e2e/metas-dieta.spec.ts` (novo, 9 testes).

## Decisões e lacunas

- Sem peso e proteína automática o Perfil continua sem a linha de proteína (igual a hoje); a seção 7.1 do conteúdo pede "185 g por dia (exemplo)". Para manter "idêntico ao de hoje" não apliquei; é uma linha a trocar em `Perfil.tsx` se o dono quiser.
- Desfazer também em "Metas salvas" (além do pedido para restaurar).
- A tarefa não incluiu o Início; "(exemplo)" no Início é opcional na especificação e não foi feito.
- Sem teste em leitor de tela nem em aparelho físico.
- Capturas (fora do versionamento): `capturas/metas-dieta/` (390 px, claro e escuro; `shoot.mjs` gera de novo com o preview em 4173).
