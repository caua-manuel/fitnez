import { describe, expect, it } from 'vitest';
import { treinosConcluidos } from '../../src/features/perfil/metricas';
import type { DayRecord } from '../../src/application/repository';

const w = (sessionId: string, status: 'done' | 'partial', t: number) => ({ sessionId, status, startedAt: t, finishedAt: t + 1 }) as never;

describe('Perfil: treinos concluídos', () => {
 it('soma todos os treinos concluídos, inclusive vários no mesmo dia e registro legado', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-17': { workouts: { UA: w('UA', 'done', 1), LA: w('LA', 'done', 5) } } as DayRecord,
   '2026-11-18': { workout: w('UB', 'done', 9) } as DayRecord,
   '2026-11-19': { workout: w('UA', 'partial', 12) } as DayRecord,
   '2026-11-20': {} as DayRecord,
  };
  expect(treinosConcluidos(days)).toBe(3);
 });
});
