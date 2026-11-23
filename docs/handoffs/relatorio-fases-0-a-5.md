# Relatório: o que mudou nas Fases 0 a 5

Data: 21/11/2026. Base: `8fe685e` (último commit antes da Fase 0). Nenhum código foi alterado para gerar este relatório.

## 1. Commits

| Commit | Data | Resumo |
| --- | --- | --- |
| `0a55e13` | 20/11 14:23 | Fase 0: escala do jiu-jitsu com fonte única, orçamento do ADR 006, documentação de entrada, ADR 011 |
| `768e294` | 21/11 17:18 | Fases 1 a 4: demo, proteção de dados, compartilhar plano, ferramentas da academia, polimento, portfólio (ADRs 011 e 012) |

Os dois commits existem só no seu computador: a `main` está 2 commits à frente do GitHub e não houve push. No total, 190 arquivos mudaram (+9.814 / −471 linhas).

## 2. Itens por fase

Em todas as linhas, "Treino" e "Perfil" são as abas do app.

### Fase 0

| Item | Status | Arquivos principais | Como testar no celular |
| --- | --- | --- | --- |
| 0.1 Escala do jiu-jitsu | feito | `src/domain/jiujitsu.ts` (`FEEL_SCALE`), teste de contrato | Registre uma aula de jiu-jitsu e confira que 1 = leve e 5 = destruído. |
| 0.2 Limite de CSS | feito | ADR 006 revisado, ADR 011, `scripts/build-budget.ts` | Nada a testar no celular (é regra de build). |
| 0.3 Licenças das skills | feito, nada apagado | `docs/handoffs/devops-licencas-skills.md` | Nada a testar no celular; leia a tabela do handoff. |
| 0.4 Documentação de entrada | feito | `README.md`, `INICIO.md` | Nada a testar no celular. |
| 0.5 O que falta para publicar | feito | `docs/PUBLICACAO.md` | Nada a testar no celular. Atenção: o app já está no ar desde 17/11. |

### Fase 1

| Item | Status | Arquivos principais | Como testar no celular |
| --- | --- | --- | --- |
| 1.1 Modo demonstração | feito | `src/app/mode.ts`, `src/app/demo.tsx`, `src/data/demo.ts`, `src/demo/generate.ts` | Numa aba anônima, toque em "Ver com dados de exemplo", navegue e depois toque em "Sair da demonstração". |
| 1.2 Proteção contra perda | feito | `src/domain/userData.ts`, `src/data/recoveryPrune.ts`, Perfil | No Perfil, veja se o armazenamento persistente foi concedido e a data do último backup. |
| 1.3 Compartilhar plano | feito | `src/domain/planShare.ts`, `src/application/planShare.ts`, `src/features/compartilhar/` | Perfil → exportar plano; abra o arquivo noutro aparelho, revise e aplique. |
| 1.4 Primeira abertura | feito | assistente, `docs/handoffs/ux-primeira-abertura.md` | Responda o assistente como se nunca tivesse visto o app e veja se RIR e deload ficam claros. |
| 1.5 Guia de instalar | feito | `src/domain/userData.ts` (`shouldOfferInstall`) | O guia aparece depois do primeiro treino concluído. |
| 1.6 Revisão dos 10 perfis | feito | `docs/revisao/assistente-10-perfis.md`, `docs/handoffs/conteudo-revisao-10-perfis.md`, ADR 012 | Responda o assistente como gestante ou como alguém de 67 anos e confira as regras conservadoras. |

### Fase 2

| Item | Status | Arquivos principais | Como testar no celular |
| --- | --- | --- | --- |
| 2.1 Tela acesa, vibração, descanso | feito | `src/pwa/wakeLock.ts`, `src/pwa/haptics.ts`, `restoreRest` | Marque uma série, saia do app por 30 s e volte: o tempo deve estar certo. |
| 2.2 Teclado e alvos de 48 px | feito | `Executar.tsx` | Toque na carga: deve abrir o teclado numérico. |
| 2.3 Histórico rápido | feito | `src/features/treino/HistoricoRapido.tsx` | Na execução, toque no nome do exercício. |
| 2.4 Calculadora de anilhas | feito | `src/features/treino/Anilhas.tsx` | Na série, abra as anilhas e use a carga. |
| 2.5 Resumo da semana em imagem | feito | `src/domain/weekSummary.ts`, `src/features/resumo/` | Evolução → Resumo da semana → compartilhar no WhatsApp. |
| 2.6 Aviso de estagnação | feito | `src/domain/stagnation.ts`, `Estagnacao.tsx` | Na demo, procure o aviso num exercício parado. |

### Fase 3

