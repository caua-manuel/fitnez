# Estudo de caso: Fitnez

Um app de treino e dieta para mim e dois ou três amigos, construído em cerca de
dez dias orquestrando agentes de IA especialistas.

## O problema

Eu treinava com um plano de 12 semanas (musculação, jiu-jitsu e vôlei) e
registrava tudo numa planilha e num protótipo em HTML. Três dores:

1. **Registrar na academia era lento.** Entre uma série e outra não dá para
   digitar carga e repetição em cinco campos.
2. **O plano não conversava com a vida real.** A regra que libera uma terceira
   aula semanal de jiu-jitsu depende de sono, cansaço e cargas, e ninguém faz
   essa conta de cabeça.
3. **Dados pessoais de saúde não deveriam ir para um servidor**, e eu não queria
   pagar nem manter um.

A meta não era virar produto. Era ser bom de verdade para uso diário de poucas
pessoas e servir de peça de portfólio.

## Decisões e trade-offs

| Decisão | Por quê | O que custou |
| --- | --- | --- |
| Sem back-end: IndexedDB + backup em JSON + GitHub Pages | Custo zero, privacidade por construção, funciona offline | A perda de dados vira responsabilidade do app: lembrete de backup por dias de uso, `storage.persist()`, restauração transacional com desfazer |
| Regras em funções puras (`src/domain/`) com a data como parâmetro | Testar progressão, deload, dieta e estagnação sem navegador e sem relógio falso | Disciplina: nenhuma regra pode morar dentro de componente |
| Fila única de gravações com atualização otimista | A tela responde na hora; duas abas não se sobrescrevem | Complexidade de reaplicar mudanças pendentes em conflito |
| Orçamento de peso no build (carga inicial e total) | O celular paga a carga inicial a cada abertura | Telas raras carregadas sob demanda; cada funcionalidade nova disputa espaço |
| Modo demonstração num banco separado | Mostrar o app em 30 s sem arriscar os dados reais | Duas fontes de verdade para isolar: banco, chaves auxiliares e tela de erro |
| Poucas dependências (React, Phosphor, motion) | Menos superfície de ataque e menos peso | Canvas, Wake Lock e Web Share escritos à mão |

## Como foi construído

Oito agentes especialistas (arquitetura, front-end, dados, conteúdo de treino e
dieta, UX e acessibilidade, testes, segurança e DevOps), cada um dono de uma
pasta. Eu decidia o que construir, quebrava o trabalho, revisava cada entrega e
integrava. Toda decisão técnica virou ADR (12 no total) e toda entrega deixou um
handoff curto (mais de 130), com o que mudou e como foi verificado.

Na prática, os agentes de escrita trabalhavam em paralelo em pastas diferentes,
e os de revisão (segurança, conteúdo, UX) liam o trabalho dos outros e
devolviam achados com arquivo e linha.

## Números

Medidos em 21/11/2026, no build de produção.

| Medida | Valor |
| --- | --- |
| Testes de unidade e integração (Vitest) | 782, em 53 arquivos |
| Testes de ponta a ponta (Playwright, viewport de celular) | cerca de 200, em 21 arquivos |
| JavaScript na carga inicial (gzip) | 187 KB, limite de 205 KB |
| JavaScript total, incluindo telas sob demanda (gzip) | 241 KB, limite de 300 KB (revisto em 23/11/2026) |
| CSS na carga inicial (gzip) | 22,5 KB, limite de 26 KB |
| Lighthouse (celular): acessibilidade, boas práticas, SEO | 100, 100, 100 |
| LCP em 4G lento com CPU 4× mais lenta, cache frio | 1,7 s |
| CLS | 0 |
| Dependências de produção | 4 (React, React DOM, Phosphor, motion) |

## O que deu errado (e o que aprendi)

**A escala invertida do jiu-jitsu.** A tela dizia que 5 era "ótimo"; a regra da
terceira aula tratava 5 como "destruído". Os testes da tela e os da regra
passavam, cada um no seu lado. O erro só apareceu usando o app. Correção: uma
fonte única (`FEEL_SCALE`) e um teste que falha se a tela voltar a escrever a
escala à mão. **Lição: testar o contrato entre as partes, não só cada parte.**
Agentes especialistas otimizam a própria pasta; as costuras precisam de dono.

**Regras seguras só para o perfil de quem escreveu.** O assistente de início foi
escrito pensando em mim. Quando gerei 10 perfis fictícios variados e pedi ao
agente de conteúdo para revisar número por número, apareceram problemas sérios:
gestante recebendo o mesmo treino com barra de qualquer iniciante, pessoa de 67
anos com afundo e ponte unilateral, treino de pernas na véspera da corrida.
**Lição: um gerador de conteúdo precisa de uma bateria de casos-limite revisada
por quem entende do domínio, não só de testes de que o código roda.**

**Vírgula e ponto.** Ao aceitar a sugestão de carga com um toque, o app gravava
"30.5"; quando a pessoa digitava, gravava "30,5". As contas funcionavam (o
leitor aceita os dois), então nenhum teste falhou. Apareceu num quadro dos GIFs
de portfólio. **Lição: olhar o app de verdade, em capturas e vídeos, acha o que
os testes não procuram.**

**Agentes interrompidos.** Limites de uso pararam vários agentes no meio da
tarefa. O trabalho fica salvo e eles retomam, mas o plano precisou ser tolerante
a isso: tarefas pequenas, uma pasta por agente e handoff ao fim de cada uma.

## O que eu faria diferente

1. **Começar pelos casos-limite do domínio**, antes das telas: a revisão dos 10
   perfis deveria ter existido no primeiro dia do assistente.
2. **Um teste de contrato por costura** (tela ↔ regra, regra ↔ dados), desde o
   início, em vez de descobrir as costuras pelos bugs.
3. **Medir o peso desde o primeiro commit.** O orçamento chegou tarde e foi
   revisto duas vezes; com a medida desde o começo, as telas raras já nasceriam
   sob demanda.
4. **Gravar a tela cedo.** Capturas e vídeos do app real acharam defeitos que a
   suíte não achou.
