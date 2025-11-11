"use client";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Briefcase, FileText, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch('/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUserRole(userData.role || null);
        }
      } catch (e) {
        // User not logged in
      } finally {
        setLoading(false);
      }
    }
    fetchUserRole();
  }, []);

  // Ne pas afficher sur certaines pages (login, signup, etc.)
  const hiddenPaths = ['/login', '/signup', '/auth'];
  if (hiddenPaths.some(path => pathname?.startsWith(path))) {
    return null;
  }

  // Onglets de base pour tous les utilisateurs
  const baseNavItems = [
    {
      href: '/feed',
      label: 'Feed',
      icon: Sparkles,
      exact: false,
    },
    {
      href: '/missions',
      label: 'Missions',
      icon: Home,
      exact: true,
    },
    {
      href: '/my-applications',
      label: 'Candidatures',
      icon: FileText,
      exact: false,
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      exact: false,
    },
  ];

  // Onglets supplémentaires pour ADMIN et ANNONCEUR
  const adminNavItems = [
    {
      href: '/admin/my-missions',
      label: 'Mes missions',
      icon: Briefcase,
      exact: false,
    },
  ];

  // Déterminer les onglets à afficher selon le rôle
  const navItems = userRole === 'ADMIN' || userRole === 'ANNONCEUR'
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t-2 border-border/50 shadow-2xl shadow-black/20">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around h-16 sm:h-18">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? pathname === item.href
              : pathname?.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] sm:min-w-[70px]",
                  "hover:bg-accent/50 active:scale-95",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center w-full",
                  isActive && "bg-primary/10 rounded-lg p-1.5"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6 transition-all duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium transition-all duration-200 text-center",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

