import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { Icon } from '../../ui/icons';
import { Sheet, ConfirmSheet } from '../../ui/Sheet';
import { Menu } from '../../ui/Menu';
import { showToast } from '../../ui/UndoToast';
import type { DayIso } from '../../domain/calendar';
import { editDietOption } from '../../domain/diet';
import type { DietOption, DietOptionFields, MealKey } from '../../domain/diet';
import { MealThumb } from './parts';
import { MealTop } from './Refeicao';
import { useStagger } from '../treino/stagger';
import { MEAL_LOWER, MEAL_NAME, catalogOf, fmt, nextKey, parseDecimal, showDecimal } from './dietData';

interface Fields { name: string; items: string; kcal: string; p: string; c: string; g: string }
const EMPTY: Fields = { name: '', items: '', kcal: '', p: '', c: '', g: '' };
type Errors = Partial<Record<keyof Fields, string>>;

function validate(f: Fields): { errors: Errors; value?: DietOptionFields } {
 const errors: Errors = {};
 const name = f.name.trim();
 const items = f.items.split('\n').map(x => x.trim()).filter(Boolean);
 if (!name) errors.name = 'Informe o nome da opção.';
 if (!items.length) errors.items = 'Informe pelo menos um item, um por linha.';
 const num = (k: 'kcal' | 'p' | 'c' | 'g', label: string) => {
  const v = parseDecimal(f[k]);
  if (v === null) errors[k] = f[k].trim() ? `${label}: use só números, com vírgula ou ponto.` : `Informe ${label.toLowerCase()}.`;
  return v;
 };
 const kcal = num('kcal', 'As calorias'), p = num('p', 'A proteína'), c = num('c', 'O carboidrato'), g = num('g', 'A gordura');
 if (Object.keys(errors).length || kcal === null || p === null || c === null || g === null) return { errors };
 return { errors, value: { name, items, kcal, p, c, g } };
}

const LABELS: Record<keyof Fields, string> = { name: 'Nome', items: 'Itens (um por linha)', kcal: 'Calorias (kcal)', p: 'Proteína (g)', c: 'Carboidrato (g)', g: 'Gordura (g)' };

function OptionForm({ initial, title, hasRecipe, onSave, onClose }: { initial: Fields; title: string; hasRecipe?: boolean; onSave: (v: DietOptionFields) => void; onClose: () => void }) {
 const [f, setF] = useState<Fields>(initial);
 const [errors, setErrors] = useState<Errors>({});
 const set = (k: keyof Fields) => (e: { target: { value: string } }) => setF(prev => ({ ...prev, [k]: e.target.value }));
 const submit = (e: FormEvent) => {
  e.preventDefault();
  const r = validate(f);
  setErrors(r.errors);
  if (r.value) {
   if ((Object.keys(f) as (keyof Fields)[]).every(k => f[k] === initial[k])) onClose();
   else onSave(r.value);
  }
  else requestAnimationFrame(() => document.querySelector<HTMLElement>('.dt-sheet [aria-invalid=true]')?.focus());
 };
 const field = (k: keyof Fields, node: ReactNode) => <div className={`dt-field${errors[k] ? ' bad' : ''}`}>
  <label htmlFor={`dt-f-${k}`}>{LABELS[k]}</label>
  {node}
  {errors[k] ? <p className="dt-error" id={`dt-e-${k}`}><Icon name="info" size={18} />{errors[k]}</p> : null}
 </div>;
 const nk = parseDecimal(f.kcal), np = parseDecimal(f.p), nc = parseDecimal(f.c), ng = parseDecimal(f.g);
 const sum = nk !== null && np !== null && nc !== null && ng !== null ? Math.round(np * 4 + nc * 4 + ng * 9) : null;
 const mismatch = sum !== null && nk !== null && nk > 0 && Math.abs(sum - nk) / nk > 0.1 ? sum : null;
 const common = (k: keyof Fields) => ({ id: `dt-f-${k}`, value: f[k], onChange: set(k), 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `dt-e-${k}` : undefined });
 return <Sheet title={title} onClose={onClose} initialFocus="#dt-f-name" className="dt-sheet">
  <form onSubmit={submit} noValidate className="dt-form">
   {field('name', <input type="text" autoComplete="off" maxLength={120} {...common('name')} />)}
   {field('items', <textarea rows={5} {...common('items')} />)}
   {field('kcal', <input type="text" inputMode="decimal" {...common('kcal')} />)}
   {mismatch !== null ? <p className="dt-note dt-hint" role="note">Os macros somam cerca de {mismatch} kcal, diferente das calorias informadas. Você pode salvar assim.</p> : null}
   {hasRecipe ? <p className="dt-note dt-hint" role="note">Esta opção tem uma receita. Ela não muda quando você edita os itens.</p> : null}
   <div className="dt-form-macros">
    {field('p', <input type="text" inputMode="decimal" {...common('p')} />)}
    {field('c', <input type="text" inputMode="decimal" {...common('c')} />)}
    {field('g', <input type="text" inputMode="decimal" {...common('g')} />)}
   </div>
   <div className="dt-form-actions">
    <button type="submit" className="button">Salvar opção</button>
    <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
   </div>
  </form>
 </Sheet>;
}

