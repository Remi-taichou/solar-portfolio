import Stop, { StopTitle } from './Stop.jsx';

// One interest, shown beside its planet.
export default function InterestStop({ interest, index, total }) {
  return (
    <Stop side={index % 2 ? 'left' : 'right'} accent={interest.color} eyebrow={`Interest ${index + 1} of ${total}`}>
      <StopTitle>{interest.name}</StopTitle>
      <p className="mb-3.5 max-w-136">{interest.summary}</p>
    </Stop>
  );
}
