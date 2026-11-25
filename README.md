# Fitnez

Treino e dieta num só app, que monta o seu plano, registra cada série em segundos e funciona sem internet, com os dados guardados só no seu celular.

<img src="docs/gifs/compactados/01-registrar-serie.gif" width="240" alt="Registrando uma série com a carga sugerida">

**Abrir o app:** <https://caua-manuel.github.io/fitnez/>. Para conhecer sem preencher nada, toque em **Ver com dados de exemplo**.

## O problema

Quem treina em academia anota carga e repetição no papel, numa planilha ou num app que pede conta, mostra anúncio e manda os dados para um servidor. No meio da série ninguém quer digitar muito. E um plano copiado da internet não sabe se você treina jiu-jitsu na quarta, se nunca pegou numa barra ou se está grávida.

O Fitnez resolve isso para mim e para dois ou três amigos: um plano de 12 semanas montado a partir de nove perguntas, registro rápido na academia, dieta do dia e evolução, tudo offline e sem conta.

## Funcionalidades

- **Assistente de início:** nove perguntas e o app monta treinos, rotina da semana e metas de dieta. Gestação, menores de 14 anos e condições de saúde têm regras próprias e conservadoras.
- **Registro de série em um toque:** a carga e as repetições sugeridas aparecem em cinza; tocar na caixa registra assim mesmo.
- **Progressão automática:** dupla progressão (sobe a carga quando todas as séries chegam ao topo da faixa) e uma semana leve a cada 4.
- **Na academia:** a tela fica acesa, o celular vibra no fim do descanso, o cronômetro continua certo se você sair do app, há calculadora de anilhas dentro da série e as últimas 5 sessões de cada exercício.
- **Recordes e aviso de estagnação:** quando um exercício para de evoluir, o app sugere uma ação concreta.
- **Dieta do dia:** refeições com opções, calorias, macros e água, com metas editáveis.
- **Evolução:** peso, medidas, constância e um resumo da semana que vira imagem para mandar no WhatsApp.
- **Compartilhar plano com amigos:** exporta só o plano (sem dados pessoais) e o amigo revisa antes de aplicar.
- **Seus dados protegidos:** backup em JSON com lembrete a cada 7 dias de uso, armazenamento persistente e exportação em CSV.
- **Modo demonstração:** 4 semanas de dados fictícios, isolados dos dados reais.

| Descanso | Recorde | Dieta do dia | Resumo da semana |
| --- | --- | --- | --- |
| <img src="docs/gifs/compactados/02-descanso.gif" width="240" alt="Cronômetro de descanso com +15 s"> | <img src="docs/gifs/compactados/03-recorde.gif" width="240" alt="Recorde de carga batido"> | <img src="docs/gifs/compactados/04-dieta.gif" width="240" alt="Água e refeição do dia"> | <img src="docs/gifs/compactados/05-evolucao.gif" width="240" alt="Resumo da semana na Evolução"> |

As ilustrações dos exercícios foram geradas com IA.

<!-- inicio-galeria -->
<details>
<summary>Galeria de exercícios</summary>

