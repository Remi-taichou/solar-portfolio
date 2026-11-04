import * as THREE from 'three';
import { BODY_VERT, RING_VERT } from '../shaders/common.js';
import { BODY_FRAG, HALO_FRAG, RING_FRAG } from '../shaders/bodies.js';

// The default light: a point of light at the sun, in the centre of the system.
const SUN_LIGHT = new THREE.Vector4(0, 0, 0, 1);

// The surface of a planet or moon.
export function createBodyMaterial(baked, options) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: baked.tex },
      light: { value: options.light || SUN_LIGHT },
      sunK: { value: 1 },
      bump: { value: options.bump },
      emit: { value: options.emit || 0 },
      ambient: { value: options.ambient ?? 0.025 },
      atm: { value: new THREE.Color(options.atm) },
      texel: { value: new THREE.Vector2() },
      detail: { value: 0 },
      detailBump: { value: options.detailBump || 0 },
      detailFreq: { value: options.detailFreq || 70 },
      gloss: { value: options.gloss || 0 },
    },
    vertexShader: BODY_VERT,
    fragmentShader: BODY_FRAG,
  });
}

// Swaps in a newly painted texture. Terrain relief is measured across a few texels,
// so its strength is rescaled with the texture size.
export function applyBakedTexture(material, baked, baseBump) {
  const u = material.uniforms;
  if (material.userData.rt) material.userData.rt.dispose();
  material.userData.rt = baked.rt;
  u.map.value = baked.tex;
  u.texel.value.set(2.5 / (baked.size * 2), 2.5 / baked.size);
  u.bump.value = baseBump * (baked.size / 1024) * 0.6;
}

// The soft glow of atmosphere around a planet's edge.
export function createHaloMaterial(color, light) {
  return new THREE.ShaderMaterial({
    uniforms: {
      light: { value: light || SUN_LIGHT },
      sunK: { value: 1 },
      edge: { value: Math.sqrt(1 - 1 / (1.07 * 1.07)) },
      atm: { value: new THREE.Color(color) },
    },
    vertexShader: BODY_VERT,
    fragmentShader: HALO_FRAG,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

// A planet's rings. `isRecord` draws them as a vinyl record instead of ice and rock.
export function createRingMaterial(rIn, rOut, isRecord) {
  return new THREE.ShaderMaterial({
    uniforms: {
      sunPos: { value: new THREE.Vector3() },
      center: { value: new THREE.Vector3() },
      radius: { value: 1 },
      sunK: { value: 1 },
      rIn: { value: rIn },
      rOut: { value: rOut },
      record: { value: isRecord ? 1 : 0 },
    },
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  });
}
