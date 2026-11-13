# Frontend: refação visual de Início e Treino

- Referências: tela-7 (Início), tela-4 (lista), tela-6 (detalhe), tela-5 nº 4 e 5 (execução e concluído).
- Início: anel SVG com ponta arredondada (`ProgressRing`), card "Treino de hoje" com `HeroIllustration` cortada na borda direita, "Começar treino" fora do card, "Registrar outro dia" e "Trocar treino" (uma linha), atalhos Dieta e Evolução com seta. Arquivos: `src/features/inicio/Inicio.tsx`, `inicio.css`.
- Treino: `Cartao.tsx` (cartão com selo e menu ⋮ preparado para o editor), `Biblioteca.tsx` (busca com ícone, chips), `Detalhe.tsx` (abas, tabela de séries só leitura), `Executar.tsx` (cronômetro com pausa, ilustração central, setas), `Concluido.tsx`, `glyphs.tsx`, `progress-ring.css`, `treino.css`. `util.ts` ganhou `sessionGroups`, `sessionLetter`, `shortDay`, `plural`; `minutesLabel` agora mostra "≈ N min" para número solto.
- Decisões: a tabela do Detalhe usa caixas visuais (não `<input>`), pois é leitura: carga = última feita; edição fica na Execução. Tempo pausado é descontado da duração final. Sem botão "Salvar" (salvamento é automático). Filtro "Full Body" omitido (o plano não tem esse tipo).
- Testes e2e ajustados: "Trocar treino", ordem nome → dia no Meu plano, e abertura da seção de backup do Perfil (agora recolhida) no `seed`.
- Capturas: `capturas/treino-r1` a `r4` (r3 escuro, r4 em 360 px).
