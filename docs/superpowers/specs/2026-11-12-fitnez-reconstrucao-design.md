# Fitnez — reconstrução do app (design)

Data: 12/11/2026. Origem: pedido do dono do app após rejeitar a Fase 1 ("ficou uma bosta") e fornecer 8 telas de direção visual (cópias devem ir para `docs/referencia-visual/`).

## 1. Intenção e porquê

A Fase 1 entregou só uma fundação: seis abas que exibem plano, dieta e histórico, sem nenhum registro. O dono quer um app de uso diário, na academia, com uma mão, que responda: **o que treino hoje, quanta carga uso, o que como e se estou evoluindo**. Refazem-se funcionalidades, sistema de design e experiência, seguindo a identidade **Fitnez — Treino + Dieta** das telas de referência.

Regras de conteúdo (treino, dieta, progressão, tipos de dia, revisão semanal) continuam as de `docs/ESPECIFICACAO.md` seções 3 e 4. Este documento substitui a especificação apenas em navegação, visual e fluxos.

## 2. Objetivos

- Registrar um treino de ponta a ponta: abrir, preencher carga/repetições, concluir séries, descanso com timer, concluir e salvar, em até 2 toques por série quando a carga repete a última.
- Dieta diária: escolher opção A/B/C por refeição, marcar consumido, ver calorias e macros contra a meta do tipo de dia, água, gerenciar opções.
- Evolução real, calculada dos registros: força (carga média), peso, medidas, constância.
- Perfil: tema claro/escuro/automático, lembretes, backup/restauração local, plano de 12 semanas.
- Visual fiel às telas: azul vivo, branco, cartões de raio grande, ícones de linha, barra inferior com cinco abas.
- Funcionar offline e instalável (PWA), dados no aparelho.

## 3. Não objetivos

- Contas, login, nuvem, sincronização entre aparelhos (adiável; ver D2).
- Fotos de progresso, lista de compras, exportação CSV (previstos na especificação, fora desta reconstrução).
- Notificações push reais (só o interruptor e lembretes dentro do app, enquanto não houver solução gratuita confiável).

## 4. Antiobjetivos (seria falha mesmo funcionando)

- Dados fictícios na tela: nenhum número, nome ou gráfico dos mockups ("João Silva", 1.850 kcal, +12%) pode aparecer sem vir dos dados reais. Sem registro, mostrar estado vazio honesto.
- Perder dados já migrados do protótipo ou do repositório v3. Importação continua transacional (ADR 002).
- Alterar números de treino/dieta sem revisão do agente `conteudo-treino-nutricao`.
- Interface que pareça documento: sem blocos de texto explicando "fase" ou "fundação".

## 5. Restrições

- Stack: React + TypeScript + Vite, CSS próprio, poucas dependências (justificar cada uma em ADR). Ícones: SVGs próprios, sem biblioteca.
- Sem servidor; GitHub Pages; caminho base `/Projeto-Treino/`. Português do Brasil em toda a interface.
- Regras de negócio em funções puras com testes. Acessibilidade WCAG AA, alvos de 44px, movimento reduzido.
- Não publicar, não fazer push. Cada entrega termina com parada e teste no celular (AGENTS.md).
- Trabalho feito pelos agentes reais (`arquiteto`, `frontend`, `backend-dados`, `ux-acessibilidade`, `qa-testes`, `seguranca-privacidade`, `conteudo-treino-nutricao`); o orquestrador revisa e integra.

## 6. Decisões do dono

- **D0.** Seguir a leitura das telas: cinco abas (Início, Treino, Dieta, Evolução, Perfil), conteúdo real do plano, três entregas com parada.
- **D1.** Mockups são ilustração; vale o plano real (Upper A/B, Lower, jiu-jitsu, vôlei, descanso).
- **D2.** Sem banco de dados externo agora; o dono aceita rever se for preciso.

