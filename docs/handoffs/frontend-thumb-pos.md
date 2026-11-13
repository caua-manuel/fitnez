# Frontend: ícone do Pós-treino

- Novo ícone `shake` (copo/shaker com canudo, traço 1,6) acrescentado em `src/ui/icons.tsx`.
- `MEAL_ICON.pos` em `src/ui/Thumb.tsx` agora usa `shake` (antes `agua`, que segue usado na hidratação).
- `tests/unit/thumb.test.ts` cobre `pos`, `pos-a`, `pos-b`, `pos-c` e a classe `ic-shake` renderizada.
- Verificação: 202 testes e typecheck passam; captura de `#dieta` conferida (legível em 56 px).
