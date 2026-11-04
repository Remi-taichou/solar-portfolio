const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

// Your name at the top left and the navigation at the top right, on one line.
// Only very small phones split them into two rows, because they cannot fit side by side there.
export default function Header({ name, current, inert, onNavigate }) {
  return (
    <header inert={inert} className="ui-layer page-header pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 text-shadow-dark max-desk:gap-2.5 max-[520px]:flex-wrap max-[520px]:gap-y-1">
      <h1 className="pointer-events-auto m-0 min-w-0 font-display text-[clamp(1.0625rem,calc(.85rem+1vw),1.75rem)] leading-[1.05] font-normal text-balance max-desk:text-[.9375rem] max-[520px]:w-full max-[520px]:text-[1.0625rem]">
        <button type="button" className="text-left" onClick={() => onNavigate('home')}>{name}</button>
      </h1>

      <nav aria-label="Main" className="pointer-events-auto flex flex-none items-center justify-end gap-[clamp(12px,2vw,28px)] max-desk:gap-2 max-[520px]:w-full max-[520px]:gap-3">
        {LINKS.map((link) => (
          <NavLink key={link.id} label={link.label} isCurrent={current === link.id} onClick={() => onNavigate(link.id)} />
        ))}
      </nav>
    </header>
  );
}

// One header link. The selected link turns bright white with a glow and an underline.
function NavLink({ label, isCurrent, onClick }) {
  return (
    <button type="button" aria-current={isCurrent} onClick={onClick} className="nav-link border-b border-transparent py-1.5 font-display text-sm leading-none text-dim transition-[color,border-color,text-shadow] duration-250 hover:text-ink max-desk:text-[.5625rem]">
      {label}
    </button>
  );
}
