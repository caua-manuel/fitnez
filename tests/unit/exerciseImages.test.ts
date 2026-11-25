import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import catalog from '../../data/plan.json';
import { exerciseImageId, exerciseFrames } from '../../src/domain/exerciseImages';

const folder = new URL('../../public/img/exercise/', import.meta.url);
const missingAllowed = new Set(['rosca_elastico', 'lat_elastico']);

describe('ilustrações de exercícios', () => {
 it.each([['hip_b', 'hip_l'], ['salto_b', 'salto_l'], ['copen_b', 'copen_l'], ['prancha', 'prancha'], ['constructor', 'constructor']])(
  'resolve %s como %s', (id, imageId) => expect(exerciseImageId(id)).toBe(imageId),
 );

 it('cobre os IDs do plano com a sequência de quadros prevista', () => {
  const files = readdirSync(folder);
  for (const id of Object.keys(catalog.plan.ex)) {
   const imageId = exerciseImageId(id);
   const frames = files.filter(file => file.startsWith(`${imageId}-`) && file.endsWith('.webp')).sort();
   if (!frames.length && missingAllowed.has(imageId)) continue;
   expect(frames, id).toEqual(exerciseFrames(id));
  }
 });

 it('limita cada WebP a 60 KB', () => {
  for (const file of readdirSync(folder).filter(file => file.endsWith('.webp'))) {
   expect(statSync(new URL(file, folder)).size, file).toBeLessThanOrEqual(60_000);
  }
 });

 it('ignora IDs que não podem formar um nome de arquivo', () => {
  expect(exerciseFrames('../inclinado')).toEqual([]);
 });
});