<table>
<tr>
<td><img src="docs/galeria/supino.gif" width="120" alt="Supino com halteres"><br>Supino com halteres</td>
<td><img src="docs/galeria/remada_a.gif" width="120" alt="Remada curvada ou apoiada no banco"><br>Remada curvada ou apoiada no banco</td>
<td><img src="docs/galeria/press_a.gif" width="120" alt="Landmine press ou press sentado"><br>Landmine press ou press sentado</td>
<td><img src="docs/galeria/barra.gif" width="120" alt="Barra fixa, pegada neutra"><br>Barra fixa, pegada neutra</td>
<td><img src="docs/galeria/lat_a.gif" width="120" alt="Elevação lateral com halteres"><br>Elevação lateral com halteres</td>
<td><img src="docs/galeria/face.gif" width="120" alt="Face pull na polia"><br>Face pull na polia</td>
</tr>
<tr>
<td><img src="docs/galeria/rosca_a.gif" width="120" alt="Rosca direta com halteres"><br>Rosca direta com halteres</td>
<td><img src="docs/galeria/tri_a.gif" width="120" alt="Tríceps na polia"><br>Tríceps na polia</td>
<td><img src="docs/galeria/pallof.gif" width="120" alt="Pallof press (core)"><br>Pallof press (core)</td>
<td><img src="docs/galeria/farmer.gif" width="120" alt="Farmer’s walk (pegada)"><br>Farmer’s walk (pegada)</td>
<td><img src="docs/galeria/puxada.gif" width="120" alt="Puxada na frente, pegada aberta"><br>Puxada na frente, pegada aberta</td>
<td><img src="docs/galeria/inclinado.gif" width="120" alt="Supino inclinado com halteres"><br>Supino inclinado com halteres</td>
</tr>
<tr>
<td><img src="docs/galeria/press_b.gif" width="120" alt="Press de ombros sentado"><br>Press de ombros sentado</td>
<td><img src="docs/galeria/remada_b.gif" width="120" alt="Remada unilateral ou remada baixa"><br>Remada unilateral ou remada baixa</td>
<td><img src="docs/galeria/cruc.gif" width="120" alt="Crucifixo no peck deck ou nas polias"><br>Crucifixo no peck deck ou nas polias</td>
<td><img src="docs/galeria/lat_b.gif" width="120" alt="Elevação lateral na polia"><br>Elevação lateral na polia</td>
<td><img src="docs/galeria/inverso.gif" width="120" alt="Crucifixo inverso"><br>Crucifixo inverso</td>
<td><img src="docs/galeria/rosca_b.gif" width="120" alt="Rosca alternada ou barra W"><br>Rosca alternada ou barra W</td>
</tr>
<tr>
<td><img src="docs/galeria/tri_b.gif" width="120" alt="Tríceps francês ou na corda"><br>Tríceps francês ou na corda</td>
<td><img src="docs/galeria/joelhos.gif" width="120" alt="Elevação de joelhos ou pernas na barra (core)"><br>Elevação de joelhos ou pernas na barra (core)</td>
<td><img src="docs/galeria/pescoco.gif" width="120" alt="Isometria de pescoço, 4 direções"><br>Isometria de pescoço, 4 direções</td>
<td><img src="docs/galeria/salto_l.gif" width="120" alt="Salto vertical ou box jump"><br>Salto vertical ou box jump</td>
<td><img src="docs/galeria/agach.gif" width="120" alt="Agachamento com barra"><br>Agachamento com barra</td>
<td><img src="docs/galeria/stiff.gif" width="120" alt="Stiff com barra ou halteres"><br>Stiff com barra ou halteres</td>
</tr>
<tr>
<td><img src="docs/galeria/bulg.gif" width="120" alt="Agachamento búlgaro"><br>Agachamento búlgaro</td>
<td><img src="docs/galeria/nordic.gif" width="120" alt="Nordic curl assistido (ou mesa flexora)"><br>Nordic curl assistido (ou mesa flexora)</td>
<td><img src="docs/galeria/hip_l.gif" width="120" alt="Hip thrust com barra"><br>Hip thrust com barra</td>
<td><img src="docs/galeria/pant_pe.gif" width="120" alt="Panturrilha em pé"><br>Panturrilha em pé</td>
<td><img src="docs/galeria/roll.gif" width="120" alt="Roll-out com roda ou barra (core)"><br>Roll-out com roda ou barra (core)</td>
<td><img src="docs/galeria/copen_l.gif" width="120" alt="Copenhagen plank (adutores)"><br>Copenhagen plank (adutores)</td>
</tr>
<tr>
<td><img src="docs/galeria/salto_l.gif" width="120" alt="Salto vertical ou box jump"><br>Salto vertical ou box jump</td>
<td><img src="docs/galeria/hip_l.gif" width="120" alt="Hip thrust com barra"><br>Hip thrust com barra</td>
<td><img src="docs/galeria/leg.gif" width="120" alt="Leg press, pés na altura média"><br>Leg press, pés na altura média</td>
<td><img src="docs/galeria/afundo.gif" width="120" alt="Afundo ou step-up"><br>Afundo ou step-up</td>
<td><img src="docs/galeria/mesa.gif" width="120" alt="Mesa flexora"><br>Mesa flexora</td>
<td><img src="docs/galeria/pant_sent.gif" width="120" alt="Panturrilha sentada"><br>Panturrilha sentada</td>
</tr>
<tr>
<td><img src="docs/galeria/med.gif" width="120" alt="Arremesso rotacional de medicine ball (core)"><br>Arremesso rotacional de medicine ball (core)</td>
<td><img src="docs/galeria/copen_l.gif" width="120" alt="Copenhagen plank (adutores)"><br>Copenhagen plank (adutores)</td>
<td><img src="docs/galeria/goblet.gif" width="120" alt="Agachamento goblet com halter"><br>Agachamento goblet com halter</td>
<td><img src="docs/galeria/agach_livre.gif" width="120" alt="Agachamento livre com peso do corpo"><br>Agachamento livre com peso do corpo</td>
<td><img src="docs/galeria/ponte_h.gif" width="120" alt="Ponte de glúteo com halter"><br>Ponte de glúteo com halter</td>
<td><img src="docs/galeria/ponte_uni.gif" width="120" alt="Ponte de glúteo com uma perna"><br>Ponte de glúteo com uma perna</td>
</tr>
<tr>
<td><img src="docs/galeria/ponte.gif" width="120" alt="Ponte de glúteo"><br>Ponte de glúteo</td>
<td><img src="docs/galeria/afundo_livre.gif" width="120" alt="Afundo com peso do corpo"><br>Afundo com peso do corpo</td>
<td><img src="docs/galeria/sentar_levantar.gif" width="120" alt="Sentar e levantar da cadeira"><br>Sentar e levantar da cadeira</td>
<td><img src="docs/galeria/stiff_uni.gif" width="120" alt="Stiff com uma perna, sem carga"><br>Stiff com uma perna, sem carga</td>
<td><img src="docs/galeria/supino_chao.gif" width="120" alt="Supino no chão com halteres"><br>Supino no chão com halteres</td>
<td><img src="docs/galeria/flexao.gif" width="120" alt="Flexão de braço"><br>Flexão de braço</td>
</tr>
<tr>
<td><img src="docs/galeria/flexao_fechada.gif" width="120" alt="Flexão com mãos próximas"><br>Flexão com mãos próximas</td>
<td><img src="docs/galeria/pike.gif" width="120" alt="Flexão pike (ombros)"><br>Flexão pike (ombros)</td>
<td><img src="docs/galeria/puxada_elastico.gif" width="120" alt="Puxada com elástico"><br>Puxada com elástico</td>
<td><img src="docs/galeria/remada_mochila.gif" width="120" alt="Remada curvada com mochila"><br>Remada curvada com mochila</td>
<td><img src="docs/galeria/face_elastico.gif" width="120" alt="Face pull com elástico"><br>Face pull com elástico</td>
<td><img src="docs/galeria/ytw.gif" width="120" alt="Y, T e W deitado de bruços"><br>Y, T e W deitado de bruços</td>
</tr>
<tr>
<td><img src="docs/galeria/pant_degrau.gif" width="120" alt="Panturrilha num degrau"><br>Panturrilha num degrau</td>
<td><img src="docs/galeria/deadbug.gif" width="120" alt="Dead bug"><br>Dead bug</td>
<td><img src="docs/galeria/prancha.gif" width="120" alt="Prancha"><br>Prancha</td>
<td></td>
<td></td>
<td></td>
</tr>
</table>

