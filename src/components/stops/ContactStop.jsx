import { useState } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { FiLink, FiMail } from 'react-icons/fi';
import Stop, { StopTitle } from './Stop.jsx';

// Matches the `icon` value of each link in data/site.js. Add new logos here; others get a plain link icon.
const ICONS = { github: FaGithub, linkedin: FaLinkedin };

// Your email and links, beside a wide view of the system.
export default function ContactStop({ contact }) {
  const mailto = `mailto:${contact.email}`;

  return (
    <Stop eyebrow="Open a channel">
      <StopTitle>Contact</StopTitle>
      {contact.intro && <p className="mb-3.5 max-w-136">{contact.intro}</p>}
      <a href={mailto} className="mb-2.5 inline-block text-[clamp(1.375rem,calc(1rem+1.6vw),2.25rem)] leading-[1.2] wrap-anywhere no-underline transition-colors duration-250 hover:text-sol">
        {contact.email}
      </a>
      <div><CopyEmailButton email={contact.email} /></div>

      <ul className="mt-6 flex items-center gap-3 max-desk:mt-4">
        <li><IconLink href={mailto} label="Email me" Icon={FiMail} /></li>
        {contact.links.map((link) => (
          <li key={link.label}>
            <IconLink href={link.url} label={link.label} Icon={ICONS[link.icon] ?? FiLink} opensNewTab />
          </li>
        ))}
      </ul>
    </Stop>
  );
}

// One round icon button that links out.
function IconLink({ href, label, Icon, opensNewTab = false }) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={opensNewTab ? '_blank' : undefined}
      rel={opensNewTab ? 'noopener' : undefined}
      className="grid size-11 place-items-center rounded-full border border-line text-[1.25rem] text-ink transition-colors duration-250 hover:border-sol hover:text-sol"
    >
      <Icon aria-hidden="true" />
    </a>
  );
}

// Copies the email, for visitors whose device has no mail app set up.
function CopyEmailButton({ email }) {
  const [buttonText, setButtonText] = useState('Copy email');

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setButtonText('Copied');
    } catch {
      setButtonText('Copy failed: select the address above');
    }
  }

  return (
    <button type="button" onClick={copyEmail} className="min-h-8 border-b border-line text-sm text-dim transition-colors duration-250 hover:border-ink hover:text-ink">
      {buttonText}
    </button>
  );
}
