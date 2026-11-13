import { useId } from 'react';
import type { ReactNode } from 'react';
import type { MuscleGroup } from '../domain/muscleGroups';
import './illustrations.css';

/* Ilustrações SVG próprias (flat moderno) no lugar de fotos. Sem texto, sem regra de negócio.
   Cores via variáveis CSS (--primary e --il-*) com fallback claro inline; ver illustrations.css. */

export interface IllustrationProps {
  /** Largura em px. A altura segue a proporção da ilustração. */
  size?: number;
  /** Se informado, a ilustração deixa de ser decorativa e ganha role="img". */
  title?: string;
  className?: string;
}

const C = {
  bg: 'var(--il-bg, #ECECEE)',
  bg2: 'var(--il-bg-2, #DEDEE1)',
  bodyA: 'var(--il-body-a, #FFFFFF)',
  bodyB: 'var(--il-body-b, #DCDCE0)',
  bodyLine: 'var(--il-body-line, #B4B4BA)',
  primary: 'var(--primary, #0A58F0)',
  muscleHi: 'var(--il-muscle-hi, #4F8CFF)',
  pants: 'var(--il-pants, #2A2A2E)',
  skin: 'var(--il-skin, #F1BE98)',
  hair: 'var(--il-hair, #3A2A22)',
  metal: 'var(--il-metal, #8A8A92)',
  metalDark: 'var(--il-metal-dark, #2E2E33)',
  bench: 'var(--il-bench, #66666E)',
  floor: 'var(--il-floor, #D2D2D6)',
  leaf: 'var(--success, #0F6B45)',
};

function safeId(raw: string): string {
  return 'il' + raw.replace(/[^a-zA-Z0-9]/g, '');
}

interface RootProps extends IllustrationProps {
  w: number;
  h: number;
  vb?: string;
  children: ReactNode;
}

