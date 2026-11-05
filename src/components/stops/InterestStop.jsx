import Stop, { StopTitle } from './Stop.jsx';

// One planet around the moon. It shows a sentence (summary) or a labelled list (groups), such as Skills.
export default function InterestStop({ interest, index, total }) {
  const hasGroups = Boolean(interest.groups?.length);
  return (
    <Stop isLong={hasGroups} isDense={hasGroups} side={index % 2 ? 'left' : 'right'} accent={interest.color} eyebrow={`Planet ${index + 1} of ${total}`}>
      <StopTitle isCompact={hasGroups}>{interest.name}</StopTitle>
      {interest.summary && <p className="mb-3.5 max-w-136">{interest.summary}</p>}
      {hasGroups && <SkillGroups groups={interest.groups} />}
    </Stop>
  );
}

// Groups in two columns, each with a small label above its list, so a long list still fits on screen.
function SkillGroups({ groups }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-line pt-3.5 max-[1000px]:grid-cols-1 max-[1000px]:gap-y-2.5">
      {groups.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="label mb-0.5 text-[.6875rem] text-(--accent)">{label}</dt>
          <dd className="text-sm leading-snug">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
