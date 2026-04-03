# 赛博朋克城市飞行器 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个使用 Three.js 的 3D 赛博朋克城市飞行探索游戏，玩家使用键盘方向键操控霓虹飞行器收集能量球。

**Architecture:** 单 HTML 文件架构，所有 CSS/JS 内联。Three.js 通过 CDN 引入。模块化 JavaScript 类结构：SceneManager、CityGenerator、PlayerController、CollectibleManager、ParticleSystem、UIManager。游戏循环使用 requestAnimationFrame，输入处理使用键盘事件监听。

**Tech Stack:** Three.js (r150+), Vanilla JavaScript (ES6+), HTML5, CSS3

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `index.html` | 主入口文件，包含所有 HTML/CSS/JavaScript |
| `README.md` | 项目说明和运行指南 |

---

### Task 1: HTML 基础结构和 Three.js 引入

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city/index.html`

- [ ] **Step 1: 创建 HTML 基础结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>赛博朋克城市飞行器</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            overflow: hidden;
            background-color: #0a0a0f;
            font-family: 'Courier New', monospace;
        }
        
        #canvas-container {
            width: 100vw;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
        }
        
        #ui-layer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        }
        
        #score-display {
            position: absolute;
            top: 20px;
            left: 20px;
            color: #00f3ff;
            font-size: 24px;
            text-shadow: 0 0 10px #00f3ff;
        }
        
        #controls-hint {
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(0, 243, 255, 0.3);
        }
        
        #controls-hint h3 {
            color: #ff00aa;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        #controls-hint p {
            margin: 4px 0;
        }
        
        .key {
            display: inline-block;
            background: rgba(0, 243, 255, 0.2);
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #00f3ff;
            margin: 0 2px;
        }
        
        #collect-feedback {
            position: absolute;
            color: #ff00aa;
            font-size: 20px;
            text-shadow: 0 0 10px #ff00aa;
            opacity: 0;
            transition: opacity 0.3s;
        }
    </style>
</head>
<body>
    <div id="canvas-container"></div>
    
    <div id="ui-layer">
        <div id="score-display">能量球：<span id="score">0</span></div>
        <div id="controls-hint">
            <h3>操控说明</h3>
            <p><span class="key">↑</span> 向前飞行</p>
            <p><span class="key">↓</span> 向后飞行</p>
            <p><span class="key">←</span> 向左平移</p>
            <p><span class="key">→</span> 向右平移</p>
            <p><span class="key">Shift</span> 加速</p>
        </div>
        <div id="collect-feedback">+1</div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r150/three.min.js"></script>
    <script>
        // 游戏代码将在这里编写
    </script>
</body>
</html>
```

- [ ] **Step 2: 验证 HTML 文件可打开**

在浏览器中打开 `index.html`，应该看到黑色背景和 UI 元素（分数显示和操控说明）。

- [ ] **Step 3: 提交**

```bash
cd /Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city
git add index.html
git commit -m "feat: add HTML base structure with UI layer"
```

---

### Task 2: SceneManager - 场景初始化

