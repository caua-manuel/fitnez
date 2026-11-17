# ADR 007 — Metas de dieta editáveis

Data: 16/11/2026. Responsável: agente `conteudo-treino-nutricao`.
Status: ADOTADA (camada de regras e dados implementada e testada por `backend-dados` em 16/11/2026, ver [dados-metas-editaveis.md](../handoffs/dados-metas-editaveis.md); a interface fica com `frontend`). Decisões do dono assumidas (reversíveis): nova meta vale a partir de hoje; limiares de saúde mantidos e marcados "a verificar"; quem já usa o app vê "Meta de exemplo" uma vez.

Documentos de origem:
- Especificação completa: [conteudo-metas-editaveis.md](../handoffs/conteudo-metas-editaveis.md)
- Achado B3: [seguranca-limpeza-publica.md](../handoffs/seguranca-limpeza-publica.md)
- ADR 002: [002-armazenamento-local-migracao-backup.md](002-armazenamento-local-migracao-backup.md)

## Contexto

O app será publicado para qualquer pessoa usar. Hoje as metas diárias são fixas e pressupõem um perfil específico: kcal e carboidrato por tipo de dia e água em `src/domain/diet.ts`; proteína, gordura e g/kg em `src/domain/profile.ts`. Só a proteína varia, pelo peso do perfil. Quem usa pela primeira vez não consegue ajustar o resto, e a tela não diz que os valores são de exemplo.

## Decisão

1. Tornar editáveis: kcal e carboidrato por tipo de dia (perna, academia, jiu-jitsu, vôlei, descanso), proteína (automática pelo peso ou manual), gordura e água (múltiplos de 0,5 L). Derivados e nunca salvos: kcal dos macros (4/4/9), tolerância, copos de água.
2. **Nenhum número atual muda.** Os valores padrão são exatamente os de hoje (2600/340, 2450/305, 2500/315, 2500/315, 2100/215; proteína 2,4 g/kg ou 185 g; gordura 55 g; água 3 L). Motivo: o plano é um conteúdo já revisado e aprovado; esta decisão trata de permitir a edição e de rotular o padrão como exemplo, não de reavaliar nutrição. Mudar números exigiria nova revisão de conteúdo e quebraria a regressão dos testes e os cálculos de dias já registrados. O carboidrato é guardado por valor (e não calculado como "o restante") justamente para não alterar números: o cálculo daria, por exemplo, 304 g na academia em vez de 305 g.
3. Enquanto não houver edição ou confirmação, o app mostra "Meta de exemplo". Salvar uma edição ou tocar em "Usar esta meta" remove o selo. "Restaurar padrão" acrescenta ao histórico uma versão que volta ao exemplo, com desfazer.
4. Limites absolutos bloqueiam o salvamento: kcal 1000 a 6000; proteína 20 a 400 g; carboidrato 0 a 800 g; gordura 20 a 300 g; água 1 a 6 L em passos de 0,5. Avisos que não bloqueiam: kcal fora de 1400 a 4500; proteína fora de 0,8 a 3,0 g/kg (com peso); gordura abaixo de 30 g; água acima de 5 L; kcal incoerente com a proteína, o carboidrato e a gordura além de `max(100, 5% das kcal)`. Os limites são regras de sanidade do produto; as faixas de aviso ligadas à saúde estão marcadas como "a verificar". Nenhum estudo foi conferido.
5. Dias passados preservam a meta do momento, por histórico de versões com data de vigência (`from`), em vez de usar sempre a meta atual ou de copiar a meta em cada dia. Funciona também para dias sem registro, não reescreve a história e segue o precedente de `consumed`.
6. Formato: campo opcional `settings.dietTargets` com `schema: 1` e lista de até 100 versões; ausente significa meta de exemplo. A versão do estado continua 3: backups v1, v2 e v3 existentes importam sem conversão. Estreitar limites no futuro exige migração.
7. O texto de saúde acompanha a edição: as metas são estimativas, o app não substitui nutricionista ou médico, e a pessoa deve procurar um profissional diante de condição de saúde, sintomas ou dor persistente.

## Consequências

- Novo módulo puro de metas (resolução por data, validação, coerência) e novos testes; `dayTargetForProfile` vira invólucro do caso sem edição. A regressão "sem edição, nada muda" é um teste obrigatório.
- A validação de importação passa a checar `settings.dietTargets`; backup com valor fora dos limites é rejeitado.
- Backup novo aberto em versão anterior do app ignora o campo e o perde se for exportado de novo ali; aceito, sem bump de versão.
- Quem já usa o app também vê "Meta de exemplo" até confirmar; é inofensivo.
- A proteína automática dos dias passados continua usando o peso atual (comportamento de hoje).
- A revisão semanal continua só sugerindo; aplicar a sugestão à meta fica para depois.
- Decisão de interface: a folha mostra um aviso de saúde compacto ("estimativas e valores de exemplo; o app não substitui nutricionista ou médico; converse com um profissional") e deixa o texto completo da seção 3.1 atrás de "Saiba mais".
- `docs/ESPECIFICACAO.md` (seção 4) deve ganhar uma nota de que as metas são valores de exemplo editáveis.

## Decisões que o dono ainda precisa tomar

1. Aplicar a nova meta só a partir de hoje (recomendado) ou também retroativamente na semana corrente. Recomendo só a partir de hoje.
2. Aprovar os limites de aviso de saúde ou revisá-los com nutricionista antes de divulgar. Recomendo manter e revisar depois.
3. Aceitar que quem já usa o app veja "Meta de exemplo" uma vez até tocar em "Usar esta meta". Recomendo que sim.
