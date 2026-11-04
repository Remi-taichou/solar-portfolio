// The frame shared by every stop: a tall section whose text stays pinned while the camera flies.
//   side:    which side of the screen the text sits on, 'left' or 'right'
//   accent:  the colour of the small heading
//   isLong:  lets long text scroll inside the stop on short screens
//   isRole:  a shorter section, used for the resume stars
// The engine finds these through data-stop and data-stop-inner and fades them as you scroll.
export default function Stop({ side = 'left', accent = 'var(--color-sol)', eyebrow, isLong = false, isRole = false, children }) {
  return (
    <section data-stop style={{ '--accent': accent }} className={`relative ${isRole ? 'h-[135lvh]' : 'h-[190lvh]'}`}>
      <div
        data-stop-inner
        className={[
          'sticky top-0 flex h-svh items-center pr-(--gutter-r) pl-(--gutter-l) pt-[90px] pb-[100px]',
          'max-desk:items-end max-desk:pb-[76px] short:pt-[70px] short:pb-[60px]',
          side === 'right' ? 'justify-end max-desk:justify-start shade-right' : 'shade-left',
          isRole ? 'shade-role' : '',
        ].join(' ')}
      >
        <div
          className={[
            'stop-copy pointer-events-none w-[min(31rem,42vw)] min-w-0 text-shadow-copy max-desk:w-full',
            isLong ? 'pointer-events-auto max-h-[calc(100svh-170px)] overflow-y-auto [scrollbar-width:thin]' : '',
          ].join(' ')}
        >
          {eyebrow && <p className="label mb-3.5 text-(--accent)">{eyebrow}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

// The large heading of a stop. `isCompact` is for stops with a lot of text below it.
export function StopTitle({ isCompact = false, children }) {
  const size = isCompact
    ? 'mb-2.5 text-[clamp(1.5rem,calc(1rem+1.8vw),2.5rem)] max-desk:text-[1.375rem]'
    : 'mb-[18px] text-[clamp(1.875rem,calc(1rem+2.9vw),3.75rem)] max-desk:mb-2.5 max-desk:text-[clamp(1.625rem,7.6vw,2.5rem)] short:text-[1.75rem]';
  return <h2 className={`font-display leading-[1.08] font-normal text-balance ${size}`}>{children}</h2>;
}

// A two-column list of labels and values, such as School / University of PEI.
export function FactList({ rows }) {
  return (
    <dl className="my-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-[22px] gap-y-[7px] border-t border-line pt-4 max-desk:my-3 max-desk:pt-2.5">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="label pt-[.2em] text-dim">{label}</dt>
          <dd className="min-w-0 wrap-anywhere">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// A bulleted list of resume or project points.
export function BulletPoints({ points, hasDivider = true }) {
  return (
    <ul className={`grid list-disc gap-[9px] pl-[1.1em] text-[.9375rem] leading-normal max-desk:gap-[7px] max-desk:text-sm ${hasDivider ? 'border-t border-line pt-3.5 max-desk:pt-2.5' : ''}`}>
      {points.map((point) => <li key={point}>{point}</li>)}
    </ul>
  );
}
