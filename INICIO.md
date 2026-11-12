# Treino 12 semanas

Stack aprovada: React + TypeScript + Vite, com CSS próprio. O app é estático,
sem login, backend ou banco externo. Os dados ficam no aparelho, em IndexedDB,
com exportação e restauração por JSON.

## Situação da entrega

A Fase 1 cria a fundação: seis abas consultáveis, temas, migração dos dados do
protótipo, backup, proteção e PWA. Registro de séries, CRUD de treinos,
progressão e cálculos novos pertencem às próximas fases. Consulte
[FASE-1](docs/FASE-1.md) para o resultado da coordenação e os testes finais.
Esse relatório é atualizado após QA e segurança; não basta existir o código.

## Testar no computador

Com Node 24 instalado, na pasta do projeto, execute no PowerShell:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run preview
```

Abra `http://localhost:4173/Projeto-Treino/`. Para testar offline no computador,
espere “Disponível offline” e então desconecte a rede ou use o modo offline do
navegador. Para desenvolvimento, use `npm.cmd run dev` na porta 5173; esse modo
não registra o service worker.

## Testar no celular

1. Deixe o computador com `npm.cmd run preview` aberto e conecte o celular ao
   mesmo Wi-Fi/rede local.
2. Abra `http://<IPv4-local>:4173/Projeto-Treino/`, usando o IPv4 Ethernet/Wi-Fi
   mostrado por `ipconfig`.
3. Confira as seis abas e, em Mais, os temas, o download de backup e a prévia
   de importação. Para testar importação, use uma cópia de teste; confirmar
   substitui os dados ativos e preserva recuperação local.

O endereço HTTP da rede local serve para conferir layout e controles. Acesso
offline, instalação e clipboard podem exigir HTTPS no celular; serão testados
no endereço Pages depois da publicação autorizada. Não foi criada URL pública.
Se a rede/firewall bloquear a porta, não desative proteções; informe o erro.

## Agentes e documentos

| Local | Uso |
| --- | --- |
| `AGENTS.md` | Fonte central das regras para o Codex |
| `.codex/agents/` | Oito agentes TOML reais do Codex, sem override de modelo |
| `.claude/agents/` | Definições equivalentes para Claude Code |
| `agents/` | Skills por categoria e recursos locais |
| `DESIGN.md` | Tokens e padrões visuais atuais |
| `docs/decisoes/` | Decisões técnicas e contratos |
| `docs/handoffs/` | Entregas e evidências de cada agente |
| `data/` | Sementes preservadas do plano, dieta e receitas |
| `legacy/` | Protótipo preservado como referência |

Somente a Fase 1 está autorizada. Agentes reais são obrigatórios; o orquestrador
revisa e integra. Não avançar para outra fase sem aval. Não fazer commit, push
ou publicação nesta tarefa. As instruções do Claude apontam para `AGENTS.md`.

## Publicação e dados

O fluxo está preparado em `.github/workflows/pages.yml`, mas não foi executado
no GitHub. O passo a passo está em [Publicação e operação](docs/PUBLICACAO.md).
Somente `dist/` é enviado ao Pages. Antes de disponibilizar o repositório
público, revisar os dados pessoais presentes na especificação; excluir arquivos
do artefato não os torna privados no repositório.

Para trocar de aparelho ou de origem/endereço, exporte no app antigo e importe
no novo. Limpar os dados do navegador pode apagar os registros. Persistência e
instalação não substituem uma cópia externa de backup. Treino e dieta contêm
estimativas e não substituem acompanhamento profissional.
