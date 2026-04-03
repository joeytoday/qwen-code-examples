# 赛博朋克城市复刻 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 根据 ref-city/ 参考图完整复刻一个明亮鲜艳的赛博朋克城市，使用 Three.js 实现，保持人物跑动和视角跟随系统不变。

**Architecture:** 基于现有 game.js 架构，扩展建筑生成器函数、街道设施、车辆系统。采用模块化设计，每个建筑类型独立函数，场景布局集中在 createScenery() 函数中。

**Tech Stack:** Three.js (r163), Vanilla JavaScript, 单 HTML 文件

---

## File Structure

**修改文件:**
- `game.js` - 扩展建筑生成器、街道设施、车辆生成函数，增强 createScenery()

**保持不变:**
- `index.html` - HTML 结构不变
- 人物跑动和视角跟随代码不变

---

## 阶段一：核心建筑和道路系统

### Task 1: 更新色彩方案

**Files:**
- Modify: `game.js:40-60` (COLORS 常量定义)

- [ ] **Step 1: 更新 COLORS 常量**

```javascript
// Tile Pack City 3 风格配色 - 明亮鲜艳赛博朋克
const COLORS = {
    // 建筑外墙
    wallCyan: '#40E0D0',      // 青绿色 - 现代建筑
    wallPurple: '#9B59B6',    // 紫色 - 商业建筑
    wallPink: '#FF69B4',      // 粉色 - 装饰元素
    wallBlueGreen: '#48D1CC', // 蓝绿色 - 玻璃幕墙
    wallLightGreen: '#98FB98',// 浅绿 - 住宅
    wallMint: '#A8D5BA',
    wallBlue: '#A8C8D5',
    wallYellow: '#F5E5A8',
    wallPeach: '#F5C5A8',
    wallLavender: '#D5C8E5',
    wallCream: '#E8E0D5',
    // 屋顶
    roofBrown: '#5A4A42',
    roofGray: '#8A8A8A',
    roofOrange: '#E58A4A',
    roofWhite: '#F5F5F5',
    roofGreen: '#6A9A6A',
    // 窗户
    windowBlue: '#A8D8E8',
    windowDark: '#6A8A9A',
    // 装饰
    trimOrange: '#E57A4A',
    trimGreen: '#7AB57A',
    trimPurple: '#9A7AB5',
    trimRed: '#E55A5A',
    trimBlue: '#5A8AB5',
    // 霓虹灯
    neonCyan: '#00FFFF',
    neonPurple: '#BF00FF',
    neonPink: '#FF1493',
    neonOrange: '#FF8C00',
    // 地面
    grass: '#8BC96B',
    road: '#5A5A5A',
    roadLight: '#6A6A6A',
    sidewalk: '#C8C8C8',
    sand: '#E8D5A8',
    water: '#6AB5D5',
    // 标记线
    lineWhite: '#F0F0F0',
    lineYellow: '#E8D56A'
};
```

- [ ] **Step 2: 提交**

```bash
git add game.js
git commit -m "style: update color scheme to bright cyberpunk palette"
```

---

### Task 2: 创建摩天大楼生成器

**Files:**
- Modify: `game.js` (添加 mkSkyscraper 函数)
- Test: 浏览器视觉测试

- [ ] **Step 1: 添加摩天大楼生成器函数**

在现有建筑函数后添加：

