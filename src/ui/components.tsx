import type { ReactNode } from 'react';
import { useData } from '../app/DataProvider';
export function Card({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
 return <section className={`card ${className}`}><h2>{title}</h2>{children}</section>;
}
export function Foundation({ children }: { children: ReactNode }) { return <p className="foundation">{children}</p>; }
export function BackupReminder() {
 const { protection } = useData();
 return protection?.backupDue ? <aside className="reminder"><strong>Guarde uma cópia dos seus dados</strong><p>Seu backup semanal está pendente. Guarde o arquivo fora deste aparelho e confirme a cópia.</p><a className="text-link" href="#perfil">Fazer backup</a></aside> : null;
}
export function Icon({ name }: { name: string }) {
 const paths: Record<string, ReactNode> = {
  hoje: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/></>,
  treinos: <><path d="M3 8v8m4-11v14m10-14v14m4-11v8M7 12h10M3 12h4m10 0h4"/></>,
  dieta: <><path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18m11 0V3c-4 2-4 8 0 9"/></>,
  progresso: <><path d="M4 3v18h17M7 16l4-5 4 2 5-7"/></>,
  mais: <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/></>,
 };
 return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.mais}</svg>;
}
export function formatInstant(value: number | null | undefined) { return value == null ? 'Ainda não registrada' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value); }
