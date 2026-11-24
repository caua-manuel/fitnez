import type { Repository, StateV3 } from '../../application/repository';
import { undoOnboarding } from '../../application/onboarding';

/**
 * Um desfazer só (ADR 013): volta o cardápio gerado, se houver, e depois o plano do assistente.
 * O cardápio só tem desfazer quando foi gerado na última aplicação (applyOnboarding troca o bloco `onboarding`).
 */
export async function undoAssistantPlan(repository: Repository): Promise<StateV3> {
 const gd = await import('../../application/generatedDiet');
 let s = await repository.read();
 if (gd.canUndoGeneratedDiet(s)) s = await gd.undoGeneratedDiet(repository, { expectedRevision: s.revision });
 return undoOnboarding(repository, { expectedRevision: s.revision });
}
