import * as THREE from 'three';
import { MINI_R, MOON_R, PHONE_WIDTH, STAR_R, SYSTEM_TILT } from '../config.js';
import { clamp, easeFactor, pixelsPerUnit, smooth } from '../math.js';

const toCamera = new THREE.Vector3();

// `slide` is the slider position: 0 at the sun, 0.5 at total eclipse, 1 at the moon.
// All the light in the scene follows from it.
export function computeLighting(slide) {
  return {
    eclipse: Math.exp(-Math.pow((slide - 0.5) / 0.1, 2)),
    sunlight: 1 - smooth(0.3, 0.5, slide),
    sunPower: 1 - smooth(0.56, 0.84, slide),
    moonLit: smooth(0.52, 0.94, slide),
    planetsShown: 1 - smooth(0.5, 0.8, slide),
    interestsShown: smooth(0.7, 0.94, slide),
  };
}

// How sharply to draw fine surface detail, based on how large a body looks on screen.
function detailAmount(state, radius, position) {
  const { camera } = state.world;
  return smooth(110, 320, radius * pixelsPerUnit(camera, state.H, camera.position.distanceTo(position)));
}

// Moves the project planets along their orbits and updates their light.
export function updatePlanets(state, dt, lighting, closeUp) {
  const { world, bodies, reduced } = state;
  const anyHover = bodies.planets.some((p) => p.hover);
  const targetFlow = anyHover || reduced ? 0 : 1 - closeUp * 0.85;
  state.flow += (targetFlow - state.flow) * easeFactor(5, dt);

  bodies.planets.forEach((p) => {
    p.angle += dt * state.flow * 0.15 * Math.pow(18 / p.orbit, 1.5);
    p.hoverK += (p.hover - p.hoverK) * (reduced ? 1 : easeFactor(10, dt));
    p.pulse *= Math.exp(-dt * 6);
    p.hoverScale = 1 + p.hoverK * (0.16 - closeUp * 0.11) + p.pulse * 0.07;

    const s = Math.sin(p.angle);
    const c = Math.cos(p.angle);
    const size = p.radius * p.hoverScale;
    p.pos.set(c * p.orbit, s * p.orbit * p.inc, s * p.orbit).applyAxisAngle(world.tiltAxis, SYSTEM_TILT);
    p.group.position.copy(p.pos);
    p.group.scale.setScalar(size);
    if (!reduced) p.globe.rotation.y += dt * (0.12 + p.index * 0.012);

    p.group.visible = lighting.planetsShown > 0.01;
    p.line.visible = lighting.planetsShown > 0.01;
    p.line.material.opacity = (0.13 + p.hoverK * 0.45) * lighting.planetsShown * (1 - closeUp * 0.55);

    const light = 0.07 + 0.93 * lighting.sunlight;
    p.globe.material.uniforms.sunK.value = light;
    p.globe.material.uniforms.detail.value = detailAmount(state, p.radius, p.pos);
    p.halo.material.uniforms.sunK.value = light;
    if (p.ringMat) {
      p.ringMat.uniforms.center.value.copy(p.pos);
      p.ringMat.uniforms.radius.value = size;
      p.ringMat.uniforms.sunK.value = light;
    }
  });
}

// Moves the interest planets around the moon, slowing down once you are close to one.
export function updateInterests(state, dt, lighting) {
  const { world, bodies, reduced } = state;
  const near = smooth(0, 0.6, state.tracks.night.f);
  const anyHover = bodies.interests.some((p) => p.hover);

  world.moonSystem.scale.setScalar(state.W <= PHONE_WIDTH ? 0.82 : 1);
  world.moonSystem.updateMatrixWorld();

  bodies.interests.forEach((p) => {
    if (!reduced && !anyHover) p.angle += dt * 0.16 * Math.pow(4.3 / p.orbit, 1.5) * (1 - near * 0.86);
    p.hoverK += (p.hover - p.hoverK) * (reduced ? 1 : easeFactor(10, dt));
    p.pulse *= Math.exp(-dt * 6);
    p.hoverScale = 1 + p.hoverK * (0.16 - near * 0.11) + p.pulse * 0.07;

    p.pos.set(Math.cos(p.angle) * p.orbit, 0, Math.sin(p.angle) * p.orbit).applyMatrix4(world.moonSystem.matrixWorld);
    p.group.position.copy(p.pos);
    p.group.scale.setScalar(p.radius * p.hoverScale);
    if (!reduced) p.globe.rotation.y += dt * 0.16;

    p.group.visible = lighting.interestsShown > 0.01;
    p.line.visible = lighting.interestsShown > 0.01;
    p.line.material.opacity = (0.16 + p.hoverK * 0.45) * lighting.interestsShown * (1 - near * 0.6);

    // There is no sun out here, so a light follows the viewer. Raking it across each planet gives it a day and night side.
    toCamera.copy(world.camera.position).sub(p.pos).normalize();
    p.light.set(toCamera.x - 0.95, toCamera.y + 0.72, toCamera.z + 0.02, 0);

    if (p.ringMat) {
      p.ringMat.uniforms.center.value.copy(p.pos);
      p.ringMat.uniforms.radius.value = p.radius * p.hoverScale;
      p.ringMat.uniforms.sunPos.value.set(p.pos.x + p.light.x * 1000, p.pos.y + p.light.y * 1000, p.pos.z + p.light.z * 1000);
      p.ringMat.uniforms.sunK.value = lighting.interestsShown;
    }
    p.globe.material.uniforms.sunK.value = lighting.interestsShown * 0.85;
    p.halo.material.uniforms.sunK.value = lighting.interestsShown;
    p.globe.material.uniforms.detail.value = detailAmount(state, p.radius, p.pos);
  });
}

