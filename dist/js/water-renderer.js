import * as THREE from 'three';
import {LiquidSurface} from './liquid-surface.js';

export class WaterRenderer {
 constructor(renderer,camera,fluid){
  this.renderer=renderer;this.camera=camera;this.fluid=fluid;this.mode='liquid';this.attached=false;
  this.liquid=new LiquidSurface(fluid);
  this.particles=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(fluid.radius,1),new THREE.MeshStandardMaterial({color:0x999999,roughness:.35}),fluid.capacity);
  this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.particles.frustumCulled=false;this.particles.name='Physics particle comparison';
  this.matrix=new THREE.Matrix4();
 }
 setMode(mode){this.mode=mode;this.liquid.setVisible(mode==='liquid');this.particles.visible=mode==='particles';}
 resize(){}
 draw(scene){
  if(!this.attached){this.liquid.addTo(scene);scene.add(this.particles);this.attached=true;}
  this.particles.visible=this.mode==='particles';
  if(this.mode==='liquid')this.liquid.update();else{
   this.liquid.setVisible(false);const p=this.fluid.position;this.particles.count=this.fluid.count;
   for(let i=0;i<this.fluid.count;i++){this.matrix.makeTranslation(p[i*3],p[i*3+1],p[i*3+2]);this.particles.setMatrixAt(i,this.matrix);}
   this.particles.instanceMatrix.needsUpdate=true;
  }
  this.renderer.setRenderTarget(null);this.renderer.render(scene,this.camera);
 }
}
