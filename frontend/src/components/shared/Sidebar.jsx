import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, LayoutDashboard, Users, UserPen, DoorOpen, MapPinPen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Admin sidebar (Figma: A01 › Sidebar).
 * The fill is brand/forest. Active item: side/active pill + brand/forest text (11.8:1).
 * Nav items are kept to at most 5 per group (Miller, Hick).
 */
const NAV = {
  admin: [
    { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/residents',  icon: Users,           label: 'Residents' },
    { to: '/admin/users',      icon: UserPen,         label: 'Users & staff' },
    { to: '/guard/logs',       icon: DoorOpen,        label: 'Gate log' },
    { to: '/admin/properties', icon: MapPinPen,       label: 'Properties' },
  ],
};

const SidebarInner = ({ onClose, isOpen }) => {
  const { user } = useAuth();
  const links = NAV[user?.role] || NAV.admin;

  return (
    <div className="flex flex-col h-full bg-brand-forest">
      <div className={`flex items-center px-6 pt-7 pb-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden p-0'}`}>
        <img
          src="/camella-naga-logo-reversed.svg"
          alt="Camella Naga"
          className="w-40 h-auto select-none"
          draggable={false}
        />
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-4 top-4 text-side-text hover:text-side-active lg:hidden p-2"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <p className="px-6 pb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-side-text/70">Workspace</p>
      )}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Admin">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onClose}
            title={isOpen ? undefined : label}
            className={({ isActive }) =>
              `flex items-center h-11 rounded-full px-3.5 text-[15px] font-semibold transition-colors ${
                isActive
                  ? 'bg-side-active text-brand-forest'
                  : 'text-side-text hover:bg-white/5 hover:text-side-active'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isOpen ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'
              }`}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {isOpen && (
        <div className="m-4 rounded-2xl bg-side-badge px-4 py-3">
          <p className="text-[13px] font-bold text-side-active">HOA Office</p>
          <p className="text-[12px] text-side-text">Camella Homes Naga</p>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className={`hidden lg:flex flex-col h-screen shrink-0 sticky top-0 z-20 overflow-hidden transition-all duration-300 ${isOpen ? 'w-[260px]' : 'w-20'}`}>
        <SidebarInner isOpen={isOpen} />
      </aside>

      <button
        id="mobile-menu-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed top-2.5 left-3 z-50 w-11 h-11 rounded-full bg-brand-forest flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5 text-side-active" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] anim-slide-left lg:hidden shadow-xl">
            <SidebarInner onClose={() => setOpen(false)} isOpen />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
