# Roteiro dos GIFs do README

Os cinco GIFs abaixo já foram gerados automaticamente (Playwright em 390 × 844,
data real, dados sintéticos do modo demonstração, convertidos com ffmpeg a
12 quadros por segundo e 360 px de largura) e estão em `docs/gifs/`. Servem
como versão provisória. A coluna "Melhor à mão?" diz quais ganham sendo
regravados no celular de verdade.

Preparação para gravar à mão:

1. Abra <https://caua-manuel.github.io/fitnez/> numa aba anônima (sem dados).
2. Na primeira tela, toque em **Ver com dados de exemplo**. A faixa "Dados de
   exemplo" fica no topo; ela aparece no GIF e tudo bem, mostra que é demo.
3. Escolha o tema em Perfil → Aparência, ou deixe o do sistema.
4. Grave a tela do celular em pé, sem notificações (modo não perturbe). Corte
   para 5 a 10 s e converta para GIF com largura de 360 px.

| Arquivo | Duração | Tema | Passo a passo | No README | Melhor à mão? |
| --- | --- | --- | --- | --- | --- |
| `01-registrar-serie.gif` | 6 s | claro | Treino → Upper A → Começar treino. Espere 1 s. Toque na caixa ✓ da série 1 (registra a sugestão em cinza). Espere o descanso aparecer. Toque na caixa da série 2. | GIF principal, logo abaixo do título | Sim. O toque do dedo e a vibração explicam melhor o "registrar em um toque" |
| `02-descanso.gif` | 6 s | escuro | Na execução, marque a série 1. Espere 2 s com o cronômetro correndo. Toque em **+15 s**. Espere 2 s. | Funcionalidades, item "Na academia" | Não. O automático é limpo e o tempo corre de verdade |
| `03-recorde.gif` | 5 s | claro | Na execução, toque na carga da série 1, apague, digite **32,5** e toque em ✓. Aparece "Recorde de carga". | Funcionalidades, item "Recordes" | Sim, se quiser mostrar a vibração e a microinteração do troféu (o vídeo automático não pega vibração) |
| `04-dieta.gif` | 7 s | claro | Dieta. Toque em 2 copos de água. Role até as refeições. Toque em Café da manhã e escolha uma opção. | Funcionalidades, item "Dieta do dia" | Opcional. Vale terminar marcando "Marcar como consumido" e voltando para ver o anel subir |
| `05-evolucao.gif` | 6 s | escuro | Evolução. Role até "Resumo da semana". Toque e mostre o cartão da semana. | Funcionalidades, item "Evolução" | Sim, se quiser mostrar o compartilhamento abrindo o WhatsApp com a imagem (o navegador automático não tem a folha de compartilhar do sistema) |

Sugestão extra (só à mão): um GIF curto do assistente de início, respondendo
as nove perguntas em velocidade acelerada, para a seção "O problema".

Para regenerar os automáticos depois de mudar telas, rode o build, sirva com
`npm run preview` e use o mesmo fluxo de captura (importar o backup sintético
gerado por `demoState` e gravar com `recordVideo` do Playwright). O script usado
fica fora do repositório para não pesar o projeto; peça ao agente `qa-testes`
para versioná-lo em `scripts/` se quiser repetir com frequência.
