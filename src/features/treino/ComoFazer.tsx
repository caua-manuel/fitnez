import { useEffect, useState } from 'react';
import { exerciseFrames, exerciseImageId } from '../../domain/exerciseImages';
import { guideFor } from '../../domain/exerciseNotes';
import { Sheet } from '../../ui/Sheet';
import { Thumb } from '../../ui/Thumb';
import { Icon } from '../../ui/icons';
import { Glyph } from './glyphs';
import './como-fazer.css';

const motionPreference = '(prefers-reduced-motion: reduce)';

function frameAlt(id: string, name: string, steps: string[], index: number) {
 if (id === 'ytw' && steps[1]?.includes('formando Y, depois T, depois W')) {
  return steps[1].replace('formando Y, depois T, depois W', `formando ${'YTW'[index]}`);
 }
 return steps[Math.min(index, steps.length - 1)] ?? name;
}

function Illustration({ exId, name, group, steps }: { exId: string; name: string; group?: string; steps: string[] }) {
 const [frame, setFrame] = useState(0);
 const [paused, setPaused] = useState(false);
 const [failed, setFailed] = useState(false);
 const [reduce, setReduce] = useState(() => matchMedia(motionPreference).matches);
 const files = exerciseFrames(exId);
 const count = files.length;
 useEffect(() => {
  const query = matchMedia(motionPreference);
  const update = () => setReduce(query.matches);
  update();
  query.addEventListener('change', update);
  return () => query.removeEventListener('change', update);
 }, []);
 useEffect(() => {
  if (count < 2 || reduce || paused || failed) return;
  const timer = window.setInterval(() => {
   if (!document.hidden) setFrame(current => (current + 1) % count);
  }, 1000);
  return () => window.clearInterval(timer);
 }, [count, reduce, paused, failed]);

 if (!count || failed) return <div className="cf-fallback"><Thumb kind="exercise" group={group} size={112} label={name} /></div>;
 const showTogether = reduce && count > 1;
 return <div className={`cf-art${showTogether ? ' cf-frames' : ''}`}>
  {files.map((file, index) => <img key={file}
   src={`${import.meta.env.BASE_URL}img/exercise/${file}`}
   alt={frameAlt(exerciseImageId(exId), name, steps, index)}
   width={1024} height={1024} decoding="async"
   aria-hidden={!showTogether && index !== frame}
   onError={() => setFailed(true)}
  />)}
  {!showTogether && count > 1 ? <button type="button" className="cf-toggle"
   aria-label={paused ? 'Retomar animação' : 'Pausar animação'} onClick={() => setPaused(value => !value)}>
   <span className="cf-toggle-icon">{paused ? <Icon name="play" size={20} /> : <Glyph name="pausa" size={20} />}</span>
  </button> : null}
 </div>;
}

export default function ComoFazer({ exId, name, group, className = '', onClose }: {
 exId: string; name: string; group?: string; className?: string; onClose: () => void;
}) {
 const guide = guideFor(exId);
 const steps = guide?.passos ?? [];
 const imageGuide = guideFor(exerciseImageId(exId));
 return <Sheet title="Como fazer" className={className} onClose={onClose} initialFocus="[data-close-guide]">
  <div className="sheet-body cf-body">
   <h3>{name}</h3>
   <Illustration key={exId} exId={exId} name={name} group={group} steps={imageGuide?.passos ?? steps} />
   {guide ? <>
    <ol className="cf-steps">{steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p><strong>Erro comum:</strong> {guide.erro}</p>
   </> : null}
  </div>
  <div className="sheet-actions"><button type="button" className="button secondary" data-close-guide onClick={onClose}>Fechar</button></div>
 </Sheet>;
}
