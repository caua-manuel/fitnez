import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

// Folha das metas de dieta: aberta poucas vezes, fica fora da carga inicial (ADR 011, orçamento de peso).
// Sem Suspense: aparece assim que o módulo chega (o módulo também está no precache, offline).
type Mod = typeof import('./MetasSheet');
let cached: Mod | null = null;
const load = () => import('./MetasSheet').then(m => (cached = m));
export function MetasSheet(props: ComponentProps<Mod['MetasSheet']>) {
 const [mod, setMod] = useState<Mod | null>(cached);
 useEffect(() => { let on = true; if (!mod) void load().then(m => { if (on) setMod(m); }); return () => { on = false; }; }, [mod]);
 return mod ? <mod.MetasSheet {...props} /> : null;
}