## 7. Decisões tomadas pelo orquestrador (podem ser vetadas)

- **D2 (banco).** IndexedDB basta para uma pessoa em um aparelho. Banco remoto só se o dono pedir uso em dois aparelhos; o caminho é um adaptador Supabase atrás da interface `Repository` existente, com login e regras por usuário. Registrar como ADR 004 pelo `arquiteto`.
- **D3 (abas).** "Agenda" deixa de ser aba. As 12 semanas e a rotina ficam em Treino ("Meu plano") e em Perfil ("Semana N de 12"). "Mais" some; seu conteúdo vai para Perfil.
- **D4 (Início).** Cartão "Treino de hoje" muda por tipo de dia: academia (Começar treino), jiu-jitsu (marcar aula, como terminou 1–5), vôlei (marcar jogo ou Lower B), descanso (checklist do condomínio). Registrar = abrir outro dia para lançar o que foi esquecido. O botão Salvar do mockup some, pois o salvamento é automático e visível.
- **D5 (Treino).** Segmentos "Meu plano" e "Biblioteca" (todos os treinos, busca, filtros, criar/editar/duplicar/excluir com desfazer). Execução em tela cheia com timer de descanso configurável por exercício. Conclusão mostra duração, exercícios, séries e volume.
- **D6 (Dieta).** Cinco refeições reais (café, almoço, pré/lanche, pós, jantar), cada uma com A/B/C. O anel usa a meta do tipo de dia (2.100 a 2.600 kcal), não um valor fixo. Tela de refeição com "Escolher opção" e "Gerenciar opções". Água em copos de 500 ml; creatina como checklist.
- **D7 (Evolução).** Filtro de período (4, 8, 12 semanas). Indicadores: força (variação da carga média nos principais), peso, cintura, constância (treinos feitos ÷ previstos). Gráficos próprios em SVG.
- **D8 (Perfil).** Nome editável (padrão vazio), objetivo, plano, tema, lembretes, "Dados neste aparelho" (persistência, instalação) e "Backup e restauração" com baixar, copiar e importar com prévia (comportamento da Fase 1 preservado).
- **D9 (Marca).** Logo Fitnez recriado em SVG (halter azul com folha verde); primário azul vivo próximo de `#0F5FFF`, tokens finais definidos pelo `ux-acessibilidade` com contraste AA. `DESIGN.md` é reescrito.
- **D10 (Dados).** Estado v3 e migração permanecem. Acréscimos: grupo muscular por exercício, duração real de cada treino, opções de dieta editáveis, medidas ampliadas. Ajuste do plano: os acréscimos entram como campos opcionais dentro do v3 (sem número de versão novo e sem migração), pois o contrato já admite campos extras; teste de ida e volta pelo backup garante que nada se perde.

## 8. Entregas (parada ao fim de cada uma)

1. **A — base e treino.** Design system, marca, navegação de cinco abas, Início, Treino (plano, detalhes, execução, concluído, biblioteca, editar exercício), estado v4 e migração, regras puras (calendário, semana, RIR, deload, sugestão de carga). Testes de unidade e ponta a ponta.
2. **B — dieta.** Dieta, refeição, escolher/gerenciar opções, água, creatina, tipo de dia, revisão semanal como sugestão.
3. **C — evolução e perfil.** Evolução com gráficos, medidas, constância, indicador da 3ª aula de jiu-jitsu, Perfil completo, backup/lembrete semanal, PWA e polimento.

Cada entrega termina com: resumo de até cinco linhas, passo a passo para testar no celular e o que mudou nos dados.

## 8.1 Esclarecimentos (resultado da revisão do documento)

