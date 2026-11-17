import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Dados inteiramente sintéticos; não representam backup real do usuário.
const synthetic = (v=2) => ({v,start:'2026-01-05',log:{'2026-11-17':{orfao:[{kg:'22,5',reps:'08',done:true}]}},meas:{'2026-11-18':{p:'70,5'}},custom:{qa:'SINTÉTICO'}});
const routes = [['inicio','Início'],['treino','Treino'],['dieta','Dieta'],['evolucao','Evolução'],['perfil','Perfil']];
async function expand(page: Page, names=[/^Backup e restauração/,/^Dados neste aparelho/]) { for(const name of names){const head=page.getByRole('button',{name});if(await head.getAttribute('aria-expanded')!=='true')await head.click();} }
async function open(page: Page, hash='perfil') { await page.goto(`#${hash}`); await page.waitForLoadState('networkidle'); await expect(page.getByText('Salvo neste aparelho',{exact:true})).toBeVisible(); await expand(page); }
async function state(page: Page): Promise<any> { return page.evaluate(async()=>{const dbs=await indexedDB.databases();const name=dbs.find(d=>d.name?.startsWith('treino12:'))!.name!;return new Promise((resolve,reject)=>{const req=indexedDB.open(name);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result;const tx=db.transaction(['state','recovery']);const get=tx.objectStore('state').get('active');const keys=tx.objectStore('recovery').getAllKeys();const values=tx.objectStore('recovery').getAll();tx.onerror=()=>reject(tx.error);tx.oncomplete=()=>{const result=get.result;result.recovery={...result.recovery};keys.result.forEach((key,i)=>{result.recovery[String(key)]=values.result[i];});db.close();resolve(result);};};});}); }
async function upload(page: Page, value: unknown) { await page.locator('#backup-file').setInputFiles({name:'fixture-SINTETICO.json',mimeType:'application/json',buffer:Buffer.from(typeof value==='string'?value:JSON.stringify(value))}); }
async function download(page: Page) { const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar backup',exact:true}).click();const file=await pending; expect(file.suggestedFilename()).toMatch(/^treino12-backup-.*\.json$/);return JSON.parse(await readFile((await file.path())!,'utf8')); }

// Diagnóstico de falha do tema: registra, dentro da página, cliques, trocas de data-theme e recargas (o log vive em sessionStorage
// e sobrevive a um reload), para que um erro isolado no CI explique a si mesmo (anexo 'tema-diagnostico.json') em vez de só dizer "light".
async function probe(page: Page) { await page.addInitScript(() => { const K='qa-probe'; const log=():string[]=>JSON.parse(sessionStorage.getItem(K)??'[]'); const add=(m:string)=>{const l=log();l.push(Math.round(performance.now())+' '+m);sessionStorage.setItem(K,JSON.stringify(l));}; add('boot hasFocus='+document.hasFocus()); document.addEventListener('click',e=>{const b=(e.target as Element).closest('button');add('click '+(b?.getAttribute('aria-label')??b?.textContent?.slice(0,24)??(e.target as Element).tagName));},true); window.addEventListener('pagehide',()=>add('pagehide')); window.addEventListener('focus',()=>add('focus')); new MutationObserver(()=>add('theme='+document.documentElement.dataset.theme)).observe(document,{attributes:true,subtree:true,attributeFilter:['data-theme']}); }); }
async function expectTheme(page: Page, expected: 'light'|'dark', info: { attach: (name: string, o: { body: string; contentType: string }) => Promise<void> }) {
 try { await expect(page.locator('html')).toHaveAttribute('data-theme',expected); } catch(error) {
  const found=await page.evaluate(async()=>{const dbs=await indexedDB.databases();const name=dbs.find(d=>d.name?.startsWith('treino12:'))?.name;let stored:unknown='sem banco';if(name)stored=await new Promise(resolve=>{const req=indexedDB.open(name);req.onerror=()=>resolve('erro ao abrir');req.onsuccess=()=>{const db=req.result;const get=db.transaction('state').objectStore('state').get('active');get.onsuccess=()=>{db.close();resolve((get.result as any)?.settings?.theme??'sem tema');};get.onerror=()=>{db.close();resolve('erro ao ler');};};});
   return {log:JSON.parse(sessionStorage.getItem('qa-probe')??'[]'),pressed:[...document.querySelectorAll('.perfil-seg button')].map(b=>b.getAttribute('aria-label')+'='+b.getAttribute('aria-pressed')),fieldsetDisabled:document.querySelector('.perfil-theme')?.hasAttribute('disabled'),alerts:[...document.querySelectorAll('[role=alert]')].map(a=>a.textContent),storedTheme:stored,controller:!!navigator.serviceWorker?.controller,url:location.href};}).catch(e=>({falhaAoColetar:String(e)}));
  const body=JSON.stringify(found);console.log('TEMA-DIAGNOSTICO '+body);await info.attach('tema-diagnostico.json',{body,contentType:'text/plain'});
  throw error;
 }
}
test.beforeEach(async({page,context})=>{const errors:string[]=[];(page as any).__errors=errors;const monitor=(p:Page)=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};monitor(page);context.on('page',monitor);});
test.afterEach(async({page})=>{expect((page as any).__errors,'Sem exceções nem erros console, incluindo violações CSP').toEqual([]);});

