import Stop, { BulletPoints, FactList, StopTitle } from './Stop.jsx';

// One project, shown beside its planet.
export default function ProjectStop({ project, index, total }) {
  const orbitLabel = `Orbit ${index + 1} of ${total}${index === 0 ? ', newest' : ''}`;
  const links = (project.links ?? []).filter((link) => /^https?:\/\//i.test(link.url));

  return (
    <Stop isLong side={index % 2 ? 'right' : 'left'} accent={project.color} eyebrow={orbitLabel}>
      <StopTitle isCompact>{project.name}</StopTitle>
      <FactList rows={[['Year', project.year], ['Built with', project.stack]]} />
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
