# Prompts de pose dos exercícios

Estilo de referência: `src/ui/illustrations.tsx` (poses 96x96, SVG, `ExerciseIllustration`) e `docs/handoffs/frontend-ilustracoes.md`. Figura de manequim estilizado, flat com gradientes sutis, sem texto, sem rosto detalhado. Cores pelas variáveis `--il-*` (claro e escuro).

Base comum de todos os prompts: "ilustração vetorial flat, quadrada 1:1, manequim estilizado sem traços de rosto, corpo branco com sombra cinza suave, calça escura, fundo cinza claro com piso discreto, músculo trabalhado em azul vivo, elástico em azul escuro com linha fina, sem texto, sem marca, sem anatomia detalhada, poucos elementos".

## rosca_elastico (Rosca com elástico, grupo bíceps)

Pose de meio da subida, vista de lado: "Manequim em pé, pés na largura do quadril, os dois pés sobre o meio de um elástico que sobe até as mãos. Cotovelos junto ao corpo, antebraços dobrados a cerca de 90 graus, palmas para a frente, elástico esticado. Bíceps destacado em azul. Tronco reto, sem inclinar."

## lat_elastico (Elevação lateral com elástico, grupo ombro lateral)

Pose do topo, vista de frente: "Manequim em pé, pés na largura do quadril sobre o meio de um elástico. Braços erguidos para os lados até a altura dos ombros, cotovelos levemente dobrados, elástico esticado em V das mãos até os pés. Ombro lateral (deltoide) destacado em azul. Ombros baixos, tronco reto."

Integração: acrescentar `rosca_elastico` e `lat_elastico` ao mapa `POSES` só se o frontend desenhar as poses; sem pose, o app usa `MuscleIllustration` pelo grupo, como nos demais.