function Root({ w, h, vb, size, title, className, children }: RootProps) {
  const width = size ?? w;
  const height = (width * h) / w;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={vb ?? `0 0 ${w} ${h}`}
      width={width}
      height={height}
      className={className ? `il ${className}` : 'il'}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Figura humana (vista frontal e costas), coordenadas 100 x 200        */
/* ------------------------------------------------------------------ */

type View = 'front' | 'back';
type Region = 'pec' | 'delt' | 'rear' | 'bi' | 'tri' | 'abs' | 'obl' | 'quad' | 'calf' | 'lat' | 'trap' | 'glute' | 'ham';

const REGIONS_OF: Record<MuscleGroup, Region[]> = {
  peito: ['pec'],
  costas: ['lat', 'trap'],
  'ombro-lateral': ['delt'],
  'ombro-posterior': ['delt', 'rear'],
  press: ['abs'],
  biceps: ['bi'],
  triceps: ['tri'],
  quadriceps: ['quad'],
  'posterior-gluteos': ['glute', 'ham'],
  panturrilha: ['calf'],
  core: ['abs', 'obl'],
};

const BACK_GROUPS: readonly MuscleGroup[] = ['costas', 'ombro-posterior', 'triceps', 'posterior-gluteos', 'panturrilha'];

interface Crop { x: number; y: number; s: number }
const CROPS: Record<MuscleGroup, Crop> = {
  peito: { x: 10, y: 8, s: 80 },
  costas: { x: 10, y: 8, s: 80 },
  'ombro-lateral': { x: 8, y: 6, s: 70 },
  'ombro-posterior': { x: 8, y: 6, s: 70 },
  biceps: { x: 6, y: 18, s: 70 },
  triceps: { x: 6, y: 18, s: 70 },
  press: { x: 14, y: 44, s: 72 },
  core: { x: 14, y: 44, s: 72 },
  quadriceps: { x: 6, y: 100, s: 92 },
  'posterior-gluteos': { x: 6, y: 92, s: 92 },
  panturrilha: { x: 10, y: 118, s: 82 },
};

function Pair({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform="translate(100 0) scale(-1 1)">{children}</g>
    </>
  );
}

function Limb({ pts, w, c }: { pts: Array<[number, number]>; w: number; c: string }) {
  return <polyline points={pts.map((p) => p.join(' ')).join(' ')} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

interface BodyProps {
  id: string;
  view: View;
  active: ReadonlySet<Region>;
}

function RegionShape({ id, name, active, children }: { id: string; name: Region; active: ReadonlySet<Region>; children: (p: Record<string, string | number>) => ReactNode }) {
  const on = active.has(name);
  const p: Record<string, string | number> = on
    ? { fill: `url(#${id}-mus)`, stroke: '#FFFFFF', strokeOpacity: 0.7, strokeWidth: 0.9 }
    : { fill: C.bodyLine, fillOpacity: 0.3 };
  return <Pair>{children(p)}</Pair>;
}

function Body({ id, view, active }: BodyProps) {
  const front = view === 'front';
  const R = (name: Region, fn: (p: Record<string, string | number>) => ReactNode) => (
    <RegionShape id={id} name={name} active={active}>{fn}</RegionShape>
  );
  const bodyFill = `url(#${id}-body)`;
  const line = { stroke: C.bodyLine, strokeWidth: 0.8, strokeOpacity: 0.8 };
  return (
    <g>
      {/* pernas */}
      <Pair>
        <Limb pts={[[41, 106], [39, 150]]} w={19} c={bodyFill} />
        <Limb pts={[[39, 150], [40, 186]]} w={12.5} c={bodyFill} />
        <ellipse cx="40" cy="193" rx="9" ry="4.2" fill={bodyFill} {...line} />
      </Pair>
      {/* braços */}
      <Pair>
        <Limb pts={[[24, 42], [17, 80]]} w={11.5} c={bodyFill} />
        <Limb pts={[[17, 80], [15, 112]]} w={9.5} c={bodyFill} />
        <circle cx="15" cy="117" r="5.2" fill={bodyFill} />
      </Pair>
      {/* pescoço e tronco */}
      <rect x="44.5" y="24" width="11" height="14" rx="5" fill={bodyFill} />
      <path d="M30 36Q50 30 70 36Q77 42 74 58Q70 80 66 100L34 100Q30 80 26 58Q23 42 30 36Z" fill={bodyFill} {...line} />
      <circle cx="50" cy="16" r="11" fill={bodyFill} {...line} />
      {front ? null : <path d="M39.5 14Q40 5.5 50 5.2Q60 5.5 60.5 14Q56 10.5 50 10.5Q44 10.5 39.5 14Z" fill={C.hair} opacity="0.9" />}
      {/* regiões musculares */}
      {front ? (
        <g>
          {R('pec', (p) => <path d="M49 40Q40 38 31 42Q29.5 54 38 60Q47 62 49 54Z" {...p} />)}
          {R('delt', (p) => <ellipse cx="25.5" cy="43.5" rx="7" ry="8" transform="rotate(-12 25.5 43.5)" {...p} />)}
          {R('bi', (p) => <ellipse cx="20.5" cy="62" rx="5" ry="11.5" transform="rotate(9 20.5 62)" {...p} />)}
          {R('tri', (p) => <ellipse cx="16.5" cy="62" rx="2.6" ry="11" transform="rotate(9 16.5 62)" {...p} />)}
          {R('abs', (p) => (
            <>
              <rect x="44.6" y="62" width="4.8" height="8" rx="2.4" {...p} />
              <rect x="44.6" y="71.5" width="4.8" height="8" rx="2.4" {...p} />
              <rect x="44.6" y="81" width="4.8" height="8.5" rx="2.4" {...p} />
            </>
          ))}
          {R('obl', (p) => <path d="M34 64Q32.5 80 36 96L42 96Q41 80 41 66Q38 62 34 64Z" {...p} />)}
        </g>
      ) : (
        <g>
          {R('trap', (p) => <path d="M50 29L41 37.5L47 50L50 58L53 50L59 37.5Z" {...p} />)}
          {R('delt', (p) => <ellipse cx="25.5" cy="43.5" rx="7" ry="8" transform="rotate(-12 25.5 43.5)" {...p} />)}
          {R('rear', (p) => <ellipse cx="38.5" cy="48" rx="6.5" ry="5" {...p} />)}
          {R('lat', (p) => <path d="M47 58L38 44Q30.5 52 32 64Q36 82 44 95L48 95Z" {...p} />)}
          {R('tri', (p) => <ellipse cx="20.5" cy="62" rx="5" ry="11.5" transform="rotate(9 20.5 62)" {...p} />)}
          {R('bi', (p) => <ellipse cx="24" cy="62" rx="2.3" ry="9" transform="rotate(9 24 62)" {...p} />)}
        </g>
      )}
      {/* short */}
      <path d="M33.5 96L66.5 96L70 126Q61 128 52.5 126L50 112L47.5 126Q39 128 30 126Z" fill={C.pants} />
      <path d="M33.5 96L66.5 96L66 100L34 100Z" fill={C.primary} opacity="0.9" />
      {front ? (
        <g>
          {R('quad', (p) => <ellipse cx="39.5" cy="139" rx="8" ry="15" transform="rotate(-3 39.5 139)" {...p} />)}
          {R('calf', (p) => <ellipse cx="40" cy="166" rx="4.8" ry="12" {...p} />)}
        </g>
      ) : (
        <g>
          {R('glute', (p) => <path d="M49 100Q40 96 34.5 104Q34 117 44 120Q49 119 49 110Z" {...p} />)}
          {R('ham', (p) => <ellipse cx="39.5" cy="139" rx="8" ry="15" transform="rotate(-3 39.5 139)" {...p} />)}
          {R('calf', (p) => <ellipse cx="40" cy="165" rx="5.6" ry="12.5" {...p} />)}
        </g>
      )}
    </g>
  );
}

function BodyDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: C.bodyA }} />
        <stop offset="1" style={{ stopColor: C.bodyB }} />
      </linearGradient>
      <linearGradient id={`${id}-mus`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: C.muscleHi }} />
        <stop offset="1" style={{ stopColor: C.primary }} />
      </linearGradient>
    </>
  );
}

function viewFor(groups: ReadonlyArray<MuscleGroup | null>): View {
  const first = groups.find((g): g is MuscleGroup => g !== null);
  return first && BACK_GROUPS.includes(first) ? 'back' : 'front';
}

function activeRegions(groups: ReadonlyArray<MuscleGroup | null>): Set<Region> {
  const s = new Set<Region>();
  for (const g of groups) if (g) for (const r of REGIONS_OF[g]) s.add(r);
  return s;
}

export interface MuscleIllustrationProps extends IllustrationProps {
  /** Grupo muscular de src/domain/muscleGroups.ts; null mostra um halter genérico. */
  group: MuscleGroup | null;
  /** 'square' é a miniatura; 'hero' é a faixa larga com a diagonal azul do card do Início. */
  variant?: 'square' | 'hero';
}

