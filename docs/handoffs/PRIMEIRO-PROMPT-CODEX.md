# Primeiro prompt para o Codex

Cole o bloco 1 na primeira mensagem. Depois da sua confirmação, cole o bloco 2.

## Bloco 1: leitura e resumo
```
Você vai trabalhar no projeto Fitnez em C:\Projeto-Treino (C maiúsculo).
Leia SOMENTE estes dois arquivos agora: AGENTS.md e docs/handoffs/PARA-O-CODEX.md.
Não leia mais nada, não edite nada e não rode comandos.
Resuma em até 8 linhas: o que é o app, as regras inegociáveis, onde paramos e quais tarefas estão LIBERADAS e quais BLOQUEADAS.
Depois PARE e espere a minha confirmação. Não comece nenhuma tarefa antes dela.
```

## Bloco 2: primeira tarefa liberada (tarefa 1)
```
Confirmado. Tarefa 1 do PARA-O-CODEX.md, só ela.
Tarefa: confirmar que src/domain/planEngine.ts e src/domain/painRules.ts ficam fora da carga inicial (carregamento sob demanda) e reportar o JS inicial e o total (gzip). Hoje 'rosca_elastico' aparece em dist/assets/index-*.js, o que indica que estão dentro. Se estiverem, corrija mudando só imports e carregamento.
Leia: scripts/verify-build.ts, src/application/onboarding.ts, src/application/repository.ts, src/data/validation.ts, src/features/assistente/Assistente.tsx.
Altere: só imports e carregamento sob demanda (import dinâmico).
Pronto quando: 'rosca_elastico' e 'lat_elastico' não aparecem em dist/assets/index-*.js e npm run check passa.
Não faça: mudar números de treino/dieta, regras de volume ou segurança, o orçamento de peso, o formato guardado ou commitQueue.ts. Sem push nem publicação.
Antes de editar: plano em 5 linhas. Ao terminar: cole o resumo do npm run check (testes e tamanhos) e git diff --stat, faça um commit local pequeno e responda curto.
```
