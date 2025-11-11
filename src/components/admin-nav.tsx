"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch('/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUserRole(userData.role);
        }
      } catch (e) {
        // Ignore
      }
    }
    fetchUserRole();
  }, []);
  
  if (userRole !== 'ADMIN') {
    return null;
  }
  
  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      title: 'Dashboard',
    },
    {
      href: '/admin/users',
      label: 'Utilisateurs',
      icon: Users,
      title: 'Utilisateurs',
    },
    {
      href: '/admin/requests',
      label: 'Revues',
      icon: FileCheck,
      title: 'Revues',
    },
    {
      href: '/admin/missions',
      label: 'Missions',
      icon: Target,
      title: 'Missions Admin',
    },
  ];
  
  return (
    <nav className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap",
              isActive
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            title={item.title}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xl:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

