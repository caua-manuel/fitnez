# Fase 1 — fundação entregue

Data: 12/11/2026. Stack: React + TypeScript + Vite, com CSS próprio.
Status: concluída no escopo de fundação, validada por QA e revisão de segurança.
Aguardando o teste manual e o aval do usuário; Fase 2 não iniciada.

## O que ficou pronto

- Oito agentes personalizados em `.codex/agents/`, com exatamente `name`,
  `description` e `developer_instructions`, sem override de modelo/raciocínio.
  Instruções centralizadas em `AGENTS.md`; referências e textos obsoletos
  corrigidos nos documentos próprios e nas definições dos agentes.
- Aplicação React com seis abas consultáveis, navegação por fragmento, temas
  claro/escuro/automático, CSS próprio e padrões do protótipo reconciliados em
  `DESIGN.md`. Registro de séries, CRUD e regras novas pertencem às fases futuras.
- IndexedDB local, migração dos formatos v1/v2, seleção de fontes conflitantes,
  preservação de originais, backup JSON, prévia/confirmar/cancelar importação,
  recuperação transacional, pedido de persistência e lembrete semanal de backup.
- PWA nativa com precache completo, aviso de atualização e CSP de produção.
  Reabertura offline e preservação de dados em falha foram testadas em Chromium.
- Build e verificação do artefato nas bases `/` e `/Projeto-Treino/`; CI e fluxo
  Pages configurados para enviar somente `dist/`, com base real calculada em CI.
  Nenhum commit, push, execução remota do CI ou publicação foi realizado.

## Verificação final

| Verificação | Resultado observado |
| --- | --- |
| `npm.cmd run check` | exit 0; 3 testes de configuração, TypeScript, 35 testes de dados, build e verificação de artefato |
| `npm.cmd run test:e2e` | exit 0; 17/17 em Chromium headless, produção com CSP e service worker reais |
| Total de casos | 55 passaram nas três suítes |
| Console e página | Nenhum `console.error` ou `pageerror`, incluindo páginas secundárias |
| Layout | Seis rotas em 360 e 1280 px, claro/escuro; sem overflow horizontal; quatro capturas de Mais inspecionadas |
| Restauração | Prévia não grava; falha injetada entre writes mantém state e store físico recovery, inclusive após recarregar |
| Offline | Seis rotas, reload e nova página sem rede após precache e controlador prontos |
| Dependências | Vite 8.3.8 e Vitest 5.1.0 fixados; `npm audit` exit 0 e zero vulnerabilidades conhecidas na consulta final do DevOps |
| Artefato | Nove arquivos/URLs de precache verificados; somente shell, manifesto, ícones e bundles |
| Arquivos protegidos | Seis hashes de legacy/sementes coincidentes com a Fase 0 |
| Agentes | Oito TOMLs com os três campos exigidos e corpo equivalente ao Markdown sem cabeçalho |
| Preview | HTTP 200 em `http://127.0.0.1:4173/Projeto-Treino/` na conferência final |

Os testes foram escritos e executados pelos agentes responsáveis. A coordenação
revisou as entregas, capturas, estrutura dos agentes, hashes e disponibilidade do
preview. Resultados completos e limitações: [QA](handoffs/qa-fase1.md) e
[segurança](handoffs/seguranca-fase1.md).

## Defeitos encontrados e resolvidos

1. A resposta explícita de persistência negada podia desaparecer no refresh;
   o frontend passou a preservar o resultado real da solicitação.
2. Recuperação acumulada podia gerar backup anunciado como válido que o próprio
   importador recusava. Dados agora valida representação integral antes do commit
   e prova restauração em banco vazio antes de anunciar exportação bem-sucedida;
   recusas não alteram estado, recuperação, revisão ou data de geração.
3. Prévias privadas antigas eram retidas; agora somente a última tentativa pode
   fornecer token válido. Origens legadas todas inválidas têm marcador explícito
   e continuam permitindo importação corretiva, com brutos e avisos preservados.
4. `Vary: Origin` no preview fazia JS/CSS faltar falsamente no cache offline.
   O SW usa URL normalizada e ignora Vary somente para recursos exatos do precache,
   após verificar GET/origem/base. O teste offline vermelho passou sem relaxar
   servidor, CSP ou testes e integra a rodada final.

## Testar no celular

1. Mantenha computador e celular na mesma rede. O preview local foi deixado
   ativo na porta 4173; não inicie outra instância enquanto estiver funcionando.
2. Abra `http://<IPv4-local>:4173/Projeto-Treino/` no celular (IPv4 de `ipconfig`). Confira as seis abas e, em Mais, os temas.
3. Baixe um backup e teste a prévia de importação com uma cópia de teste.
   Cancelar não substitui dados; confirmar exige ação explícita e preserva
   recuperação local. Nunca use sua única cópia para experimentar.

HTTP na rede local permite testar layout/controles. Offline e instalação no
celular dependem de origem segura e serão conferidos no endereço HTTPS após
publicação autorizada. No computador, `http://localhost:4173/Projeto-Treino/`
permite conferir a PWA agora: espere “Disponível offline” e corte a conexão.
Se o preview parar, os comandos operacionais estão em [INICIO](../INICIO.md);
publicação, bases e condições de acesso estão em [PUBLICACAO](PUBLICACAO.md).
Não há URL pública nova nesta entrega.

## Dados e limites conhecidos

- `legacy/` e `data/plan.json`, `diet.json`, `recipes.json` ficaram intactos.
  Nenhum histórico real do aparelho foi acessado ou enviado a serviço externo.
  Os testes usam contextos descartáveis e dados sintéticos identificados.
- O novo app usa versão lógica v3 e banco físico 1. Migração preserva as chaves
  legadas sem sobrescrevê-las; originais e campos desconhecidos ficam recuperáveis.
  Edições futuras do catálogo não devem apagar histórico. Sem banco externo/login.
- O formato tem limite de 10 MiB UTF-8, 64 níveis e 200 mil nós para o pacote
  completo. Recuperação integral cresce após restaurações repetidas; uma nova
  importação/reexportação pode ser recusada por capacidade. Nenhum original é
  truncado para caber. Backup anunciado como válido foi provado restaurável em
  fundação vazia; um destino ocupado pode recusar para preservar seus dados atuais.
- Não foram testados backup real do usuário, Safari/iPhone físico, instalação
  pelo menu, leitor de tela, auditoria completa de contraste, quota física real
  ou transição entre dois builds para o aviso de atualização. Falhas de quota
  foram injetadas em IndexedDB real e simulado; isso não equivale a encher o disco.
- Git ainda não foi inicializado, portanto histórico de segredos e CI remoto não
  puderam ser verificados. A revisão de privacidade antes da publicação deve
  considerar documentos pessoais no repositório, além do artefato público.

## Agentes e próximas etapas

Arquitetura, dados, conteúdo, UX, frontend, QA, segurança e DevOps foram entregues
por agentes reais; as escritas de produto foram coordenadas por dono, com revisões
em paralelo. Uma primeira tentativa sem spawn foi bloqueada e superada depois;
essa tentativa não é o estado atual da entrega. Handoffs em `docs/handoffs/`.

A única próxima autorização aguardada é o aval do usuário após testar a Fase 1.
Não iniciar Fase 2 nem publicar enquanto não houver pedido correspondente.
