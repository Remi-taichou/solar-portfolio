import * as THREE from 'three';
import { isSmallScreen } from '../config.js';
import { smooth } from '../math.js';
import { FULLSCREEN_VERT } from '../shaders/common.js';
import {
  INTRO_FLAME_FRAG,
  INTRO_FLAME_VERT,
  INTRO_PUFF_FRAG,
  INTRO_PUFF_VERT,
  INTRO_SKY_FRAG,
} from '../shaders/launch.js';
import { makeNoiseMap, paintApron, paintHull } from './launchTextures.js';

// The story of the launch, in seconds. Time 0 is ignition; negative time is the wait on the pad.
const SECONDS_ON_PAD = 2.8;
const ARRIVES_AT_SUN = 7.25;
const ENDS = 8.6;

const ROCKET_MID = 5.05;   // the rocket hangs from a pivot at this height, so it can turn around its middle
const ROCKET_RADIUS = 0.42;
const PAD_HEIGHT = 1.08;   // height of the rocket's base above the ground
const VIEW = Math.tan((35 * Math.PI) / 360);
const FIRST_STEAM_PUFF = 26; // the first puffs in the pool are permanent clouds

/* ---------- things in the launch scene ---------- */

// Reflections: metal on the rocket and tower picks up this dusk sky.
function createDuskReflections(renderer) {
  const scene = new THREE.Scene();
  const geometry = new THREE.SphereGeometry(50, 96, 64);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const sunDirection = new THREE.Vector3(-0.85, 0.1, 0.5).normalize();
  const direction = new THREE.Vector3();
  const mix = (a, b, t) => a + (b - a) * t;

  for (let i = 0; i < positions.count; i++) {
    direction.fromBufferAttribute(positions, i).normalize();
    const nearHorizon = smooth(-0.12, 0.02, direction.y);
    const upHigh = smooth(0.02, 0.55, direction.y);
    const sunGlow = Math.pow(Math.max(direction.dot(sunDirection), 0), 14);
    colors[i * 3] = mix(mix(0.05, 1.1, nearHorizon), 0.13, upHigh) + 2.6 * sunGlow;
    colors[i * 3 + 1] = mix(mix(0.045, 0.62, nearHorizon), 0.2, upHigh) + 1.3 * sunGlow;
    colors[i * 3 + 2] = mix(mix(0.05, 0.36, nearHorizon), 0.46, upHigh) + 0.55 * sunGlow;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false })));

  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(scene);
  generator.dispose();
  return target;
}

