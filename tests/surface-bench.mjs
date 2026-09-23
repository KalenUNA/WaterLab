// CPU surface generation only; excludes physics, GPU drawing and browser FPS.
// Run: node --import ./tests/register.mjs tests/surface-bench.mjs
import {Fluid} from '../dist/js/fluid.js';
import {LiquidSurface} from '../dist/js/liquid-surface.js';
const fluid=new Fluid();
for(let y=-.6;y<1.1;y+=.13)for(let x=-.8;x<.81;x+=.13)for(let z=-.8;z<.81;z+=.13)
 if(x*x+z*z<.75)fluid.add(x,y,z);
const surface=new LiquidSurface(fluid),samples=[];
for(let i=0;i<25;i++){surface.update();if(i>5)samples.push(surface.rebuildMs);}
samples.sort((a,b)=>a-b);
console.log(JSON.stringify({particles:fluid.count,medianSurfaceMs:samples[Math.floor(samples.length/2)],maxSurfaceMs:samples.at(-1),triangles:surface.mesh.geometry.drawRange.count/3},null,2));
