# Handoff — backend_dados — Fase 1

Agente real backend_dados; escrita sequencial encerrada. Próximo dono pode avançar.

- Implementados contratos em src/application/repository.ts e createRepository em src/data/index.ts; auxiliares idb.ts, migration.ts e validation.ts. IndexedDB nativo, banco treino12:<base codificada>, stores state/recovery; commit real antes de saved, revisão e fila local, BroadcastChannel/foco e versionchange sem apagar banco.
- Estado lógico v3 separa catálogo/histórico/snapshots/recuperação. Migração v1/v2/tema preserva brutos, desconhecidos, órfãos, vírgulas, séries extras, dieta e catálogo personalizado; opt só preenche over ausente. Conflito persiste após reabrir e exige selectMigration, sem timestamp; localStorage somente leitura.
- Importação legada/v3 com limites, validação profunda, datas reais, chaves perigosas e versões futuras; preview privado vinculado à revisão. Restore guarda anterior e substitui no mesmo commit; aborto/quota desfaz os dois. Exportação consistente, geração/confirmar backup distintos, lembrete de sete dias/relógio futuro e StorageManager com feature detection.
- API pública segue docs/CONTRATOS-FASE-1.md sem alteração de assinatura. Tipos preservam campos adicionais; RepositoryError exportado pelo módulo de contratos. UI usa read + save com expectedRevision e escuta eventos; initialize pode devolver migration-conflict. Não chamar APIs de armazenamento na UI.

## Evidências reais

- Primeiro npm.cmd test: vermelho pela ausência do módulo ainda não implementado.
- Primeira suíte após implementação: 18/18 passaram; typecheck exit 0.
- Ampliação reproduziu dois bugs: RangeError para data impossível e anexos no invólucro v3 aceitos. Corrigidos, testes correspondentes ficaram verdes.
- Verificação final: npm.cmd run typecheck exit 0; npm.cmd test exit 0, 27/27 testes em tests/integration/repository.test.ts. Inclui falha entre writes por QuotaExceededError no fake-indexeddb, rollback integral observado por releitura; falha na migração seguida de retry; conflito/reabertura/idempotência; catálogo customizado; limites; preview obsoleto; roundtrip e relógio controlado.
- Fixtures explicitamente SINTÉTICOS. Kit não contém backup real de usuário. Browser/Playwright/quota real/Safari físico ficam na verificação QA; fake-indexeddb não equivale a esses dispositivos.
- Nenhuma alteração legacy/, data/*.json, skills, configs de outros donos; nenhuma regra de treino/dieta, fotos, serviço externo, commit, push ou publicação. Build da aplicação aguarda frontend, sem stub criado para ocultar essa pendência.