**Files:**
- Modify: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city/index.html:55-56`

- [ ] **Step 1: 添加 SceneManager 类**

在 `<script>` 标签内添加：

```javascript
// ==================== SCENE MANAGER ====================
class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.init();
    }
    
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);
        this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.015);
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 添加到 DOM
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);
        
        // 添加灯光
        this.addLights();
        
        // 窗口大小调整
        window.addEventListener('resize', () => this.onResize());
    }
    
    addLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // 主方向光（模拟月光）
        const directionalLight = new THREE.DirectionalLight(0xaaccff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // 青色补光
        const cyanLight = new THREE.PointLight(0x00f3ff, 0.5, 100);
        cyanLight.position.set(-30, 20, -30);
        this.scene.add(cyanLight);
        
        // 粉色补光
        const pinkLight = new THREE.PointLight(0xff00aa, 0.5, 100);
        pinkLight.position.set(30, 20, 30);
        this.scene.add(pinkLight);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
```

- [ ] **Step 2: 实例化 SceneManager**

在 script 标签末尾添加：

```javascript
// ==================== GAME INITIALIZATION ====================
const sceneManager = new SceneManager();
```

- [ ] **Step 3: 验证场景渲染**

刷新浏览器，应该看到深色背景带雾效。打开控制台检查是否有 Three.js 错误。

- [ ] **Step 4: 提交**

```bash
git add index.html
git commit -m "feat: add SceneManager with lighting and fog"
```

---

### Task 3: CityGenerator - 程序化生成城市建筑

**Files:**
- Modify: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city/index.html`

- [ ] **Step 1: 添加 CityGenerator 类**

在 SceneManager 类之后添加：

```javascript
// ==================== CITY GENERATOR ====================
class CityGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.citySize = 200;
        this.buildingCount = 12;
        this.generate();
    }
    
    generate() {
        // 创建地面
        this.createGround();
        
        // 生成建筑
        for (let i = 0; i < this.buildingCount; i++) {
            this.createBuilding();
        }
    }
    
    createGround() {
        // 地面网格
        const gridHelper = new THREE.GridHelper(this.citySize, 40, 0x00f3ff, 0x1a1a2e);
        gridHelper.position.y = 0.1;
        this.scene.add(gridHelper);
        
        // 地面平面
        const planeGeometry = new THREE.PlaneGeometry(this.citySize, this.citySize);
        const planeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0d0d12,
            roughness: 0.8,
            metalness: 0.2
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }
    
    createBuilding() {
        // 随机位置（避免中心区域）
        let x, z;
        do {
            x = (Math.random() - 0.5) * (this.citySize - 20);
            z = (Math.random() - 0.5) * (this.citySize - 20);
        } while (Math.abs(x) < 15 && Math.abs(z) < 15); // 留出中心飞行区域
        
        // 随机尺寸
        const width = 5 + Math.random() * 8;
        const depth = 5 + Math.random() * 8;
        const height = 20 + Math.random() * 60;
        
        // 建筑主体
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.7,
            metalness: 0.3
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.buildings.push(building);
        
        // 添加霓虹边缘装饰
        this.addNeonEdges(building, width, height, depth);
        
        // 添加发光窗户
        this.addWindows(building, width, height, depth);
    }
    
    addNeonEdges(building, width, height, depth) {
        const edges = new THREE.EdgesGeometry(building.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: Math.random() > 0.5 ? 0x00f3ff : 0xff00aa,
            linewidth: 2
        });
        const edgeLines = new THREE.LineSegments(edges, lineMaterial);
        edgeLines.position.copy(building.position);
        this.scene.add(edgeLines);
    }
    
    addWindows(building, width, height, depth) {
        const windowCount = Math.floor(Math.random() * 20) + 10;
        const windowGeometry = new THREE.PlaneGeometry(0.5, 0.8);
        
        for (let i = 0; i < windowCount; i++) {
            const windowMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.7 ? 0xffff00 : 0x00ffff,
                transparent: true,
                opacity: 0.8
            });
            const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
            
            // 随机分配到四个面
            const face = Math.floor(Math.random() * 4);
            const offsetX = (Math.random() - 0.5) * (width - 1);
            const offsetY = (Math.random() - 0.5) * (height - 2);
            const offsetZ = (Math.random() - 0.5) * (depth - 1);
            
            switch(face) {
                case 0: // 前面
                    windowMesh.position.set(building.position.x + offsetX, building.position.y + offsetY, building.position.z + depth/2 + 0.01);
                    break;
                case 1: // 后面
                    windowMesh.position.set(building.position.x + offsetX, building.position.y + offsetY, building.position.z - depth/2 - 0.01);
                    windowMesh.rotation.y = Math.PI;
                    break;
                case 2: // 左面
                    windowMesh.position.set(building.position.x - width/2 - 0.01, building.position.y + offsetY, building.position.z + offsetZ);
                    windowMesh.rotation.y = Math.PI / 2;
                    break;
                case 3: // 右面
                    windowMesh.position.set(building.position.x + width/2 + 0.01, building.position.y + offsetY, building.position.z + offsetZ);
                    windowMesh.rotation.y = -Math.PI / 2;
                    break;
            }
            
            this.scene.add(windowMesh);
        }
    }
}
```

- [ ] **Step 2: 实例化 CityGenerator**

修改游戏初始化部分：

```javascript
const sceneManager = new SceneManager();
const cityGenerator = new CityGenerator(sceneManager.scene);
```

- [ ] **Step 3: 验证城市生成**

刷新浏览器，应该看到地面网格和随机分布的建筑，带有霓虹边缘和发光窗户。

- [ ] **Step 4: 提交**

```bash
git add index.html
git commit -m "feat: add CityGenerator with procedural buildings"
```

---

### Task 4: PlayerController - 飞行器操控

**Files:**
- Modify: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city/index.html`

- [ ] **Step 1: 添加 PlayerController 类**

在 CityGenerator 类之后添加：

```javascript
// ==================== PLAYER CONTROLLER ====================
class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.player = null;
        this.velocity = new THREE.Vector3();
        this.speed = 0.3;
        this.acceleration = 0.02;
        this.friction = 0.95;
        this.maxSpeed = 0.8;
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shift: false
        };
        this.createPlayer();
        this.setupInput();
    }
    
    createPlayer() {
        // 飞行器主体 - 三角翼造型
        const group = new THREE.Group();
        
        // 机身
        const bodyGeometry = new THREE.ConeGeometry(0.5, 3, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.3,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        group.add(body);
        
        // 霓虹轮廓线
        const edgesGeometry = new THREE.EdgesGeometry(bodyGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00f3ff });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.rotation.x = Math.PI / 2;
        group.add(edges);
        
        // 左翼
        const leftWingGeometry = new THREE.BufferGeometry();
        const leftWingVertices = new Float32Array([
            0, 0, 0,
            -2, 0, 1,
            -2, 0, -0.5
        ]);
        leftWingGeometry.setAttribute('position', new THREE.BufferAttribute(leftWingVertices, 3));
        const leftWingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00f3ff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const leftWing = new THREE.Mesh(leftWingGeometry, leftWingMaterial);
        group.add(leftWing);
        
        // 右翼
        const rightWingGeometry = new THREE.BufferGeometry();
        const rightWingVertices = new Float32Array([
            0, 0, 0,
            2, 0, 1,
            2, 0, -0.5
        ]);
        rightWingGeometry.setAttribute('position', new THREE.BufferAttribute(rightWingVertices, 3));
        const rightWing = new THREE.Mesh(rightWingGeometry, leftWingMaterial);
        group.add(rightWing);
        
        // 尾焰粒子发射器占位
        group.userData.thrusterGroup = new THREE.Group();
        group.add(group.userData.thrusterGroup);
        
        this.player = group;
        this.player.position.set(0, 5, 0);
        this.scene.add(this.player);
        
        // 添加点光源跟随飞行器
        const playerLight = new THREE.PointLight(0x00f3ff, 1, 20);
        playerLight.position.set(0, 1, 0);
        this.player.add(playerLight);
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowUp': this.keys.up = true; break;
                case 'ArrowDown': this.keys.down = true; break;
                case 'ArrowLeft': this.keys.left = true; break;
                case 'ArrowRight': this.keys.right = true; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.keys.shift = true; break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowUp': this.keys.up = false; break;
                case 'ArrowDown': this.keys.down = false; break;
                case 'ArrowLeft': this.keys.left = false; break;
                case 'ArrowRight': this.keys.right = false; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.keys.shift = false; break;
            }
        });
    }
    
    update() {
        if (!this.player) return;
        
        const currentSpeed = this.keys.shift ? this.maxSpeed : this.maxSpeed * 0.5;
        
        // 计算加速度
        if (this.keys.up) this.velocity.z -= this.acceleration;
        if (this.keys.down) this.velocity.z += this.acceleration;
        if (this.keys.left) this.velocity.x -= this.acceleration;
        if (this.keys.right) this.velocity.x += this.acceleration;
        
        // 应用摩擦力
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;
        
        // 限制最大速度
        this.velocity.x = Math.max(-currentSpeed, Math.min(currentSpeed, this.velocity.x));
        this.velocity.z = Math.max(-currentSpeed, Math.min(currentSpeed, this.velocity.z));
        
        // 更新位置
        this.player.position.x += this.velocity.x;
        this.player.position.z += this.velocity.z;
        
        // 边界限制
        const boundary = 90;
        this.player.position.x = Math.max(-boundary, Math.min(boundary, this.player.position.x));
        this.player.position.z = Math.max(-boundary, Math.min(boundary, this.player.position.z));
        
        // 倾斜效果
        this.player.rotation.z = -this.velocity.x * 0.5;
        this.player.rotation.x = this.velocity.z * 0.3;
        
        // 更新尾焰
        this.updateThruster();
    }
    
    updateThruster() {
        if (!this.player.userData.thrusterGroup) return;
        
        // 简单的尾焰效果
        const thrusterGroup = this.player.userData.thrusterGroup;
        
        // 清除旧的
        while(thrusterGroup.children.length > 0) {
            thrusterGroup.remove(thrusterGroup.children[0]);
        }
        
        // 如果有移动，添加尾焰
        if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01) {
            const particleCount = 5;
            for (let i = 0; i < particleCount; i++) {
                const particleGeometry = new THREE.CircleGeometry(0.1 + Math.random() * 0.1, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({
                    color: this.keys.shift ? 0xff00aa : 0x00f3ff,
                    transparent: true,
                    opacity: 0.6 - i * 0.1
                });
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.set(0, 0, 1.5 + i * 0.3);
                particle.scale.setScalar(1 - i * 0.15);
                thrusterGroup.add(particle);
            }
        }
    }
    
    getPosition() {
        return this.player ? this.player.position.clone() : new THREE.Vector3(0, 5, 0);
    }
}
```

- [ ] **Step 2: 实例化 PlayerController**

修改游戏初始化部分：

```javascript
const sceneManager = new SceneManager();
const cityGenerator = new CityGenerator(sceneManager.scene);
const playerController = new PlayerController(sceneManager.scene);
```

- [ ] **Step 3: 添加游戏循环**

在 script 末尾添加：

```javascript
// ==================== GAME LOOP ====================
function animate() {
    requestAnimationFrame(animate);
    
    playerController.update();
    
    // 相机跟随
    const playerPos = playerController.getPosition();
    const cameraTarget = new THREE.Vector3(
        playerPos.x * 0.3,
        playerPos.y + 8,
        playerPos.z + 15
    );
    sceneManager.camera.position.lerp(cameraTarget, 0.05);
    sceneManager.camera.lookAt(playerPos);
    
    sceneManager.render();
}

