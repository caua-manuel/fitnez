import { describe, expect, it } from 'vitest';
import { swapOptions } from '../../src/domain/swap';
import { guideFor } from '../../src/domain/exerciseNotes';

// Trocas e instruções dos exercícios novos do ADR 012 (docs/handoffs/conteudo-adr-012-textos.md, itens 3 e 4).
describe('trocas de ponte e sentar_levantar', () => {
 it('em casa sem equipamento, nos dois sentidos', () => {
  expect(swapOptions('sentar_levantar', 'casa_livre', 'nunca')).toEqual(['agach_livre', 'afundo_livre']);
  expect(swapOptions('agach_livre', 'casa_livre', 'nunca')).toEqual(['sentar_levantar', 'afundo_livre']);
  expect(swapOptions('ponte', 'casa_livre', 'nunca')).toEqual(['ponte_uni', 'stiff_uni']);
  expect(swapOptions('ponte_uni', 'casa_livre', 'nunca')).toEqual(['ponte', 'stiff_uni']);
 });
 it('ponte antes de ponte_uni; sentar_levantar por último no bilateral', () => {
  expect(swapOptions('hip_b', 'academia', 'iniciante')).toEqual(['hip_l', 'ponte_h', 'ponte', 'ponte_uni', 'stiff', 'mesa', 'stiff_uni']);
  expect(swapOptions('ponte_h', 'casa_equip', 'nunca')).toEqual(['ponte', 'ponte_uni', 'stiff', 'stiff_uni']);
  expect(swapOptions('agach', 'academia', 'intermediario')).toEqual(['leg', 'goblet', 'agach_livre', 'sentar_levantar', 'bulg', 'afundo', 'afundo_livre']);
  expect(swapOptions('sentar_levantar', 'casa_equip', 'nunca')).toEqual(['goblet', 'agach_livre', 'bulg', 'afundo', 'afundo_livre']);
 });
 it('não oferece o que já está no treino do dia', () => {
  expect(swapOptions('sentar_levantar', 'casa_livre', 'nunca', ['afundo_livre'])).toEqual(['agach_livre']);
 });
});

describe('instruções finais', () => {
 it('ponte e sentar_levantar com os textos do conteúdo', () => {
  expect(guideFor('ponte')).toEqual({ passos: ['Deitado de costas, joelhos dobrados e pés no chão, afastados na largura do quadril.', 'Suba o quadril até ficar alinhado com os joelhos, aperte o glúteo por 1 segundo e desça devagar.'], erro: 'subir demais arqueando a lombar, em vez de subir apertando o glúteo.' });
  const s = guideFor('sentar_levantar')!;
  expect(s.passos).toEqual(['Sente na ponta de uma cadeira firme encostada na parede, pés afastados na largura do quadril.', 'Incline o tronco um pouco à frente e levante empurrando o chão com os pés; volte a sentar devagar, sem cair na cadeira.', 'Se precisar, apoie as mãos nos joelhos.']);
  expect(s.erro).toBe('sentar de uma vez, sem controlar a descida, ou deixar os joelhos se fecharem para dentro.');
 });
});
