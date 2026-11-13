import { useState } from 'react';
import { Icon } from './icons';
import type { IconName } from './icons';
import { hasPhoto } from './photos';

/**
 * Miniatura premium: tenta uma foto em public/img/<kind>/<id>.jpg (depois .webp);
 * sem foto mostra um tile minimalista de linha fina (sem desenho animado).
 * Pastas: public/img/meal/, public/img/exercise/, public/img/hero/. O nome do arquivo é o id (ex.: public/img/meal/cafe.jpg).
 */
export type ThumbKind = 'meal' | 'exercise' | 'hero';
export interface ThumbProps { kind: ThumbKind; id?: string; group?: string; size?: number; className?: string; label?: string }

const MEAL_ICON: Record<string, IconName> = { cafe: 'dieta', almoco: 'garfo', lanche: 'dieta', pos: 'shake', jantar: 'garfo' };
const EXERCISE_ICON: Record<string, IconName> = { cardio: 'fogo', core: 'alvo', abdomen: 'alvo', abdominais: 'alvo' };
const EXTENSIONS = ['jpg', 'webp'] as const;

/** Ids de refeição têm o formato '<refeição>-<opção>' (ex.: almoco-a). */
export function splitMealId(id?: string): { meal: string; option: string } {
  const [meal = '', option = ''] = (id ?? '').toLowerCase().split('-');
  return { meal, option };
}

export function fallbackIcon(kind: ThumbKind, id?: string, group?: string): IconName {
  if (kind === 'meal') return MEAL_ICON[splitMealId(id).meal] ?? 'garfo';
  if (kind === 'exercise') return EXERCISE_ICON[(id ?? '').toLowerCase()] ?? EXERCISE_ICON[(group ?? '').toLowerCase()] ?? 'treino';
  return 'treino';
}

function Hero({ size }: { size?: number }) {
  return <svg viewBox="0 0 160 120" width={size} height={size ? size * 0.75 : undefined} preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false" style={{ width: size ? undefined : '100%', height: size ? undefined : '100%', display: 'block' }}>
    <path d="M70 0h90v120H30Z" fill="var(--accent-soft)" opacity=".7" />
    <path d="M96 0h64v120H66Z" fill="var(--primary)" opacity=".14" />
    <g fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" opacity=".75" transform="translate(70 28) scale(2.6)">
      <path d="M2.5 10v4M5.5 7v10M18.5 7v10M21.5 10v4M5.5 12h13" />
    </g>
  </svg>;
}

export function Thumb({ kind, id, group, size, className, label }: ThumbProps) {
  const [attempt, setAttempt] = useState(hasPhoto(kind, id) ? 0 : EXTENSIONS.length);
  const base = import.meta.env.BASE_URL;
  const hero = kind === 'hero';
  const box = size ? { width: size, height: hero ? size * 0.75 : size } : undefined;
  const option = kind === 'meal' ? splitMealId(id).option : '';
  const tone = /^[a-c]$/.test(option) ? ` thumb-opt-${option}` : '';
  const cls = `thumb thumb-${kind}${className ? ` ${className}` : ''}`;
  if (id && attempt < EXTENSIONS.length) {
    return <span className={cls} style={box}><img src={`${base}img/${kind}/${id}.${EXTENSIONS[attempt]}`} alt={label ?? ''} loading="lazy" decoding="async" onError={() => setAttempt(attempt + 1)} /></span>;
  }
  return <span className={`${cls} thumb-fallback${tone}`} style={box} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    {hero ? <Hero size={size} /> : <Icon name={fallbackIcon(kind, id, group)} size={size ? Math.round(size * 0.46) : 24} weight={1.6} />}
  </span>;
}
