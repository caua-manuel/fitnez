import { describe, expect, it } from 'vitest';
import { backupDue, hasCompletedWorkout, nextUsage, shouldAskPersistence, shouldOfferInstall, usageAfterBackup, USAGE_MAX } from '../../src/domain/userData';

// ADR 011, itens 1.2 e 1.4. Datas sintéticas.
const due = (over: Partial<Parameters<typeof backupDue>[0]> = {}) => backupDue({ usage: { lastDay: '2026-11-20', daysSinceBackup: 7 }, lastBackupConfirmedAt: null, hasUserData: true, snoozedOn: undefined, today: '2026-11-20', ...over });

describe('nextUsage', () => {
 it('sem contagem anterior, hoje é o primeiro dia contado', () => {
  expect(nextUsage(undefined, '2026-11-20')).toEqual({ lastDay: '2026-11-20', daysSinceBackup: 1 });
  expect(nextUsage({ lastDay: 'x', daysSinceBackup: -1 } as never, '2026-11-20')).toEqual({ lastDay: '2026-11-20', daysSinceBackup: 1 });
 });
 it('mesmo dia não conta duas vezes (devolve o mesmo objeto)', () => {
  const u = { lastDay: '2026-11-20', daysSinceBackup: 3 };
  expect(nextUsage(u, '2026-11-20')).toBe(u);
 });
 it('dia novo soma 1, mesmo com dias sem uso no meio', () => {
  expect(nextUsage({ lastDay: '2026-11-20', daysSinceBackup: 3 }, '2026-11-21')).toEqual({ lastDay: '2026-11-21', daysSinceBackup: 4 });
  expect(nextUsage({ lastDay: '2026-11-01', daysSinceBackup: 3 }, '2026-11-30')).toEqual({ lastDay: '2026-11-30', daysSinceBackup: 4 });
 });
 it('relógio para trás não conta nem zera', () => {
  const u = { lastDay: '2026-11-20', daysSinceBackup: 5 };
  expect(nextUsage(u, '2026-11-10')).toBe(u);
 });
 it('teto de 100000', () => { expect(nextUsage({ lastDay: '2026-11-20', daysSinceBackup: USAGE_MAX }, '2026-11-21').daysSinceBackup).toBe(USAGE_MAX); });
 it('7 gravações em 7 dias levam ao 7º dia', () => {
  let u = nextUsage(usageAfterBackup(undefined, '2026-11-01'), '2026-11-01');
  expect(u.daysSinceBackup).toBe(0);
  for (let d = 2; d <= 8; d++) u = nextUsage(u, `2026-11-0${d}`);
  expect(u.daysSinceBackup).toBe(7);
 });
});

describe('usageAfterBackup', () => {
 it('zera e marca hoje; relógio para trás mantém o último dia', () => {
  expect(usageAfterBackup({ lastDay: '2026-11-19', daysSinceBackup: 9 }, '2026-11-20')).toEqual({ lastDay: '2026-11-20', daysSinceBackup: 0 });
  expect(usageAfterBackup({ lastDay: '2026-11-25', daysSinceBackup: 9 }, '2026-11-20')).toEqual({ lastDay: '2026-11-25', daysSinceBackup: 0 });
 });
});

describe('backupDue', () => {
 it('7º dia de uso dispara; 6º não', () => { expect(due()).toBe(true); expect(due({ usage: { lastDay: '2026-11-20', daysSinceBackup: 6 } })).toBe(false); });
 it('sem dados do usuário nunca é devido', () => { expect(due({ hasUserData: false })).toBe(false); });
 it('sem meta.usage (estado antigo) não é devido até contar', () => { expect(due({ usage: undefined })).toBe(false); });
 it('adiado só hoje', () => {
  expect(due({ snoozedOn: '2026-11-20' })).toBe(false);
  expect(due({ snoozedOn: '2026-11-19' })).toBe(true);
  expect(due({ snoozedOn: '2026-11-20', today: '2026-11-21' })).toBe(true);
 });
});

describe('primeiro treino: instalar e persistência', () => {
 const base = { prompts: {}, installMode: 'prompt', demo: false, firstWorkoutDone: true };
 it('oferece instalar uma vez, fora da demo, se não instalado', () => {
  expect(shouldOfferInstall(base)).toBe(true);
  expect(shouldOfferInstall({ ...base, prompts: { installShownAt: 1 } })).toBe(false);
  expect(shouldOfferInstall({ ...base, installMode: 'installed' })).toBe(false);
  expect(shouldOfferInstall({ ...base, demo: true })).toBe(false);
  expect(shouldOfferInstall({ ...base, firstWorkoutDone: false })).toBe(false);
  expect(shouldOfferInstall({ ...base, prompts: undefined })).toBe(true);
 });
 it('pede persistência uma vez, se não concedida e disponível', () => {
  const p = { prompts: {}, persistence: 'not-requested', demo: false, firstWorkoutDone: true };
  expect(shouldAskPersistence(p)).toBe(true);
  expect(shouldAskPersistence({ ...p, prompts: { persistAskedAt: 5 } })).toBe(false);
  expect(shouldAskPersistence({ ...p, persistence: 'granted' })).toBe(false);
  expect(shouldAskPersistence({ ...p, persistence: 'unavailable' })).toBe(false);
  expect(shouldAskPersistence({ ...p, demo: true })).toBe(false);
 });
 it('hasCompletedWorkout lê workouts e o campo legado', () => {
  expect(hasCompletedWorkout({})).toBe(false);
  expect(hasCompletedWorkout({ '2026-11-20': { workouts: { UA: { status: 'partial' } } } })).toBe(false);
  expect(hasCompletedWorkout({ '2026-11-20': { workouts: { UA: { status: 'done' } } } })).toBe(true);
  expect(hasCompletedWorkout({ '2026-11-20': { workout: { status: 'done' } } })).toBe(true);
 });
});
