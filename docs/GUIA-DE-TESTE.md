# Guia de teste do Fitnez

Estado de 22/11/2026, commit `768e294`. A base de comparação é `8fe685e`, o último commit antes da Fase 0. As etiquetas foram conferidas no `git diff` entre os dois commits, e não só nos handoffs.

**Etiquetas:**
- **[NOVO]**: não existia na base.
- **[MELHOROU]**: existia e mudou.
- **[IGUAL]**: não mudou.
- **[CORRIGIDO]**: era um bug.

**Onde anotar problemas:** no fim deste arquivo há uma seção "Anotações". Para cada problema, escreva o número do passo (ex.: `c7`), o que aconteceu, o tema (claro ou escuro) e o celular. Se puder, tire um print.

---

## 1. Inventário

### Início

| Funcionalidade | O que faz | Etiqueta |
| --- | --- | --- |
| Treino de hoje | Mostra o treino do dia com o botão "Começar treino" ou "Continuar treino". | [MELHOROU] o botão agora leva direto à execução. |
| Faixa da semana | Mostra os 7 dias com o tipo de cada um (academia, jiu-jitsu, vôlei, descanso). | [IGUAL] |
| Semana leve | Avisa quando é a semana de deload: menos séries e sem subir carga. | [MELHOROU] o texto explica o que muda. |
| Avisos do calendário | Mostra avisos de semanas especiais (testes, Natal, Réveillon). | [MELHOROU] avisos novos. |
| Registrar jiu-jitsu | Registra a aula com "Como terminou" de 1 (leve) a 5 (destruído). | [CORRIGIDO] a escala estava invertida entre a tela e a regra. |
| Terceira aula de jiu-jitsu | Diz se você está liberado para uma 3ª aula na semana. | [CORRIGIDO] usava a escala invertida. |
| Observação da aula | Guarda uma nota curta sobre a aula. | [IGUAL] |
| Vôlei | Registra o dia de vôlei. | [IGUAL] |
| Fazer outro treino | Permite escolher outro treino no lugar do previsto. | [IGUAL] |
| Resumo da dieta | Mostra calorias e proteína do dia. | [IGUAL] |
| Antes de começar o plano | Antes da data de início, oferece "Treinar hoje sem começar o plano". | [NOVO] |
| Lembrete de backup | Mostra uma linha discreta "Backup pendente". | [MELHOROU] era um bloco grande; agora conta por dias de uso. |

### Treino

| Funcionalidade | O que faz | Etiqueta |
| --- | --- | --- |
| Lista e rotina da semana | Mostra os treinos do plano e em que dia cai cada um. | [IGUAL] |
| Detalhe do treino | Mostra os exercícios, a meta, a sugestão de carga e o histórico. | [MELHOROU] semana escrita "05", aba ativa mais visível, sugestão sem azul. |
| Execução: sugestão em cinza | A carga e as repetições sugeridas aparecem em cinza. | [MELHOROU] a sugestão fica mais fina e o valor digitado mais grosso. |
| Marcar ✓ sem digitar | Grava a sugestão do jeito que está. | [CORRIGIDO] gravava "30.5" com ponto; agora grava "30,5". |
| Desfazer | Desfaz a série marcada por 6 segundos. | [IGUAL] |
| Descanso | O cronômetro inicia sozinho, com +15 s, −15 s e Pular. | [MELHOROU] continua certo se você sair do app e o celular vibra no fim. |
| Tela acesa | A tela não apaga durante o treino. | [NOVO] |
| Série ativa | Destaca a próxima série e rola a tela até ela. | [NOVO] |
| "Próximo: exercício" | Com o exercício completo, aparece um botão embaixo para ir ao próximo. | [NOVO] |
| Série extra e aquecimento | Adiciona uma série a mais ou séries de aquecimento. | [IGUAL] |
| Trocar exercício "só hoje" | Troca o exercício só nesta sessão. | [IGUAL] |
| Histórico rápido | Tocar no nome do exercício mostra as últimas 5 sessões. | [NOVO] |
| Calculadora de anilhas | Mostra quantas anilhas pôr em cada lado da barra e permite usar a carga. | [NOVO] dentro da série; a regra já existia. |
| Dicas do exercício | Mostra "Como fazer" e o aquecimento num bloco recolhível. | [MELHOROU] era um texto sempre aberto. |
| Aviso de estagnação | Quando um exercício para de evoluir, sugere deload, troca ou nova faixa de repetições. | [NOVO] |
| Recorde | Celebra de forma discreta quando você bate uma marca. | [MELHOROU] tem animação e anúncio no leitor de tela. |
| Cronômetro geral | Mostra o tempo total do treino. | [MELHOROU] ficou menor, porque é o dado menos útil. |
| Treino concluído | Mostra o resumo, o total levantado e os recordes. | [MELHOROU] mostra o convite para instalar no 1º treino. |
| Treino livre | Monta um treino na hora, sem plano. | [IGUAL] |
| Editar treino e exercício | Altera nome, séries, repetições e descanso, com desfazer. | [IGUAL] (agora carrega sob demanda). |
| Novo treino e biblioteca | Cria um treino e adiciona exercícios prontos. | [IGUAL] (agora carrega sob demanda). |
| Restaurar treinos originais | Volta o plano ao padrão. | [IGUAL] |

