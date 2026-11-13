# Entrega B: regras puras da dieta

Arquivos: `src/domain/diet.ts`, `tests/unit/diet.test.ts`.

- Exporta MealKey, DietOption, DayTarget, DietDay, dayTarget, markEaten, unmarkEaten, dayTotals, progress, applyAdjustments, weeklyReview.
- `dayTarget(type, { protein?, fat? })`: padrões 185 g e 55 g, água 3 L.
- `consumed` guarda cópia dos valores ao marcar "comi"; `dayTotals` usa `consumed` primeiro. Refeição marcada como pulada não conta. Números inválidos viram 0.
- `weeklyReview`: força caindo ou fome alta têm prioridade (+150 kcal); perda maior que 0,7 kg (+150); estagnação (variação menor que 0,15 kg e cintura sem diminuir) corta 130 e pede revisar o carboidrato do pré-treino; perda de 0,2 a 0,4 kg com cintura diminuindo mantém. Menos de 2 semanas de peso, ou de cintura quando precisa dela, dá `dados-insuficientes`. Sempre sugestão.
- `DayRecord.diet` já existia como `Payload` em `repository.ts`; não foi alterado (compatível com `DietDay`).
