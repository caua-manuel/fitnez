import { describe, expect, it } from 'vitest';
import { RIR, WEEK_NOTES, addDays, mondayOf, phaseOf, weekLabel } from '../../src/domain/calendar';

describe('calendário do plano', () => {
 it('normaliza para a segunda', () => { expect(mondayOf('2026-11-18')).toBe('2026-11-16'); expect(mondayOf('2026-11-16')).toBe('2026-11-16'); expect(mondayOf('2026-11-22')).toBe('2026-11-16'); });
 it('pré-semana', () => { expect(phaseOf('2026-11-16', '2026-11-15')).toEqual({ kind: 'pre', daysUntil: 1 }); });
 it('primeiro dia', () => { expect(phaseOf('2026-11-16', '2026-11-16')).toMatchObject({ kind: 'week', idx: 0, week: 0, weekday: 0, block: 1, deload: false, rir: '3', progress: 1 / 12 }); });
 it('deload na semana 4', () => { expect(phaseOf('2026-11-16', '2026-12-07')).toMatchObject({ week: 3, deload: true, rir: '4', block: 1 }); expect(weekLabel(3)).toBe('Semana 04 de 12'); });
 it('última semana e conclusão', () => { expect(phaseOf('2026-11-16', '2027-02-07')).toMatchObject({ kind: 'week', week: 11, idx: 83, block: 3, deload: true, progress: 1 }); expect(phaseOf('2026-11-16', '2027-02-08')).toEqual({ kind: 'done' }); });
 it('início numa quarta equivale à segunda', () => { expect(phaseOf('2026-11-18', '2026-11-17')).toEqual(phaseOf('2026-11-16', '2026-11-17')); expect(phaseOf('2026-11-18', '2026-11-15')).toEqual(phaseOf('2026-11-16', '2026-11-15')); });
 it('virada de ano e de meia-noite', () => { expect(addDays('2026-12-31', 1)).toBe('2027-01-01'); expect(addDays('2026-03-01', -1)).toBe('2026-02-28'); expect(phaseOf('2026-11-16', '2026-11-22')).toMatchObject({ week: 0, weekday: 6 }); expect(phaseOf('2026-11-16', '2026-11-23')).toMatchObject({ week: 1, weekday: 0 }); });
 it('progresso, notas e RIR', () => { for (let w = 0; w < 12; w++) { const p = phaseOf('2026-11-16', addDays('2026-11-16', w * 7)); expect(p).toMatchObject({ week: w, progress: (w + 1) / 12, rir: RIR[w] }); } expect(RIR).toHaveLength(12); expect(Object.keys(WEEK_NOTES).map(Number)).toEqual([5, 6, 11]); expect(phaseOf('2026-11-16', addDays('2026-11-16', 35))).toMatchObject({ note: WEEK_NOTES[5] }); });
});
