export type TokenName =
  | 'background' | 'foreground' | 'card' | 'secondary' | 'mutedForeground' | 'border' | 'input'
  | 'primary' | 'primaryForeground' | 'accentSoft' | 'ring' | 'success' | 'successSoft'
  | 'warning' | 'warningSoft' | 'destructive' | 'destructiveSoft'
  | 'accentTreino' | 'accentDieta' | 'accentEvolucao' | 'accentBrasa';

export const palette: Record<'light' | 'dark', Record<TokenName, string>> = {
  light: {
    background: '#FFFFFF', foreground: '#111113', card: '#FFFFFF', secondary: '#F7F7F8',
    mutedForeground: '#5E5E66', border: '#E6E6E8', input: '#767680', primary: '#0A58F0',
    primaryForeground: '#FFFFFF', accentSoft: '#EFEFF1', ring: '#0A58F0', success: '#0F6B45',
    successSoft: '#DDF3E8', warning: '#8A5100', warningSoft: '#FFEECB', destructive: '#B3202F',
    destructiveSoft: '#FDE4E7', accentTreino: '#0A58F0', accentDieta: '#16A34A', accentEvolucao: '#7C3AED', accentBrasa: '#D97706',
  },
  dark: {
    background: '#121214', foreground: '#F2F2F3', card: '#19191C', secondary: '#202024',
    mutedForeground: '#A1A1AA', border: '#2C2C31', input: '#7A7A83', primary: '#6C9BFF',
    primaryForeground: '#0B0B0C', accentSoft: '#26262B', ring: '#8DB0FF', success: '#4CC38A',
    successSoft: '#12352A', warning: '#F2B94B', warningSoft: '#3A2D0E', destructive: '#FF7C8B',
    destructiveSoft: '#3D1B24', accentTreino: '#6C9BFF', accentDieta: '#4ADE80', accentEvolucao: '#A78BFA', accentBrasa: '#FBBF24',
  },
};

/** Tokens de forma e tipografia (espelham as variáveis CSS de styles.css). Azul só em ação principal, item ativo e progresso. */
export const scale = {
  radius: { card: 16, control: 12, button: 14, sheet: 24, full: 999 },
  shadow: { card: '0 1px 2px rgba(0,0,0,.04)', button: 'none' },
  border: { hairline: '1px solid #E6E6E8', field: '#767680' },
  surface: { page: '#F4F4F5', soft: '#F7F7F8' },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, display: 800 },
  sheetWidth: 430,
  /** Trilho do interruptor desligado: >= 3:1 contra fundo, cartão e superfícies (WCAG 1.4.11). */
  switchOff: { light: '#767680', dark: '#7A7A83' },
} as const;

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
