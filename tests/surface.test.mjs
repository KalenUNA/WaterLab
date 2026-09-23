import test from 'node:test';
import assert from 'node:assert/strict';
import {Fluid} from '../dist/js/fluid.js';
import {LiquidSurface} from '../dist/js/liquid-surface.js';
import {translate} from '../dist/js/i18n.js';

test('water surfacing preserves simulation and removes cleared water',()=>{
 const fluid=new Fluid();fluid.seedVessel();const original=fluid.position.slice();
 const surface=new LiquidSurface(fluid);surface.update();
 assert.ok(surface.mesh.geometry.drawRange.count>100,'a continuous mesh must be produced');
 assert.deepEqual(fluid.position,original,'rendering must not change the physics');
 const a=surface.mesh.geometry.attributes.position.array;
 for(let i=0;i<surface.mesh.geometry.drawRange.count*3;i++)assert.ok(Number.isFinite(a[i]));
 fluid.clear();surface.update();assert.equal(surface.mesh.visible,false);assert.equal(surface.drops.count,0);
});

test('nearby jet samples create a joined field between physical particles',()=>{
 const fluid=new Fluid();for(let y=-.5;y<=.5;y+=.13)fluid.add(0,y,0,0,-2,0);
 const surface=new LiquidSurface(fluid);surface.update();
 const mesh=surface.mesh,n=mesh.size,e=surface.extent;
 // Midpoint between the first two water samples, rather than a particle center.
 const x=Math.round((0-surface.center.x+e/2)/e*n),y=Math.round((-.435-surface.center.y+e/2)/e*n),z=Math.round((0-surface.center.z+e/2)/e*n);
 assert.ok(mesh.field[z*n*n+y*n+x]>mesh.isolation,'neighbours must merge into a jet');
});

test('language switch covers dynamic errors and mesh counts without changing filenames',()=>{
 assert.equal(translate('这不是有效的 GLB 文件。','en'),'This is not a valid GLB file.');
 assert.equal(translate('12.3 千三角面 · 网格碰撞','en'),'12.3k triangles · mesh collision');
 assert.equal(translate('12.3k triangles · mesh collision','zh'),'12.3 千三角面 · 网格碰撞');
 assert.equal(translate('my-scan.glb','en'),'my-scan.glb');
});
