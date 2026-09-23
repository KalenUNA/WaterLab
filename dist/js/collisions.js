import {Vector3,Quaternion,Ray,DoubleSide,BufferGeometry,Float32BufferAttribute,Box3} from 'three';
import {MeshBVH} from 'three-mesh-bvh';

// All colliders live in model space. Previous and current transforms provide
// relative motion during each substep, including a rotating container wall.
export class Collider {
  constructor(){this.rotation=new Quaternion();this.inverse=new Quaternion();this.previousInverse=new Quaternion();this.p=new Vector3();this.old=new Vector3();this.ray=new Ray();this.target={point:new Vector3()};this.vessel=false;this.boxes=[];this.bvh=null;this.bounds=new Box3();}
  setRotation(current,previous=current){this.rotation.copy(current);this.inverse.copy(current).invert();this.previousInverse.copy(previous).invert();}
  setVessel(){this.dispose();this.vessel=true;this.boxes=[];}
  setBoxes(boxes){this.dispose();this.vessel=false;this.boxes=boxes;}
  setGeometry(geometry){this.dispose();this.vessel=false;this.boxes=[];this.geometry=geometry;geometry.computeBoundingBox();this.bounds.copy(geometry.boundingBox).expandByScalar(.2);this.bvh=new MeshBVH(geometry,{maxLeafTris:10});}
  dispose(){this.geometry?.dispose();this.geometry=null;this.bvh=null;}
  resolve(array,k,previous,r){
    const p=this.p.set(array[k],array[k+1],array[k+2]).applyQuaternion(this.inverse);
    if(this.vessel){this.cylinder(p,0,1.1,-.86,-.70,r);this.cylinder(p,.94,1.1,-.70,.55,r);}
    for(const b of this.boxes)this.box(p,b,r);
    if(this.bvh&&this.bounds.containsPoint(p)){
      const old=this.old.set(previous[k],previous[k+1],previous[k+2]).applyQuaternion(this.previousInverse);
      this.ray.origin.copy(old);this.ray.direction.subVectors(p,old);const distance=this.ray.direction.length();
      if(distance>.001){
        this.ray.direction.multiplyScalar(1/distance);
        const hit=this.bvh.raycastFirst(this.ray,DoubleSide,0,distance+r);
        if(hit&&hit.distance<=distance+r){
          const normal=hit.face.normal;if(normal.dot(this.ray.direction)>0)normal.negate();
          // Preserve tangential movement while keeping the particle on its original side.
          const signed=p.dot(normal)-hit.point.dot(normal);
          if(signed<r)p.addScaledVector(normal,r-signed);
        }
      }
      const near=this.bvh.closestPointToPoint(p,this.target,0,r);
      if(near&&near.distance<r&&near.distance>1e-7){
        const s=(r-near.distance)/near.distance;
        p.x+=(p.x-near.point.x)*s;p.y+=(p.y-near.point.y)*s;p.z+=(p.z-near.point.z)*s;
      }
    }
    p.applyQuaternion(this.rotation);array[k]=p.x;array[k+1]=p.y;array[k+2]=p.z;
  }
  cylinder(p,inner,outer,bottom,top,r){
    const radial=Math.hypot(p.x,p.z),nearRadial=Math.max(inner,Math.min(outer,radial)),nearY=Math.max(bottom,Math.min(top,p.y));
    const insideRadial=radial>=inner&&radial<=outer,insideY=p.y>=bottom&&p.y<=top;
    if(insideRadial&&insideY){
      let nearest=outer-radial,axis=0,sign=1;
      if(inner>0&&radial-inner<nearest){nearest=radial-inner;sign=-1;}
      if(p.y-bottom<nearest){nearest=p.y-bottom;axis=1;sign=-1;}
      if(top-p.y<nearest){nearest=top-p.y;axis=1;sign=1;}
      if(axis===1)p.y+=sign*(nearest+r);else{const next=radial+sign*(nearest+r),s=next/(radial||1);p.x*=s;p.z*=s;}
    }else{
      const dx=radial-nearRadial,dy=p.y-nearY,d=Math.hypot(dx,dy);
      if(d>1e-8&&d<r){const a=(r-d)/d;p.y+=dy*a;if(radial>1e-8){const s=(radial+dx*a)/radial;p.x*=s;p.z*=s;}}
    }
  }
  box(p,b,r){
    const [x0,y0,z0,x1,y1,z1]=b,px=Math.max(x0,Math.min(x1,p.x)),py=Math.max(y0,Math.min(y1,p.y)),pz=Math.max(z0,Math.min(z1,p.z));
    let dx=p.x-px,dy=p.y-py,dz=p.z-pz,d=Math.hypot(dx,dy,dz);
    if(d>=r)return;
    if(d>1e-8){const s=(r-d)/d;p.x+=dx*s;p.y+=dy*s;p.z+=dz*s;return;}
    const sides=[p.x-x0,x1-p.x,p.y-y0,y1-p.y,p.z-z0,z1-p.z];let side=0;for(let i=1;i<6;i++)if(sides[i]<sides[side])side=i;
    if(side===0)p.x=x0-r;else if(side===1)p.x=x1+r;else if(side===2)p.y=y0-r;else if(side===3)p.y=y1+r;else if(side===4)p.z=z0-r;else p.z=z1+r;
  }
}

export function collisionGeometry(root,maxTriangles=350000){
  root.updateMatrixWorld(true);const vertices=[];let count=0;
  root.traverse(node=>{
    if(!node.isMesh||!node.visible)return;
    const geo=node.geometry,position=geo.getAttribute('position'),index=geo.index;
    if(!position)return;const total=index?index.count:position.count;count+=total/3;
    if(count>maxTriangles)throw new Error('模型超过 35 万三角面。请先减面并重新导出 GLB，以保证水实验流畅。');
    const point=new Vector3();
    for(let i=0;i<total;i++){point.fromBufferAttribute(position,index?index.getX(i):i).applyMatrix4(node.matrixWorld);if(!Number.isFinite(point.x+point.y+point.z))throw new Error('模型含有无效坐标，请重新导出。');vertices.push(point.x,point.y,point.z);}
  });
  if(!vertices.length)throw new Error('文件里没有可用于碰撞的网格。请使用网格 GLB，点云和 3DGS 暂不支持。');
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));return {geometry,triangles:count};
}
