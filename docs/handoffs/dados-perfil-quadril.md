# Dados: perfil físico e quadril

- `settings.profile` agora aceita `age`, `weightKg`, `heightCm` (opcionais; dados antigos continuam válidos, sem migração).
- `src/domain/profile.ts`: `validateProfile`, `proteinTargetG(weightKg?, gPerKg = 2.4)` (185 sem peso válido), `dietTargetsFromProfile(profile?)` (gordura 55).
- `src/domain/diet.ts`: `dayTargetForProfile(type, profile?)`; `dayTarget` inalterado quanto à assinatura. Kcal e carboidrato não mudaram.
- Quadril: chave `q` em `measurements.ts` (10 a 250 cm) e `evolution.ts` (`MeasureKey`, `hipSeries`, `hipDelta`).
- Testes: profile, measurements, evolution, diet.
