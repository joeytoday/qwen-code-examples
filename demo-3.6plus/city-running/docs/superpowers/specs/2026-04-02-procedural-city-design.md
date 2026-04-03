# 程序化城市生成设计文档

**创建日期**: 2026-04-02  
**项目**: cyble-city  
**技术栈**: Three.js + MapGenerator 算法  
**视觉风格**: Tile Pack City 3 - 明亮等距卡通风格

---

## 1. 项目概述

### 1.1 目标
使用 **MapGenerator 的张量场算法** 生成程序化城市道路网络和建筑布局，保持 Tile Pack City 3 的明亮卡通风格，支持角色在城市街道上奔跑探索。

### 1.2 视觉风格
- **参考**: `ref-city/` 文件夹中的 12 张 Tile Pack City 3 图片
- **风格**: 等距视角、低多边形、明亮色彩、卡通风格
- **氛围**: 轻松愉快、家庭友好、清晰易读

### 1.3 核心玩法
- 角色在城市街道上自由奔跑
- 程序化生成的城市布局，每次不同
- 保持现有的人物跑动和视角跟随系统

---

## 2. 色彩方案（Tile Pack City 3）

### 2.1 建筑主色调
| 颜色 | 色值 | 用途 |
|------|------|------|
| 薄荷绿 | `#A8D5BA` | 住宅建筑 |
| 浅蓝 | `#A8C8D5` | 办公楼 |
| 粉色 | `#F5D5D5` | 商业建筑 |
| 米黄 | `#F5E5A8` | 住宅/商铺 |
| 浅绿 | `#C8E5A8` | 住宅 |
| 桃色 | `#F5C5A8` | 商铺 |
| 淡紫 | `#D5C8E5` | 住宅 |
| 米白 | `#E8E0D5` | 古典建筑 |

### 2.2 屋顶颜色
| 颜色 | 色值 | 用途 |
|------|------|------|
| 棕色 | `#5A4A42` | 住宅屋顶 |
| 灰色 | `#8A8A8A` | 商业屋顶 |
| 橙色 | `#E58A4A` | 特色屋顶 |
| 白色 | `#F5F5F5` | 古典/医院 |
| 绿色 | `#6A9A6A` | 环保建筑 |

### 2.3 地面和道路
| 颜色 | 色值 | 用途 |
|------|------|------|
| 深灰 | `#5A5A5A` | 主道路 |
| 浅灰 | `#6A6A6A` | 次要道路 |
| 人行道 | `#C8C8C8` | 人行道 |
| 草地 | `#8BC96B` | 绿化区域 |
| 沙地 | `#E8D5A8` | 沙滩 |
| 水体 | `#6AB5D5` | 河流/海洋 |

### 2.4 标记线
| 颜色 | 色值 | 用途 |
|------|------|------|
| 白色 | `#F0F0F0` | 车道线、斑马线 |
| 黄色 | `#E8D56A` | 中心线 |

---

## 3. 程序化生成算法

### 3.1 核心算法：张量场（Tensor Field）

