import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const url='http://127.0.0.1:4174/';
async function status(){try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});const html=await r.text();return r.ok&&html.includes('<title>Water Lab')?'ready':'occupied';}catch{return 'offline';}}
let state=await status();
if(state==='occupied')throw new Error('Port 4174 is used by another app. Please choose another PORT before running server.mjs.');
if(state==='offline'){
 const logs=path.join(root,'.sites-runtime');mkdirSync(logs,{recursive:true});const fd=openSync(path.join(logs,'preview.log'),'a');
 const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',fd,fd]});child.unref();closeSync(fd);
 for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,200));if(await status()==='ready'){state='ready';break;}}
 if(state!=='ready')throw new Error('Preview could not start. See .sites-runtime/preview.log.');
}
console.log('Water Lab is ready: '+url);
if(process.platform==='win32')spawn('cmd.exe',['/c','start','',url],{detached:true,windowsHide:true,stdio:'ignore'}).unref();
else if(process.platform==='darwin')spawn('open',[url],{detached:true,stdio:'ignore'}).unref();
else console.log('Open the URL above in your browser.');
