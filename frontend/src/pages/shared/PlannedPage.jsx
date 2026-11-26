import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Placeholder for screens that are designed in Figma but not built in code yet.
 * Keeps every navigation item honest: it says what the screen is and links to its prototype.
 */
export const PLANNED = {
  'visitor-passes':   { title: 'Visitor passes',        frame: '1521-9492', what: 'All visitor, event and item passes across the community, with filters and bulk actions.' },
  watchlist:          { title: 'Watchlist',             frame: '1521-9492', what: 'People and plates the HOA has flagged; guards see an alert when they scan one.' },
  documents:          { title: 'Document review',       frame: '1521-9492', what: 'OR/CR, IDs and lease documents waiting for approval, oldest first, with required remarks when rejecting.' },
  'item-passes':      { title: 'Item gate passes',      frame: '1521-9492', what: 'Requests to move furniture and appliances in or out of a property.' },
  incidents:          { title: 'Incidents',             frame: '1521-9492', what: 'Incident reports from guards, sorted by severity, with assignment and resolution notes.' },
  tenants:            { title: 'Tenants & leases',      frame: '1521-9492', what: 'Tenants per property with lease dates and renewal reminders.' },
  vehicles:           { title: 'Vehicles & stickers',   frame: '1521-9492', what: 'Registered vehicles, RFID/sticker status and OR/CR expiry.' },
  reports:            { title: 'Reports',               frame: '1521-9492', what: 'Gate traffic, peak hours and compliance reports with CSV/PDF export.' },
  audit:              { title: 'Audit log',             frame: '1521-9492', what: 'Read-only history of every admin action for accountability.' },
  settings:           { title: 'Settings',              frame: '1521-9492', what: 'Gate hours, pass rules and notification settings.' },
  notifications:      { title: 'Notifications',         frame: '1521-9492', what: 'Everything that needs your attention, newest first.' },
  household:          { title: 'Household',             frame: '1544-4394', what: 'Household members and tenants who can create passes for this home.' },
  'my-home':          { title: 'My home',               frame: '1544-4394', what: 'Properties, vehicles, documents and item gate passes, grouped in section tabs.' },
  activity:           { title: 'Activity',              frame: '1544-4394', what: 'Every entry and exit for your properties, plus notifications.' },
  patrol:             { title: 'Patrol rounds',         frame: '1585-7952', what: 'Checkpoint rounds with progress, scanned at each post.' },
  more:               { title: 'More',                  frame: '1581-5534', what: 'Shift handover, contacts and settings for the guard tablet.' },
};

const PlannedPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const item = PLANNED[slug] || { title: 'Coming soon', frame: '1599-5083', what: 'This screen is part of the Figma redesign.' };
  const home = { admin: '/admin/dashboard', resident: '/resident/dashboard', guard: '/guard/dashboard' }[user?.role] || '/';
  const guard = user?.role === 'guard';

  return (
    <div className="max-w-2xl mx-auto py-16 anim-fade-in">
      <div className={`rounded-card p-8 border ${guard ? 'bg-g-surface border-g-border' : 'bg-surface-card border-line shadow-card'}`}>
        <span className={`inline-flex h-7 items-center px-3 rounded-full text-[12px] font-bold tracking-[0.08em] ${guard ? 'bg-g-info-bg text-g-info' : 'bg-status-warn-bg text-status-warn'}`}>
          DESIGNED · NOT BUILT YET
        </span>
        <h1 className={`mt-4 text-[32px] font-semibold ${guard ? 'text-g-text' : 'text-ink'}`}>{item.title}</h1>
        <p className={`mt-2 text-[16px] ${guard ? 'text-g-text-2' : 'text-ink-muted'}`}>{item.what}</p>
        <p className={`mt-2 text-[15px] ${guard ? 'text-g-text-2' : 'text-ink-muted'}`}>
          This screen is in the Figma redesign. It needs backend endpoints that the semi-final build does not have yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={home} className={`inline-flex items-center gap-2 h-11 px-5 rounded-full border text-[15px] font-semibold ${guard ? 'border-g-border text-g-text' : 'border-line text-ink hover:bg-surface-subtle'}`}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to dashboard
          </Link>
          <a
            href={`https://www.figma.com/proto/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=${item.frame}&starting-point-node-id=${item.frame}`}
            target="_blank" rel="noreferrer"
            className={`inline-flex items-center gap-2 h-11 px-5 rounded-full text-[15px] font-semibold ${guard ? 'bg-g-accent text-g-on-accent' : 'bg-brand text-brand-on'}`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" /> Open Figma prototype
          </a>
        </div>
      </div>
    </div>
  );
};

export default PlannedPage;