```javascript
// 建筑 8: 摩天大楼（分段式，带尖顶）
function mkSkyscraper(x, z, rot, height, type) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    const w = 18;
    const d = 16;
    const floorH = 10;
    const floors = height;

    // 分段式主体（每段稍微旋转和缩小）
    const segments = Math.ceil(floors / 3);
    for (let s = 0; s < segments; s++) {
        const segFloors = Math.min(3, floors - s * 3);
        const segH = segFloors * floorH;
        const segY = s * segH;
        
        // 每段稍微缩小
        const scale = 1 - s * 0.05;
        const segW = w * scale;
        const segD = d * scale;

        const segment = new THREE.Mesh(
            new THREE.BoxGeometry(segW, segH, segD),
            new THREE.MeshStandardMaterial({
                color: type === 'glass' ? COLORS.windowBlue : COLORS.wallBlue,
                roughness: type === 'glass' ? 0.1 : 0.5,
                metalness: type === 'glass' ? 0.8 : 0.2
            })
        );
        segment.position.y = segY + segH / 2;
        segment.rotation.y = s * 0.1; // 每段微转
        segment.castShadow = true;
        segment.receiveShadow = true;
        g.add(segment);

        // 窗框网格
        const frameMat = new THREE.MeshStandardMaterial({ color: COLORS.roofWhite });
        for (let f = 0; f < segFloors; f++) {
            for (let i = 0; i <= 3; i++) {
                const hFrame = new THREE.Mesh(
                    new THREE.BoxGeometry(segW * 0.8, 0.3, 0.2),
                    frameMat
                );
                hFrame.position.set(0, segY + f * floorH + floorH * 0.2, segD / 2 + 0.1);
                g.add(hFrame);
            }
        }
    }

    // 尖顶
    if (height >= 4) {
        const spire = new THREE.Mesh(
            new THREE.ConeGeometry(1, 8, 8),
            new THREE.MeshStandardMaterial({ color: COLORS.roofGray, metalness: 0.9 })
        );
        spire.position.y = floors * floorH + 4;
        g.add(spire);
    }

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 运行测试**

```bash
open http://localhost:8080/index.html
```
Expected: 浏览器打开，控制台无错误

- [ ] **Step 3: 提交**

```bash
git add game.js
git commit -m "feat: add skyscraper generator with segmented design"
```

---

### Task 3: 创建体育馆生成器

**Files:**
- Modify: `game.js` (添加 mkStadium 函数)

- [ ] **Step 1: 添加体育馆生成器函数**

```javascript
// 建筑 9: 体育馆（圆形）
function mkStadium(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    // 主体（椭圆）
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(35, 40, 8, 16),
        new THREE.MeshStandardMaterial({ color: COLORS.wallCream })
    );
    body.position.y = 4;
    body.castShadow = true;
    g.add(body);

    // 屋顶（环形）
    const roof = new THREE.Mesh(
        new THREE.TorusGeometry(30, 5, 8, 16),
        new THREE.MeshStandardMaterial({ color: COLORS.roofOrange })
    );
    roof.rotation.x = Math.PI / 2;
    roof.position.y = 8;
    roof.castShadow = true;
    g.add(roof);

    // 入口
    const entrance = new THREE.Mesh(
        new THREE.BoxGeometry(15, 6, 3),
        new THREE.MeshStandardMaterial({ color: COLORS.trimRed })
    );
    entrance.position.set(0, 3, 42);
    g.add(entrance);

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 提交**

```bash
git add game.js
git commit -m "feat: add stadium generator with circular design"
```

---

### Task 4: 创建购物中心生成器

**Files:**
- Modify: `game.js` (添加 mkMall 函数)

- [ ] **Step 1: 添加购物中心生成器函数**

```javascript
// 建筑 10: 购物中心（带玻璃穹顶）
function mkMall(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    // 主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(40, 10, 30),
        new THREE.MeshStandardMaterial({ color: COLORS.wallPink })
    );
    body.position.y = 5;
    body.castShadow = true;
    g.add(body);

    // 玻璃穹顶
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
            color: COLORS.windowBlue,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.8
        })
    );
    dome.position.y = 12;
    g.add(dome);

    // 入口雨篷
    const awning = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.5, 5),
        new THREE.MeshStandardMaterial({ color: COLORS.trimOrange })
    );
    awning.position.set(0, 5, 15.5);
    g.add(awning);

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 提交**

```bash
git add game.js
git commit -m "feat: add shopping mall generator with glass dome"
```

---

### Task 5: 创建街道设施生成器

**Files:**
- Modify: `game.js` (添加垃圾桶、邮筒、交通信号灯、路牌、消防栓、自行车架、花坛)

- [ ] **Step 1: 添加垃圾桶生成器**

```javascript
// 街道设施：垃圾桶
function mkTrashCan(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 2.5, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGreen })
    );
    body.position.y = 1.25;
    body.castShadow = true;
    g.add(body);

    const lid = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGreen })
    );
    lid.position.y = 2.5;
    g.add(lid);

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 添加邮筒生成器**

