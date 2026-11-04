// Small maths helpers used throughout the 3D scene.

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Eases from 0 to 1 as `value` moves from `from` to `to`.
export function smooth(from, to, value) {
  const x = clamp((value - from) / (to - from), 0, 1);
  return x * x * (3 - 2 * x);
}

// How far to move toward a target this frame, so motion feels the same at any frame rate.
export const easeFactor = (rate, dt) => 1 - Math.exp(-dt * rate);

// How many screen pixels one 3D unit covers at a given distance from the camera.
export function pixelsPerUnit(camera, screenHeight, distance) {
  return screenHeight / 2 / (Math.tan((camera.fov * Math.PI) / 360) * Math.max(0.01, distance));
}
