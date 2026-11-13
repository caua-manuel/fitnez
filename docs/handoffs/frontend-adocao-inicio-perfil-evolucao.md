# Frontend: adoção da nova direção em Início, Perfil e Evolução

- Início: manequim trocado por `Thumb kind="hero"` (tile cinza discreto); cartão "Treino de hoje" sem gradiente nem sombra, rótulo e metadados em cinza; anel fino (88 px, traço 5); azul só em "Começar treino", item ativo e progresso; botões "Registrar outro dia" e "Trocar treino" neutros, retangulares.
- `HERO_PHOTOS` em `Inicio.tsx` lista os treinos com foto em `public/img/hero/<id>.jpg`. Está vazio de propósito: pedir arquivo ausente gera erro de rede no console, e o teste PWA offline trata erro de console como falha.
- Perfil: defeito do interruptor corrigido (regras `.switch` em `src/ui/styles.css`): trilho #D9DEE8 desligado, azul ligado, polegar branco, área de toque 44 px, desabilitado com opacidade .55. Avatar de 72 px neutro, botão "Editar perfil" retangular, linha de números com ícone ao lado, cartões sem sombra, títulos 700/600.
- Evolução: bordas de 1 px, gráfico em traço de 1,75 px com área a 10 %, pontos ocos, sem halo, selo em tom suave, barras de 16 px com trilho neutro, ícones em cinza.
- Pendência: `fase1.spec.ts` "PWA produção ... offline" falha por 10 a 12 erros `ERR_INTERNET_DISCONNECTED`; a causa provável são `Thumb` com id em Treino/Dieta (não são desta área) tentando `.jpg`/`.webp` ausentes. Sugestão: `Thumb` só buscar foto quando o id estiver numa lista de fotos existentes.