- **Telas de referência:** estão em `docs/referencia-visual/tela-1.png` a `tela-8.png` (1 Evolução, 2 Perfil, 3 Dieta, 4 Meus Treinos, 5 mapa de 10 telas do fluxo, 6 Treino detalhe, 7 Início, 8 Dieta: refeição, escolher e gerenciar opções). A tela 5 é o mapa do fluxo; as demais mostram o visual final.
- **Estado de dados:** o código em `src/` já roda o estado v3 (contrato em `docs/CONTRATOS-FASE-1.md`). A seção 5 da `ESPECIFICACAO.md` descreve o v2 do protótipo, que é só a origem da migração. O v4 é o v3 mais os acréscimos de D10; o `backend-dados` primeiro verifica se a interface `Repository` comporta os acréscimos e começa a Entrega A pela camada de dados.
- **Grupo muscular e descanso por exercício (minha decisão):** a lista de grupos e os descansos vêm da especificação (seção 8, item 1, e o campo `rest` já presente em `data/plan.json`). O `conteudo-treino-nutricao` revisa o mapeamento antes de a Entrega A terminar; nenhum número de série ou repetição muda.
- **Sugestão de carga (minha decisão):** é a dupla progressão da seção 3 da `ESPECIFICACAO.md`, completa com RIR, deload e alerta de estagnação por 3 treinos. Vira função pura testada. É sugestão, nunca altera carga sozinha.
- **Dia incompleto (minha decisão):** treino interrompido fica salvo como parcial e pode ser retomado no mesmo dia. Só conta como "feito" na constância quando o usuário conclui. Jiu-jitsu mais academia no mesmo dia: cada atividade tem registro próprio e as duas contam. Trocar o treino do dia usa o seletor "Trocar treino de hoje".
- **Lembretes (minha decisão):** sem push, aparecem como aviso dentro do app na próxima abertura. O interruptor do Perfil diz isso em texto claro, para não prometer notificação com o app fechado.
- **Opções de dieta editáveis (minha decisão):** a edição vale para todos os dias (muda a opção A/B/C da refeição); o dia escolhe qual opção comeu. Kcal e macros da opção editada alimentam o anel. Editar uma opção não altera dias já registrados: o registro guarda uma cópia dos valores consumidos.
- **Testes e navegador (minha decisão):** Vitest para regras e dados, Playwright em Chromium com viewport de celular (360×800) para os fluxos, como já existe no projeto. Safari iOS fica como teste manual no celular.

## 8.2 Decisões do dono após a revisão (12/11/2026)

- **Notificações push:** o dono quer a opção de ativar. Limite técnico: push real com o app fechado exige um servidor que envie a mensagem; hospedagem estática sozinha não faz isso. Plano: Entrega A entrega o interruptor com pedido de permissão e notificações locais pelo service worker (fim do descanso, lembretes ao abrir o app). Push agendado com o app fechado entra na Entrega C somente se o dono aprovar um serviço de envio (ADR 004, mesma decisão do banco remoto). No iPhone, notificações só funcionam com o app instalado na tela inicial; o Perfil explica isso.
- **Tempo de descanso:** campo editável por exercício, tanto ao criar quanto ao editar um treino (padrão vindo de `data/plan.json`), e ajustável durante a execução (−15 s, +15 s, pular).
- **Cópia do consumido na dieta:** confirmada; o registro guarda os valores consumidos (JSON compacto se necessário para economizar espaço).
- **Sugestão de carga:** confirmada como somente sugestão de carga e repetições para o próximo treino; nunca preenche nem altera sozinha.

## 9. Deixado ao construtor

Estrutura de pastas, bibliotecas de teste, formato exato dos tokens, layout em desktop (foco é celular), nomes de tipos, esquema interno do v4 respeitando D10, animações (conforme `emil-design-eng` e movimento reduzido).

## 10. Riscos

- Mockups e plano real divergem em refeições e metas; vale sempre o plano real.
- A é a maior entrega; se estourar, dividir em A1 (base, Início, Treino) e A2 (biblioteca e edição).
- Safari iOS limpa dados de site sem uso; lembrete de backup e pedido de armazenamento persistente permanecem.
