# QA - jornada de usuário, rodada 2 (Fitnez)

Escopo: app congelado em http://localhost:4186/Projeto-Treino/, Chromium, 390x844 @2x pt-BR, mais uma passada em 360x740 e outra em 1280x800 (claro e escuro). Data fixa 18/11/2026 10:00 (semana 1), com 09/12/2026 só para ter medidas em 4 semanas. Dados fictícios (Teste Fictício, 30 anos, 80 kg, 180 cm). Nenhum código foi alterado. Console sem erros em toda a sessão.
Scripts e capturas: pasta temporária local da sessão de QA (não versionada), subpasta `qa2\` (capturas em `shots\`).

Ressalva do ambiente: com `setFixedTime` o cronômetro fica em 00:00:00 e a duração mostra "< 1 min". Não é bug.

## Veredito
Todos os 9 itens da rodada 1 conferidos estão corrigidos. Não encontrei regressão desses itens. As novidades (Dados físicos e meta de proteína, quadril e coxa, fotos, ícones, tema escuro, aviso de saúde) funcionam. O pior problema novo é de integridade: concluir um treino e depois iniciar outro no mesmo dia faz o app perder a conclusão do primeiro e marcar o segundo como concluído.

## Rodada 1: conferência
| Item | Resultado | Evidência |
|---|---|---|
| G1 Excluir treino / Remover do treino visíveis | ok | Texto vermelho legível nos dois menus (`d3-menu.png`, `k1-exmenu.png`); confirmação "Excluir Upper A?" com 8 s para desfazer |
| G2 Trocar treino / Registrar outro dia | ok | Abrem em folha (sheet) com "Atual" marcado e "Fechar"; Escape fecha e devolve o foco ao botão (`d1-trocar.png`, `d1-outrodia.png`) |
| G3 Erro de importação junto ao campo | ok | Mensagem "Este arquivo não é um backup do Fitnez ou está corrompido. Seus dados atuais continuam intactos." logo abaixo do campo, com "Escolher outro arquivo" (`f2-badtxt.png`) |
| G4 Medidas com data e validação | ok | Campo Data; peso 900 recusado ("entre 30 e 300 kg"), texto recusado, data futura recusada; 5 campos incluindo quadril e coxa; vírgula aceita (`e2-900.png`, `e2-futuro.png`) |
| M1 Constância igual | ok | Evolução 33%, Perfil 33% (1 de 3 previstos até a data). "Previsto" continua crescendo com a data do relógio (S1 = 3 em 18/11, 6 em 09/12); é coerente, só é preciso o usuário entender que é "até hoje" |
| M7 Dieta marcando refeição | ok | O botão agora se chama "Escolher opção de X"; escolher uma opção e marcar volta à Dieta com os totais atualizados |
| M8 Busca por exercício | ok | "supino" acha Upper A ("Tem Supino com halteres") e Upper B |
| M5 Continuar treino | ok, com ressalva | Início mostra "Continuar treino" e retoma os dados. Ressalva: volta ao primeiro exercício incompleto, não ao que o usuário estava vendo (saí no 3, voltou no 1) |
| Confirmação de conclusão parcial | ok | "Concluir o treino? Você registrou 3 de 10 exercícios. Concluir mesmo assim?" com "Continuar treinando" / "Concluir" (`c2-concl.png`) |

## Problemas novos e persistentes

### GRAVE
**N1. Iniciar um segundo treino no mesmo dia apaga a conclusão do primeiro e marca o segundo como "concluído"**
- Passos: Início > Começar treino (Upper A) > registrar série(s) > Concluir treino > Concluir. Depois abrir Upper B (Trocar treino > Upper B > Começar, ou rota direta) e registrar uma única série, sem concluir.
- Obtido: `#treino/UB/concluido?dia=2026-11-18` mostra "Treino concluído! 1 série, 225 kg" (o usuário não concluiu). `#treino/UA/concluido?dia=2026-11-18` passa a dizer "Não há treino concluído para este dia". Na Biblioteca, Upper A mostra "Ainda não feito" e Upper B "Último treino: 18 nov". O Início mostra "Começar treino" para Upper A (antes mostrava "Treino concluído."); a lista do plano ainda diz "Concluído" no slot de quarta, e depois de Trocar treino para Upper B a lista marca "Upper B - Concluído" enquanto o Início mostra "Começar treino". Perfil continua com "1 treino" e as séries de Upper A seguem salvas.
- Esperado: o estado "concluído" pertence a cada treino/sessão; iniciar outro treino não altera o primeiro nem o marca como concluído. Se o app só admite um treino por dia, avisar antes de trocar.
- Capturas e logs: `k2.cjs`, `k3.cjs`, `d2-treino.png`, `l1-conf.png` (Upper A "Ainda não feito" na Biblioteca do perfil g1).