animate();
```

- [ ] **Step 4: 验证操控**

刷新浏览器，使用方向键应该能控制飞行器移动，相机平滑跟随。

- [ ] **Step 5: 提交**

```bash
git add index.html
git commit -m "feat: add PlayerController with keyboard controls"
```

---

### Task 5: CollectibleManager - 能量球系统

**Files:**
- Modify: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city/index.html`

- [ ] **Step 1: 添加 CollectibleManager 类**

在 PlayerController 类之后添加：

```javascript
// ==================== COLLECTIBLE MANAGER ====================
class CollectibleManager {
    constructor(scene, playerController) {
        this.scene = scene;
        this.playerController = playerController;
        this.collectibles = [];
        this.score = 0;
        this.collectibleCount = 20;
        this.init();
    }
    
    init() {
        for (let i = 0; i < this.collectibleCount; i++) {
            this.spawnCollectible();
        }
    }
    
    spawnCollectible(position = null) {
        // 能量球组
        const group = new THREE.Group();
        
        // 球体
        const geometry = new THREE.SphereGeometry(0.8, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xffd700 : 0x00f3ff,
            transparent: true,
            opacity: 0.9
        });
        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);
        
        // 发光外壳
        const outerGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: material.color,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
        group.add(outerSphere);
        
        // 内部粒子
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.5;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            );
            group.add(particle);
        }
        
        // 随机位置
        if (position) {
            group.position.copy(position);
        } else {
            group.position.set(
                (Math.random() - 0.5) * 160,
                2 + Math.random() * 20,
                (Math.random() - 0.5) * 160
            );
        }
        
        // 存储引用用于动画
        group.userData.outerSphere = outerSphere;
        group.userData.particles = [];
        for (let i = 8; i < group.children.length; i++) {
            group.userData.particles.push(group.children[i]);
        }
        
        this.scene.add(group);
        this.collectibles.push(group);
    }
    
    update(time) {
        const playerPos = this.playerController.getPosition();
        
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            
            // 旋转动画
            collectible.rotation.y += 0.02;
            collectible.rotation.z = Math.sin(time * 0.002 + i) * 0.2;
            
            // 外壳脉动
            if (collectible.userData.outerSphere) {
                const scale = 1 + Math.sin(time * 0.003 + i) * 0.1;
                collectible.userData.outerSphere.scale.setScalar(scale);
            }
            
            // 内部粒子旋转
            if (collectible.userData.particles) {
                collectible.userData.particles.forEach((particle, idx) => {
                    const angle = time * 0.002 + (idx / collectible.userData.particles.length) * Math.PI * 2;
                    particle.position.x = Math.cos(angle) * 0.5;
                    particle.position.y = Math.sin(angle) * 0.5;
                });
            }
            
            // 碰撞检测
            const distance = collectible.position.distanceTo(playerPos);
            if (distance < 2.5) {
                this.collect(collectible, i);
            }
        }
    }
    
    collect(collectible, index) {
        // 移除
        this.scene.remove(collectible);
        this.collectibles.splice(index, 1);
        
        // 更新分数
        this.score++;
        document.getElementById('score').textContent = this.score;
        
        // 显示反馈
        this.showFeedback(collectible.position);
        
        // 重新生成
        setTimeout(() => this.spawnCollectible(), 2000);
    }
    
    showFeedback(position) {
        const feedback = document.getElementById('collect-feedback');
        feedback.style.left = '50%';
        feedback.style.top = '40%';
        feedback.style.opacity = '1';
        feedback.textContent = '+' + 1;
        
        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 500);
    }
}
```

