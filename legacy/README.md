# Treino 12 semanas

App de treino simples para usar no celular: calendário de 12 semanas, registro de cargas por série, timer de descanso, editor de treinos, dieta com opções A, B e C por refeição, receitas, progresso e medidas. Funciona sem internet e guarda tudo no próprio aparelho.

## Como colocar no ar de graça (GitHub Pages)

1. Crie uma conta em https://github.com (se ainda não tiver).
2. Toque em **New repository**. Dê o nome `treino`, deixe **Public** e crie.
3. Na página do repositório, toque em **uploading an existing file** e envie todos os arquivos desta pasta:
   `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` e este `README.md`. Confirme em **Commit changes**.
4. Vá em **Settings → Pages**. Em **Source**, escolha **Deploy from a branch**, selecione `main` e a pasta `/ (root)`, e toque em **Save**.
5. Espere 1 a 2 minutos. O endereço do app aparece no topo da página: `https://SEU-USUARIO.github.io/treino/`.

## Como instalar no celular

- **iPhone:** abra o endereço no Safari, toque em Compartilhar e em **Adicionar à Tela de Início**.
- **Android:** abra no Chrome, toque nos três pontos e em **Instalar app**.

Depois de instalado, ele abre em tela cheia e funciona sem internet.

## Seus dados

- Os treinos e registros ficam salvos no próprio aparelho (armazenamento do navegador). O repositório só tem o código; ninguém vê seus números.
- Para guardar uma cópia ou trocar de aparelho, abra **Mais → Backup**, baixe ou copie o backup e importe no outro aparelho.
- Limpar os dados do navegador apaga os registros. Faça backup de vez em quando.

## Como atualizar o app

1. No GitHub, abra o arquivo que quer mudar, toque no lápis, edite e confirme em **Commit changes**.
2. Se mudou o `index.html`, troque também o número da versão no começo do `sw.js` (por exemplo `treino-v3-1` para `treino-v3-2`). Assim o celular baixa a versão nova.

## O que dá para editar dentro do app

- **Treinos:** nome, descrição e duração de cada treino; criar e excluir treinos.
- **Exercícios:** nome, tipo de registro (carga, peso do corpo, só repetições, tempo), séries e repetições de cada bloco, descanso e observação; adicionar, remover e reordenar.
- **Rotina da semana:** escolha o que vai em cada dia (aula com ou sem kimono, vôlei, descanso ou qualquer treino).
- **Início do plano:** em Mais, mude a data de início e o calendário todo se ajusta.

- **Dieta:** em cada refeição escolha entre as opções A, B e C, marque o que comeu e acompanhe calorias e proteína do dia. Tem receitas e as metas na própria aba.