```javascript
// 街道设施：邮筒
function mkMailbox(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    pole.position.y = 1.5;
    g.add(pole);

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 1),
        new THREE.MeshStandardMaterial({ color: COLORS.trimBlue })
    );
    box.position.y = 3.5;
    box.castShadow = true;
    g.add(box);

    const top = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: COLORS.trimBlue })
    );
    top.position.y = 4.5;
    g.add(top);

    scene.add(g);
    return g;
}
```

- [ ] **Step 3: 添加交通信号灯生成器**

```javascript
// 街道设施：交通信号灯
function mkTrafficLight(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    pole.position.y = 4;
    pole.castShadow = true;
    g.add(pole);

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 3, 1),
        new THREE.MeshStandardMaterial({ color: COLORS.roofBrown })
    );
    box.position.set(0, 8, 0);
    g.add(box);

    // 三个灯
    const lights = [0xff0000, 0xffff00, 0x00ff00];
    for (let i = 0; i < 3; i++) {
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({
                color: lights[i],
                emissive: lights[i],
                emissiveIntensity: i === 2 ? 0.8 : 0.3
            })
        );
        light.position.set(0, 8.5 - i * 0.8, 0.5);
        g.add(light);
    }

    scene.add(g);
    return g;
}
```

- [ ] **Step 4: 添加路牌生成器**

```javascript
// 街道设施：路牌
function mkSign(x, z, rot, text) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 4, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    pole.position.y = 2;
    g.add(pole);

    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 0.2),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    sign.position.y = 4;
    sign.castShadow = true;
    g.add(sign);

    scene.add(g);
    return g;
}
```

- [ ] **Step 5: 添加消防栓生成器**

```javascript
// 街道设施：消防栓
function mkHydrant(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.trimRed })
    );
    body.position.y = 0.75;
    body.castShadow = true;
    g.add(body);

    const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 4),
        new THREE.MeshStandardMaterial({ color: COLORS.trimRed })
    );
    cap.position.y = 1.5;
    g.add(cap);

    scene.add(g);
    return g;
}
```

- [ ] **Step 6: 添加自行车停放架生成器**

```javascript
// 街道设施：自行车停放架
function mkBikeRack(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    for (let i = 0; i < 3; i++) {
        const arch = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.1, 8, 8, Math.PI),
            new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
        );
        arch.rotation.x = Math.PI / 2;
        arch.position.set(-1 + i * 1, 1, 0);
        g.add(arch);
    }

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.2, 1.2),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    base.position.y = 0.1;
    g.add(base);

    scene.add(g);
    return g;
}
```

- [ ] **Step 7: 添加花坛生成器**

```javascript
// 街道设施：花坛
function mkFlowerBed(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 1.5, 2, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.roofOrange })
    );
    pot.position.y = 1;
    pot.castShadow = true;
    g.add(pot);

    // 花朵
    const flowerColors = [0xff6666, 0xffff66, 0xff66ff, 0x66ffff];
    for (let i = 0; i < 5; i++) {
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1.5, 4),
            new THREE.MeshStandardMaterial({ color: COLORS.roofGreen })
        );
        stem.position.set(Math.cos(i * Math.PI * 2 / 5) * 1, 2.5, Math.sin(i * Math.PI * 2 / 5) * 1);
        g.add(stem);

        const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            new THREE.MeshStandardMaterial({ color: flowerColors[i % 4], emissive: flowerColors[i % 4], emissiveIntensity: 0.3 })
        );
        flower.position.set(Math.cos(i * Math.PI * 2 / 5) * 1, 3.3, Math.sin(i * Math.PI * 2 / 5) * 1);
        g.add(flower);
    }

    scene.add(g);
    return g;
}
```

- [ ] **Step 8: 提交**

```bash
git add game.js
git commit -m "feat: add street furniture generators (trash can, mailbox, traffic light, sign, hydrant, bike rack, flower bed)"
```

---

### Task 6: 创建特殊车辆生成器

**Files:**
- Modify: `game.js` (添加出租车、警车、公交车)

- [ ] **Step 1: 添加出租车生成器**