- [ ] **Step 2: 实例化 CollectibleManager**

修改游戏初始化部分：

```javascript
const sceneManager = new SceneManager();
const cityGenerator = new CityGenerator(sceneManager.scene);
const playerController = new PlayerController(sceneManager.scene);
const collectibleManager = new CollectibleManager(sceneManager.scene, playerController);
```

- [ ] **Step 3: 更新游戏循环**

修改 animate 函数：

```javascript
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now();
    
    playerController.update();
    collectibleManager.update(time);
    
    // 相机跟随
    const playerPos = playerController.getPosition();
    const cameraTarget = new THREE.Vector3(
        playerPos.x * 0.3,
        playerPos.y + 8,
        playerPos.z + 15
    );
    sceneManager.camera.position.lerp(cameraTarget, 0.05);
    sceneManager.camera.lookAt(playerPos);
    
    sceneManager.render();
}
```

- [ ] **Step 4: 验证能量球**

刷新浏览器，应该看到漂浮的能量球，飞近时自动收集并增加分数。

- [ ] **Step 5: 提交**

```bash
git add index.html
git commit -m "feat: add CollectibleManager with energy orbs"
```

---

### Task 6: README 文档

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city/README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
# 赛博朋克城市飞行器 🌃

一个使用 Three.js 开发的 3D 赛博朋克风格飞行探索游戏。

