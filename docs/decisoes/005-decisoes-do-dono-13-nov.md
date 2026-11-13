# ADR 005 — Decisões do dono de 13/11/2026

Data: 13/11/2026. Responsável: agente `arquiteto`.
Status: itens 1, 2 e 3 adotados; itens 4, 5 e 6 PENDENTES de decisão ou autorização do dono.

Documentos de origem:
- Revisão de conteúdo: [conteudo-entrega-a-revisao.md](../handoffs/conteudo-entrega-a-revisao.md)
- ADR 004: [004-reconstrucao-fitnez-e-push.md](004-reconstrucao-fitnez-e-push.md)

## 1. Deload: opção A (ADOTADA)

Contexto: a especificação (seção 3) manda ler séries e repetições da coluna do bloco anterior no deload. O código (`src/domain/workout.ts`) usa metade das séries do bloco corrente e repetições do bloco anterior. Divergem na semana 7 (supino: 2 contra 3 séries). A revisão recomendou manter o código.

Decisão: opção A. No deload, séries = metade (arredondada para cima) das séries do bloco corrente; repetições = as do bloco anterior (semana 3 usa B1).

Consequências:
- O código fica como está; a especificação seção 3 deve ser emendada para dizer isso (tarefa do `arquiteto`/dono da especificação).
- Semana 7 do supino = 3 séries, '5–8'; o plano de implementação já assume isso.
- Teste do `qa-testes` deve fixar os valores das semanas 3, 7 e 11 para evitar regressão.
- Segue o legado, que usa as séries do bloco corrente.

## 2. Medidas: coxa e quadril (ADOTADA)

Contexto: o legado guardava medidas com chaves `p`, `c`, `b`, `t`. O dono quer acompanhar também o quadril.

Decisão: o app guarda coxa e quadril. Chaves legadas mantidas (`p`, `c`, `b`, `t`); nova chave `q` para quadril.

Consequências:
- Campo opcional dentro do v3, como no ADR 004 (b): sem novo número de versão e sem migração; registros antigos sem `q` continuam válidos.
- A validação em `src/data/validation.ts` e a importação do legado devem aceitar `q` e preservá-la na ida e volta do backup.
- Interface de Evolução/Perfil ganha o campo quadril; testes cobrem registro sem `q`.

## 3. Perfil pessoal fora do código e do git (ADOTADA)

Contexto: o repositório é público (https://github.com/caua-manuel/fitnez). Nome, idade, peso e altura do dono são dados pessoais de saúde.

Decisão: esses dados nunca entram no código, em testes, em fixtures ou no git. Ficam só no aparelho, em `settings.profile` (IndexedDB), preenchidos pelo próprio app ou importados de um arquivo de backup pessoal ignorado pelo git (`perfil-pessoal*`, `*.local.json` no `.gitignore`). O peso alimenta a meta de proteína (2,4 g/kg) por `src/domain/profile.ts`, função pura que recebe o peso como parâmetro.

Consequências:
- `devops-github` inclui os padrões no `.gitignore` e uma verificação de CI/pré-commit contra esses arquivos.
- Testes usam valores fictícios, nunca os reais do dono.
- Sem perfil preenchido, a meta de proteína não é calculada; a interface pede o peso.
- O `seguranca-privacidade` confere o histórico e os exemplos antes de qualquer publicação.

## 4. Licença do repositório (PENDENTE)

Contexto: repositório público sem licença definida.

Opções:
- **MIT (recomendada).** Licença permissiva: qualquer pessoa pode usar, copiar, modificar e redistribuir o código, inclusive em projetos fechados. Só é obrigatório manter o aviso de copyright e o texto da licença. Não há garantia: o autor não responde por problemas no uso. É curta e a mais comum em projetos pequenos.
- Sem licença: todos os direitos reservados; ninguém pode reutilizar o código legalmente, mesmo estando visível.
- GPL: exige que trabalhos derivados também sejam publicados abertos, com a mesma licença.

Decisão: pendente do dono. Consequências: até decidir, nenhum arquivo `LICENSE` é criado. Com MIT, `devops-github` adiciona `LICENSE` (nome do titular a indicar pelo dono) e o campo `license` no `package.json`. Atenção: o aviso de copyright leva um nome, então o dono decide se usa o nome real ou o usuário do GitHub (item 3 vale para esse caso).

## 5. Publicação no GitHub Pages (PENDENTE de autorização)

Contexto: nada é publicado sem autorização do dono (AGENTS.md; ADR 004).

Decisão: pendente. Quando autorizada, o caminho base muda de `/Projeto-Treino/` para `/fitnez/`.

Consequências (tarefa do `devops-github`):
- O workflow `.github/workflows/pages.yml` define `VITE_BASE_PATH=/fitnez/`.
- Service worker (escopo e precache) e `manifest` (`start_url`, `scope`, ícones) usam a nova base; nada de caminho fixo escrito à mão.
- Verificar offline e instalação após o build com a nova base; conferir a CSP.
- Sem autorização, nenhum push nem publicação.

## 6. "Apagar todos os meus dados" no Perfil (PENDENTE)

Contexto: dados de saúde só no aparelho; o dono pode querer limpar tudo.

Recomendação: oferecer o botão com confirmação dupla (por exemplo, segunda tela exigindo digitar uma palavra) e oferecer antes uma cópia de recuperação (exportação do backup). Apagar limpa o IndexedDB, caches do service worker e preferências.

Decisão: pendente do dono. Consequências se aprovada: ação em `src/data` atrás da interface `Repository`, teste de que nada resta após apagar, e texto claro de que a ação é irreversível sem a cópia.

## Decisões que o dono ainda precisa tomar
1. Licença: recomendo MIT.
2. Autorizar a publicação no GitHub Pages em `/fitnez/`: recomendo autorizar quando a Entrega A for aprovada.
3. Botão "Apagar todos os meus dados": recomendo incluir, com confirmação dupla e cópia de recuperação.
4. Nome no aviso de copyright, se escolher MIT: recomendo o usuário do GitHub, para não expor o nome real.