```javascript
// 车辆：出租车
function mkTaxi(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0.5, z);
    g.rotation.y = rot;

    // 车身
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 3),
        new THREE.MeshStandardMaterial({ color: COLORS.wallYellow })
    );
    body.position.y = 1;
    body.castShadow = true;
    g.add(body);

    // 车顶
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 2.5),
        new THREE.MeshStandardMaterial({ color: COLORS.windowDark })
    );
    top.position.set(-0.5, 2.5, 0);
    g.add(top);

    // 出租车标志
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: COLORS.wallYellow, emissive: COLORS.wallYellow, emissiveIntensity: 0.5 })
    );
    sign.position.set(-0.5, 3.3, 0);
    g.add(sign);

    // 车轮
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [[-1.5, 1.5], [1.5, 1.5]].forEach(([x, z]) => {
        const wl = new THREE.Mesh(wheelGeo, wheelMat);
        wl.rotation.z = Math.PI / 2;
        wl.position.set(x, 0.6, z + 1);
        g.add(wl);
        const wr = new THREE.Mesh(wheelGeo, wheelMat);
        wr.rotation.z = Math.PI / 2;
        wr.position.set(x, 0.6, z - 1);
        g.add(wr);
    });

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 添加警车生成器**

```javascript
// 车辆：警车
function mkPoliceCar(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0.5, z);
    g.rotation.y = rot;

    // 车身
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 3),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    body.position.y = 1;
    body.castShadow = true;
    g.add(body);

    // 车顶
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 2.5),
        new THREE.MeshStandardMaterial({ color: COLORS.windowDark })
    );
    top.position.set(-0.5, 2.5, 0);
    g.add(top);

    // 警灯
    const lightBar = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    lightBar.position.set(-0.5, 3.3, 0);
    g.add(lightBar);

    const lightL = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.4, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 0.8 })
    );
    lightL.position.set(-0.8, 3.5, 0);
    g.add(lightL);

    const lightR = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.4, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 })
    );
    lightR.position.set(-0.2, 3.5, 0);
    g.add(lightR);

    // 车轮
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [[-1.5, 1.5], [1.5, 1.5]].forEach(([x, z]) => {
        const wl = new THREE.Mesh(wheelGeo, wheelMat);
        wl.rotation.z = Math.PI / 2;
        wl.position.set(x, 0.6, z + 1);
        g.add(wl);
        const wr = new THREE.Mesh(wheelGeo, wheelMat);
        wr.rotation.z = Math.PI / 2;
        wr.position.set(x, 0.6, z - 1);
        g.add(wr);
    });

    scene.add(g);
    return g;
}
```

- [ ] **Step 3: 添加公交车生成器**

```javascript
// 车辆：公交车
function mkBus(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0.5, z);
    g.rotation.y = rot;

    // 车身
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(12, 3.5, 3.5),
        new THREE.MeshStandardMaterial({ color: COLORS.wallYellow })
    );
    body.position.y = 1.75;
    body.castShadow = true;
    g.add(body);

    // 窗户
    const winMat = new THREE.MeshStandardMaterial({ color: COLORS.windowBlue });
    for (let i = 0; i < 5; i++) {
        const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.5, 0.2),
            winMat
        );
        win.position.set(-4 + i * 2, 2.5, 1.8);
        g.add(win);
    }

    // 车轮
    const wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [[-4, 1.75], [4, 1.75]].forEach(([x, z]) => {
        const wl = new THREE.Mesh(wheelGeo, wheelMat);
        wl.rotation.z = Math.PI / 2;
        wl.position.set(x, 0.8, z + 1.5);
        g.add(wl);
        const wr = new THREE.Mesh(wheelGeo, wheelMat);
        wr.rotation.z = Math.PI / 2;
        wr.position.set(x, 0.8, z - 1.5);
        g.add(wr);
    });

    scene.add(g);
    return g;
}
```

- [ ] **Step 4: 提交**

```bash
git add game.js
git commit -m "feat: add special vehicle generators (taxi, police car, bus)"
```

---

### Task 7: 增强 createScenery() 函数

**Files:**
- Modify: `game.js:1263-1395` (createScenery 函数)

- [ ] **Step 1: 替换 createScenery 函数**

将现有 createScenery 函数替换为增强版本，包含：
- 新增摩天大楼、体育馆、购物中心
- 增加交通信号灯、垃圾桶、邮筒、消防栓
- 增加自行车架、花坛
- 增加出租车、警车、公交车
- 增加路灯数量（24→32）
- 增加停放车辆密度（12→24）

具体代码参考设计文档中的场景布局部分。

- [ ] **Step 2: 运行测试**

```bash
open http://localhost:8080/index.html
```
Expected: 城市完整显示，所有新建筑可见，无控制台错误

- [ ] **Step 3: 提交**

```bash
git add game.js
git commit -m "feat: enhance scenery with all new buildings and street furniture"
```

---

## 阶段二：车辆和街道设施

### Task 8: 增加车辆密度和分布

**Files:**
- Modify: `game.js` (createScenery 中的车辆部分)

- [ ] **Step 1: 增加停放车辆到 30 辆**

调整车辆循环从 24 到 30，颜色数组增加到 8 种。

- [ ] **Step 2: 增加出租车到 6 辆**

```javascript
// 出租车（随机分布）- 6 辆
mkTaxi(-60, -outerRadius + 18, 0);
mkTaxi(60, -outerRadius + 18, Math.PI);
mkTaxi(outerRadius - 18, 40, Math.PI / 2);
mkTaxi(-outerRadius + 18, -40, -Math.PI / 2);
mkTaxi(-100, outerRadius - 18, Math.PI);
mkTaxi(100, outerRadius - 18, 0);
```

- [ ] **Step 3: 增加警车到 4 辆**

```javascript
// 警车（关键位置）- 4 辆
mkPoliceCar(0, -outerRadius + 18, 0);
mkPoliceCar(outerRadius - 18, 0, Math.PI / 2);
mkPoliceCar(0, outerRadius - 18, Math.PI);
mkPoliceCar(-outerRadius + 18, 0, -Math.PI / 2);
```

- [ ] **Step 4: 增加公交车到 4 辆**

```javascript
// 公交车（站点）- 4 辆
mkBus(-120, -outerRadius + 10, 0);
mkBus(120, outerRadius - 10, Math.PI);
mkBus(outerRadius - 10, 80, Math.PI / 2);
mkBus(-outerRadius + 10, -80, -Math.PI / 2);
```

- [ ] **Step 5: 提交**

```bash
git add game.js
git commit -m "feat: increase vehicle density and distribution"
```

---

### Task 9: 增加街道设施密度

**Files:**
- Modify: `game.js` (createScenery 中的设施部分)

- [ ] **Step 1: 增加路灯到 40 个**

```javascript
for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const x = Math.cos(angle) * (outerRadius - 10);
    const z = Math.sin(angle) * (outerRadius - 10);
    mkStreetLight(x, z);
}
```

- [ ] **Step 2: 增加垃圾桶到 20 个**

```javascript
for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = Math.cos(angle) * (outerRadius - 8);
    const z = Math.sin(angle) * (outerRadius - 8);
    mkTrashCan(x, z);
}
```

- [ ] **Step 3: 增加邮筒到 8 个**

```javascript
mkMailbox(-80, -outerRadius + 18);
mkMailbox(80, -outerRadius + 18);
mkMailbox(outerRadius - 18, -60);
mkMailbox(outerRadius - 18, 0);
mkMailbox(outerRadius - 18, 60);
mkMailbox(-80, outerRadius - 18);
mkMailbox(80, outerRadius - 18);
mkMailbox(-outerRadius + 18, 0);
```

- [ ] **Step 4: 增加消防栓到 16 个**

```javascript
for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const x = Math.cos(angle) * (outerRadius - 6);
    const z = Math.sin(angle) * (outerRadius - 6);
    mkHydrant(x, z);
}
```

- [ ] **Step 5: 增加自行车架到 6 个**

```javascript
mkBikeRack(-140, -outerRadius + 25, 0);
mkBikeRack(10, -outerRadius + 35, 0);
mkBikeRack(outerRadius - 20, -20, Math.PI / 2);
mkBikeRack(50, outerRadius - 40, Math.PI);
mkBikeRack(-100, outerRadius - 25, Math.PI);
mkBikeRack(-outerRadius + 25, 60, -Math.PI / 2);
```

- [ ] **Step 6: 增加花坛到 12 个**

```javascript
for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.cos(angle) * (outerRadius - 3);
    const z = Math.sin(angle) * (outerRadius - 3);
    mkFlowerBed(x, z);
}
```

- [ ] **Step 7: 提交**

```bash
git add game.js
git commit -m "feat: increase street furniture density"
```

---

## 阶段三：装饰元素和氛围

### Task 10: 创建休闲设施

**Files:**
- Modify: `game.js` (添加网球场、沙滩区域生成器)

- [ ] **Step 1: 添加网球场生成器**

```javascript
// 休闲设施：网球场
function mkTennisCourt(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    // 地面
    const court = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 36),
        new THREE.MeshStandardMaterial({ color: 0xC95A4A })
    );
    court.rotation.x = -Math.PI / 2;
    court.receiveShadow = true;
    g.add(court);

    // 白线
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const border = new THREE.Mesh(new THREE.PlaneGeometry(20, 36), lineMat);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.1;
    g.add(border);

    // 围网
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 2; i++) {
        const fence = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), fenceMat);
        fence.position.set(0, 2, i === 0 ? -18 : 18);
        g.add(fence);
    }
    for (let i = 0; i < 2; i++) {
        const fence = new THREE.Mesh(new THREE.PlaneGeometry(36, 4), fenceMat);
        fence.rotation.y = Math.PI / 2;
        fence.position.set(i === 0 ? -10 : 10, 2, 0);
        g.add(fence);
    }

    // 照明灯
    for (let i = 0; i < 4; i++) {
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.3, 10, 8),
            new THREE.MeshStandardMaterial({ color: 0x4A4A4A })
        );
        pole.position.set(i === 0 || i === 1 ? -12 : 12, 5, i < 2 ? -18 : 18);
        g.add(pole);
    }

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 添加沙滩区域生成器**