</details>
<!-- fim-galeria -->

## Decisões técnicas

1. **Dados só no aparelho.** Sem servidor, sem conta e sem custo: IndexedDB no navegador e backup em arquivo. O preço é que a perda de dados vira um problema do app, e por isso existem o lembrete de backup por dias de uso, o pedido de armazenamento persistente e a restauração transacional. ([ADR 002](docs/decisoes/002-armazenamento-local-migracao-backup.md))
2. **Regras em funções puras, com teste.** Progressão, deload, metas de dieta, estagnação e o assistente ficam em `src/domain/`, sem relógio, sem DOM e sem banco: a data entra como parâmetro. Assim a regra mais importante do app roda centenas de vezes por segundo nos testes, sem navegador.
3. **Migração e restauração transacionais.** Importar um backup ou aplicar o plano de um amigo é uma única transação com revisão: ou entra tudo, ou nada muda, e o estado anterior fica guardado para desfazer.
4. **Fila de gravações.** Cada toque atualiza a tela na hora e entra numa fila única de gravação. Se outra aba gravar antes, as mudanças pendentes são reaplicadas sobre o estado novo, em vez de uma sobrescrever a outra.
5. **PWA offline com orçamento de peso.** Service worker gerado no build, carga inicial e total medidas a cada build e telas raras carregadas sob demanda. O build falha se o peso passar do limite. ([ADR 011](docs/decisoes/011-pronto-para-amigos-e-ferramentas-da-academia.md))

