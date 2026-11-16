import { useData } from '../../app/DataProvider';
import type { DayIso } from '../../domain/calendar';
import { confirmExampleVersion, restoreDefaultVersion, settingsWithDietTargets, withDietTargetsVersion } from '../../domain/dietTargets';
import type { DietTargets, DietTargetsSetting } from '../../domain/dietTargets';
import { localDayOf } from '../../domain/planStart';
import { showToast } from '../../ui/UndoToast';

/**
 * Gravação das metas de dieta. As regras (versões, restaurar, confirmar) vêm de src/domain/dietTargets.ts;
 * aqui só se chama a gravação e se monta o aviso com Desfazer.
 */
export function useMetasActions() {
 const { state, commit } = useData();
 const hoje = (): DayIso => localDayOf(Date.now());

 // `save` valida antes de enfileirar e pode lançar de forma síncrona: qualquer falha vira `false`.
 const write = async (build: (previous: unknown, today: DayIso) => DietTargetsSetting | undefined): Promise<boolean> => {
  try {
   return await commit(s => { s.settings = settingsWithDietTargets(s.settings, build(s.settings.dietTargets, hoje())); return s; });
  } catch { return false; }
 };
 const undoTo = (previous: DietTargetsSetting | undefined) => () => void write(() => previous);

 /** Grava as metas validadas como nova versão a partir de hoje. */
 const save = async (value: DietTargets): Promise<boolean> => {
  const previous = state?.settings.dietTargets;
  const ok = await write((prev, today) => withDietTargetsVersion(prev, today, value));
  if (ok) showToast('Metas salvas', undoTo(previous));
  return ok;
 };
 /** "Usar esta meta": confirma o exemplo sem mudar números. */
 const confirmExample = async (): Promise<boolean> => {
  const previous = state?.settings.dietTargets;
  const ok = await write((prev, today) => confirmExampleVersion(prev, today));
  if (ok) showToast('Meta confirmada', undoTo(previous));
  return ok;
 };
 /** "Restaurar padrão": nova versão `null`; o histórico fica. */
 const restore = async (): Promise<boolean> => {
  const previous = state?.settings.dietTargets;
  const ok = await write((prev, today) => restoreDefaultVersion(prev, today));
  if (ok) showToast('Metas restauradas', undoTo(previous));
  return ok;
 };
 return { save, confirmExample, restore };
}
