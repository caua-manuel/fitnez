import { describe, expect, it } from 'vitest';
import { CHRISTMAS_NOTE, NEW_YEAR_NOTE, RIR, WEEK_NOTES, addDays, mondayOf, phaseOf, weekLabel, weekNoteOf } from '../../src/domain/calendar';

describe('calendário do plano', () => {
 it('normaliza para a segunda', () => { expect(mondayOf('2026-11-18')).toBe('2026-11-16'); expect(mondayOf('2026-11-16')).toBe('2026-11-16'); expect(mondayOf('2026-11-22')).toBe('2026-11-16'); });
 it('pré-semana', () => { expect(phaseOf('2026-11-16', '2026-11-15')).toEqual({ kind: 'pre', daysUntil: 1 }); });
 it('primeiro dia', () => { expect(phaseOf('2026-11-16', '2026-11-16')).toMatchObject({ kind: 'week', idx: 0, week: 0, weekday: 0, block: 1, deload: false, rir: '3', progress: 1 / 12 }); });
 it('deload na semana 4', () => { expect(phaseOf('2026-11-16', '2026-12-07')).toMatchObject({ week: 3, deload: true, rir: '4', block: 1 }); expect(weekLabel(3)).toBe('Semana 04 de 12'); });
 it('última semana e conclusão', () => { expect(phaseOf('2026-11-16', '2027-02-07')).toMatchObject({ kind: 'week', week: 11, idx: 83, block: 3, deload: true, progress: 1 }); expect(phaseOf('2026-11-16', '2027-02-08')).toEqual({ kind: 'done' }); });
 it('início numa quarta equivale à segunda', () => { expect(phaseOf('2026-11-18', '2026-11-17')).toEqual(phaseOf('2026-11-16', '2026-11-17')); expect(phaseOf('2026-11-18', '2026-11-15')).toEqual(phaseOf('2026-11-16', '2026-11-15')); });
 it('virada de ano e de meia-noite', () => { expect(addDays('2026-12-31', 1)).toBe('2027-01-01'); expect(addDays('2026-03-01', -1)).toBe('2026-02-28'); expect(phaseOf('2026-11-16', '2026-11-22')).toMatchObject({ week: 0, weekday: 6 }); expect(phaseOf('2026-11-16', '2026-11-23')).toMatchObject({ week: 1, weekday: 0 }); });
 it('progresso, notas e RIR', () => { for (let w = 0; w < 12; w++) { const p = phaseOf('2026-11-16', addDays('2026-11-16', w * 7)); expect(p).toMatchObject({ week: w, progress: (w + 1) / 12, rir: RIR[w] }); } expect(RIR).toHaveLength(12); expect(WEEK_NOTES).toEqual({ 11: 'Semana de testes de carga, medidas e fotos.' }); expect(phaseOf('2026-11-16', addDays('2026-11-16', 77))).toMatchObject({ week: 11, note: WEEK_NOTES[11] }); });
 it('Natal e Réveillon pela data real, não pelo número da semana (ADR 012, UX C3)', () => {
  const notes = (start: string) => Array.from({ length: 12 }, (_, w) => { const p = phaseOf(start, addDays(mondayOf(start), w * 7)); return p.kind === 'week' ? p.note : 'x'; });
  // Início em 16/11/2026: 25/12 (sexta) na semana 6 e 31/12 (quinta) na semana 7.
  expect(notes('2026-11-16').map((n, w) => (n ? `${w}:${n}` : null)).filter(Boolean)).toEqual([`5:${CHRISTMAS_NOTE}`, `6:${NEW_YEAR_NOTE}`, `11:${WEEK_NOTES[11]}`]);
  // Início em março: nenhuma semana de festas.
  expect(notes('2026-03-02').filter(Boolean)).toEqual([WEEK_NOTES[11]]);
  // Início em 05/10/2026: a semana do Natal é a 12ª e junta as duas notas.
  expect(notes('2026-10-05')[11]).toBe(`${CHRISTMAS_NOTE} ${WEEK_NOTES[11]}`);
  expect(notes('2026-10-05').slice(0, 11).every(n => n === undefined)).toBe(true);
  // Início em 28/12/2026: a primeira semana tem o 31/12.
  expect(notes('2026-12-28')[0]).toBe(NEW_YEAR_NOTE);
  // 25/12/2028 é segunda: a mesma semana tem Natal e Réveillon (domingo, 31/12).
  expect(weekNoteOf('2028-12-25', 3)).toBe(`${CHRISTMAS_NOTE} ${NEW_YEAR_NOTE}`);
  expect(weekNoteOf('2028-12-18', 3)).toBeUndefined();
  expect(weekNoteOf('2027-01-01', 0)).toBeUndefined();
  // O dia da semana dentro da semana de festas também recebe a nota.
  expect(phaseOf('2026-11-18', '2026-12-27')).toMatchObject({ week: 5, note: CHRISTMAS_NOTE });
 });
});