function Dumbbell({ id, hero }: { id: string; hero: boolean }) {
  const content = (
    <g>
      <g transform="rotate(-28 48 48)">
        <rect x="26" y="45" width="44" height="6" rx="3" fill={C.metal} />
        <rect x="18" y="30" width="10" height="36" rx="4" fill={`url(#${id}-mus)`} />
        <rect x="9" y="37" width="8" height="22" rx="3.5" fill={C.metalDark} />
        <rect x="68" y="30" width="10" height="36" rx="4" fill={`url(#${id}-mus)`} />
        <rect x="79" y="37" width="8" height="22" rx="3.5" fill={C.metalDark} />
        <rect x="20" y="33" width="3" height="30" rx="1.5" fill="#FFFFFF" opacity="0.35" />
        <rect x="70" y="33" width="3" height="30" rx="1.5" fill="#FFFFFF" opacity="0.35" />
      </g>
      <path d="M62 24C62 12 70 7 82 7C82 19 76 25 62 24Z" fill={C.leaf} />
      <path d="M63 23C68 17 73 13 78 11" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </g>
  );
  if (!hero) {
    return (
      <>
        <defs>
          <BodyDefs id={id} />
          <clipPath id={`${id}-clip`}><rect width="96" height="96" rx="21" /></clipPath>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: C.bg }} />
            <stop offset="1" style={{ stopColor: C.bg2 }} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <rect width="96" height="96" fill={`url(#${id}-bg)`} />
          <circle cx="76" cy="80" r="26" fill={C.primary} opacity="0.1" />
          <ellipse cx="48" cy="82" rx="30" ry="4" fill={C.metalDark} opacity="0.12" />
          {content}
        </g>
      </>
    );
  }
  return (
    <>
      <defs><BodyDefs id={id} /></defs>
      <path d="M96 100L128 0L190 0L190 100Z" fill={`url(#${id}-mus)`} />
      <path d="M86 100L118 0L128 0L96 100Z" fill={C.primary} opacity="0.22" />
      <g transform="translate(88 2) scale(1.0)">{content}</g>
    </>
  );
}

export function MuscleIllustration({ group, variant = 'square', size, title, className }: MuscleIllustrationProps) {
  const id = safeId(useId());
  if (variant === 'hero') {
    return <HeroIllustration groups={[group]} size={size} title={title} className={className} />;
  }
  if (group === null) {
    return (
      <Root w={96} h={96} size={size} title={title} className={className}>
        <Dumbbell id={id} hero={false} />
      </Root>
    );
  }
  const { x, y, s } = CROPS[group];
  const view = viewFor([group]);
  return (
    <Root w={s} h={s} vb={`${x} ${y} ${s} ${s}`} size={size} title={title} className={className}>
      <defs>
        <BodyDefs id={id} />
        <clipPath id={`${id}-clip`}><rect x={x} y={y} width={s} height={s} rx={s * 0.22} /></clipPath>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: C.bg }} />
          <stop offset="1" style={{ stopColor: C.bg2 }} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={x} y={y} width={s} height={s} fill={`url(#${id}-bg)`} />
        <circle cx={x + s * 0.5} cy={y + s * 0.55} r={s * 0.42} fill={C.primary} opacity="0.08" />
        <Body id={id} view={view} active={activeRegions([group])} />
      </g>
    </Root>
  );
}

export interface HeroIllustrationProps extends IllustrationProps {
  /** Um ou mais grupos do treino do dia (o primeiro define a vista: frente ou costas). */
  groups?: ReadonlyArray<MuscleGroup | null>;
  group?: MuscleGroup | null;
}

/** Faixa larga do card "Treino de hoje": figura destacando o músculo sobre a diagonal azul. */
export function HeroIllustration({ groups, group, size, title, className }: HeroIllustrationProps) {
  const id = safeId(useId());
  const list = groups && groups.length > 0 ? groups : [group ?? null];
  const firstGroup = list.find((g): g is MuscleGroup => g !== null);
  if (!firstGroup) {
    return (
      <Root w={190} h={100} size={size} title={title} className={className}>
        <Dumbbell id={id} hero />
      </Root>
    );
  }
  const { x, y, s } = CROPS[firstGroup];
  const H = s * 0.9;
  const W = H * 1.9;
  const x0 = 50 - W * 0.66;
  const y0 = y + s * 0.04;
  const view = viewFor(list);
  const p = (fx: number, fy: number) => `${x0 + W * fx},${y0 + H * fy}`;
  void x;
  return (
    <Root w={W} h={H} vb={`${x0} ${y0} ${W} ${H}`} size={size} title={title} className={className}>
      <defs><BodyDefs id={id} /></defs>
      <polygon points={`${p(0.36, 1)} ${p(0.54, 0)} ${p(1, 0)} ${p(1, 1)}`} fill={`url(#${id}-mus)`} />
      <polygon points={`${p(0.3, 1)} ${p(0.48, 0)} ${p(0.54, 0)} ${p(0.36, 1)}`} fill={C.primary} opacity="0.2" />
      <g transform={`translate(${x0 + W * 0.66 + 4} 0)`}>
        <g transform={`translate(${-(x0 + W * 0.66 + 4)} 0)`}>
          <Body id={id} view={view} active={activeRegions(list)} />
        </g>
      </g>
    </Root>
  );
}

/* ------------------------------------------------------------------ */
/* Exercícios (poses de lado/frente em 96 x 96)                        */
/* ------------------------------------------------------------------ */

function PoseFrame({ id, children }: { id: string; children: ReactNode }) {
  return (
    <>
      <defs>
        <clipPath id={`${id}-clip`}><rect width="96" height="96" rx="21" /></clipPath>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: C.bg }} />
          <stop offset="1" style={{ stopColor: C.bg2 }} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="96" height="96" fill={`url(#${id}-bg)`} />
        <circle cx="78" cy="22" r="24" fill={C.primary} opacity="0.07" />
        <rect y="86" width="96" height="10" fill={C.floor} opacity="0.75" />
        <ellipse cx="48" cy="86.5" rx="30" ry="2.6" fill={C.metalDark} opacity="0.14" />
        {children}
      </g>
    </>
  );
}

