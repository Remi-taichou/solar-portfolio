import Stop, { FactList, StopTitle } from './Stop.jsx';

// Me, by day: school and work.
export default function SunStop({ sun }) {
  return (
    <Stop eyebrow="The Sun">
      <StopTitle>{sun.title}</StopTitle>
      {sun.intro && <p className="mb-3.5 max-w-136">{sun.intro}</p>}
      <FactList rows={sun.facts} />
    </Stop>
  );
}
