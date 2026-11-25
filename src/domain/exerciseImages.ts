export function exerciseImageId(id: string): string {
 switch (id) {
  case 'hip_b': return 'hip_l';
  case 'salto_b': return 'salto_l';
  case 'copen_b': return 'copen_l';
  default: return id;
 }
}

export function exerciseFrames(id: string): string[] {
 const imageId = exerciseImageId(id);
 if (!/^[a-z0-9_-]+$/.test(imageId)) return [];
 const count = imageId === 'ytw' ? 3 : imageId === 'pescoco' || imageId === 'prancha' ? 1 : 2;
 return Array.from({ length: count }, (_, i) => `${imageId}-${i + 1}.webp`);
}
