import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {PLYLoader} from 'three/addons/loaders/PLYLoader.js';
import {disposeModel} from './models.js';

export const MODEL_EXTENSIONS=new Set(['glb','gltf','obj','stl','ply']);
const LOCAL='local-model:///';
export const extension=path=>path.split('.').pop().toLowerCase();
const directory=path=>path.includes('/')?path.slice(0,path.lastIndexOf('/')+1):'';
const basename=path=>path.slice(path.lastIndexOf('/')+1);
function canonical(path){
 const parts=[];
 for(const part of path.replace(/\\/g,'/').split('/')){
  if(!part||part==='.')continue;
  if(part==='..'){if(!parts.length)throw new Error('资源路径超出所选文件夹。');parts.pop();}else parts.push(part);
 }
 return parts.join('/');
}
export function entriesFromFiles(files){return Array.from(files,file=>({file,path:canonical(file.webkitRelativePath||file.name)}));}

// Every relative asset is resolved to an explicitly selected local file.
// No model/texture is uploaded; unresolved URLs never fall through to HTTP.
export class LocalFiles {
 constructor(entries){
  if(entries.length>500)throw new Error('所选文件超过 500 个，请只选择模型与配套资源。');
  if(entries.reduce((n,e)=>n+e.file.size,0)>200*1024*1024)throw new Error('配套文件总计超过 200 MB，请减少贴图大小或只选择所需文件。');
  this.entries=entries.map(e=>({...e,path:canonical(e.path)}));this.urls=new Map();this.pending=0;this.waiters=[];this.errors=[];
  this.manager=new THREE.LoadingManager();this.manager.setURLModifier(url=>this.url(url));
  const start=this.manager.itemStart.bind(this.manager),end=this.manager.itemEnd.bind(this.manager);
  this.manager.itemStart=url=>{this.pending++;start(url);};
  this.manager.itemEnd=url=>{end(url);this.pending--;if(!this.pending){this.waiters.splice(0).forEach(resolve=>resolve());}};
  this.manager.onError=url=>{const entry=[...this.urls].find(([,value])=>value===url)?.[0];this.errors.push(entry?.path||url);};
 }
 find(uri,base=''){
  if(/^[a-z][a-z\d+.-]*:/i.test(uri)&&!uri.startsWith(LOCAL))throw new Error('模型引用了外部资源，请把配套文件一起导入。');
  if(uri.startsWith('//'))throw new Error('模型引用了外部资源，请把配套文件一起导入。');
  const local=uri.startsWith(LOCAL)?uri.slice(LOCAL.length):base+uri;
  let decoded=local;try{decoded=decodeURIComponent(local);}catch{}
  const names=[canonical(local),canonical(decoded)];
  for(const name of names){const exact=this.entries.filter(e=>e.path===name);if(exact.length===1)return exact[0];if(exact.length>1)throw new Error('配套文件重名，请使用导入文件夹保留目录结构。');}
  const folded=this.entries.filter(e=>names.some(name=>e.path.toLowerCase()===name.toLowerCase()));
  if(folded.length===1)return folded[0];
  if(folded.length>1)throw new Error('配套文件重名，请使用导入文件夹保留目录结构。');
  // Multi-file picking loses directory information. A unique basename is safe;
  // ambiguous basenames are rejected instead of silently using the wrong map.
  const flat=this.entries.filter(e=>names.some(name=>basename(e.path).toLowerCase()===basename(name).toLowerCase()));
  if(flat.length===1)return flat[0];
  if(flat.length>1)throw new Error('配套文件重名，请使用导入文件夹保留目录结构。');
  throw new Error(`缺少配套文件：${basename(names.at(-1))}`);
 }
 url(uri){
  if(/^(data:|blob:)/i.test(uri))return uri;
  const entry=this.find(uri);if(!this.urls.has(entry))this.urls.set(entry,URL.createObjectURL(entry.file));return this.urls.get(entry);
 }
 async ready(){if(this.pending)await new Promise(resolve=>this.waiters.push(resolve));if(this.errors.length)throw new Error('贴图或配套文件无法读取，请检查文件是否损坏。');}
 dispose(){for(const url of this.urls.values())URL.revokeObjectURL(url);this.urls.clear();}
}

function materialFor(geometry){return new THREE.MeshStandardMaterial({color:geometry.hasAttribute('color')?0xffffff:0xb6b6b6,vertexColors:geometry.hasAttribute('color'),roughness:.55,metalness:0});}

