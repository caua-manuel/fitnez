# Dados: metas de dieta editáveis (ADR 007)

Camada de regras e dados pronta. Interface (`src/features/`, `src/ui/`, `src/app/`) não foi tocada.

## Formato salvo

`state.settings.dietTargets?` (opcional; estado continua v3; não é gravado enquanto o usuário não editar nem confirmar):

```
{ schema: 1, versions: [{ from: 'AAAA-MM-DD', targets: DietTargets | null }] }   // até 100, `from` estritamente crescente
DietTargets = { days: Record<'perna'|'academia'|'jiujitsu'|'volei'|'descanso', { kcal, carbs }>, proteinG: number | null, fatG, waterL }
```

`proteinG: null` = automática pelo peso; `targets: null` = "restaurar padrão". Importação (`validateState`) rejeita valor fora dos limites com a mensagem "As metas de dieta do backup são inválidas." Backups v1, v2 e v3 antigos importam sem conversão (o campo não é criado).

## API pública

`src/domain/dietTargets.ts` (tudo puro):

- Tipos: `DietTargets`, `DietTargetsVersion`, `DietTargetsSetting`, `DietTargetsInput`, `DietTargetsResult`, `DietWarning` (`{ code, message, day? }`), `WarningCode`, `ResolvedDietTargets`.
- Constantes: `DAY_TYPES`, `DAY_TYPE_LABEL`, `LIMITS`, `WARN`, `MAX_DIET_TARGET_VERSIONS`.
- Padrão: `defaultDietTargets()` (os números atuais, vindos de `diet.ts` e `profile.ts`).
- Cálculo: `kcalFromMacros(p,c,g)`, `macroTolerance(kcal)`, `carbsFromRest(kcal,p,g)` (só devolve o valor), `waterCups(L)`.
- Validação: `validateDietTargets(input, { weightKg? })` devolve `{ ok:true, value, warnings }` ou `{ ok:false, errors }`. Chaves de erro: `days.<tipo>.kcal`, `days.<tipo>.carbs`, `proteinG`, `fatG`, `waterL`; mensagens já em pt-BR (seção 7.5). Avisos: textos da seção 7.4, `day` preenchido nos de kcal e coerência. Proteína automática: `proteinG` vazio, `null` ou `'auto'`; na coerência usa `proteinTargetG(peso)`.
- Formulário: `targetsToInput(targets)` devolve textos iniciais.
- Resolução: `resolveDietTargets(settings, dia, perfil?)` devolve `{ days, protein, proteinAuto, fat, waterL, isExample }`; `effectiveDietTargets(settings, dia)`; `dayTargetFor(tipo, dia, settings, perfil?)` devolve `DayTarget` (perfil omitido = `settings.profile`; `null` ou sem peso = 185 g).
- Estado: `isExampleTarget(settings)` (nada salvo, ou a versão mais recente é `null`).
- Versões: `pushDietTargetsVersion(versions, hoje, targets|null)`, `withDietTargetsVersion(atual, hoje, targets|null)`, `confirmExampleVersion(atual, hoje)` ("Usar esta meta"), `restoreDefaultVersion(atual, hoje)` ("Restaurar padrão"), `settingsWithDietTargets(settings, valor|undefined)`.
- Formato salvo: `isValidDietTargets`, `isValidDietTargetsSetting`.

Em `src/domain/diet.ts` (sem mudar números): `dayTarget` aceita `kcal`, `carbs`, `waterL` opcionais; novos `DAY_TARGET_DEFAULTS`, `DEFAULT_WATER_L`. `dayTargetForProfile` continua igual (caso sem edição).

Decisões: relógio que voltou (`hoje` < última versão) usa o `from` da última e a substitui; mesmo dia substitui; na 101ª versão a mais antiga sai e a nova mais antiga recebe `from: '1970-01-01'`.

## O que a interface deve chamar

- Meta do dia: trocar `dayTargetForProfile(type, profile)` por `dayTargetFor(type, dia, state.settings)` em `src/features/dieta/useDietDay.ts` (único uso). Água em copos: `waterCups(target.waterL)`; `Dieta.tsx` já calcula igual. Perfil: usar `resolveDietTargets(settings, hoje)` (`protein`, `proteinAuto`) no lugar do texto fixo com `proteinTargetG`.
- É exemplo? `isExampleTarget(state.settings)`.
- Formulário: iniciar com `targetsToInput(effectiveDietTargets(settings, hoje))`; validar com `validateDietTargets(valores, { weightKg: settings.profile?.weightKg })`. Bloquear salvar se `!ok`; mostrar `warnings` sem bloquear. "Calcular pelo que sobra": `carbsFromRest(kcal, proteína efetiva, gordura)`.
- Salvar: `const previous = state.settings.dietTargets; next.settings = settingsWithDietTargets(next.settings, withDietTargetsVersion(previous, localDayOf(now), result.value)); repo.save({ state: next, expectedRevision })`. Hoje: `localDayOf` de `planStart.ts`.
- "Usar esta meta": igual, com `confirmExampleVersion(previous, hoje)`. Restaurar padrão: `restoreDefaultVersion(previous, hoje)`.
- Desfazer: guardar `previous` e regravar `settingsWithDietTargets(settings, previous)` (`undefined` remove o campo). `save` valida antes de enfileirar e lança de forma síncrona se o valor estiver inválido.

## O que muda para quem já tem dados

Nada nos números nem nos dados salvos: sem `dietTargets`, `isExampleTarget` é verdadeiro (a interface mostra "Meta de exemplo" até a pessoa tocar em "Usar esta meta") e `dayTargetFor` devolve exatamente o mesmo que `dayTargetForProfile` (teste cobre os 5 tipos e vários pesos). Nenhuma migração.

## Testes

- `tests/unit/dietTargets.test.ts`: tabela de 46 exemplos, dias passados, regressão do padrão, validação do formato salvo.
- `tests/integration/diet-targets.test.ts`: v1/v2/v3 sem o campo, salvar/restaurar/desfazer, ida e volta exportar-importar, rejeição de backup inválido, apagar tudo.
- Testes existentes de dieta e perfil sem alteração.

## Arquivos

Novo: `src/domain/dietTargets.ts`. Alterados: `src/domain/diet.ts`, `src/data/validation.ts`, `src/application/repository.ts` (tipo), `docs/ESPECIFICACAO.md` (seção 4), `docs/decisoes/007-metas-de-dieta-editaveis.md` (status ADOTADA). `src/data/index.ts` não precisou mudar (`save` já preserva `settings`).
