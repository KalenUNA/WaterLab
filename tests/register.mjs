import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){
 if(specifier==='three')return {url:new URL('../dist/vendor/three/three.module.js',import.meta.url).href,shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return {url:new URL('../dist/vendor/three/addons/'+specifier.slice(13),import.meta.url).href,shortCircuit:true};
 if(specifier==='three-mesh-bvh')return {url:new URL('../dist/vendor/bvh/index.js',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}});
