import { useEffect, useMemo, useRef, useState } from 'react';
import { createEngine } from '../engine/createEngine.js';
import { prefersReducedMotion } from '../engine/config.js';

// Connects React to the 3D engine.
//   refs:   attach these to elements the engine needs to move directly
//   ui:     values the engine reports, which re-render the page when they change
//   engine: functions to call from buttons and other controls
export function useSolarEngine(site) {
  const canvas = useRef(null);
  const day = useRef(null);
  const night = useRef(null);
  const slider = useRef(null);
  const tip = useRef(null);
  const labels = useRef(null);
  const engineRef = useRef(null);

  const [isLaunching, setIsLaunching] = useState(() => !prefersReducedMotion());
  const [mode, setMode] = useState('sun');
  const [activeTrack, setActiveTrack] = useState('day');
  const [navCurrent, setNavCurrent] = useState('');
  const [railCurrent, setRailCurrent] = useState(0);

  // Starts the engine once the page exists, and stops it if the page goes away.
  useEffect(() => {
    const instance = createEngine({
      site,
      elements: {
        canvas: canvas.current,
        day: day.current,
        night: night.current,
        slider: slider.current,
        tip: tip.current,
        labels: labels.current,
      },
      events: {
        onLaunchingChange: setIsLaunching,
        onModeChange: setMode,
        onTrackChange: setActiveTrack,
        onNavChange: setNavCurrent,
        onRailChange: setRailCurrent,
      },
    });
    engineRef.current = instance;
    return () => instance.destroy();
  }, [site]);

  const engine = useMemo(() => ({
    navigate: (name) => engineRef.current?.navigate(name),
    flyToStop: (index) => engineRef.current?.flyToStop(index),
    goTo: (mode) => engineRef.current?.goTo(mode),
    startDrag: () => engineRef.current?.startDrag(),
    dragTo: (value) => engineRef.current?.dragTo(value),
    selectBody: (key) => engineRef.current?.selectBody(key),
    hoverBody: (key) => engineRef.current?.hoverBody(key),
    skipLaunch: () => engineRef.current?.skipLaunch(),
  }), []);

  return {
    refs: { canvas, day, night, slider, tip, labels },
    ui: { isLaunching, mode, activeTrack, navCurrent, railCurrent },
    engine,
  };
}
