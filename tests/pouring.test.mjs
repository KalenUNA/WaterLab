import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion} from 'three';
import {Fluid} from '../dist/js/fluid.js';
import {Collider} from '../dist/js/collisions.js';
test('a spaced incoming stream fills the vessel without explosive source overlap',()=>{
 const f=new Fluid(),c=new Collider();c.setVessel();c.setRotation(new Quaternion());f.seedVessel();let counter=0,emission=0;
 for(let step=0;step<960;step++){
  if(step<720){emission+=150/120;while(emission>=1){emission--;const slot=counter++%7,a=slot*Math.PI/3,r=slot===6?0:.13;f.add(.15+Math.cos(a)*r,2.335,Math.sin(a)*r,0,-150*.137/7,0);}}
  f.step(1/120,c);
 }
 console.log({emitted:f.emitted,retained:f.count,drained:f.drained});assert.ok(f.count>f.emitted*.95,'normal pouring should accumulate in the vessel');
});