## 🎮 游戏特色

- **自由飞行**: 在 3D 赛博朋克城市中自由穿梭
- **霓虹美学**: 青色/粉色霓虹配色，营造未来都市氛围
- **收集玩法**: 收集漂浮的能量球获得分数
- **流畅操控**: 键盘方向键控制，支持加速飞行

## 🚀 快速开始

### 方式一：直接打开

直接在浏览器中打开 `index.html` 文件即可游玩。

### 方式二：本地服务器

```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js http-server
npx http-server

# 然后访问 http://localhost:8000
```

##  操控说明

| 按键 | 功能 |
|------|------|
| ↑ | 向前飞行 |
| ↓ | 向后飞行 |
| ← | 向左平移 |
| → | 向右平移 |
| Shift | 加速飞行 |

## 🏙️ 技术栈

- **Three.js r150** - 3D 渲染引擎
- **Vanilla JavaScript** - 无框架依赖
- **单 HTML 文件** - 零构建工具，开箱即用

## 📁 项目结构

```
cyble-city/
── index.html              # 主游戏文件
├── README.md               # 本文档
├── city-show.png           # 参考设计图
└── docs/
    ├── superpowers/
    │   ├── specs/          # 设计文档
    │   └── plans/          # 实施计划
    └── ...
```

## 🎨 设计理念

