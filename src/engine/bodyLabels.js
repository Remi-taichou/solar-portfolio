import * as THREE from 'three';
import { MINI_R, MOON_R, STAR_R, SUN_R, isTouchDevice } from './config.js';
import { pixelsPerUnit, smooth } from './math.js';

const projected = new THREE.Vector3();
const toBody = new THREE.Vector3();

// Moves one clickable label so it sits on top of its 3D body.
function placeLabel(state, button, position, radius, isShown, opacity) {
  if (button.hidden === isShown) button.hidden = !isShown;
  if (!isShown) return;
  const { camera } = state.world;
  projected.copy(position).project(camera);
  const x = ((projected.x + 1) / 2) * state.W;
  const y = ((1 - projected.y) / 2) * state.H;
  const size = Math.max(44, radius * pixelsPerUnit(camera, state.H, camera.position.distanceTo(position)) * 2 + 8);
  button.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px,${(y - size / 2).toFixed(1)}px,0)`;
  button.style.width = button.style.height = `${size.toFixed(0)}px`;
  button.style.opacity = opacity.toFixed(3);
}

// Shows labels in the wide views only, so they never clutter a close-up.
export function updateBodyLabels(state, planetsShown) {
  const { tracks, bodies, stops, slide, activeTrack, isLaunching } = state;
  const dayF = tracks.day.f;
  const nightF = tracks.night.f;

  const dayOpacity =
    Math.max(1 - smooth(0.08, 0.42, dayF), smooth(stops.CONTACT - 0.42, stops.CONTACT - 0.08, dayF)) *
    (1 - smooth(0, 0.2, slide)) *
    planetsShown;
  const showDay = activeTrack === 'day' && dayOpacity > 0.05 && !isLaunching;

  placeLabel(state, bodies.sun.btn, bodies.sun.pos, SUN_R, showDay, dayOpacity);
  placeLabel(state, bodies.star.btn, bodies.star.pos, STAR_R, showDay && dayF < 1, dayOpacity);
  bodies.planets.forEach((p) => {
    placeLabel(state, p.btn, p.pos, p.radius * (p.surface === 'ringed' ? 1.5 : 1), showDay, dayOpacity);
  });

  const miniOpacity = (1 - smooth(0.1, 0.36, Math.abs(dayF - stops.EXPERIENCE))) * (1 - smooth(0, 0.2, slide));
  const showMinis = activeTrack === 'day' && miniOpacity > 0.05 && !isLaunching;
  bodies.minis.forEach((m) => {
    placeLabel(state, m.btn, m.pos, MINI_R * 1.5, showMinis, miniOpacity * Math.min(1, m.reveal));
  });

  const nightOpacity = smooth(0.84, 1, slide) * (1 - smooth(0.08, 0.42, nightF));
  const showNight = activeTrack === 'night' && nightOpacity > 0.05;
  bodies.interests.forEach((p) => {
    placeLabel(state, p.btn, p.pos, p.radius * (p.ringed ? 1.6 : 1), showNight, nightOpacity);
  });
}

// Finds the nearest body under a screen point by casting a ray from the camera through it.
export function pickBody(state, x, y) {
  const { world, bodies, stops, tracks, slide, activeTrack } = state;
  const dayView = activeTrack === 'day' && slide < 0.25;
  const nightView = activeTrack === 'night' && slide > 0.8;
  if (!world || (!dayView && !nightView)) return null;

  const { camera } = world;
  const origin = camera.position;
  projected.set((x / state.W) * 2 - 1, 1 - (y / state.H) * 2, 0.5).unproject(camera).sub(origin).normalize();
  const slack = isTouchDevice() ? 22 : 12;

  let best = null;
  let bestDepth = Infinity;
  const test = (body, center, radius) => {
    toBody.copy(center).sub(origin);
    const depth = toBody.dot(projected);
    if (depth <= 0 || depth >= bestDepth) return;
    const miss = toBody.addScaledVector(projected, -depth).length();
    if (miss <= radius + slack / pixelsPerUnit(camera, state.H, depth)) {
      best = body;
      bestDepth = depth;
    }
  };

  if (nightView) {
    test('moon', world.moon.position, MOON_R);
    bodies.interests.forEach((p) => test(p, p.pos, p.radius * (p.ringed ? 2.2 : 1.05)));
    return best === 'moon' ? null : best;
  }

  test(bodies.sun, world.sun.position, SUN_R);
  if (tracks.day.f < stops.CONTACT - 0.4) test(bodies.star, bodies.star.pos, STAR_R);
  bodies.minis.forEach((m) => {
    if (m.reveal > 0.4) test(m, m.pos, MINI_R * 1.5);
  });
  bodies.planets.forEach((p) => test(p, p.pos, p.radius * (p.surface === 'ringed' ? 2.3 : 1.05)));
  return best;
}
