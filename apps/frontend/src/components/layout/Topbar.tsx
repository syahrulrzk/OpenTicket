import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

interface TopbarProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Topbar({ collapsed: _collapsed, onToggleSidebar }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const titleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/tickets': 'Tickets',
    '/tickets/new': 'Create Ticket',
    '/users': 'Users',
    '/reports': 'Reports',
    '/settings': 'Settings',
  };
  const pageTitle = titleMap[location.pathname] || 'OpenTICKET';

  return (
    <header className="h-16 bg-background-secondary border-b border-border-default flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`transition-all duration-200 ${searchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'} overflow-hidden`}>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="input-field pl-9 h-9"
            />
          </div>
        </div>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-overlay rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-overlay rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full" />
        </button>
      </div>
    </header>
  );
}
