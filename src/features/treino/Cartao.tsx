import { useState } from 'react';
import type { ReactNode } from 'react';
import { hrefFor } from '../../app/router';
import { Icon } from '../../ui/icons';
import type { IconName } from '../../ui/icons';
import { Glyph } from './glyphs';
import { Menu } from '../../ui/Menu';
import { ConfirmSheet } from '../../ui/Sheet';
import { usePlanEditor } from './planActions';
import { STATUS_LABEL } from './util';
import type { DayStatus } from './util';

export function StatusBadge({ status }: { status: DayStatus }) {
 return <span className={`badge ${status}`}>{status === 'pending' ? <Icon name="circulo" size={18} /> : <Icon name="marca" size={18} weight={2.4} />}{STATUS_LABEL[status]}</span>;
}

/** Cartão de treino (tela-4): ícone em quadrado suave, nome, data, exercícios, duração, selo e menu ⋮. */
export function CartaoTreino({ id, name, href, icon = 'treino', date, exercises, minutes, status, menu = true, headingLevel = 3, quiet = false }: {
 id?: string; name: string; href?: string; icon?: IconName; date?: ReactNode; exercises?: string; minutes?: string | null; status?: DayStatus | null; menu?: boolean; headingLevel?: 2 | 3;
 /** Dia sem treino de academia (aula, jogo, descanso): o ícone fica neutro, para o tom marcar só os treinos. */
 quiet?: boolean;
}) {
 const [confirm, setConfirm] = useState(false);
 const { duplicate, remove } = usePlanEditor();
 const Heading = `h${headingLevel}` as 'h3';
 const body = <>
  <span className={quiet ? 'icon-tile tr-tile is-quiet' : 'icon-tile tr-tile'}><Icon name={icon} size={28} weight={1.8} /></span>
  <div className="tr-body">
   <Heading className="tr-name">{name}</Heading>
   {date ? <span className="tr-line"><Icon name="calendario" size={17} />{date}</span> : null}
   <span className="tr-foot">
    <span className="tr-facts">
     {exercises ? <span><Glyph name="barras" size={17} />{exercises}</span> : null}
     {minutes ? <span><Icon name="relogio" size={17} />{minutes}</span> : null}
    </span>
    {status ? <StatusBadge status={status} /> : null}
   </span>
  </div>
 </>;
 return <div className="tr-card">
  {href ? <a className="tr-row" href={href}>{body}</a> : <div className="tr-row static">{body}</div>}
  {menu && id ? <>
   <Menu className="tr-more" label={`Mais opções de ${name}`} trigger={<Icon name="mais" size={22} weight={2} />} items={[
    { label: 'Abrir treino', icon: 'treino', href: hrefFor({ tab: 'treino', view: 'detalhe', id }) },
    { label: 'Editar treino', icon: 'editar', href: hrefFor({ tab: 'treino', view: 'editar', id }) },
    { label: 'Duplicar treino', icon: 'copiar', onClick: () => { void duplicate(id); } },
    { label: 'Excluir treino', danger: true, onClick: () => setConfirm(true) },
   ]} />
   {confirm ? <ConfirmSheet title={`Excluir ${name}?`} confirmLabel="Excluir treino" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); void remove(id); }}>
    <p>O treino sai do seu plano. O histórico dos treinos já feitos continua salvo, e os exercícios continuam salvos.</p>
    <p>Você poderá desfazer por 6 segundos.</p>
   </ConfirmSheet> : null}
  </> : null}
 </div>;
}
