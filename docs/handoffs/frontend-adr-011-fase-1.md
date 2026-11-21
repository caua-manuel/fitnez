# Frontend: telas da Fase 1 do ADR 011, ADR 012 no assistente e descanso retomado

Data: 20/11/2026. Agente: `frontend`. Sem commit. Base:
- `dados-adr-011-fase-1.md`;
- `dados-seguranca-adr-011.md`;
- `seguranca-adr-011.md`;
- `ux-primeira-abertura.md`;
- `dados-adr-012.md`;
- `conteudo-adr-012-textos.md`;
- `dados-adr-011-fase-2.md`.

## 1.1 Demonstração

### Entrada, saída e abertura

- **Abertura** (`src/main.tsx`): `appMode()` decide o repositório antes de qualquer coisa.
  - Na demo, o repositório real nunca é criado.
  - No modo real, `deleteDemoDatabase()` roda a cada abertura, sem esperar.
  - Na demo, a abertura confere `state.meta.demo === true` (M1). Sem a assinatura, chama `clearDemoMark()` e `deleteDemoDatabase()` e recarrega no real.
  - O evento `storage` de `modeKey()` recarrega a aba.
- **`src/app/demo.tsx`** (novo):
  - `enterDemo` faz, nesta ordem: `import('../demo/generate')` (único `import()` da demo), `deleteDemoDatabase()`, `initialize()`, `save(demoState(...))`, `close()`, `setDemoMark()` e recarrega. Se falhar, a marca não é gravada.
  - `exitDemo` faz, nesta ordem: `clearDemoMark()`, `close()`, `deleteDemoDatabase()` e recarrega.
  - O arquivo também traz `DemoEntry`, `DemoBanner` e `ExitDemoSheet`.

### Faixa e pontos de entrada

- **Faixa** "Dados de exemplo / Sair da demonstração":
  - `role="region"` e `aria-label="Modo demonstração"`.
  - Fica presa no topo de todas as telas, inclusive a execução e o assistente.
  - Botão com 48 px e confirmação "Sair da demonstração?" ("Sair" / "Continuar vendo").
  - O Perfil tem também a linha "Sair da demonstração".
- **"Ver com dados de exemplo"** aparece nas boas-vindas do assistente (abaixo de "Só quer conhecer o app?") e no cartão "Monte seu plano" do Início vazio. Só aparece sem dados do usuário e no modo real. Tem os estados de carregando e de erro com os textos do UX.

### O que some na demo

- Backup e importação.
- Compartilhar plano.
- Apagar tudo (`ApagarDados` não renderiza e passa `mode: appMode()`).
- Pedido de persistência.
- Lembrete de backup.
- Instalar.
- Notificações.

No lugar de cada um aparece "Indisponível na demonstração…".

### ErrorBoundary

- Usa `dbName()` do modo ativo.
- Na demo, oferece só "Sair da demonstração" e "Tentar de novo" (A1).

### Chaves de sessão (B6)

Estas chaves passam a usar `storageKey`:
- `inicio-oferecido` (`App.tsx`);
- `treino-novo` (`Detalhe.tsx` e `NovoTreino.tsx`);
- `cursor` (`treino/util.ts`);
- `descanso`.

## 1.2 Lembrete de backup

`BackupReminder` (`src/ui/components.tsx`) foi refeito com os textos do UX:
- "Fazer backup agora" gera e baixa o arquivo, depois pergunta "Guardou o arquivo?".
- "Sim, guardei" chama `confirmBackup` e mostra o aviso "Backup confirmado.".
- "Ainda não" volta ao estado inicial.
- "Agora não" chama `snoozeBackup` e mostra "Lembramos de novo amanhã.".
- Todas as gravações passam por `run`, que relê o estado. A revisão nova é adotada.

Aparece no Início e no Perfil. Os botões são neutros: a ação azul da tela continua sendo a do treino.

O Perfil continua mostrando a persistência e as datas do último backup gerado e confirmado. A importação de backup já conferia o tamanho de 10 MB antes de `file.text()` (M2).

## 1.4 Primeiro treino concluído

Em `Concluido.tsx`:
- Com `shouldAskPersistence`, chama `protection({ requestPersistence: true })` e depois `markPrompt('persist')`, sem texto extra.
- Com `shouldOfferInstall`, mostra o cartão "Deixe o Fitnez na tela inicial", com "Instalar" (o `InstalarApp` existente) e "Agora não". `markPrompt('install')` é gravado ao mostrar.

O atalho fixo de instalar saiu do Início. O e2e `escala-instalar` foi ajustado para conferir isso.

## 1.3 Compartilhar plano

### Onde fica

- Rota `#perfil/compartilhar` (`router.ts`).
- Tela em `src/features/compartilhar/` (`import()`, 4 KB gzip), com a entrada no Perfil.
- O resumo de plano foi extraído para `src/features/assistente/PlanResumo.tsx`. Usam esse resumo o assistente e a revisão.

