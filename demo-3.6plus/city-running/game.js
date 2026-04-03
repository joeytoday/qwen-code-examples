import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==================== CONSTANTS ====================
const CITY_SIZE = 400;
const ROAD_WIDTH = 20;
const SIDE_ROAD_WIDTH = 12;
const SIDEWALK_WIDTH = 5;

const MAX_SPEED = 7.5;
const BASE_SPEED = 5.0;
const LATERAL_SPEED = 4.0;
const JUMP_HEIGHT = 2.5;
const JUMP_DURATION = 0.6;
const GRAVITY = 9.8;

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
    lineYellow: '#E8D56A',
    // 收集物
    collectibleGold: '#FFD700',
    collectibleBlue: '#4A90E2'
};

// ==================== STATE ====================
let started = false, scene, camera, renderer, clock, player, mixer;
let acts = {}, curAnim = 'idle';
let score = 0;
let collectibles = [];
let camMode = 0;
const playerState = { x: 0, z: 0, y: 0, vy: 0, isJumping: false, jumpTime: 0, heading: 0 };
const keys = {};
const camState = { x: 0, y: 20, z: -30, lx: 0, ly: 3, lz: 0 };

// ==================== INIT ====================
function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 100, 400);
    camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(0, 20, -30);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    setupLight();
    createGround();
    createRoadNetwork();
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
    const g = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: 0x87ceeb, depthWrite: false }));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    const gr = new THREE.GridHelper(800, 40, 0x000000, 0x000000);
    gr.position.y = 0.1; gr.material.transparent = true; gr.material.opacity = 0.2;
    scene.add(gr);
}

