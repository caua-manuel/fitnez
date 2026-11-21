import type { SetEntry } from '../../domain/workout';

// Texto único que o leitor de tela ouve a cada série (docs/handoffs/ux-auditoria-fase-3.md, correção 3).
// Só apresentação: os valores vêm prontos da série registrada. Função pura.

const num = (v: string) => v.replace('.', ',');

/** "1 min 30 s", "45 s", "2 min". */
export function restText(sec: number): string {
 const s = Math.max(0, Math.round(sec)), m = Math.floor(s / 60), r = s % 60;
 return m === 0 ? `${r} s` : r === 0 ? `${m} min` : `${m} min ${r} s`;
}

/** Valores da série por extenso, conforme a medida do exercício. */
export function setValuesText(m: string, s: Pick<SetEntry, 'kg' | 'reps'>): string {
 const reps = s.reps, kg = s.kg;
 if (m === 's') return `${reps} segundos`;
 if (m === 'rep') return `${reps} repetições`;
 if (m === 'kgs') return kg ? `${num(kg)} kg, ${reps} segundos` : `${reps} segundos`;
 if (m === 'bw') return kg ? `${num(kg)} kg extras, ${reps} repetições` : `${reps} repetições`;
 return kg ? `${num(kg)} kg, ${reps} repetições` : `${reps} repetições`;
}

/** "Série 2 registrada: 32,5 kg, 5 repetições. Recorde de carga: 32,5 kg × 5. Descanso de 1 min 30 s." */
export function setAnnouncement(input: { warm: boolean; n: number; m: string; set: Pick<SetEntry, 'kg' | 'reps'>; record?: string | null; restSec?: number | null }): string {
 const who = input.warm ? `Aquecimento ${input.n}` : `Série ${input.n}`;
 const parts = [`${who} registrad${input.warm ? 'o' : 'a'}: ${setValuesText(input.m, input.set)}.`];
 if (input.record) parts.push(`${input.record}.`);
 if (input.restSec && input.restSec > 0) parts.push(`Descanso de ${restText(input.restSec)}.`);
 return parts.join(' ');
}