// The sky: dusk at first, then blue, then the curved Earth, drawn as a flat full-screen layer.
function createSkyLayer(backScene) {
  const material = new THREE.ShaderMaterial({
    uniforms: { alt: { value: 0 }, aspect: { value: 1 }, horizon: { value: -0.5 }, radius: { value: 60 } },
    vertexShader: FULLSCREEN_VERT.replace('0.,1.', '.5,1.'),
    fragmentShader: INTRO_SKY_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  backScene.add(quad);
  return material;
}

// Booster, stage joints, nose cone, cable runs, landing legs, steering grids and nine engines.
function createRocket(renderer, small, rocketName, ownedTextures) {
  const R = ROCKET_RADIUS;
  const pivot = new THREE.Group();
  const vehicle = new THREE.Group();
  vehicle.position.y = -ROCKET_MID;
  pivot.add(vehicle);

  const hullMaps = paintHull(renderer, small, rocketName);
  ownedTextures.push(hullMaps.map, hullMaps.bumpMap, hullMaps.roughnessMap);
  const hull = new THREE.MeshStandardMaterial({ ...hullMaps, bumpScale: 0.012, metalness: 0.08, roughness: 1, envMapIntensity: 0.32 });
  const paint = new THREE.MeshStandardMaterial({ color: 0xd8d5cc, metalness: 0.08, roughness: 0.46, envMapIntensity: 0.32 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x17181c, metalness: 0.35, roughness: 0.62, envMapIntensity: 0.6 });
  const inconel = new THREE.MeshStandardMaterial({ color: 0x7c746b, metalness: 0.96, roughness: 0.36, side: THREE.DoubleSide, envMapIntensity: 0.8 });

  const add = (mesh, x, y, z) => {
    mesh.position.set(x, y, z);
    vehicle.add(mesh);
    return mesh;
  };
  const curveToLathe = (points, samples, segments) => {
    const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.LatheGeometry(curve.getPoints(samples).map((v) => new THREE.Vector2(Math.max(0, v.x), v.y)), segments);
  };

  // Main body and upper stage.
  const booster = add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, 6.2, 96, 1, true), hull), 0, 3.1, 0);
  booster.rotation.y = Math.PI;
  add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.72, 96, 1, true), carbon), 0, 6.56, 0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.012, R - 0.012, 1.14, 96, 1, true), paint), 0, 7.49, 0);

  // Nose cone.
  add(new THREE.Mesh(curveToLathe([[R - 0.012, 8.04], [0.47, 8.26], [0.5, 8.62], [0.49, 9.02], [0.4, 9.5], [0.23, 9.92], [0.07, 10.14], [0, 10.18]], 90, 96), paint), 0, 0, 0);

  // Small joints between stages.
  [6.2, 6.92, 8.04].forEach((y) => add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.009, R + 0.009, 0.028, 96), carbon), 0, y, 0));

  // Cable runs along the outside of the hull.
  const raceway = new THREE.MeshStandardMaterial({ color: 0xbdb9b0, metalness: 0.2, roughness: 0.55 });
  [[0.31, 0.3], [-0.36, 0.22]].forEach(([x, z]) => {
    const scale = (R + 0.012) / Math.hypot(x, z);
    const run = add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 5.6, 0.035), raceway), x * scale, 3.4, z * scale);
    run.rotation.y = Math.atan2(x, z);
  });

  // Folded landing legs.
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Group();
    leg.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.62, 0.045), carbon);
    strut.position.set(0, 0.95, R + 0.025);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.05, 24), carbon);
    foot.position.set(0, 0.13, R + 0.05);
    foot.rotation.x = Math.PI / 2;
    leg.add(strut, foot);
    vehicle.add(leg);
  }

  // Steering grids folded against the upper body.
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Group();
    fin.rotation.y = (i * Math.PI) / 2;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.035), inconel);
    frame.position.set(0, 6.5, R + 0.035);
    fin.add(frame);
    for (let k = -2; k <= 2; k++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.3, 0.05), carbon);
      bar.position.set(k * 0.05, 6.5, R + 0.04);
      fin.add(bar);
    }
    vehicle.add(fin);
  }

  // Engine section: nine bells under a heat shield.
  add(new THREE.Mesh(new THREE.CylinderGeometry(R, R - 0.02, 0.07, 96), carbon), 0, -0.025, 0);
  const bell = curveToLathe([[0.046, 0], [0.058, -0.05], [0.09, -0.15], [0.118, -0.28], [0.126, -0.34]], 24, 32);
  const engines = [[0, 0]];
  for (let i = 0; i < 8; i++) engines.push([Math.cos((i * Math.PI) / 4) * 0.275, Math.sin((i * Math.PI) / 4) * 0.275]);
  engines.forEach(([x, z]) => add(new THREE.Mesh(bell, inconel), x, -0.06, z));

  pivot.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return { pivot, vehicle };
}

// The two-layer flame and the soft glow around the engines.
function createExhaust(vehicle, ownedTextures) {
  const geometry = new THREE.ConeGeometry(0.44, 8, 40, 12, true);
  geometry.rotateX(Math.PI);
  geometry.translate(0, -4, 0);

  const flameMaterial = (core, edge, gain) => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      thrust: { value: 0 },
      len: { value: 0 },
      gain: { value: gain },
      core: { value: new THREE.Color(core) },
      edge: { value: new THREE.Color(edge) },
    },
    vertexShader: INTRO_FLAME_VERT,
    fragmentShader: INTRO_FLAME_FRAG,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const materials = [flameMaterial('#fff0c4', '#ff6d12', 1.25), flameMaterial('#ffffff', '#ffd27a', 1.55)];

  const outer = new THREE.Mesh(geometry, materials[0]);
  const inner = new THREE.Mesh(geometry, materials[1]);
  outer.position.y = -0.38;
  inner.position.y = -0.38;
  inner.scale.set(0.58, 0.6, 0.58);
  outer.frustumCulled = false;
  inner.frustumCulled = false;
  vehicle.add(outer, inner);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,244,214,1)');
  gradient.addColorStop(0.16, 'rgba(255,190,110,.62)');
  gradient.addColorStop(0.48, 'rgba(255,120,44,.14)');
  gradient.addColorStop(1, 'rgba(255,100,30,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  ownedTextures.push(texture);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    fog: false,
    opacity: 0,
  }));
  glow.position.y = -0.6;
  vehicle.add(glow);

  return { materials, outer, inner, glow };
}

