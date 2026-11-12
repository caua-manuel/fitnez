# Entrega do papel backend-dados — Fase 0

Data: 11/11/2026. Execução: papel simulado sequencialmente pelo orquestrador,
sem ferramenta de subagentes disponível.

## Entregue

- [ADR 002](../decisoes/002-armazenamento-local-migracao-backup.md): contrato de
  armazenamento, esquema IndexedDB, migração das duas chaves, backups,
  restauração atômica, persistência e lembrete semanal.
- Separação entre catálogo e histórico, preservação de originais, tratamento
  de conflito entre abas e registros órfãos.
- Matriz de testes a executar na Fase 1, sem declarar testes de migração já feitos.

## Evidências verificadas

As três sementes são JSON válido. Há 38 exercícios, quatro sessões, cinco
refeições com três opções e 11 receitas; referências resolvem e os conteúdos
coincidem com o catálogo padrão embutido no protótipo. Não foram acessados
históricos do aparelho, dados de conta ou serviços externos de armazenamento.

## Lacunas para implementação

- O kit não contém backup real v1/v2. Preparar fixtures sintéticos claramente
  identificados e validar com cópias reais anônimas antes de liberar migração.
  Não publicar backups pessoais no repositório.
- Endereço atual do protótipo e endereço final Pages não foram informados.
  A estratégia cobre mesma origem e importação de backup entre origens;
  confirmar o cenário ao preparar o deploy, sem bloquear a escolha da stack.
- Não foram executados testes de navegador, persistência, quota ou importação:
  a camada de dados ainda não existe. Não há fase de código concluída.

## Próximo responsável

Após a escolha da stack, arquiteto e backend-dados detalham o contrato para a
Fase 1; frontend implementa estados de salvamento e recuperação, QA valida
migrações e DevOps testa o build estático com a PWA.
