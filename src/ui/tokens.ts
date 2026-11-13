export type TokenName =
  | 'background' | 'foreground' | 'card' | 'secondary' | 'mutedForeground' | 'border' | 'input'
  | 'primary' | 'primaryForeground' | 'accentSoft' | 'ring' | 'success' | 'successSoft'
  | 'warning' | 'warningSoft' | 'destructive' | 'destructiveSoft';

export const palette: Record<'light' | 'dark', Record<TokenName, string>> = {
  light: {
    background: '#FFFFFF', foreground: '#0F172A', card: '#FFFFFF', secondary: '#F7F9FC',
    mutedForeground: '#5F6F86', border: '#E6EAF2', input: '#76849B', primary: '#0A58F0',
    primaryForeground: '#FFFFFF', accentSoft: '#EAF1FF', ring: '#0A58F0', success: '#0F6B45',
    successSoft: '#DDF3E8', warning: '#8A5100', warningSoft: '#FFEECB', destructive: '#B3202F',
    destructiveSoft: '#FDE4E7',
  },
  dark: {
    background: '#0B1220', foreground: '#EEF3FF', card: '#111A2E', secondary: '#162036',
    mutedForeground: '#A6B4D0', border: '#243250', input: '#7D90B8', primary: '#6C9BFF',
    primaryForeground: '#06112B', accentSoft: '#1B2F63', ring: '#8DB0FF', success: '#4CC38A',
    successSoft: '#12352A', warning: '#F2B94B', warningSoft: '#3A2D0E', destructive: '#FF7C8B',
    destructiveSoft: '#3D1B24',
  },
};

/** Tokens de forma e tipografia (espelham as variáveis CSS de styles.css). Azul só em ação principal, item ativo e progresso. */
export const scale = {
  radius: { card: 16, control: 12, button: 14, sheet: 24, full: 999 },
  shadow: { card: '0 1px 2px rgba(16,24,40,.04)', button: 'none' },
  border: { hairline: '1px solid #E6EAF2', field: '#76849B' },
  surface: { page: '#F3F5F9', soft: '#F7F9FC' },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, display: 800 },
  sheetWidth: 430,
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
