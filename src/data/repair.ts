import type { StateV3 } from '../application/repository';
import { checkStoredProfile } from '../domain/profile';
import { clone } from './validation';

// Leitura tolerante de estado já salvo (ADR 002: nunca perder dado em silêncio).
// Antes de a validação cobrir `settings.profile`, um backup malformado podia gravar um perfil que derruba a interface
// (por exemplo nome que não é texto). Em vez de recusar o banco inteiro (o que impediria até o backup), cada campo
// inválido do perfil volta ao padrão (nome e objetivo vazios, número ausente) e o perfil original fica guardado em
// `recovery['invalid-profile:<instante>']`. Nada mais é alterado. Função pura: devolve cópia e não toca no armazenamento.
export function repairStoredState(state: StateV3, time: number): { state: StateV3; repaired: boolean } {
 const profile = (state.settings as { profile?: unknown } | undefined)?.profile;
 if (profile === undefined) return { state, repaired: false };
 const errors = checkStoredProfile(profile);
 const keys = Object.keys(errors);
 if (!keys.length) return { state, repaired: false };
 const next = clone(state);
 const original = clone(profile);
 if (errors.profile) delete next.settings.profile;
 else {
  const fixed = next.settings.profile as Record<string, unknown>;
  for (const key of keys) { if (key === 'name' || key === 'goal') fixed[key] = ''; else delete fixed[key]; }
  // Campos extras que não são parte do perfil conhecido são preservados como estão.
 }
 let id = `invalid-profile:${time}`; for (let n = 2; next.recovery[id]; n++) id = `invalid-profile:${time}:${n}`;
 next.recovery = { ...next.recovery, [id]: { kind: 'invalid-profile', createdAt: time, fields: keys, profile: original } };
 return { state: next, repaired: true };
}
