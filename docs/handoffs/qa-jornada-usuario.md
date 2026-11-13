# QA - jornada de usuário (Fitnez) - achados

Escopo: app congelado em http://localhost:4182/Projeto-Treino/, Chromium, 390x844 @2x pt-BR (também 360x740, 1280x800, claro e escuro). Dados novos a cada contexto, depois dados criados pelo próprio app. Data fixa 18/11/2026 10:00 (semana 1). Nenhum código foi alterado. Console sem erros em toda a sessão.
Scripts e capturas: pasta temporária local da sessão de QA (não versionada), subpasta `qa\` (capturas em `shots\`).

Ressalvas do ambiente (não são bugs do app): com `setFixedTime` o cronômetro fica em 00:00:00, "Duração < 1 min" e o aviso (toast) de "Dados do treino salvos / Treino criado" não some sozinho. O descanso e o cronômetro foram testados à parte, sem relógio fixo, e funcionam (2:30 -> 2:27, +15 s, pausa).

Veredito: o fluxo principal funciona (registrar séries, concluir, persistir ao recarregar, dieta, medidas, backup e restauração, tema). O "não está funcional" vem de falhas de feedback e de descoberta, de uma ação destrutiva invisível e de números que não batem entre telas.

## GRAVE

**G1. "Excluir treino" e "Remover do treino" são invisíveis (texto da mesma cor do fundo)**
- Reproduzir: Treino > Biblioteca > menu "..." de qualquer treino; ou Treino > abrir treino > menu "..." de um exercício.
- Aconteceu: o item vira um bloco vermelho liso, sem texto (cor `rgb(179,32,47)` sobre fundo `rgb(179,32,47)`; no escuro `rgb(255,124,139)` nos dois). O usuário vê um botão vermelho mudo e não sabe o que ele faz. Existe a confirmação "Excluir treino?" e o desfazer de 8 s, mas o ponto de entrada é ilegível. Capturas: `t3-kebab.png`, `t3g-exmenu.png`.
- Esperado: texto legível. Causa provável: regra `button.danger{background:destructive;color:card}` em conflito com a regra do menu.

**G2. "Trocar treino" e "Registrar outro dia" parecem não fazer nada**
- Reproduzir: Início (390x844) > toque em "Trocar treino".
- Aconteceu: o painel com as opções abre abaixo da dobra, escondido pela barra inferior; só muda a cor do botão. Idem "Registrar outro dia" (o seletor de data fica meio escondido). Depois de escolher o treino, nada confirma a troca além de o cartão mudar. Captura: `t7-trocar.png`.
- Esperado: rolar até o painel ou abri-lo em sheet; marcar qual é o treino atual (Upper A aparece como opção); mostrar confirmação.

**G3. Erro de importação de backup aparece a ~1.400 px do campo**
- Reproduzir: Perfil > Backup e restauração > escolher um arquivo `.json` quebrado ou `.txt`.
- Aconteceu: o nome do arquivo aparece, mas nenhuma mensagem perto do campo. O erro "Não foi possível concluir / JSON inválido ou incompleto / Reler dados e tentar novamente" está no topo da página (y=86, enquanto o campo está em y=1493). Quem está na seção de baixo acha que nada aconteceu. O botão "Reler dados e tentar novamente" não corresponde à ação (o certo seria escolher outro arquivo).
- A importação válida funciona: prévia, confirmar, dados restaurados e persistidos.

**G4. Medidas não têm seletor de data e aceitam valores absurdos**
- Reproduzir: Evolução > Abrir (em "Registrar medidas") > Peso 900 > Salvar.
- Aconteceu: (a) a data é sempre "hoje"; não é possível registrar uma medida esquecida (a promessa de "3 datas diferentes" só se cumpriu mudando o relógio do aparelho); (b) 900 kg é aceito e distorce o gráfico, sem alerta ou faixa plausível (0 e texto são recusados corretamente); (c) toda a linha "Registrar medidas" parece tocável, mas só o texto "Abrir" responde; (d) o formulário abre abaixo da dobra.

## MÉDIO

**M1. Constância diferente entre telas.** Após concluir 1 treino na quarta: Evolução mostra 33% (1 de 3 previstos na S1) e Perfil mostra 50%. Antes do treino a tabela mostrava S1 "0 de 2". Com a data em 30/11 a S1 passou a "0 de 6" (conta aulas de jiu-jitsu e vôlei). A regra de "previsto" muda conforme a data e a tela. Capturas: `t2d-evol.png`.

**M2. Evolução > tile "Força" fica "—" com um treino registrado, enquanto o gráfico mostra um ponto (27,9 kg).** Com um ponto só, o gráfico de força não traça linha. "Força (carga média)" mistura exercícios diferentes (média de 30 kg e 25 kg), o que pouco diz sobre força.

**M3. Gráficos cortados.** No gráfico de peso o eixo Y é cortado à esquerda ("32,5 kg" vira "2,5 kg", "81,5" vira "1,5"). O mini-gráfico do cartão "Peso corporal" aparece pela metade. Captura: `t9d-peso.png`.

**M4. Tela "Treino" (detalhe) sem sinalizar treino em andamento ou concluído.** Com treino em andamento, o detalhe ainda mostra "Começar treino" (o Início mostra "Continuar treino"). A tabela de "Séries planejadas" parece formulário (caixas e checkboxes) mas não é editável. O anel "8%" é do plano, não do treino, e repete na Início e no detalhe sem rótulo. Captura: `t2-left.png`.

**M5. Retomar treino volta ao exercício 1**, não ao último em que o usuário estava (ex.: saiu no 2 de 10, voltou no 1 de 10). Os dados das séries são mantidos.

**M6. Conclusão silenciosa de séries.** Marcar "concluir" numa série vazia copia o valor da série anterior sem avisar. "Concluir treino" com 8 de 10 exercícios intocados não pergunta nada. Os campos de repetição e carga não mostram a meta (5-8) nem a carga sugerida como dica (placeholder).

**M7. "Marcar Café da manhã como consumido" na lista da Dieta apenas abre a refeição, sem marcar.** O texto do botão promete marcar. Marcar exige abrir, escolher a opção e confirmar.

**M8. Busca na Biblioteca só procura nome do treino.** "supino" (exercício existente em Upper A) resulta em "Nenhum treino encontrado". A "Biblioteca" é de treinos, não de exercícios.

**M9. Treino novo criado fica fora do plano semanal e sem indicação de como encaixá-lo.** "Treino de braço" (rótulo "Treino E") aparece só na Biblioteca; para usá-lo é preciso "Trocar treino" na Início. Nada orienta o usuário. O treino em si cria, abre, executa e conclui corretamente.

**M10. Salvar sem confirmação visível ou com confirmação escondida.** Perfil: nome e objetivo salvam e persistem, sem aviso (só o texto muda). Salvar opção de dieta: sem aviso. Editar treino/exercício: o toast aparece colado na barra inferior. Aviso "Guarde uma cópia dos seus dados / backup pendente" surge logo no primeiro uso, ao salvar o nome.

**M11. Texto de repetições estranho:** "10 por lado repetições", "30-40 s repetições" (Pallof press, Farmer's walk). A aba Detalhes mostra "Séries e repetições de: Semana 01 de 12" (rótulo e valor sem sentido).

**M12. Opção de dieta editada continua com a receita antiga** (a receita do Mingau permanece depois de trocar itens e calorias). Calorias e macros editados não são validados entre si (500 kcal com macros que somam ~465). "34,5 g" vira "35 g".

**M13. Revisão semanal contraditória:** "Perda de 0,70 kg na semana, acima de 0,7 kg".

## COSMÉTICO

- C1. Desktop 1280x800: o app é uma coluna fixa de 480 px centrada, com laterais vazias e a barra inferior flutuante; funciona, não aproveita a tela. Sem estouro horizontal em nenhuma rota (360, 390, 1280).
- C2. Lista do catálogo em "Adicionar exercício": títulos centralizados com alinhamentos diferentes entre cartões. Captura: `t4c-add.png`.
- C3. As opções de refeição usam a mesma ilustração, e a opção 1 do café não tem "Ver receita" (2 e 3 têm).
- C4. Treino passado não feito (Lower de terça) continua "Pendente" na semana; seria "Não feito".
- C5. Mensagem do Início para treino excluído diz "Use Trocar treino de hoje", mas o botão se chama "Trocar treino".
- C6. Data futura no seletor de "Registrar outro dia" é ignorada sem explicação. Rota `#xyz` cai silenciosamente no Início. Dieta de maio/2027 (depois do plano) mostra a meta normalmente.
- C7. Perfil: "Notificações - Bloqueadas no navegador" com chave desabilitada não explica como liberar (testado em Chromium sem permissão; em dispositivo real pode variar).

