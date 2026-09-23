import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

// A continuous isosurface from the SAME physical particles. Gaussian kernels
// merge neighbouring samples; velocity-aligned kernels keep jets connected.
// MarchingCubes is the MIT Three.js addon, also used by the reference project.
// Field construction, moving bounds and material below are authored for this app.
export class LiquidSurface {
 constructor(fluid){
  this.fluid=fluid;this.resolution=56;this.rebuildMs=0;this.extent=0;
  this.scratch=new Float32Array(this.resolution**3);
  this.material=new THREE.MeshPhysicalMaterial({color:0xe5e5e5,metalness:0,roughness:.045,transmission:.98,thickness:.18,ior:1.333,envMapIntensity:.65,clearcoat:.1,clearcoatRoughness:.08,attenuationColor:0xaaaaaa,attenuationDistance:2.5,side:THREE.FrontSide});
  this.mesh=new MarchingCubes(this.resolution,this.material,false,false,65000);
  this.mesh.isolation=230;this.mesh.frustumCulled=false;this.mesh.name='Reconstructed liquid';
  this.center=new THREE.Vector3();this.mesh.renderOrder=2;
  this.drops=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),this.material,fluid.capacity);
  this.drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.drops.frustumCulled=false;this.drops.renderOrder=2;
  this.transform=new THREE.Object3D();this.axis=new THREE.Vector3(0,1,0);this.direction=new THREE.Vector3();
 }
 addTo(scene){scene.add(this.mesh,this.drops);}
 setVisible(value){this.mesh.visible=value;this.drops.visible=value;}
 update(){
  const start=performance.now(),f=this.fluid,p=f.position,v=f.velocity,n=f.count;
  this.mesh.visible=n>0;this.drops.visible=n>0;
  if(!n){this.extent=0;this.drops.count=0;this.rebuildMs=0;return;}
  // Surface grid follows the main body above the drain plane. Far runoff is
  // rendered as small droplets, so a stray drop cannot coarsen the whole pool.
  let x0=Infinity,y0=Infinity,z0=Infinity,x1=-Infinity,y1=-Infinity,z1=-Infinity;
  for(let i=0;i<n;i++){const k=i*3;if(p[k+1]<-1.75||Math.abs(p[k])>3.3||Math.abs(p[k+2])>3.3)continue;x0=Math.min(x0,p[k]);x1=Math.max(x1,p[k]);y0=Math.min(y0,p[k+1]);y1=Math.max(y1,p[k+1]);z0=Math.min(z0,p[k+2]);z1=Math.max(z1,p[k+2]);}
  let drops=0;
  if(x0!==Infinity){
   const size=Math.max(2.6,x1-x0+.65,y1-y0+.65,z1-z0+.65);
   // Quantized extent avoids a constantly rescaling grid. Expansion is immediate;
   // shrink only when appreciably smaller. All fields are rebuilt every frame.
   if(size>this.extent||size<this.extent*.74)this.extent=Math.ceil(size*5)/5;
   const e=this.extent,cell=e/(this.resolution-1),cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2;
   this.center.set(Math.round(cx/cell)*cell,Math.round(cy/cell)*cell,Math.round(cz/cell)*cell);
   this.mesh.position.copy(this.center);this.mesh.scale.setScalar(e/2);
   const minX=this.center.x-e/2,minY=this.center.y-e/2,minZ=this.center.z-e/2;
   const grid=this.mesh.size,plane=grid*grid,field=this.mesh.field,step=e/grid;
   field.fill(0);this.mesh.normal_cache.fill(0);this.mesh.count=0;
   // Deposit mass once, then reconstruct with separable box filters (a Gaussian
   // approximation). Sliding windows make cost proportional to grid cells,
   // not particle count times neighbourhood volume.
   for(let i=0;i<n;i++){
    const k=i*3;if(p[k+1]<-1.75||Math.abs(p[k])>3.3||Math.abs(p[k+2])>3.3)continue;
    const speed=Math.hypot(v[k],v[k+1],v[k+2]),stretch=Math.min(.045,speed*.007);
    const count=speed>1?3:1;
    for(let sample=0;sample<count;sample++){
     const shift=count===3?(sample-1)*stretch/(speed||1):0;
     const x=(p[k]+v[k]*shift-minX)/step,y=(p[k+1]+v[k+1]*shift-minY)/step,z=(p[k+2]+v[k+2]*shift-minZ)/step;
     const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
     if(ix<1||iy<1||iz<1||ix>=grid-2||iy>=grid-2||iz>=grid-2)continue;
     for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)field[(iz+dz)*plane+(iy+dy)*grid+ix+dx]+=(dx?fx:1-fx)*(dy?fy:1-fy)*(dz?fz:1-fz)/count;
    }
   }
   const sigma=.11/step,ideal=Math.sqrt(4*sigma*sigma+1);let width=Math.floor(ideal);if(width%2===0)width--;
   const smaller=Math.max(0,Math.min(3,Math.round((12*sigma*sigma-3*width*width-12*width-9)/(-4*width-4))));
   let source=field,target=this.scratch;
   for(let pass=0;pass<3;pass++){
    const radius=((pass<smaller?width:width+2)-1)/2;
    for(let axis=0;axis<3;axis++){
     blurAxis(source,target,grid,radius,axis);const swap=source;source=target;target=swap;
    }
   }
   const scale=180*Math.pow(Math.sqrt(2*Math.PI)*sigma,3);
   for(let i=0;i<field.length;i++)field[i]=source[i]*scale;
   this.mesh.update();
  }else this.mesh.visible=false;
  // Sparse splash samples below the isosurface threshold remain visible as
  // small ballistic droplets, rather than making the entire liquid spherical.
  for(let i=0;i<n;i++){
   const k=i*3,far=p[k+1]<-1.75||Math.abs(p[k])>3.3||Math.abs(p[k+2])>3.3;
   if(!far&&f.density[i]>1.35)continue;
   const speed=Math.hypot(v[k],v[k+1],v[k+2]);this.transform.position.set(p[k],p[k+1],p[k+2]);
   this.transform.scale.set(.047,.047*(1+Math.min(1.4,speed*.15)),.047);
   this.direction.set(v[k],v[k+1],v[k+2]);if(speed>.001)this.transform.quaternion.setFromUnitVectors(this.axis,this.direction.multiplyScalar(1/speed));else this.transform.quaternion.identity();
   this.transform.updateMatrix();this.drops.setMatrixAt(drops++,this.transform.matrix);
  }
  this.drops.count=drops;this.drops.instanceMatrix.needsUpdate=true;this.rebuildMs=performance.now()-start;
 }
}

// Constant-zero boundary; each source/target array is distinct.
function blurAxis(source,target,n,radius,axis){
 const plane=n*n,stride=axis===0?1:axis===1?n:plane,divisor=radius*2+1;
 for(let a=0;a<n;a++)for(let b=0;b<n;b++){
  const base=axis===0?a*plane+b*n:axis===1?a*plane+b:a*n+b;
  let sum=0;for(let q=0;q<=radius&&q<n;q++)sum+=source[base+q*stride];
  for(let q=0;q<n;q++){
   target[base+q*stride]=sum/divisor;
   if(q-radius>=0)sum-=source[base+(q-radius)*stride];
   if(q+radius+1<n)sum+=source[base+(q+radius+1)*stride];
  }
 }
}
