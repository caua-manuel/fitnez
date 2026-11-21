# Dados: ADR 012 no assistente de início

Data: 20/11/2026. Responsável: `backend-dados`. Base: ADR 012, `conteudo-revisao-10-perfis.md` (seções 2 a 5) e `ux-primeira-abertura.md` (C3, O1, A14).
Sem versão nova do estado: nada do que é gravado mudou (`settings.onboarding` continua igual; marcações do passo 0 e a liberação médica nunca são gravadas). Backups antigos importam como antes.

## O que mudou
- `src/domain/onboarding.ts`: todas as regras da seção 2 do conteúdo (gestação bloqueia; condição de saúde e amamentação com plano leve, `RIR_CONSERVADOR` e liberação; 60+ com trocas estáveis e `idade60`; troca de pernas procurando também os treinos anteriores; pernas em dias seguidos vão para um dia livre; `nunca` + longo vira medio com `duracao-reduzida`; "por perna/por lado" na observação; 90 s nos principais sem carga e remada com mochila com a faixa do catálogo; `daysReason`). Subtítulos: "core" virou "abdômen".
- P1 a P3 adotadas pelo orquestrador (aguardam o dono, registradas no ADR 012, Decisão C): idade informada abaixo de 14 anos não gera plano; `amamentacao` é marcação própria tratada como condição de saúde; transtorno alimentar com no máximo 4 treinos e sem duração longa (sem aviso próprio).
- `src/application/onboarding.ts`: `applyOnboardingToState` / `applyOnboarding` recusam prévia bloqueada e, com `requiresClearance`, exigem `clearanceConfirmed: true` (opção nova, não gravada).
- `src/domain/calendar.ts`: Natal e Réveillon pela data real (semana de segunda a domingo que contém 25/12 ou 31/12), via `weekNoteOf(segunda, semana)`. `WEEK_NOTES` ficou só com a semana 12; `Phase.note` e `phaseOf` mantêm a interface (Início, Treino, Detalhe, Perfil, Evolução não mudam). Natal e semana 12 juntos: as duas notas, separadas por espaço.
- `data/plan.json`: `ponte` e `sentar_levantar` com o JSON do conteúdo; observação nova de `afundo_livre`. Catálogo com 57 exercícios.
- `data/exercise-guide.json`: entradas de `ponte` e `sentar_levantar` (o teste exige instrução para todo exercício do assistente). Passos = observação aprovada do catálogo; erro comum reaproveitado do mesmo movimento (`ponte_h`: "subir arqueando a lombar."; `agach_livre`: "tirar os calcanhares do chão."). **O conteúdo deve revisar esses dois textos.**

## O que a tela precisa (campos novos da prévia)
- `preview.blocked: 'gestacao' | 'menor14' | null`. Com valor: `generated` é `null`, `usedDayTypes` é `[]`, resumo zerado, dieta `none/seguranca`. Mostrar a tela de bloqueio (texto `gestacao` da seção 4 do conteúdo; o texto de `menor14` ainda não existe, pedir ao conteúdo), botões `Voltar` e `Explorar o app`, sem "Começar o plano".
- `preview.generated: GeneratedPlan | null` (**mudança de tipo**: hoje `Assistente.tsx` linhas 276 e 282 usam `g` sem checar, e o `npm run typecheck` acusa esses 3 pontos até o `frontend` tratar o bloqueio).
- `preview.requiresClearance: boolean` (condição de saúde ou amamentação). Caixa `Meu médico me liberou para fazer musculação.`; "Começar o plano" desligado até marcar; passar `clearanceConfirmed: true` para `applyOnboarding`. Não gravar a marcação.
- `preview.summary.daysRequested` e `preview.summary.daysReason: 'teto' | 'atividades' | null` (também em `generated.daysReason`). Mostrar a linha só com `daysReason !== null`, com os textos da seção 5 do conteúdo (`{pedido}` = `daysRequested`, `{n}` = `gymDays`).
- Avisos novos: `idade60`, `duracao-reduzida` e `amamentacao`, já na ordem de exibição (`WARNING_ORDER`). Falta o texto do aviso `amamentacao` (pedir ao conteúdo).
- Passo 0: a marcação `amamentacao` já é aceita pela validação; a opção separada ("Estou amamentando") fica com o `frontend`. Até lá, "grávida ou amamentando" continua marcando `gestacao` e bloqueia (o lado seguro).

## Testes
- `tests/unit/onboarding-adr012.test.ts` (novo, 21 testes), `tests/unit/onboarding.test.ts` (exemplos 2, 8, 14, (d) e a troca de pernas com luta na quarta, que agora põe Pernas B no sábado), `tests/unit/assistente-perfis.test.ts` (sanidade de 1,4 a 2,2 g/kg do peso de referência e as saídas da seção 3 para os 10 perfis), `tests/unit/calendar.test.ts` (festas pela data), `tests/integration/onboarding.test.ts` (bloqueio sem gravar e liberação obrigatória). Contagem do catálogo ajustada para 57 em `entrega-a-dados`, `repository` e `ondasHevy`.
- `docs/revisao/assistente-10-perfis.md` gerado de novo com `GERAR_TABELA_PERFIS=1`: os 10 perfis passam na sanidade e batem a seção 3.
- `npx vitest run`: 48 arquivos, 750 testes, todos verdes. `npm run typecheck`: só os erros de fora do meu escopo (os 3 de `Assistente.tsx` acima e `App.tsx` importando `features/compartilhar/Compartilhar`, que ainda não existe).

## Pendências
- (Resolvido na segunda rodada) textos de `menor14`, `amamentacao` e das 2 instruções do guia.
- (Resolvido na segunda rodada) grupos de troca de `ponte` e `sentar_levantar`.

## Segunda rodada: textos e trocas (`conteudo-adr-012-textos.md`)
- Item 3: `data/exercise-guide.json` com os textos finais de `ponte` e `sentar_levantar` (substituem os provisórios).
- Item 4: `src/domain/swap.ts`: `ponte` antes de `ponte_uni` no padrão `quadril` e `sentar_levantar` por último no `bilateral`, nos três locais. Testes em `tests/unit/swap-adr012.test.ts` (ordem das opções nos dois sentidos, filtro do treino do dia e textos do guia).
- Itens 1 e 2: nada a expor no domínio. A marcação `amamentacao`, `planBlockedReason` = `'menor14'` e `requiresClearance` já existem; os rótulos do passo 0, os textos dos avisos e a tela de bloqueio ficam em `Assistente.tsx` (`frontend`).
- `npx vitest run`: 50 arquivos, 770 testes verdes. `npm run typecheck`: só o erro de `App.tsx` (`features/compartilhar/Compartilhar` ainda não existe); os de `Assistente.tsx` já sumiram.
