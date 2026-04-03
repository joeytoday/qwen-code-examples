# 程序化城市生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 MapGenerator 的张量场算法生成程序化城市道路网络和建筑布局，保持 Tile Pack City 3 风格，支持角色在城市街道上奔跑探索。

**Architecture:** 基于张量场的程序化生成系统，包括 TensorField（方向场）、StreamlineGenerator（道路积分）、GraphBuilder（交叉口图）、PolygonFinder（城市街区）、LotSubdivider（地块细分）、BuildingGenerator（建筑生成）。保持现有 game.js 的人物跑动和视角系统不变。

**Tech Stack:** Three.js (r163), Vanilla JavaScript, isect (线段相交检测), simplify-js (多边形简化)

---

## File Structure

**创建文件:**
- `src/core/Vector.js` - 2D 向量数据结构
- `src/core/Tensor.js` - 张量数据结构
- `src/fields/TensorField.js` - 张量场系统
- `src/fields/BasisField.js` - 基础场（网格 + 径向）
- `src/integrators/RK4Integrator.js` - RK4 积分器
- `src/generators/StreamlineGenerator.js` - 道路流线生成
- `src/generators/GraphBuilder.js` - 图构建（交叉口）
- `src/generators/PolygonFinder.js` - 多边形查找（城市街区）
- `src/generators/LotSubdivider.js` - 地块细分
- `src/generators/BuildingGenerator.js` - 建筑生成
- `src/generators/StreetFurnitureGenerator.js` - 街道设施生成
- `src/CityGenerator.js` - 主城市生成器

**修改文件:**
- `game.js:1-50` - 添加导入语句
- `game.js:init()` - 调用城市生成器替换 createScenery()

**保持不变:**
- 人物跑动系统代码
- 视角跟随系统代码
- 现有建筑生成器函数（mkShop, mkApartment 等）

---

## 阶段一：核心数据结构

### Task 1: 创建 Vector 类

**Files:**
- Create: `src/core/Vector.js`

- [ ] **Step 1: 创建 Vector 类**

```javascript
// src/core/Vector.js
export class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    clone() {
        return new Vector(this.x, this.y);
    }
    
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    
    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    
    multiply(s) {
        return new Vector(this.x * s, this.y * s);
    }
    
    divide(s) {
        if (s === 0) return new Vector(0, 0);
        return new Vector(this.x / s, this.y / s);
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector(0, 0);
        return this.divide(mag);
    }
    
    perpendicular() {
        return new Vector(-this.y, this.x);
    }
    
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    
    distance(v) {
        return this.sub(v).magnitude();
    }
    
    equals(v, epsilon = 0.0001) {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }
    
    toString() {
        return `Vector(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
}

// 辅助函数
export function add(a, b) { return a.add(b); }
export function sub(a, b) { return a.sub(b); }
export function multiply(v, s) { return v.multiply(s); }
export function normalize(v) { return v.normalize(); }
export function perpendicular(v) { return v.perpendicular(); }
export function distance(a, b) { return a.distance(b); }
```

- [ ] **Step 2: 创建测试文件验证 Vector 类**

```javascript
// 在浏览器控制台测试
import { Vector, add, multiply, normalize } from './src/core/Vector.js';

const v1 = new Vector(3, 4);
console.assert(v1.magnitude() === 5, 'magnitude should be 5');

const v2 = v1.normalize();
console.assert(Math.abs(v2.magnitude() - 1) < 0.0001, 'normalized magnitude should be 1');

const v3 = add(v1, multiply(v2, 2));
console.assert(v3 instanceof Vector, 'result should be Vector');

console.log('✅ Vector tests passed');
```

- [ ] **Step 3: 提交**

```bash
git add src/core/Vector.js
git commit -m "feat: add Vector class with 2D math operations"
```

---

### Task 2: 创建 Tensor 类

**Files:**
- Create: `src/core/Tensor.js`

- [ ] **Step 1: 创建 Tensor 类**

```javascript
// src/core/Tensor.js
import { Vector } from './Vector.js';

export class Tensor {
    constructor(major, minor) {
        this.major = major || new Vector(1, 0);    // 主要方向（用于主干道）
        this.minor = minor || new Vector(0, 1);    // 次要方向（用于支路）
    }
    
    static get zero() {
        return new Tensor(new Vector(1, 0), new Vector(0, 1));
    }
    
    add(other, smooth = 0.1) {
        // 平滑混合两个张量
        const t = 1 - smooth;
        const newMajor = this.major.multiply(t).add(other.major.multiply(smooth)).normalize();
        const newMinor = this.minor.multiply(t).add(other.minor.multiply(smooth)).normalize();
        return new Tensor(newMajor, newMinor);
    }
    