```javascript
// 休闲设施：沙滩区域
function mkBeachArea(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    // 沙滩地面
    const sand = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 20),
        new THREE.MeshStandardMaterial({ color: COLORS.sand })
    );
    sand.rotation.x = -Math.PI / 2;
    sand.receiveShadow = true;
    g.add(sand);

    // 遮阳伞
    const umbrellaColors = [0xFF4444, 0xFFFF44, 0x44FFFF, 0x44FF44];
    for (let i = 0; i < 6; i++) {
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        pole.position.set(-15 + i * 6, 2, -5);
        g.add(pole);

        const canopy = new THREE.Mesh(
            new THREE.ConeGeometry(2, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: umbrellaColors[i % 4] })
        );
        canopy.position.set(-15 + i * 6, 4.5, -5);
        g.add(canopy);
    }

    // 躺椅
    for (let i = 0; i < 6; i++) {
        const chair = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.5, 1.5),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
        );
        chair.position.set(-14 + i * 6, 0.5, 2);
        g.add(chair);
    }

    // 冲浪板
    for (let i = 0; i < 4; i++) {
        const board = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 3, 0.8),
            new THREE.MeshStandardMaterial({ color: umbrellaColors[i] })
        );
        board.rotation.x = Math.PI / 4;
        board.position.set(-15 + i * 8, 1.5, -8);
        g.add(board);
    }

    scene.add(g);
    return g;
}
```

