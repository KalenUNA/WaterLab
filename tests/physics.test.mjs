import './register.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion,Vector3,Group,Mesh,BoxGeometry,MeshBasicMaterial} from 'three';
import {Fluid} from '../dist/js/fluid.js';
import {Collider,collisionGeometry} from '../dist/js/collisions.js';
import {makeVessel,makeRoom} from '../dist/js/models.js';
const dt=1/120;
test('water stays inside an upright vessel and spills when inverted',()=>{
 const f=new Fluid({limit:900}),c=new Collider();c.setVessel();c.setRotation(new Quaternion());f.seedVessel();const start=f.count;
 for(let i=0;i<360;i++)f.step(dt,c);
 let escaped=0,maxSpeed=0;for(let i=0;i<f.count;i++){const k=i*3;if(f.position[k+1]<-.72||Math.hypot(f.position[k],f.position[k+2])>.94)escaped++;maxSpeed=Math.max(maxSpeed,Math.hypot(...f.velocity.subarray(k,k+3)));}
 console.log({start,retained:f.count,escaped,maxSpeed});assert.equal(f.count,start);assert.equal(escaped,0);assert.ok(maxSpeed<2,'water should settle');
 let prev=new Quaternion();for(let i=0;i<600;i++){const q=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),Math.min(1,i/120)*Math.PI);c.setRotation(q,prev);f.step(dt,c);prev=q;}
 console.log({remainingAfterInversion:f.count,drained:f.drained});assert.ok(f.count<start*.2,'inverted open vessel should empty');
});
test('room floor catches water; water reaching the door can leave',()=>{
 const {boxes}=makeRoom(),c=new Collider();c.setBoxes(boxes);c.setRotation(new Quaternion());
 const prev=new Float32Array([0,-.6,0]),p=new Float32Array([0,-.7,0]);c.resolve(p,0,prev,.064);assert.ok(p[1]>-.64);
 const door=new Float32Array([.77,-.3,1.36]),doorPrev=new Float32Array([.77,-.3,1.2]);c.resolve(door,0,doorPrev,.064);assert.ok(Math.abs(door[2]-1.36)<.001,'opening should not get an invisible wall');
});
test('imported mesh retains a cavity and blocks a fast crossing of a thin wall',()=>{
 const root=makeVessel(),{geometry}=collisionGeometry(root),c=new Collider();c.setGeometry(geometry);c.setRotation(new Quaternion());
 const p=new Float32Array([0,-.9,0]),prev=new Float32Array([0,-.4,0]);c.resolve(p,0,prev,.064);assert.ok(p[1]>-.69,'cup bottom must block the particle');
 const cavity=new Float32Array([0,0,0]);c.resolve(cavity,0,cavity.slice(),.064);assert.deepEqual([...cavity],[0,0,0],'cavity must stay hollow');
 const f=new Fluid({limit:200});for(let x=-.4;x<.5;x+=.13)for(let z=-.4;z<.5;z+=.13)f.add(x,-.2,z);
 const count=f.count;for(let i=0;i<240;i++)f.step(dt,c);assert.equal(f.count,count,'mesh cup must keep resting water');
});
test('import limits and water budget are explicit',()=>{
 const f=new Fluid({capacity:10,limit:3});for(let i=0;i<9;i++)f.add(i,1,0);assert.equal(f.count,3);f.clear();assert.equal(f.count,0);
 const root=new Group();root.add(new Mesh(new BoxGeometry(),new MeshBasicMaterial()));assert.throws(()=>collisionGeometry(root,2),/三角面/);
});
