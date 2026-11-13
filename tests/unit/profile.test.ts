import { describe, expect, it } from 'vitest';
import { dietTargetsFromProfile, proteinTargetG, validateProfile } from '../../src/domain/profile';

describe('validateProfile', () => {
 it('aceita perfil completo, com vírgula no peso', () => {
  expect(validateProfile({ name: ' Ana ', goal: 'Ganhar massa', age: '30', weightKg: '77,5', heightCm: '175' }))
   .toEqual({ ok: true, value: { name: 'Ana', goal: 'Ganhar massa', age: 30, weightKg: 77.5, heightCm: 175 } });
 });
 it('campos físicos são opcionais', () => {
  expect(validateProfile({ name: 'Ana', goal: '' })).toEqual({ ok: true, value: { name: 'Ana', goal: '' } });
  expect(validateProfile({ name: 'Ana', goal: '', age: '', weightKg: undefined, heightCm: null }).ok).toBe(true);
 });
 it('aceita números e limites exatos', () => {
  expect(validateProfile({ name: '', goal: '', age: 10, weightKg: 30, heightCm: 100 }).ok).toBe(true);
  expect(validateProfile({ name: '', goal: '', age: 100, weightKg: 300, heightCm: 250 }).ok).toBe(true);
 });
 it('recusa fora dos limites, em português', () => {
  const r = validateProfile({ name: '', goal: '', age: '9', weightKg: '29,9', heightCm: '251' });
  expect(r.ok).toBe(false);
  if (!r.ok) {
   expect(r.errors.age).toContain('entre 10 e 100');
   expect(r.errors.weightKg).toContain('entre 30 e 300 kg');
   expect(r.errors.heightCm).toContain('entre 100 e 250 cm');
  }
 });
 it('idade e altura precisam ser inteiras; texto é recusado', () => {
  const r = validateProfile({ name: '', goal: '', age: '30,5', heightCm: '175.5', weightKg: 'abc' });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['age', 'heightCm', 'weightKg']);
 });
 it('limita nome a 60 e objetivo a 140 caracteres', () => {
  expect(validateProfile({ name: 'a'.repeat(60), goal: 'b'.repeat(140) }).ok).toBe(true);
  const r = validateProfile({ name: 'a'.repeat(61), goal: 'b'.repeat(141) });
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.errors.name).toContain('60'); expect(r.errors.goal).toContain('140'); }
 });
});

describe('proteinTargetG', () => {
 it('padrão 185 sem peso ou com peso inválido', () => {
  for (const w of [undefined, null, NaN, 0, -5, 20, 400]) expect(proteinTargetG(w as number)).toBe(185);
 });
 it('peso válido: arredonda peso x 2,4', () => {
  expect(proteinTargetG(77)).toBe(185);
  expect(proteinTargetG(80)).toBe(192);
  expect(proteinTargetG(77.3)).toBe(186);
  expect(proteinTargetG(80, 2)).toBe(160);
 });
});

describe('dietTargetsFromProfile', () => {
 it('sem perfil ou peso: 185 e 55', () => {
  expect(dietTargetsFromProfile()).toEqual({ protein: 185, fat: 55 });
  expect(dietTargetsFromProfile(null)).toEqual({ protein: 185, fat: 55 });
  expect(dietTargetsFromProfile({})).toEqual({ protein: 185, fat: 55 });
 });
 it('com peso', () => { expect(dietTargetsFromProfile({ weightKg: 80 })).toEqual({ protein: 192, fat: 55 }); });
});
