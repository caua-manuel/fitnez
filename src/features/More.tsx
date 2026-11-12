import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ImportPreview } from '../application/repository';
import { useData } from '../app/DataProvider';
import { BackupReminder, Card, formatInstant } from '../ui/components';

const persistenceLabels = { granted:'Concedido', denied:'Não concedido pelo navegador', unavailable:'Não disponível neste navegador', error:'Não foi possível consultar', 'not-requested':'Ainda não concedido' };
export function More() {
 const { repository, state, initialization, protection, busy, run, requestPersistence } = useData();
 const [preview,setPreview] = useState<ImportPreview|null>(null);
 const [source,setSource] = useState('');
 const [filename,setFilename] = useState('Nenhum arquivo selecionado');
 const previewHeading=useRef<HTMLHeadingElement>(null);
 const fileInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{ if(preview)previewHeading.current?.focus(); },[preview]);
 if(!state)return null;
 const conflict=initialization?.status==='migration-conflict';
 const locked=busy||conflict;
 async function exportBackup(copy: boolean) {
  await run(async()=>{
   if(copy && !navigator.clipboard?.writeText) throw new Error('A cópia não está disponível neste endereço. Use Baixar backup.');
   const backup=await repository.export();
   if(copy) {
    try { await navigator.clipboard.writeText(backup.text); } catch { throw new Error('Não foi possível copiar. Use Baixar backup para guardar o arquivo.'); }
   } else {
    const url=URL.createObjectURL(new Blob([backup.text],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=backup.filename;document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),30000);
   }
  },copy?'Backup copiado. Guarde a cópia fora deste aparelho e confirme abaixo.':'Arquivo de backup gerado. Confira se você o guardou e confirme abaixo.');
 }
 async function selectFile(event: ChangeEvent<HTMLInputElement>) {
  const file=event.target.files?.[0];setPreview(null);setFilename(file?.name??'Nenhum arquivo selecionado');if(!file)return;
  const prepared=await run(async()=>{
   if(file.size>10*1024*1024)throw new Error('O arquivo excede 10 MiB. Escolha um backup menor.');
   return repository.prepareImport(await file.text());
  });
  if(prepared)setPreview(prepared);
 }
 return <>
  <BackupReminder />
  {conflict ? <Card title="Escolher origem dos dados"><p>Encontramos duas fontes diferentes do protótipo. Escolha qual histórico será usado. As duas fontes originais serão preservadas para recuperação.</p><fieldset disabled={busy}><legend>Histórico a usar</legend>{initialization.sources.map(s=><label className="source-choice" key={s.id}><input type="radio" name="migration-source" value={s.id} checked={source===s.id} onChange={()=>setSource(s.id)}/><span><strong>{s.label}</strong><small>Versão {s.version} · {s.days} dias · {s.measurements} datas com medidas</small></span></label>)}</fieldset><button disabled={busy||!source} onClick={()=>void run(()=>repository.selectMigration({sourceId:source,expectedRevision:state.revision}),'Origem escolhida. Seus dados foram migrados e os originais preservados.')}>Confirmar origem escolhida</button><p className="muted">Tema, importação e confirmação de backup ficam bloqueados até essa escolha.</p></Card> : null}
  <div className="grid">
   <Card title="Aparência"><fieldset disabled={locked}><legend>Tema</legend><div className="theme-picker">{([['auto','Automático'],['light','Claro'],['dark','Escuro']] as const).map(([value,label])=><button type="button" className="secondary" key={value} aria-pressed={state.settings.theme===value} onClick={()=>void run(()=>{const next=structuredClone(state);next.settings.theme=value;return repository.save({state:next,expectedRevision:state.revision});},'Tema salvo neste aparelho.')}>{label}</button>)}</div></fieldset><p className="muted">Automático acompanha a aparência do seu aparelho.</p></Card>
   <Card title="Armazenamento"><dl className="facts"><div><dt>Armazenamento persistente</dt><dd>{protection ? persistenceLabels[protection.persistence] : 'Consultando…'}</dd></div>{protection?.usage!==undefined ? <div><dt>Espaço estimado em uso</dt><dd>{new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(protection.usage/1048576)} MB{protection.quota!==undefined ? ` de ${new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(protection.quota/1048576)} MB` : ''}</dd></div>:null}</dl><button className="secondary" disabled={busy} onClick={()=>void requestPersistence()}>Pedir armazenamento persistente</button>{protection?.message ? <p className="warning">{protection.message}</p>:null}<p className="muted">A limpeza do navegador ou a perda do aparelho pode apagar seus dados. A persistência não substitui um backup externo.</p></Card>
  </div>
  <Card title="Backup dos seus dados"><p>Baixe ou copie o backup completo, incluindo o histórico e os originais preservados. Ele contém dados pessoais de saúde: guarde em um local de sua confiança.</p><div className="actions"><button disabled={busy} onClick={()=>void exportBackup(false)}>Baixar backup</button><button disabled={busy} className="secondary" onClick={()=>void exportBackup(true)}>Copiar backup</button></div><dl className="facts backup-dates"><div><dt>Última geração</dt><dd>{formatInstant(protection?.lastBackupGeneratedAt)}</dd></div><div><dt>Cópia confirmada</dt><dd>{formatInstant(protection?.lastBackupConfirmedAt)}</dd></div></dl><p className="muted">Gerar ou copiar o arquivo não confirma que ele foi guardado. Confirme somente depois de conferir sua cópia.</p><button className="secondary" disabled={locked||!protection?.lastBackupGeneratedAt} onClick={()=>void run(()=>repository.confirmBackup({expectedRevision:state.revision}),'Cópia confirmada. O lembrete reaparecerá em sete dias.')}>Já guardei a cópia</button></Card>
  <Card title="Importar backup"><p>Escolha um backup JSON do protótipo ou desta versão. Você verá um resumo antes de substituir qualquer dado.</p><p id="file-help">Arquivo de backup JSON (até 10 MiB)</p><div className="file-picker"><label className="button secondary" htmlFor="backup-file">Escolher arquivo JSON</label><input className="visually-hidden" ref={fileInput} id="backup-file" type="file" aria-describedby="file-help file-name" accept=".json,application/json" disabled={locked} onChange={e=>void selectFile(e)}/><span id="file-name" className="muted">{filename}</span></div>
   {preview ? <section className="import-preview" aria-labelledby="preview-title"><h3 ref={previewHeading} id="preview-title" tabIndex={-1}>Prévia da importação</h3><p>Backup versão {preview.sourceVersion}</p><dl className="facts"><div><dt>Dias com dados</dt><dd>{preview.summary.days}</dd></div><div><dt>Datas com medidas</dt><dd>{preview.summary.measurements}</dd></div><div><dt>Exercícios</dt><dd>{preview.summary.exercises}</dd></div><div><dt>Treinos</dt><dd>{preview.summary.sessions}</dd></div></dl>{preview.warnings.map((w,i)=><p className="muted" key={i}>{w}</p>)}<p className="warning"><strong>Os dados atuais serão substituídos.</strong> Uma cópia de recuperação será preservada neste aparelho na mesma operação.</p><div className="actions"><button className="danger" disabled={locked} onClick={async()=>{const result=await run(()=>repository.confirmImport({token:preview.token,expectedRevision:preview.expectedRevision}),'Backup importado. Os dados anteriores estão preservados para recuperação.');if(result){setPreview(null);setFilename('Nenhum arquivo selecionado');if(fileInput.current)fileInput.current.value='';}}}>Confirmar importação</button><button className="secondary" disabled={busy} onClick={()=>{setPreview(null);setFilename('Nenhum arquivo selecionado');if(fileInput.current){fileInput.current.value='';fileInput.current.focus();}}}>Cancelar</button></div></section>:null}
  </Card>
  <Card title="Usar neste aparelho"><p>Para acesso rápido, use “Adicionar à Tela de Início” no menu do navegador. O acesso offline estará pronto quando o aviso no topo indicar “Disponível offline”.</p><p className="muted">Cada navegador e aparelho guarda seus próprios dados. Para mudar de endereço ou aparelho, exporte e importe o backup. Não há login nem sincronização.</p></Card>
 </>;
}