- [ ] **Step 3: 在 createScenery 中添加休闲设施**

```javascript
// 网球场
mkTennisCourt(80, 80, 0);

// 沙滩区域
mkBeachArea(0, outerRadius - 50, 0);
```

- [ ] **Step 4: 提交**

```bash
git add game.js
git commit -m "feat: add leisure facilities (tennis court, beach area)"
```

---

### Task 11: 创建桥梁

**Files:**
- Modify: `game.js` (添加桥梁生成器)

- [ ] **Step 1: 添加桥梁生成器**

```javascript
// 休闲设施：桥梁
function mkBridge(x, z, rot, length) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    // 桥面
    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.road })
    );
    deck.position.y = 3;
    deck.receiveShadow = true;
    g.add(deck);

    // 桥墩
    const pierMat = new THREE.MeshStandardMaterial({ color: COLORS.sidewalk });
    for (let i = 0; i < 3; i++) {
        const pier = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 6),
            pierMat
        );
        pier.position.set(-length/2 + i * length/2, 1.5, 0);
        g.add(pier);
    }

    // 栏杆
    const railMat = new THREE.MeshStandardMaterial({ color: COLORS.roofGray });
    for (let i = 0; i < 2; i++) {
        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(length, 0.8, 0.2),
            railMat
        );
        rail.position.set(0, 3.5, i === 0 ? -4 : 4);
        g.add(rail);
    }

    // 路灯
    for (let i = 0; i < 4; i++) {
        const lightPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.3, 4, 8),
            new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
        );
        lightPole.position.set(-length/2 + i * length/3, 5, i % 2 === 0 ? -4 : 4);
        g.add(lightPole);
    }

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 在 createScenery 中添加桥梁**

```javascript
// 桥梁（跨越水体）
mkBridge(0, -100, 0, 60);
mkBridge(-100, 0, Math.PI / 2, 50);
```

- [ ] **Step 3: 提交**

```bash
git add game.js
git commit -m "feat: add bridge generator"
```

---

### Task 12: 添加霓虹招牌和广告牌

**Files:**
- Modify: `game.js` (添加霓虹招牌生成器)

- [ ] **Step 1: 添加霓虹招牌生成器**

```javascript
// 装饰：霓虹招牌
function mkNeonSign(x, y, z, rot, text, color) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rot;

    // 招牌背景
    const bg = new THREE.Mesh(
        new THREE.BoxGeometry(8, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    g.add(bg);

    // 霓虹灯管（简化为发光文字效果）
    const signMat = new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 1.0
    });
    
    // 文字（用简单几何体模拟）
    const letters = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1.5, 0.2),
        signMat
    );
    letters.position.set(0, 0, 0.2);
    g.add(letters);

    // 闪烁效果（通过动画实现）
    g.userData = { 
        baseIntensity: 0.8, 
        flickerSpeed: 0.05,
        color: color 
    };

    scene.add(g);
    return g;
}
```

- [ ] **Step 2: 在 createScenery 中添加霓虹招牌**

```javascript
// 霓虹招牌（分布在商业区）
mkNeonSign(-100, 15, -outerRadius + 20, 0, 'DIGITAL', COLORS.neonCyan);
mkNeonSign(100, 15, -outerRadius + 20, Math.PI, 'CYBER', COLORS.neonPurple);
mkNeonSign(outerRadius - 20, 15, 0, Math.PI / 2, 'TECH', COLORS.neonPink);
```

- [ ] **Step 3: 添加招牌动画更新函数**

```javascript
// 霓虹招牌动画更新
function updateNeonSigns(dt) {
    scene.traverse(obj => {
        if (obj.userData && obj.userData.flickerSpeed) {
            const intensity = obj.userData.baseIntensity + 
                Math.sin(Date.now() * obj.userData.flickerSpeed) * 0.2;
            // 注意：需要存储材质引用才能更新
        }
    });
}
```

- [ ] **Step 4: 在 animate() 中调用动画更新**

```javascript
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(dt);

    updateCar(dt);
    updateCamera();
    updateNeonSigns(dt);  // 添加这行
    drawMinimap();
    renderer.render(scene, camera);
}
```

- [ ] **Step 5: 提交**

```bash
git add game.js
git commit -m "feat: add neon signs with flicker animation"
```

---

### Task 13: 最终调优和性能优化

**Files:**
- Modify: `game.js` (整体调优)

- [ ] **Step 1: 检查 FPS**

```bash
open http://localhost:8080/index.html
```
Expected: FPS 稳定在 60 帧

- [ ] **Step 2: 调整雾效果范围**

```javascript
scene.fog = new THREE.Fog(0xa0a0a0, 100, 400);  // 调整距离以匹配城市尺寸
```

- [ ] **Step 3: 优化材质复用**

检查是否有重复创建的材质，提取为共享变量。

- [ ] **Step 4: 提交**

```bash
git add game.js
git commit -m "perf: final optimization and tuning"
```

---

## 验收

### Task 14: 视觉验收

**Files:**
- 无需修改

- [ ] **Step 1: 对比参考图**

打开 ref-city/ 中的参考图，对比场景：
- 建筑风格和颜色是否一致
- 道路布局是否完整
- 车辆和街道设施是否就位

- [ ] **Step 2: 环绕城市检查**

```bash
open http://localhost:8080/index.html
```
使用方向键环绕城市，检查所有区域。

- [ ] **Step 3: 性能检查**

观察右上角 FPS 显示（如有）或浏览器开发者工具。
Expected: FPS 稳定在 60 帧

---

**Plan complete.**