### Dieta

| Funcionalidade | O que faz | Etiqueta |
| --- | --- | --- |
| Anel de calorias e macros | Mostra o quanto você comeu de calorias, proteína, carboidrato e gordura. | [MELHOROU] saíram 3 cartões repetidos e as refeições subiram na tela. |
| Refeições com opções | Escolha uma opção, marque "comi" ou pule a refeição. | [IGUAL] |
| Receita e detalhes | "Sobre esta refeição" mostra os ingredientes. | [IGUAL] |
| Água | Copos de 500 ml que você toca para registrar. | [IGUAL] |
| Creatina | Uma caixa "Creatina tomada" para marcar. | [IGUAL] |
| Navegar entre dias | Setas para ir ao dia anterior ou ao próximo. | [IGUAL] |
| Metas por tipo de dia | Calorias diferentes para descanso, academia, pernas, jiu-jitsu e vôlei. | [IGUAL] |
| Editar metas e restaurar exemplo | Altera as metas e volta às de exemplo com desfazer. | [IGUAL] (agora carrega sob demanda). |
| Gerenciar opções | Cria e edita as opções de cada refeição. | [IGUAL] |
| Revisão semanal | Mostra a orientação da semana. | [IGUAL] |

### Evolução

| Funcionalidade | O que faz | Etiqueta |
| --- | --- | --- |
| Gráficos de força, peso e cintura | Mostram a evolução por semana. | [IGUAL] |
| Constância | Mostra quantos treinos você fez por semana. | [IGUAL] |
| Séries por grupo muscular | Mostra o volume da semana por músculo. | [IGUAL] |
| Registrar medidas | Peso, cintura e outras medidas. | [IGUAL] |
| Resumo da semana | Mostra treinos, volume, recordes e dieta, e vira imagem para mandar no WhatsApp. | [NOVO] |

### Perfil

| Funcionalidade | O que faz | Etiqueta |
| --- | --- | --- |
| Nome, dados físicos e preferências | Edita o perfil e escolhe o tema (claro, escuro ou do sistema). | [IGUAL] |
| Backup: baixar e importar | Salva tudo num arquivo e restaura com prévia antes. | [MELHOROU] mostra a data do último backup e lembra por dias de uso. |
| Armazenamento persistente | Pede ao navegador para não apagar os dados e mostra o resultado. | [NOVO] |
| Exportar CSV | Gera planilhas dos treinos e das medidas. | [IGUAL] |
| Compartilhar plano | Exporta só o plano num arquivo; o amigo importa, revisa e aplica. | [NOVO] |
| Desfazer importação | "Voltar ao plano anterior?" depois de aplicar um plano. | [NOVO] |
| Instalar na tela inicial | Mostra o passo a passo para iPhone e Android. | [MELHOROU] o convite aparece no momento certo. |
| Data de início | Muda quando o plano começa. | [IGUAL] |
| Apagar dados | Apaga tudo, numa "Zona de risco" com confirmação. | [MELHOROU] também limpa a demonstração. |

### Assistente

| Funcionalidade | O que faz | Etiqueta |
| --- | --- | --- |
| 9 perguntas | Monta os treinos, a rotina e as metas de dieta. | [MELHOROU] textos mais curtos e RIR e deload explicados em uma linha. |
| Revisão do plano | Mostra o plano antes de aplicar, com "Alterar" em cada parte. | [MELHOROU] tela de resumo nova. |
| Regras de segurança | Bloqueiam o plano para gestação e menores de 14 anos e deixam o plano leve em outros casos de risco. | [NOVO] regras revisadas com 10 perfis. |
| Ver com dados de exemplo | Abre 4 semanas de dados fictícios, separados dos seus. | [NOVO] |
| Sair da demonstração | Apaga só a demo e volta ao app vazio. | [NOVO] |
| Usar o plano padrão | Pula o assistente e usa o plano do dono do app. | [IGUAL] |

