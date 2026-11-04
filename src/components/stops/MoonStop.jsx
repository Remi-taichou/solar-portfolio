import Stop, { StopTitle } from './Stop.jsx';

// Me, after hours: the moon with the interest planets circling it.
export default function MoonStop({ moon }) {
  return (
    <Stop accent="var(--color-luna)" eyebrow="The Moon">
      <StopTitle>{moon.title}</StopTitle>
      <p className="mb-3.5 max-w-136">{moon.intro}</p>
    </Stop>
  );
}
