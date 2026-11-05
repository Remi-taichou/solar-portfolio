import * as THREE from 'three';
import { ECLIPSE_CAM, MOON_R, STAR_R, SUN_R, SYSTEM_TILT, isSmallScreen } from '../config.js';
import { BODY_VERT, PLAIN_VERT } from '../shaders/common.js';
import { CORONA_FRAG, POINT_FRAG, POINT_VERT, STAR_FRAG, STAR_GLOW_FRAG, SUN_FRAG } from '../shaders/stars.js';
import { SURFACES } from '../shaders/surfaces.js';
import { createTextureBaker } from '../textureBaker.js';
import { applyBakedTexture, createBodyMaterial, createHaloMaterial, createRingMaterial } from './materials.js';

// How strongly each surface shows terrain relief, large-scale and up close.
const TERRAIN_BUMP = { ocean: 1.4, rust: 3, banded: 0, ringed: 0, ice: 1.6, lava: 3 };
const FINE_BUMP = { ocean: 0.5, rust: 1.1, banded: 0, ringed: 0, ice: 0.5, lava: 0.9, kombat: 0.9 };
const SHINE = { blaugrana: 0.1, kombat: 0.55, vinyl: 0.3, bleach: 0.18, circuit: 0.35 };

// Builds everything in the solar system. Each create function below adds one kind of object.
export function createWorld(canvas, bodies) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x05060d);

  const small = isSmallScreen();
  const lowSize = small ? 512 : 1024;
  const highSize = Math.min(small ? 1024 : 2048, Math.floor(renderer.capabilities.maxTextureSize / 2));

  const shared = {
    scene: new THREE.Scene(),
    baker: createTextureBaker(renderer),
    sphere: new THREE.SphereGeometry(1, 192, 128),
    lowSphere: new THREE.SphereGeometry(1, 64, 48),
    small,
    lowSize,
    highSize,
  };

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 7000);
  const sky = createSkyDome(shared);
  const { stars, dust } = createStarPoints(shared, bodies.maxOrbit);
  const sunParts = createSun(shared);
  createPlanets(shared, bodies.planets);
  const moonParts = createMoon(shared);
  const starParts = createBrightStar(shared);
  bodies.star.pos = starParts.brightStar.position;
  bodies.sun.pos = sunParts.sun.position;
  createMiniStars(shared, bodies.minis, starParts);
  const moonSystem = createInterestPlanets(shared, bodies.interests);

  const eclipsePos = new THREE.Vector3(...ECLIPSE_CAM);
  const moonRest = eclipsePos.clone().multiplyScalar(1 - 38 / eclipsePos.length());
  moonSystem.position.copy(moonRest);

  return {
    renderer,
    scene: shared.scene,
    camera,
    sky,
    stars,
    dust,
    ...sunParts,
    ...moonParts,
    ...starParts,
    moonSystem,
    eclipsePos,
    eclipseLook: new THREE.Vector3(),
    moonRest,
    tiltAxis: new THREE.Vector3(0, 0, 1),
    systemUp: new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), SYSTEM_TILT),
    paintNextStrip: shared.baker.paintNextStrip,
  };
}

// The faint galaxy painted on a giant sphere around everything.
function createSkyDome({ scene, baker, lowSphere, small, highSize }) {
  const first = baker.bake('sky', 3.3, small ? 512 : 1024);
  const sky = new THREE.Mesh(
    lowSphere,
    new THREE.MeshBasicMaterial({ map: first.tex, side: THREE.BackSide, depthWrite: false, toneMapped: false }),
  );
  baker.queueBake('sky', 3.3, highSize, (baked) => {
    sky.material.map = baked.tex;
    first.rt.dispose();
  });
  sky.scale.setScalar(4000);
  sky.renderOrder = -10;
  scene.add(sky);
  return sky;
}

// A cloud of glowing points, placed by the `place` function.
function createPointCloud(scene, count, place, attenuate) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const layers = new Float32Array(count);
  const point = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const look = place(point, i);
    positions.set([point.x, point.y, point.z], i * 3);
    colors.set(look.color, i * 3);
    sizes[i] = look.size;
    phases[i] = Math.random();
    layers[i] = look.layer || 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: 1 }, uTime: { value: 0 }, uNight: { value: 0 }, uAtten: { value: attenuate } },
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  return points;
}

