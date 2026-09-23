# WaterLab

### About the project

WaterLab is a browser-based experiment exploring water, movement, and 3D forms. Import a model, pour water from a movable outlet, and rotate the object to watch water collect, move, and spill. It was developed as an interactive-art coursework prototype with the help of AI coding agents.

The interface uses a low-brightness black-and-gray palette. Imported models retain their own materials or vertex colors. An English / Chinese switch is available in the webpage.

### Features

- Start and stop pouring; adjust flow, outlet height, and horizontal position.
- Rotate the model with momentum, or orbit the camera separately.
- Explore built-in vessel and room scenes, or import your own mesh.
- Import **GLB, GLTF, OBJ + MTL, STL, and PLY meshes**. Select companion files together or import their folder to preserve texture paths.
- Switch between a continuous water surface and a particle comparison view; clear the water or return the model upright.

Model files are processed locally in the browser. WaterLab imports existing meshes; it does not perform 3D scanning or AI reconstruction. Water retention depends on the geometry: missing bottoms, walls, or inner surfaces may leak. Point clouds and 3D Gaussian Splatting are not supported. The fluid simulation is an interactive approximation, not an engineering analysis tool.

### Download and run

1. Download this repository using **Code → Download ZIP**, or clone it.
2. Extract the download and open the project folder containing `server.mjs`.
3. With Node.js installed, double-click `Start Water Lab.cmd` on Windows. Alternatively, run `node server.mjs` from the project folder.
4. Open [http://127.0.0.1:4174/](http://127.0.0.1:4174/) in your browser.

Dependencies are bundled locally; no npm installation is required. Start the local server instead of opening `dist/index.html` directly.

### Repository contents

This private repository contains the **0.5 prototype source files**, including the webpage in `dist/`, bundled dependencies and licenses, models, test fixtures, 21 automated checks in `tests/`, local launch scripts, and technical comparisons. The original directory structure is preserved. The webpage has not been publicly deployed.

[WaterLab-v05.zip](./WaterLab-v05.zip) is retained as an earlier complete project snapshot; use the repository files for the current version.

Archive SHA-256: `dea6538a474b95d94426754ef81bfce9bb13b4bd42e92990a118d50531b6b754`

---

### 项目介绍

WaterLab（水实验）是一个在浏览器中探索水、运动与三维形态关系的互动实验。导入模型，从可移动的出水口倒水，再转动模型，观察水的积聚、晃动和流出。这个项目是在 AI 编程代理协助下完成的互动艺术课程原型。

界面采用低亮度的黑灰色系，导入的模型保留自身材质或顶点颜色。网页内提供中英文切换按钮。

### 功能

- 开始或停止倒水，调整流量、出水高度和出水口的水平位置。
- 带惯性地转动模型，或单独转动观察视角。
- 使用内置容器、房间场景，或导入自己的三维网格模型。
- 导入 **GLB、GLTF、OBJ + MTL、STL 和 PLY 网格**；可以同时选择配套文件，也可以导入文件夹以保留贴图路径。
- 切换连续水面与粒子对照显示，清空水，或让模型回正。

模型文件在浏览器本机处理。项目用于导入已有网格，不包含三维扫描或 AI 建模流程。能否储水取决于实际几何结构：缺少底部、墙面或内壁的模型可能漏水。暂不支持点云和 3D Gaussian Splatting。水模拟是面向互动体验的近似效果，不用于工程分析。

### 下载与运行

1. 点击仓库的 **Code → Download ZIP** 下载全部文件，或克隆仓库。
2. 解压后打开包含 `server.mjs` 的项目文件夹。
3. 安装 Node.js 后，在 Windows 中双击 `Start Water Lab.cmd`；也可以在项目文件夹运行 `node server.mjs`。
4. 在浏览器打开 [http://127.0.0.1:4174/](http://127.0.0.1:4174/)。

依赖已包含在本地文件中，不需要运行 npm 安装。请通过本地服务器打开，不要直接双击 `dist/index.html`。

### 仓库内容

这个私有仓库直接保存 **0.5 测试版的源码文件**，包括 `dist/` 中的网页、本地依赖及许可、模型、测试数据、`tests/` 中的 21 项自动检查、本地启动脚本和技术比较。原有目录结构完整保留，网页目前没有公开部署。

仓库中的 [WaterLab-v05.zip](./WaterLab-v05.zip) 保留为较早的完整项目快照；使用当前版本时，请下载仓库中的源码文件。

压缩包 SHA-256：`dea6538a474b95d94426754ef81bfce9bb13b4bd42e92990a118d50531b6b754`
