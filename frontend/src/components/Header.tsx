import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, LogOut } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  userName: string;
  onLogout: () => void;
}

export const Header = ({ userName, onLogout }: HeaderProps) => {
  const [dark, setDark] = React.useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  const toggleDark = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setDark(false);
    } else {
      root.classList.add('dark');
      setDark(true);
    }
  };

  return (
  <header className="w-full border-b bg-blue-600 p-3 flex items-center justify-between text-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-semibold text-white">Smart Task Planner</h1>
            <div className="text-xs font-semibold text-blue-100">From goal to plan in seconds.</div>
          </div>
        </div>
        {/* username intentionally removed from header */}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleDark} aria-label="Toggle dark mode">
          {dark ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-white" />}
        </Button>
        {userName ? (
          <Button size="sm" variant="outline" onClick={onLogout} className="bg-slate-100 text-slate-900 border border-slate-200 px-2 py-1">
            <LogOut className={`h-4 w-4 mr-1 text-slate-900`} />
            Sign out
          </Button>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
