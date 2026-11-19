import type { Plugin, ResolvedConfig } from 'vite';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

/** Atalhos do ícone (toque longo): rotas existentes do app, relativas à base do Pages. */
export const SHORTCUTS: ReadonlyArray<readonly [string, string, string]> = [
 ['Treino de hoje', '#treino/_/hoje', 'Abre o treino do dia com a carga sugerida'],
 ['Registrar peso', '#evolucao', 'Abre a Evolução para registrar peso e medidas'],
 ['Dieta', '#dieta', 'Abre a dieta do dia'],
];

/** Devops integra em vite.config.ts: plugins: [pwaBuild()]. Sem pacote PWA extra. */
export function pwaBuild(): Plugin {
 let config: ResolvedConfig;
 return {
  name:'treino12-pwa-nativa', apply:'build',
  configResolved(value){config=value;},
  transformIndexHtml(html){return {html,tags:[
   {tag:'link',attrs:{rel:'manifest',href:`${config.base}manifest.webmanifest`},injectTo:'head'},
   {tag:'link',attrs:{rel:'icon',href:`${config.base}icon-192.png`},injectTo:'head'},
   {tag:'link',attrs:{rel:'apple-touch-icon',href:`${config.base}apple-touch-icon.png`},injectTo:'head'},
  ]};},
  async closeBundle(){
   const dist=resolve(config.root,config.build.outDir);const base=config.base;
   await writeFile(join(dist,'manifest.webmanifest'),JSON.stringify({id:base,name:'Fitnez',short_name:'Fitnez',description:'Treino e dieta em um só lugar, com seus dados guardados neste aparelho e uso offline.',lang:'pt-BR',start_url:base,scope:base,display:'standalone',orientation:'portrait',background_color:'#FFFFFF',theme_color:'#0A58F0',shortcuts:SHORTCUTS.map(([name,hash,description])=>({name,short_name:name,description,url:`${base}${hash}`,icons:[{src:`${base}icon-192.png`,sizes:'192x192',type:'image/png'}]})),icons:[{src:`${base}icon-192.png`,sizes:'192x192',type:'image/png'},{src:`${base}icon-512.png`,sizes:'512x512',type:'image/png'},{src:`${base}icon-maskable-512.png`,sizes:'512x512',type:'image/png',purpose:'maskable'}]},null,2),'utf8');
   async function files(directory:string,prefix=''):Promise<string[]> {const entries=await readdir(directory,{withFileTypes:true});const groups=await Promise.all(entries.map(entry=>entry.isDirectory()?files(join(directory,entry.name),`${prefix}${entry.name}/`):Promise.resolve([`${prefix}${entry.name}`])));return groups.flat();}
   const assets=(await files(dist)).filter(path=>path!=='sw.js').sort();
   const hash=createHash('sha256');for(const path of assets){hash.update(path);hash.update(await readFile(join(dist,path)));}
   const template=await readFile(join(config.root,'public','sw.js'),'utf8');
   hash.update(template);
   const version=hash.digest('hex').slice(0,16);const prefix=`treino12:${encodeURIComponent(base)}:`;
   const worker=template.replace("'__APP_BASE__'",JSON.stringify(base)).replace("'__CACHE_PREFIX__'",JSON.stringify(prefix)).replace("'__CACHE_NAME__'",JSON.stringify(`${prefix}${version}`)).replace('__PRECACHE_LIST__',JSON.stringify([base,...assets.map(path=>`${base}${path}`)]));
   await writeFile(join(dist,'sw.js'),worker,'utf8');
  },
 };
}
