import { useSyncExternalStore } from 'react';

/** Assistente de início (ADR 008): aberto na primeira abertura ou em Perfil > "Refazer meu plano". */
export type AssistantMode = 'primeira' | 'refazer';
let mode: AssistantMode | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Quantas perguntas o assistente faz (passos de STEPS em Assistente.tsx). Fica aqui para o Início não carregar o assistente. */
export const ASSISTANT_QUESTIONS = 9;

export function openAssistant(m: AssistantMode) { mode = m; emit(); }
export function closeAssistant() { if (mode) { mode = null; emit(); } }
export function useAssistantMode(): AssistantMode | null { return useSyncExternalStore(subscribe, () => mode, () => null); }