for(const width of [360,1280]) for(const theme of ['Claro','Escuro']) test(`rotas, layout ${width}px e tema ${theme}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await probe(page);await open(page);await page.getByRole('button',{name:theme,exact:true}).click();await expectTheme(page,theme==='Claro'?'light':'dark',info);await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme',theme==='Claro'?'light':'dark');
 for(const [hash,label] of routes){await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name:label,exact:true}).click();await expect(page).toHaveURL(new RegExp(`#${hash}$`));await expect(page.getByRole('heading',{name:label,exact:true,level:1})).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:info.outputPath(`perfil-${width}-${theme}.png`),fullPage:true});await page.goto('#inexistente');await expect(page.getByRole('heading',{name:'Início',exact:true,level:1})).toBeAttached();
});
test('automático acompanha sistema, teclado e movimento reduzido',async({page})=>{await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await open(page);await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.reload();await expect(page.getByRole('heading',{name:'Perfil',exact:true,level:1})).toBeFocused();for(let i=0;i<6&&!(await page.getByRole('link',{name:'Pular para o conteúdo'}).evaluate(e=>e===document.activeElement));i++)await page.keyboard.press('Shift+Tab');await expect(page.getByRole('link',{name:'Pular para o conteúdo'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);});

for(const version of [1,2]) test(`importação v${version}: prévia, cancelar, confirmar e preservação`,async({page})=>{
 await open(page);const before=await state(page);await upload(page,synthetic(version));await expect(page.getByRole('heading',{name:'Prévia da importação'})).toBeFocused();expect(await state(page)).toEqual(before);await page.getByRole('button',{name:'Cancelar',exact:true}).click();expect(await state(page)).toEqual(before);await upload(page,synthetic(version));await page.getByRole('button',{name:'Confirmar importação',exact:true}).click();await expect(page.getByText('Backup importado.',{exact:false})).toBeVisible();const imported=await state(page);expect(imported.history.days['2026-11-17'].log.orfao[0].kg).toBe('22,5');expect(imported.history.measurements['2026-11-18'].p).toBe('70,5');await page.reload();expect((await state(page)).history).toEqual(imported.history);await expand(page);const backup=await download(page);expect(backup.state.history).toEqual(imported.history);expect(JSON.stringify(backup.state.recovery)).toContain('before-import');expect(JSON.stringify(backup.state.recovery)).toContain('SINTÉTICO');await expect(page.getByText('Seu backup semanal está pendente.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Já guardei o backup',exact:true}).click();await expect(page.getByText('Seu backup semanal está pendente.',{exact:false})).toHaveCount(0);
});
test('backup v3 restaura em banco vazio e mantém histórico',async({page,browser})=>{await open(page);await upload(page,synthetic());await page.getByRole('button',{name:'Confirmar importação',exact:true}).click();await expect(page.getByText('Backup importado.',{exact:false})).toBeVisible();const backup=await download(page);const context=await browser.newContext();try{const other=await context.newPage();await open(other);await upload(other,backup);await other.getByRole('button',{name:'Confirmar importação',exact:true}).click();await expect(other.getByText('Backup importado.',{exact:false})).toBeVisible();expect((await state(other)).history).toEqual(backup.state.history);expect((await state(other)).meta.lastBackupConfirmedAt).toBeNull();}finally{await context.close();}});
test('JSON inválido, versão futura e prévia obsoleta não apagam dados',async({page})=>{await open(page);const before=await state(page);for(const bad of ['{',JSON.stringify({v:99})]){await upload(page,bad);await expect(page.getByRole('alert')).toBeVisible();expect(await state(page)).toEqual(before);await expect(page.getByRole('button',{name:'Confirmar importação',exact:true})).toHaveCount(0);}await upload(page,synthetic());await page.getByRole('button',{name:'Escuro',exact:true}).click();const saved=await state(page);await page.getByRole('button',{name:'Confirmar importação',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();expect(await state(page)).toEqual(saved);});
test('conflito v1/v2 exige escolha explícita e mantém originais',async({page})=>{await page.addInitScript(({a,b})=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem('treino12-v1',a);localStorage.setItem('treino12-v2',b);sessionStorage.setItem('qa-seeded','1');}},{a:JSON.stringify(synthetic(1)),b:JSON.stringify({...synthetic(2),start:'2026-12-01'})});await open(page);await expect(page.getByRole('heading',{name:'Escolher origem dos dados'})).toBeVisible();await expect(page.getByRole('button',{name:'Escuro',exact:true})).toBeDisabled();await expect(page.locator('#backup-file')).toBeDisabled();await page.reload();await expect(page.getByRole('heading',{name:'Escolher origem dos dados'})).toBeVisible();await page.locator('input[value="treino12-v2"]').check();await page.getByRole('button',{name:'Confirmar origem escolhida'}).click();await expect(page.getByText('Origem escolhida.',{exact:false})).toBeVisible();const s=await state(page);expect(s.settings.start).toBe('2026-12-01');expect(s.recovery['legacy:treino12-v1']).toBeDefined();expect(s.recovery['legacy:treino12-v2']).toBeDefined();expect(await page.evaluate(()=>localStorage.getItem('treino12-v1'))).toBe(JSON.stringify(synthetic(1)));});

for(const mode of ['denied','error','granted']) test(`persistência ${mode} permanece visível após salvar tema`,async({page})=>{await page.addInitScript(mode=>{Object.defineProperty(navigator.storage,'persisted',{value:async()=>false});Object.defineProperty(navigator.storage,'persist',{value:async()=>{if(mode==='error')throw Error('falha sintética');return mode==='granted';}});},mode);await open(page);await page.getByRole('button',{name:'Pedir armazenamento persistente'}).click();const label=mode==='denied'?'Não concedido pelo navegador':mode==='error'?'Não foi possível consultar':'Concedido';await expect(page.getByText(label,{exact:true})).toBeVisible();await page.getByRole('button',{name:'Escuro',exact:true}).click();await expect(page.getByText(label,{exact:true})).toBeVisible();});
test('clipboard negado exibe erro e permite download',async({page})=>{await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('negado sintético');}}}));await open(page);await page.getByRole('button',{name:'Copiar backup',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Use Baixar backup');expect((await download(page)).app).toBe('treino12');});
test('IndexedDB indisponível exibe erro sem anunciar salvo',async({page})=>{await page.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:undefined}));await page.goto('#perfil');await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByText('Salvo neste aparelho',{exact:true})).toHaveCount(0);});
test('falha real entre writes IndexedDB aborta importação sem perder estado ou recovery',async({page})=>{await open(page);const before=await state(page);await upload(page,synthetic());await expect(page.getByRole('heading',{name:'Prévia da importação'})).toBeVisible();await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;(window as any).__qaPut=original;IDBObjectStore.prototype.put=function(...args:any[]){if(this.name==='state')throw new DOMException('Quota sintética QA','QuotaExceededError');return original.apply(this,args as [any,IDBValidKey]);};});await page.getByRole('button',{name:'Confirmar importação',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await page.evaluate(()=>{IDBObjectStore.prototype.put=(window as any).__qaPut;});expect(await state(page)).toEqual(before);await expect(page.getByText('Backup importado.',{exact:false})).toHaveCount(0);await page.reload();expect(await state(page)).toEqual(before);});
test('PWA produção: precache completo, cinco rotas e reabertura offline',async({page,context})=>{await open(page);await expect(page.getByText('Disponível offline',{exact:true})).toBeVisible();await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(resolve=>navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true}));});await page.getByRole('button',{name:'Escuro',exact:true}).click();await context.setOffline(true);for(const [,label]of routes){await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name:label,exact:true}).click();await expect(page.getByRole('heading',{name:label,exact:true,level:1})).toBeAttached();}await page.reload();await expect(page.getByText('Sem conexão · disponível offline',{exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');const reopened=await context.newPage();await reopened.goto('#treino');await expect(reopened.getByRole('heading',{name:'Treino',exact:true,level:1})).toBeAttached();await reopened.close();await context.setOffline(false);});



test('Perfil: backup inválido mostra o erro junto ao campo, com ação coerente e dados intactos', async ({ page }) => {
 await open(page);
 const before = await state(page);
 await upload(page, '{');
 const alert = page.getByRole('alert');
 await expect(alert).toHaveCount(1);
 await expect(alert).toContainText('Este arquivo não é um backup do Fitnez ou está corrompido. Seus dados atuais continuam intactos.');
 await expect(page.getByRole('button', { name: /Reler dados/ })).toHaveCount(0);
 await expect(alert).toBeInViewport();
 const a = (await alert.boundingBox())!, f = (await page.locator('#file-name').boundingBox())!;
 expect(Math.abs(a.y - f.y)).toBeLessThan(400);
 await expect(alert.getByRole('button', { name: 'Escolher outro arquivo' })).toBeVisible();
 expect(await state(page)).toEqual(before);
 // Escolher outro arquivo (válido) limpa o erro e mostra a prévia
 await upload(page, synthetic());
 await expect(page.getByRole('heading', { name: 'Prévia da importação' })).toBeVisible();
 await expect(page.getByRole('alert')).toHaveCount(0);
});

test('Perfil: salvar nome e objetivo mostra "Perfil salvo" em role=status', async ({ page }) => {
 await open(page);
 await page.getByRole('button', { name: 'Editar perfil' }).click();
 await page.getByLabel('Seu nome').fill('Teste');
 await page.getByLabel('Seu objetivo').fill('Ganhar força');
 await page.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect(page.getByRole('status').filter({ hasText: /^Perfil salvo$/ })).toBeVisible();
 expect((await state(page)).settings.profile).toMatchObject({ name: 'Teste', goal: 'Ganhar força' });
});

test('Perfil: dados físicos validam por campo, preservam entrada e mostram meta de proteína', async ({ page }) => {
 await open(page);
 await expect(page.getByText('Constância').locator('xpath=preceding-sibling::dd')).toHaveText('—');
 await page.getByRole('button', { name: /^Dados físicos/ }).click();
 await page.getByLabel('Idade (anos)').fill('5');
 await page.getByLabel('Peso (kg)').fill('80,5');
 await page.getByLabel('Altura (cm)').fill('180');
 await page.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect(page.getByText(/^Idade: informe um valor entre/)).toBeVisible();
 await expect(page.getByLabel('Peso (kg)')).toHaveValue('80,5');
 await page.getByLabel('Idade (anos)').fill('30');
 await page.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect(page.getByRole('status').filter({ hasText: /^Perfil salvo$/ })).toBeVisible();
 expect((await state(page)).settings.profile).toMatchObject({ age: 30, weightKg: 80.5, heightCm: 180 });
 await expect(page.getByText('Meta de proteína: 193 g por dia, 2,4 g por kg')).toBeVisible();
 await page.getByRole('button', { name: /^Meu objetivo/ }).click();
 await expect(page.getByLabel('Seu objetivo')).toBeFocused();
 await expect(page.getByText(/não substituem nutricionista, médico ou educador físico/)).toBeVisible();
});

test('Perfil: tema em 360 px não quebra palavra; Automático mantém nome acessível completo', async ({ page }) => {
 await page.setViewportSize({ width: 360, height: 740 });
 await open(page);
 const auto = page.getByRole('button', { name: 'Automático', exact: true });
 await expect(auto).toBeVisible();
 await expect(auto).toContainText('Auto');
 const box = await auto.evaluate(el => ({ sw: el.scrollWidth, cw: el.clientWidth, h: el.getBoundingClientRect().height }));
 expect(box.sw).toBeLessThanOrEqual(box.cw + 1);
 expect(box.h).toBeLessThan(60);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Perfil: mostra a última medida de peso e permite usá-la como peso do perfil (com Desfazer)', async ({ page }) => {
 await open(page);
 await page.goto('#evolucao'); await page.waitForLoadState('networkidle');
 await page.getByRole('button', { name: /Registrar medidas/ }).click();
 await page.getByLabel(/Peso/).first().fill('78,6');
 await page.getByRole('button', { name: /^Salvar/ }).click();
 await page.goto('#perfil');
 await expect(page.getByText(/Última medida de peso: 78,6 kg em \d\d\/\d\d/)).toBeVisible();
 // Peso do perfil editado depois da medida: os dois ficam independentes e o botão reaparece.
 await page.getByRole('button', { name: /^Dados físicos/ }).click();
 await page.getByLabel('Idade (anos)').fill('30');
 await page.getByLabel('Peso (kg)').fill('80');
 await page.getByLabel('Altura (cm)').fill('180');
 await page.getByRole('button', { name: 'Salvar', exact: true }).click();
 await page.getByRole('button', { name: 'Usar como peso do perfil' }).click();
 await expect.poll(async () => (await state(page)).settings.profile.weightKg).toBe(78.6);
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect.poll(async () => (await state(page)).settings.profile.weightKg).toBe(80);
});

test('Perfil: no primeiro uso, sem dados do usuário, não há aviso de backup pendente', async ({ page }) => {
 await open(page);
 await expect(page.getByText('Seu backup semanal está pendente.', { exact: false })).toHaveCount(0);
});