// The sun's surface and its corona, including the flash when the rocket arrives.
export function updateSun(state, lighting) {
  const { world, clock, launch } = state;
  world.sun.visible = lighting.sunPower > 0.002;
  world.corona.visible = lighting.sunPower > 0.002;
  world.sunMat.uniforms.time.value = clock;
  world.coronaMat.uniforms.time.value = clock;
  world.coronaMat.uniforms.power.value =
    lighting.sunPower * (0.2 + 0.8 * Math.max(lighting.sunlight, lighting.eclipse)) + (launch ? launch.flash() : 0);
  world.coronaMat.uniforms.eclipse.value = lighting.eclipse;
  world.corona.quaternion.copy(world.camera.quaternion);
}

// The moon slides in from the right, reaches the sun halfway, then stays while the camera closes in.
export function updateMoon(state, lighting) {
  const { world, slide, clock, reduced } = state;
  const progress = clamp(slide / 0.5, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 2.4);

  world.moon.visible = slide > 0.002;
  world.moon.position.copy(world.moonRest);
  world.moon.position.x += (1 - eased) * 62;
  world.moon.position.y += (1 - eased) * 7;
  world.moonGlobe.rotation.y = reduced ? 0 : clock * 0.012 + state.parallaxX * 0.05;
  world.moonGlobe.material.uniforms.sunK.value = lighting.moonLit * 0.78;
  world.moonGlobe.material.uniforms.detail.value = detailAmount(state, MOON_R, world.moon.position);
  world.moonHalo.material.uniforms.sunK.value = lighting.moonLit;
}

// The big star. It belongs to the daytime sky, and its glare eases off up close so the page stays readable.
export function updateBrightStar(state, lighting) {
  const { world, clock, stops, tracks } = state;
  const dayF = tracks.day.f;
  const power = lighting.planetsShown * (0.45 + 0.55 * lighting.sunlight) * (1 - smooth(stops.CONTACT - 0.6, stops.CONTACT - 0.1, dayF));
  const away = dayF < stops.EXPERIENCE ? stops.EXPERIENCE - dayF : dayF > stops.CONTACT - 1 ? dayF - (stops.CONTACT - 1) : 0;

  world.brightStar.visible = power > 0.01;
  world.starGlow.visible = power > 0.01;
  world.brightStarMat.uniforms.time.value = clock;
  world.starGlowMat.uniforms.time.value = clock;
  // Up close it shrinks to a small hot core with long spikes, so it reads as a star and not a second sun.
  const closeness = 1 - Math.min(1, away);
  world.brightStar.scale.setScalar(STAR_R * (1 - closeness * 0.62));
  world.starGlow.scale.setScalar(STAR_R * 30 * (1 - closeness * 0.28));
  // At a single role's stop the big star's glare fades further, so it never washes over the text or slider.
  const atRole = smooth(stops.EXPERIENCE + 0.1, stops.EXPERIENCE + 0.7, dayF) * (1 - smooth(stops.CONTACT - 0.7, stops.CONTACT - 0.1, dayF));
  world.starGlowMat.uniforms.power.value = power * (1 - closeness * 0.25) * (1 - atRole * 0.7);
  world.starGlow.quaternion.copy(world.camera.quaternion);
}

// Mini stars come out one after another as you arrive at the big star, and leave as you go.
export function updateMiniStars(state, dt, lighting) {
  const { world, clock, stops, tracks, bodies, reduced } = state;
  const dayF = tracks.day.f;

  bodies.minis.forEach((m, i) => {
    m.reveal =
      smooth(stops.EXPERIENCE - 0.6 + i * 0.035, stops.EXPERIENCE - 0.15 + i * 0.035, dayF) *
      (1 - smooth(stops.CONTACT - 0.6, stops.CONTACT - 0.12, dayF)) *
      lighting.planetsShown;
    m.hoverK += (m.hover - m.hoverK) * (reduced ? 1 : easeFactor(10, dt));

    const isOn = m.reveal > 0.01;
    m.body.visible = isOn;
    m.glow.visible = isOn;
    if (!isOn) return;

    const focus = 1 - Math.min(1, Math.abs(dayF - (stops.FIRST_ROLE + i)) * 1.6);
    // A tiny bright point: the twinkling glow around it does most of the work.
    m.body.scale.setScalar(MINI_R * 0.42 * m.reveal * (1 + m.hoverK * 0.28));
    m.glow.position.copy(m.pos);
    m.glow.quaternion.copy(world.camera.quaternion);
    m.glow.scale.setScalar(MINI_R * 13 * (1 + m.hoverK * 0.4));
    m.glowMat.uniforms.time.value = clock;
    m.bodyMat.uniforms.time.value = clock;
    m.glowMat.uniforms.power.value = 0.95 * m.reveal * (1 - focus * 0.35) * (1 + m.hoverK * 0.5);
  });
}

// Background stars, dust and the galaxy dome, which stay centred on the camera.
export function updateBackdrop(state, lighting) {
  const { world, clock, slide, pixelRatio } = state;
  world.stars.material.uniforms.uTime.value = clock;
  world.stars.material.uniforms.uNight.value = smooth(0.2, 0.7, slide);
  world.stars.material.uniforms.uPx.value = pixelRatio;
  world.dust.material.uniforms.uTime.value = clock;
  world.dust.material.uniforms.uPx.value = pixelRatio;
  world.dust.material.uniforms.uNight.value = 1;
  world.dust.visible = lighting.planetsShown > 0.01;
  world.sky.position.copy(world.camera.position);
  world.stars.position.copy(world.camera.position).multiplyScalar(0.85);
}