function Head({ x, y, dir, r = 6.6 }: { x: number; y: number; dir: -1 | 0 | 1; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.hair} />
      <circle cx={x + dir * 1.7} cy={y + 1.3} r={r * 0.9} fill={C.skin} />
    </g>
  );
}

function Plate({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.metalDark} />
      <circle cx={x} cy={y} r={r * 0.68} fill="none" stroke={C.metal} strokeWidth="1.2" opacity="0.8" />
      <circle cx={x} cy={y} r={r * 0.24} fill={C.metal} />
      <path d={`M${x - r * 0.7} ${y - r * 0.35}A${r * 0.78} ${r * 0.78} 0 0 1 ${x - r * 0.1} ${y - r * 0.78}`} fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
    </g>
  );
}

function Dumb({ x, y, rot = 0, len = 11 }: { x: number; y: number; rot?: number; len?: number }) {
  const h = len / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <line x1={-h} y1="0" x2={h} y2="0" stroke={C.metal} strokeWidth="2.6" strokeLinecap="round" />
      <rect x={-h - 3} y="-5" width="4.2" height="10" rx="1.6" fill={C.metalDark} />
      <rect x={h - 1.2} y="-5" width="4.2" height="10" rx="1.6" fill={C.metalDark} />
    </g>
  );
}

const ARM = 5.6;
const THIGH = 9;
const SHIN = 7;

function PoseSupino() {
  return (
    <g>
      <rect x="12" y="62" width="60" height="7" rx="3.5" fill={C.bench} />
      <rect x="20" y="69" width="4" height="17" fill={C.bench} />
      <rect x="60" y="69" width="4" height="17" fill={C.bench} />
      <Limb pts={[[56, 58], [70, 66], [72, 82]]} w={THIGH} c={C.pants} />
      <Limb pts={[[72, 66], [72, 82]]} w={SHIN} c={C.skin} />
      <Limb pts={[[31, 57], [57, 57]]} w={12} c={C.primary} />
      <Limb pts={[[56, 57], [60, 57]]} w={11} c={C.pants} />
      <Head x={21} y={56} dir={1} />
      <Limb pts={[[33, 54], [38, 43], [36, 32]]} w={ARM} c={C.skin} />
      <rect x="14" y="30" width="46" height="3" rx="1.5" fill={C.metal} />
      <rect x="17" y="21" width="5" height="21" rx="2" fill={C.metalDark} />
      <rect x="50" y="21" width="5" height="21" rx="2" fill={C.metalDark} />
    </g>
  );
}

function PoseRemada() {
  return (
    <g>
      <Limb pts={[[57, 54], [50, 68], [47, 82]]} w={THIGH} c={C.pants} />
      <Limb pts={[[49, 70], [47, 83]]} w={SHIN} c={C.skin} />
      <Limb pts={[[56, 52], [33, 41]]} w={12} c={C.primary} />
      <Limb pts={[[56, 52], [58, 56]]} w={11} c={C.pants} />
      <Head x={24} y={39} dir={-1} />
      <Limb pts={[[35, 44], [43, 55], [37, 63]]} w={ARM} c={C.skin} />
      <Plate x={36} y={66} r={9.5} />
    </g>
  );
}

function PoseBarraFixa() {
  return (
    <g>
      <rect x="10" y="10" width="76" height="3.6" rx="1.8" fill={C.metal} />
      <rect x="10" y="10" width="4" height="76" fill={C.metal} opacity="0.35" />
      <rect x="82" y="10" width="4" height="76" fill={C.metal} opacity="0.35" />
      <Limb pts={[[44, 64], [43, 84]]} w={8.5} c={C.pants} />
      <Limb pts={[[52, 64], [53, 84]]} w={8.5} c={C.pants} />
      <Limb pts={[[43, 78], [43, 86]]} w={6} c={C.skin} />
      <Limb pts={[[53, 78], [53, 86]]} w={6} c={C.skin} />
      <Limb pts={[[48, 40], [48, 62]]} w={19} c={C.primary} />
      <Limb pts={[[48, 56], [48, 66]]} w={19} c={C.pants} />
      <Limb pts={[[39, 39], [30, 28], [33, 13]]} w={ARM} c={C.skin} />
      <Limb pts={[[57, 39], [66, 28], [63, 13]]} w={ARM} c={C.skin} />
      <circle cx="33" cy="12" r="3.2" fill={C.skin} />
      <circle cx="63" cy="12" r="3.2" fill={C.skin} />
      <Head x={48} y={27} dir={0} r={7} />
    </g>
  );
}

function PoseAgachamento() {
  return (
    <g>
      <Limb pts={[[59, 62], [38, 64]]} w={THIGH + 1} c={C.pants} />
      <Limb pts={[[38, 65], [44, 83]]} w={SHIN} c={C.skin} />
      <Limb pts={[[59, 64], [54, 36]]} w={12} c={C.primary} />
      <Limb pts={[[59, 60], [60, 66]]} w={11} c={C.pants} />
      <Head x={52} y={26} dir={-1} />
      <Limb pts={[[53, 38], [45, 42]]} w={ARM} c={C.skin} />
      <Plate x={56} y={37} r={10} />
    </g>
  );
}

