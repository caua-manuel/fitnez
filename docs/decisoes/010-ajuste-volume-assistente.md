# 010. Ajuste de volume semanal do assistente de início

Data: 19/11/2026. Status: proposta (conteúdo), aguardando implementação.

## Contexto
A implementação do assistente (ADR 008) gerava volume semanal fora da faixa da própria especificação (seção 4.2 de `docs/handoffs/conteudo-assistente-inicio.md`) nos perfis 4, 11, 12 e 15.

## Decisão
1. Superior B para `nunca` e `iniciante` perde a puxada vertical (7ª vaga vira empurrar vertical). Motivo: 4 exercícios de costas contra 2 de peito por semana desequilibra e passa do teto proposto para iniciante. Perfil 4: costas 12 → 9.
2. Corpo inteiro B com 2 dias troca empurrar vertical por empurrar inclinado. Motivo: com 2 dias, peito ficava com 1 exercício por semana. Perfis 12 e 15: peito 2 → 4 e 3 → 6.
3. Faixa do intermediário: 8 a 14 → 8 a 16. Motivo: 5 dias dão 3 exposições por grupo; o excesso era de 1 série (perfil 11 = 15).
4. Com 2 dias, o mínimo da faixa passa a ser 2 × séries principais do bloco 1 (4, 6, 6). Motivo: 1 exercício principal por grupo em cada treino é o teto natural sem alongar a sessão (perfil 15 = 6).

Todos os números: a verificar. Detalhes e valores por perfil: `docs/handoffs/conteudo-ajuste-volume-assistente.md`.
