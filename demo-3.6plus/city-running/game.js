import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==================== CONSTANTS ====================
// 场景尺寸
const TS = 400, TW = 30, LAPS = 3, CS = 3;

// 人类跑步物理参数 - 基于真实数据
// 普通人慢跑：8-10 km/h (约 2.5 m/s)
// 普通人跑步：12-15 km/h (约 3.5-4.2 m/s)
// 普通人冲刺：20-25 km/h (约 5.5-7 m/s)
// 世界纪录（博尔特）：最高 44.72 km/h (约 12.4 m/s)
// 这里使用健康成年人的跑步参数
const MAX_SPEED = 7.5, MAX_REVERSE = 2; // m/s (约 27 km/h 冲刺，7 km/h 后退)
const ACCEL = 0.05, BRAKE = 0.08;  // 人类加减速更平缓
const FRICTION = 0.98, STEER_SPEED = 0.04, MAX_STEER = 0.08;
const DRIFT_FRICTION = 0.97, DRIFT_STEER_MULT = 1.8;

// 道路系统参数
const ROAD_WIDTH = 35;      // 主道路宽度（单位）
const SIDEWALK_WIDTH = 8;   // 人行道宽度
const LANE_WIDTH = 10;      // 车道宽度

// Tile Pack City 3 风格配色
const COLORS = {
    // 建筑外墙
    wallMint: '#A8D5BA',
    wallBlue: '#A8C8D5',
    wallPink: '#F5D5D5',
    wallYellow: '#F5E5A8',
    wallGreen: '#C8E5A8',
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

// ==================== STATE ====================
let started = false, scene, camera, renderer, clock, car, mixer;
let acts = {}, curAnim = 'idle';
let obs = [], cps = [], tb = {};
let laps = 0, lapT = 0, bestLap = Infinity;
let camMode = 0, orbitCtrl;
let gTime = 0, fCnt = 0, fps = 60, lastFps = 0;
const st = { x: 0, z: 0, spd: 0, str: 0, h: 0, drift: false, lastCP: -1 };
const keys = {};
const cam = { x: 0, y: 30, z: -50, lx: 0, ly: 5, lz: 0 };
let minimapCtx;

// 动态交通系统
let trafficCars = [];

// ==================== INIT ====================
function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 50, 500);
    camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(0, 30, -50);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    orbitCtrl = new OrbitControls(camera, renderer.domElement);
    orbitCtrl.enabled = false;

    // Minimap context
    const mc = document.getElementById('minimap-canvas');
    minimapCtx = mc.getContext('2d');

    setupLight();
    createGround();
    createTrack();
    createObs();
    createCPs();
    createScenery();
    loadModel();
    setupEvents();
    animate();
}

// ==================== LIGHTING ====================
function setupLight() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemi.position.set(0, 20, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(3, 10, 10);
    dir.castShadow = true;
    dir.shadow.camera.top = 200;
    dir.shadow.camera.bottom = -200;
    dir.shadow.camera.left = -200;
    dir.shadow.camera.right = 200;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    scene.add(dir);
}

// ==================== GROUND ====================
function createGround() {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: 0x999999, depthWrite: false }));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    const gr = new THREE.GridHelper(800, 40, 0x000000, 0x000000);
    gr.position.y = 0.1; gr.material.transparent = true; gr.material.opacity = 0.2;
    scene.add(gr);
}

// ==================== TRACK ====================
function createTrack() {
    const hw = TS / 2, hl = TS / 2, r = 80;
    const s = new THREE.Shape();
    s.moveTo(-hw + r, -hl); s.lineTo(hw - r, -hl);
    s.quadraticCurveTo(hw, -hl, hw, -hl + r);
    s.lineTo(hw, hl - r); s.quadraticCurveTo(hw, hl, hw - r, hl);
    s.lineTo(-hw + r, hl); s.quadraticCurveTo(-hw, hl, -hw, hl - r);
    s.lineTo(-hw, -hl + r); s.quadraticCurveTo(-hw, -hl, -hw + r, -hl);
    const iw = hw - TW, ih = hl - TW, ir = r - TW * 0.5;
    const hole = new THREE.Path();
    hole.moveTo(-iw + ir, -ih); hole.lineTo(iw - ir, -ih);
    hole.quadraticCurveTo(iw, -ih, iw, -ih + ir);
    hole.lineTo(iw, ih - ir); hole.quadraticCurveTo(iw, ih, iw - ir, ih);
    hole.lineTo(-iw + ir, ih); hole.quadraticCurveTo(-iw, ih, -iw, ih - ir);
    hole.lineTo(-iw, -ih + ir); hole.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
    s.holes.push(hole);
    const geo = new THREE.ShapeGeometry(s, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, side: THREE.DoubleSide });
    const t = new THREE.Mesh(geo, mat);
    t.rotation.x = -Math.PI / 2; t.position.y = 0.5; t.receiveShadow = true;
    scene.add(t);
    mkBorder(hw, hl, r, 0x666666);
    mkBorder(iw, ih, ir, 0x555555);
    // Start/finish line
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(TW, 4), new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide }));
    sl.rotation.x = -Math.PI / 2; sl.position.set(0, 0.6, 0); scene.add(sl);
    tb = { hw, hl, r, iw, ih, ir };
}

