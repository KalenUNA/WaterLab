# Third-party software

- **Three.js 0.180.0** — MIT. Source: <https://github.com/mrdoob/three.js/tree/r180>. License: `dist/vendor/three/LICENSE`. The included example loaders, controls, utilities, MarchingCubes surface reconstruction and environment are part of Three.js.
- **three-mesh-bvh 0.9.1** — MIT. Source: <https://github.com/gkjohnson/three-mesh-bvh>. License: `dist/vendor/bvh/LICENSE`.
- **Meshoptimizer decoder 0.22**, distributed in Three.js examples — MIT. Source: <https://github.com/zeux/meshoptimizer/tree/v0.22>. License: `dist/vendor/three/addons/libs/meshopt-LICENSE.md`.
- **Draco decoder**, distributed in Three.js examples — Apache 2.0. Source: <https://github.com/google/draco>. See `dist/vendor/three/addons/libs/draco/LICENSE`.

Upstream modules were fetched from the public npm CDN at pinned versions. They are served locally; users' model files are not sent to these projects or services.

## Reference experiment

The local comparison ran RasputinKaiser/threejs-water-sim at commit `6f66040d77070cbcef701b4b02874fa5c4772e21`. Its custom source is not bundled or copied into this deliverable. The common MarchingCubes component is distributed under the Three.js MIT license above. Water Lab independently implements its density field, reconstruction acceleration and moving-mesh interactions.

0.5 增加的 OBJLoader、MTLLoader、STLLoader、PLYLoader 均为 Three.js 0.180.0 官方 addons，适用已有的 Three.js MIT 许可。测试模型和 checker 贴图由本项目程序生成。