// Builds many thin steel beams efficiently. Each beam is [start, end, thickness].
function createLattice(beams, material, parent) {
  const up = new THREE.Vector3(0, 1, 0);
  const matrix = new THREE.Matrix4();
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, beams.length);

  beams.forEach(([from, to, thickness], i) => {
    start.set(...from);
    end.set(...to);
    const length = start.distanceTo(end);
    rotation.setFromUnitVectors(up, end.clone().sub(start).normalize());
    matrix.compose(start.clone().add(end).multiplyScalar(0.5), rotation, scale.set(thickness, length, thickness));
    mesh.setMatrixAt(i, matrix);
  });

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}

// The launch tower and its swing arms. Returns the arms' pivot so they can pull back before ignition.
function createTower(pad, steel) {
  const X = -3.02;
  const WIDTH = 0.56;
  const HEIGHT = 12.6;
  const corners = [[-WIDTH, -WIDTH], [WIDTH, -WIDTH], [WIDTH, WIDTH], [-WIDTH, WIDTH]];
  const beams = [];

  corners.forEach(([x, z]) => beams.push([[X + x, 0, z], [X + x, HEIGHT, z], 0.085]));
  for (let level = 0, y = 0; y < HEIGHT; level++, y += 1.05) {
    corners.forEach(([x, z], i) => {
      const [nextX, nextZ] = corners[(i + 1) % 4];
      beams.push([[X + x, y, z], [X + nextX, y, nextZ], 0.05]);
      const flip = level % 2 === i % 2;
      beams.push([[X + (flip ? x : nextX), y, flip ? z : nextZ], [X + (flip ? nextX : x), y + 1.05, flip ? nextZ : z], 0.028]);
    });
  }
  createLattice(beams, steel, pad);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.5), steel);
  roof.position.set(X, HEIGHT + 0.05, 0);
  roof.castShadow = true;
  pad.add(roof);

  const armPivot = new THREE.Group();
  armPivot.position.set(X + WIDTH, 0, 0);
  pad.add(armPivot);

  const reach = -X - WIDTH - ROCKET_RADIUS + 0.02;
  const armBeams = [];
  [[8.2, 0.2], [4.6, 0.17], [2.5, 0.15]].forEach(([y, wide]) => {
    [-wide, wide].forEach((z) => {
      armBeams.push([[0, y, z], [reach, y, z], 0.04]);
      armBeams.push([[0, y - 0.22, z], [reach * 0.92, y - 0.22, z], 0.03]);
      for (let k = 0; k < 5; k++) armBeams.push([[(reach * k) / 5, y - 0.22, z], [(reach * (k + 1)) / 5, y, z], 0.018]);
    });
    armBeams.push([[reach, y, -wide], [reach, y, wide], 0.05]);
  });
  createLattice(armBeams, steel, armPivot);

  return armPivot;
}

// The concrete mount, clamps, lightning masts, buildings and storage tanks.
function createPadStructures(pad, steel) {
  const concrete = new THREE.MeshStandardMaterial({ color: 0x4d4a46, metalness: 0, roughness: 0.93, envMapIntensity: 0.25 });
  [[4.4, 0.74, 0.86, 0, 0.37, -1.25], [4.4, 0.74, 0.86, 0, 0.37, 1.25], [0.86, 0.74, 1.7, -1.75, 0.37, 0], [0.86, 0.74, 1.7, 1.75, 0.37, 0]].forEach(([w, h, d, x, y, z]) => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concrete);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    pad.add(part);
  });

  const clampMaterial = new THREE.MeshStandardMaterial({ color: 0x25262b, metalness: 0.8, roughness: 0.45 });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), clampMaterial);
    clamp.position.set(Math.cos(a) * 0.66, 0.94, Math.sin(a) * 0.66);
    clamp.castShadow = true;
    pad.add(clamp);
  }

  [[8.5, -7, 23], [-11, -9, 25], [-6, -15, 21]].forEach(([x, z, height]) => {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.13, height, 10), steel);
    mast.position.set(x, height / 2, z);
    mast.castShadow = true;
    pad.add(mast);
  });

  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x3f3d3a, metalness: 0.05, roughness: 0.85, envMapIntensity: 0.25 });
  [[5.6, 1.5, 3, 11, 0.75, -6], [2.4, 3.4, 2.4, 14.6, 1.7, -8.5], [9, 2.3, 4, -14, 1.15, -11]].forEach(([w, h, d, x, y, z]) => {
    const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMaterial);
    building.position.set(x, y, z);
    building.castShadow = true;
    building.receiveShadow = true;
    pad.add(building);
  });

  const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x8f8c85, metalness: 0.25, roughness: 0.42, envMapIntensity: 0.35 });
  [[8.2, 1.1, -11.5], [11, 1.1, -12.3]].forEach(([x, y, z]) => {
    const tank = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 24), tankMaterial);
    tank.position.set(x, y, z);
    tank.castShadow = true;
    pad.add(tank);
  });
}