### Geral

| Funcionalidade | O que faz | Etiqueta |
| --- | --- | --- |
| Funciona sem internet | Depois da 1ª abertura, o app abre em modo avião. | [IGUAL] |
| Dados só no aparelho | Não há conta nem servidor; os dados ficam no navegador. | [IGUAL] |
| Tema claro e escuro | Segue o sistema ou a sua escolha. | [MELHOROU] o contraste foi revisado. |
| Leitor de tela | Anuncia cada série, o descanso e a troca de exercício. | [MELHOROU] antes falava "Salvando" a cada toque. |
| Botões grandes | Botões de no mínimo 48 px e teclado numérico nos campos. | [MELHOROU] conferido também em tela pequena. |
| Movimento reduzido | Desliga as animações se o celular pedir. | [IGUAL] |
| Tela de erro | Se algo quebrar, mostra o que fazer, sem perder os dados. | [MELHOROU] reconhece a demonstração. |
| Peso do app | A carga inicial é de 187 KB e o build falha se passar do limite. | [MELHOROU] limite em duas medidas. |

---

## 2. As 10 mudanças mais importantes

Em ordem de impacto para quem usa:

1. **Regras de segurança do assistente.** Um amigo grávido, menor de idade ou com problema de saúde não recebe mais um treino comum de iniciante.
2. **Escala do jiu-jitsu corrigida.** Antes, a liberação da 3ª aula entendia "destruído" como "ótimo".
3. **Descanso certo depois de sair do app, com vibração e tela acesa.** É o que mais se usa entre uma série e outra.
4. **Modo demonstração.** Um amigo entende o app em 30 segundos sem preencher nada e sem arriscar os seus dados.
5. **Proteção contra perda de dados.** Lembrete de backup por dias de uso, data do último backup e pedido de armazenamento persistente. Os dados só existem no celular.
6. **Compartilhar o plano com amigos.** Passa o plano sem mandar dados pessoais e com revisão antes de aplicar.
7. **Execução mais fácil com uma mão.** Série ativa destacada, rolagem automática e "Próximo exercício" embaixo.
8. **Histórico rápido e anilhas dentro da série.** Você não sai do treino para lembrar a carga ou montar a barra.
9. **Aviso de estagnação com uma ação concreta.** Diz o que fazer quando você trava, em vez de só avisar.
10. **Resumo da semana em imagem.** Mostra o progresso e dá motivo para mandar para os amigos.

---

## 3. Pontos fortes

### Para quem usa

- **Registrar uma série leva um toque.** A sugestão vem pronta e tocar no ✓ a grava. Evidência: `src/domain/setPlaceholder.ts` e o e2e da execução.
- **Funciona sem internet e sem conta.** Evidência: o service worker gerado no build e o e2e offline. Nenhuma chamada de rede além do próprio site (a política de segurança tem `connect-src 'self'`, em `vite.config.ts:17`).
- **O assistente é cuidadoso com quem não é você.** Evidência: a revisão de 10 perfis em `docs/revisao/assistente-10-perfis.md`, o ADR 012 e os testes de `src/domain/onboarding.ts`.

### Técnicos (para o portfólio)

- **As regras do app são testadas sem tela.** Progressão, deload, dieta, estagnação e assistente ficam em `src/domain/`, com a data como parâmetro. Evidência: 782 testes de unidade e integração.
- **Restaurar um backup ou aplicar um plano é tudo ou nada, com desfazer.** Evidência: os testes de integração com `fake-indexeddb` para restauração e para o compartilhamento de plano.
- **Peso controlado no build.** Evidência: `scripts/build-budget.ts`. A carga inicial é de 187 de 205 KB, e o build falha se passar.
- **Contrato entre tela e regra.** Evidência: o teste que impede a tela de reescrever a escala do jiu-jitsu (`FEEL_SCALE`).

O que ficou de fora de propósito, por ainda ser frágil:
- **A fila de gravações:** tem um bug aberto (seção 5).
- **Os gráficos:** são comuns.
- **A acessibilidade fora da execução do treino:** foi pouco testada com leitor de tela de verdade.

---

## 4. Roteiro de teste no celular

Faça na ordem. Teste cada parte nos dois temas quando der. Ao terminar um passo, marque a caixa; se algo der errado, anote o código do passo na seção "Anotações".