    getDirection(useMajor) {
        return useMajor ? this.major : this.minor;
    }
    
    clone() {
        return new Tensor(this.major.clone(), this.minor.clone());
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/core/Tensor.js
git commit -m "feat: add Tensor class for bidirectional field representation"
```

---

## 阶段二：张量场系统

### Task 3: 创建 BasisField 基类

**Files:**
- Create: `src/fields/BasisField.js`

- [ ] **Step 1: 创建 BasisField 基类和子类**

```javascript
// src/fields/BasisField.js
import { Vector, distance } from '../core/Vector.js';
import { Tensor } from '../core/Tensor.js';

// 基类
export class BasisField {
    constructor(weight = 1.0) {
        this.weight = weight;
    }
    
    getWeightedTensor(point, smooth = 0.1) {
        const tensor = this.getTensor(point);
        // 根据距离衰减权重
        return tensor; // 简化版本
    }
    
    getTensor(point) {
        throw new Error('getTensor must be implemented by subclass');
    }
}

// 网格基础场 - 产生平行街道图案
export class GridBasisField extends BasisField {
    constructor(centerX, centerY, width, height, angle = 0, weight = 1.0) {
        super(weight);
        this.center = new Vector(centerX, centerY);
        this.width = width;
        this.height = height;
        this.angle = angle;
        
        // 预计算旋转矩阵
        this.cosA = Math.cos(angle);
        this.sinA = Math.sin(angle);
    }
    
    getTensor(point) {
        // 将点转换到局部坐标系
        const dx = point.x - this.center.x;
        const dy = point.y - this.center.y;
        
        // 旋转
        const localX = dx * this.cosA - dy * this.sinA;
        const localY = dx * this.sinA + dy * this.cosA;
        
        // 检查是否在网格范围内
        const inWidth = Math.abs(localX) < this.width / 2;
        const inHeight = Math.abs(localY) < this.height / 2;
        
        if (!inWidth || !inHeight) {
            return Tensor.zero;
        }
        
        // 返回网格方向的张量
        const major = new Vector(this.cosA, this.sinA);
        const minor = new Vector(-this.sinA, this.cosA);
        
        return new Tensor(major, minor);
    }
}

// 径向基础场 - 产生曲线街道图案
export class RadialBasisField extends BasisField {
    constructor(centerX, centerY, weight = 1.0) {
        super(weight);
        this.center = new Vector(centerX, centerY);
    }
    
    getTensor(point) {
        const direction = point.sub(this.center).normalize();
        const perpendicular = direction.perpendicular();
        
        // 径向场：主要方向为切线方向，次要方向为径向
        return new Tensor(perpendicular, direction);
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/fields/BasisField.js
git commit -m "feat: add BasisField with Grid and Radial implementations"
```

---

### Task 4: 创建 TensorField 类

**Files:**
- Create: `src/fields/TensorField.js`

- [ ] **Step 1: 创建 TensorField 类**

```javascript
// src/fields/TensorField.js
import { Tensor } from '../core/Tensor.js';
import { BasisField, GridBasisField, RadialBasisField } from './BasisField.js';

export class TensorField {
    constructor(smooth = 0.1) {
        this.basisFields = [];
        this.smooth = smooth;
    }
    
    // 添加网格基础场
    addGridField(centerX, centerY, width, height, angle = 0, weight = 1.0) {
        this.basisFields.push(new GridBasisField(centerX, centerY, width, height, angle, weight));
        return this;
    }
    
    // 添加径向基础场
    addRadialField(centerX, centerY, weight = 1.0) {
        this.basisFields.push(new RadialBasisField(centerX, centerY, weight));
        return this;
    }
    
    // 采样某点的张量
    samplePoint(point) {
        let tensor = Tensor.zero;
        
        for (const field of this.basisFields) {
            tensor = tensor.add(field.getWeightedTensor(point, this.smooth), this.smooth);
        }
        
        return tensor;
    }
    
    // 清除所有场
    clear() {
        this.basisFields = [];
    }
    
    // 获取场的数量
    getFieldCount() {
        return this.basisFields.length;
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/fields/TensorField.js
git commit -m "feat: add TensorField for combining basis fields"
```

---

## 阶段三：道路生成

### Task 5: 创建 RK4 积分器

**Files:**
- Create: `src/integrators/RK4Integrator.js`

- [ ] **Step 1: 创建 RK4 积分器**

```javascript
// src/integrators/RK4Integrator.js
import { Vector, add, multiply } from '../core/Vector.js';

export class RK4Integrator {
    constructor(stepSize = 1.0) {
        this.stepSize = stepSize;
    }
    
    // 积分一步
    integrate(point, getDirection, tensorField) {
        const h = this.stepSize;
        
        // RK4: k1, k2, k3, k4
        const k1 = getDirection(tensorField.samplePoint(point));
        
        const p2 = add(point, multiply(k1, h));
        const k2 = getDirection(tensorField.samplePoint(p2));
        
        const p3 = add(point, multiply(k2, h));
        const k3 = getDirection(tensorField.samplePoint(p3));
        
        const p4 = add(point, multiply(k3, h));
        const k4 = getDirection(tensorField.samplePoint(p4));
        
        // 加权平均
        const result = add(
            add(add(k1, multiply(k2, 2)), multiply(k3, 2)),
            k4
        ).multiply(h / 6);
        
        return add(point, result);
    }
    
    // 完整积分路径
    integratePath(startPoint, getDirection, tensorField, maxSteps = 100, shouldStop = null) {
        const path = [startPoint.clone()];
        let current = startPoint.clone();
        
        for (let i = 0; i < maxSteps; i++) {
            const next = this.integrate(current, getDirection, tensorField);
            path.push(next);
            
            // 检查停止条件
            if (shouldStop && shouldStop(next, path)) {
                break;
            }
            
            current = next;
        }
        
        return path;
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/integrators/RK4Integrator.js
git commit -m "feat: add RK4 integrator for streamline tracing"
```

---

### Task 6: 创建 GridStorage 空间哈希

**Files:**
- Create: `src/spatial/GridStorage.js`

- [ ] **Step 1: 创建 GridStorage 类**

```javascript
// src/spatial/GridStorage.js
import { Vector } from '../core/Vector.js';

export class GridStorage {
    constructor(separationDistance) {
        this.dsep = separationDistance;
        this.grid = new Map();  // key: "x,y", value: Vector
        this.cellSize = separationDistance;
    }
    
    // 获取单元格坐标
    getCellKey(point) {
        const cellX = Math.floor(point.x / this.cellSize);
        const cellY = Math.floor(point.y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    // 检查是否满足分离距离
    checkSeparation(point) {
        const key = this.getCellKey(point);
        
        // 检查当前单元格和相邻单元格
        const [cx, cy] = key.split(',').map(Number);
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const neighborKey = `${cx + dx},${cy + dy}`;
                const neighbor = this.grid.get(neighborKey);
                
                if (neighbor && point.distance(neighbor) < this.dsep) {
                    return false;  // 距离太近
                }
            }
        }
        
        return true;
    }
    
    // 添加点到网格
    add(point) {
        const key = this.getCellKey(point);
        this.grid.set(key, point.clone());
    }
    
    // 清除网格
    clear() {
        this.grid.clear();
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/spatial/GridStorage.js
git commit -m "feat: add GridStorage for spatial hashing and separation checking"
```

---

### Task 7: 创建 StreamlineGenerator

**Files:**
- Create: `src/generators/StreamlineGenerator.js`

- [ ] **Step 1: 创建 StreamlineGenerator 类**

```javascript
// src/generators/StreamlineGenerator.js
import { Vector } from '../core/Vector.js';
import { RK4Integrator } from '../integrators/RK4Integrator.js';
import { GridStorage } from '../spatial/GridStorage.js';

export class StreamlineGenerator {
    constructor(tensorField, params = {}) {
        this.tensorField = tensorField;
        this.params = {
            dsep: params.dsep || 30,           // 道路间距
            stepSize: params.stepSize || 1.0,   // 积分步长
            maxIterations: params.maxIterations || 200,
            minLength: params.minLength || 50,
            ...params
        };
        
        this.integrator = new RK4Integrator(this.params.stepSize);
        this.gridStorage = new GridStorage(this.params.dsep);
    }
    
    // 生成单条流线
    generateStreamline(startPoint, useMajorDirection = true) {
        const streamline = {
            points: [],
            isMajor: useMajorDirection
        };
        
        const getDirection = (tensor) => tensor.getDirection(useMajorDirection);
        
        const shouldStop = (point, path) => {
            // 超出边界
            if (Math.abs(point.x) > 500 || Math.abs(point.y) > 500) {
                return true;
            }
            
            // 不满足分离距离
            if (!this.gridStorage.checkSeparation(point)) {
                return true;
            }
            
            return false;
        };
        
        // 正向积分
        const forwardPath = this.integrator.integratePath(
            startPoint,
            getDirection,
            this.tensorField,
            this.params.maxIterations,
            shouldStop
        );
        
        // 反向积分
        const backwardPath = this.integrator.integratePath(
            startPoint,
            (tensor) => getDirection(tensor).multiply(-1),
            this.tensorField,
            this.params.maxIterations,
            shouldStop
        );
        
        // 合并路径（反向 + 起点 + 正向）
        streamline.points = [
            ...backwardPath.reverse(),
            ...forwardPath.slice(1)
        ];
        
        // 添加到网格
        for (const point of streamline.points) {
            this.gridStorage.add(point);
        }
        
        return streamline;
    }
    
    // 生成所有主干道
    generateMajorRoads(edgePoints) {
        const streamlines = [];
        
        for (const point of edgePoints) {
            const streamline = this.generateStreamline(point, true);
            
            if (streamline.points.length > this.params.minLength) {
                streamlines.push(streamline);
            }
        }
        
        return streamlines;
    }
    
    // 生成所有支路
    generateMinorRoads(edgePoints) {
        const streamlines = [];
        
        for (const point of edgePoints) {
            const streamline = this.generateStreamline(point, false);
            
            if (streamline.points.length > this.params.minLength) {
                streamlines.push(streamline);
            }
        }
        
        return streamlines;
    }
    
    // 清除状态
    clear() {
        this.gridStorage.clear();
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/generators/StreamlineGenerator.js
git commit -m "feat: add StreamlineGenerator for road network generation"
```

---

## 阶段四：图和多边形

### Task 8: 创建 GraphBuilder

**Files:**
- Create: `src/generators/GraphBuilder.js`

- [ ] **Step 1: 创建 GraphBuilder 类**

```javascript
// src/generators/GraphBuilder.js
import { Vector, distance } from '../core/Vector.js';

export class Node {
    constructor(position) {
        this.position = position;
        this.neighbors = new Set();
        this.segments = new Set();
    }
    
    addNeighbor(node) {
        this.neighbors.add(node);
        node.neighbors.add(this);
    }
}

export class GraphBuilder {
    constructor(streamlines) {
        this.streamlines = streamlines;
        this.nodes = [];
        this.edges = [];
    }
    
    // 构建图
    buildGraph() {
        // 1. 找到所有交点
        const intersections = this.findIntersections();
        
        // 2. 为每个交点创建节点
        const nodeMap = new Map();
        for (const point of intersections) {
            const node = new Node(point);
            this.nodes.push(node);
            nodeMap.set(this.pointKey(point), node);
        }
        
        // 3. 沿流线连接节点
        for (const streamline of this.streamlines) {
            this.connectNodesAlongStreamline(streamline, nodeMap);
        }
        
        // 4. 创建边列表
        this.buildEdgeList();
        
        // 5. 删除悬挂节点（可选）
        this.removeDanglingNodes();
        
        return { nodes: this.nodes, edges: this.edges };
    }
    
    // 找到所有交点
    findIntersections() {
        const intersections = new Set();
        const keySet = new Set();
        
        for (let i = 0; i < this.streamlines.length; i++) {
            for (let j = i + 1; j < this.streamlines.length; j++) {
                const points1 = this.streamlines[i].points;
                const points2 = this.streamlines[j].points;
                
                // 简化：检查点之间的距离
                for (const p1 of points1) {
                    for (const p2 of points2) {
                        if (distance(p1, p2) < 2) {
                            const key = this.pointKey(p1);
                            if (!keySet.has(key)) {
                                intersections.add(p1);
                                keySet.add(key);
                            }
                        }
                    }
                }
            }
        }
        
        return Array.from(intersections);
    }
    
    // 沿流线连接节点
    connectNodesAlongStreamline(streamline, nodeMap) {
        let lastNode = null;
        
        for (const point of streamline.points) {
            const key = this.pointKey(point);
            const node = nodeMap.get(key);
            
            if (node) {
                if (lastNode) {
                    lastNode.addNeighbor(node);
                }
                lastNode = node;
            }
        }
    }
    
    // 创建边列表
    buildEdgeList() {
        const edgeSet = new Set();
        
        for (const node of this.nodes) {
            for (const neighbor of node.neighbors) {
                const key = [node, neighbor].sort().join('-');
                if (!edgeSet.has(key)) {
                    this.edges.push({
                        from: node,
                        to: neighbor,
                        length: distance(node.position, neighbor.position)
                    });
                    edgeSet.add(key);
                }
            }
        }
    }
    
    // 删除悬挂节点
    removeDanglingNodes() {
        const initialCount = this.nodes.length;
        
        this.nodes = this.nodes.filter(node => {
            return node.neighbors.size >= 2;
        });
        
        console.log(`Removed ${initialCount - this.nodes.length} dangling nodes`);
    }
    
    pointKey(point) {
        return `${Math.round(point.x)},${Math.round(point.y)}`;
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/generators/GraphBuilder.js
git commit -m "feat: add GraphBuilder for road network graph construction"
```

---

### Task 9: 创建 PolygonFinder

**Files:**
- Create: `src/generators/PolygonFinder.js`

- [ ] **Step 1: 创建 PolygonFinder 类**

```javascript
// src/generators/PolygonFinder.js
import { Vector } from '../core/Vector.js';

export class PolygonFinder {
    constructor(graph, params = {}) {
        this.graph = graph;
        this.params = {
            maxLength: params.maxLength || 500,
            ...params
        };
    }
    
    // 查找所有多边形
    findPolygons() {
        const polygons = [];
        const traversedEdges = new Set();
        
        for (const node of this.graph.nodes) {
            if (node.neighbors.size < 2) continue;
            
            for (const nextNode of node.neighbors) {
                const edgeKey = this.edgeKey(node, nextNode);
                if (traversedEdges.has(edgeKey)) continue;
                
                const polygon = this.recursiveWalk([node, nextNode], traversedEdges);
                
                if (polygon !== null && polygon.length < this.params.maxLength) {
                    this.removePolygonAdjacencies(polygon, traversedEdges);
                    polygons.push(polygon.map(n => n.position.clone()));
                }
            }
        }
        
        return polygons;
    }
    
    // 右手定则递归行走
    recursiveWalk(path, traversedEdges) {
        const current = path[path.length - 2];
        const next = path[path.length - 1];
        
        // 找到最右的邻居
        const rightNeighbor = this.findRightmostNeighbor(current, next);
        
        if (rightNeighbor === path[0]) {
            // 回到起点，多边形闭合
            return path;
        }
        
        if (path.includes(rightNeighbor)) {
            // 遇到非起点的已访问节点，无效多边形
            return null;
        }
        
        const edgeKey = this.edgeKey(next, rightNeighbor);
        if (traversedEdges.has(edgeKey)) {
            return null;
        }
        
        path.push(rightNeighbor);
        return this.recursiveWalk(path, traversedEdges);
    }
    
    // 找到最右的邻居
    findRightmostNeighbor(from, to) {
        const incoming = to.position.sub(from.position).normalize();
        
        let bestNeighbor = null;
        let bestDot = -Infinity;
        
        for (const neighbor of to.neighbors) {
            if (neighbor === from) continue;
            
            const outgoing = neighbor.position.sub(to.position).normalize();
            const right = incoming.perpendicular();
            const dot = right.dot(outgoing);
            
            if (dot > bestDot) {
                bestDot = dot;
                bestNeighbor = neighbor;
            }
        }
        
        return bestNeighbor || Array.from(to.neighbors)[0];
    }
    
    // 标记多边形的边为已遍历
    removePolygonAdjacencies(polygon, traversedEdges) {
        for (let i = 0; i < polygon.length; i++) {
            const next = polygon[(i + 1) % polygon.length];
            const key = this.edgeKey(polygon[i], next);
            traversedEdges.add(key);
        }
    }
    
    edgeKey(a, b) {
        return [a, b].sort().join('-');
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/generators/PolygonFinder.js
git commit -m "feat: add PolygonFinder using right-hand rule for city block detection"
```

---

### Task 10: 创建 LotSubdivider

**Files:**
- Create: `src/generators/LotSubdivider.js`

- [ ] **Step 1: 创建 LotSubdivider 类**

```javascript
// src/generators/LotSubdivider.js
import { Vector, distance } from '../core/Vector.js';

export class LotSubdivider {
    constructor(params = {}) {
        this.params = {
            minArea: params.minArea || 200,
            chanceNoDivide: params.chanceNoDivide || 0.3,
            minEdgeLength: params.minEdgeLength || 10,
            ...params
        };
    }
    
    // 细分多边形为地块
    subdividePolygon(polygon) {
        const area = this.calculateArea(polygon);
        
        if (area < this.params.minArea) {
            return [polygon];
        }
        
        if (Math.random() < this.params.chanceNoDivide) {
            return [polygon];
        }
        
        const [p1, p2, edgeIndex] = this.findLongestEdge(polygon);
        
        if (distance(p1, p2) < this.params.minEdgeLength) {
            return [polygon];
        }
        
        // 创建分割线
        const midpoint = p1.add(p2).multiply(0.5);
        const perpendicular = p2.sub(p1).perpendicular().normalize();
        
        // 分割多边形
        const [poly1, poly2] = this.splitPolygon(polygon, midpoint, perpendicular, edgeIndex);
        
        if (!poly1 || !poly2) {
            return [polygon];
        }
        
        // 递归分割
        return [
            ...this.subdividePolygon(poly1),
            ...this.subdividePolygon(poly2)
        ];
    }
    
    // 找到最长边
    findLongestEdge(polygon) {
        let maxLen = 0;
        let longestEdge = [polygon[0], polygon[1]];
        let edgeIndex = 0;
        
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            const len = distance(p1, p2);
            
            if (len > maxLen) {
                maxLen = len;
                longestEdge = [p1, p2];
                edgeIndex = i;
            }
        }
        
        return [longestEdge[0], longestEdge[1], edgeIndex];
    }
    
    // 分割多边形
    splitPolygon(polygon, splitPoint, direction, edgeIndex) {
        // 简化实现：找到方向上的最远点
        let maxDist = 0;
        let farPoint = null;
        let farIndex = -1;
        
        for (let i = 0; i < polygon.length; i++) {
            const dist = polygon[i].sub(splitPoint).dot(direction);
            if (dist > maxDist) {
                maxDist = dist;
                farPoint = polygon[i];
                farIndex = i;
            }
        }
        
        if (!farPoint || farIndex === -1) {
            return [null, null];
        }
        
        // 创建两个多边形
        const poly1 = polygon.slice(0, edgeIndex + 1);
        poly1.push(splitPoint);
        poly1.push(farPoint);
        
        const poly2 = polygon.slice(edgeIndex + 1);
        poly2.push(farPoint);
        poly2.push(splitPoint);
        
        return [poly1, poly2];
    }
    
    // 计算多边形面积
    calculateArea(polygon) {
        let area = 0;
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            area += polygon[i].x * polygon[j].y;
            area -= polygon[j].x * polygon[i].y;
        }
        return Math.abs(area) / 2;
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/generators/LotSubdivider.js
git commit -m "feat: add LotSubdivider for recursive building lot subdivision"
```

---

## 阶段五：建筑生成

### Task 11: 创建 BuildingGenerator

**Files:**
- Create: `src/generators/BuildingGenerator.js`

- [ ] **Step 1: 创建 BuildingGenerator 类**

```javascript
// src/generators/BuildingGenerator.js
import * as THREE from 'three';

export class BuildingGenerator {
    constructor(params = {}) {
        this.params = {
            buildingTypes: ['shop', 'apartment', 'office', 'skyscraper'],
            ...params
        };
        
        // 建筑类型配置
        this.typeConfig = {
            shop: { minArea: 100, maxArea: 400, floors: [1, 2] },
            apartment: { minArea: 300, maxArea: 800, floors: [2, 4] },
            office: { minArea: 400, maxArea: 1000, floors: [3, 5] },
            skyscraper: { minArea: 800, maxArea: 2000, floors: [5, 8] }
        };
    }
    
    // 生成所有建筑
    generate(lots, existingFunctions = {}) {
        const buildings = [];
        
        for (const lot of lots) {
            const type = this.selectBuildingType(lot);
            const building = this.createBuilding(lot, type, existingFunctions);
            buildings.push(building);
        }
        
        return buildings;
    }
    
    // 选择建筑类型
    selectBuildingType(lot) {
        const area = lot.area || 500;
        
        if (area > 800) {
            return this.getRandomType(['skyscraper', 'office']);
        }
        if (area > 400) {
            return this.getRandomType(['apartment', 'office']);
        }
        return this.getRandomType(['shop', 'apartment']);
    }
    
    // 随机选择类型
    getRandomType(types) {
        return types[Math.floor(Math.random() * types.length)];
    }
    
    // 创建单个建筑
    createBuilding(lot, type, existingFunctions) {
        const group = new THREE.Group();
        
        // 设置位置
        const centroid = this.calculateCentroid(lot);
        group.position.set(centroid.x, 0, centroid.y);
        
        // 计算旋转
        group.rotation.y = this.calculateRotation(lot);
        
        // 使用现有函数或创建默认建筑
        if (existingFunctions.mkShop && type === 'shop') {
            const shop = existingFunctions.mkShop(0, 0, 0);
            group.add(shop);
        } else if (existingFunctions.mkApartment && type === 'apartment') {
            const floors = this.typeConfig.apartment.floors[0] + 
                          Math.floor(Math.random() * this.typeConfig.apartment.floors[1]);
            const apt = existingFunctions.mkApartment(0, 0, 0, floors);
            group.add(apt);
        } else {
            // 默认建筑
            const building = this.createDefaultBuilding(lot, type);
            group.add(building);
        }
        
        return group;
    }
    
    // 创建默认建筑
    createDefaultBuilding(lot, type) {
        const group = new THREE.Group();
        const floors = Math.floor(Math.random() * 3) + 1;
        const floorHeight = 8;
        const height = floors * floorHeight;
        
        // 主体
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(10, height, 10),
            new THREE.MeshStandardMaterial({ color: 0xA8D5BA })
        );
        body.position.y = height / 2;
        body.castShadow = true;
        group.add(body);
        
        // 屋顶
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(11, 0.5, 11),
            new THREE.MeshStandardMaterial({ color: 0x8A8A8A })
        );
        roof.position.y = height + 0.25;
        group.add(roof);
        
        return group;
    }
    
    // 计算多边形中心
    calculateCentroid(polygon) {
        let x = 0, y = 0;
        for (const point of polygon) {
            x += point.x;
            y += point.y;
        }
        return { x: x / polygon.length, y: y / polygon.length };
    }
    
    // 计算旋转角度
    calculateRotation(polygon) {
        if (polygon.length < 2) return 0;
        
        const p1 = polygon[0];
        const p2 = polygon[1];
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/generators/BuildingGenerator.js
git commit -m "feat: add BuildingGenerator for procedural building placement"
```

---

## 阶段六：城市生成器

### Task 12: 创建 CityGenerator 主类

**Files:**
- Create: `src/CityGenerator.js`

- [ ] **Step 1: 创建 CityGenerator 类**

```javascript
// src/CityGenerator.js
import * as THREE from 'three';
import { TensorField } from './fields/TensorField.js';
import { StreamlineGenerator } from './generators/StreamlineGenerator.js';
import { GraphBuilder } from './generators/GraphBuilder.js';
import { PolygonFinder } from './generators/PolygonFinder.js';
import { LotSubdivider } from './generators/LotSubdivider.js';
import { BuildingGenerator } from './generators/BuildingGenerator.js';
import { StreetFurnitureGenerator } from './generators/StreetFurnitureGenerator.js';

export class CityGenerator {
    constructor(params = {}) {
        this.params = {
            dsep: params.dsep || 30,           // 道路间距
            minLotArea: params.minLotArea || 200,
            chanceNoDivide: params.chanceNoDivide || 0.3,
            citySize: params.citySize || 400,
            ...params
        };
        
        this.tensorField = new TensorField();
    }
    
    // 生成城市
    async generate(existingFunctions = {}) {
        console.log('🏗️  Starting city generation...');
        
        // 步骤 1: 创建张量场
        this.createTensorFields();
        
        // 步骤 2: 生成道路网络
        const streamlines = this.generateRoadNetwork();
        
        // 步骤 3: 构建图
        const graphBuilder = new GraphBuilder(streamlines);
        const graph = graphBuilder.buildGraph();
        
        // 步骤 4: 查找城市街区
        const polygonFinder = new PolygonFinder(graph);
        const cityBlocks = polygonFinder.findPolygons();
        
        // 步骤 5: 细分地块
        const lotSubdivider = new LotSubdivider({
            minArea: this.params.minLotArea,
            chanceNoDivide: this.params.chanceNoDivide
        });
        const buildingLots = [];
        for (const block of cityBlocks) {
            const lots = lotSubdivider.subdividePolygon(block);
            buildingLots.push(...lots);
        }
        
        // 步骤 6: 生成建筑
        const buildingGenerator = new BuildingGenerator();
        const buildings = buildingGenerator.generate(buildingLots, existingFunctions);
        
        // 步骤 7: 生成街道设施
        const furnitureGenerator = new StreetFurnitureGenerator();
        const furniture = furnitureGenerator.generate(graph, buildings);
        
        console.log(`✅ City generation complete!`);
        console.log(`   - ${streamlines.length} road streamlines`);
        console.log(`   - ${graph.nodes.length} graph nodes`);
        console.log(`   - ${cityBlocks.length} city blocks`);
        console.log(`   - ${buildingLots.length} building lots`);
        console.log(`   - ${buildings.length} buildings`);
        
        return {
            graph,
            buildings,
            furniture,
            blocks: cityBlocks,
            lots: buildingLots,
            streamlines
        };
    }
    
    // 创建张量场
    createTensorFields() {
        // 添加网格场（市中心平行街道）
        this.tensorField.addGridField(0, 0, 300, 300, 0, 1.0);
        this.tensorField.addGridField(0, 0, 300, 300, Math.PI / 2, 1.0);
        
        // 添加径向场（曲线郊区街道）
        this.tensorField.addRadialField(200, 200, 0.5);
        this.tensorField.addRadialField(-200, -200, 0.5);
    }
    
    // 生成道路网络
    generateRoadNetwork() {
        const streamlineGen = new StreamlineGenerator(this.tensorField, {
            dsep: this.params.dsep,
            minLength: 50
        });
        
        // 获取边缘点
        const edgePoints = this.getEdgePoints();
        
        // 生成主干道
        const majorStreamlines = streamlineGen.generateMajorRoads(edgePoints);
        
        // 生成支路
        const minorStreamlines = streamlineGen.generateMinorRoads(edgePoints);
        
        return [...majorStreamlines, ...minorStreamlines];
    }
    
    // 获取边缘点（用于开始流线积分）
    getEdgePoints() {
        const points = [];
        const size = this.params.citySize / 2;
        const step = 30;
        
        // 四个边缘
        for (let x = -size; x <= size; x += step) {
            points.push(new THREE.Vector3(x, 0, -size));
            points.push(new THREE.Vector3(x, 0, size));
        }
        for (let z = -size; z <= size; z += step) {
            points.push(new THREE.Vector3(-size, 0, z));
            points.push(new THREE.Vector3(size, 0, z));
        }
        
        return points;
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/CityGenerator.js
git commit -m "feat: add CityGenerator main class for procedural city generation"
```

---

## 阶段七：集成到 game.js

### Task 13: 创建 StreetFurnitureGenerator 占位实现

**Files:**
- Create: `src/generators/StreetFurnitureGenerator.js`

- [ ] **Step 1: 创建简单的 StreetFurnitureGenerator**

```javascript
// src/generators/StreetFurnitureGenerator.js
import * as THREE from 'three';

export class StreetFurnitureGenerator {
    generate(graph, buildings) {
        const furniture = [];
        
        // 简单实现：在建筑周围随机放置一些设施
        for (const building of buildings) {
            if (Math.random() < 0.3) {
                // 添加一个简单的路灯
                const light = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.4, 10, 8),
                    new THREE.MeshStandardMaterial({ color: 0x8A8A8A })
                );
                light.position.set(
                    building.position.x + 15,
                    5,
                    building.position.z
                );
                furniture.push(light);
            }
        }
        
        return furniture;
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/generators/StreetFurnitureGenerator.js
git commit -m "feat: add basic StreetFurnitureGenerator placeholder"
```

---

### Task 14: 修改 game.js 集成城市生成器

**Files:**
- Modify: `game.js:1-10` (添加导入)
- Modify: `game.js:init()` (调用城市生成器)

- [ ] **Step 1: 在 game.js 顶部添加导入**

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CityGenerator } from './src/CityGenerator.js';  // 新增
```

- [ ] **Step 2: 修改 init() 函数**

找到 `createScenery();` 这一行，替换为：

```javascript
// 生成程序化城市
const cityParams = {
    dsep: 30,
    minLotArea: 200,
    chanceNoDivide: 0.3,
    citySize: 400
};

const cityGenerator = new CityGenerator(cityParams);
const city = await cityGenerator.generate({
    mkShop,
    mkApartment,
    mkOffice,
    mkSkyscraper
});

// 将建筑添加到场景
for (const building of city.buildings) {
    scene.add(building);
}

// 将街道设施添加到场景
for (const item of city.furniture) {
    scene.add(item);
}
```

- [ ] **Step 3: 修改 init 为 async 函数**

```javascript
async function init() {
    clock = new THREE.Clock();
    // ... 其余代码不变
}
```

- [ ] **Step 4: 提交**

```bash
git add game.js
git commit -m "feat: integrate procedural city generator into game.js"
```

---

## 阶段八：测试和验收

### Task 15: 视觉验收

**Files:**
- 无需修改

- [ ] **Step 1: 启动本地服务器**

```bash
cd /Users/joeytoday/github-repo/qwen-code-examples/demo-3.6plus/cyble-city
python3 -m http.server 8080
```

- [ ] **Step 2: 在浏览器中打开**

```
http://localhost:8080/index.html
```

- [ ] **Step 3: 验收检查**

- [ ] 城市布局每次刷新不同
- [ ] 道路连接性良好，无断头路
- [ ] 建筑风格与 Tile Pack City 3 参考图一致
- [ ] 人物可以正常跑动
- [ ] 视角跟随正常工作
- [ ] FPS 稳定在 60 帧

- [ ] **Step 4: 提交验收结果**

```bash
git add docs/acceptance-checklist.md
git commit -m "docs: add visual acceptance checklist"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-02-procedural-city-implementation.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
