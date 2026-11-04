import { SITE } from './data/site.js';
import { useSolarEngine } from './hooks/useSolarEngine.js';
import BodyLabels from './components/BodyLabels.jsx';
import Header from './components/Header.jsx';
import ModeSlider from './components/ModeSlider.jsx';
import SkipLaunchButton from './components/SkipLaunchButton.jsx';
import StopRail from './components/StopRail.jsx';
import DayTrack from './components/DayTrack.jsx';
import NightTrack from './components/NightTrack.jsx';

// The whole page: a fixed 3D canvas behind a tall scrolling page, with the controls floating on top.
export default function App() {
  const { refs, ui, engine } = useSolarEngine(SITE);

  return (
    <>
      <canvas ref={refs.canvas} aria-hidden="true" className="sky-canvas fixed left-0 top-0 z-0 block h-[100lvh] w-full" />
      {ui.isLaunching && <SkipLaunchButton onSkip={engine.skipLaunch} />}

      <Header name={SITE.name} current={ui.navCurrent} inert={ui.isLaunching} onNavigate={engine.navigate} />
      <BodyLabels site={SITE} containerRef={refs.labels} inert={ui.isLaunching} onSelect={engine.selectBody} onHover={engine.hoverBody} />
      <div ref={refs.tip} hidden className="pointer-events-none fixed left-0 top-0 z-12 whitespace-nowrap font-display text-[.8125rem] leading-tight text-shadow-space" />
      {ui.activeTrack === 'day' && <StopRail site={SITE} current={ui.railCurrent} inert={ui.isLaunching} onSelect={engine.flyToStop} />}

      <main className="ui-layer pointer-events-none relative z-5" inert={ui.isLaunching}>
        <DayTrack site={SITE} trackRef={refs.day} onSelectStop={engine.flyToStop} />
        <NightTrack site={SITE} trackRef={refs.night} />
      </main>

      <ModeSlider
        mode={ui.mode}
        inert={ui.isLaunching}
        sliderRef={refs.slider}
        onDragStart={engine.startDrag}
        onDrag={engine.dragTo}
        onChooseMode={engine.goTo}
      />
    </>
  );
}
