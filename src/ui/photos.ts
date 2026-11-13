import type { ThumbKind } from './Thumb';

/**
 * Manifesto de fotos disponíveis. O Thumb só pede imagem de rede para ids listados aqui;
 * os demais mostram o tile direto, sem requisição. Para adicionar uma foto: coloque o arquivo
 * em public/img/<kind>/<id>.jpg (ou .webp) e inclua o id na lista do kind correspondente.
 */
export const PHOTOS: Record<ThumbKind, ReadonlySet<string>> = {
  meal: new Set<string>(['cafe', 'almoco', 'lanche', 'jantar', 'cafe-A', 'almoco-A']),
  exercise: new Set<string>(['inclinado']),
  hero: new Set<string>(['UA', 'UB']),
};

export function hasPhoto(kind: ThumbKind, id?: string): boolean {
  return !!id && PHOTOS[kind].has(id);
}