### a. Primeira abertura limpa

Use uma aba anônima, ou apague os dados em Perfil → Zona de risco.

- [ ] **a1.** Abra o app. Deve aparecer a tela de boas-vindas com "Montar meu plano", "Usar o plano padrão" e "Ver com dados de exemplo".
- [ ] **a2.** Toque em "Ver com dados de exemplo". No topo deve aparecer a faixa "Dados de exemplo", e o Início deve estar na semana 5, com treinos e cargas subindo.
- [ ] **a3.** Navegue pelas 5 abas. Tudo deve estar preenchido e coerente (dieta, medidas, gráficos).
- [ ] **a4.** No Perfil, tente fazer backup. A opção deve aparecer como "Indisponível na demonstração".
- [ ] **a5.** Toque em "Sair da demonstração". O app volta vazio, com a tela de boas-vindas.
- [ ] **a6.** Toque em "Montar meu plano" e responda as 9 perguntas como um amigo iniciante. Cada termo técnico (RIR, deload) deve ter uma linha de explicação, e no fim deve aparecer um resumo para revisar antes de aplicar.
- [ ] **a7.** Aplique o plano. O Início deve mostrar o plano novo. Ele começa na próxima segunda, e isso é esperado (seção 5).

### b. Instalar na tela de início

- [ ] **b1. iPhone:** no Safari, toque em Compartilhar → "Adicionar à Tela de Início". O ícone do Fitnez deve aparecer e abrir sem a barra do navegador.
- [ ] **b2. Android:** no Chrome, toque em ⋮ → "Instalar app" (ou "Adicionar à tela inicial"). Deve funcionar igual.
- [ ] **b3.** Conclua o 1º treino. A tela de concluído deve mostrar "Deixe o Fitnez na tela inicial", só uma vez.

Este bloco só funciona no site publicado ou pelo cabo USB (seção 6).

### c. Um treino completo

Use o seu plano ou a demo.

- [ ] **c1.** Início → "Começar treino". A execução deve abrir no 1º exercício, com a carga e as repetições em cinza.
- [ ] **c2.** Toque no ✓ da série 1 sem digitar nada. A série deve ficar marcada com a sugestão (com vírgula, ex.: 30,5) e o descanso deve começar.
- [ ] **c3.** Toque em "Desfazer" em até 6 s. A série deve voltar a ficar sem marca.
- [ ] **c4.** Marque de novo. No descanso, toque em +15 s e −15 s: o tempo deve mudar. Espere acabar: o celular vibra (só no Android; o iPhone não vibra pelo navegador).
- [ ] **c5.** Digite outra carga e repetições na série 2 e marque. Deve gravar o que você digitou.
- [ ] **c6.** Adicione uma série extra e uma de aquecimento. Elas devem aparecer, e o aquecimento não conta para recorde nem para o histórico.
- [ ] **c7.** Antes de fazer qualquer série do exercício, abra "Trocar só hoje" e escolha outro. Deve trocar só nesta sessão; o plano continua igual.
- [ ] **c8.** Toque no nome do exercício. Devem aparecer as últimas 5 sessões. Feche: o que você tinha digitado continua lá.
- [ ] **c9.** Num exercício com barra, abra "Anilhas" e use a carga. O campo de carga deve mudar sem marcar a série.
- [ ] **c10.** Digite uma carga maior que o seu recorde e marque. Deve aparecer a celebração discreta "Recorde de carga".
- [ ] **c11.** Complete um exercício. Embaixo deve aparecer "Próximo: {nome}".
- [ ] **c12.** Toque em "Concluir treino". Deve aparecer "Treino concluído!" com o total levantado e os recordes.
- [ ] **c13.** Abra o detalhe do treino. A sessão deve estar no histórico.

### d. Outros tipos de dia

- [ ] **d1. Jiu-jitsu:** registre a aula e escolha "Como terminou" 5. O texto deve dizer que 5 é destruído. Com notas altas, a 3ª aula não deve ser liberada.
- [ ] **d2. Vôlei:** registre o dia. A meta da dieta deve mudar para a do dia de vôlei.
- [ ] **d3. Descanso:** num dia de descanso, o Início não oferece treino e a dieta usa a meta de descanso.

### e. Dieta do dia

