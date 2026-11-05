// Clickable labels that sit on top of the 3D bodies. The engine moves and shows them each frame,
// so `hidden` here only sets how they start. Each `data-body` value matches a key in engine/config.js.
export default function BodyLabels({ site, containerRef, inert, onSelect, onHover }) {
  const labels = [
    { key: 'sun', text: 'By day', aria: 'The sun: me by day' },
    { key: 'star', text: 'Experience', aria: 'The bright star: my experience', variant: 'bright' },
    ...site.projects.map((project, i) => ({ key: `planet-${i}`, text: project.short ?? project.name, aria: `Fly to ${project.name}` })),
    ...site.experience.roles.map((role, i) => ({ key: `mini-${i}`, text: role.short, aria: `Open ${role.role}`, variant: 'mini' })),
    ...site.moon.interests.map((interest, i) => ({ key: `interest-${i}`, text: interest.name, aria: `Fly to ${interest.name}` })),
  ];

  return (
    <div ref={containerRef} inert={inert} className="ui-layer">
      {labels.map((label) => (
        <BodyLabel key={label.key} bodyKey={label.key} text={label.text} aria={label.aria} variant={label.variant} onSelect={onSelect} onHover={onHover} />
      ))}
    </div>
  );
}

// One label: an invisible round button over the body, with its name underneath.
function BodyLabel({ bodyKey, text, aria, variant, onSelect, onHover }) {
  const isSun = bodyKey === 'sun';
  const hoverHandlers = isSun ? {} : {
    onPointerEnter: () => onHover(bodyKey),
    onPointerLeave: () => onHover(null),
    onFocus: (event) => {
      if (event.target.matches(':focus-visible')) onHover(bodyKey);
    },
    onBlur: () => onHover(null),
  };

  return (
    <button
      type="button"
      hidden
      data-body={bodyKey}
      aria-label={aria}
      className={`body-label group fixed left-0 top-0 z-6 rounded-full will-change-transform ${variant ?? ''}`}
      onClick={() => onSelect(bodyKey)}
      {...hoverHandlers}
    >
      <span className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap font-display text-xs leading-tight opacity-85 transition-opacity duration-200 text-shadow-space group-hover:opacity-100 group-focus-visible:opacity-100 max-desk:text-[.5625rem] max-desk:w-28 max-desk:whitespace-normal max-desk:text-center">
        {text}
      </span>
    </button>
  );
}