function PoseStiff() {
  return (
    <g>
      <Limb pts={[[58, 54], [57, 70], [55, 83]]} w={THIGH} c={C.pants} />
      <Limb pts={[[56, 72], [55, 83]]} w={SHIN} c={C.skin} />
      <Limb pts={[[58, 52], [35, 40]]} w={12} c={C.primary} />
      <Limb pts={[[58, 52], [59, 58]]} w={11} c={C.pants} />
      <Head x={26} y={38} dir={-1} />
      <Limb pts={[[37, 43], [39, 62]]} w={ARM} c={C.skin} />
      <Plate x={39} y={66} r={10} />
    </g>
  );
}

function PoseHipThrust() {
  return (
    <g>
      <rect x="8" y="54" width="26" height="30" rx="4" fill={C.bench} />
      <Limb pts={[[52, 52], [68, 56], [69, 80]]} w={THIGH} c={C.pants} />
      <Limb pts={[[69, 62], [69, 82]]} w={SHIN} c={C.skin} />
      <Limb pts={[[27, 50], [52, 53]]} w={12} c={C.primary} />
      <Limb pts={[[50, 53], [56, 54]]} w={11} c={C.pants} />
      <Head x={17} y={47} dir={1} />
      <Limb pts={[[29, 52], [46, 50]]} w={ARM} c={C.skin} />
      <Plate x={51} y={50} r={9.5} />
    </g>
  );
}

function PoseElevacaoLateral() {
  return (
    <g>
      <path d="M13 44A38 38 0 0 1 22 22M83 44A38 38 0 0 0 74 22" fill="none" stroke={C.primary} strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" opacity="0.6" />
      <Limb pts={[[43, 62], [42, 84]]} w={8.5} c={C.pants} />
      <Limb pts={[[53, 62], [54, 84]]} w={8.5} c={C.pants} />
      <Limb pts={[[42, 78], [42, 86]]} w={6} c={C.skin} />
      <Limb pts={[[54, 78], [54, 86]]} w={6} c={C.skin} />
      <Limb pts={[[48, 38], [48, 56]]} w={19} c={C.primary} />
      <Limb pts={[[48, 56], [48, 66]]} w={19} c={C.pants} />
      <Limb pts={[[39, 36], [28, 36], [18, 33]]} w={ARM} c={C.skin} />
      <Limb pts={[[57, 36], [68, 36], [78, 33]]} w={ARM} c={C.skin} />
      <Dumb x={15} y={33} rot={90} />
      <Dumb x={81} y={33} rot={90} />
      <Head x={48} y={24} dir={0} r={7} />
    </g>
  );
}

function PoseRosca() {
  return (
    <g>
      <path d="M48 56A14 14 0 0 1 36 40" fill="none" stroke={C.primary} strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" opacity="0.6" transform="translate(-2 -2)" />
      <Limb pts={[[50, 62], [50, 84]]} w={9} c={C.pants} />
      <Limb pts={[[50, 79], [47, 86]]} w={6.5} c={C.skin} />
      <Limb pts={[[50, 36], [50, 62]]} w={13} c={C.primary} />
      <Limb pts={[[50, 56], [50, 66]]} w={13} c={C.pants} />
      <Head x={50} y={24} dir={-1} r={7} />
      <Limb pts={[[48, 38], [47, 53], [37, 45]]} w={ARM} c={C.skin} />
      <Dumb x={34} y={44} rot={70} />
    </g>
  );
}

function PoseTriceps() {
  return (
    <g>
      <rect x="72" y="8" width="9" height="78" rx="3" fill={C.metal} opacity="0.55" />
      <rect x="74" y="6" width="5" height="22" rx="2.5" fill={C.metalDark} opacity="0.85" />
      <circle cx="76.5" cy="12" r="5" fill={C.metalDark} />
      <circle cx="76.5" cy="12" r="1.8" fill={C.metal} />
      <line x1="72" y1="12" x2="59" y2="65" stroke={C.metalDark} strokeWidth="1.5" />
      <Limb pts={[[47, 62], [46, 84]]} w={9} c={C.pants} />
      <Limb pts={[[46, 79], [49, 86]]} w={6.5} c={C.skin} />
      <Limb pts={[[47, 36], [47, 62]]} w={13} c={C.primary} />
      <Limb pts={[[47, 56], [47, 66]]} w={13} c={C.pants} />
      <Head x={48} y={24} dir={1} r={7} />
      <Limb pts={[[48, 39], [50, 53], [58, 65]]} w={ARM} c={C.skin} />
      <rect x="52" y="64" width="16" height="3.4" rx="1.7" fill={C.metalDark} />
    </g>
  );
}

function PosePuxada() {
  return (
    <g>
      <rect x="10" y="4" width="76" height="6" rx="3" fill={C.metal} opacity="0.55" />
      <line x1="48" y1="9" x2="48" y2="18" stroke={C.metalDark} strokeWidth="1.5" />
      <rect x="22" y="17" width="52" height="3.6" rx="1.8" fill={C.metal} />
      <rect x="22" y="15" width="4" height="7.6" rx="2" fill={C.metalDark} />
      <rect x="70" y="15" width="4" height="7.6" rx="2" fill={C.metalDark} />
      <rect x="32" y="62" width="32" height="7" rx="3.5" fill={C.bench} />
      <rect x="45" y="69" width="6" height="17" fill={C.bench} />
      <Limb pts={[[41, 64], [37, 72], [37, 84]]} w={8.5} c={C.pants} />
      <Limb pts={[[55, 64], [59, 72], [59, 84]]} w={8.5} c={C.pants} />
      <Limb pts={[[37, 78], [37, 86]]} w={6.5} c={C.skin} />
      <Limb pts={[[59, 78], [59, 86]]} w={6.5} c={C.skin} />
      <Limb pts={[[48, 42], [48, 62]]} w={19} c={C.primary} />
      <Limb pts={[[48, 58], [48, 66]]} w={19} c={C.pants} />
      <Limb pts={[[39, 42], [30, 32], [27, 20]]} w={ARM} c={C.skin} />
      <Limb pts={[[57, 42], [66, 32], [69, 20]]} w={ARM} c={C.skin} />
      <Head x={48} y={30} dir={0} r={7} />
    </g>
  );
}

