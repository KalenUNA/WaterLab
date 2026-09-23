import './register.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {makeVessel,disposeModel} from '../dist/js/models.js';
const out=new URL('./fixtures/',import.meta.url);
await mkdir(new URL('materials/',out),{recursive:true});await mkdir(new URL('textures/',out),{recursive:true});
const root=makeVessel(),g=root.children[0].geometry.toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
g.computeBoundingBox();
const json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[.7,.4,.2,1],metallicFactor:0,roughnessFactor:.6}}],buffers:[{uri:'geometry.bin',byteLength:0}],bufferViews:[],accessors:[]};
const chunks=[];let offset=0;
for(const [i,a] of [p,n,uv].entries()){const b=Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength);chunks.push(b);json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length});offset+=b.length;json.accessors.push({bufferView:i,componentType:5126,count:a.count,type:i===2?'VEC2':'VEC3',...(i===0?{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()}: {})});}
json.buffers[0].byteLength=offset;await writeFile(new URL('geometry.bin',out),Buffer.concat(chunks));await writeFile(new URL('vessel.gltf',out),JSON.stringify(json));
json.images=[{uri:'textures/checker.png'}];json.textures=[{source:0}];json.materials[0].pbrMetallicRoughness.baseColorTexture={index:0};json.materials[0].pbrMetallicRoughness.baseColorFactor=[1,1,1,1];await writeFile(new URL('textured.gltf',out),JSON.stringify(json));
// Original 8x8 PNG texture with valid CRCs, no external asset dependencies.
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);name.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc(Buffer.concat([name,data])),8+data.length);return b;}
const header=Buffer.alloc(13);header.writeUInt32BE(8);header.writeUInt32BE(8,4);header[8]=8;header[9]=2;const pixels=[];for(let y=0;y<8;y++){pixels.push(0);for(let x=0;x<8;x++)pixels.push(...((x+y)%2?[190,115,65]:[85,80,75]));}
await writeFile(new URL('textures/checker.png',out),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from(pixels))),chunk('IEND',Buffer.alloc(0))]));
let obj='mtllib materials/vessel.mtl\no vessel\n';for(let i=0;i<p.count;i++)obj+=`v ${p.getX(i)} ${p.getY(i)} ${p.getZ(i)}\nvt ${uv.getX(i)} ${uv.getY(i)}\nvn ${n.getX(i)} ${n.getY(i)} ${n.getZ(i)}\n`;obj+='usemtl ceramic\n';for(let i=1;i<=p.count;i+=3)obj+=`f ${i}/${i}/${i} ${i+1}/${i+1}/${i+1} ${i+2}/${i+2}/${i+2}\n`;
await writeFile(new URL('vessel.obj',out),obj);await writeFile(new URL('materials/vessel.mtl',out),'newmtl ceramic\nKd 1 1 1\nmap_Kd ../textures/checker.png\n');
await writeFile(new URL('materials/plain.mtl',out),'newmtl ceramic\nKd 0.7 0.4 0.2\n');
const stl=Buffer.alloc(84+p.count/3*50);stl.writeUInt32LE(p.count/3,80);let ascii='solid vessel\n';for(let i=0;i<p.count;i+=3){let at=84+i/3*50;for(const v of [n.getX(i),n.getY(i),n.getZ(i)]){stl.writeFloatLE(v,at);at+=4;}ascii+=`facet normal ${n.getX(i)} ${n.getY(i)} ${n.getZ(i)}\nouter loop\n`;for(let k=i;k<i+3;k++){const v=[p.getX(k),p.getY(k),p.getZ(k)];for(const value of v){stl.writeFloatLE(value,at);at+=4;}ascii+=`vertex ${v.join(' ')}\n`;}ascii+='endloop\nendfacet\n';}ascii+='endsolid vessel\n';await writeFile(new URL('vessel.stl',out),stl);await writeFile(new URL('ascii.stl',out),ascii);
function plyHeader(format,faces=p.count/3){return `ply\nformat ${format} 1.0\nelement vertex ${p.count}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nelement face ${faces}\nproperty list uchar int vertex_indices\nend_header\n`;}
let ply=plyHeader('ascii');const bin=Buffer.alloc(p.count*15+p.count/3*13);let at=0;
for(let i=0;i<p.count;i++){const coords=[p.getX(i),p.getY(i),p.getZ(i)];ply+=`${coords.join(' ')} 190 115 65\n`;for(const v of coords){bin.writeFloatLE(v,at);at+=4;}for(const v of [190,115,65])bin[at++]=v;}
for(let i=0;i<p.count;i+=3){ply+=`3 ${i} ${i+1} ${i+2}\n`;bin[at++]=3;for(let k=i;k<i+3;k++){bin.writeInt32LE(k,at);at+=4;}}
await writeFile(new URL('vessel.ply',out),ply);await writeFile(new URL('binary.ply',out),Buffer.concat([Buffer.from(plyHeader('binary_little_endian')),bin]));await writeFile(new URL('pointcloud.ply',out),'ply\nformat ascii 1.0\nelement vertex 1\nproperty float x\nproperty float y\nproperty float z\nend_header\n0 0 0\n');
disposeModel(root);g.dispose();console.log('Generated local format fixtures');
