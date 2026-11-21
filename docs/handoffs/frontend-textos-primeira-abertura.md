# Frontend: textos da primeira abertura e menu do exercício

Data: 20/11/2026. Agente: `frontend`. Base: `docs/handoffs/ux-primeira-abertura.md` e `docs/handoffs/conteudo-revisao-10-perfis.md`. Sem commit.

## Aplicado

- **Assistente** (`src/features/assistente/Assistente.tsx`)
  - Itens aplicados: A1, A2, A2b, A3 (número de perguntas vem de `N`), A4 a A9 ("plano padrão"), A10, A10b, A11 (sem "deload"), A12, A13, A13b, A15 (aviso fixo só nas boas-vindas e no resumo) e A16.
  - W1: a linha "Dias já usados por outra atividade ficam desligados." aparece embaixo da grade de dias quando algum dia está ocupado.
  - Avisos novos do domínio (ADR 012, em andamento no backend) também exigiam texto:
    - `idade60` e `duracao-reduzida` com os textos aprovados na seção 4 do `conteudo-revisao-10-perfis.md`.
    - `amamentacao` usa o texto já aprovado para "gravidez e amamentação" até a tela separar a opção.
    - Sem isso o typecheck quebrava.
- **Constante `ASSISTANT_QUESTIONS = 9`** em `src/features/assistente/store.ts`. O cartão do Início usa essa constante para não carregar o chunk do assistente. Em desenvolvimento, o assistente avisa no console se ela divergir de `STEPS.length`.
- **Início** (`src/features/inicio/Inicio.tsx`, `DietaResumo.tsx`, `inicio.css`)
  - Item 2 (C2): cartão "Monte seu plano" no topo, ainda sem o botão da demo.
    - Aparece quando `!isStartConfirmed && !hasUserData && appMode() === 'real'`.
    - Tem "Primeiro passo", "{9} perguntas rápidas…", a ação principal "Montar meu plano" (`openAssistant('primeira')`) e a linha sobre o plano padrão.
    - Nesse estado, o botão do cartão de hoje fica secundário, com "Treinar com o plano padrão". Fica uma só ação principal na tela.
  - I1: rótulo visível "Carga sugerida" acima do número.
  - I2: `aria-label` "3 séries de 8 a 12 repetições" na prescrição.
  - I2b, I3 ("Pare com N repetições ainda sobrando", com singular para 1; semana leve explicada) e I4 ("Treinar hoje sem começar o plano").
  - DR1: "meta de exemplo" numa linha própria abaixo das kcal, sem o separador "·" proposto, porque o texto quebrava mal em 390 px.
- **Perfil**: P1. Sem `settings.onboarding`, a linha mostra "Montar meu plano / Responda algumas perguntas; seus registros continuam salvos."
- **Execução** (`src/features/treino/Executar.tsx`)
  - Item 8: E1 (dica das sugestões em cinza, só antes da primeira série da vida), E2 (primeira vez no exercício com carga) e E3 (RIR quando não há E2).
  - E4 ("Anterior"), E5 ("Última vez: …"), E7 e E8 (dica visível acima de "Concluir treino").
  - E9, com o estilo inline trocado pela classe `.tr-sug-note`.
- **Concluído e recordes**: K1 ("Total levantado", com `title` explicando a conta), K2 e K3 ("carga máxima estimada", "máx. estimado"). D1 no Detalhe ("Esforço (RIR)").
- **Menu "⋮" do exercício**
  - Agora fica no canto direito do cabeçalho do exercício: o seletor `.ex-name>.ui-menu-wrap.ex-more` vence `.ui-menu-wrap`.
  - A linha "Exercício N de M" ganhou 48 px de altura e recuo lateral para o menu não encostar no nome.
  - Em 390 × 844, a primeira caixa de marcar fica entre y = 594 e 701 (nome longo e primeira execução) e "Concluir treino" em y = 784. As duas continuam na metade de baixo.

## Não aplicado (fica para depois)

- Demo, lembrete de backup, cartão de instalar (inclui I6, tirar `InstalarApp` do Início) e compartilhar plano: aguardam a API do backend.
- Do `backend-dados`:
  - C3/CAL: Natal e Réveillon por data.
  - O1: "core" vira "abdômen".
  - E6: `WARMUP_TEXT` em `src/domain/warmup.ts`.
  - A17: mensagem de conflito em `src/application/onboarding.ts`.
  - A14: depende de `daysReason` no `GeneratedPlan`. O texto aprovado pelo conteúdo já está pronto para entrar no resumo.

## Testes

- `npm run typecheck`: passou.
- **e2e afetados**: `assistente-inicio`, `entrega-a-inicio`, `base-ui`, `entrega-a-executar`, `publicacao`, `hoje-livre-atalhos`, `ondas-hevy`, `pendencias-hoje` e `entrega-a-treino`. Passaram 85 de 86.
  - A falha é `base-ui` "sino mostra ponto": o aviso de backup pendente não aparece logo depois de importar.
  - A causa é a mudança do lembrete para 7 dias de uso (ADR 011, 1.2, backend). É a mesma causa das falhas de `fase1` "importação v1/v2" da tarefa anterior.
- **Seletores ajustados por texto que mudou**:
  - `assistente-inicio`: "Calorias: de"; e `exact` em "Perder gordura", que agora também é parte de "Perder gordura e ganhar massa".
  - `entrega-a-executar`: "Última vez", "Total levantado".
  - `ondas-hevy`: "Última vez".
  - `entrega-a-inicio`: semana leve e "Treinar hoje sem começar o plano".
  - `publicacao`: "Usar o plano padrão".
  - `hoje-livre-atalhos`: o Perfil sem plano montado mostra "Montar meu plano".
- **`npx vitest run`**: 707 de 712 passaram. As 5 falhas vêm de mudanças em andamento no domínio, nos dados e no catálogo (ADR 012 e 011), e nenhuma toca arquivos desta tarefa:
  - `assistente-perfis` (2).
  - `ondasHevy` (instruções de 55 exercícios).
  - `entrega-a-dados`.
  - `repository`.
- **Navegador**: Playwright/Chromium em 390 × 844, claro e escuro, data real; capturas em `capturas/primeira-abertura/`.
  - Telas conferidas: boas-vindas, passo 1 sem o aviso fixo, atividades com dia ocupado, resumo, Início vazio (1 ação principal), primeira execução com as dicas, menu aberto, Início com plano e execução com nome longo.
  - Sem erro de console e sem rolagem horizontal.