### MÉDIO
**N2. Peso do Perfil e peso de Evolução não conversam.** Perfil "80 kg" (meta de proteína 192 g) e Evolução com pesagens (80,5 kg em 18/11; 78,6 kg em 09/12). Registrar peso na Evolução não atualiza Perfil nem a meta de proteína; nada diz que são valores independentes. Dieta usa 192 g (do Perfil). Mudando o Perfil para 90 kg a Dieta passa a 216 g (funciona).
**N3. Medidas fora do plano somem.** Registrar medidas em 04/11 e 11/11 (antes do início do plano em 16/11) dá "Medidas de 04/11/2026 salvas neste aparelho", mas nenhum gráfico, tabela ou card mostra esses dias (só entram datas dentro das 12 semanas). Pior: o backup lista "Datas com medidas: 7". Esperado: mostrar o dia, ou avisar que a data está fora do plano.
**N4. Tocar numa medida (Quadril, Coxa) não mostra resposta perto do toque.** O gráfico grande acima continua o de Peso; só aparece um mini-gráfico pequeno no fim do card Medidas, muitas vezes abaixo da barra inferior. O card "Peso corporal" ao lado fica com metade da altura vazia.
**N5. Detalhe do treino (M4 em aberto).** Upper A concluído ainda mostra "Começar treino" no detalhe; o anel "8%" continua sem rótulo (é do plano, não do treino).
**N6. Continuar treino volta ao primeiro exercício incompleto**, não ao último visto (detalhe em M5 acima).
**N7. Fluxo de trocar opção da dieta sem confirmação.** Com refeição já marcada, tocar noutra opção troca o consumo na hora, sem aviso nem desfazer (456 kcal vira 495, etc.). Funciona e os totais batem (1.591 = 456+751+384; P 111 g), mas é silencioso.
**N8. Aviso "Guarde uma cópia / backup pendente" aparece logo ao salvar o nome no primeiro uso** (M10 persiste). Em seguida "Salvo" aparece no Perfil, o que é bom.

### COSMÉTICO
- C-a. 360 px, Perfil: o botão "Automático" quebra no meio da palavra ("Automátic / o") (`h-light-360-perfil.png`).
- C-b. 1280 px, Dieta: o card "2.450 kcal / Meta diária" quebra "2.450" e "kcal" em linhas separadas (a coluna fica estreita); em 390 px está normal.
- C-c. Cancelar a confirmação de exclusão (Escape) fecha a folha, mas deixa o menu "..." aberto atrás.
- C-d. Início, treino excluído: o texto diz "Use Trocar treino de hoje" e o botão é "Trocar treino" (C5 persiste).
- C-e. Fotos: só a opção 1 de cada refeição tem foto no café; a opção 2 usa o ícone de tigela (C3 persiste); Pós-treino também usa ícone genérico.
- C-f. Cabeçalho mostra a inicial "T" e o Perfil mostra "TF" (iniciais diferentes).
- C-g. No formulário de Dados físicos, a prévia da meta de proteína não recalcula enquanto o peso é digitado (mostrou 192 g com peso 80,5 digitado ainda sem salvar).
- C-h. Campos de série sem dica (placeholder) com a meta/carga sugerida (M6 persiste); a sugestão aparece só no detalhe do treino ("Sugestão: 27,5 kg · 5-8").
- C-i. Desktop: coluna de ~420-480 px centrada, laterais vazias (C1 persiste).

