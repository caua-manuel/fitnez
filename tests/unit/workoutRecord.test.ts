import { describe, expect, it } from 'vitest';
import type { DayRecord, Plan } from '../../src/application/repository';
import { consistency } from '../../src/domain/evolution';
import { doneCount, getWorkout, isDone, latestWorkout, listWorkouts, overlappingExercises, totalSets, totalVolume, upsertWorkout, type WorkoutMeta } from '../../src/domain/workoutRecord';

const A: WorkoutMeta = { sessionId: 'UA', startedAt: 10, finishedAt: 20, status: 'done', sets: 10, volume: 1000 };
const B: WorkoutMeta = { sessionId: 'LW', startedAt: 30, status: 'partial', sets: 1, volume: 50 };
const plan = { ex: {}, order: [], sess: { UA: { name: 'Upper A', ex: ['sup', 'rem'] }, LW: { name: 'Lower', ex: ['agach', 'sup'] } } } as unknown as Plan;

describe('workoutRecord', () => {
 it('dia legado so com workout continua legivel', () => {
  const d: DayRecord = { workout: A };
  expect(listWorkouts(d)).toEqual([A]);
  expect(isDone(d, 'UA')).toBe(true);
  expect(isDone(d, 'LW')).toBe(false);
  expect(doneCount(d)).toBe(1);
  expect(getWorkout(d, 'LW')).toBeNull();
  expect(listWorkouts(undefined)).toEqual([]);
 });
 it('upsert promove o legado e nao apaga o outro treino', () => {
  const d = upsertWorkout({ workout: A, feel: 3 }, B);
  expect(d.feel).toBe(3);
  expect(d.workouts).toEqual({ UA: A, LW: B });
  expect(d.workout).toEqual(B);
  expect(isDone(d, 'UA')).toBe(true);
  expect(listWorkouts(d)).toHaveLength(2);
 });
 it('concluir A, iniciar B, concluir B: ambos done', () => {
  let d = upsertWorkout({}, A);
  d = upsertWorkout(d, B);
  d = upsertWorkout(d, { ...B, status: 'done', finishedAt: 40, sets: 8, volume: 500 });
  expect(isDone(d, 'UA') && isDone(d, 'LW')).toBe(true);
  expect(doneCount(d)).toBe(2);
  expect(totalSets(d)).toBe(18);
  expect(totalVolume(d)).toBe(1500);
  expect(latestWorkout(d)?.sessionId).toBe('LW');
 });
 it('nao muta a entrada', () => {
  const d: DayRecord = { workout: A };
  const copy = JSON.parse(JSON.stringify(d));
  upsertWorkout(d, B);
  expect(d).toEqual(copy);
 });
 it('sem duplicar: legado igual a workouts[id]; legado mais novo vence', () => {
  expect(listWorkouts({ workouts: { UA: A }, workout: A })).toHaveLength(1);
  const newer = { ...A, status: 'partial' as const, startedAt: 99, finishedAt: undefined };
  expect(getWorkout({ workouts: { UA: A }, workout: newer }, 'UA')?.status).toBe('partial');
 });
 it('overlappingExercises detecta exercicios em comum com series existentes', () => {
  const d: DayRecord = { workout: A, log: { sup: [{ kg: '50', reps: '8', done: true }], rem: [{ kg: '', reps: '', done: false }] } };
  expect(overlappingExercises(d, plan, 'LW')).toEqual(['sup']);
  expect(overlappingExercises({}, plan, 'LW')).toEqual([]);
  expect(overlappingExercises(d, plan, 'XX')).toEqual([]);
 });
 it('constancia conta cada treino concluido; legado continua contando', () => {
  const sched = [{ k: 'gym', s: 'UA' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }];
  const two = upsertWorkout(upsertWorkout({}, A), { ...B, status: 'done' });
  expect(consistency({ '2026-11-16': two }, sched, '2026-11-16', '2026-11-20').done).toBe(2);
  expect(consistency({ '2026-11-16': { workout: A } }, sched, '2026-11-16', '2026-11-20')).toMatchObject({ done: 1, planned: 1 });
 });
});