### Enviar

- O nome não vem pré-preenchido.
- "Incluir minha semana de treino" vem marcado.
- "Incluir observações dos exercícios" vem **desmarcado**. Marcado, mostra a prévia de todas as observações que vão sair (M3).
- Mostra as linhas "Vai" e "Não vai".
- Usa Web Share com arquivo quando `navigator.canShare({ files })`; senão baixa o arquivo.

### Importar

- `file.size > PLAN_SHARE_LIMITS.bytes` é conferido antes de `file.text()` (M2).
- Os erros vêm do domínio, em português.

### Revisar

- Mostra os treinos do arquivo e as contagens de exercícios iguais, novos e renomeados, além dos treinos renomeados.
- Mostra a semana do amigo e a caixa "Usar também a semana do amigo", desmarcada.
- Sem a semana do amigo, mostra a lista de `schedRemap`.
- Data de início: manter, próxima segunda ou outra data.
- Ações "Usar este plano" e "Cancelar".

### Depois de aplicar

- Aviso "Plano “…” aplicado." com Desfazer.
- No Perfil, "Voltar ao plano anterior" com "Desfaz o último plano aplicado (seu ou de um amigo)". Usa o mesmo critério de `canUndoPlanShare`, e a função vem por `import()` para ficar fora da carga inicial.

Limitação: o seletor de data é próprio, mais simples que o do assistente.

## ADR 012 no assistente

- **Passo 0:** "Estou grávida" e "Estou amamentando" passam a ser opções separadas.
- **Avisos:** entraram `amamentacao` e o novo texto de `condicao`, com os textos aprovados.
- **Tela de bloqueio** (`gestacao` / `menor14`):
  - Título "Ainda não dá para montar seu plano", com os textos aprovados.
  - "Voltar" leva ao passo 0 ou ao passo dos dados; também há "Explorar o app".
  - Não aparecem "Começar o plano" nem "Usar o plano padrão".
- **`requiresClearance`:** a caixa "Meu médico me liberou para fazer musculação." desliga "Começar o plano" até ser marcada. Passa `clearanceConfirmed` e não é gravada.
- **`daysReason`:** linha com os textos aprovados de `teto` e `atividades`.

## 2.1 Descanso

`Executar.tsx` usa `restoreRest` ao montar e no `visibilitychange`:
- `ativo`: segue contando.
- `terminado`: mostra o painel "Próxima série" sem vibrar de novo e limpa a chave.
- `nada`: limpa a chave.

## Verificação

- `npm run typecheck`: limpo.
- `npm run build`: verde.
  - Carga inicial: 203,5 KB de 205 KB de JS; 23,6 KB de 26 KB de CSS.
  - Total: 222,8 KB de 250 KB de JS.
  - Maior chunk sob demanda: 7,2 KB.
  - Demo isolada (1 `import()`, nada no `index.html`).
  - **A carga inicial está a cerca de 1,5 KB do limite.** O próximo item de tela precisa entrar por `import()` ou devolver margem; a recomendação do ADR é `exercise-guide.json` sob demanda.
- **Navegador:** Playwright/Chromium, 390 × 844, claro e escuro, data real. Capturas em `capturas/fase1/`.
  - Boas-vindas com a demo.
  - Início vazio.
  - Entrar na demo, ver Início, Perfil e Evolução, e sair. **O banco real ficou byte a byte idêntico** e o banco da demo foi apagado.
  - Marca de demo adulterada volta ao real e limpa a marca (M1).
  - Lembrete: gerar, perguntar e adiar.
  - Cartão de instalar no primeiro treino, com `meta.prompts` gravado (`persistAskedAt`, `installShownAt`, `backupSnoozedOn`).
  - Compartilhar: sem nome dá erro; a prévia das observações aparece; baixar, importar o próprio arquivo, revisar e aplicar.
  - Arquivo de 300 KB recusado antes de ser lido; arquivo inválido recusado.
  - Bloqueio por gestação; amamentação com a caixa de liberação e a linha de `daysReason`.
  - Descanso vencido mostrado como terminado depois de recarregar.
  - Sem erros de console e sem rolagem horizontal.
- **e2e (suíte completa):** 178 de 182 passaram. Três falhas vêm do lembrete por dias de uso (1.2, contrato novo do backend): `base-ui` "sino mostra ponto" e `fase1` "importação v1/v2", que esperam o aviso logo após importar. O `qa-testes` deve ajustá-las para o contrato de 7 dias de uso. A quarta (`fase1` "tema escolhido sobrevive ao reload quando a gravação é lenta") falhou uma vez com a suíte inteira e passou 3 de 3 rodando sozinha: instável sob carga. Ajustado por mudança legítima: `escala-instalar` (o atalho fixo saiu do Início).
