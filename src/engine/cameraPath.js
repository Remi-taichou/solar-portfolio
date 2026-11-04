import * as THREE from 'three';
import { MOON_R, PHONE_WIDTH, STAR_R, SUN_R } from './config.js';
import { clamp, easeFactor, smooth } from './math.js';

const UP = new THREE.Vector3(0, 1, 0);
const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const vC = new THREE.Vector3();
const dayPos = new THREE.Vector3();
const dayLook = new THREE.Vector3();
const nightPos = new THREE.Vector3();
const nightLook = new THREE.Vector3();
const toEye = new THREE.Vector3();
const starToCamera = new THREE.Vector3();
const ringRight = new THREE.Vector3();
const ringUp = new THREE.Vector3();
const shiftForward = new THREE.Vector3();
const shiftRight = new THREE.Vector3();
const shiftUp = new THREE.Vector3();

// A "keyframe" is one camera spot: where it sits (pos) and where it looks (look).
// There is one per scroll stop, recalculated every frame because the planets keep moving.
export function createCameraPath(state) {
  const { bodies } = state;
  const makeVectors = (count) => Array.from({ length: count }, () => new THREE.Vector3());
  const dayStopCount = state.stops.CONTACT + 1;
  const nightStopCount = 1 + bodies.interests.length;
  return {
    dayPos: makeVectors(dayStopCount),
    dayLook: makeVectors(dayStopCount),
    nightPos: makeVectors(nightStopCount),
    nightLook: makeVectors(nightStopCount),
  };
}

// Moves the look point so a body sits beside the text, or above it on a phone.
function shiftFraming(pos, look, amount, bodyOnRight, isPhone) {
  shiftForward.copy(look).sub(pos).normalize();
  shiftRight.crossVectors(shiftForward, UP).normalize();
  if (isPhone) {
    shiftUp.crossVectors(shiftRight, shiftForward).normalize();
    look.addScaledVector(shiftUp, -amount);
  } else {
    look.addScaledVector(shiftRight, bodyOnRight ? -amount : amount);
  }
}

// The opening view of the whole system. Returns the camera distance so other stops can use it.
function setOverviewStop(path, state, tanV, aspect, isPhone) {
  const { maxOrbit } = state.bodies;
  const reach = maxOrbit * 1.12;
  const distance = Math.max(reach / (tanV * aspect), (reach * 0.74) / tanV);
  const elevation = isPhone ? 0.95 : 0.44;
  path.dayPos[0].set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance);
  path.dayLook[0].set(0, isPhone ? 0 : -maxOrbit * 0.1, 0);
  return distance;
}

// Close to the sun, from above the orbits so no planet passes right by the lens.
function setSunStop(path, isPhone) {
  const distance = SUN_R * (isPhone ? 7.2 : 4.1);
  path.dayPos[1].set(0.24, 0.72, 1).normalize().multiplyScalar(distance);
  path.dayLook[1].set(0, 0, 0);
  shiftFraming(path.dayPos[1], path.dayLook[1], SUN_R * (isPhone ? 1.05 : 1.15), true, isPhone);
}

// One close-up per project planet, seen from its sunlit side.
function setProjectStops(path, state, isPhone) {
  const { world, bodies, stops } = state;
  bodies.planets.forEach((p, i) => {
    const k = stops.FIRST_PROJECT + i;
    const ringed = p.surface === 'ringed';
    vA.copy(p.pos).normalize();
    vB.crossVectors(vA, world.systemUp).normalize();
    vC.set(0, 0, 0)
      .addScaledVector(vA, -0.82)
      .addScaledVector(vB, i % 2 ? 0.5 : -0.5)
      .addScaledVector(world.systemUp, ringed ? 0.46 : 0.24)
      .normalize();
    const distance = p.radius * (ringed ? 9 : 4.5) * (isPhone ? 1.5 : 1);
    path.dayPos[k].copy(p.pos).addScaledVector(vC, distance);
    path.dayLook[k].copy(p.pos);
    shiftFraming(path.dayPos[k], path.dayLook[k], p.radius * (ringed ? 2.5 : 1.2) * (isPhone ? 1.15 : 1), i % 2 === 0, isPhone);
  });
}

// How far the camera sits from the big star at the Experience stop.
// On narrower windows it backs up, so the whole ring of mini stars still fits beside the text.
function starStopDistance(isPhone, tanV, aspect) {
  if (isPhone) return STAR_R * 11.5;
  return Math.max(STAR_R * 7.5, 31 / (tanV * aspect));
}