基于 [MapGenerator](https://github.com/ProbableTrain/MapGenerator) 的研究成果：

```
张量场创建 → 流线积分 → 道路网络 → 多边形查找 → 地块细分
```

#### 数据结构

```javascript
// 2D 向量
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// 张量 - 每个点的主要和次要方向
class Tensor {
    constructor(major, minor) {
        this.major = major;  // 主要方向（用于主干道）
        this.minor = minor;  // 次要方向（用于支路）
    }
    
    static zero = new Tensor(new Vector(1, 0), new Vector(0, 1));
    
    add(other, smooth) {
        // 平滑混合两个张量
    }
}

// 道路节点
class Node {
    constructor(position) {
        this.position = position;
        this.neighbors = new Set();  // 连接的节点
        this.segments = new Set();   // 通过的道路段
    }
}

// 流线 - 积分生成的道路路径
class Streamline {
    constructor() {
        this.points = [];  // Vector[]
    }
}

// 多边形 - 城市街区或建筑地块
class Polygon {
    constructor() {
        this.vertices = [];  // Vector[]
    }
}
```

### 3.2 生成流程

#### 步骤 1: 张量场创建

```javascript
class TensorField {
    constructor() {
        this.basisFields = [];  // 基础场（网格 + 径向）
    }
    
    // 添加网格基础场（产生平行街道图案）
    addGridField(centerX, centerY, width, height, angle, weight) {
        this.basisFields.push(new GridBasisField(
            centerX, centerY, width, height, angle, weight
        ));
    }
    
    // 添加径向基础场（产生曲线街道图案）
    addRadialField(centerX, centerY, weight) {
        this.basisFields.push(new RadialBasisField(
            centerX, centerY, weight
        ));
    }
    
    // 采样某点的张量
    samplePoint(point) {
        let tensor = Tensor.zero;
        for (const field of this.basisFields) {
            tensor.add(field.getWeightedTensor(point), this.smooth);
        }
        return tensor;
    }
}
```

#### 步骤 2: 流线积分（道路生成）

```javascript
class StreamlineGenerator {
    constructor(tensorField, gridStorage) {
        this.tensorField = tensorField;
        this.gridStorage = gridStorage;  // 空间哈希网格
    }
    
    // 使用 RK4 积分沿张量场生成道路
    integrateStreamline(startPoint, useMajorDirection) {
        const streamline = new Streamline();
        let current = startPoint;
        let direction = useMajorDirection ? 
            this.tensorField.samplePoint(current).major : 
            this.tensorField.samplePoint(current).minor;
        
        for (let i = 0; i < maxIterations; i++) {
            // RK4 积分
            const k1 = direction;
            const k2 = this.tensorField.samplePoint(
                add(current, multiply(k1, stepSize))
            ).getDirection(useMajorDirection);
            const k3 = this.tensorField.samplePoint(
                add(current, multiply(k2, stepSize))
            ).getDirection(useMajorDirection);
            const k4 = this.tensorField.samplePoint(
                add(current, multiply(k3, stepSize))
            ).getDirection(useMajorDirection);
            
            const next = add(current, multiply(
                add(add(add(k1, multiply(k2, 2)), multiply(k3, 2)), k4),
                stepSize / 6
            ));
            
            // 检查是否满足分离距离
            if (!this.gridStorage.checkSeparation(next, dsep)) {
                break;
            }
            
            streamline.points.push(next);
            this.gridStorage.add(next);
            current = next;
        }
        
        return streamline;
    }
}
```

#### 步骤 3: 图构建

```javascript
class GraphBuilder {
    constructor(streamlines) {
        this.streamlines = streamlines;
        this.nodes = [];
        this.edges = [];
    }
    
    // 使用 isect 库找到所有交叉口
    buildGraph() {
        // 1. 找到所有流线交点
        const intersections = this.findIntersections();
        
        // 2. 为每个交点创建节点
        for (const point of intersections) {
            this.nodes.push(new Node(point));
        }
        
        // 3. 沿流线连接节点
        for (const streamline of this.streamlines) {
            this.connectNodesAlongStreamline(streamline);
        }
        
        // 4. 删除悬挂节点（可选）
        if (removeDangling) {
            this.removeDanglingNodes();
        }
    }
    
    findIntersections() {
        // 使用 isect 库进行线段相交检测
        return isect.findAllIntersections(this.streamlines);
    }
}
```

#### 步骤 4: 多边形查找（城市街区）

```javascript
class PolygonFinder {
    constructor(graph) {
        this.graph = graph;
    }
    
    // 使用右手定则查找所有多边形
    findPolygons() {
        const polygons = [];
        
        for (const node of this.graph.nodes) {
            if (node.neighbors.size < 2) continue;
            
            for (const nextNode of node.neighbors) {
                const polygon = this.recursiveWalk([node, nextNode]);
                if (polygon !== null && polygon.length < maxLength) {
                    this.removePolygonAdjacencies(polygon);
                    polygons.push(polygon);
                }
            }
        }
        
        return polygons;
    }
    
    // 右手定则：在每个路口右转
    recursiveWalk(path) {
        const [current, next] = path.slice(-2);
        
        // 找到下一个右转的邻居
        const rightNeighbor = this.findRightmostNeighbor(current, next);
        
        if (rightNeighbor === path[0]) {
            // 回到起点，多边形闭合
            return path;
        }
        
        if (path.includes(rightNeighbor)) {
            // 遇到非起点的已访问节点，无效多边形
            return null;
        }
        
        path.push(rightNeighbor);
        return this.recursiveWalk(path);
    }
}
```

#### 步骤 5: 地块细分

```javascript
class LotSubdivider {
    // 递归分割城市街区为建筑地块
    subdividePolygon(polygon, minArea, chanceNoDivide) {
        if (polygon.area < minArea) {
            return [polygon];
        }
        
        if (Math.random() < chanceNoDivide) {
            return [polygon];  // 保留不分割
        }
        
        // 找到最长边
        const [p1, p2] = this.findLongestEdge(polygon);
        
        // 创建分割线
        const midpoint = multiply(add(p1, p2), 0.5);
        const perpendicular = normalize(perpendicular(p1, p2));
        
        // 分割多边形
        const [poly1, poly2] = this.splitPolygon(polygon, midpoint, perpendicular);
        
        // 递归分割
        return [
            ...this.subdividePolygon(poly1, minArea, chanceNoDivide),
            ...this.subdividePolygon(poly2, minArea, chanceNoDivide)
        ];
    }
}
```

### 3.3 完整生成管道

```javascript
class CityGenerator {
    constructor(params) {
        this.params = params;
        this.tensorField = new TensorField();
        this.gridStorage = new GridStorage(params.dsep);
    }
    
    async generate() {
        // 步骤 1: 创建张量场
        this.createTensorFields();
        
        // 步骤 2: 生成道路网络
        const majorStreamlines = this.generateMajorRoads();
        const minorStreamlines = this.generateMinorRoads();
        
        // 步骤 3: 构建图
        const graph = new GraphBuilder([...majorStreamlines, ...minorStreamlines]);
        graph.buildGraph();
        
        // 步骤 4: 查找城市街区
        const polygonFinder = new PolygonFinder(graph);
        const cityBlocks = polygonFinder.findPolygons();
        
        // 步骤 5: 细分地块
        const lotSubdivider = new LotSubdivider();
        const buildingLots = [];
        for (const block of cityBlocks) {
            const lots = lotSubdivider.subdividePolygon(
                block, 
                this.params.minLotArea,
                this.params.chanceNoDivide
            );
            buildingLots.push(...lots);
        }
        
        // 步骤 6: 生成建筑
        const buildingGenerator = new BuildingGenerator(this.params);
        const buildings = buildingGenerator.generate(buildingLots);
        
        // 步骤 7: 生成街道设施
        const furnitureGenerator = new StreetFurnitureGenerator(this.params);
        const furniture = furnitureGenerator.generate(graph, buildings);
        
        return {
            graph,
            buildings,
            furniture,
            blocks: cityBlocks,
            lots: buildingLots
        };
    }
    
    createTensorFields() {
        // 添加网格场（市中心平行街道）
        this.tensorField.addGridField(0, 0, 300, 300, 0, 1.0);
        
        // 添加径向场（曲线郊区街道）
        this.tensorField.addRadialField(200, 200, 0.5);
        
        // 可以添加更多场来创建复杂模式
    }
    
    generateMajorRoads() {
        const streamlines = [];
        const edgePoints = this.getEdgePoints();
        
        for (const point of edgePoints) {
            const streamline = this.integrateRoad(
                point, 
                useMajorDirection = true
            );
            if (streamline.points.length > minLength) {
                streamlines.push(streamline);
            }
        }
        
        return streamlines;
    }
    
    generateMinorRoads() {
        // 类似，但使用次要方向
    }
}
```

---

## 4. 建筑生成

### 4.1 建筑类型系统

根据参考图，需要以下建筑类型：

| 类型 | 层数 | 特征 | 颜色 |
|------|------|------|------|
| 小型商铺 | 1-2 | 带遮阳篷、圆顶装饰 | 黄/绿/粉 |
| 多层公寓 | 2-4 | 阳台、屋顶空调 | 粉/蓝/绿 |
| 现代办公楼 | 3-5 | 玻璃幕墙、白色窗框 | 蓝绿/白 |
| 摩天大楼 | 5-8 | 分段式、尖顶 | 蓝/灰 |
| 医院 | 2-3 | 红十字标志、白色 | 白/红 |
| 消防局 | 2 | 红色外墙、星形标志 | 红/白 |
| 古典建筑 | 2-3 | 圆柱、三角山墙 | 米白 |
| 教堂 | 2-3 | 圆顶、尖塔 | 粉/紫 |
| 体育馆 | 1 | 圆形、环形屋顶 | 橙/白 |
| 购物中心 | 1-2 | 玻璃穹顶 | 粉/蓝 |

### 4.2 建筑生成器

```javascript
class BuildingGenerator {
    constructor(params) {
        this.params = params;
        this.buildingTypes = this.loadBuildingTypes();
    }
    
    generate(lots) {
        const buildings = [];
        
        for (const lot of lots) {
            // 根据地块大小和位置选择建筑类型
            const type = this.selectBuildingType(lot);
            
            // 生成建筑
            const building = this.createBuilding(lot, type);
            buildings.push(building);
        }
        
        return buildings;
    }
    
    selectBuildingType(lot) {
        const area = lot.area;
        const aspectRatio = lot.aspectRatio;
        
        // 大地块 → 大型建筑
        if (area > 1000) {
            return this.getRandomType(['skyscraper', 'office', 'mall']);
        }
        
        // 中等地块 → 中型建筑
        if (area > 400) {
            return this.getRandomType(['apartment', 'office', 'hospital']);
        }
        
        // 小地块 → 小型建筑
        return this.getRandomType(['shop', 'house', 'small_apartment']);
    }
    
    createBuilding(lot, type) {
        const building = new THREE.Group();
        
        switch (type) {
            case 'shop':
                return this.createShop(lot);
            case 'apartment':
                return this.createApartment(lot);
            case 'office':
                return this.createOffice(lot);
            case 'skyscraper':
                return this.createSkyscraper(lot);
            // ... 其他类型
        }
    }
}
```

### 4.3 模块化建筑生成

```javascript
// 使用现有的 mkShop, mkApartment 等函数
function createShop(lot) {
    const g = new THREE.Group();
    g.position.set(lot.centroid.x, 0, lot.centroid.y);
    g.rotation.y = lot.rotation;
    
    // 使用现有的 mkShop 函数
    const shop = mkShop(0, 0, 0, getRandomColor());
    g.add(shop);
    
    return g;
}
```

---

## 5. 街道设施生成

### 5.1 设施类型

| 设施 | 数量/公里 | 位置 |
|------|-----------|------|
| 路灯 | 20 | 沿道路两侧 |
| 树木 | 15 | 人行道、公园 |
| 长椅 | 5 | 公园、人行道 |
| 垃圾桶 | 10 | 沿人行道 |
| 邮筒 | 3 | 路口 |
| 消防栓 | 8 | 建筑旁 |
| 自行车架 | 2 | 商业区 |
| 花坛 | 5 | 装饰区域 |

### 5.2 生成器

```javascript
class StreetFurnitureGenerator {
    generate(graph, buildings) {
        const furniture = [];
        
        // 沿道路生成路灯
        for (const edge of graph.edges) {
            this.generateAlongEdge(edge, 'streetLight', spacing: 10);
        }
        
        // 在建筑旁生成消防栓
        for (const building of buildings) {
            this.generateNearBuilding(building, 'hydrant');
        }
        
        // 随机生成其他设施
        this.generateRandom(furniture, 'tree', density: 0.3);
        this.generateRandom(furniture, 'bench', density: 0.1);
        
        return furniture;
    }
    
    generateAlongEdge(edge, type, spacing) {
        const points = this.sampleEdge(edge, spacing);
        for (const point of points) {
            const offset = this.getOffsetForType(type);
            const position = add(point, offset);
            furniture.push(this.createFurniture(type, position));
        }
    }
}
```

---

## 6. 与现有系统集成

### 6.1 保持现有代码

- ✅ 人物跑动系统不变
- ✅ 视角跟随系统不变
- ✅ Three.js 渲染架构不变

### 6.2 替换部分

- ❌ 固定的 `createScenery()` 函数
- ✅ 替换为程序化的 `CityGenerator.generate()`

### 6.3 集成点

```javascript
// 在 game.js 的 init() 函数中
function init() {
    // ... 现有初始化代码 ...
    
    // 生成程序化城市
    const cityParams = {
        dsep: 30,  // 道路间距
        minLotArea: 200,
        chanceNoDivide: 0.3,
        // ... 其他参数
    };
    
    const cityGenerator = new CityGenerator(cityParams);
    const city = await cityGenerator.generate();
    
    // 添加到场景
    scene.add(city.buildings);
    scene.add(city.furniture);
}
```

---

## 7. 实施计划

### 阶段一：核心算法实现（5-7 个任务）
1. 实现 Vector、Tensor 数据结构
2. 实现 TensorField 和 BasisField
3. 实现 RK4 积分器
4. 实现 StreamlineGenerator
5. 实现 GraphBuilder（使用 isect 库）
6. 实现 PolygonFinder
7. 实现 LotSubdivider

### 阶段二：建筑生成（3-4 个任务）
8. 实现 BuildingGenerator
9. 扩展现有建筑函数（mkShop, mkApartment 等）支持程序化放置
10. 添加建筑高度变化
11. 添加建筑颜色随机化

### 阶段三：街道设施（2-3 个任务）
12. 实现 StreetFurnitureGenerator
13. 扩展现有街道设施函数
14. 添加树木和绿化

### 阶段四：集成和优化（2-3 个任务）
15. 集成到 game.js
16. 性能优化（对象池、LOD）
17. 参数调整和视觉验收

---

## 8. 技术依赖

```json
{
  "three": "r163",
  "isect": "^3.0.0",      // 线段相交检测
  "simplify-js": "^1.2.4" // 多边形简化
}
```

---

## 9. 验收标准

### 视觉验收
- [ ] 城市布局每次生成不同
- [ ] 道路连接性良好，无断头路
- [ ] 建筑风格与参考图一致
- [ ] 街道设施分布自然

### 功能验收
- [ ] 人物跑动系统正常工作
- [ ] 视角跟随系统正常工作
- [ ] 生成时间 < 5 秒
- [ ] FPS 稳定在 60 帧

### 性能验收
- [ ] 使用对象池生成街道设施
- [ ] 使用 LOD 系统处理远距离建筑
- [ ] 使用空间哈希加速碰撞检测

---

**文档结束**