// A distant treeline closes off the horizon behind the pad.
function createTreeline(pad, small) {
  const material = new THREE.MeshStandardMaterial({ color: 0x0d0f0d, roughness: 1, metalness: 0, envMapIntensity: 0 });
  const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), material, small ? 700 : 1500);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (let i = 0; i < trees.count; i++) {
    const height = 3 + Math.random() * 3.6;
    const width = 1.8 + Math.random() * 2.2;
    position.set((Math.random() - 0.5) * 2600, height / 2, -430 - Math.random() * 70);
    matrix.compose(position, rotation, scale.set(width, height, width));
    trees.setMatrixAt(i, matrix);
  }
  trees.frustumCulled = false;
  pad.add(trees);
}

// The concrete apron around the pad and the land beyond it.
function createGround(scene, renderer, small, ownedTextures) {
  const texture = paintApron(renderer, small);
  ownedTextures.push(texture);

  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(92, 92),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture, roughness: 0.95, metalness: 0, envMapIntensity: 0.15 }),
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = 0.012;
  apron.receiveShadow = true;
  scene.add(apron);

  const land = new THREE.Mesh(
    new THREE.CircleGeometry(2600, 64),
    new THREE.MeshStandardMaterial({ color: 0x1d1b1a, roughness: 1, metalness: 0, envMapIntensity: 0.1 }),
  );
  land.rotation.x = -Math.PI / 2;
  land.receiveShadow = true;
  scene.add(land);

  return { apron, land };
}

// A low sun throwing long shadows across the pad, soft sky light, and the engines' own light.
function createLights(scene, small) {
  scene.add(new THREE.HemisphereLight(0x8aa0d8, 0x2a201c, 0.2));

  const sunLight = new THREE.DirectionalLight(0xffb98a, 1.5);
  sunLight.position.set(-46, 13, 9);
  sunLight.castShadow = true;
  const shadowSize = small ? 2048 : 4096;
  sunLight.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sunLight.shadow.camera, { left: -32, right: 32, top: 30, bottom: -30, near: 1, far: 170 });
  sunLight.shadow.bias = -0.00022;
  sunLight.shadow.normalBias = 0.018;
  sunLight.shadow.radius = 2.2;
  scene.add(sunLight, sunLight.target);

  const engineLight = new THREE.PointLight(0xff9a48, 0, 30, 1.8);
  scene.add(engineLight);

  return { sunLight, engineLight };
}

// A pool of soft particles for steam, cold vapour and clouds. Old puffs are reused for new ones.
function createSteam(scene, small, ownedTextures) {
  const count = (small ? 340 : 760) + FIRST_STEAM_PUFF;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const seeds = new Float32Array(count);
  const fires = new Float32Array(count);
  const puffs = Array.from({ length: count }, (_, i) => {
    seeds[i] = Math.random();
    return { life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: 1, grow: 1, peak: 0.5, hot: 0 };
  });

  for (let i = 0; i < FIRST_STEAM_PUFF; i++) {
    positions.set([(Math.random() - 0.5) * 60, 34 + Math.random() * 46, -10 - Math.random() * 22], i * 3);
    sizes[i] = 11 + Math.random() * 16;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aFire', new THREE.BufferAttribute(fires, 1));

  const noiseMap = makeNoiseMap();
  ownedTextures.push(noiseMap);
  const material = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1 }, noiseMap: { value: noiseMap }, uDay: { value: 0 } },
    vertexShader: INTRO_PUFF_VERT,
    fragmentShader: INTRO_PUFF_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  let next = FIRST_STEAM_PUFF;
  function emit(x, y, z, vx, vy, vz, size, grow, max, peak, hot) {
    positions.set([x, y, z], next * 3);
    Object.assign(puffs[next], { vx, vy, vz, size, grow, max, peak, hot, life: max });
    next = next + 1 >= count ? FIRST_STEAM_PUFF : next + 1;
  }

  return { count, positions, sizes, alphas, fires, puffs, geometry, material, points, emit, ventDebt: 0, blastDebt: 0 };
}

