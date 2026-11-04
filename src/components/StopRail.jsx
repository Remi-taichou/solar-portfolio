// The column of dots on the right edge, one per stop. Hidden on phones.
export default function StopRail({ site, current, inert, onSelect }) {
  return (
    <nav inert={inert} aria-label="Stops in the solar system" className="ui-layer rail fixed top-1/2 z-9 flex -translate-y-1/2 flex-col items-center max-desk:hidden">
      {buildRailStops(site).map((stop, index) => (
        <RailDot key={stop.name + index} {...stop} isCurrent={index === current} onClick={() => onSelect(index)} />
      ))}
    </nav>
  );
}

// Lists every stop in scroll order, with the colour of its dot.
function buildRailStops(site) {
  return [
    { name: 'Overview', color: '#f3f1ea' },
    { name: 'The Sun', color: '#ffc067' },
    ...site.projects.map((project) => ({ name: project.name, color: project.color })),
    { name: 'Experience', color: '#bfe2ff' },
    ...site.experience.roles.map((role) => ({ name: role.role, color: role.color })),
    { name: 'Contact', color: '#f3f1ea' },
  ];
}

function RailDot({ name, color, isCurrent, onClick }) {
  return (
    <button type="button" title={name} aria-label={name} aria-current={isCurrent} onClick={onClick} className="rail-dot grid size-6 place-items-center">
      <i style={{ background: color }} />
    </button>
  );
}
