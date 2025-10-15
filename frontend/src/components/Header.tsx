import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, LogOut } from 'lucide-react';

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
    <header className="w-full border-b bg-background/50 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Smart Task Planner</h1>
        <div className="text-sm text-muted-foreground">{userName}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleDark} aria-label="Toggle dark mode">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </header>
  );
};

export default Header;