## Passou (testado e funciona)

- Primeiro uso: Início claro, Perfil editável, nome/objetivo persistem após recarregar.
- Treino: registrar séries com vírgula (30,5), descanso (usa o valor do exercício, inclusive o novo 1:45 depois de editar), pular/+15/-15, pausar, navegar entre exercícios, sair e voltar sem perder dados, "Concluir treino" desabilitado sem séries (com aviso), resumo correto (7 séries, 1.380 kg), Início "Treino concluído", Treino "Concluído", Perfil "1 treino".
- Edição: renomear, reordenar, trocar descanso, remover com desfazer, adicionar do catálogo, criar exercício novo, criar treino do zero (validação de nome), duplicar com desfazer, excluir com confirmação e desfazer, treino excluído da rotina mostra "Treino removido" e a rota direta mostra "Treino não encontrado".
- Dieta: marcar refeição, trocar opção, anel e macros atualizam, água (toque no último copo tira), creatina, receita, navegar dias, Gerenciar opções (editar, adicionar com validação, excluir, desfazer), tudo persiste ao recarregar.
- Evolução com 1, 3 e vários pontos, troca de período (4, 8, 12 semanas).
- Perfil: tema claro/escuro/automático persistem. Backup baixa (`treino12-backup-2026-11-18-r4.json`), confirmação de cópia remove o aviso, importação mostra prévia e restaura.
- Navegação: voltar/avançar do navegador, recarregar em todas as rotas, rotas inexistentes tratadas, barra inferior em todas as telas exceto na execução do treino (intencional), foco visível por teclado.

## Risco que sobrou / não testado

- Notificações reais (permissão negada no Chromium de teste); instalação PWA e modo offline completo não exercitados nesta jornada.
- Toast de salvamento que não some e cronômetro parado só foram observados com relógio fixo; confirmar em tempo real.
- Dark mode verificado em Perfil, Dieta, Evolução e execução por captura, sem varredura de contraste.