const POSES: Record<string, () => ReactNode> = {
  supino: PoseSupino,
  inclinado: PoseSupino,
  remada_a: PoseRemada,
  remada_b: PoseRemada,
  barra: PoseBarraFixa,
  agach: PoseAgachamento,
  bulg: PoseAgachamento,
  stiff: PoseStiff,
  hip_l: PoseHipThrust,
  hip_b: PoseHipThrust,
  lat_a: PoseElevacaoLateral,
  lat_b: PoseElevacaoLateral,
  rosca_a: PoseRosca,
  rosca_b: PoseRosca,
  tri_a: PoseTriceps,
  tri_b: PoseTriceps,
  puxada: PosePuxada,
};

export interface ExerciseIllustrationProps extends IllustrationProps {
  exId: string;
  /** Grupo do exercício (muscleGroupOf), usado quando não há pose específica. */
  group: MuscleGroup | null;
}

export function ExerciseIllustration({ exId, group, size, title, className }: ExerciseIllustrationProps) {
  const id = safeId(useId());
  const Pose = Object.prototype.hasOwnProperty.call(POSES, exId) ? POSES[exId] : null;
  if (!Pose) return <MuscleIllustration group={group} size={size} title={title} className={className} />;
  return (
    <Root w={96} h={96} size={size} title={title} className={className}>
      <PoseFrame id={id}>
        <Pose />
      </PoseFrame>
    </Root>
  );
}

/* ------------------------------------------------------------------ */
/* Refeições (vista de cima, 120 x 90)                                  */
/* ------------------------------------------------------------------ */

export type MealKey = 'cafe' | 'almoco' | 'lanche' | 'pos' | 'jantar';

export interface MealIllustrationProps extends IllustrationProps {
  meal: MealKey;
}

function PlateBase({ id, r = 38, rim = '#FFFFFF', inner = '#FBFAF7' }: { id: string; r?: number; rim?: string; inner?: string }) {
  return (
    <g>
      <circle cx={62} cy={49} r={r} fill="#7A4A1F" opacity="0.16" />
      <circle cx={60} cy={45} r={r} fill={`url(#${id}-rim)`} />
      <circle cx={60} cy={45} r={r * 0.8} fill={inner} stroke="#E4DDD0" strokeWidth="1" />
      <path d={`M${60 - r * 0.9} ${45 - r * 0.25}A${r * 0.94} ${r * 0.94} 0 0 1 ${60 - r * 0.3} ${45 - r * 0.9}`} fill="none" stroke={rim} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
    </g>
  );
}

function Strawberry({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -6C-6 -8 -10 -3 -8 3C-6 8 -2 11 0 11C2 11 6 8 8 3C10 -3 6 -8 0 -6Z" fill="#E2323F" />
      <path d="M-3 -4C-6 -2 -6 3 -4 6C-6 2 -5 -2 -3 -4Z" fill="#FF8A93" opacity="0.8" />
      <circle cx="-3" cy="1" r="0.8" fill="#FFE9A8" />
      <circle cx="2.5" cy="0" r="0.8" fill="#FFE9A8" />
      <circle cx="0" cy="5" r="0.8" fill="#FFE9A8" />
      <circle cx="4" cy="4" r="0.8" fill="#FFE9A8" />
      <path d="M-5 -6L0 -3L5 -6L2 -9L-2 -9Z" fill="#3FA34D" />
    </g>
  );
}

function Blueberry({ x, y, r = 3.6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#3E4CA8" />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.35} fill="#8F9CE8" opacity="0.9" />
      <circle cx={x + r * 0.15} cy={y + r * 0.1} r={r * 0.2} fill="#242F80" />
    </g>
  );
}

function Broccoli({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M-2.5 2L-3.5 11L3.5 11L2.5 2Z" fill="#9CCB5A" />
      <circle cx="-5.5" cy="-1" r="5.2" fill="#2E8B3E" />
      <circle cx="5.5" cy="-1" r="5.2" fill="#2E8B3E" />
      <circle cx="0" cy="-5" r="6" fill="#3FA34D" />
      <circle cx="0" cy="1" r="5" fill="#4DB257" />
      <circle cx="-2" cy="-6.5" r="1.6" fill="#8ADB85" opacity="0.8" />
      <circle cx="5" cy="-3" r="1.3" fill="#8ADB85" opacity="0.7" />
      <circle cx="-6.5" cy="-2" r="1.2" fill="#6CC871" opacity="0.7" />
    </g>
  );
}

