# Frontend: ícones Phosphor, acentos por seção e menus

- `src/ui/icons.tsx`: `Icon` usa Phosphor (importação individual de `@phosphor-icons/react/dist/csr/<Ícone>`, tree-shaking). API mantida (`name`, `size`, `weight`, `className`); `weight` numérico >= 2,4 vira `bold` (setas/marcas >= 2,2). Nova prop `look` (`duotone` | `regular` | `bold` | `fill`) força a aparência. Nomes novos: `lixeira`, `troca`. `play` é sempre `fill`.
- `TabBar`: ícone ativo em `fill` com micro-animação (escala .9 para 1, 180 ms, sem loop) e indicador azul único (`.tab-indicator`) que desliza por `transform` (220 ms).
- `Menu`: `MenuItem.icon` opcional; item `danger` ganha lixeira automática e fundo `--destructive-soft` no foco. `ConfirmSheet` aceita `icon` (destrutivo usa lixeira). `Select` marca a opção com ícone. Entrada de menu 150 ms, folha 180 ms; reduced-motion zera animações (regra global).
- Tokens (`src/ui/tokens.ts`, `styles.css`): `--accent-treino`, `--accent-dieta`, `--accent-evolucao`, `--accent-brasa` (claro/escuro conforme o pedido).

## Classes para os próximos agentes
- `.tone-treino`, `.tone-dieta`, `.tone-evolucao`, `.tone-brasa` num ancestral definem `--tone`.
- `.tone-X .icon-tile` (ou `.icon-tile.tone-X`): ícone no tom, fundo `--card` com anel hairline. Para ícone solto: `.tone-icon`.
- Uso permitido: ícones, números e selos pequenos; nunca fundos grandes.
- Contraste: ícones >= 3:1 sobre fundo e cartão nos dois temas. Como texto (>= 4,5:1): treino e evolução nos dois temas; dieta e brasa só no escuro. No claro, verde e âmbar são só ícone ou número grande.
- Tiles de ícone nas features ainda não usam as classes; passar `icon="..."` nos itens de `Menu` também fica para as features.
