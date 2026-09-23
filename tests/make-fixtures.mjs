// Original procedural demo assets, exported as standard GLB to exercise the real importer.
import {mkdir,writeFile} from 'node:fs/promises';
import {makeVessel,makeRoom} from '../dist/js/models.js';
import {Matrix3,Vector3} from 'three';
async function writeGlb(group,name){
 group.updateMatrixWorld(true);const chunks=[],json={asset:{version:'2.0',generator:'Water Lab prototype / procedural demo'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}]};let offset=0;
 function attr(array,type,count,min,max){const buf=Buffer.from(array.buffer,array.byteOffset,array.byteLength);json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buf.length,target:34962});chunks.push(buf);offset+=buf.length;const value={bufferView:json.bufferViews.length-1,componentType:5126,count,type};if(min)value.min=min;if(max)value.max=max;json.accessors.push(value);return json.accessors.length-1;}
 group.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);g.computeBoundingBox();if(!g.attributes.normal)g.computeVertexNormals();const bounds=g.boundingBox;
 const pos=attr(g.attributes.position.array,'VEC3',g.attributes.position.count,bounds.min.toArray(),bounds.max.toArray()),normal=attr(g.attributes.normal.array,'VEC3',g.attributes.normal.count);
 const mat=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;json.materials.push({name:mat.name||'Demo material',pbrMetallicRoughness:{baseColorFactor:[mat.color.r,mat.color.g,mat.color.b,1],metallicFactor:mat.metalness??0,roughnessFactor:mat.roughness??.7},doubleSided:false});
 json.meshes.push({primitives:[{attributes:{POSITION:pos,NORMAL:normal},material:json.materials.length-1}]});json.nodes.push({mesh:json.meshes.length-1});json.scenes[0].nodes.push(json.nodes.length-1);g.dispose();});
 json.buffers[0].byteLength=offset;let jsonBytes=Buffer.from(JSON.stringify(json));const pad=(4-jsonBytes.length%4)%4;jsonBytes=Buffer.concat([jsonBytes,Buffer.alloc(pad,32)]);const binary=Buffer.concat(chunks);const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+jsonBytes.length+binary.length,8);header.writeUInt32LE(jsonBytes.length,12);header.writeUInt32LE(0x4e4f534a,16);const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length,0);binHeader.writeUInt32LE(0x004e4942,4);
 await mkdir(new URL('../dist/models/',import.meta.url),{recursive:true});await writeFile(new URL('../dist/models/'+name,import.meta.url),Buffer.concat([header,jsonBytes,binHeader,binary]));console.log(name,binary.length,'bytes geometry');
}
await writeGlb(makeVessel(),'demo-vessel.glb');await writeGlb(makeRoom().group,'demo-room.glb');