function mkBorder(hw, hl, r, color) {
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
    const pts = [], seg = 64;
    for (let i = 0; i <= seg / 4; i++) { const t = i / (seg / 4); pts.push(new THREE.Vector3(-hw + r + t * (2 * hw - 2 * r), 1, -hl)); }
    for (let i = 0; i <= seg / 4; i++) { const a = -Math.PI / 2 + (i / (seg / 4)) * Math.PI / 2; pts.push(new THREE.Vector3(hw + Math.cos(a) * r, 1, -hl + r + Math.sin(a) * r + r)); }
    for (let i = 0; i <= seg / 4; i++) { const t = i / (seg / 4); pts.push(new THREE.Vector3(hw, 1, -hl + r + t * (2 * hl - 2 * r))); }
    for (let i = 0; i <= seg / 4; i++) { const a = 0 + (i / (seg / 4)) * Math.PI / 2; pts.push(new THREE.Vector3(hw - r + Math.cos(a) * r, 1, hl + Math.sin(a) * r)); }
    for (let i = 0; i <= seg / 4; i++) { const t = i / (seg / 4); pts.push(new THREE.Vector3(hw - r - t * (2 * hw - 2 * r), 1, hl)); }
    for (let i = 0; i <= seg / 4; i++) { const a = Math.PI / 2 + (i / (seg / 4)) * Math.PI / 2; pts.push(new THREE.Vector3(-hw + Math.cos(a) * r, 1, hl - r + Math.sin(a) * r)); }
    for (let i = 0; i <= seg / 4; i++) { const t = i / (seg / 4); pts.push(new THREE.Vector3(-hw, 1, hl - r - t * (2 * hl - 2 * r))); }
    for (let i = 0; i <= seg / 4; i++) { const a = Math.PI + (i / (seg / 4)) * Math.PI / 2; pts.push(new THREE.Vector3(-hw - r + Math.cos(a) * r + r, 1, -hl + Math.sin(a) * r)); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
}

// ==================== OBSTACLES ====================
function createObs() {
    const cm = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.6 });
    for (let i = 0; i < 16; i++) {
        const t = i / 16 * Math.PI * 2;
        const rx = TS / 2 - TW / 2 - 15, rz = TS / 2 - TW / 2 - 15;
        const x = Math.cos(t) * rx, z = Math.sin(t) * rz;
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2, 8), cm);
        c.position.set(x, 1, z); c.castShadow = true; scene.add(c);
        obs.push({ x, z, r: 1 });
    }
    const rm = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
    [[50, 0], [-50, 80], [0, -100]].forEach(([x, z]) => {
        const r = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 12), rm);
        r.position.set(x, 1, z); r.castShadow = true; r.receiveShadow = true; scene.add(r);
    });
}

// ==================== CHECKPOINTS ====================
function createCPs() {
    const mr = (tb.hw + tb.iw) / 2, mh = (tb.hl + tb.ih) / 2;
    [{ x: 0, z: mh }, { x: mr, z: 0 }, { x: 0, z: -mh }, { x: -mr, z: 0 }].forEach((p, i) => {
        const cp = new THREE.Mesh(new THREE.BoxGeometry(TW, 6, 1), new THREE.MeshStandardMaterial({
            color: i === 0 ? 0x4caf50 : 0x2196f3,
            transparent: true, opacity: 0.15
        }));
        cp.position.set(p.x, 3, p.z); scene.add(cp);
        cps.push({ ...p, r: TW / 2 });
    });
}

// ==================== SCENERY ====================
// Tile Pack City 3 风格建筑生成器

// 辅助函数：创建窗户阵列
function createWindows(parent, w, h, rows, cols, offset = { x: 0, y: 0 }) {
    const winW = w / (cols + 1);
    const winH = h / (rows + 1);
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.windowBlue });
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const win = new THREE.Mesh(
                new THREE.BoxGeometry(winW * 0.8, winH * 0.6, 0.1),
                mat
            );
            win.position.set(
                offset.x + (col + 1) * winW - w / 2,
                offset.y + (row + 1) * winH - h / 2,
                0.05
            );
            parent.add(win);
        }
    }
}

