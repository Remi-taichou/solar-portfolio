import * as THREE from 'three';
import { FULLSCREEN_VERT, NOISE, WARP } from './shaders/common.js';
import { SURFACES } from './shaders/surfaces.js';

// Paints each planet's surface once on the GPU, so drawing it afterwards costs one texture lookup.
export function createTextureBaker(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  scene.add(quad);

  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const jobs = [];

  function makeTarget(size) {
    return new THREE.WebGLRenderTarget(size * 2, size, {
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      generateMipmaps: true,
      depthBuffer: false,
      anisotropy,
    });
  }

  function makeMaterial(surface, seed) {
    return new THREE.ShaderMaterial({
      uniforms: { seed: { value: seed } },
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: `uniform float seed;varying vec2 vUv;${NOISE}${WARP}
        vec4 surface(vec3 d){${SURFACES[surface]}}
        void main(){float th=(1.-vUv.y)*3.14159265;float ph=vUv.x*6.2831853;gl_FragColor=surface(vec3(-cos(ph)*sin(th),cos(th),sin(ph)*sin(th)));}`,
    });
  }

  // Paints a texture straight away. Used for the first, lower-resolution version.
  function bake(surface, seed, size) {
    const target = makeTarget(size);
    quad.material = makeMaterial(surface, seed);
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    quad.material.dispose();
    return { tex: target.texture, size, rt: target };
  }

  // Asks for a sharper version, painted later in thin strips so the page never stalls.
  function queueBake(surface, seed, size, onDone) {
    if (size > 0) jobs.push({ surface, seed, size, onDone, row: 0, tiles: 24 });
  }

  // Paints one strip. Call once per frame. Returns true while there is still work to do.
  function paintNextStrip() {
    const job = jobs[0];
    if (!job) return false;

    if (!job.target) {
      job.target = makeTarget(job.size);
      job.target.texture.generateMipmaps = false;
      job.target.scissorTest = true;
      job.material = makeMaterial(job.surface, job.seed);
    }

    const rowHeight = Math.ceil(job.size / job.tiles);
    const isLastRow = job.row === job.tiles - 1;
    if (isLastRow) job.target.texture.generateMipmaps = true;
    job.target.scissor.set(0, job.row * rowHeight, job.size * 2, rowHeight);

    quad.material = job.material;
    const clearing = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(job.target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.autoClear = clearing;

    job.row++;
    if (isLastRow) {
      job.material.dispose();
      job.onDone({ tex: job.target.texture, size: job.size, rt: job.target });
      jobs.shift();
    }
    return true;
  }

  return { bake, queueBake, paintNextStrip };
}