// Background stars (half only come out at night) and the dust drifting between the orbits.
function createStarPoints({ scene, small }, maxOrbit) {
  const stars = createPointCloud(scene, small ? 4500 : 9000, (p, i) => {
    p.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    p.multiplyScalar(1500 + Math.random() * 1800);
    const tone = Math.random();
    const b = 0.45 + Math.pow(Math.random(), 3) * 0.55;
    const color = tone < 0.2 ? [b, b * 0.84, b * 0.68] : tone > 0.8 ? [b * 0.74, b * 0.84, b] : [b, b, b * 1.02];
    return { color, size: 0.8 + Math.pow(Math.random(), 5) * 2.8, layer: i % 2 };
  }, 0);

  const dust = createPointCloud(scene, small ? 700 : 1500, (p) => {
    const inBelt = Math.random() < 0.6;
    const r = inBelt ? maxOrbit * 0.63 + (Math.random() - 0.5) * 8 : 12 + Math.random() * maxOrbit * 1.2;
    const a = Math.random() * 6.283;
    p.set(Math.cos(a) * r, (Math.random() - 0.5) * (inBelt ? 2 : 10), Math.sin(a) * r);
    const b = 0.22 + Math.random() * 0.3;
    return { color: [b, b * 0.95, b * 0.88], size: 0.35 + Math.random() * 0.6 };
  }, 1);
  dust.rotation.z = SYSTEM_TILT;

  return { stars, dust };
}

// The sun and the corona behind it.
function createSun({ scene, sphere }) {
  const sunMat = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 } }, vertexShader: BODY_VERT, fragmentShader: SUN_FRAG });
  const sun = new THREE.Mesh(sphere, sunMat);
  sun.scale.setScalar(SUN_R);
  scene.add(sun);

  const coronaMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, power: { value: 1 }, eclipse: { value: 0 } },
    vertexShader: PLAIN_VERT,
    fragmentShader: CORONA_FRAG,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), coronaMat);
  corona.scale.setScalar(SUN_R * 20);
  scene.add(corona);

  return { sun, sunMat, corona, coronaMat };
}

// A thin line tracing a circular orbit.
function createOrbitLine(points, opacity) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xc4d0f0, transparent: true, opacity, depthWrite: false }),
  );
}

// One planet per project: surface, atmosphere, optional rings and an orbit line.
function createPlanets({ scene, baker, sphere, lowSphere, lowSize, highSize }, planets) {
  planets.forEach((planet, i) => {
    const surface = SURFACES[planet.surface] ? planet.surface : 'rust';
    const seed = 11 + i * 7.3;
    const first = baker.bake(surface, seed, lowSize);
    const bump = TERRAIN_BUMP[surface] || 0;

    const globe = new THREE.Mesh(sphere, createBodyMaterial(first, {
      bump,
      atm: planet.color,
      emit: surface === 'lava' ? 1 : 0,
      detailBump: FINE_BUMP[surface] || 0,
    }));
    applyBakedTexture(globe.material, first, bump);
    baker.queueBake(surface, seed, highSize, (baked) => applyBakedTexture(globe.material, baked, bump));
    globe.rotation.z = 0.22 - i * 0.09;

    const halo = new THREE.Mesh(lowSphere, createHaloMaterial(planet.color));
    halo.scale.setScalar(1.07);

    const group = new THREE.Group();
    group.add(globe, halo);

    if (surface === 'ringed') {
      planet.ringMat = createRingMaterial(1.42, 2.45, false);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.42, 2.45, 160, 1), planet.ringMat);
      ring.rotation.set(Math.PI / 2 - 0.3, 0.18, 0);
      group.add(ring);
    }

    group.rotation.z = SYSTEM_TILT;
    scene.add(group);

    const points = [];
    for (let k = 0; k <= 256; k++) {
      const a = (k / 256) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * planet.orbit, Math.sin(a) * planet.orbit * planet.inc, Math.sin(a) * planet.orbit));
    }
    const line = createOrbitLine(points, 0.16);
    line.rotation.z = SYSTEM_TILT;
    scene.add(line);

    Object.assign(planet, { group, globe, halo, line, pos: new THREE.Vector3(), surface });
  });
}

// The moon. It is lit from the camera side, because with the sun behind it, it would be a black disc.
function createMoon({ scene, baker, sphere, lowSphere, lowSize, highSize }) {
  const moonLight = new THREE.Vector4(-0.55, 0.42, 0.8, 0);
  const first = baker.bake('moon', 5.7, lowSize);

  const moonGlobe = new THREE.Mesh(sphere, createBodyMaterial(first, {
    bump: 2.75,
    atm: '#aebfe2',
    light: moonLight,
    ambient: 0.012,
    detailBump: 1.5,
    detailFreq: 95,
  }));
  applyBakedTexture(moonGlobe.material, first, 2.75);
  baker.queueBake('moon', 5.7, highSize, (baked) => applyBakedTexture(moonGlobe.material, baked, 2.75));

  const moonHalo = new THREE.Mesh(lowSphere, createHaloMaterial('#aebfe2', moonLight));
  moonHalo.scale.setScalar(1.07);

  const moon = new THREE.Group();
  moon.add(moonGlobe, moonHalo);
  moon.scale.setScalar(MOON_R);
  scene.add(moon);

  return { moon, moonGlobe, moonHalo };
}