// 建筑 1: 小型商铺（带遮阳篷）
function mkShop(x, z, rot, color) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    // 主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(12, 8, 10),
        new THREE.MeshStandardMaterial({ color: color || COLORS.wallMint })
    );
    body.position.y = 4;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    
    // 窗户
    createWindows(body, 10, 5, 1, 3, { x: 0, y: 1 });
    
    // 屋顶
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(13, 0.5, 11),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    roof.position.y = 8.25;
    roof.castShadow = true;
    g.add(roof);
    
    // 遮阳篷
    const awning = new THREE.Mesh(
        new THREE.BoxGeometry(13, 0.3, 3),
        new THREE.MeshStandardMaterial({ color: COLORS.trimOrange })
    );
    awning.position.set(0, 5.5, 5.5);
    awning.castShadow = true;
    g.add(awning);
    
    // 条纹装饰
    for (let i = 0; i < 6; i++) {
        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.4, 3),
            new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
        );
        stripe.position.set(-5 + i * 2, 5.5, 5.5);
        g.add(stripe);
    }
    
    // 圆顶装饰
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.roofOrange })
    );
    dome.position.set(0, 9.5, 0);
    g.add(dome);
    
    scene.add(g);
    return g;
}

// 建筑 2: 多层公寓（2-4 层）
function mkApartment(x, z, rot, floors, color) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    const floorH = 7;
    const w = 14;
    const d = 12;
    
    // 主体
    for (let f = 0; f < floors; f++) {
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(w, floorH, d),
            new THREE.MeshStandardMaterial({ 
                color: color || [COLORS.wallMint, COLORS.wallBlue, COLORS.wallPink][f % 3] 
            })
        );
        floor.position.y = f * floorH + floorH / 2;
        floor.castShadow = true;
        floor.receiveShadow = true;
        g.add(floor);
        
        // 每层的窗户
        createWindows(floor, w - 2, floorH - 1, 1, 4, { x: 0, y: 1 });
        createWindows(floor, d - 2, floorH - 1, 1, 3, { x: w/2 - 0.1, y: 1 });
        createWindows(floor, d - 2, floorH - 1, 1, 3, { x: -w/2 + 0.1, y: 1 });
        
        // 阳台（偶数层）
        if (f % 2 === 1 && f < floors - 1) {
            const balcony = new THREE.Mesh(
                new THREE.BoxGeometry(6, 0.3, 3),
                new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
            );
            balcony.position.set(0, f * floorH + floorH, d / 2 + 1.5);
            g.add(balcony);
            
            // 阳台栏杆
            for (let i = 0; i < 5; i++) {
                const rail = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, 1, 0.2),
                    new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
                );
                rail.position.set(-2.5 + i * 1.25, f * floorH + floorH + 0.5, d / 2 + 1.5);
                g.add(rail);
            }
        }
    }
    
    // 屋顶设备
    const ac = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 2),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    ac.position.set(3, floors * floorH + 0.75, -3);
    g.add(ac);
    
    scene.add(g);
    return g;
}

// 建筑 3: 现代办公楼（玻璃幕墙）
function mkOffice(x, z, rot, height) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    const w = 16;
    const d = 14;
    const floorH = 8;
    const floors = height;
    
    // 玻璃主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, floors * floorH, d),
        new THREE.MeshStandardMaterial({ 
            color: COLORS.windowBlue,
            roughness: 0.1,
            metalness: 0.8
        })
    );
    body.position.y = floors * floorH / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    
    // 窗框网格
    const frameMat = new THREE.MeshStandardMaterial({ color: COLORS.roofWhite });
    for (let f = 0; f < floors; f++) {
        for (let i = 0; i <= 4; i++) {
            const hFrame = new THREE.Mesh(
                new THREE.BoxGeometry(w, 0.3, 0.2),
                frameMat
            );
            hFrame.position.set(0, f * floorH + floorH * 0.2, d / 2 + 0.1);
            g.add(hFrame);
        }
        for (let i = 0; i <= 3; i++) {
            const vFrame = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, floorH, 0.2),
                frameMat
            );
            vFrame.position.set(-w/2 + i * w/3, f * floorH + floorH/2, d/2 + 0.1);
            g.add(vFrame);
        }
    }
    
    // 屋顶
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(w + 1, 0.5, d + 1),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    roof.position.y = floors * floorH + 0.25;
    g.add(roof);
    
    scene.add(g);
    return g;
}

