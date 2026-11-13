/** Marca Fitnez: halter robusto em azul com folha verde, nome em peso 800 e slogan com espaçamento largo. */
export function Logo(props: { size?: number; withTagline?: boolean }) {
  const size = props.size ?? 36;
  const word = size * 0.98;
  return (
    <span className="logo" role="img" aria-label="Fitnez" style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>
      <svg width={size * 1.9} height={size * 1.28} viewBox="0 -2 70 49" aria-hidden="true" focusable="false">
        <g fill="var(--primary)">
          <rect x="1" y="17" width="6" height="21" rx="3" />
          <rect x="9" y="9" width="9" height="37" rx="4" />
          <rect x="52" y="9" width="9" height="37" rx="4" />
          <rect x="63" y="17" width="6" height="21" rx="3" />
          <rect x="17" y="24" width="36" height="7" rx="3.5" />
        </g>
        <path d="M32 22c-2-10 3-18 15-21 2 11-3 19-15 21Z" fill="var(--leaf)" />
        <path d="M34.500 19.500c3.500-5.500 7.500-10 12-14" fill="none" stroke="var(--card)" strokeWidth="1.800" strokeLinecap="round" />
      </svg>
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
        <span className="logo-word" style={{ fontSize: word }}>Fitnez</span>
        {props.withTagline ? <span className="logo-tagline" style={{ fontSize: Math.max(9, size * 0.3) }}>TREINO + DIETA</span> : null}
      </span>
    </span>
  );
}