function MealBackdrop({ id }: { id: string }) {
  return (
    <>
      <defs>
        <clipPath id={`${id}-clip`}><rect width="120" height="90" rx="18" /></clipPath>
        <linearGradient id={`${id}-tbl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCE8CC" />
          <stop offset="1" stopColor="#F2CFA0" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E9E3D8" />
        </linearGradient>
        <linearGradient id={`${id}-chk`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4D9AE" />
          <stop offset="1" stopColor="#DFB074" />
        </linearGradient>
        <linearGradient id={`${id}-fish`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBB07A" />
          <stop offset="1" stopColor="#E5673F" />
        </linearGradient>
        <linearGradient id={`${id}-shk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5CDE0" />
          <stop offset="1" stopColor="#E391B6" />
        </linearGradient>
      </defs>
      <rect width="120" height="90" fill={`url(#${id}-tbl)`} />
      <path d="M0 62L70 0L96 0L0 82Z" fill="#FFFFFF" opacity="0.14" />
      <path d="M30 90L120 14L120 38L58 90Z" fill="#FFFFFF" opacity="0.1" />
    </>
  );
}

function MealCafe({ id }: { id: string }) {
  return (
    <g>
      <PlateBase id={id} />
      <circle cx="60" cy="45" r="25" fill="#F1E2C2" />
      <circle cx="60" cy="45" r="25" fill="none" stroke="#E2CDA2" strokeWidth="1.4" />
      <g fill="#D9BF8C">
        <circle cx="52" cy="38" r="0.9" /><circle cx="64" cy="50" r="0.9" /><circle cx="58" cy="58" r="0.9" />
        <circle cx="70" cy="38" r="0.9" /><circle cx="48" cy="52" r="0.9" /><circle cx="62" cy="34" r="0.9" />
      </g>
      <path d="M44 50Q54 42 66 44T78 52" fill="none" stroke="#E0A53A" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
      {[[46, 38], [53, 33], [43, 48], [52, 44]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="6.2" fill="#FFE490" stroke="#F0BE4A" strokeWidth="1" />
          <circle cx={x} cy={y} r="1.3" fill="#D9A634" />
        </g>
      ))}
      <Blueberry x={68} y={36} /><Blueberry x={74} y={42} /><Blueberry x={66} y={44} /><Blueberry x={72} y={51} /><Blueberry x={62} y={53} />
      <Strawberry x={60} y={60} s={0.8} rot={20} />
      <g transform="rotate(-24 108 62)">
        <ellipse cx="108" cy="46" rx="5.5" ry="7.6" fill="#B7C0D2" />
        <ellipse cx="108" cy="45" rx="3.8" ry="5.6" fill="#E3E8F1" />
        <rect x="106.6" y="52" width="2.8" height="30" rx="1.4" fill="#B7C0D2" />
      </g>
    </g>
  );
}

function MealAlmoco({ id }: { id: string }) {
  const grill = (x: number, y: number) => <path d={`M${x} ${y}l9 -7M${x + 5} ${y + 4}l9 -7`} stroke="#9C5F2C" strokeWidth="1.7" strokeLinecap="round" opacity="0.75" />;
  return (
    <g>
      <PlateBase id={id} />
      {/* salada */}
      <g>
        <ellipse cx="42" cy="30" rx="10" ry="6" transform="rotate(-30 42 30)" fill="#2F8A3E" />
        <ellipse cx="50" cy="26" rx="9" ry="5" transform="rotate(20 50 26)" fill="#7BC043" />
        <ellipse cx="38" cy="38" rx="9" ry="5" transform="rotate(30 38 38)" fill="#4FA34A" />
        <ellipse cx="48" cy="35" rx="8" ry="4.6" transform="rotate(-10 48 35)" fill="#A6D854" />
        <ellipse cx="44" cy="31" rx="5" ry="2.6" transform="rotate(40 44 31)" fill="#C9EB7B" opacity="0.8" />
        <circle cx="34" cy="31" r="4.4" fill="#E8453C" /><circle cx="33" cy="29.8" r="1.2" fill="#FF9F95" />
        <circle cx="53" cy="36" r="3.8" fill="#E8453C" /><circle cx="52" cy="35" r="1" fill="#FF9F95" />
        <circle cx="41" cy="24" r="3.4" fill="#F7C531" /><circle cx="40.2" cy="23.2" r="0.9" fill="#FFF0A3" />
      </g>
      {/* arroz */}
      <g>
        <ellipse cx="50" cy="61" rx="15" ry="10" fill="#EFE8D4" />
        <ellipse cx="49" cy="59.5" rx="14" ry="9" fill="#FFFDF6" />
        <g fill="#E3DAC2">
          <ellipse cx="44" cy="58" rx="2" ry="0.9" transform="rotate(-20 44 58)" /><ellipse cx="52" cy="56" rx="2" ry="0.9" transform="rotate(30 52 56)" />
          <ellipse cx="48" cy="63" rx="2" ry="0.9" /><ellipse cx="56" cy="61" rx="2" ry="0.9" transform="rotate(-30 56 61)" />
          <ellipse cx="42" cy="64" rx="2" ry="0.9" transform="rotate(25 42 64)" />
        </g>
      </g>
      {/* frango */}
      <g>
        <rect x="58" y="40" width="26" height="12" rx="6" transform="rotate(-16 71 46)" fill={`url(#${id}-chk)`} />
        <rect x="62" y="46" width="26" height="12" rx="6" transform="rotate(-10 75 52)" fill={`url(#${id}-chk)`} stroke="#E8C690" strokeWidth="0.8" />
        <rect x="64" y="55" width="22" height="11" rx="5.5" transform="rotate(-6 75 60)" fill={`url(#${id}-chk)`} stroke="#E8C690" strokeWidth="0.8" />
        {grill(66, 52)}{grill(72, 59)}{grill(70, 68)}
      </g>
      <circle cx="82" cy="34" r="2" fill="#3FA34D" /><circle cx="85" cy="37" r="1.4" fill="#2E8B3E" />
    </g>
  );
}