// 建筑 4: 医院（带红十字）
function mkHospital(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    // 主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(20, 12, 16),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    body.position.y = 6;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    
    // 窗户
    createWindows(body, 18, 8, 1, 5, { x: 0, y: 2 });
    
    // 红十字标志
    const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(2, 5, 0.3),
        new THREE.MeshStandardMaterial({ color: COLORS.trimRed })
    );
    crossV.position.set(0, 7, 8.1);
    g.add(crossV);
    
    const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(5, 2, 0.3),
        new THREE.MeshStandardMaterial({ color: COLORS.trimRed })
    );
    crossH.position.set(0, 7, 8.1);
    g.add(crossH);
    
    // 屋顶
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(21, 0.5, 17),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    roof.position.y = 12.25;
    g.add(roof);
    
    // 屋顶设备
    const vent = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 3),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    vent.position.set(5, 13.5, -5);
    g.add(vent);
    
    scene.add(g);
    return g;
}

// 建筑 5: 消防局（红色）
function mkFireStation(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    // 主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(18, 10, 14),
        new THREE.MeshStandardMaterial({ color: COLORS.trimRed })
    );
    body.position.y = 5;
    body.castShadow = true;
    g.add(body);
    
    // 白色顶部
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(18, 3, 14),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    top.position.y = 11.5;
    g.add(top);
    
    // 星形标志（简化为菱形）
    const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(2, 0),
        new THREE.MeshStandardMaterial({ color: COLORS.windowBlue })
    );
    star.position.set(0, 6, 7.1);
    g.add(star);
    
    // 车库门
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 0.2),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    door.position.set(0, 3, 7.1);
    g.add(door);
    
    scene.add(g);
    return g;
}

// 建筑 6: 古典建筑（带圆柱）
function mkClassical(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    // 基座
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(20, 12, 14),
        new THREE.MeshStandardMaterial({ color: COLORS.wallCream })
    );
    base.position.y = 6;
    base.castShadow = true;
    g.add(base);
    
    // 圆柱（正面）
    for (let i = 0; i < 4; i++) {
        const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 10, 8),
            new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
        );
        col.position.set(-6 + i * 4, 8, 8);
        col.castShadow = true;
        g.add(col);
    }
    
    // 三角山墙
    const pediment = new THREE.Mesh(
        new THREE.ConeGeometry(12, 5, 4),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    pediment.rotation.y = Math.PI / 4;
    pediment.position.set(0, 13, 0);
    pediment.scale.z = 0.3;
    g.add(pediment);
    
    // 屋顶
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(21, 0.5, 15),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    roof.position.y = 12.25;
    g.add(roof);
    
    scene.add(g);
    return g;
}

// 建筑 7: 教堂（带圆顶）
function mkChurch(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    // 主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(16, 14, 20),
        new THREE.MeshStandardMaterial({ color: COLORS.wallPink })
    );
    body.position.y = 7;
    body.castShadow = true;
    g.add(body);
    
    // 圆顶基座
    const domeBase = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 6, 6, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.wallCream })
    );
    domeBase.position.y = 17;
    g.add(domeBase);
    
    // 圆顶
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: COLORS.trimPurple })
    );
    dome.position.y = 20;
    g.add(dome);
    
    // 尖顶
    const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 4, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.trimPurple })
    );
    spire.position.y = 24.5;
    g.add(spire);
    
    // 拱形窗户
    const winMat = new THREE.MeshStandardMaterial({ color: COLORS.windowDark });
    for (let i = 0; i < 3; i++) {
        const win = new THREE.Mesh(
            new THREE.BoxGeometry(2, 4, 0.2),
            winMat
        );
        win.position.set(-5 + i * 5, 8, 10.1);
        g.add(win);
    }
    
    scene.add(g);
    return g;
}

// 街道设施：路灯
function mkStreetLight(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    
    // 灯杆
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 10, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    pole.position.y = 5;
    pole.castShadow = true;
    g.add(pole);
    
    // 灯头
    const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.5, 1.5),
        new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
    );
    lamp.position.set(1, 10, 0);
    g.add(lamp);
    
    // 灯泡（发光）
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({ 
            color: COLORS.wallCream,
            emissive: COLORS.wallCream,
            emissiveIntensity: 0.5
        })
    );
    bulb.position.set(1.5, 9.8, 0);
    g.add(bulb);
    
    scene.add(g);
    return g;
}

