import InterestStop from './stops/InterestStop.jsx';
import MoonStop from './stops/MoonStop.jsx';

// The moon side of the page. `hidden` only sets how it starts; the engine swaps the tracks.
export default function NightTrack({ site, trackRef }) {
  const { interests } = site.moon;
  return (
    <div ref={trackRef} hidden>
      <MoonStop moon={site.moon} />
      {interests.map((interest, i) => (
        <InterestStop key={interest.name} interest={interest} index={i} total={interests.length} />
      ))}
    </div>
  );
}
