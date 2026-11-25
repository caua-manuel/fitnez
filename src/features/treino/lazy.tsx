import { lazy, Suspense, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

// Telas e folhas abertas raramente ficam fora da carga inicial (ADR 011, orçamento de peso). Todas entram no precache,
// então funcionam offline; o primeiro toque só espera o módulo já baixado.
type ExMod = typeof import('./ExercicioPagina');
let exMod: ExMod | null = null;
const loadEx = () => import('./ExercicioPagina').then(m => (exMod = m));
/** Baixa a página do exercício antes do primeiro toque (chamado ao abrir a execução e o detalhe). */
export const preloadExercicio = () => { if (!exMod) void loadEx(); };
export const EditarTreino = lazy(() => import('./EditarTreino').then(m => ({ default: m.EditarTreino })));
export const EditarExercicio = lazy(() => import('./EditarExercicio').then(m => ({ default: m.EditarExercicio })));
export const NovoTreino = lazy(() => import('./NovoTreino').then(m => ({ default: m.NovoTreino })));
export const Biblioteca = lazy(() => import('./Biblioteca').then(m => ({ default: m.Biblioteca })));
const ComoFazer = lazy(() => import('./ComoFazer'));

export function ComoFazerSheet(props: ComponentProps<typeof ComoFazer>) {
 return <Suspense fallback={null}><ComoFazer {...props} /></Suspense>;
}

function useExercicioModule() {
 const [mod, setMod] = useState<ExMod | null>(exMod);
 useEffect(() => { let on = true; if (!mod) void loadEx().then(m => { if (on) setMod(m); }); return () => { on = false; }; }, [mod]);
 return mod;
}

/** Folhas do exercício. Abrem assim que o módulo chega, sem depender de timers. */
export function ExercicioSheet(props: ComponentProps<ExMod['ExercicioSheet']>) {
 const mod = useExercicioModule();
 return mod ? <mod.ExercicioSheet {...props} /> : null;
}

export function HistoricoRapido(props: ComponentProps<ExMod['HistoricoRapido']>) {
 const mod = useExercicioModule();
 return mod ? <mod.HistoricoRapido {...props} /> : null;
}

/** Espera curta enquanto uma tela sob demanda carrega. */
export const Carregando = () => <p className="loading" role="status">Abrindo…</p>;