// 街道设施：低多边形树
function mkTree(x, z, type) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    
    // 树干
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.8, 4, 6),
        new THREE.MeshStandardMaterial({ color: COLORS.roofBrown })
    );
    trunk.position.y = 2;
    trunk.castShadow = true;
    g.add(trunk);
    
    // 树冠
    const foliage = new THREE.Mesh(
        type === 'pine' 
            ? new THREE.ConeGeometry(2.5, 6, 6)
            : new THREE.IcosahedronGeometry(3, 0),
        new THREE.MeshStandardMaterial({ color: COLORS.grass })
    );
    foliage.position.y = type === 'pine' ? 6 : 5;
    foliage.castShadow = true;
    g.add(foliage);
    
    scene.add(g);
    return g;
}

// 街道设施：车辆
function mkCar(x, z, rot, color) {
    const g = new THREE.Group();
    g.position.set(x, 0.5, z);
    g.rotation.y = rot;
    
    // 车身
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 3),
        new THREE.MeshStandardMaterial({ color: color })
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

// 街道设施：长椅
function mkBench(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    
    // 座位
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.3, 1.5),
        new THREE.MeshStandardMaterial({ color: COLORS.wallCream })
    );
    seat.position.y = 1;
    g.add(seat);
    
    // 靠背
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.5, 0.2),
        new THREE.MeshStandardMaterial({ color: COLORS.wallCream })
    );
    back.position.set(0, 1.85, -0.6);
    g.add(back);
    
    // 腿
    const legGeo = new THREE.BoxGeometry(0.3, 1, 1.5);
    [[-1.5, 0], [1.5, 0]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: COLORS.roofGray }));
        leg.position.set(x, 0.5, z);
        g.add(leg);
    });
    
    scene.add(g);
    return g;
}

// 建筑 8: 摩天大楼（扭曲造型）
function mkSkyscraper(x, z, rot, height, type) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    const w = 18;
    const d = 16;
    const floorH = 10;
    const floors = height;

    // 分段式主体（每段稍微旋转）
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

// 主 scenery 函数
function createScenery() {
    const outerRadius = 220;
    const innerRadius = 140;

    // === 北侧建筑 ===
    mkShop(-150, -outerRadius + 20, 0, COLORS.wallYellow);
    mkApartment(-100, -outerRadius + 25, 0, 3, COLORS.wallBlue);
    mkOffice(-40, -outerRadius + 30, 0, 4);
    mkSkyscraper(30, -outerRadius + 35, 0, 5, 'glass'); // 玻璃摩天大楼
    mkApartment(80, -outerRadius + 25, 0, 2, COLORS.wallPink);
    mkFireStation(140, -outerRadius + 25, 0);

    // === 东侧建筑 ===
    mkHospital(outerRadius - 25, -80, Math.PI / 2);
    mkSkyscraper(outerRadius - 35, -20, Math.PI / 2, 6, 'glass'); // 高层办公楼
    mkApartment(outerRadius - 25, 40, Math.PI / 2, 3, COLORS.wallGreen);
    mkClassical(outerRadius - 30, 100, Math.PI / 2);

    // === 南侧建筑 ===
    mkChurch(120, outerRadius - 30, Math.PI);
    mkMall(60, outerRadius - 35, Math.PI); // 购物中心
    mkShop(10, outerRadius - 20, Math.PI, COLORS.wallPeach);
    mkOffice(-50, outerRadius - 30, Math.PI, 4);
    mkSkyscraper(-110, outerRadius - 40, Math.PI, 5, 'concrete'); // 混凝土摩天大楼
    mkShop(-160, outerRadius - 20, Math.PI, COLORS.wallBlue);

    // === 西侧建筑 ===
    mkStadium(-outerRadius + 40, 0, 0); // 体育馆
    mkOffice(-outerRadius + 30, 60, -Math.PI / 2, 3);
    mkApartment(-outerRadius + 25, -50, -Math.PI / 2, 3, COLORS.wallPink);
    mkFireStation(-outerRadius + 25, -120, -Math.PI / 2);

    // === 内圈装饰（赛道内侧）===
    // 公园区域 - 树木
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * innerRadius;
        const z = Math.sin(angle) * innerRadius;
        mkTree(x, z, i % 3 === 0 ? 'pine' : 'round');
    }

    // 中心区域装饰
    mkBench(-30, 30, 0);
    mkBench(30, 30, 0);
    mkBench(0, -40, Math.PI / 4);
    mkFlowerBed(-20, 50);
    mkFlowerBed(20, 50);

    // === 街道设施：沿轨道外圈路灯 ===
    for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const x = Math.cos(angle) * (outerRadius - 10);
        const z = Math.sin(angle) * (outerRadius - 10);
        mkStreetLight(x, z);
    }

    // === 交通信号灯（十字路口）===
    mkTrafficLight(-120, -outerRadius + 15, 0);
    mkTrafficLight(120, -outerRadius + 15, Math.PI);
    mkTrafficLight(outerRadius - 15, -60, Math.PI / 2);
    mkTrafficLight(outerRadius - 15, 60, Math.PI / 2);
    mkTrafficLight(-outerRadius + 15, 60, -Math.PI / 2);
    mkTrafficLight(-outerRadius + 15, -60, -Math.PI / 2);

    // === 垃圾桶（沿人行道）===
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const x = Math.cos(angle) * (outerRadius - 8);
        const z = Math.sin(angle) * (outerRadius - 8);
        mkTrashCan(x, z);
    }

    // === 邮筒（间隔放置）===
    mkMailbox(-80, -outerRadius + 18);
    mkMailbox(80, -outerRadius + 18);
    mkMailbox(outerRadius - 18, 0);
    mkMailbox(-80, outerRadius - 18);
    mkMailbox(80, outerRadius - 18);
    mkMailbox(-outerRadius + 18, 0);

    // === 消防栓（靠近建筑）===
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * (outerRadius - 6);
        const z = Math.sin(angle) * (outerRadius - 6);
        mkHydrant(x, z);
    }

    // === 自行车停放架（靠近商业区）===
    mkBikeRack(-140, -outerRadius + 25, 0);
    mkBikeRack(10, -outerRadius + 35, 0);
    mkBikeRack(outerRadius - 20, -20, Math.PI / 2);
    mkBikeRack(50, outerRadius - 40, Math.PI);

    // === 路牌 ===
    mkSign(-100, -outerRadius + 15, 0);
    mkSign(100, -outerRadius + 15, Math.PI);
    mkSign(outerRadius - 15, 80, Math.PI / 2);
    mkSign(-outerRadius + 15, -80, -Math.PI / 2);

    // === 停放的车辆（轨道外侧，增加密度）===
    const carColors = [COLORS.trimRed, COLORS.wallYellow, COLORS.wallBlue, COLORS.wallGreen, COLORS.wallPink, COLORS.wallPeach];
    for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const x = Math.cos(angle) * (outerRadius - 5);
        const z = Math.sin(angle) * (outerRadius - 5);
        mkCar(x, z, angle + Math.PI / 2, carColors[i % 6]);
    }

    // === 出租车（随机分布）===
    mkTaxi(-60, -outerRadius + 18, 0);
    mkTaxi(60, -outerRadius + 18, Math.PI);
    mkTaxi(outerRadius - 18, 40, Math.PI / 2);
    mkTaxi(-outerRadius + 18, -40, -Math.PI / 2);

    // === 警车（关键位置）===
    mkPoliceCar(0, -outerRadius + 18, 0);
    mkPoliceCar(outerRadius - 18, 0, Math.PI / 2);

    // === 公交车（站点）===
    mkBus(-120, -outerRadius + 10, 0);
    mkBus(120, outerRadius - 10, Math.PI);

    // === 花坛（装饰性）===
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * (outerRadius - 3);
        const z = Math.sin(angle) * (outerRadius - 3);
        mkFlowerBed(x, z);
    }
}

