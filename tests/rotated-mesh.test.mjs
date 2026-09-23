import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion,Vector3} from 'three';
import {Fluid} from '../dist/js/fluid.js';
import {Collider,collisionGeometry} from '../dist/js/collisions.js';
import {makeVessel} from '../dist/js/models.js';
test('dense water can leave a rotating imported mesh without getting trapped',()=>{
 const root=makeVessel();root.scale.setScalar(1.227);root.updateMatrixWorld(true);const {geometry}=collisionGeometry(root);const c=new Collider();c.setGeometry(geometry);
 const f=new Fluid({limit:1400});for(let y=-.7;y<.6;y+=.14)for(let x=-.9;x<.91;x+=.14)for(let z=-.9;z<.91;z+=.14)if(x*x+z*z<.81)f.add(x,y,z);
 const start=f.count;let previous=new Quaternion();const t=performance.now();
 for(let i=0;i<500;i++){const q=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.min(1,i/100)*Math.PI);c.setRotation(q,previous);f.step(1/120,c);previous=q;}
 console.log({denseStart:start,denseRemaining:f.count,durationMs:Math.round(performance.now()-t)});assert.ok(f.count<start*.1,'rotated mesh must not trap water');
});
