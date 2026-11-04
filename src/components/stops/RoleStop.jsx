import { miniStarTextOnRight } from '../../engine/config.js';
import Stop, { BulletPoints, StopTitle } from './Stop.jsx';

// One job from the resume, shown beside its mini star.
export default function RoleStop({ role, index, total }) {
  return (
    <Stop isLong isRole side={miniStarTextOnRight(index, total) ? 'right' : 'left'} accent={role.color} eyebrow={`Star ${index + 1} of ${total}`}>
      <StopTitle isCompact>{role.role}</StopTitle>
      <p className="label mb-3.5 text-dim">{role.place} / {role.dates}</p>
      <BulletPoints points={role.points} />
    </Stop>
  );
}
