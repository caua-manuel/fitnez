# Dados — correção de recuperação da Fase 1

Responsável: agente real backend_dados. Data: 12/11/2026. Janela exclusiva autorizada pelo coordenador após entrega do devops. Skills consultadas: Superpowers, depuração sistemática, TDD, verificação antes de conclusão e skill de backend (Supabase não se aplica ao adaptador local).

## Alterações

- `src/data/capacity.ts`: orçamento baseado no pacote JSON completo (10 MiB UTF-8, 64 níveis, 200 mil nós), montador único de restauração e prova de restauração em banco vazio antes de exportar.
- `commit`: lê snapshot consistente, prepara/valida tudo antes de abrir transação de escrita; confere a revisão novamente dentro da transação. A gravação de recuperação e estado permanece atômica. Não há truncamento.
- `save`: também prova capacidade da exportação futura com reserva conservadora para revisão/timestamps; exportação não registra geração em falhas da prova.
- `confirmImport`: orçamento inclui estado recebido, brutos e cópia integral anterior. Recusa preserva estado, recovery e revisão. O candidato não é recalculado a partir da UI.
- Prévia privada única: nova tentativa, mesmo inválida, invalida tokens anteriores; tentativa concorrente antiga não repopula o armazenamento de prévias.
- `migrationStatus` opcional aditivo: none/completed/pending/invalid. Todas inválidas conservam bruto+avisos e `migrationCompleted=false`; somente conflito com fontes pendentes bloqueia importação. Importação corretiva resolve o marcador. Formato lógico v3 e físico 1 preservados, sem nova dependência.

## Evidências

Primeira execução: 4 regressões falharam como esperado (save de 6 MiB, importação acima da capacidade integral, tokens antigos e fontes todas inválidas), com 27 testes existentes passando. Depois da implementação: `npm.cmd run typecheck` exit 0 e `npm.cmd test` exit 0, 35/35 testes passando (1 arquivo), verificação final em 12/11/2026. Fixtures integralmente sintéticos, sem dados reais de saúde.

Cobertura acrescentada: 6 MiB por save; v3 abaixo do limite de entrada mas acima da capacidade de restauração; exportação de origem legada grande recusada sem marcar geração; profundidade e nós acima do limite apenas após anexar recuperação; cada backup anunciado em sequência restaura em banco vazio; reexportação futura esgotada não altera nada; reabertura de origens todas inválidas e importação corretiva; tokens substituídos/invalidáveis. Permanecem testes de aborto real entre writes, revisão entre instâncias e integridade dos brutos.

## Limites e entrega

Recuperação integral cresce em restaurações sucessivas. Uma importação ou reexportação futura pode ser recusada por capacidade, com originais preservados e erro útil. Banco vazio significa fundação nova sem dados legados adicionais; um destino já ocupado pode recusar importação para preservar seu anterior. Deduplicação exige projeto/versionamento posterior. Estado preexistente acima do orçamento segue legível, sem promessa de exportação inválida. Nenhum ajuste de UI/build/legacy/sementes, regra de treino/dieta, commit, push ou publicação. QA deve rebuildar dist e verificar integração/navegadores; esta entrega não afirma teste físico no celular.
