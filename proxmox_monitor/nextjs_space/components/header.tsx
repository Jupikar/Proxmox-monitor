'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Settings } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Proxmox Monitor</span>
        </div>
        
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted'
            }`}
          >
            <Activity className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/config"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              pathname === '/config'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted'
            }`}
          >
            <Settings className="h-4 w-4" />
            Configuration
          </Link>
        </nav>
      </div>
    </header>
  );
}