/* ---------- each frame of the launch ---------- */

// Cold vapour bleeding off the tanks and drifting on the wind, before ignition.
function emitVapour(steam, rocket, step) {
  steam.ventDebt += step * 15;
  while (steam.ventDebt > 1) {
    steam.ventDebt--;
    const height = Math.random() < 0.62 ? 7.2 + Math.random() * 0.7 : 3.4 + Math.random() * 1.2;
    steam.emit(
      rocket.position.x + 0.42, PAD_HEIGHT + height, Math.random() * 0.4,
      0.55 + Math.random() * 0.7, -0.12 + Math.random() * 0.1, (Math.random() - 0.5) * 0.25,
      0.24 + Math.random() * 0.18, 2.4, 1.7 + Math.random() * 1.5, 0.36, 0,
    );
  }
}

// Steam blasting sideways out of the flame trench, then a column behind the rocket.
function emitExhaustSteam(steam, rocket, step, height, rate) {
  steam.blastDebt += step * rate;
  const base = rocket.position.y - ROCKET_MID;
  while (steam.blastDebt > 1) {
    steam.blastDebt--;
    const side = Math.random() < 0.5 ? -1 : 1;
    if (height < 12 && Math.random() < 0.84) {
      const bloom = Math.random();
      steam.emit(
        side * (2.5 + Math.random() * 0.9), 0.25 + Math.random() * 0.55, (Math.random() - 0.5) * 1.1,
        side * (5 + bloom * 13), 0.35 + Math.random() * 2.1, (Math.random() - 0.5) * 3.2,
        2 + Math.random() * 1.8, 2.3, 2.6 + Math.random() * 2.4, 0.86, 0.75,
      );
    } else {
      steam.emit(
        rocket.position.x + (Math.random() - 0.5) * 0.3, base - 1 - Math.random() * 3.5, rocket.position.z + (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 1.4, -2 - Math.random() * 3, (Math.random() - 0.5) * 1.4,
        1.2 + Math.random() * 0.9, 2, 2 + Math.random() * 2, 0.68, 0.35,
      );
    }
  }
}

// Ages every puff: it drifts, grows and fades.
function updateSteam(steam, step, altitude, thrust, pixelScale) {
  const { positions, sizes, alphas, fires, puffs, count } = steam;
  const drag = Math.exp(-step * 1.05);
  for (let i = FIRST_STEAM_PUFF; i < count; i++) {
    const puff = puffs[i];
    if (puff.life <= 0) {
      alphas[i] = 0;
      continue;
    }
    puff.life -= step;
    puff.vx *= drag;
    puff.vy = puff.vy * drag + step * 0.3;
    puff.vz *= drag;
    positions[i * 3] += puff.vx * step;
    positions[i * 3 + 1] = Math.max(0.15, positions[i * 3 + 1] + puff.vy * step);
    positions[i * 3 + 2] += puff.vz * step;
    const age = 1 - Math.max(0, puff.life) / puff.max;
    sizes[i] = puff.size * (1 + age * puff.grow * 2.4);
    alphas[i] = Math.min(1, age * 11) * Math.pow(1 - age, 1.25) * puff.peak;
    fires[i] = puff.hot * (1 - smooth(0.015, 0.13, age)) * Math.min(1, thrust);
  }

  const cloudAlpha = smooth(0.08, 0.17, altitude) * (1 - smooth(0.26, 0.4, altitude)) * 0.72;
  for (let i = 0; i < FIRST_STEAM_PUFF; i++) {
    alphas[i] = cloudAlpha;
    fires[i] = 0;
  }

  ['position', 'aSize', 'aAlpha', 'aFire'].forEach((name) => {
    steam.geometry.attributes[name].needsUpdate = true;
  });
  steam.material.uniforms.uScale.value = pixelScale;
  steam.points.visible = altitude < 0.76;
}

/* ---------- putting it together ---------- */

// Builds the launch and returns the controls the engine needs each frame.
export function createLaunch(state, rocketName, { onReveal, onFinish }) {
  const { world, reduced } = state;
  const { renderer } = world;
  const small = isSmallScreen();
  const ownedTextures = [];

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const backScene = new THREE.Scene();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, state.W / state.H, 0.1, 6000);

  const reflections = createDuskReflections(renderer);
  scene.environment = reflections.texture;

  // Haze carries the ground into the bright band on the horizon.
  const hazeColor = new THREE.Color(0.86, 0.54, 0.36).convertSRGBToLinear();
  scene.fog = new THREE.FogExp2(hazeColor.getHex(), 0.0017);

  const sky = createSkyLayer(backScene);
  const { pivot: rocket, vehicle } = createRocket(renderer, small, rocketName, ownedTextures);
  scene.add(rocket);
  const exhaust = createExhaust(vehicle, ownedTextures);

  const pad = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a393b, metalness: 0.6, roughness: 0.55, envMapIntensity: 0.5 });
  const armPivot = createTower(pad, steel);
  createPadStructures(pad, steel);
  createTreeline(pad, small);
  scene.add(pad);

  const { apron, land } = createGround(scene, renderer, small, ownedTextures);
  const { sunLight, engineLight } = createLights(scene, small);
  const steam = createSteam(scene, small, ownedTextures);

  const sunOnScreen = new THREE.Vector3();
  const rocketMid = new THREE.Vector3();
  const direction = new THREE.Vector3();

  const launch = {
    time: 0,
    speed: 1,
    hasRevealed: false,

    // How far the solar-system camera is pulled back: 1 at the start, 0 at the end.
    pull() {
      return 1 - Math.pow(smooth(5.5, ENDS, this.time - SECONDS_ON_PAD), 1.6);
    },

    // The sun's flare when the rocket arrives.
    flash() {
      return Math.exp(-Math.pow((this.time - SECONDS_ON_PAD - ARRIVES_AT_SUN) / 0.26, 2)) * 1.5;
    },

    // Skipping fast-forwards the flight, so the shot still ends in the same place.
    skip() {
      this.speed = 7;
    },

    draw(dt) {
      const step = dt * this.speed;
      this.time += step;
      const seconds = this.time - SECONDS_ON_PAD; // seconds since ignition
      const ignition = smooth(0, 0.7, seconds);
      const lift = Math.max(0, seconds - 1);
      const height = 5 * lift * lift;
      const altitude = smooth(1.4, 5.2, seconds);
      const aspect = state.W / state.H;

      // Camera: a long lens on the ground, tilting up with the rocket as it climbs away.
      const follow = (height * height) / (height + 12);
      const groundEye = 3 + follow;
      const trackY = 7.75 + (height * height) / (height + 2);
      const tilt = Math.atan((trackY - groundEye) / 30);
      const level = smooth(0.42, 0.6, altitude);
      const eyeY = groundEye + (trackY - groundEye) * level;
      const shake = ignition * (1 - smooth(1.2, 3.2, seconds)) * 0.035 + smooth(0.4, 1.6, seconds) * (1 - smooth(1.6, 3.4, seconds)) * 0.03;
      const creep = reduced ? 0 : (1 - smooth(-SECONDS_ON_PAD, 1, seconds)) * 0.9;
      camera.aspect = aspect;
      camera.position.set(Math.sin(this.time * 61) * shake, eyeY + Math.sin(this.time * 47) * shake, 30 + creep);
      camera.lookAt(0, trackY, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      // Sky: the true horizon follows the tilt, then the curved Earth rises and falls away.
      const u = sky.uniforms;
      u.alt.value = altitude;
      u.aspect.value = aspect;
      u.horizon.value = Math.max(-1.7, -Math.tan(tilt) / VIEW) + smooth(0.46, 0.62, altitude) * 0.92 - smooth(0.72, 0.96, altitude) * 1.05;
      u.radius.value = 60 + (2.7 - 60) * smooth(0.34, 0.6, altitude);
      scene.fog.density = 0.0017 * (1 - smooth(0.04, 0.2, altitude));
      scene.fog.color.copy(hazeColor);

      // Rocket: past the atmosphere it turns away and flies straight at the sun.
      const away = smooth(4.5, ARRIVES_AT_SUN, seconds);
      rocketMid.set(0, PAD_HEIGHT + ROCKET_MID + height, 0);
      const startDistance = rocketMid.distanceTo(camera.position);
      rocketMid.project(camera);
      sunOnScreen.copy(world.sun.position).project(world.camera);
      const blend = smooth(0.1, 0.9, away);
      direction
        .set(rocketMid.x + (sunOnScreen.x - rocketMid.x) * blend, rocketMid.y + (sunOnScreen.y - rocketMid.y) * blend, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize();
      rocket.position.copy(camera.position).addScaledVector(direction, startDistance + away * away * away * 1600);
      rocket.rotation.x = -away * 1.42;
      rocket.rotation.y = lift > 0 ? Math.min(lift * 0.05, 0.4) : 0;
      rocket.visible = seconds < ARRIVES_AT_SUN + 0.04;

      const isOnGround = altitude < 0.34;
      pad.visible = isOnGround;
      apron.visible = isOnGround;
      land.visible = isOnGround;

      // The swing arms pull back in the last second before ignition.
      armPivot.rotation.y = smooth(-1.1, -0.1, seconds) * 1.15;

      // Flame: short on the pad so it spreads into steam, opening out in the vacuum of space.
      const thrust = ignition * (1 + smooth(1, 2.4, seconds) * 0.25) * (1 - smooth(ARRIVES_AT_SUN - 0.2, ARRIVES_AT_SUN, seconds));
      exhaust.materials.forEach((material) => {
        material.uniforms.time.value = this.time;
        material.uniforms.thrust.value = thrust;
        material.uniforms.len.value = Math.min(thrust, 0.06 + height * 0.16) * (1 - level * 0.42);
      });
      const plume = 1 + level * 1.9;
      exhaust.outer.scale.set(plume, 1, plume);
      exhaust.inner.scale.set(0.58 * (1 + level * 0.9), 0.6, 0.58 * (1 + level * 0.9));
      exhaust.glow.material.opacity = Math.min(1, thrust) * (0.9 + Math.sin(this.time * 53) * 0.1) * (1 - level * 0.45);
      exhaust.glow.scale.setScalar(5.5 - level * 2.2);

      // Light: the engines light the pad, and daylight takes over as the rocket climbs out of the Earth's shadow.
      engineLight.position.set(rocket.position.x, rocket.position.y - ROCKET_MID - 1, rocket.position.z + 1.2);
      engineLight.intensity = 6.5 * Math.min(1, thrust) * (0.92 + Math.sin(this.time * 71) * 0.08) * (1 - away);
      sunLight.intensity = 1.5 + smooth(0.14, 0.46, altitude) * 0.9;
      const daylight = smooth(0.1, 0.42, altitude);
      sunLight.color.setRGB(1, 0.72 + daylight * 0.28, 0.54 + daylight * 0.46);
      steam.material.uniforms.uDay.value = smooth(0.06, 0.22, altitude);

      // Steam
      if (seconds < 1.3) emitVapour(steam, rocket, step);
      const inAir = 1 - smooth(0.4, 0.58, altitude);
      emitExhaustSteam(steam, rocket, step, height, (seconds > 0.03 ? (height < 8 ? 260 : 120) : 0) * inAir);
      updateSteam(steam, step, altitude, thrust, (state.H * state.pixelRatio) / (2 * VIEW));

      // Draw: lit in true colour with a film response. The solar system keeps its own direct colour pass.
      renderer.shadowMap.autoUpdate = isOnGround;
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(backScene, camera);
      renderer.clearDepth();
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.render(scene, camera);
      renderer.outputEncoding = THREE.LinearEncoding;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.autoClear = true;

      if (!this.hasRevealed && seconds >= ARRIVES_AT_SUN) {
        this.hasRevealed = true;
        onReveal();
      }
      if (seconds >= ENDS) {
        cleanUp();
        onFinish();
      }
    },
  };

  // Frees the graphics memory once the launch is over.
  function cleanUp() {
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.enabled = false;
    [backScene, scene].forEach((s) => s.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    }));
    sunLight.shadow.map?.dispose();
    ownedTextures.forEach((texture) => texture.dispose());
    reflections.dispose();
  }

  return launch;
}