本项目采用模块化类结构设计：

- **SceneManager**: 管理 Three.js 场景、相机、渲染器和灯光
- **CityGenerator**: 程序化生成赛博朋克风格的城市建筑
- **PlayerController**: 处理玩家输入和飞行器运动物理
- **CollectibleManager**: 管理能量球的生成、动画和收集逻辑

## 📝 开发笔记

- 使用 FogExp2 增强深度感，遮挡远处建筑
- 飞行器尾焰使用动态粒子效果
- 能量球包含多层几何体和旋转粒子动画
- 相机使用 LERP 插值实现平滑跟随

## 🔄 未来扩展

- [ ] 音效系统
- [ ] 更多能量球类型
- [ ] 成就系统
- [ ] 拍照模式
- [ ] 昼夜循环

## 📄 许可证

MIT License
```

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: add README with game documentation"
```

---

## 自审查清单

**1. 规格覆盖检查：**

| 规格要求 | 对应任务 |
|----------|----------|
| Three.js 3D 渲染 | Task 2 |
| 10-15 栋建筑 | Task 3 (buildingCount = 12) |
| 霓虹配色（青/粉/紫） | Task 2, Task 3 |
| 方向键操控 | Task 4 |
| Shift 加速 | Task 4 |
| 收集能量球 | Task 5 |
| 分数显示 UI | Task 1, Task 5 |
| 单人探索模式 | 全部任务 |

**2. 占位符检查：** 无 "TBD"、"TODO" 或模糊描述 ✓

**3. 类型一致性检查：**
- `sceneManager.scene` 在所有类中一致使用 ✓
- `playerController.getPosition()` 返回 `Vector3` ✓
- 所有类名和方法名保持一致 ✓

**4. 代码完整性：** 每个步骤都包含完整代码，可直接复制使用 ✓

---

计划完成并保存到：`docs/superpowers/plans/2026-04-02-cyberpunk-city-game.md`

两种执行选项：

**1. Subagent-Driven（推荐）** - 我为每个任务分派一个新的子代理，任务之间进行审查，快速迭代

**2. Inline Execution** - 在此会话中使用 executing-plans 执行任务，批量执行并设置检查点进行审查

选择哪种方式？
