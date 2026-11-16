/** Marca de confirmação cujo traço se desenha em 300 ms (CSS) quando `play` está ligado; sem `play`, aparece pronta. */
export function CheckDraw({ play = false, size = 18 }: { play?: boolean; size?: number }) {
  return <svg className={play ? 'mv-check is-playing' : 'mv-check'} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
  </svg>;
}