// ==================== MODEL ====================
function loadModel() {
    const ld = document.getElementById('loading');
    ld.style.display = 'block';
    const loader = new GLTFLoader();
    loader.load('https://threejs.org/examples/models/gltf/Soldier.glb',
        gltf => {
            const m = gltf.scene;
            m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
            car = m; car.position.set(0, 0, 0);
            car.scale.set(CS, CS, CS);
            car.rotation.y = Math.PI;
            scene.add(car);
            mixer = new THREE.AnimationMixer(m);
            const clips = gltf.animations;
            console.log('Anims:', clips.map(c => c.name));
            const names = ['idle', 'walk', 'run'];
            clips.forEach((clip, i) => {
                const a = mixer.clipAction(clip);
                a.setEffectiveWeight(1);
                acts[names[i]] = a;
            });
            if (acts.idle) { acts.idle.play(); curAnim = 'idle'; }
            ld.style.display = 'none';
        },
        p => { ld.querySelector('p').textContent = `LOADING... ${Math.floor(p.loaded / p.total * 100)}%`; },
        e => { console.error(e); ld.querySelector('p').textContent = 'FAILED - USING PLACEHOLDER'; setTimeout(() => ld.style.display = 'none', 2000); mkPlaceholder(); }
    );
}

function mkPlaceholder() {
    car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 5), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 }));
    body.position.y = 1; body.castShadow = true; car.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2.5), new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 }));
    top.position.y = 2.2; top.castShadow = true; car.add(top);
    const wg = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
    const wm = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    [[-1.6, 0.5, 1.5], [1.6, 0.5, 1.5], [-1.6, 0.5, -1.5], [1.6, 0.5, -1.5]].forEach(([x, y, z]) => {
        const w = new THREE.Mesh(wg, wm); w.rotation.z = Math.PI / 2; w.position.set(x, y, z); car.add(w);
    });
    scene.add(car);
}

