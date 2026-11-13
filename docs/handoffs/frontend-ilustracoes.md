# Handoff frontend: ilustrações SVG

Arquivos: `src/ui/illustrations.tsx`, `src/ui/illustrations.css` (variáveis `--il-*`, claro e escuro), `tests/unit/illustrations.test.ts`.

API (todas com `size?` em px, `title?` opcional, `className?`; decorativas com `aria-hidden` por padrão):
- `MuscleIllustration({ group, variant?: 'square' | 'hero' })`, com `group: MuscleGroup | null` (null = halter).
- `HeroIllustration({ groups?, group? })`: faixa larga com diagonal azul (proporção 1,9:1), aceita vários grupos (Peito + Tríceps).
- `ExerciseIllustration({ exId, group })`: poses para supino/inclinado, remada, barra, agachamento/búlgaro, stiff, hip thrust, elevação lateral, rosca, tríceps e puxada; demais caem em `MuscleIllustration`.
- `MealIllustration({ meal: 'cafe' | 'almoco' | 'lanche' | 'pos' | 'jantar' })`: 4:3 (120x90).

Integração: o CSS é importado pelo próprio módulo. Ids de gradiente usam `useId` (únicos por instância). Sem texto nos SVGs. Pendência para o dono da interface: usar os componentes nas abas Início, Treinos e Dieta.

Acabamento: flat com gradientes sutis; figuras são manequins/bonecos estilizados, não anatomia detalhada. As refeições são o ponto mais forte; as poses de exercício são simples.
