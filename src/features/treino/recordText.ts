import { roundHalf } from '../../domain/records';
import type { SetRecord } from '../../domain/records';
import { formatKg } from './util';

/** Texto do recorde na hora (contrato conteudo-aval-ondas-hevy, seção 2). */
export function recordLine(r: SetRecord): string {
 if (r.type === 'maxKg') return `Recorde de carga: ${formatKg(r.kg)} kg × ${r.reps}`;
 if (r.type === 'maxE1rm') return `Recorde: 1RM estimado ${formatKg(roundHalf(r.e1rm ?? 0))} kg`;
 return `Recorde de repetições: ${formatKg(r.kg)} kg × ${r.reps}`;
}

/** Item curto do Concluído: "Supino 62,5 kg", "Remada 1RM est. 58 kg". */
export function recordShort(name: string, r: SetRecord): string {
 if (r.type === 'maxE1rm') return `${name} 1RM est. ${formatKg(roundHalf(r.e1rm ?? 0))} kg`;
 return r.type === 'maxKg' ? `${name} ${formatKg(r.kg)} kg` : `${name} ${formatKg(r.kg)} kg × ${r.reps}`;
}
