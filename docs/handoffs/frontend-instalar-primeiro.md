# Frontend: instalar antes de montar o plano

Motivo: no iPhone, o app da tela de início tem armazenamento próprio, separado do Safari. Quem montava o plano no Safari e depois instalava abria o app com o plano padrão. Decisão do dono: instalar primeiro.

- `src/features/assistente/Assistente.tsx`: nova tela `instalar`, antes das boas-vindas, só no navegador e só quando dá para instalar (`ios-safari` com os 3 passos, ou `prompt` do Chromium/Android). Fora em standalone, na demonstração e em "Refazer meu plano". Título "Instale o app primeiro", uma frase sobre o iPhone (no Android, uma frase sobre abrir pelo ícone), o ícone real do app, botão principal "Adicionar à tela de início" (iPhone: folha com os 3 passos; Android: diálogo nativo) e o link "Continuar no navegador", que leva às boas-vindas atuais. Se o `beforeinstallprompt` chega depois da abertura, o passo aparece; depois de "Continuar no navegador" ele não volta mais na sessão. Nada é gravado.
- Boas-vindas (navegador ou app instalado): "Montar meu plano" é a única ação em destaque; "Usar o plano padrão" virou link de texto, acima de "Decidir depois".
- `src/features/perfil/InstalarApp.tsx`: `InstallSheet` mostra o aviso "O app instalado começa sem os dados deste navegador. Depois de instalar, monte o plano por lá ou restaure um backup." só no iOS (`ios-safari` e `ios-other`) e só se houver data de início confirmada ou dados do usuário (`isStartConfirmed`, `hasUserData`). Vale para o Início, o Perfil, o fim do treino e as boas-vindas. No Android/Chrome e no computador o app instalado usa os mesmos dados da origem, então não há aviso (o modo `prompt` nem abre a folha).
- CSS: `.as-app` em `assistente.css`; `.ia-dados` em `instalar.css`.
- Testes: novo `tests/e2e/instalar-primeiro.spec.ts` (iPhone: passo primeiro, continuar, standalone por `matchMedia`, aviso no Início, demonstração; Android: passo com o pedido nativo, sem aviso; computador: como antes). `instalar-inicio.spec.ts` passa por "Continuar no navegador" no iPhone.
- Não editei `src/domain/onboarding.ts` (é do conteúdo) nem `src/app/App.tsx`: o App já abre o assistente quando a data de início não foi confirmada, e no app instalado isso leva direto às boas-vindas.

## Ajuste pedido junto: teto de dias

- `Assistente.tsx`, aviso `daysReason === 'teto'` (agora só para transtorno alimentar): "Você pediu {n} dias. O app montou {m} treinos por semana, para sobrar tempo de descanso. Se quiser mudar, converse antes com quem acompanha você." O texto de `atividades` não mudou.
- Conferido na tela (390 x 844): Empurrar, Puxar e Superior aparecem no resumo, na Semana tipo, no Início e em Treino (6 dias = segunda a sábado; 5 dias começa com Superior).