// ==================== EVENTS ====================
function setupEvents() {
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        started = true;
        lapT = performance.now();
    });
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'KeyR') resetCar();
        if (e.code === 'KeyC') { camMode = (camMode + 1) % 3; orbitCtrl.enabled = camMode === 1; }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });
}

function resetCar() {
    st.x = 0; st.z = 0; st.spd = 0; st.str = 0; st.h = 0;
    st.drift = false; st.lastCP = -1;
    laps = 0; lapT = performance.now();
}

// ==================== ANIMATION BLENDING ====================
function fadeTo(name, dur) {
    dur = dur || 0.3;
    if (name === curAnim) return;
    const prev = acts[curAnim], next = acts[name];
    if (!next) { curAnim = name; return; }
    if (prev && prev !== next) prev.fadeOut(dur);
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(dur).play();
    curAnim = name;
}

function updateAnim() {
    const as = Math.abs(st.spd);
    let target;
    // 根据人类跑步速度调整阈值
    // 静止：< 0.1 m/s
    // 走路：0.1 - 2 m/s (约 0-7 km/h)
    // 跑步：> 2 m/s (约 7+ km/h)
    if (as < 0.1) target = 'idle';
    else if (as < 2.0) target = 'walk';
    else target = 'run';
    fadeTo(target, 0.3);
    for (const [n, a] of Object.entries(acts)) {
        const w = a.getEffectiveWeight();
        const bar = document.getElementById('bar-' + n);
        const val = document.getElementById('val-' + n);
        if (bar) bar.style.width = (w * 100) + '%';
        if (val) val.textContent = w.toFixed(2);
    }
}

// ==================== CAR PHYSICS ====================
function updateCar(dt) {
    if (!started) return;
    gTime += dt; fCnt++;
    const now = performance.now();
    if (now - lastFps >= 1000) { fps = fCnt; fCnt = 0; lastFps = now; }

    const fwd = keys['ArrowUp'] || keys['KeyW'];
    const bwd = keys['ArrowDown'] || keys['KeyS'];
    const left = keys['ArrowLeft'] || keys['KeyA'];
    const right = keys['ArrowRight'] || keys['KeyD'];
    const hb = keys['Space'];

    // 前后移动 - 人类跑步物理
    if (fwd) st.spd += ACCEL;
    if (bwd) st.spd -= BRAKE;
    st.spd *= hb ? DRIFT_FRICTION : FRICTION;
    st.spd = THREE.MathUtils.clamp(st.spd, -MAX_REVERSE, MAX_SPEED);
    if (Math.abs(st.spd) < 0.01) st.spd = 0;

    // 左右移动 - 改变人物的"前方"方向
    // 按左键：人物朝左转 90 度，然后向左边跑动
    // 按右键：人物朝右转 90 度，然后向右边跑动
    const turnSpeed = 0.08;
    if (left) {
        st.h += turnSpeed;
        st.x -= Math.sin(st.h) * st.spd;
        st.z -= Math.cos(st.h) * st.spd;
    } else if (right) {
        st.h -= turnSpeed;
        st.x -= Math.sin(st.h) * st.spd;
        st.z -= Math.cos(st.h) * st.spd;
    } else {
        // 没有左右键时，沿当前朝向移动
        st.x -= Math.sin(st.h) * st.spd;
        st.z -= Math.cos(st.h) * st.spd;
    }

    // Track boundary collision
    const bnd = TS / 2 - 5;
    if (Math.abs(st.x) > bnd || Math.abs(st.z) > bnd) {
        st.spd *= -0.5;
        st.x = THREE.MathUtils.clamp(st.x, -bnd, bnd);
        st.z = THREE.MathUtils.clamp(st.z, -bnd, bnd);
    }

    // Obstacle collision
    for (const o of obs) {
        const dx = st.x - o.x, dz = st.z - o.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < o.r + 2) {
            st.spd *= -0.3;
            const pushAngle = Math.atan2(dx, dz);
            st.x += Math.sin(pushAngle) * 3;
            st.z += Math.cos(pushAngle) * 3;
        }
    }

    // Checkpoints
    for (let i = 0; i < cps.length; i++) {
        const cp = cps[i];
        const dx = st.x - cp.x, dz = st.z - cp.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < cp.r && st.lastCP === (i - 1 + cps.length) % cps.length) {
            st.lastCP = i;
            if (i === 0) {
                laps++;
                const elapsed = (performance.now() - lapT) / 1000;
                if (elapsed < bestLap) bestLap = elapsed;
                lapT = performance.now();
                if (laps >= LAPS) laps = LAPS;
            }
        }
    }

    // Update car mesh
    if (car) {
        car.position.set(st.x, 0, st.z);
        car.rotation.y = st.h;
    }

    updateAnim();
    updateHUD();
}

