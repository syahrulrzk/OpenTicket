import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  FileText,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT', 'USER'] },
  { to: '/tickets', icon: Ticket, label: 'Tickets', roles: ['SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT', 'USER'] },
  { to: '/tickets/new', icon: PlusCircle, label: 'New Ticket', roles: ['SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT', 'USER'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['SUPER_ADMIN', 'IT_MANAGER'] },
  { to: '/reports', icon: FileText, label: 'Reports', roles: ['SUPER_ADMIN', 'IT_MANAGER'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT', 'USER'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-background-secondary border-r border-border-default flex flex-col transition-[width] duration-200 ease-in-out relative`}
    >
      <button
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-background-secondary border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background-overlay transition-colors"
      >
        {collapsed ? (
          <ArrowRight className="w-3.5 h-3.5" />
        ) : (
          <ArrowLeft className="w-3.5 h-3.5" />
        )}
      </button>
      {/* Logo */}
      <div
        className={`h-16 flex items-center border-b border-border-default ${
          collapsed ? 'justify-center px-0' : 'px-5'
        }`}
      >
        <div className="w-9 h-9 bg-accent-blue rounded-xl flex items-center justify-center shrink-0">
          <Ticket className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3">
            <span className="block text-text-primary whitespace-nowrap overflow-hidden">
              <span className="font-normal">Open</span>
              <span className="font-bold">TICKET</span>
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-secondary hover:bg-background-overlay hover:text-text-primary'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className={`border-t border-border-default/70 ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className={`flex items-center gap-2 py-2 text-sm text-text-secondary hover:text-accent-red hover:bg-background-overlay rounded-lg transition-colors ${
              collapsed ? 'w-full justify-center px-0' : 'flex-1 px-3'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