// ==================== ROAD NETWORK ====================
function createRoadNetwork() {
  const half = CITY_SIZE / 2;
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
  const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x909090 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

  // 主干道（沿 Z 轴，南北向）
  const mainRoadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CITY_SIZE);
  const mainRoad = new THREE.Mesh(mainRoadGeo, roadMat);
  mainRoad.rotation.x = -Math.PI / 2;
  mainRoad.position.y = 0.05;
  scene.add(mainRoad);

  // 东侧人行道
  const swGeo = new THREE.PlaneGeometry(SIDEWALK_WIDTH, CITY_SIZE);
  const swEast = new THREE.Mesh(swGeo, sidewalkMat);
  swEast.rotation.x = -Math.PI / 2;
  swEast.position.set(ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2, 0.08, 0);
  scene.add(swEast);

  // 西侧人行道
  const swWest = new THREE.Mesh(swGeo, sidewalkMat);
  swWest.rotation.x = -Math.PI / 2;
  swWest.position.set(-(ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2), 0.08, 0);
  scene.add(swWest);

  // 横向街道（东西向，3 条）
  const sideRoadPositions = [-100, 0, 100];
  const sideRoadGeo = new THREE.PlaneGeometry(CITY_SIZE, SIDE_ROAD_WIDTH);
  const sideSwGeo = new THREE.PlaneGeometry(CITY_SIZE, SIDEWALK_WIDTH);
  
  sideRoadPositions.forEach(z => {
    const sideRoad = new THREE.Mesh(sideRoadGeo, roadMat);
    sideRoad.rotation.x = -Math.PI / 2;
    sideRoad.position.set(0, 0.06, z);
    scene.add(sideRoad);

    // 横向街道人行道
    const sideSwNorth = new THREE.Mesh(sideSwGeo, sidewalkMat);
    sideSwNorth.rotation.x = -Math.PI / 2;
    sideSwNorth.position.set(0, 0.09, z + SIDE_ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2);
    scene.add(sideSwNorth);

    const sideSwSouth = new THREE.Mesh(sideSwGeo, sidewalkMat);
    sideSwSouth.rotation.x = -Math.PI / 2;
    sideSwSouth.position.set(0, 0.09, z - SIDE_ROAD_WIDTH / 2 - SIDEWALK_WIDTH / 2);
    scene.add(sideSwSouth);
  });

  // 道路中心线（白色虚线）
  const dashLength = 3;
  const gapLength = 3;
  const totalDashes = Math.floor(CITY_SIZE / (dashLength + gapLength));
  const dashGeo = new THREE.PlaneGeometry(0.3, dashLength);

  for (let i = 0; i < totalDashes; i++) {
    const z = -half + i * (dashLength + gapLength) + dashLength / 2;
    const dash = new THREE.Mesh(dashGeo, lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.07, z);
    scene.add(dash);
  }

  return { mainRoadWidth: ROAD_WIDTH, sideRoadPositions, sideRoadWidth: SIDE_ROAD_WIDTH };
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
function createBuildingBox(x, z, rot, color) {
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
function createBuildingCylinder(x, z, rot, floors, color) {
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
function createBuildingLShape(x, z, rot, height) {
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
function createBuildingTower(x, z, rot) {
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
function createBuildingModern(x, z, rot) {
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
function createBuildingClassic(x, z, rot) {
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
function createBuildingArtDeco(x, z, rot) {
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

// 建筑 8: 摩天大楼（扭曲造型）
function createBuildingIndustrial(x, z, rot, height, type) {
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
function createBuildingVictorian(x, z, rot) {
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
function createBuildingContemporary(x, z, rot) {
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

// 街道设施：长椅
function createBench(x, z, rot) {
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

// 街道设施：低多边形树
function createTree(x, z, type) {
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

// 街道设施：路灯
function createLampPost(x, z) {
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

// 街道设施：消防栓
function createFireHydrant(x, z) {
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

// 街道设施：垃圾桶
function createTrashCan(x, z) {
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
function createMailbox(x, z) {
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

// 街道设施：公交站
function createBusStop(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    // 支柱
    for (let i = 0; i < 2; i++) {
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 4, 8),
            new THREE.MeshStandardMaterial({ color: COLORS.roofGray })
        );
        pole.position.set(-2 + i * 4, 2, 0);
        g.add(pole);
    }

    // 顶棚
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.3, 2),
        new THREE.MeshStandardMaterial({ color: COLORS.trimBlue })
    );
    roof.position.y = 4;
    roof.castShadow = true;
    g.add(roof);

    // 站牌
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1, 0.2),
        new THREE.MeshStandardMaterial({ color: COLORS.roofWhite })
    );
    sign.position.set(0, 3, 0.5);
    g.add(sign);

    scene.add(g);
    return g;
}

// 街道设施：报亭
function createNewsstand(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;

    // 主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshStandardMaterial({ color: COLORS.trimGreen })
    );
    body.position.y = 1.5;
    body.castShadow = true;
    g.add(body);

    // 窗口
    const window = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 0.2),
        new THREE.MeshStandardMaterial({ color: COLORS.windowDark })
    );
    window.position.set(0, 2, 1.6);
    g.add(window);

    // 屋顶
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.3, 3.5),
        new THREE.MeshStandardMaterial({ color: COLORS.trimRed })
    );
    roof.position.y = 3.15;
    roof.castShadow = true;
    g.add(roof);

    scene.add(g);
    return g;
}

// 街道设施：花坛
function createPlanter(x, z) {
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

// 街道设施：自行车停放架
function createBikeRack(x, z, rot) {
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

// 街道设施：路牌
function createSign(x, z, rot) {
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

// 车辆：出租车（静态装饰）
function createTaxi(x, z, rot) {
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

// 车辆：警车（静态装饰）
function createPoliceCar(x, z, rot) {
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

// 车辆：公交车（静态装饰）
function createBus(x, z, rot) {
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

// Main scenery function — grid-based city layout
function createScenery() {
  const roadInfo = createRoadNetwork();
  const { mainRoadWidth, sideRoadPositions, sideRoadWidth } = roadInfo;

  const buildingFunctions = [
    createBuildingBox,
    createBuildingCylinder,
    createBuildingLShape,
    createBuildingTower,
    createBuildingModern,
    createBuildingClassic,
    createBuildingArtDeco,
    createBuildingIndustrial,
    createBuildingVictorian,
    createBuildingContemporary
  ];

  const buildingColors = [0xE57373, 0x7986CB, 0xFFB74D, 0x4DB6AC, 0xAED581, 0xFFD54F];

  // Place buildings along both sides of the main road
  const spacing = 40;
  const halfCity = CITY_SIZE / 2;
  const buildingXPositions = [
    mainRoadWidth / 2 + SIDEWALK_WIDTH + 15,
    -(mainRoadWidth / 2 + SIDEWALK_WIDTH + 15)
  ];

  let buildingCount = 0;

  buildingXPositions.forEach(x => {
    for (let z = -halfCity + 20; z < halfCity; z += spacing) {
      // Skip side road intersections
      const isIntersection = sideRoadPositions.some(sz => Math.abs(z - sz) < SIDE_ROAD_WIDTH);
      if (isIntersection) continue;

      const idx = Math.floor(Math.random() * buildingFunctions.length);
      const rot = 0;

      switch (idx) {
        case 0: // createBuildingBox
          createBuildingBox(x, z, rot, buildingColors[Math.floor(Math.random() * buildingColors.length)]);
          break;
        case 1: // createBuildingCylinder
          createBuildingCylinder(x, z, rot, 2 + Math.floor(Math.random() * 3), buildingColors[Math.floor(Math.random() * buildingColors.length)]);
          break;
        case 2: // createBuildingLShape
          createBuildingLShape(x, z, rot, 2 + Math.floor(Math.random() * 3));
          break;
        case 3: // createBuildingTower
          createBuildingTower(x, z, rot);
          break;
        case 4: // createBuildingModern
          createBuildingModern(x, z, rot);
          break;
        case 5: // createBuildingClassic
          createBuildingClassic(x, z, rot);
          break;
        case 6: // createBuildingArtDeco
          createBuildingArtDeco(x, z, rot);
          break;
        case 7: // createBuildingIndustrial
          createBuildingIndustrial(x, z, rot, 2 + Math.floor(Math.random() * 4), Math.random() > 0.5 ? 'glass' : 'concrete');
          break;
        case 8: // createBuildingVictorian
          createBuildingVictorian(x, z, rot);
          break;
        case 9: // createBuildingContemporary
          createBuildingContemporary(x, z, rot);
          break;
      }
      buildingCount++;
    }
  });

  // Add street furniture
  addStreetFurniture(sideRoadPositions);

  // Add parked vehicles
  addVehicles(sideRoadPositions);

  // Create central park
  createCentralPark();

  console.log(`City scenery created: ${buildingCount} buildings`);
}

// Place street furniture along roads
function addStreetFurniture(sideRoadPositions) {
  const halfCity = CITY_SIZE / 2;

  // Street lamps (every 20 units)
  for (let z = -halfCity + 10; z < halfCity; z += 20) {
    createLampPost(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 1, z);
    createLampPost(-(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 1), z);
  }

  // Trees (every 30 units)
  for (let z = -halfCity + 15; z < halfCity; z += 30) {
    createTree(ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2, z);
    createTree(-(ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2), z);
  }

  // Benches (every 50 units)
  for (let z = -halfCity + 25; z < halfCity; z += 50) {
    createBench(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 2, z);
    createBench(-(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 2), z);
  }

  // Trash cans (every 40 units)
  for (let z = -halfCity + 20; z < halfCity; z += 40) {
    createTrashCan(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 1.5, z);
    createTrashCan(-(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 1.5), z);
  }

  // Fire hydrants (every 35 units)
  for (let z = -halfCity + 17; z < halfCity; z += 35) {
    createFireHydrant(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 0.5, z);
    createFireHydrant(-(ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 0.5), z);
  }
}

// Park vehicles along side roads
function addVehicles(sideRoadPositions) {
  sideRoadPositions.forEach(z => {
    // Taxis (2 per street)
    createTaxi(-30, z + SIDE_ROAD_WIDTH / 2 + 1, 0);
    createTaxi(30, z + SIDE_ROAD_WIDTH / 2 + 1, 0);

    // Police car (1 per street)
    createPoliceCar(0, z - SIDE_ROAD_WIDTH / 2 - 2, 0);

    // Bus (1 per street)
    createBus(-50, z + SIDE_ROAD_WIDTH / 2 + 2, 0);
  });
}

// Create central park at city center (0, 0)
function createCentralPark() {
  const parkSize = 60;
  const halfSize = parkSize / 2;

  // Grass
  const grassGeo = new THREE.PlaneGeometry(parkSize, parkSize);
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, 0.1, 0);
  scene.add(grass);

  // 9 trees in 3x3 grid
  const treeSpacing = 12;
  for (let x = -1; x <= 1; x += 1) {
    for (let z = -1; z <= 1; z += 1) {
      createTree(x * treeSpacing, z * treeSpacing);
    }
  }

  // 4 benches at corners
  createBench(-halfSize + 5, -halfSize + 5, 0);
  createBench(halfSize - 5, -halfSize + 5, 0);
  createBench(-halfSize + 5, halfSize - 5, 0);
  createBench(halfSize - 5, halfSize - 5, 0);
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
            player = m; player.position.set(0, 0, 0);
            player.scale.set(1, 1, 1);
            scene.add(player);
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
    player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.5), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 }));
    body.position.y = 1; body.castShadow = true; player.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    head.position.y = 2.4; head.castShadow = true; player.add(head);
    scene.add(player);
}

// ==================== EVENTS ====================
function setupEvents() {
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        started = true;
    });
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'KeyC') { camMode = (camMode + 1) % 3; }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });
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
    const as = Math.abs(playerState.isJumping ? 0 : (keys['KeyW'] || keys['ArrowUp'] ? MAX_SPEED : 0));
    let target;
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

// ==================== HUD ====================
function updateHUD() {
    document.getElementById('speed-value').textContent = score;
    // TODO: Implement lap counter when gameplay features are added
    // document.getElementById('lap-value').textContent = '0';
    // TODO: Implement timer when gameplay features are added
    // document.getElementById('timer-value').textContent = '00:00';
    document.getElementById('gear-display').textContent = 'READY';
}

// ==================== CAMERA ====================
function updateCamera() {
    const cd = 30, ch = 20, la = 10;
    let tx, ty, tz, lx, ly, lz;

    if (camMode === 0) {
        // Third-person chase camera
        tx = playerState.x + Math.sin(playerState.heading) * cd;
        tz = playerState.z + Math.cos(playerState.heading) * cd;
        ty = ch;
        lx = playerState.x;
        lz = playerState.z;
        ly = 3;
    } else if (camMode === 1) {
        // Top-down view
        tx = playerState.x;
        tz = playerState.z;
        ty = 50;
        lx = playerState.x;
        lz = playerState.z;
        ly = 0;
    } else {
        // Close follow camera
        tx = playerState.x + Math.sin(playerState.heading) * 15;
        tz = playerState.z + Math.cos(playerState.heading) * 15;
        ty = 10;
        lx = playerState.x;
        lz = playerState.z;
        ly = 2;
    }

    camState.x += (tx - camState.x) * 0.08;
    camState.y += (ty - camState.y) * 0.08;
    camState.z += (tz - camState.z) * 0.08;
    camState.lx += (lx - camState.lx) * 0.1;
    camState.ly += (ly - camState.ly) * 0.1;
    camState.lz += (lz - camState.lz) * 0.1;

    camera.position.set(camState.x, camState.y, camState.z);
    camera.lookAt(camState.lx, camState.ly, camState.lz);
}

// ==================== RENDER LOOP ====================
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(dt);

    updateAnim();
    updateCamera();
    updateHUD();
    renderer.render(scene, camera);
}

// ==================== START ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}