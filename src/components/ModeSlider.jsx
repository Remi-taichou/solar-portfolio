// The slider at the bottom that moves between the sun (by day) and the moon (after hours).
export default function ModeSlider({ mode, inert, sliderRef, onDragStart, onDrag, onChooseMode }) {
  // Arrow keys jump straight to one end rather than creeping along.
  function handleKeyDown(event) {
    const goesToMoon = ['ArrowRight', 'ArrowUp', 'End', 'PageUp'].includes(event.key);
    const goesToSun = ['ArrowLeft', 'ArrowDown', 'Home', 'PageDown'].includes(event.key);
    if (goesToMoon || goesToSun) {
      event.preventDefault();
      onChooseMode(goesToMoon ? 'moon' : 'sun');
    }
  }

  return (
    <footer inert={inert} className="ui-layer page-footer pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3.5 text-sm text-dim">
        <SideLabel isOn={mode === 'sun'}>By day</SideLabel>
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          step="1"
          defaultValue="0"
          aria-label="Slide between the sun, me at work, and the moon, me off the clock"
          aria-valuetext={mode === 'moon' ? 'Moon: me after hours' : 'Sun: me by day'}
          className="mode-slider"
          onPointerDown={onDragStart}
          onInput={(event) => onDrag(Number(event.target.value))}
          onKeyDown={handleKeyDown}
        />
        <SideLabel isOn={mode === 'moon'}>After hours</SideLabel>
      </div>
    </footer>
  );
}

function SideLabel({ isOn, children }) {
  return <b className={`font-normal whitespace-nowrap transition-colors duration-300 ${isOn ? 'text-ink' : ''}`}>{children}</b>;
}