export async function loadModel(entry,bundle){
 const kind=extension(entry.path),notes=[];let root=null,draco=null;
 try{
  if(entry.file.size>80*1024*1024)throw new Error('文件超过 80 MB。请压缩贴图或减面后再导入。');
  if(!MODEL_EXTENSIONS.has(kind))throw new Error('请选择 GLB、GLTF、OBJ、STL 或 PLY 网格模型。');
  if(kind==='glb'||kind==='gltf'){
   const loader=new GLTFLoader(bundle.manager);draco=new DRACOLoader();
   draco.setDecoderPath(new URL('../vendor/three/addons/libs/draco/gltf/',import.meta.url).href);
   loader.setDRACOLoader(draco);loader.setMeshoptDecoder(MeshoptDecoder);
   const bytes=await entry.file.arrayBuffer();
   if(kind==='glb'&&(bytes.byteLength<20||new DataView(bytes).getUint32(0,true)!==0x46546c67))throw new Error('这不是有效的 GLB 文件。');
   let input=bytes;
   if(kind==='gltf'){
    try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('这不是有效的 GLTF 文件。');}
    if(!input.asset?.version?.startsWith('2.'))throw new Error('目前支持 glTF 2.0，请重新导出模型。');
    for(const asset of [...(input.buffers||[]),...(input.images||[])])if(asset.uri&&!/^(data:|blob:)/i.test(asset.uri))bundle.find(asset.uri,directory(entry.path));
   }
   const result=await loader.parseAsync(input,LOCAL+directory(entry.path));root=result.scene;
  }else if(kind==='obj'){
   const text=await entry.file.text(),creators=[];
   const resolveMtl=name=>({resource:bundle.find(name,directory(entry.path)),base:directory(canonical(directory(entry.path)+name))});
   const libraries=[...text.matchAll(/^\s*mtllib\s+(.+)$/gm)].map(m=>m[1].trim());
   for(const name of libraries){
    let resources=[];
    try{resources=[resolveMtl(name)];}
    catch(error){
     if(!error.message.startsWith('缺少配套文件'))throw error;
     const names=name.match(/"[^"]+"|'[^']+'|\S+/g)||[];
     for(const part of names){try{resources.push(resolveMtl(part.replace(/^["']|["']$/g,'')));}catch(e){if(!e.message.startsWith('缺少配套文件'))throw e;}}
     if(!resources.length)notes.push('未找到 MTL，已使用默认材质。');
    }
    for(const {resource,base} of resources){const materials=new MTLLoader(bundle.manager).parse(await resource.file.text(),LOCAL+base);creators.push(materials);}
   }
   const loader=new OBJLoader(bundle.manager),fallback=new THREE.MeshStandardMaterial({color:0xb6b6b6,roughness:.55});let usedFallback=false;
   if(creators.length)loader.setMaterials({create(name){const creator=creators.findLast(c=>Object.hasOwn(c.materialsInfo,name));if(creator)return creator.create(name);usedFallback=true;return fallback;}});
   try{root=loader.parse(text);}finally{if(!usedFallback)fallback.dispose();}
   // OBJLoader also supports lines/points; this lab accepts actual triangle meshes.
   if(!creators.length)root.traverse(o=>{if(o.isMesh){const old=o.material;o.material=materialFor(o.geometry);for(const m of Array.isArray(old)?old:[old])m?.dispose();}});
  }else{
   const bytes=await entry.file.arrayBuffer();let geometry;
   if(kind==='ply'){
    const header=new TextDecoder().decode(bytes.slice(0,Math.min(bytes.byteLength,65536))).split('end_header')[0];
    if(!/^ply\s/.test(header))throw new Error('这不是有效的 PLY 文件。');
    const faces=Number(header.match(/^element\s+face\s+(\d+)/m)?.[1]||0);
    if(!faces)throw new Error('这个 PLY 是点云，没有三角面；请先重建网格再导入。');
    if(faces>350000)throw new Error('模型超过 35 万三角面。请先减面并重新导出 GLB，以保证水实验流畅。');
    geometry=new PLYLoader(bundle.manager).parse(bytes);
   }else{
    // Prevent huge bogus face counts from forcing allocations in malformed STL.
    if(bytes.byteLength>=84){const faces=new DataView(bytes).getUint32(80,true);if(84+faces*50===bytes.byteLength&&faces>350000)throw new Error('模型超过 35 万三角面。请先减面并重新导出 GLB，以保证水实验流畅。');}
    geometry=new STLLoader(bundle.manager).parse(bytes);
   }
   if(!geometry.hasAttribute('normal'))geometry.computeVertexNormals();root=new THREE.Mesh(geometry,materialFor(geometry));
  }
  let meshes=0;root.traverse(o=>{if(o.isMesh&&o.geometry.attributes.position?.count)meshes++;});
  if(!meshes)throw new Error('文件里没有可用于碰撞的网格，暂不支持点云和 3DGS。');
  await bundle.ready();return {root,notes:[...new Set(notes)]};
 }catch(error){if(root)disposeModel(root);throw error;}finally{draco?.dispose();}
}

// Folder drag-and-drop preserves relative texture paths, including all batches
// returned by Chromium's directory reader (one readEntries is not sufficient).
export async function entriesFromDrop(transfer){
 const roots=Array.from(transfer.items||[],item=>item.webkitGetAsEntry?.()).filter(Boolean);
 if(!roots.length)return entriesFromFiles(transfer.files);
 const entries=[];
 async function walk(entry,prefix=''){
  const path=prefix+entry.name;
  if(entry.isFile){if(entries.length>=500)throw new Error('所选文件超过 500 个，请只选择模型与配套资源。');const file=await new Promise((resolve,reject)=>entry.file(resolve,reject));entries.push({file,path});}
  else if(entry.isDirectory){const reader=entry.createReader();while(true){const batch=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));if(!batch.length)break;for(const child of batch)await walk(child,path+'/');}}
 }
 for(const root of roots)await walk(root);return entries;
}
