// Numbers that shape the whole scene, plus the helpers that turn data/site.js into 3D bodies.

export const SUN_R = 7;
export const MOON_R = 2.1;
export const STAR_R = 8;
export const MINI_R = 1;

// The solar system leans this far, right side up. Use a negative value to lean the other way.
export const SYSTEM_TILT = (22.5 * Math.PI) / 180;

// The camera spot where the moon exactly covers the sun, halfway along the slider.
export const ECLIPSE_CAM = [0, 10, 150];

// At this width and below, text sits under the 3D view instead of beside it.
export const PHONE_WIDTH = 700;

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouchDevice = () => matchMedia('(pointer: coarse)').matches;
export const isSmallScreen = () => Math.min(screen.width, screen.height) < 700;

// Mini stars sit in a ring around the big star, starting at the top and going clockwise.
export function miniStarAngle(index, count) {
  return Math.PI / 2 - (index / count) * Math.PI * 2;
}

// True when a mini star is on the star's right side, so its text belongs on the right of the screen.
export function miniStarTextOnRight(index, count) {
  return Math.cos(miniStarAngle(index, count)) > 0.05;
}

// Scroll stops on the day side, in order: overview, sun, projects, big star, roles, contact.
export function getDayStops(site) {
  const FIRST_PROJECT = 2;
  const EXPERIENCE = FIRST_PROJECT + site.projects.length;
  const FIRST_ROLE = EXPERIENCE + 1;
  const CONTACT = FIRST_ROLE + site.experience.roles.length;
  return { OVERVIEW: 0, SUN: 1, FIRST_PROJECT, EXPERIENCE, FIRST_ROLE, CONTACT };
}

// Turns the content in site.js into objects the 3D scene can animate.
export function createBodies(site) {
  const planets = site.projects.map((project, i) => ({
    ...project,
    key: `planet-${i}`,
    kind: 'planet',
    index: i,
    angle: 0.7 + i * 2.4,
    orbit: 18 + i * 14,
    inc: (i % 2 ? 1 : -1) * (0.012 + i * 0.006),
    radius: project.size * 60,
    hover: 0,
    hoverK: 0,
    hoverScale: 1,
    pulse: 0,
    btn: null,
  }));

  const star = { key: 'star', kind: 'star', name: 'Experience', hover: 0, pos: null, btn: null };

  const roles = site.experience.roles;
  const minis = roles.map((role, i) => ({
    ...role,
    key: `mini-${i}`,
    kind: 'mini',
    index: i,
    name: role.short,
    angle: miniStarAngle(i, roles.length),
    hover: 0,
    hoverK: 0,
    reveal: 0,
    pos: null,
    btn: null,
  }));

  const interests = site.moon.interests.map((interest, i) => ({
    ...interest,
    key: `interest-${i}`,
    kind: 'interest',
    index: i,
    angle: 0.9 + i * 1.75,
    orbit: 4.3 + i * 1.2,
    radius: interest.size * 13,
    hover: 0,
    hoverK: 0,
    hoverScale: 1,
    pulse: 0,
    btn: null,
  }));

  const sun = { key: 'sun', kind: 'sun', name: 'By day', hover: 0, pos: null, btn: null };
  const maxOrbit = planets.length ? planets[planets.length - 1].orbit : 30;

  return { sun, planets, star, minis, interests, maxOrbit };
}