function MealLanche({ id }: { id: string }) {
  const gran: Array<[number, number, number, string]> = [
    [56, 40, 20, '#C98B45'], [63, 37, -30, '#D9A55E'], [70, 42, 40, '#B8753A'], [60, 46, -10, '#D9A55E'], [68, 49, 25, '#C98B45'],
    [76, 47, -35, '#B8753A'], [58, 54, 50, '#B8753A'], [65, 55, -20, '#D9A55E'], [73, 55, 15, '#C98B45'], [52, 47, 10, '#D9A55E'],
    [78, 38, 30, '#D9A55E'], [48, 40, -40, '#C98B45'],
  ];
  return (
    <g>
      <PlateBase id={id} inner="#F3F7FC" rim="#FFFFFF" />
      <circle cx="60" cy="45" r="28" fill="#FFFFFF" stroke="#DCE5F2" strokeWidth="1.4" />
      <path d="M38 40Q50 34 60 42T82 46" fill="none" stroke="#E9E4F2" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M40 54Q52 62 66 56T80 58" fill="none" stroke="#E9E4F2" strokeWidth="2" strokeLinecap="round" />
      {gran.map(([x, y, r, c]) => (
        <rect key={`${x}-${y}`} x={x - 3.6} y={y - 2.4} width="7.2" height="4.8" rx="2.2" transform={`rotate(${r} ${x} ${y})`} fill={c} />
      ))}
      <Strawberry x={46} y={52} s={0.95} rot={-25} />
      <Strawberry x={72} y={36} s={0.8} rot={30} />
      <Blueberry x={62} y={61} r={3} />
      <path d="M52 32C52 27 56 25 60 25C60 30 57 32 52 32Z" fill="#3FA34D" />
    </g>
  );
}

function MealPos({ id }: { id: string }) {
  return (
    <g>
      <ellipse cx="62" cy="80" rx="26" ry="5" fill="#7A4A1F" opacity="0.18" />
      {/* banana */}
      <path d="M12 66Q22 84 46 76Q26 80 16 62Z" fill="#F7D548" stroke="#E0B22A" strokeWidth="1" strokeLinejoin="round" />
      <path d="M12 66L10 62" stroke="#7A5A22" strokeWidth="2.2" strokeLinecap="round" />
      {/* scoop */}
      <path d="M92 58L110 58L108 78Q101 82 94 78Z" fill="#FFFFFF" stroke="#DCD5C8" strokeWidth="1" />
      <ellipse cx="101" cy="58" rx="9" ry="3.2" fill="#F5E4C5" />
      <path d="M93 66L109 66" stroke="#3E73F0" strokeWidth="3.4" opacity="0.9" />
      {/* copo */}
      <path d="M42 18L82 18L77 76Q76 80 72 80L52 80Q48 80 47 76Z" fill="#FFFFFF" opacity="0.65" stroke="#D9E3F1" strokeWidth="1.4" />
      <path d="M44 30L80 30L76.4 74Q75.6 77 72 77L52 77Q48.4 77 47.6 74Z" fill={`url(#${id}-shk)`} />
      <ellipse cx="62" cy="30" rx="18" ry="3.8" fill="#FBE3EE" />
      <path d="M49 38L52 70" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" opacity="0.45" />
      <path d="M72 36L70 60" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.3" />
      {/* canudo */}
      <path d="M68 4L61 56" stroke="#1F63F2" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M67.4 9L66.3 21M65.4 29L64.3 41" stroke="#FFFFFF" strokeWidth="4.4" opacity="0.9" />
      <Strawberry x={79} y={21} s={0.75} rot={25} />
    </g>
  );
}

function MealJantar({ id }: { id: string }) {
  return (
    <g>
      <PlateBase id={id} />
      {/* peixe */}
      <path d="M58 33Q70 26 88 32Q94 38 90 46Q84 58 66 58Q54 56 52 46Q52 38 58 33Z" fill={`url(#${id}-fish)`} />
      <path d="M62 36Q74 32 86 36M60 42Q74 38 90 42M60 48Q72 45 86 48" fill="none" stroke="#FFD0B2" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      <path d="M66 52L80 34M74 55L88 40" stroke="#A9482A" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      {/* brócolis */}
      <Broccoli x={36} y={34} s={1.05} rot={-15} />
      <Broccoli x={46} y={26} s={0.85} rot={20} />
      {/* batata-doce */}
      {[[38, 58, 15], [48, 63, -10], [30, 50, -20], [56, 60, 25]].map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 6} y={y - 6} width="12" height="12" rx="3.2" fill="#E9801F" />
          <rect x={x - 6} y={y - 6} width="12" height="6.4" rx="3.2" fill="#FFB04F" />
          <rect x={x - 3.4} y={y - 4.4} width="3" height="1.6" rx="0.8" fill="#FFE0A8" opacity="0.8" />
        </g>
      ))}
      <circle cx="84" cy="58" r="4.6" fill="#FF9A2E" /><circle cx="84" cy="58" r="2" fill="#FFC074" />
      <circle cx="75" cy="64" r="3.8" fill="#FF9A2E" /><circle cx="75" cy="64" r="1.6" fill="#FFC074" />
    </g>
  );
}

export function MealIllustration({ meal, size, title, className }: MealIllustrationProps) {
  const id = safeId(useId());
  let body: ReactNode;
  switch (meal) {
    case 'cafe': body = <MealCafe id={id} />; break;
    case 'almoco': body = <MealAlmoco id={id} />; break;
    case 'pos': body = <MealPos id={id} />; break;
    case 'jantar': body = <MealJantar id={id} />; break;
    default: body = <MealLanche id={id} />;
  }
  return (
    <Root w={120} h={90} size={size} title={title} className={className}>
      <MealBackdrop id={id} />
      <g clipPath={`url(#${id}-clip)`}>
        {body}
      </g>
    </Root>
  );
}