// ==================== HUD ====================
function updateHUD() {
    // 速度显示：m/s → km/h
    const kmh = Math.abs(Math.round(st.spd * 3.6));
    document.getElementById('speed-value').textContent = kmh;
    document.getElementById('lap-value').textContent = laps + ' / ' + LAPS;
    const elapsed = (performance.now() - lapT) / 1000;
    const mins = Math.floor(elapsed / 60);
    const secs = (elapsed % 60).toFixed(1);
    document.getElementById('timer-value').textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(4, '0');
    // 档位显示（改为配速显示）
    let paceDisplay = 'STOP';
    if (st.spd > 0.5) {
        const pace = 60 / (st.spd * 3.6); // min/km
        if (pace < 3) paceDisplay = 'SPRINT';
        else if (pace < 5) paceDisplay = 'FAST';
        else if (pace < 7) paceDisplay = 'JOG';
        else paceDisplay = 'WALK';
    } else if (st.spd < -0.5) {
        paceDisplay = 'BACK';
    }
    document.getElementById('gear-display').textContent = 'PACE: ' + paceDisplay;
    // Drift indicator
    const di = document.getElementById('drift-indicator');
    di.style.opacity = st.drift ? '1' : '0';
}

// ==================== CAMERA ====================
function updateCamera() {
    if (camMode === 1) { orbitCtrl.update(); return; }

    const cd = 60, ch = 30, la = 40;
    let tx, ty, tz, lx, ly, lz;

    if (camMode === 0) {
        // Chase camera
        tx = st.x + Math.sin(st.h) * cd;
        tz = st.z + Math.cos(st.h) * cd;
        ty = ch;
        lx = st.x - Math.sin(st.h) * la;
        lz = st.z - Math.cos(st.h) * la;
        ly = 5;
    } else {
        // Hood camera
        tx = st.x - Math.sin(st.h) * 5;
        tz = st.z - Math.cos(st.h) * 5;
        ty = 8;
        lx = st.x - Math.sin(st.h) * 50;
        lz = st.z - Math.cos(st.h) * 50;
        ly = 3;
    }

    cam.x += (tx - cam.x) * 0.08;
    cam.y += (ty - cam.y) * 0.08;
    cam.z += (tz - cam.z) * 0.08;
    cam.lx += (lx - cam.lx) * 0.1;
    cam.ly += (ly - cam.ly) * 0.1;
    cam.lz += (lz - cam.lz) * 0.1;

    camera.position.set(cam.x, cam.y, cam.z);
    camera.lookAt(cam.lx, cam.ly, cam.lz);
}

// ==================== MINIMAP ====================
function drawMinimap() {
    const ctx = minimapCtx;
    const w = 150, h = 150;
    const scale = w / TS;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, w, h);

    // Track outline
    ctx.strokeStyle = 'rgba(100,100,100,0.4)';
    ctx.lineWidth = TW * scale;
    ctx.strokeRect(w / 2 - tb.hw * scale, h / 2 - tb.hl * scale, tb.hw * 2 * scale, tb.hl * 2 * scale);

    // Checkpoints
    cps.forEach((cp, i) => {
        ctx.fillStyle = i === 0 ? '#4caf50' : '#2196f3';
        ctx.beginPath();
        ctx.arc(w / 2 + cp.x * scale, h / 2 + cp.z * scale, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Obstacles
    ctx.fillStyle = '#cc4444';
    obs.forEach(o => {
        ctx.beginPath();
        ctx.arc(w / 2 + o.x * scale, h / 2 + o.z * scale, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Car
    ctx.fillStyle = '#e91e63';
    ctx.beginPath();
    ctx.arc(w / 2 + st.x * scale, h / 2 + st.z * scale, 4, 0, Math.PI * 2);
    ctx.fill();

    // Car direction
    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 + st.x * scale, h / 2 + st.z * scale);
    ctx.lineTo(w / 2 + (st.x - Math.sin(st.h) * 20) * scale, h / 2 + (st.z - Math.cos(st.h) * 20) * scale);
    ctx.stroke();
}

// ==================== RENDER LOOP ====================
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(dt);

    updateCar(dt);
    updateCamera();
    drawMinimap();
    renderer.render(scene, camera);
}

// ==================== START ====================
// 等待 DOM 加载完成后再初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
