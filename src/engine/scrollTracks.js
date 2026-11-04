import { easeFactor, smooth } from './math.js';

// A "track" is one tall scrolling page: day (sun side) or night (moon side).
// `y` is the eased scroll position and `f` is how far along the stops you are:
// f = 2 means exactly at stop 2, f = 2.5 means halfway between stops 2 and 3.
export function createTracks(dayElement, nightElement) {
  return {
    day: { el: dayElement, stops: [], anchors: [], y: 0, f: 0, saved: 0 },
    night: { el: nightElement, stops: [], anchors: [], y: 0, f: 0, saved: 0 },
  };
}

// Finds each stop on the page and records the scroll position where it is centred.
export function measureTrack(track) {
  const viewportHeight = innerHeight;
  track.stops = [...track.el.querySelectorAll('[data-stop]')].map((section) => ({
    section,
    inner: section.querySelector('[data-stop-inner]'),
  }));
  track.anchors = track.stops.map(({ section }) => {
    const top = section.getBoundingClientRect().top + scrollY;
    return top + Math.max(0, section.offsetHeight - viewportHeight) / 2;
  });
  if (track.anchors.length) {
    track.anchors[0] = 0;
    track.anchors[track.anchors.length - 1] = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
  }
}

// Converts a scroll position into a stop position, lingering a little at each stop.
function stopPositionAt(track, y) {
  const a = track.anchors;
  if (!a.length || y <= a[0]) return 0;
  for (let i = 0; i < a.length - 1; i++) {
    if (y < a[i + 1]) {
      const u = (y - a[i]) / Math.max(1, a[i + 1] - a[i]);
      return i + u * u * (3 - 2 * u);
    }
  }
  return a.length - 1;
}

// Eases the track toward the real scroll position. Returns scroll speed in screens per second.
export function followScroll(track, dt, reduced, screenHeight) {
  const previous = track.y;
  track.y += (scrollY - track.y) * (reduced ? 1 : easeFactor(8, dt));
  if (Math.abs(scrollY - track.y) < 0.05) track.y = scrollY;
  track.f = stopPositionAt(track, track.y);
  return (track.y - previous) / dt / screenHeight;
}

// Fades each stop's text in and out as the camera arrives and leaves.
export function fadeStops(track, trackFade, reduced) {
  track.stops.forEach(({ inner }, i) => {
    const distance = track.f - i;
    const opacity = (1 - smooth(0.14, 0.4, Math.abs(distance))) * trackFade;
    const value = opacity.toFixed(3);
    if (inner.style.opacity !== value) inner.style.opacity = value;
    const lift = reduced ? 0 : Math.round(-distance * 70);
    inner.style.transform = lift ? `translateY(${lift}px)` : 'none';
    inner.style.visibility = opacity < 0.004 ? 'hidden' : '';
  });
}
