export type DayIso = string;
export type TreinoView = 'lista' | 'detalhe' | 'executar' | 'concluido' | 'editar' | 'novo' | 'exercicio' | 'hoje';
export type DietMeal = 'cafe' | 'almoco' | 'lanche' | 'pos' | 'jantar';
export const DIET_MEALS: readonly DietMeal[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
export type Route =
 | { tab: 'inicio' } | { tab: 'evolucao' } | { tab: 'perfil' }
 | { tab: 'dieta'; meal?: DietMeal; manage?: boolean; day?: DayIso }
 | { tab: 'treino'; view: TreinoView; id?: string; day?: DayIso; ex?: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const VIEWS: readonly TreinoView[] = ['executar', 'concluido', 'editar', 'exercicio'];
// "_" nunca é id gerado (o id sai de texto sem sublinhado nas pontas): marca "novo" sem colidir com treinos ou exercícios.
const NEW = '_';

export function parseRoute(hash: string): Route {
 const clean = hash.replace(/^#/, '');
 const [path, query = ''] = clean.split('?');
 const parts = path.split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch { return p; } });
 const head = parts[0];
 if (head === 'dieta') {
  const meal = DIET_MEALS.find(m => m === parts[1]);
  const day = new URLSearchParams(query).get('dia');
  const route: Extract<Route, { tab: 'dieta' }> = { tab: 'dieta' };
  if (meal) { route.meal = meal; if (parts[2] === 'gerenciar') route.manage = true; }
  if (day && DAY.test(day)) route.day = day;
  return route;
 }
 if (head === 'evolucao' || head === 'perfil') return { tab: head };
 if (head === 'treino') {
  const id = parts[1];
  if (!id) return { tab: 'treino', view: 'lista' };
  if (id === NEW && parts[2] === 'novo') return { tab: 'treino', view: 'novo' };
  // Atalho do manifesto: o treino de hoje é resolvido ao abrir (Treino.tsx).
  if (id === NEW && parts[2] === 'hoje') return { tab: 'treino', view: 'hoje' };
  const view = VIEWS.find(v => v === parts[2]) ?? 'detalhe';
  const route: Extract<Route, { tab: 'treino' }> = { tab: 'treino', view, id };
  if (view === 'exercicio' && parts[3] && parts[3] !== NEW) route.ex = parts[3];
  const q = new URLSearchParams(query), day = q.get('dia'), list = q.get('ex');
  if ((view === 'executar' || view === 'concluido') && day && DAY.test(day)) route.day = day;
  // Treino livre: os exercícios escolhidos vão na URL (?ex=a,b), então recarregar ou voltar não perde a escolha.
  if (view === 'executar' && list) route.ex = list;
  return route;
 }
 return { tab: 'inicio' };
}

export function hrefFor(route: Route): string {
 if (route.tab === 'dieta') {
  const q = route.day ? `?dia=${route.day}` : '';
  if (!route.meal) return `#dieta${q}`;
  return `#dieta/${route.meal}${route.manage ? '/gerenciar' : ''}${q}`;
 }
 if (route.tab !== 'treino') return `#${route.tab}`;
 if (route.view === 'novo' || route.view === 'hoje') return `#treino/${NEW}/${route.view}`;
 if (!route.id || route.view === 'lista') return '#treino';
 const base = `#treino/${encodeURIComponent(route.id)}`;
 if (route.view === 'detalhe') return base;
 if (route.view === 'exercicio') return `${base}/exercicio/${route.ex ? encodeURIComponent(route.ex) : NEW}`;
 const q = new URLSearchParams();
 if (route.day) q.set('dia', route.day);
 if (route.view === 'executar' && route.ex) q.set('ex', route.ex);
 const qs = q.toString().replace(/%2C/g, ',');
 return `${base}/${route.view}${qs ? `?${qs}` : ''}`;
}
