import * as THREE from 'three';

export function makeVessel(){
  const group=new THREE.Group();
  const material=new THREE.MeshStandardMaterial({color:0xa9afa2,roughness:.42,metalness:.02});
  const profile=[[0,-.86],[1.04,-.86],[1.1,-.80],[1.1,.49],[1.08,.55],[1.00,.57],[.94,.52],[.94,-.65],[.89,-.70],[0,-.70]].map(([x,y])=>new THREE.Vector2(x,y));
  const shell=new THREE.Mesh(new THREE.LatheGeometry(profile,96),material);shell.castShadow=true;shell.receiveShadow=true;group.add(shell);
  const band=new THREE.Mesh(new THREE.TorusGeometry(1.101,.008,6,96),new THREE.MeshStandardMaterial({color:0x707b74,roughness:.45}));band.rotation.x=Math.PI/2;band.position.y=-.66;group.add(band);
  return group;
}
export function makeRoom(){
  const group=new THREE.Group(),boxes=[];
  const wall=new THREE.MeshStandardMaterial({color:0x929d93,roughness:.78});
  const floor=new THREE.MeshStandardMaterial({color:0x716b5d,roughness:.8});
  const blue=new THREE.MeshStandardMaterial({color:0x566d65,roughness:.85});
  const oak=new THREE.MeshStandardMaterial({color:0x7a6d56,roughness:.65});
  const dark=new THREE.MeshStandardMaterial({color:0x343e38,roughness:.6});
  function box(x,y,z,w,h,d,mat,collide=true){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);if(collide)boxes.push([x-w/2,y-h/2,z-d/2,x+w/2,y+h/2,z+d/2]);return mesh;}
  box(0,-.79,0,3.4,.20,2.7,floor);box(-1.7,.03,0,.16,1.65,2.7,wall);box(1.7,.03,0,.16,1.65,2.7,wall);box(0,.03,-1.35,3.55,1.65,.16,wall);
  // The front wall deliberately has a door opening and a small sill: excess water escapes here.
  box(-.65,-.12,1.35,2.1,1.35,.16,wall);box(1.42,-.12,1.35,.56,1.35,.16,wall);box(.76,-.65,1.35,.76,.28,.16,wall);
  box(-1.02,-.40,-.54,.81,.47,1.02,blue);box(-1.35,-.10,-.54,.20,.65,1.05,blue);box(-1.03,-.30,-1.02,.83,.62,.15,blue);box(-1.03,-.30,-.06,.83,.62,.15,blue);
  box(.48,-.15,-.52,1.25,.13,.65,oak);for(const x of [-.05,1.01])for(const z of [-.78,-.26])box(x,-.42,z,.055,.48,.055,dark);
  for(let z=-1.1;z<1.25;z+=.3)box(0,-.685,z,3.25,.004,.007,new THREE.MeshStandardMaterial({color:0x555748,roughness:.9}),false);
  return {group,boxes};
}
export function disposeModel(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.source?.data?.close?.();t.dispose();});
}
