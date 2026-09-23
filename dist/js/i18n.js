// UI copy only. User filenames and model contents are never translated.
const pairs = [
 ['模型文件仅在本机读取','Model files stay on your device'],['导入文件夹','Import folder'],['选择要导入的模型','Choose a model'],['找到多个模型，请选择一个用于水实验。','Multiple models found. Choose one for the water experiment.'],['模型文件','Model file'],['取消','Cancel'],['导入','Import'],
 ['支持 GLB、GLTF、OBJ、STL 和 PLY 网格。GLTF 的 BIN、OBJ 的 MTL 和贴图请一起选择，或导入整个文件夹。模型自动居中，按表面挡水；缺口会漏水。','Supports GLB, GLTF, OBJ, STL and PLY meshes. Select companion BIN, MTL and texture files together, or import the folder. Models are centered automatically; gaps in the mesh may leak.'],
 ['保留模型材质或顶点颜色。支持 Draco / Meshopt；暂不支持点云、3DGS、KTX2 和动画变形。单模型最大 80 MB，配套文件总计 200 MB / 500 个；建议少于 20 万三角面。','Materials or vertex colors are preserved. Supports Draco / Meshopt; point clouds, 3DGS, KTX2 and animated deformation are unsupported. Limits: 80 MB per model, 200 MB / 500 files total; under 200k triangles recommended.'],
 ['请选择 GLB、GLTF、OBJ、STL 或 PLY 网格模型。','Choose a GLB, GLTF, OBJ, STL or PLY mesh.'],['这不是有效的 GLTF 文件。','This is not a valid GLTF file.'],['这不是有效的 PLY 文件。','This is not a valid PLY file.'],['目前支持 glTF 2.0，请重新导出模型。','glTF 2.0 is supported. Please re-export the model.'],
 ['资源路径超出所选文件夹。','The resource path is outside the selected folder.'],['所选文件超过 500 个，请只选择模型与配套资源。','More than 500 files selected. Select only the model and its companion files.'],['配套文件总计超过 200 MB，请减少贴图大小或只选择所需文件。','Selected files exceed 200 MB. Reduce texture sizes or select only required files.'],['模型引用了外部资源，请把配套文件一起导入。','The model references external resources. Import its companion files together.'],['配套文件重名，请使用导入文件夹保留目录结构。','Companion filenames are ambiguous. Use Import folder to preserve their paths.'],['贴图或配套文件无法读取，请检查文件是否损坏。','A texture or companion file could not be read. Check for damaged files.'],['未找到 MTL，已使用默认材质。','MTL not found. Default material applied.'],['这个 PLY 是点云，没有三角面；请先重建网格再导入。','This PLY is a point cloud without faces. Reconstruct a mesh before importing.'],['文件里没有可用于碰撞的网格，暂不支持点云和 3DGS。','No collision mesh found. Point clouds and 3DGS are not supported.'],
 ['水实验','Water study'],['本地测试版','Local preview'],['导入模型','Import model'],
 ['3D 水实验区域','3D water experiment'],['模型选择','Model selection'],['实验对象','Object'],['内置模型','Built-in models'],['容器','Vessel'],['房间','Room'],
 ['陶瓷容器','Ceramic vessel'],['开放杯口 · 可接水与倾倒','Open vessel · fill and tip'],['房间切片','Room section'],['门口留有开口 · 水可流出','Open doorway · water can escape'],
 ['GLB 文件仅在本机读取','GLB files stay on your device'],['导入模型说明','About model import'],
 ['拖入单个 .glb 文件，自动居中并适配大小。保留材质，按模型表面挡水。杯底、墙壁或内壁的缺口会漏水。','Drop one .glb file. It is centered and resized, with materials preserved. Water collides with the mesh; gaps in walls or the bottom can leak.'],
 ['支持普通、Draco 与 Meshopt 压缩网格；暂不支持 3DGS、KTX2 贴图和动画变形。建议少于 20 万三角面，最大 80 MB。','Supports standard, Draco and Meshopt meshes. 3DGS, KTX2 textures and animated deformation are not supported. Recommended: under 200k triangles; maximum file size: 80 MB.'],
 ['下载测试容器 GLB','Download sample vessel GLB'],['水流设置','Water settings'],['水流','Water'],['已关闭','Off'],['正在流动','Flowing'],['开始倒水','Pour water'],['停止倒水','Stop pouring'],['空格','Space'],
 ['流量','Flow'],['轻柔','Gentle'],['适中','Medium'],['充沛','Strong'],['出水高度','Outlet height'],['水量上限','Water budget'],['轻量','Light'],['标准','Standard'],['更多','More'],['清空水','Clear water'],
 ['显示方式','Appearance'],['连续水面','Liquid surface'],['粒子对照','Particle view'],
 ['拖动模型让水晃动 · 松手后保持惯性 · 滚轮缩放','Drag to tilt · release for momentum · scroll to zoom'],['拖动观察不同角度 · 滚轮缩放 · 水继续受重力影响','Drag to orbit · scroll to zoom · gravity stays vertical'],['在空白处拖动出水口 · 右侧调节高度 · 箭头键微调','Drag the outlet · adjust height on the right · arrow keys to nudge'],
 ['操作模式','Interaction mode'],['转动模型','Tilt model'],['观察视角','Orbit view'],['移动出水口','Move outlet'],['模型回正','Return model upright'],['回正','Upright'],
 ['准备就绪','Ready'],['水粒子','particles'],['把模型放在这里','Drop your model here'],['.glb · 保留材质 · 本机处理','.glb · materials preserved · local processing'],['准备实验空间…','Preparing the experiment…'],
 ['水已清空','Water cleared'],['模型已导入 · 按表面碰撞','Model imported · mesh collision'],['正在读取模型…','Reading model…'],['正在准备模型碰撞…','Preparing mesh collision…'],['导入失败 · 保留原模型','Import failed · previous model retained'],
 ['请选择单个 .glb 网格模型。','Choose a single .glb mesh file.'],['文件超过 80 MB。请压缩贴图或减面后再导入。','File exceeds 80 MB. Reduce texture sizes or mesh complexity and try again.'],['这不是有效的 GLB 文件。','This is not a valid GLB file.'],
 ['测试版需要静态网格，请把骨骼或动画模型转换为静态 GLB。','This preview needs a static mesh. Export a static GLB without skeletal deformation.'],['模型没有可显示的有效尺寸。','The model has no valid visible dimensions.'],
 ['模型已就绪。试着倒水；内壁或底部的缺口可能漏水。','Model ready. Try pouring; gaps in inner walls or the bottom may leak.'],['暂不支持 KTX2 贴图。请使用 PNG / JPEG 贴图重新导出 GLB。','KTX2 textures are not supported. Re-export the GLB with PNG or JPEG textures.'],
 ['已降低水量上限并清空现有水。','Water budget reduced. Existing water has been cleared.'],['已到水量上限，暂时停止加水。倒出一些水或清空后可继续。','Water budget reached. Spill or clear some water to continue pouring.'],
 ['达到水量上限','Water budget reached'],['正在倒水','Pouring'],['本机模型 · 网格碰撞','Local model · mesh collision'],['显卡连接中断，请刷新网页恢复实验。','Graphics connection lost. Reload to restart the experiment.'],['无法启动','Unable to start'],
 ['请导出包含贴图的单个 GLB 文件；不加载外部贴图地址。','Export one GLB containing its textures. External texture URLs are not loaded.'],['模型超过 35 万三角面。请先减面并重新导出 GLB，以保证水实验流畅。','The model exceeds 350k triangles. Simplify it and re-export a GLB for smoother interaction.'],['模型含有无效坐标，请重新导出。','The model contains invalid coordinates. Please re-export it.'],['文件里没有可用于碰撞的网格。请使用网格 GLB，点云和 3DGS 暂不支持。','No collision mesh found. Use a mesh GLB; point clouds and 3DGS are not supported.'],
 ['当前浏览器没有提供水面绘制所需的显卡支持。请在电脑 Chrome / Edge 中启用硬件加速后重试。','Required graphics support is unavailable. Enable hardware acceleration in desktop Chrome or Edge and try again.']
];
const toEnglish=new Map(pairs),toChinese=new Map(pairs.map(([a,b])=>[b,a]));
export function translate(text,language){
 const clean=text.trim(),dict=language==='en'?toEnglish:toChinese;let result=dict.get(clean);
 if(result===undefined){
  const triangles=clean.match(language==='en'?/^([\d.]+) 千三角面 · 网格碰撞$/:/^([\d.]+)k triangles · mesh collision$/);
  if(triangles)result=language==='en'?`${triangles[1]}k triangles · mesh collision`:`${triangles[1]} 千三角面 · 网格碰撞`;
  const missing=clean.match(language==='en'?/^缺少配套文件：(.*)$/:/^Missing companion file: (.*)$/);
  if(missing)result=language==='en'?`Missing companion file: ${missing[1]}`:`缺少配套文件：${missing[1]}`;
 }
 return result===undefined?text:text.replace(clean,result);
}
export function installLanguageSwitch(){
 let language='zh';try{language=localStorage.getItem('water-lab-language')==='en'?'en':'zh';}catch{}
 const button=document.getElementById('language');
 function visit(node){
  if(node.nodeType===3){if(node.parentElement?.dataset.imported==='true')return;const value=translate(node.nodeValue,language);if(value!==node.nodeValue)node.nodeValue=value;return;}
  if(node.nodeType!==1||['SCRIPT','STYLE','SVG'].includes(node.tagName))return;
  if(node.id==='model-name'&&node.dataset.imported==='true')return;
  for(const attr of ['aria-label','title'])if(node.hasAttribute(attr)){const original=node.getAttribute(attr),value=translate(original,language);if(original!==value)node.setAttribute(attr,value);}
  for(const child of node.childNodes)visit(child);
 }
 function apply(){document.documentElement.lang=language==='en'?'en':'zh-CN';document.title=language==='en'?'Water Lab · Interactive water':'Water Lab · 水实验';button.textContent=language==='en'?'中文':'EN';button.setAttribute('aria-label',language==='en'?'Switch to Chinese':'Switch to English');visit(document.body);}
 button.addEventListener('click',()=>{language=language==='en'?'zh':'en';try{localStorage.setItem('water-lab-language',language);}catch{}apply();});
 const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData'){if(r.target.parentElement?.id!=='language'&&r.target.parentElement?.dataset.imported!=='true')visit(r.target);}else for(const n of r.addedNodes)visit(n);}});
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});apply();
}