// Keeps the big star in the empty corner of the opening view, however the screen is shaped.
function placeBrightStar(path, state, overviewDistance, tanV, aspect, isPhone) {
  const { world } = state;
  vA.copy(path.dayLook[0]).sub(path.dayPos[0]).normalize();
  vB.crossVectors(vA, UP).normalize();
  vC.crossVectors(vB, vA).normalize();

  // The Experience camera sits between the star and the sun, so the star must be far enough
  // from the sun for that camera to fit. Moving it deeper keeps the same spot on screen.
  const clearance = starStopDistance(isPhone, tanV, aspect) + SUN_R * 6;
  let depth = overviewDistance * (isPhone ? 1.6 : 1.75);
  for (let attempt = 0; attempt < 12; attempt++) {
    world.brightStar.position
      .copy(path.dayPos[0])
      .addScaledVector(vA, depth)
      .addScaledVector(vB, -(isPhone ? 0.5 : 0.66) * depth * tanV * aspect)
      .addScaledVector(vC, (isPhone ? 0.56 : 0.6) * depth * tanV);
    if (world.brightStar.position.length() >= clearance) break;
    depth *= 1.12;
  }
  world.starGlow.position.copy(world.brightStar.position);
}

// The big star's stop, the ring of mini stars around it, and one close-up per mini star.
function setExperienceStops(path, state, tanV, aspect, isPhone) {
  const { world, bodies, stops } = state;
  const center = world.brightStar.position;
  const k = stops.EXPERIENCE;

  starToCamera.copy(center).normalize().negate();
  path.dayPos[k].copy(center).addScaledVector(starToCamera, starStopDistance(isPhone, tanV, aspect));
  path.dayLook[k].copy(center);

  ringRight.crossVectors(starToCamera, UP).normalize().negate();
  ringUp.crossVectors(ringRight, starToCamera).normalize().negate();

  bodies.minis.forEach((m, i) => {
    // Two staggered rings, so the labels do not collide.
    const ring = i % 2 ? 14 : isPhone ? 9.5 : 10;
    m.pos
      .copy(center)
      .addScaledVector(ringRight, Math.cos(m.angle) * ring)
      .addScaledVector(ringUp, Math.sin(m.angle) * ring)
      .addScaledVector(starToCamera, 2);
  });
  shiftFraming(path.dayPos[k], path.dayLook[k], isPhone ? 14.5 : 12.6, true, isPhone);

  bodies.minis.forEach((m, i) => {
    const roleStop = stops.FIRST_ROLE + i;
    path.dayPos[roleStop].copy(m.pos).addScaledVector(starToCamera, isPhone ? 21 : 18);
    // Aim slightly away from the big star so its bright edge stays out of the text and slider.
    path.dayLook[roleStop]
      .copy(m.pos)
      .addScaledVector(ringRight, Math.cos(m.angle) * 1.6)
      .addScaledVector(ringUp, Math.sin(m.angle) * 1.6);
    shiftFraming(path.dayPos[roleStop], path.dayLook[roleStop], isPhone ? 4.2 : 3.8, Math.cos(m.angle) <= 0.05, isPhone);
  });
}

// A wide shot of the system beside your contact details.
function setContactStop(path, state, isPhone) {
  const { maxOrbit } = state.bodies;
  const k = state.stops.CONTACT;
  path.dayPos[k].set(-0.42, 0.55, 1).normalize().multiplyScalar(maxOrbit * (isPhone ? 5 : 3.1));
  path.dayLook[k].set(0, 0, 0);
  shiftFraming(path.dayPos[k], path.dayLook[k], maxOrbit * (isPhone ? 1 : 0.62), true, isPhone);
}

// After hours: first the moon with its whole system in view, then each interest up close.
function setNightStops(path, state, isPhone) {
  const { world, bodies } = state;
  const moon = world.moonRest;
  toEye.copy(world.eclipsePos).sub(moon).normalize();

  path.nightPos[0].copy(moon).addScaledVector(toEye, MOON_R * (isPhone ? 17.5 : 15));
  path.nightPos[0].y += isPhone ? 4 : 2;
  path.nightLook[0].copy(moon);
  shiftFraming(path.nightPos[0], path.nightLook[0], isPhone ? 3.2 : 5.6, true, isPhone);

  bodies.interests.forEach((p, i) => {
    const k = i + 1;
    vC.copy(p.pos).sub(moon).normalize().addScaledVector(UP, 0.3).addScaledVector(toEye, 0.35).normalize();
    path.nightPos[k].copy(p.pos).addScaledVector(vC, p.radius * (p.ringed ? 2.5 : 1) * (isPhone ? 6.2 : 4.3));
    path.nightLook[k].copy(p.pos);
    shiftFraming(path.nightPos[k], path.nightLook[k], p.radius * (p.ringed ? 2.8 : 1.2) * (isPhone ? 1.15 : 1), i % 2 === 1, isPhone);
  });
}

