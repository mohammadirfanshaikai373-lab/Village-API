import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { LayoutDashboard, Key, BarChart3, CreditCard, Shield, Users, AlertTriangle, ScrollText, LogOut, Sun, Moon, Compass } from 'lucide-react';

interface SidebarProps {
  type: 'portal' | 'admin';
}

const portalLinks = [
  { to: '/portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/portal/keys', icon: Key, label: 'Keys' },
  { to: '/portal/usage', icon: BarChart3, label: 'Usage' },
  { to: '/portal/plan', icon: CreditCard, label: 'Plan' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/anomalies', icon: AlertTriangle, label: 'Anomalies' },
  { to: '/admin/audit', icon: ScrollText, label: 'Audit' },
];

export default function Sidebar({ type }: SidebarProps) {
  const { signOut, profile } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const links = type === 'portal' ? portalLinks : adminLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="w-64 h-screen bg-card dark:bg-card-dark border-r border-rule dark:border-rule-dark flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-rule dark:border-rule-dark">
        <div className="flex items-center gap-2">
          <Compass size={24} strokeWidth={1.5} className="text-primary dark:text-teal" />
          <span className="font-heading font-bold text-lg text-ink dark:text-cream">VillageAPI</span>
        </div>
        {profile && (
          <div className="mt-2 text-xs text-faded dark:text-ash font-body truncate">{profile.email}</div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body transition-colors ${isActive ? 'bg-primary/10 dark:bg-teal/10 text-primary dark:text-teal font-semibold' : 'text-faded dark:text-ash hover:bg-parchment dark:hover:bg-void hover:text-ink dark:hover:text-cream'}`
            }
          >
            <link.icon size={18} strokeWidth={1.5} />
            {link.label}
          </NavLink>
        ))}
        {type === 'portal' && profile?.role === 'admin' && (
          <NavLink
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body text-faded dark:text-ash hover:bg-parchment dark:hover:bg-void hover:text-ink dark:hover:text-cream transition-colors mt-4 border-t border-rule dark:border-rule-dark pt-4"
          >
            <Shield size={18} strokeWidth={1.5} />
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-rule dark:border-rule-dark space-y-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body text-faded dark:text-ash hover:bg-parchment dark:hover:bg-void hover:text-ink dark:hover:text-cream transition-colors w-full"
        >
          {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body text-accent dark:text-coral hover:bg-accent/10 dark:hover:bg-coral/10 transition-colors w-full"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}