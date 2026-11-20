# ADR 006 — Ícones e movimento: app mais vivo, premium minimalista

Data: 13/11/2026. Responsável: agente `arquiteto`.
Status: ADOTADA (decisão do dono).

Documentos de origem:
- Tema neutro: [frontend-tema-neutro.md](../handoffs/frontend-tema-neutro.md)
- ADR 001: [001-arquitetura-e-stack-frontend.md](001-arquitetura-e-stack-frontend.md)

## Contexto

O dono pediu ícones, menus e elementos mais vivos, mantendo o visual premium minimalista, e autorizou frameworks (citou Tailwind e algo 3D). A recomendação aprovada foi: Phosphor Icons + motion + CSS 3D leve, sem Tailwind e sem three.js. Critérios do projeto, em ordem: custo zero, offline, simplicidade, desempenho no celular, facilidade de testar.

## Decisões

### 1. Ícones: @phosphor-icons/react 2.1.10 (MIT)
- Pesos `duotone` e `regular`.
- Importação individual de cada ícone (tree-shaking). É proibido importar o pacote inteiro (`import * as` ou o índice completo).
- Justificativa: conjunto coeso, duotone dá vida sem cor de fundo, licença MIT, funciona offline (vai no bundle).
- Consequência: ícones decorativos com `aria-hidden`; ícones que carregam sentido têm rótulo textual.

### 2. Animação: motion 14.14.0 (MIT)
- Usos: contagem de números, entrada em sequência, anel de progresso, transição de telas.
- API enxuta: `LazyMotion` com `domAnimation` e componentes `m.*` (nunca o `motion.*` completo), para limitar o peso.
- CSS puro onde bastar (hover, foco, fades simples).
- Consequência: a lógica de animação fica na interface; regras de negócio continuam em funções puras e não dependem de motion.

### 3. 3D: CSS 3D leve, sem three.js
- `perspective`/`transform`, parallax e inclinação por ponteiro, esta só em dispositivos com hover fino (`@media (hover: hover) and (pointer: fine)`).
- Por que não three.js: centenas de KB, mais bateria e GPU no celular, pior para offline e PWA (mais cache, mais risco de falha).
- three.js só poderia voltar por ADR futuro, carregado sob demanda e em um único elemento.

### 4. Tailwind recusado
O app já tem sistema de tokens e CSS próprio (`DESIGN.md`). Migrar não traria ganho visual e arriscaria regressão em telas aprovadas, além de nova ferramenta de build.

### 5. Orçamento de peso (verificado no build)
- Vigente (revisão de 19/11/2026, abaixo): JavaScript gzip total ≤ 215 KB e CSS gzip ≤ 28 KB, conferidos por `scripts/verify-build.ts`.
- Histórico: o texto original dizia JS ≤ 190 KB e CSS ≤ 12 KB. O limite de 12 KB nunca chegou ao build: o CSS herdado do protótipo já pesava cerca de 19,5 KB, e o script usava 24 KB. 28 KB é o número certo porque o CSS atual mede 23,7 KB e o limite precisa deixar margem para as próximas telas sem esconder crescimento descontrolado.
- `devops-github` e `qa-testes` incluem a checagem no build/CI; estourar o orçamento falha o build.

### 6. Regras de movimento
- Respeitar `prefers-reduced-motion`: sem transformações e números sem contagem (valor final direto).
- Nada de animação contínua ou em loop.
- Duração de 120 a 350 ms, easing suave.
- Nunca bloquear a interação (toque e teclado funcionam durante a animação).
- Desligar quando a aba está oculta (`document.hidden`).

### 7. Cor
Acentos de seção (verde para Dieta, âmbar para sequência/conquistas) aparecem só em ícones, números e selos pequenos, nunca em fundos grandes. O dono rejeitou azul e fundos coloridos; vale o tema neutro.

### 8. Cadeia de suprimentos
- Versões exatas (sem `^` nem `~`) no `package.json`.
- `npm audit`: 0 vulnerabilidades em 13/11/2026; manter assim antes de cada entrega.
- 6 pacotes adicionados ao `package-lock.json` (as duas bibliotecas e suas dependências transitivas). Toda atualização passa por revisão e novo `npm audit`.

## Consequências gerais
- Margem de cerca de 57 KB gzip de JavaScript para o resto da evolução; ícones novos consomem esse orçamento.
- Testes cobrem o modo de movimento reduzido e a ausência de importação do pacote inteiro de ícones.
- `DESIGN.md` deve registrar os acentos e as regras de movimento (tarefa do `frontend`).

## Decisões que o dono ainda precisa tomar
1. 3D de verdade (three.js) sob demanda em um elemento: recomendo não fazer agora; reavaliar só se houver uma ideia concreta e se o orçamento permitir.
2. Conquistas e gamificação (selos, sequências): recomendo começar pequeno, com selos discretos em âmbar e sem pressão por streak, após a Entrega A ser aprovada.

## Revisão de 19/11/2026 (orçamento de peso)
- Antes: JavaScript gzip ≤ 190 KB; CSS gzip ≤ 24 KB no build. O texto acima dizia 12 KB de CSS, mas o `scripts/verify-build.ts` já usava 24 KB desde que o CSS legado (~19,5 KB) passou de 12; esta revisão corrige a divergência.
- Medido antes da revisão: JS 196,1 KB e CSS 23,5 KB (gzip), acima ou no limite.
- Novo: JavaScript gzip ≤ 215 KB; CSS gzip ≤ 28 KB (aplicado em `scripts/verify-build.ts`).
- Motivo: funcionalidades pedidas pelo dono, o assistente de início (ADR 008) e o registro de treino inspirado no Hevy (ADR 009).
- Regra: estourar de novo exige outra revisão registrada neste ADR; não se sobe o limite só no script.
- Próximo passo recomendado: carregar sob demanda o assistente (ver `docs/handoffs/devops-orcamento-peso.md`).
