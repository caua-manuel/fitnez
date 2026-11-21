import type { ReactNode } from 'react';

// Ícones de linha próprios das telas de Início e Treino (mesmo traço de src/ui/icons.tsx).
type Name = 'trocar' | 'pausa' | 'camadas' | 'check-grande' | 'esq' | 'dir' | 'barras' | 'menos' | 'cima' | 'baixo' | 'trofeu' | 'anilha';

const paths: Record<Name, ReactNode> = {
 trocar: <><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" /></>,
 pausa: <><rect x="6.5" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" stroke="none" /><rect x="13.9" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" stroke="none" /></>,
 camadas: <><path d="m12 3.5 9 4.7-9 4.7-9-4.7Z" /><path d="m3 12.2 9 4.7 9-4.7M3 16.4l9 4.6 9-4.6" /></>,
 'check-grande': <path d="m5.5 12.6 4.4 4.4 8.6-9.6" />,
 esq: <path d="m15 5-7 7 7 7" />,
 dir: <path d="m9 5 7 7-7 7" />,
 barras: <path d="M5 20v-6M12 20V9M19 20V4" />,
 menos: <path d="M5.5 12h13" />,
 cima: <path d="m6 15 6-6 6 6" />,
 baixo: <path d="m6 9 6 6 6-6" />,
 anilha: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.25" /></>,
 trofeu: <path d="M8 4h8v5a4 4 0 0 1-8 0ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6" />,
};

export function Glyph({ name, size = 24, weight = 2, className }: { name: Name; size?: number; weight?: number; className?: string }) {
 return <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
