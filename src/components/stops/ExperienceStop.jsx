import { isTouchDevice } from '../../engine/config.js';
import Stop, { StopTitle } from './Stop.jsx';

// The big bright star, with a list of every role. Each row flies to that role's mini star.
export default function ExperienceStop({ roles, onSelectRole }) {
  return (
    <Stop isLong accent="#bfe2ff" eyebrow="The bright star">
      <StopTitle isCompact>Experience</StopTitle>
      <ul className="mt-3.5 border-t border-line max-desk:mt-2.5 max-desk:flex max-desk:flex-wrap max-desk:gap-1.5 max-desk:pt-2.5">
        {roles.map((role, i) => (
          <li key={role.short}>
            <RoleLink role={role} onClick={() => onSelectRole(i)} />
          </li>
        ))}
      </ul>
      <p className="label mt-3 text-dim">{isTouchDevice() ? 'Tap' : 'Click'} a star or keep scrolling</p>
    </Stop>
  );
}

// A full row on desktop, with dates. A small rounded chip with the short name on phones.
function RoleLink({ role, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-baseline gap-2.5 border-b border-line py-2 max-[1000px]:py-1.5 text-left text-[.9375rem] leading-[1.3] transition-colors duration-200 hover:text-[#bfe2ff] max-desk:min-h-[34px] max-desk:w-auto max-desk:items-center max-desk:gap-[7px] max-desk:rounded-[17px] max-desk:border max-desk:px-2.5 max-desk:py-1.5 max-desk:text-[.8125rem]"
    >
      <i className="size-[7px] flex-none self-center rounded-full" style={{ background: role.color, boxShadow: `0 0 6px ${role.color}` }} />
      <strong className="min-w-0 font-medium max-[1000px]:truncate max-desk:hidden">{role.role}</strong>
      <span className="hidden max-desk:inline">{role.short}</span>
      <span className="label ml-auto flex-none text-[.6875rem] tracking-[.08em] text-dim max-[1000px]:hidden">{role.dates}</span>
    </button>
  );
}
