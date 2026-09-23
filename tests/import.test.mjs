import './register.mjs';
import './make-format-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Quaternion} from 'three';
import {LocalFiles,loadModel,entriesFromDrop} from '../dist/js/model-import.js';
import {Collider,collisionGeometry} from '../dist/js/collisions.js';
import {disposeModel} from '../dist/js/models.js';
import {translate} from '../dist/js/i18n.js';
globalThis.ProgressEvent??=class extends Event{constructor(type,props){super(type);Object.assign(this,props);}};
globalThis.self??=globalThis;
async function entry(path,as=path){return {path:as,file:new File([await readFile(new URL('fixtures/'+path,import.meta.url))],as.split('/').at(-1))};}
for(const name of ['vessel.gltf','vessel.obj','vessel.stl','ascii.stl','vessel.ply','binary.ply'])test(name+' imports a hollow vessel and blocks water crossing its floor',async()=>{
 const entries=[await entry(name)];if(name.endsWith('gltf'))entries.push(await entry('geometry.bin'));if(name.endsWith('obj'))entries.push(await entry('materials/plain.mtl','materials/vessel.mtl'));
 const bundle=new LocalFiles(entries);let root,c;
 try{({root}=await loadModel(bundle.entries[0],bundle));const {geometry,triangles}=collisionGeometry(root);assert.ok(triangles>1000);c=new Collider();c.setGeometry(geometry);c.setRotation(new Quaternion());const pos=new Float32Array([0,-.9,0]);c.resolve(pos,0,new Float32Array([0,-.4,0]),.064);assert.ok(pos[1]>-.69,'floor must catch falling water');const cavity=new Float32Array([0,0,0]);c.resolve(cavity,0,cavity.slice(),.064);assert.deepEqual([...cavity],[0,0,0]);if(name.endsWith('ply'))assert.equal(root.material.vertexColors,true);}finally{c?.dispose();if(root)disposeModel(root);bundle.dispose();}
});
test('GLB remains supported',async()=>{const file=new File([await readFile(new URL('../dist/models/demo-vessel.glb',import.meta.url))],'v.glb'),bundle=new LocalFiles([{file,path:file.name}]);const {root}=await loadModel(bundle.entries[0],bundle);assert.ok(collisionGeometry(root).triangles>1000);disposeModel(root);bundle.dispose();});
test('relative paths, spaces, case and unique flattened companions resolve; ambiguous and remote references fail',()=>{
 const file=new File(['x'],'map.png'),bundle=new LocalFiles([{file,path:'root/textures/a b.png'},{file,path:'root/other/map.png'},{file,path:'root/textures/map.png'}]);
 assert.equal(bundle.find('../textures/a%20b.png','root/materials/').path,'root/textures/a b.png');assert.equal(bundle.find('A B.PNG').path,'root/textures/a b.png');assert.throws(()=>bundle.find('map.png'),/重名/);assert.throws(()=>bundle.find('https://example.com/map.png'),/外部/);assert.throws(()=>bundle.find('missing.bin'),/missing.bin/);assert.throws(()=>new LocalFiles(Array(501).fill({file,path:'x'})),/500/);bundle.dispose();
});
test('missing glTF buffer and point-cloud PLY fail explicitly',async()=>{for(const name of ['vessel.gltf','pointcloud.ply']){const bundle=new LocalFiles([await entry(name)]);await assert.rejects(loadModel(bundle.entries[0],bundle),name.endsWith('gltf')?/缺少配套文件：geometry.bin/:/点云/);bundle.dispose();}});
test('missing OBJ material uses a visible default with a warning',async()=>{const bundle=new LocalFiles([await entry('vessel.obj')]);const {root,notes}=await loadModel(bundle.entries[0],bundle);assert.match(notes[0],/MTL/);disposeModel(root);bundle.dispose();});
test('directory drops read all batches and preserve paths',async()=>{let batch=0;const child=name=>({name,isFile:true,file:resolve=>resolve(new File(['x'],name))});const folder={name:'folder',isDirectory:true,createReader:()=>({readEntries:resolve=>resolve(batch++===0?[child('a.obj')]:batch===2?[child('b.mtl')]:[])})};const result=await entriesFromDrop({items:[{webkitGetAsEntry:()=>folder}]});assert.deepEqual(result.map(e=>e.path),['folder/a.obj','folder/b.mtl']);});
test('dynamic missing-resource error translates without changing filenames',()=>{assert.equal(translate('缺少配套文件：材质.png','en'),'Missing companion file: 材质.png');assert.equal(translate('Missing companion file: file.bin','zh'),'缺少配套文件：file.bin');});
