import { PHONE_WIDTH, createBodies, getDayStops, isTouchDevice, prefersReducedMotion } from './config.js';
import { aimCamera, createCameraPath, updateKeyframes } from './cameraPath.js';
import { pickBody, updateBodyLabels } from './bodyLabels.js';
import { createLaunch } from './launch/createLaunch.js';
import { clamp, smooth } from './math.js';
import { createWorld } from './scene/createWorld.js';
import {
  computeLighting,
  updateBackdrop,
  updateBrightStar,
  updateInterests,
  updateMiniStars,
  updateMoon,
  updatePlanets,
  updateSun,
} from './scene/updateWorld.js';
import { createTracks, fadeStops, followScroll, measureTrack } from './scrollTracks.js';

/*
  The engine runs the 3D scene and everything that changes every frame.
  React (see hooks/useSolarEngine.js) owns the page, and they talk through:
    - elements: the DOM nodes the engine moves directly, for speed
    - events:   the engine tells React when something changed (nav highlight, launch finished...)
    - the functions returned at the bottom: React calls these on clicks
*/
export function createEngine({ site, elements, events }) {
  const state = {
    W: 1,
    H: 1,
    pixelRatio: 1,
    maxPixelRatio: 2,
    timesLowered: 0,
    reduced: prefersReducedMotion(),
    clock: 0,
    flow: 1,
    fovKick: 0,
    pointerX: 0,
    pointerY: 0,
    parallaxX: 0,
    parallaxY: 0,
    slide: 0, // the slider position: 0 sun, 0.5 eclipse, 1 moon
    slideTarget: 0,
    isDragging: false,
    mode: 'sun',
    activeTrack: 'day',
    pendingStop: null,
    navTarget: null,
    isLaunching: false,
    bodies: createBodies(site),
    stops: getDayStops(site),
    tracks: createTracks(elements.day, elements.night),
    world: null,
    launch: null,
    path: null,
  };

  const { bodies, stops, tracks } = state;
  const everyBody = [bodies.sun, bodies.star, ...bodies.planets, ...bodies.minis, ...bodies.interests];
  const bodyByKey = Object.fromEntries(everyBody.map((body) => [body.key, body]));
  const performance_ = { frames: 0, total: 0, slowRuns: 0, fastRuns: 0 };
  let lastNavigation = '';
  let lastRail = -2;
  let lastTime = performance.now();
  let frameId = 0;

  /* ---------- sizing ---------- */

  function setPixelRatio(value) {
    state.pixelRatio = value;
    state.world.renderer.setPixelRatio(value);
    state.world.renderer.setSize(state.W, state.H, false);
  }

  function handleResize() {
    state.W = Math.max(1, elements.canvas.clientWidth || innerWidth);
    state.H = Math.max(1, elements.canvas.clientHeight || innerHeight);
    if (state.world) {
      state.maxPixelRatio = Math.min(2.5, devicePixelRatio || 1);
      setPixelRatio(state.timesLowered ? Math.min(state.pixelRatio, state.maxPixelRatio) : state.maxPixelRatio);
    }
    measureTrack(tracks[state.activeTrack]);
  }

  // Stays at full sharpness unless the device really cannot keep up. Pauses and hidden tabs do not count.
  function adjustResolution(dt, isBaking) {
    const p = performance_;
    if (!isBaking && dt < 0.1) {
      p.frames++;
      p.total += dt;
    }
    if (p.frames < 60) return;
    const average = p.total / p.frames;
    p.frames = 0;
    p.total = 0;
    p.slowRuns = average > 0.026 ? p.slowRuns + 1 : 0;
    p.fastRuns = average < 0.0175 ? p.fastRuns + 1 : 0;
    if (p.slowRuns >= 3 && state.pixelRatio > 1) {
      setPixelRatio(Math.max(1, state.pixelRatio - 0.25));
      p.slowRuns = 0;
      state.timesLowered++;
    } else if (p.fastRuns >= 8 && state.pixelRatio < state.maxPixelRatio && state.timesLowered < 2) {
      setPixelRatio(Math.min(state.maxPixelRatio, state.pixelRatio + 0.25));
      p.fastRuns = 0;
    }
  }

  /* ---------- moving around ---------- */

  function flyToStop(index) {
    const anchors = tracks[state.activeTrack].anchors;
    window.scrollTo({ top: anchors[clamp(index, 0, anchors.length - 1)], behavior: state.reduced ? 'auto' : 'smooth' });
  }

  // Swaps between the day and night pages, remembering where you were on each.
  function showTrack(name) {
    tracks[state.activeTrack].saved = scrollY;
    state.activeTrack = name;
    tracks.day.el.hidden = name !== 'day';
    tracks.night.el.hidden = name !== 'night';
    measureTrack(tracks[name]);
    const y = tracks[name].saved;
    window.scrollTo({ top: y, behavior: 'instant' });
    tracks[name].y = y;
    events.onTrackChange(name);
  }

  // Swaps pages once the text has faded out, then finishes any flight that was waiting.
  function settleTrack() {
    const wanted = state.mode === 'moon' ? 'night' : 'day';
    const canSwap = (state.mode === 'moon' && state.slide > 0.42) || (state.mode === 'sun' && state.slide < 0.58);
    if (state.activeTrack !== wanted && canSwap) showTrack(wanted);
    if (state.activeTrack === wanted && state.pendingStop !== null) {
      const stop = state.pendingStop;
      state.pendingStop = null;
      flyToStop(stop);
    }
  }

  // Heads to the sun or the moon, optionally flying to a stop on arrival.
  function goTo(mode, stop = null) {
    state.mode = mode;
    state.slideTarget = mode === 'moon' ? 1 : 0;
    state.pendingStop = stop;
    events.onModeChange(mode);
    if (!state.world) state.slide = state.slideTarget;
    settleTrack();
  }

  // Handles a click in the header. `name` is home, about, projects, experience or contact.
  function navigate(name) {
    const targets = {
      projects: stops.FIRST_PROJECT,
      experience: stops.EXPERIENCE,
      contact: stops.CONTACT,
    };
    if (name === 'about') {
      state.navTarget = null;
      goTo('moon', 0);
    } else if (name === 'home') {
      state.navTarget = null;
      goTo('sun', 0);
    } else {
      state.navTarget = { name, stop: targets[name] };
      goTo('sun', targets[name]);
    }
  }

  // Which stop a body belongs to.
  function stopOfBody(body) {
    if (body.kind === 'sun') return stops.SUN;
    if (body.kind === 'star') return stops.EXPERIENCE;
    if (body.kind === 'mini') return stops.FIRST_ROLE + body.index;
    if (body.kind === 'interest') return 1 + body.index;
    return stops.FIRST_PROJECT + body.index;
  }

  // Flies to a body. A second click on the planet you are already at opens its project link.
  function selectBody(body) {
    const stop = stopOfBody(body);
    const track = tracks[state.activeTrack];
    if (Math.abs(track.f - stop) >= 0.2) {
      flyToStop(stop);
      return;
    }
    if (body.kind !== 'planet' && body.kind !== 'interest') return;
    body.pulse = 1;
    const link = track.stops[stop]?.section.querySelector('a');
    if (link) link.click();
  }

  function setHover(target) {
    everyBody.forEach((body) => {
      body.hover = body === target ? 1 : 0;
    });
    elements.canvas.classList.toggle('cursor-pointer', !!target);
  }

  /* ---------- pointer ---------- */

  function showTooltip(body, x, y) {
    const { tip } = elements;
    if (!body || !body.btn.hidden) {
      tip.hidden = true;
      return;
    }
    tip.hidden = false;
    tip.textContent = body.name;
    const flip = x > state.W - 180;
    tip.style.transform = `translate(${Math.round(flip ? x - 14 - tip.offsetWidth : x + 16)}px,${Math.round(y + 14)}px)`;
  }

  function handlePointerMove(event) {
    state.pointerX = (event.clientX / innerWidth) * 2 - 1;
    state.pointerY = (event.clientY / innerHeight) * 2 - 1;
    if (event.target !== elements.canvas) {
      if (!event.target.closest?.('[data-body]')) setHover(null);
      elements.tip.hidden = true;
      return;
    }
    const body = pickBody(state, event.clientX, event.clientY);
    setHover(body && body.kind !== 'sun' ? body : null);
    elements.canvas.classList.toggle('cursor-pointer', !!body);
    showTooltip(body, event.clientX, event.clientY);
  }

  function handleCanvasClick(event) {
    const body = pickBody(state, event.clientX, event.clientY);
    if (body) selectBody(body);
  }

  function handleManualScroll() {
    state.navTarget = null;
  }

  /* ---------- slider ---------- */

  function startDrag() {
    state.isDragging = true;
  }

  function dragTo(value) {
    if (state.isDragging) state.slideTarget = value / 100;
  }

  function releaseDrag() {
    if (!state.isDragging) return;
    state.isDragging = false;
    goTo(Number(elements.slider.value) >= 50 ? 'moon' : 'sun');
  }

  function updateSlide(dt) {
    const rate = state.isDragging ? 16 : 2.6;
    state.slide = state.reduced ? state.slideTarget : state.slide + (state.slideTarget - state.slide) * (1 - Math.exp(-dt * rate));
    if (Math.abs(state.slideTarget - state.slide) < 0.0006) state.slide = state.slideTarget;
    if (!state.isDragging) elements.slider.value = state.slide * 100;
    elements.slider.style.setProperty('--t', state.slide.toFixed(3));
  }

  /* ---------- telling React what changed ---------- */

  // Works out which header link and which dot should be highlighted, and only reports changes.
  function reportHighlights() {
    const dayF = tracks.day.f;
    const nearest = Math.round(dayF);
    const { navTarget } = state;
    if (navTarget && (state.mode !== 'sun' || (state.activeTrack === 'day' && Math.abs(dayF - navTarget.stop) < 0.1))) {
      state.navTarget = null;
    }

    let current = '';
    if (state.mode === 'moon') current = 'about';
    else if (state.navTarget) current = state.navTarget.name;
    else if (nearest >= stops.FIRST_PROJECT && nearest < stops.EXPERIENCE) current = 'projects';
    else if (nearest >= stops.EXPERIENCE && nearest < stops.CONTACT) current = 'experience';
    else if (nearest === stops.CONTACT) current = 'contact';
    if (current !== lastNavigation) {
      lastNavigation = current;
      events.onNavChange(current);
    }

    const rail = state.activeTrack === 'day' ? nearest : -1;
    if (rail !== lastRail) {
      lastRail = rail;
      events.onRailChange(rail);
    }
  }

  /* ---------- launch ---------- */

  function startLaunch() {
    state.isLaunching = true;
    events.onLaunchingChange(true);
    state.launch = createLaunch(state, site.rocketName, {
      onReveal() {
        state.isLaunching = false;
        document.documentElement.classList.remove('launching');
        events.onLaunchingChange(false);
        window.scrollTo(0, 0);
        measureTrack(tracks[state.activeTrack]);
      },
      onFinish() {
        state.launch = null;
      },
    });
  }

  /* ---------- the frame loop ---------- */

  function renderWorld(dt, velocity) {
    const { world } = state;
    const lighting = computeLighting(state.slide);
    const dayF = tracks.day.f;
    const closeUp = smooth(0, 0.6, Math.min(dayF, stops.CONTACT - dayF));

    updatePlanets(state, dt, lighting, closeUp);
    updateInterests(state, dt, lighting);

    const baseFov = state.W <= PHONE_WIDTH ? 46 : 38;
    updateKeyframes(state.path, state, baseFov);
    aimCamera(state.path, state, dt, velocity, baseFov);

    updateSun(state, lighting);
    updateMoon(state, lighting);
    updateBrightStar(state, lighting);
    updateMiniStars(state, dt, lighting);
    updateBackdrop(state, lighting);
    updateBodyLabels(state, lighting.planetsShown);

    world.renderer.render(world.scene, world.camera);
    if (state.launch) state.launch.draw(dt);
    adjustResolution(dt, world.paintNextStrip());
  }

  function frame(now) {
    const dt = Math.min(0.25, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    if (!state.reduced) state.clock += dt;

    updateSlide(dt);
    settleTrack();

    const track = tracks[state.activeTrack];
    const velocity = followScroll(track, dt, state.reduced, state.H);
    const trackFade = state.activeTrack === 'day' ? 1 - smooth(0.02, 0.36, state.slide) : smooth(0.62, 1, state.slide);
    fadeStops(track, trackFade, state.reduced);
    reportHighlights();

    if (state.world) renderWorld(dt, velocity);
    frameId = requestAnimationFrame(frame);
  }

  /* ---------- start up ---------- */

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  everyBody.forEach((body) => {
    body.btn = elements.labels.querySelector(`[data-body="${body.key}"]`);
  });

  try {
    state.world = createWorld(elements.canvas, bodies);
    state.path = createCameraPath(state);
  } catch (error) {
    // No WebGL on this device: the same content still shows as a plain page.
    state.world = null;
    document.documentElement.classList.remove('launching');
    document.documentElement.classList.add('no-gl');
    events.onLaunchingChange(false);
  }

  addEventListener('resize', handleResize);
  addEventListener('pointerup', releaseDrag);
  addEventListener('pointercancel', releaseDrag);
  addEventListener('wheel', handleManualScroll, { passive: true });
  addEventListener('touchmove', handleManualScroll, { passive: true });
  if (!isTouchDevice()) addEventListener('pointermove', handlePointerMove, { passive: true });
  elements.canvas.addEventListener('click', handleCanvasClick);
  document.fonts?.ready.then(() => measureTrack(tracks[state.activeTrack]));

  handleResize();
  tracks.day.y = scrollY;
  goTo('sun');

  if (state.world && !state.reduced) {
    try {
      startLaunch();
    } catch (error) {
      state.launch = null;
      state.isLaunching = false;
      document.documentElement.classList.remove('launching');
      events.onLaunchingChange(false);
    }
  }
  frameId = requestAnimationFrame(frame);

  /* ---------- what React can call ---------- */

  const api = {
    navigate,
    flyToStop,
    goTo,
    startDrag,
    dragTo,
    selectBody: (key) => selectBody(bodyByKey[key]),
    hoverBody: (key) => setHover(key ? bodyByKey[key] : null),
    skipLaunch: () => state.launch?.skip(),
    destroy() {
      cancelAnimationFrame(frameId);
      removeEventListener('resize', handleResize);
      removeEventListener('pointerup', releaseDrag);
      removeEventListener('pointercancel', releaseDrag);
      removeEventListener('wheel', handleManualScroll);
      removeEventListener('touchmove', handleManualScroll);
      removeEventListener('pointermove', handlePointerMove);
      elements.canvas.removeEventListener('click', handleCanvasClick);
      state.world?.renderer.dispose();
    },
  };

  // Add ?debug to the URL to inspect the engine from the browser console as window.solar.
  if (new URLSearchParams(location.search).has('debug')) window.solar = { state, api, pickBody };

  return api;
}