## Passou (testado e funciona)
**Jornada 1 (primeiro uso completo)**
- Início limpo; Perfil > Dados físicos (30 anos, 80 kg, 180 cm): salva, persiste ao recarregar, mostra "30 anos · 80 kg · 180 cm / Meta de proteína: 192 g por dia, 2,4 g por kg". Validação clara: idade 0, "abc", altura 300, altura com vírgula, valores extremos recusados com mensagem junto ao campo; peso com vírgula (80,5) aceito.
- Meta de proteína reflete na Dieta (192 g; 216 g com 90 kg).
- Treino: 3 exercícios, 8 séries com vírgula (27,5), descanso 2:30 com -15/+15/Pular, resumo coerente (3 exercícios, 8 séries, 1.535 kg), Início "Treino concluído.", Perfil "1 treino".
- Dieta: marcar 3 refeições, trocar opção, água (3 copos = 1,5 L; 4 = 2,0 L), creatina, ícones e fotos nas refeições e no card do Início, Gerenciar opções com validação por campo ("Informe o nome da opção." etc.).
- Evolução: medidas em 6 datas (16, 17, 18/11, 02 e 09/12) com peso, cintura, quadril, coxa e braço; gráficos, variação (-2,6 kg, -2,2 cm, +1,2 cm), períodos 4/8/12 semanas, eixo Y sem corte.
- Perfil: tema Automático/Claro/Escuro persiste; backup baixa `treino12-backup-2026-11-18-r32.json`, "Já guardei a cópia" remove o aviso; restauração em perfil novo mostra prévia (versão 3) e restaura Perfil, Dieta (1.591 kcal, 111/192 g P), Evolução e Início idênticos.
- Aviso de saúde ("Calorias, cargas e metas são estimativas...") presente nas telas.

**Jornada 2 (tema escuro e automático):** `data-theme` segue o sistema em Automático; todas as 11 rotas verificadas em escuro e claro, nos três tamanhos, por captura e por verificação automática de contraste (WCAG AA em todo texto visível): 0 falhas. Capturas lidas: Início, Dieta, Evolução (escuro) e Perfil.

**Jornada 3 (360 px):** nenhuma rota tem rolagem horizontal nem elemento fora da tela (só o caso C-a acima, de quebra de palavra).

**Jornada 4 (offline):** service worker ativo; sem rede, navegar para Dieta, registrar copo de água, recarregar a página (dados mantidos), abrir Evolução, registrar série no treino; rodapé "Sem conexão · disponível offline"; ao voltar online a série persiste.

**Jornada 5 (teclado):** Tab em 6 telas (38-39 paradas cada), todo foco com indicador visível, nenhum alvo menor que 40 px (exceto o input de rádio oculto, com cartão focável); Enter e Espaço abrem e escolhem na folha "Trocar treino", Tab fica dentro da folha, Escape fecha e devolve o foco.

**Jornada 7 (rotas por hash):** 20 rotas (incluindo inexistentes) abrem direto e iguais após recarregar. Rota `#xyz` cai no Início; `#dieta/xxx` cai na Dieta; `#treino/NAOEXISTE` mostra "Treino não encontrado"; `#treino/UA/concluido` sem conclusão mostra "Não há treino concluído para este dia".

## Risco que sobrou / não testado
- N1 é de integridade de dados: sem correção, um usuário que fizer dois treinos no mesmo dia (ou trocar o treino depois de concluir) perde a conclusão e vê estatísticas erradas. Precisa de teste de regressão.
- Notificações reais não testadas (permissão negada no Chromium de teste). Instalação PWA no celular não testada.
- Cronômetro real e fim automático do toast só testados na rodada 1.
- Horário de verão e virada de dia não exercitados.
- Dieta em dias fora do plano e opções editadas com calorias e macros incoerentes (M12 da rodada 1) não foram reavaliados.