// The big bright Experience star: a sun-sized body with a glow and light spikes.
function createBrightStar({ scene, sphere }) {
  const brightStarMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, tint: { value: new THREE.Color('#c6dfff') } },
    vertexShader: BODY_VERT,
    fragmentShader: STAR_FRAG,
  });
  const brightStar = new THREE.Mesh(sphere, brightStarMat);
  brightStar.scale.setScalar(STAR_R);
  scene.add(brightStar);

  const starGlowMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      power: { value: 1 },
      twinkle: { value: 0.08 },
      phase: { value: 0 },
      tint: { value: new THREE.Color('#bcd8ff') },
    },
    vertexShader: PLAIN_VERT,
    fragmentShader: STAR_GLOW_FRAG,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const starGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), starGlowMat);
  starGlow.scale.setScalar(STAR_R * 30);
  scene.add(starGlow);

  return { brightStar, brightStarMat, starGlow, starGlowMat };
}

// One small twinkling star for each role on your resume.
function createMiniStars({ scene, sphere }, minis, { brightStarMat, starGlow, starGlowMat }) {
  minis.forEach((mini, i) => {
    mini.bodyMat = brightStarMat.clone();
    mini.bodyMat.uniforms.tint.value = new THREE.Color(mini.color);
    mini.body = new THREE.Mesh(sphere, mini.bodyMat);
    scene.add(mini.body);

    mini.glowMat = starGlowMat.clone();
    mini.glowMat.uniforms.tint.value = new THREE.Color(mini.color);
    mini.glowMat.uniforms.twinkle.value = 0.78;
    mini.glowMat.uniforms.phase.value = i * 1.9;
    mini.glow = new THREE.Mesh(starGlow.geometry, mini.glowMat);
    scene.add(mini.glow);

    mini.pos = mini.body.position;
    mini.body.visible = false;
    mini.glow.visible = false;
  });
}

// Interest planets: a small system of their own, tilted to match, circling the moon.
function createInterestPlanets({ scene, baker, sphere, lowSphere, lowSize, highSize }, interests) {
  const moonSystem = new THREE.Group();
  moonSystem.rotation.set(0.62, 0, SYSTEM_TILT);
  scene.add(moonSystem);

  interests.forEach((interest, i) => {
    const isUsable = SURFACES[interest.surface] && interest.surface !== 'moon' && interest.surface !== 'sky';
    const surface = isUsable ? interest.surface : 'rust';
    const seed = 57 + i * 9.1;
    const first = baker.bake(surface, seed, lowSize);
    const bump = TERRAIN_BUMP[surface] || 0;

    interest.light = new THREE.Vector4(0, 0, 1, 0);
    const globe = new THREE.Mesh(sphere, createBodyMaterial(first, {
      bump,
      atm: interest.color,
      light: interest.light,
      ambient: 0.035,
      emit: surface === 'lava' || surface === 'kombat' || surface === 'circuit' ? 1.15 : 0,
      detailBump: FINE_BUMP[surface] || 0,
      gloss: SHINE[surface] || 0,
    }));
    applyBakedTexture(globe.material, first, bump);
    baker.queueBake(surface, seed, highSize, (baked) => applyBakedTexture(globe.material, baked, bump));

    const halo = new THREE.Mesh(lowSphere, createHaloMaterial(interest.color, interest.light));
    halo.scale.setScalar(1.07);

    const group = new THREE.Group();
    group.add(globe, halo);
    scene.add(group);

    // Music wears a record as its ring: fine grooves, a moving sheen and a gold inner edge.
    if (surface === 'vinyl') {
      interest.ringMat = createRingMaterial(1.32, 2.75, true);
      const disc = new THREE.Mesh(new THREE.RingGeometry(1.32, 2.75, 200, 1), interest.ringMat);
      disc.rotation.set(Math.PI / 2 - 0.92, 0.3, 0);
      group.add(disc);
      interest.ringed = true;
    }

    const points = [];
    for (let k = 0; k <= 200; k++) {
      const a = (k / 200) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * interest.orbit, 0, Math.sin(a) * interest.orbit));
    }
    const line = createOrbitLine(points, 0);
    moonSystem.add(line);

    Object.assign(interest, { group, globe, halo, line, pos: new THREE.Vector3(), surface });
  });

  return moonSystem;
}
