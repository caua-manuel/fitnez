import type { ReactNode } from 'react';

export type IconName =
 | 'inicio' | 'treino' | 'dieta' | 'evolucao' | 'perfil' | 'sino' | 'editar' | 'relogio' | 'seta' | 'marca'
 | 'calendario' | 'play' | 'plus' | 'alvo' | 'chevron' | 'voltar' | 'busca' | 'fogo' | 'garfo' | 'agua'
 | 'shake' | 'nuvem' | 'engrenagem' | 'lua' | 'sol' | 'info' | 'historico' | 'filtro' | 'mais' | 'salvar' | 'balanca' | 'fita' | 'circulo';

const paths: Record<IconName, ReactNode> = {
 inicio: <><path d="M3.5 10.6 12 3.5l8.5 7.1V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19Z" /><path className="door" d="M9.5 20.5v-6h5v6" /></>,
 treino: <path d="M2.5 10v4M5.5 7v10M18.5 7v10M21.5 10v4M5.5 12h13" />,
 dieta: <><path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0Z" /><path d="M12 12.5V9.2c0-2.8 1.9-4.4 5-4.4 0 2.9-1.9 4.4-5 4.4Z" /><path d="M12 10.4c0-2.3-1.6-3.7-4.4-3.7 0 2.3 1.7 3.7 4.4 3.7Z" /></>,
 evolucao: <path d="M5 20v-6M12 20V9M19 20V4" />,
 perfil: <><circle cx="12" cy="7.8" r="4.2" /><path d="M4 20.5c0-3.9 3.6-6.2 8-6.2s8 2.3 8 6.2Z" /></>,
 sino: <><path d="M6 17v-5.5a6 6 0 0 1 12 0V17l1.8 2H4.2Z" /><path d="M10 21.5a2.2 2.2 0 0 0 4 0" /></>,
 editar: <><path d="M4 20h4L19.5 8.5l-4-4L4 16Z" /><path d="m13 7 4 4" /></>,
 relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 2" /></>,
 seta: <path d="m9 5.5 6.5 6.5L9 18.5" />,
 marca: <path d="m5 12.8 4.6 4.6L19 7.6" />,
 calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
 play: <path d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7Z" fill="currentColor" />,
 plus: <path d="M12 5v14M5 12h14" />,
 alvo: <><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="4" /><path d="m11 13 8.5-8.5M16.5 4.5l.5 2.5 2.5.5" /></>,
 chevron: <path d="m6 9.5 6 6 6-6" />,
 voltar: <path d="M20 12H4.5M11 5.5 4.5 12l6.5 6.5" />,
 busca: <><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></>,
 fogo: <path d="M12 3c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2 1-3.5 2-4.5.2 1.5.8 2.5 1.8 3C10 9 11 6 12 3Z" />,
 garfo: <><path d="M6 3v6a2.5 2.5 0 0 0 5 0V3M8.5 3v18" /><path d="M17 21V3c-2.2 1.5-3 4-3 7v3h3" /></>,
 agua: <path d="M12 3.2C9 7.5 6.2 10.5 6.2 14.2a5.8 5.8 0 0 0 11.6 0C17.8 10.5 15 7.5 12 3.2Z" />,
 shake: <><path d="M6.5 8h11l-1.4 11.6a1.5 1.5 0 0 1-1.5 1.4H9.4a1.5 1.5 0 0 1-1.5-1.4Z" /><path d="M7.2 13.5h9.6M13.5 8l1.8-5H19" /></>,
 nuvem: <><path d="M7 18.5a4.5 4.5 0 0 1-.6-8.9 6 6 0 0 1 11.5 1.3 3.8 3.8 0 0 1-.4 7.6" /><path d="M12 21v-8M8.8 15.8 12 12.6l3.2 3.2" /></>,
 engrenagem: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.5M12 18.7v2.5M2.8 12h2.5M18.7 12h2.5M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8" /></>,
 lua: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />,
 sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
 info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.1" /></>,
 historico: <><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" /><path d="M3.5 4v4.5H8M12 7.5V12l3 1.8" /></>,
 filtro: <><path d="M4 8h9M17 8h3M4 16h3M11 16h9" /><circle cx="15" cy="8" r="2" /><circle cx="9" cy="16" r="2" /></>,
 mais: <><circle cx="12" cy="5.5" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="18.5" r="1.3" fill="currentColor" /></>,
 salvar: <><path d="M5 3.5h11l3.5 3.5v11.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M7 3.5v5h8v-5M7 20.5v-6h10v6" /></>,
 balanca: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8.5 9.5a4.5 3 0 0 1 7 0" /></>,
 fita: <><ellipse cx="11" cy="10" rx="8" ry="4.5" /><ellipse cx="11" cy="10" rx="2.6" ry="1.4" /><path d="M3 10v4.5c0 2.5 3.6 4.5 8 4.5s8-2 8-4.5V10M19 12.5h2.5v5H17" /></>,
 circulo: <circle cx="12" cy="12" r="8.5" />,
};

export function Icon({ name, size = 24, weight = 1.6, className }: { name: IconName; size?: number; weight?: number; className?: string }) {
 return <svg className={`icon ic-${name}${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
