import Stop, { BulletPoints, FactList, StopTitle } from './Stop.jsx';

// One project, shown beside its planet.
export default function ProjectStop({ project, index, total }) {
  const orbitLabel = `Orbit ${index + 1} of ${total}${index === 0 ? ', newest' : ''}`;
  const links = (project.links ?? []).filter((link) => /^https?:\/\//i.test(link.url));

  return (
    <Stop isLong side={index % 2 ? 'right' : 'left'} accent={project.color} eyebrow={orbitLabel}>
      {project.badge && <Badge>{project.badge}</Badge>}
      <StopTitle isCompact>{project.name}</StopTitle>
      {project.context && <p className="mb-3 max-w-136 text-dim">{project.context}</p>}
      <FactList rows={[
        ['Date', project.date],
        ...(project.event ? [['Event', project.event]] : []),
        ['Built with', project.stack],
      ]} />
      <BulletPoints points={project.points} hasDivider={false} />
      {links.length > 0 && (
        <p className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener" className="mt-1.5 inline-block border-b border-(--accent) pb-[3px] no-underline transition-colors duration-250 [text-shadow:none] hover:text-(--accent)">
              {link.label}
            </a>
          ))}
        </p>
      )}
    </Stop>
  );
}

// A small outlined tag above the title, such as "Hackathon".
function Badge({ children }) {
  return (
    <span className="label mb-3 inline-block rounded-full border border-(--accent) px-2.5 py-1 text-[.6875rem] text-(--accent)">
      {children}
    </span>
  );
}
