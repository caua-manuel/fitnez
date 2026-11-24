import type { Dedication, FoodAnswers, FoodRestriction, FoodStyle, MealsPerDay } from '../../domain/onboarding';

// Telas A e B do cardápio (ADR 013). Textos: docs/handoffs/conteudo-proposta-cardapio.md, seções 1 e 5. Nada é calculado aqui.
export const FOOD_STYLE_OPTS: [FoodStyle, string][] = [['tudo', 'Como de tudo'], ['vegetariano', 'Vegetariano (como ovo e laticínios)'], ['vegano', 'Vegano (nada de origem animal)']];
export const RESTRICTION_OPTS: [FoodRestriction, string][] = [['sem_lactose', 'Sem lactose'], ['sem_gluten', 'Sem glúten'], ['ovo', 'Alergia a ovo'], ['peixe', 'Alergia a peixe ou frutos do mar'], ['amendoim', 'Alergia a amendoim ou castanhas'], ['soja', 'Alergia a soja']];
export const ALLERGIES: readonly FoodRestriction[] = ['ovo', 'peixe', 'amendoim', 'soja'];
export const ALLERGY_NOTE = 'O app só tira esses alimentos da sugestão. Ele não garante que um produto seja livre de alérgenos: confira sempre o rótulo. Em caso de alergia, siga a orientação do seu médico.';
export const MEALS_OPTS: readonly MealsPerDay[] = [3, 4, 5];
export const DEDICATION_OPTS: [Dedication, string, string][] = [['cardapio', 'Seguir o cardápio', 'Quero refeições prontas, com quantidades.'], ['proteina', 'Só bater a proteína', 'Eu como do meu jeito. Me mostre quanto de proteína comer.']];
export const MENU_NOTE = 'Este cardápio é uma sugestão automática e não substitui nutricionista ou médico. Se você tem alguma condição de saúde, procure um profissional.';
export const NO_MENU_HEALTH = 'Para o seu caso, o ideal é montar a alimentação com nutricionista ou médico. O app mostra só orientações gerais.';
export const NO_MENU_PROTEIN = 'Coma do seu jeito. Tente ter uma fonte de proteína em cada refeição e marque no app quando bater a meta.';
export const OFF_TARGET = 'Não deu para chegar exatamente na meta com estes alimentos. Fique perto e veja a evolução semanal.';

/** "Alimentos que você não come": grupos da proposta ligados aos ids de src/data/foods/foods.json. */
export const DISLIKE_GROUPS: [string, string, string[]][] = [
 ['frango', 'Frango', ['frango_peito', 'frango_coxa']],
 ['carne', 'Carne vermelha', ['patinho_moido', 'alcatra', 'figado_bovino']],
 ['peixe', 'Peixe', ['tilapia', 'sardinha_lata', 'salmao']],
 ['atum', 'Atum em lata', ['atum_agua']],
 ['ovo', 'Ovo', ['ovo_cozido', 'clara_ovo']],
 ['leite', 'Leite', ['leite_desnatado', 'leite_integral', 'leite_zero_lactose']],
 ['iogurte', 'Iogurte', ['iogurte_desnatado', 'iogurte_grego']],
 ['queijo', 'Queijo', ['queijo_minas', 'queijo_mucarela', 'queijo_cottage', 'ricota']],
 ['tofu', 'Tofu', ['tofu_firme']],
 ['feijao', 'Feijão', ['feijao_carioca', 'feijao_preto']],
 ['lentilha', 'Lentilha ou grão-de-bico', ['lentilha', 'grao_de_bico']],
 ['batata_doce', 'Batata-doce', ['batata_doce']],
 ['aveia', 'Aveia', ['aveia_flocos']],
 ['pao', 'Pão', ['pao_frances', 'pao_forma_integral', 'pao_sem_gluten']],
 ['macarrao', 'Macarrão', ['macarrao', 'macarrao_sem_gluten']],
 ['banana', 'Banana', ['banana_prata']],
 ['brocolis', 'Brócolis', ['brocolis']],
];
/** Ids que o tipo de alimentação já tira (não ocupam a lista de "não como"). */
const ANIMAL = new Set(['frango_peito', 'frango_coxa', 'patinho_moido', 'alcatra', 'figado_bovino', 'tilapia', 'sardinha_lata', 'salmao', 'atum_agua']);
const ANIMAL_PRODUCTS = new Set(['ovo_cozido', 'clara_ovo', 'leite_desnatado', 'leite_integral', 'leite_zero_lactose', 'iogurte_desnatado', 'iogurte_grego', 'queijo_minas', 'queijo_mucarela', 'queijo_cottage', 'ricota']);

export function dislikeIds(groups: readonly string[], style: FoodStyle): string[] {
 const out = new Set<string>();
 for (const [k, , ids] of DISLIKE_GROUPS) if (groups.includes(k)) for (const id of ids) {
  if (style !== 'tudo' && ANIMAL.has(id)) continue;
  if (style === 'vegano' && ANIMAL_PRODUCTS.has(id)) continue;
  out.add(id);
 }
 return [...out];
}
export const groupsFromIds = (ids: readonly string[]): string[] => DISLIKE_GROUPS.filter(([, , g]) => g.some(id => ids.includes(id))).map(([k]) => k);

export interface FoodDraft { style: FoodStyle; restrictions: FoodRestriction[]; mealsPerDay: MealsPerDay; dedication: Dedication; groups: string[]; whey: boolean }
export const foodDraftOf = (f?: FoodAnswers): FoodDraft => f
 ? { style: f.style, restrictions: [...f.restrictions], mealsPerDay: f.mealsPerDay, dedication: f.dedication, groups: groupsFromIds(f.dislikes), whey: f.whey }
 : { style: 'tudo', restrictions: [], mealsPerDay: 4, dedication: 'cardapio', groups: [], whey: false };
export const foodAnswersOf = (d: FoodDraft): FoodAnswers => ({ style: d.style, restrictions: [...d.restrictions], mealsPerDay: d.mealsPerDay, dedication: d.dedication, dislikes: d.dedication === 'cardapio' ? dislikeIds(d.groups, d.style) : [], whey: d.whey });