// Recalculates every camera spot for this frame.
export function updateKeyframes(path, state, fovDegrees) {
  const isPhone = state.W <= PHONE_WIDTH;
  const aspect = state.W / state.H;
  const tanV = Math.tan((fovDegrees * Math.PI) / 360);

  const overviewDistance = setOverviewStop(path, state, tanV, aspect, isPhone);
  setSunStop(path, isPhone);
  setProjectStops(path, state, isPhone);
  placeBrightStar(path, state, overviewDistance, tanV, aspect, isPhone);
  setExperienceStops(path, state, tanV, aspect, isPhone);
  setContactStop(path, state, isPhone);
  setNightStops(path, state, isPhone);
}

// Where the camera should be for the current day-side scroll position, arcing clear of the sun.
function computeDayPose(path, dayF) {
  const i = Math.min(Math.floor(dayF), path.dayPos.length - 2);
  const u = dayF - i;
  dayPos.copy(path.dayPos[i]).lerp(path.dayPos[i + 1], u);
  dayPos.y += Math.sin(u * Math.PI) * path.dayPos[i].distanceTo(path.dayPos[i + 1]) * 0.14;
  dayLook.copy(path.dayLook[i]).lerp(path.dayLook[i + 1], u);
  const closest = SUN_R * 2.1;
  if (dayPos.length() < closest) dayPos.setLength(closest);
}

// Where the camera should be for the current night-side scroll position, arcing clear of the moon.
function computeNightPose(path, nightF, moonRest) {
  const last = path.nightPos.length - 1;
  const i = clamp(Math.floor(nightF), 0, Math.max(0, last - 1));
  const u = last ? clamp(nightF - i, 0, 1) : 0;
  const next = Math.min(last, i + 1);
  nightPos.copy(path.nightPos[i]).lerp(path.nightPos[next], u);
  nightLook.copy(path.nightLook[i]).lerp(path.nightLook[next], u);
  vA.copy(nightPos).sub(moonRest);
  if (vA.length() < MOON_R * 1.7) nightPos.copy(moonRest).addScaledVector(vA.normalize(), MOON_R * 1.7);
}

// Combines scroll, slider, launch and mouse into the final camera for this frame.
export function aimCamera(path, state, dt, velocity, baseFov) {
  const { world, tracks, slide, launch, reduced } = state;
  const { camera } = world;

  computeDayPose(path, tracks.day.f);
  computeNightPose(path, tracks.night.f, world.moonRest);

  // Every slider position passes through the one camera spot where the moon exactly covers the sun.
  const toEclipse = smooth(0, 0.5, slide);
  const toNight = smooth(0.5, 1, slide);
  const position = vC.copy(dayPos).lerp(world.eclipsePos, toEclipse).lerp(nightPos, toNight);
  const look = toEye.copy(dayLook).lerp(world.eclipseLook, toEclipse).lerp(nightLook, toNight);

  // During the launch the camera starts far out, so the sun is a distant star, then falls into the system.
  if (launch) {
    vA.copy(position).sub(look);
    position.copy(look).addScaledVector(vA, 1 + launch.pull() * 5);
  }

  // The camera leans toward the pointer, and the lens widens slightly with scroll speed.
  const parallaxEase = reduced ? 1 : easeFactor(5, dt);
  state.parallaxX += (state.pointerX - state.parallaxX) * parallaxEase;
  state.parallaxY += (state.pointerY - state.parallaxY) * parallaxEase;
  if (!reduced) {
    const span = position.distanceTo(look);
    vA.copy(look).sub(position).normalize();
    vB.crossVectors(vA, UP).normalize();
    shiftUp.crossVectors(vB, vA).normalize();
    position.addScaledVector(vB, state.parallaxX * span * 0.028).addScaledVector(shiftUp, -state.parallaxY * span * 0.02);
    state.fovKick += (Math.min(6, Math.abs(velocity) * 2.6) - state.fovKick) * easeFactor(6, dt);
  }

  camera.position.copy(position);
  camera.lookAt(look);

  const fov = baseFov + state.fovKick;
  const aspect = state.W / state.H;
  if (Math.abs(camera.fov - fov) > 0.01 || camera.aspect !== aspect) {
    camera.fov = fov;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
}
