import { getDayStops } from '../engine/config.js';
import ContactStop from './stops/ContactStop.jsx';
import ExperienceStop from './stops/ExperienceStop.jsx';
import OverviewStop from './stops/OverviewStop.jsx';
import ProjectStop from './stops/ProjectStop.jsx';
import RoleStop from './stops/RoleStop.jsx';
import SunStop from './stops/SunStop.jsx';

// The sun side of the page: every stop you scroll through by day, in order.
// The order must match the camera stops in engine/config.js (getDayStops).
export default function DayTrack({ site, trackRef, onSelectStop }) {
  const { FIRST_ROLE } = getDayStops(site);
  const roles = site.experience.roles;

  return (
    <div ref={trackRef}>
      <OverviewStop />
      <SunStop sun={site.sun} />
      {site.projects.map((project, i) => (
        <ProjectStop key={project.name} project={project} index={i} total={site.projects.length} />
      ))}
      <ExperienceStop roles={roles} onSelectRole={(i) => onSelectStop(FIRST_ROLE + i)} />
      {roles.map((role, i) => (
        <RoleStop key={role.short} role={role} index={i} total={roles.length} />
      ))}
      <ContactStop contact={site.contact} />
    </div>
  );
}