| Item | Status | Arquivos principais | Como testar no celular |
| --- | --- | --- | --- |
| 3.1 Lista priorizada | feito; só as 10 de alto impacto foram corrigidas | `docs/handoffs/ux-auditoria-fase-3.md` | Leia a lista; os itens médios e baixos continuam abertos. |
| 3.2 Uso com uma mão | feito | `Executar.tsx` | Durante o treino, alcance o ✓ e o descanso só com o polegar. |
| 3.3 Microinterações | feito | `Executar.tsx`, `src/ui/` | Bata um recorde: deve aparecer uma celebração discreta. |
| 3.4 Contraste no tema escuro | feito | tokens e CSS | Use o tema escuro sob luz forte. |
| 3.5 Leitor de tela e foco | feito | `announce.ts`, `Executar.tsx` | Faça um treino com o VoiceOver ou o TalkBack ligado. |
| 3.6 Capturas antes e depois | feito | `docs/antes-depois/` (14 PNG em cada pasta) | Nada a testar no celular; abra as imagens no computador. |

### Fase 4

| Item | Status | Arquivos principais | Como testar no celular |
| --- | --- | --- | --- |
| 4.1 README de vitrine | feito | `README.md` | Nada a testar no celular. |
| 4.2 Como foi feito | feito | `README.md` | Nada a testar no celular. |
| 4.3 Roteiro de GIFs | feito; os 5 GIFs saíram automáticos | `docs/ROTEIRO-GIFS.md`, `docs/gifs/` | Nada a testar no celular. |
| 4.4 Estudo de caso | feito | `docs/ESTUDO-DE-CASO.md` | Nada a testar no celular. |
| 4.5 Lighthouse | feito | README, estudo de caso | Nada a testar no celular. A categoria PWA não existe mais no Lighthouse atual. |

### Fase 5

| Item | Status | Arquivos principais | Como testar no celular |
| --- | --- | --- | --- |
| 5.1 Guias de estudo | feito | `docs/estudo/` (3 guias e um índice) | Nada a testar no celular. |
| 5.2 Perguntas de entrevista | não feito | depende de você | Diga "estudo" para começar. |
| 5.3 Exercícios | parcial: propostos nos guias, nenhum revisado | `docs/estudo/` | O exercício 3 é um bug real da fila de gravações. |

## 3. O que você aprovou e o que não aprovou

- **Aprovado explicitamente:** só a frase "faz todas, trabalhe pelas próximas 3 horas". Com ela, executei todas as fases sem parar entre uma e outra.
- **Feito sem a sua aprovação item a item** (o plano exigia essa aprovação):
  - a escolha dos itens da Fase 2;
  - as 10 correções da Fase 3;
  - as decisões provisórias: idade mínima de 14 anos; amamentação separada da gestação; até 4 treinos por semana em caso de transtorno alimentar; observações desmarcadas ao compartilhar o plano; dieta incluída por padrão no cartão da semana; decisões 1 a 3 do ADR 011;
  - os GIFs automáticos.

## 4. Dependências, ADRs e números

- **Dependências novas:** nenhuma. O único ajuste no `package.json` foi o teste do orçamento entrar no script `test:config`.
- **ADRs:** 011 e 012 são novos. O 006 foi revisado para o orçamento em duas medidas (carga inicial e total).
- **Números de treino e dieta:**
  - O plano padrão (o seu) não mudou.
  - Mudaram as regras do assistente para terceiros: gestação, condições de saúde, 60 anos ou mais, descanso sem carga, duração do treino de quem nunca treinou e escolha dos dias. A justificativa está em `docs/handoffs/conteudo-revisao-10-perfis.md` e no ADR 012.
  - Os números novos da demo, do resumo da semana e da estagnação estão justificados em `docs/handoffs/conteudo-adr-011.md`.
  - Os textos de amamentação estão em `docs/handoffs/conteudo-adr-012-textos.md`.

## 5. Antes e depois

| Medida | Antes (`8fe685e`) | Depois (`768e294`) |
| --- | --- | --- |
| Testes de unidade e integração | 536 | 782 |
| Testes de ponta a ponta | cerca de 177 | 201 |
| JS gzip, carga inicial | 192,8 KB | 187,0 KB (limite 205) |
| JS gzip, total | 199,1 KB | 240,8 KB (limite 250) |
| CSS gzip, carga inicial | 22,7 KB | 22,5 KB (limite 26) |
| Lighthouse no celular (acessibilidade, boas práticas, SEO) | não medido | 100, 100, 100; LCP 1,7 s; CLS 0 |

## 6. Pendente ou quebrado

- O trabalho parou na Fase 5: faltam as perguntas (5.2) e a revisão dos exercícios (5.3).
- **Quebrado (auditoria de 21/11):**
  - A carga e as repetições digitadas se perdem se você sair da tela antes de marcar a série (`Executar.tsx:294`).
  - Uma gravação recusada trava a fila de gravações até você recarregar o app (`commitQueue.ts:29` e `:44`).
- **Pendente:**
  - Prévia do link ao compartilhar (tags Open Graph).
  - Os itens médios e baixos da auditoria de UX.
  - A pílula "Meta de exemplo" na tela de Dieta.
  - A sua autorização para o push.
