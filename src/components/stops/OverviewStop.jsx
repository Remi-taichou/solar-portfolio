import { isTouchDevice } from '../../engine/config.js';

// The first view: just the solar system and a hint to start scrolling.
export default function OverviewStop() {
  return (
    <section data-stop className="relative h-[150lvh]">
      <div data-stop-inner className="overview-inner sticky top-0 flex h-svh items-end justify-center pb-[58px]">
        <p className="label pointer-events-auto text-center text-dim">
          {isTouchDevice() ? 'Swipe' : 'Scroll'} to fly through
          <i className="scroll-cue-line" />
        </p>
      </div>
    </section>
  );
}