- [ ] **e1.** Escolha uma opção numa refeição e marque como consumida. O anel de calorias e as macros devem subir.
- [ ] **e2.** Pule uma refeição. Ela deve aparecer como pulada e não contar no anel.
- [ ] **e3.** Abra "Sobre esta refeição". Devem aparecer os ingredientes.
- [ ] **e4.** Toque em 2 copos de água. Deve mostrar 1 L.
- [ ] **e5.** Marque "Creatina tomada". A marca deve continuar depois de fechar e reabrir o app.
- [ ] **e6.** Edite uma meta de calorias. O anel deve usar a meta nova.
- [ ] **e7.** "Restaurar as metas de exemplo?" → confirme e depois toque em "Desfazer". A meta editada deve voltar.

### f. Evolução e medidas

- [ ] **f1.** Registre o peso e a cintura. O gráfico deve mostrar o ponto novo.
- [ ] **f2.** Troque o gráfico entre Força, Peso e Cintura. Os rótulos das semanas não devem se sobrepor (há um problema conhecido em S10 a S12).
- [ ] **f3.** Veja a constância e as séries por grupo. Os números devem bater com os treinos feitos.

### g. Perfil

- [ ] **g1. Tema:** troque entre claro, escuro e sistema. Deve mudar na hora e continuar depois de reabrir o app.
- [ ] **g2. Backup:** toque em "Baixar backup". Um arquivo .json deve ser salvo e a data do último backup deve atualizar.
- [ ] **g3. Importar:** importe o arquivo baixado. Antes de aplicar, deve aparecer a "Prévia da importação".
- [ ] **g4. CSV:** exporte. As planilhas devem abrir no Google Planilhas.
- [ ] **g5. Exportar plano:** toque em compartilhar plano e mande o arquivo para outro celular (ou para uma aba anônima). As observações devem vir desmarcadas por padrão.
- [ ] **g6. Importar plano:** no outro aparelho, importe, revise e aplique. Os treinos e cargas do amigo não devem mudar, só o plano. Depois, "Voltar ao plano anterior?" deve desfazer.
- [ ] **g7. Cartão da semana:** Evolução → Resumo da semana → compartilhar. Deve abrir o WhatsApp com a imagem, sem peso nem medidas (a não ser que você marque).
- [ ] **g8. Apagar dados:** no Perfil, confira o status do armazenamento persistente. Depois apague os dados na Zona de risco e confirme: o app deve voltar vazio. **Faça o backup (g2) antes.**

### h. Situações de estresse

- [ ] **h1. Modo avião:** com o app já aberto uma vez, ligue o modo avião e reabra. Deve abrir e gravar normalmente.
- [ ] **h2. Bloquear a tela:** marque uma série, bloqueie a tela por 30 s e desbloqueie. O descanso deve estar no tempo certo, ou dizer que terminou. **Atenção:** se você tiver digitado e ainda não marcado, os valores se perdem. É o bug 1 da seção 5.
- [ ] **h3. Fechar e reabrir:** feche o app no meio do treino e abra de novo. As séries marcadas devem continuar; "Continuar treino" deve levar à execução.
- [ ] **h4. Tema escuro sob luz forte:** a série feita, a série ativa e a sugestão em cinza devem ser legíveis.
- [ ] **h5. Fonte grande:** aumente o tamanho da fonte do sistema. Nada deve ficar cortado na execução e no Início.

### i. Segurança do assistente

Para cada caso, comece um assistente novo numa aba anônima e anote o que aparece.

- [ ] **i1. Idade 16:** deve gerar um plano leve com o aviso de menor de 18 anos.
- [ ] **i2. Idade 12:** não deve gerar plano ("menos de 14 anos").
- [ ] **i3. "Estou grávida":** não deve gerar plano e deve orientar a procurar o médico.
- [ ] **i4. "Estou amamentando":** deve gerar um começo leve, sem metas de dieta, com o aviso de liberação médica.
- [ ] **i5. Transtorno alimentar:** no máximo 4 treinos por semana, sem treino longo, e com um aviso.
- [ ] **i6. IMC abaixo de 18,5** (ex.: 1,80 m e 55 kg): deve aparecer o aviso de IMC baixo.

---

## 5. Bugs e limites conhecidos

Os itens abaixo não são bugs novos.

### Bugs

1. **Carga e repetições digitadas se perdem** se você sair da execução ou bloquear a tela antes de marcar a série (`Executar.tsx:294`). Correção pendente.
2. **Uma gravação recusada trava as próximas** até você recarregar o app (`commitQueue.ts:29` e `:44`). É raro de acontecer e é o exercício 3 dos guias de estudo.

### Limites e escolhas