## Stack

React 19, TypeScript e Vite, com CSS próprio e a fonte Figtree servida com o app. Ícones Phosphor e a biblioteca motion para animações; nenhuma outra dependência de produção. Testes com Vitest (unidade e integração com `fake-indexeddb`) e Playwright (ponta a ponta em viewport de celular). CI e publicação no GitHub Pages por GitHub Actions.

**Números:** Lighthouse no celular com 100 em acessibilidade, boas práticas e SEO; LCP de 1,7 s em 4G lento com CPU 4× mais lenta; CLS 0. Carga inicial de 187 KB de JavaScript (gzip). 782 testes de unidade e integração e cerca de 200 de ponta a ponta.

## Como rodar

Requer Node 24 ou superior.

```
npm ci
npm run dev          # desenvolvimento
npm run check        # tipos, testes, build e orçamento de peso
npm run test:e2e     # Playwright
```

No PowerShell do Windows, use `npm.cmd`. Mais detalhes em [INICIO.md](INICIO.md).

## Como foi feito

Eu construí o Fitnez orquestrando agentes de IA especialistas, cada um com uma pasta e uma responsabilidade:

| Agente | Papel |
| --- | --- |
| `arquiteto` | Decide estrutura e camadas; escreve os ADRs |
| `frontend` | Telas, componentes, PWA e design system |
| `backend-dados` | IndexedDB, migração, backup, regras de domínio |
| `conteudo-treino-nutricao` | Dono das regras e números de treino e dieta |
| `ux-acessibilidade` | Fluxos, textos, uso com uma mão, WCAG AA |
| `qa-testes` | Testes de unidade, integração e ponta a ponta |
| `seguranca-privacidade` | Dados de saúde, CSP, revisão antes de publicar |
| `devops-github` | Build, CI, orçamento de peso e GitHub Pages |

O meu papel foi decidir o que construir, dividir o trabalho, revisar cada entrega e integrar. Toda decisão técnica virou um ADR em [docs/decisoes/](docs/decisoes/) e toda entrega deixou um handoff curto em [docs/handoffs/](docs/handoffs/), com o que mudou e como foi verificado. Regra fixa: nenhum número de treino ou dieta muda sem passar pelo agente de conteúdo, com o motivo registrado.

**O que deu certo.** Os agentes trabalharam em paralelo sem se atropelar porque cada um tinha uma pasta. ADRs e handoffs deram memória ao projeto: um agente novo lia a decisão em vez de redescobri-la. As revisões cruzadas acharam problemas reais: a segurança encontrou dois caminhos pelos quais o modo demonstração poderia apagar os dados reais antes de ele ir ao ar, e a revisão de conteúdo de 10 perfis fictícios mostrou que uma pessoa grávida recebia o mesmo treino com barra de qualquer iniciante.

**O que deu errado.** A escala "como terminou" do jiu-jitsu foi escrita ao contrário: a tela dizia que 5 era "ótimo" e a regra que libera a terceira aula semanal tratava 5 como "destruído". Todos os testes passavam, porque a tela tinha os testes dela e a regra tinha os dela, e nenhum conferia que os dois falavam a mesma língua. O erro só apareceu lendo o app como usuário. A correção foi criar uma fonte única para a escala (`FEEL_SCALE`) e um teste que falha se a tela voltar a escrever a escala à mão. A lição: testar o contrato entre as partes, não só cada parte. Agentes especialistas otimizam a própria pasta, e as costuras entre elas precisam de um dono.

Outros tropeços: limites de uso interrompendo agentes no meio da tarefa (o trabalho fica salvo e eles retomam, mas o plano precisa ser tolerante a isso) e documentação que envelhece mais rápido que o código. O estudo de caso completo está em [docs/ESTUDO-DE-CASO.md](docs/ESTUDO-DE-CASO.md).

## Aviso de saúde

O Fitnez não substitui médico, nutricionista ou profissional de educação física. As metas são estimativas. Pare qualquer exercício que cause dor.

## Privacidade

Treinos, medidas e anotações ficam só no aparelho. Não há conta, analytics nem envio de dados. O plano compartilhado leva só o plano; o cartão da semana não leva peso nem medidas, a não ser que você marque.

## Licença

MIT. As skills de terceiros em `agents/` e `.claude/skills/` mantêm as licenças de origem.
