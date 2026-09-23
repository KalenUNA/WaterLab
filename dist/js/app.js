import {installLanguageSwitch} from './i18n.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LocalFiles,loadModel,MODEL_EXTENSIONS,extension,entriesFromFiles,entriesFromDrop} from './model-import.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Fluid} from './fluid.js';
import {Collider,collisionGeometry} from './collisions.js';
import {WaterRenderer} from './water-renderer.js';
import {makeVessel,makeRoom,disposeModel} from './models.js';

const $=id=>document.getElementById(id),viewport=$('viewport');
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),6500);}

installLanguageSwitch();

async function main(){
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.transmissionResolutionScale=.65;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
  viewport.appendChild(renderer.domElement);
  if(!renderer.extensions.has('EXT_color_buffer_float'))throw new Error('当前浏览器没有提供水面绘制所需的显卡支持。请在电脑 Chrome / Edge 中启用硬件加速后重试。');
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x191919);scene.fog=new THREE.Fog(0x191919,14,28);
  const camera=new THREE.PerspectiveCamera(42,1,.1,40);camera.position.set(3.8,4.6,5.0);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.58,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.enableRotate=false;controls.minDistance=3.6;controls.maxDistance=11;controls.maxPolarAngle=Math.PI*.82;
  const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();const environmentTarget=pmrem.fromScene(environment,.04);scene.environment=environmentTarget.texture;environment.dispose();pmrem.dispose();scene.environmentIntensity=.32;
  scene.add(new THREE.HemisphereLight(0xd8d8d8,0x363636,.85));
  const sun=new THREE.DirectionalLight(0xdedede,1.65);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.normalBias=.02;sun.shadow.bias=-.0003;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xb5b5b5,.85);fill.position.set(5,3,-4);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x191919,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.9;ground.receiveShadow=true;scene.add(ground);
  const ringMaterial=new THREE.MeshBasicMaterial({color:0x767676,transparent:true,opacity:.16,depthWrite:false});
  for(const radius of [2.2,2.7]){const ring=new THREE.Mesh(new THREE.RingGeometry(radius,radius+.006,128),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=-1.892;scene.add(ring);}
  const modelRoot=new THREE.Group();scene.add(modelRoot);let model=null,modelKind='vessel',mode='object',pouring=false,busy=false,atLimit=false;
  let collider=new Collider();const fluid=new Fluid();const water=new WaterRenderer(renderer,camera,fluid);
  const emitter=new THREE.Vector3(.15,2.4,0),nozzle=new THREE.Group();scene.add(nozzle);
  const nozzleMat=new THREE.MeshStandardMaterial({color:0x818181,roughness:.4,metalness:.38});
  const nozzleBody=new THREE.Mesh(new THREE.CylinderGeometry(.14,.165,.29,32),nozzleMat);nozzleBody.position.y=.145;nozzle.add(nozzleBody);
  const nozzleRim=new THREE.Mesh(new THREE.TorusGeometry(.164,.017,10,40),new THREE.MeshStandardMaterial({color:0xafafaf,roughness:.3,metalness:.3}));nozzleRim.rotation.x=Math.PI/2;nozzle.add(nozzleRim);
  const nozzleHole=new THREE.Mesh(new THREE.CircleGeometry(.147,32),new THREE.MeshBasicMaterial({color:0x2a2a2a,side:THREE.DoubleSide}));nozzleHole.rotation.x=Math.PI/2;nozzleHole.position.y=.006;nozzle.add(nozzleHole);
  const guideGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  const guide=new THREE.Line(guideGeometry,new THREE.LineDashedMaterial({color:0x969696,dashSize:.045,gapSize:.065,transparent:true,opacity:.4,depthWrite:false}));scene.add(guide);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.15,.16,48),new THREE.MeshBasicMaterial({color:0xababab,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=-1.887;scene.add(marker);
  const omega=new THREE.Vector3(),targetOmega=new THREE.Vector3(),dragMotion=new THREE.Vector3(),previousQ=new THREE.Quaternion(),stepQ=new THREE.Quaternion(),axis=new THREE.Vector3();let resetting=false;
  function refreshNozzle(){nozzle.position.copy(emitter);const a=guideGeometry.attributes.position;a.setXYZ(0,emitter.x,emitter.y,emitter.z);a.setXYZ(1,emitter.x,-1.88,emitter.z);a.needsUpdate=true;guide.computeLineDistances();marker.position.x=emitter.x;marker.position.z=emitter.z;}
  function setPour(value){pouring=!!value;$('pour').classList.toggle('active',pouring);$('pour').setAttribute('aria-pressed',String(pouring));$('pour').querySelector('span').textContent=pouring?'停止倒水':'开始倒水';$('water-state').textContent=pouring?'正在流动':'已关闭';$('water-state').classList.toggle('on',pouring);}
  function clearWater(){clearTimeout(toastTimer);$('toast').classList.remove('visible');fluid.clear();setPour(false);emission=0;atLimit=false;$('particle-count').textContent='0';$('status').textContent='水已清空';}
  function upright(){resetting=true;omega.set(0,0,0);targetOmega.set(0,0,0);dragMotion.set(0,0,0);}
  function setMode(next){
    mode=next;controls.enableRotate=mode==='view';
    document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    $('interaction-hint').textContent=mode==='object'?'拖动模型让水晃动 · 松手后保持惯性 · 滚轮缩放':mode==='view'?'拖动观察不同角度 · 滚轮缩放 · 水继续受重力影响':'在空白处拖动出水口 · 右侧调节高度 · 箭头键微调';
    guide.visible=mode==='nozzle'||!pouring;marker.visible=mode==='nozzle';
  }
  function replaceModel(next,nextCollider,kind,name,description){
    clearTimeout(toastTimer);$('toast').classList.remove('visible');
    if(model){modelRoot.remove(model);disposeModel(model);}collider.dispose();collider=nextCollider;model=next;modelRoot.add(model);modelKind=kind;modelRoot.quaternion.identity();collider.setRotation(modelRoot.quaternion);omega.set(0,0,0);targetOmega.set(0,0,0);dragMotion.set(0,0,0);resetting=false;fluid.clear();setPour(false);atLimit=false;
    $('model-name').dataset.imported=String(kind==='imported');$('model-name').textContent=name;$('model-description').textContent=description;$('scene-caption').textContent=kind==='vessel'?'VESSEL / 001':kind==='room'?'ROOM / 002':'YOUR MODEL / 003';
    emitter.set(.15,2.4,0);$('height').value='2.4';$('height-value').textContent='2.4';refreshNozzle();
    document.querySelectorAll('[data-model]').forEach(b=>{const on=b.dataset.model===kind;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
    $('status').textContent=kind==='imported'?'模型已导入 · 按表面碰撞':'准备就绪';
  }
  function selectModel(kind){
    if(busy)return;const nextCollider=new Collider();
    if(kind==='vessel'){nextCollider.setVessel();replaceModel(makeVessel(),nextCollider,kind,'陶瓷容器','开放杯口 · 可接水与倾倒');fluid.seedVessel();}
    else{const result=makeRoom();nextCollider.setBoxes(result.boxes);replaceModel(result.group,nextCollider,kind,'房间切片','门口留有开口 · 水可流出');}
  }
  function chooseModel(entries){
    if(entries.length===1)return Promise.resolve(entries[0]);
    const dialog=$('model-choice'),select=$('model-choice-select');select.replaceChildren();
    entries.forEach((entry,i)=>{const option=new Option(entry.path,String(i));option.dataset.imported='true';select.add(option);});
    dialog.returnValue='';dialog.showModal();
    return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='import'?entries[Number(select.value)]:null),{once:true}));
  }
  async function importFiles(entries){
    if(!entries.length||busy)return;
    busy=true;$('import').disabled=true;$('import-folder').disabled=true;let prepared=null,newCollider=null,bundle=null;
    try{
      bundle=new LocalFiles(entries);const candidates=bundle.entries.filter(e=>MODEL_EXTENSIONS.has(extension(e.path)));
      if(!candidates.length)throw new Error('请选择 GLB、GLTF、OBJ、STL 或 PLY 网格模型。');
      const entry=await chooseModel(candidates);if(!entry)return;
      $('status').textContent='正在读取模型…';const result=await loadModel(entry,bundle);
      prepared=new THREE.Group();prepared.add(result.root);let skinned=false;
      prepared.traverse(o=>{if(o.isSkinnedMesh)skinned=true;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      if(skinned)throw new Error('测试版需要静态网格，请把骨骼或动画模型转换为静态 GLB。');
      const box=new THREE.Box3().setFromObject(prepared),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
      const extent=Math.max(size.x,size.y,size.z);if(!Number.isFinite(extent)||extent<1e-6)throw new Error('模型没有可显示的有效尺寸。');
      result.root.position.sub(center);prepared.scale.setScalar(2.7/extent);prepared.updateMatrixWorld(true);
      $('status').textContent='正在准备模型碰撞…';await new Promise(resolve=>setTimeout(resolve,20));
      const {geometry,triangles}=collisionGeometry(prepared);newCollider=new Collider();newCollider.setGeometry(geometry);
      replaceModel(prepared,newCollider,'imported',entry.file.name,`${Math.round(triangles/100)/10} 千三角面 · 网格碰撞`);prepared=null;newCollider=null;
      toast(result.notes[0]||'模型已就绪。试着倒水；内壁或底部的缺口可能漏水。');
    }catch(error){prepared&&disposeModel(prepared);newCollider?.dispose();console.warn('Model import:',error.message);$('status').textContent='导入失败 · 保留原模型';toast(error.message.includes('KTX2')?'暂不支持 KTX2 贴图。请使用 PNG / JPEG 贴图重新导出 GLB。':error.message);}
    finally{bundle?.dispose();busy=false;$('import').disabled=false;$('import-folder').disabled=false;$('file-input').value='';$('folder-input').value='';}
  }
  document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>selectModel(b.dataset.model)));
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('pour').addEventListener('click',()=>setPour(!pouring));$('clear').addEventListener('click',clearWater);$('upright').addEventListener('click',upright);
  $('import').addEventListener('click',()=>$('file-input').click());$('file-input').addEventListener('change',e=>importFiles(entriesFromFiles(e.target.files)));
  $('import-folder').addEventListener('click',()=>$('folder-input').click());$('folder-input').addEventListener('change',e=>importFiles(entriesFromFiles(e.target.files)));
  $('flow').addEventListener('input',e=>{$('flow-value').textContent=e.target.value<100?'轻柔':e.target.value<200?'适中':'充沛';});
  $('height').addEventListener('input',e=>{emitter.y=Number(e.target.value);$('height-value').textContent=emitter.y.toFixed(1);refreshNozzle();});
  $('surface').addEventListener('change',e=>water.setMode(e.target.value));
  $('quality').addEventListener('change',e=>{const next=Number(e.target.value);fluid.limit=next;if(fluid.count>next){fluid.clear();toast('已降低水量上限并清空现有水。');}atLimit=false;});
  let dragDepth=0;
  window.addEventListener('dragenter',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();dragDepth++;$('drop-overlay').hidden=false;}});
  window.addEventListener('dragover',e=>{e.preventDefault();});
  window.addEventListener('dragleave',e=>{e.preventDefault();if(--dragDepth<=0){dragDepth=0;$('drop-overlay').hidden=true;}});
  window.addEventListener('drop',async e=>{e.preventDefault();dragDepth=0;$('drop-overlay').hidden=true;if(busy)return;try{await importFiles(await entriesFromDrop(e.dataTransfer));}catch(error){toast(error.message);}});
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0)),point=new THREE.Vector3();
  let pointer=null,lastX=0,lastY=0,lastMove=0,lastEventTime=0;
  function moveNozzle(event){const rect=viewport.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);plane.constant=-emitter.y;if(raycaster.ray.intersectPlane(plane,point)){emitter.x=THREE.MathUtils.clamp(point.x,-2.5,2.5);emitter.z=THREE.MathUtils.clamp(point.z,-2.5,2.5);refreshNozzle();}}
  viewport.addEventListener('pointerdown',e=>{if(e.button!==0||mode==='view')return;viewport.focus({preventScroll:true});pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;lastEventTime=performance.now();lastMove=0;targetOmega.set(0,0,0);resetting=false;viewport.setPointerCapture(pointer);if(mode==='nozzle')moveNozzle(e);});
  viewport.addEventListener('pointermove',e=>{
    if(e.pointerId!==pointer)return;if(mode==='nozzle'){moveNozzle(e);return;}
    const now=performance.now(),dt=Math.max((now-lastEventTime)/1000,.016),dx=e.clientX-lastX,dy=e.clientY-lastY;
    const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
    dragMotion.addScaledVector(right,dy*.009).addScaledVector(up,dx*.009);
    targetOmega.copy(right).multiplyScalar(dy*.009/dt).addScaledVector(up,dx*.009/dt);targetOmega.clampLength(0,3.5);omega.copy(targetOmega);lastMove=now;lastEventTime=now;lastX=e.clientX;lastY=e.clientY;
  });
  function release(e){if(e.pointerId!==pointer)return;if(viewport.hasPointerCapture(pointer))viewport.releasePointerCapture(pointer);pointer=null;targetOmega.set(0,0,0);}
  viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);viewport.addEventListener('lostpointercapture',()=>{pointer=null;});
  window.addEventListener('keydown',e=>{
    if(/INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY/.test(e.target.tagName))return;
    if(e.code==='Space'){e.preventDefault();setPour(!pouring);}if(e.key==='1')setMode('object');if(e.key==='2')setMode('view');if(e.key==='3')setMode('nozzle');if(e.key.toLowerCase()==='r')upright();if(e.key.toLowerCase()==='c')clearWater();
    if(e.key.startsWith('Arrow')){e.preventDefault();if(mode==='nozzle'){emitter.x=THREE.MathUtils.clamp(emitter.x+(e.key==='ArrowRight'?.12:e.key==='ArrowLeft'?-.12:0),-2.5,2.5);emitter.z=THREE.MathUtils.clamp(emitter.z+(e.key==='ArrowDown'?.12:e.key==='ArrowUp'?-.12:0),-2.5,2.5);refreshNozzle();}else if(mode==='object'){omega.x+=(e.key==='ArrowDown'?.9:e.key==='ArrowUp'?-.9:0);omega.z+=(e.key==='ArrowRight'?-.9:e.key==='ArrowLeft'?.9:0);omega.clampLength(0,3.5);resetting=false;}}
  });
  function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();water.resize(w,h);}
  new ResizeObserver(resize).observe(viewport);refreshNozzle();selectModel('vessel');setMode('object');resize();controls.update();
  let emission=0,emissionIndex=0,accumulator=0,lastTime=performance.now(),lastStats=lastTime,frames=0;const dt=1/120;
  function simulate(now){
    previousQ.copy(modelRoot.quaternion);
    if(resetting){modelRoot.quaternion.slerp(new THREE.Quaternion(),1-Math.exp(-9*dt));if(modelRoot.quaternion.angleTo(new THREE.Quaternion())<.002){modelRoot.quaternion.identity();resetting=false;}}
    else{
      if(dragMotion.lengthSq()>1e-8){
        const length=dragMotion.length(),angle=Math.min(length,4*dt);axis.copy(dragMotion).multiplyScalar(1/length);stepQ.setFromAxisAngle(axis,angle);modelRoot.quaternion.premultiply(stepQ).normalize();dragMotion.addScaledVector(axis,-angle);
      }else{
        if(pointer!==null&&mode==='object'){if(now-lastMove>70)omega.set(0,0,0);}else{
          omega.multiplyScalar(Math.exp(-2.1*dt));const speed=omega.length();if(speed>.002){axis.copy(omega).multiplyScalar(1/speed);stepQ.setFromAxisAngle(axis,speed*dt);modelRoot.quaternion.premultiply(stepQ).normalize();}
        }
      }
    }
    collider.setRotation(modelRoot.quaternion,previousQ);
    if(pouring){
      const rate=Number($('flow').value);emission+=rate*dt;
      while(emission>=1){emission--;const slot=emissionIndex++%7,angle=slot*Math.PI/3,r=slot===6?0:.13;
        if(!fluid.add(emitter.x+Math.cos(angle)*r,emitter.y-.065,emitter.z+Math.sin(angle)*r,0,-Math.max(1.8,rate*.137/7),0)&&!atLimit){atLimit=true;toast('已到水量上限，暂时停止加水。倒出一些水或清空后可继续。');}
      }
    }else emission=0;
    fluid.step(dt,collider);if(fluid.count<fluid.limit-10)atLimit=false;
  }
  function frame(now){
    requestAnimationFrame(frame);const elapsed=Math.min((now-lastTime)/1000,.05);lastTime=now;if(document.hidden)return;
    if(!busy){accumulator=Math.min(accumulator+elapsed,dt*4);while(accumulator>=dt){simulate(now);accumulator-=dt;}}
    controls.update();guide.visible=mode==='nozzle'||!pouring;water.draw(scene,now/1000);frames++;
    if(now-lastStats>500){$('fps').textContent=String(Math.round(frames*1000/(now-lastStats)));$('particle-count').textContent=fluid.count.toLocaleString();if(!busy)$('status').textContent=atLimit?'达到水量上限':pouring?'正在倒水':modelKind==='imported'?'本机模型 · 网格碰撞':'准备就绪';lastStats=now;frames=0;}
  }
  document.addEventListener('visibilitychange',()=>{lastTime=performance.now();accumulator=0;pointer=null;targetOmega.set(0,0,0);});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setPour(false);toast('显卡连接中断，请刷新网页恢复实验。');});
  // Optional browser-native agent tools reuse the same controls; no network service.
  const context=document.modelContext;
  if(context?.registerTool){
    const signal=new AbortController();window.addEventListener('pagehide',()=>signal.abort(),{once:true});
    const registrations=[
      {name:'read_water_experiment',description:'Read the currently visible model, water count, pouring state and nozzle position.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({model:$('model-name').textContent,particles:fluid.count,pouring,nozzle:emitter.toArray(),mode})},
      {name:'set_water_pouring',description:'Start or stop pouring water, matching the visible pour button.',inputSchema:{type:'object',properties:{enabled:{type:'boolean'}},required:['enabled'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(typeof input?.enabled!=='boolean')throw new Error('enabled must be a boolean');setPour(input.enabled);return {pouring};}}
    ];
    for(const tool of registrations){try{Promise.resolve(context.registerTool(tool,{signal:signal.signal})).catch(()=>{});}catch{}}
  }
  water.draw(scene);$('loading').hidden=true;document.body.dataset.ready='true';requestAnimationFrame(frame);
}
main().catch(error=>{console.error(error);$('loading').replaceChildren();const message=document.createElement('p');message.style.cssText='max-width:520px;padding:24px;line-height:1.8;text-align:center';message.textContent=error.message;$('loading').append(message);$('status').textContent='无法启动';});