const toFields = (o: DietOption): Fields => ({ name: o.name, items: o.items.join('\n'), kcal: showDecimal(o.kcal), p: showDecimal(o.p), c: showDecimal(o.c), g: showDecimal(o.g) });

export function GerenciarOpcoes({ meal, day, today }: { meal: MealKey; day: DayIso; today: DayIso; setDay: (d: DayIso) => void }) {
 const { state, commit } = useData();
 const [form, setForm] = useState<{ mode: 'new' | 'edit'; key?: string } | null>(null);
 const [confirm, setConfirm] = useState<DietOption | null>(null);
 const rv = useStagger('dieta-gerenciar');
 if (!state) return null;
 const options = catalogOf(state)[meal];

 // Editar o cardápio vale para todos os dias. Dias já registrados guardam uma cópia em `consumed` e não mudam.
 const saveList = (next: DietOption[]) => commit(s => {
  s.catalog.diet = { ...s.catalog.diet, [meal]: next };
  s.catalog.revision = (s.catalog.revision ?? 0) + 1;
  return s;
 });

 const editing = form?.mode === 'edit' ? options.find(o => o.key === form.key) : undefined;
 const onSave = (v: DietOptionFields) => {
  if (!form) return;
  if (form.mode === 'new') void saveList([...options, { key: nextKey(options), ...v }]);
  else if (editing) {
   const edited = editDietOption(editing, v);
   if (edited === editing) { setForm(null); return; }
   void saveList(options.map(o => o === editing ? edited : o));
  } else return;
  const prev = options;
  showToast('Opção salva', () => void saveList(prev));
  setForm(null);
 };
 const duplicate = (o: DietOption) => { const i = options.findIndex(x => x.key === o.key); const copy = { ...o, key: nextKey(options), name: `${o.name} (cópia)`, items: [...o.items] }; void saveList([...options.slice(0, i + 1), copy, ...options.slice(i + 1)]); const prev = options; showToast('Opção duplicada', () => void saveList(prev)); };
 const remove = (o: DietOption) => {
  const prev = options; setConfirm(null);
  void saveList(options.filter(x => x.key !== o.key));
  showToast('Opção excluída', () => void saveList(prev));
 };
 return <div className="dt dt-manage tone-dieta">
  <MealTop meal={meal} day={day} today={today} manage />
  <p className="dt-manage-intro">Cadastre e gerencie as opções de {MEAL_LOWER[meal]} do seu plano alimentar.</p>
  {options.length === 0 ? <p className="dt-note">Nenhuma opção cadastrada para {MEAL_LOWER[meal]}. Toque em Adicionar nova opção para criar a primeira.</p> : null}
  <ul className="dt-manage-list" aria-label={`Opções de ${MEAL_LOWER[meal]}`}>
   {options.map((o, i) => <li key={o.key} {...rv(i, 'dt-mopt')}>
    <MealThumb meal={meal} option={o.key} size={64} />
    <div className="dt-mopt-text">
     <span className="dt-tag">Opção {i + 1}</span>
     <strong className="dt-opt-name">{o.name}</strong>
     {state.settings.onboarding?.hideDietNumbers ? null : <span className="dt-opt-kcal">{fmt(o.kcal)} kcal</span>}
    </div>
    <Menu label={`Mais ações da opção ${i + 1}, ${o.name}`} className="dt-menu-wrap" buttonClassName="icon-button dt-dots" trigger={<Icon name="mais" size={26} className="dots-h" />}
     items={[
      { label: 'Editar', icon: 'editar', onClick: () => setForm({ mode: 'edit', key: o.key }) },
      { label: 'Duplicar', icon: 'copiar', onClick: () => duplicate(o) },
      ...(options.length > 1 ? [{ label: 'Excluir', danger: true, onClick: () => setConfirm(o) }] : []),
     ]} />
   </li>)}
  </ul>
  {options.length === 1 ? <p className="dt-menu-help">Mantenha ao menos uma opção: com uma só, Excluir não aparece no menu.</p> : null}
  <button type="button" className="button secondary block dt-add" onClick={() => setForm({ mode: 'new' })}><Icon name="plus" size={20} weight={2} />Adicionar nova opção</button>

  {form && (form.mode === 'new' || editing) ? <OptionForm key={`${form.mode}-${form.key ?? 'novo'}`} title={form.mode === 'new' ? `Nova opção de ${MEAL_LOWER[meal]}` : 'Editar opção'} initial={editing ? toFields(editing) : EMPTY} hasRecipe={Boolean(editing?.rec)} onSave={onSave} onClose={() => setForm(null)} /> : null}
  {confirm ? <ConfirmSheet title={`Excluir ${confirm.name}?`} confirmLabel="Excluir opção" onCancel={() => setConfirm(null)} onConfirm={() => remove(confirm)}>
   <p className="dt-confirm-text">A opção sai do cardápio de {MEAL_NAME[meal].toLowerCase()}. Os dias que você já registrou continuam como estão. Você poderá desfazer por 6 segundos.</p>
  </ConfirmSheet> : null}
 </div>;
}