- O plano começa na **próxima segunda**: quem abre numa quinta vê "começa em 4 dias".
- Na boas-vindas, **"Usar o plano padrão" tem o mesmo peso de "Montar meu plano"**. O plano padrão é o do dono do app, com jiu-jitsu e vôlei.
- O **link do app chega sem prévia** de imagem no WhatsApp e no LinkedIn.
- O **iPhone não vibra** pelo navegador. É limite do Safari, não do app.
- O **leitor de tela** fala "Série N concluída" no botão ainda não marcado (`Executar.tsx:519`).
- O app **pode ser aberto dentro de outro site** (iframe). É um limite do GitHub Pages.

### Itens médios e baixos da auditoria de UX que continuam abertos

Fonte: `docs/handoffs/ux-auditoria-fase-3.md`.

- **Treino:**
  - a rotina da semana não marca o dia de hoje;
  - "+ Novo" ainda é um botão azul forte;
  - o selo "Concluído" ocupa uma linha só dele;
  - o mesmo ícone tem sentidos diferentes.
- **Detalhe do treino:**
  - o voltar ocupa uma linha inteira;
  - a meta aparece repetida;
  - o "Último desempenho" repete "28 kg × 6" várias vezes;
  - o histórico vazio não tem título.
- **Execução:**
  - sem foto, a figura é um espaço grande só com um ícone;
  - com o teclado aberto no Android, o rodapé espreme as séries;
  - a caixa do ✓ é pequena (24 px);
  - não há opção para canhoto.
- **Concluído:** "Total levantado" não tem explicação visível.
- **Dieta:**
  - a pílula "Meta de exemplo" parece botão (aguarda a sua decisão);
  - o % das macros quebra de linha;
  - a barra das macros usa uma animação fora do padrão.
- **Evolução:**
  - os rótulos S10 a S12 se encostam;
  - as cores dos ícones estão misturadas;
  - a barra de constância usa uma animação fora do padrão;
  - "Peso corporal" quebra em 2 linhas.
- **Perfil:**
  - o avatar está desalinhado do nome;
  - "Dados físicos" ocupa 4 linhas.
- **Início:**
  - o tipo do dia está em letra de 11 px;
  - a contagem de exercícios anima toda vez.

---

## 6. Como rodar no celular sem publicar

### Caminho 1: mesmo Wi-Fi (o mais simples)

No PowerShell:

```
cd C:\Projeto-Treino
npm.cmd run build
npm.cmd run preview
ipconfig
```

1. No resultado do `ipconfig`, procure "Endereço IPv4" do Wi-Fi.
2. No celular, ligado ao mesmo Wi-Fi, abra `http://<esse-endereço>:4173/Projeto-Treino/`.

**Limite:** por não ser `https`, o celular trata o endereço como inseguro. Por isso, este caminho não serve para:
- instalar na tela inicial (b);
- funcionar offline (h1);
- tela acesa;
- armazenamento persistente.

Todo o resto dá para testar.

Os dados deste endereço são separados dos dados do site publicado.

### Caminho 2: Android por cabo USB (testa tudo, inclusive instalar e offline)

1. No celular, ative as **Opções do desenvolvedor** e a **Depuração USB**.
2. Ligue o cabo e, no Chrome do computador, abra `chrome://inspect/#devices`.
3. Clique em **Port forwarding** e adicione `4173` → `localhost:4173`.
4. No Chrome do celular, abra `http://localhost:4173/Projeto-Treino/`. Como é `localhost`, o celular trata como seguro.

### Caminho 3: iPhone

O iPhone só testa tudo pelo site publicado. Para isso, você precisa autorizar o push.

### Se o celular não abrir o endereço

- **Firewall:** na 1ª vez, o Windows pergunta se libera o Node.js. Marque **Redes privadas** e clique em Permitir. Se você negou, libere em Configurações → Firewall → Permitir um app.
- **Rede:** confira se o Wi-Fi do PC está marcado como **Rede privada** (Configurações → Rede → Propriedades).
- **Mesmo Wi-Fi:** o celular precisa estar no mesmo Wi-Fi que o PC, e não nos dados móveis. Redes de visitante costumam isolar os aparelhos.
- **Endereço:** não esqueça o `/Projeto-Treino/` no fim do endereço.
- **Preview fechado:** se aparecer "Port 4173 is in use", feche o outro preview ou reinicie o PowerShell.
- **Versão antiga:** se você já abriu o app nesse endereço, recarregue a página duas vezes.

---

## Anotações

| Passo | O que aconteceu | Tema | Celular |
| --- | --- | --- | --- |
| | | | |
