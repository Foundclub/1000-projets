"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { saveCurrentAccount } from '@/lib/multi-account';
import { Avatar } from '@/components/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { XpBars } from '@/components/xp-bars';
import { MultiAccountSwitcher } from '@/components/multi-account-switcher';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Briefcase, 
  User
} from 'lucide-react';

export function UserNav() {
  const [user, setUser] = useState<{ 
    id?: string;
    email: string; 
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    role?: string;
    activeRole?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const supabase = supabaseBrowser();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          // Fetch user data from API
          const res = await fetch('/api/user/me', { credentials: 'include' });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            // Sauvegarder le compte actuel dans la liste des comptes multiples
            await saveCurrentAccount();
          } else {
            setUser({ email: authUser.email, role: 'MISSIONNAIRE' });
            await saveCurrentAccount();
          }
        }
      } catch (e) {
        // User not logged in
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  async function handleLogout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="h-4 w-16 bg-secondary rounded animate-pulse"></div>
      </div>
    );
  }

  if (user) {
    const canCreateMission = user.role === 'ADMIN' || user.role === 'ANNONCEUR';
    const displayName = user.displayName || 
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
      user.email;
    
    const activeRole = user.activeRole || user.role;
    const hasPrivileges = user.role === 'ADMIN' || user.role === 'ANNONCEUR';
    const showSwitchButton = hasPrivileges;
    
    return (
      <div className="flex items-center gap-x-4 text-xs sm:text-sm">
        {/* Section principale - liens centraux avec espacement */}
        <div className="flex items-center gap-x-4 flex-shrink-0">
          <NotificationsDropdown />
          <MultiAccountSwitcher />
        </div>
        
        {/* Section création */}
        {canCreateMission && (
          <>
            <div className="h-4 sm:h-6 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent flex-shrink-0" />
            <Link 
              href="/admin/missions/new"
              className="inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 bg-gradient-to-br from-primary via-primary/95 to-primary text-primary-foreground hover:from-primary/90 hover:via-primary hover:to-primary/90 flex items-center gap-1 sm:gap-1.5 shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 active:shadow-lg active:scale-[0.97] hover:scale-[1.05] border-2 border-primary/30 ring-2 ring-primary/20 hover:ring-primary/30 whitespace-nowrap relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 flex-shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Créer une mission</span>
              <span className="sm:hidden">Créer</span>
            </Link>
          </>
        )}
        
        {/* Séparateur avant l'Avatar */}
        <div className="h-4 sm:h-6 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent flex-shrink-0" />
        
        {/* Avatar avec menu utilisateur unique */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200 border-2 border-primary/30 hover:border-primary/50 shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98] hover:scale-[1.02] ml-1">
              <Avatar
                src={user.avatar}
                alt={displayName || 'Avatar'}
                name={displayName || undefined}
                email={user.email}
                size="sm"
                clickable={false}
                showModal={false}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {/* En-tête avec informations utilisateur */}
            <DropdownMenuLabel>
              <div className="flex items-center gap-3 mb-2">
                <Avatar
                  src={user.avatar}
                  alt={displayName || 'Avatar'}
                  name={displayName || undefined}
                  email={user.email}
                  size="md"
                  clickable={false}
                  showModal={false}
                />
                <div className="flex-1">
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Progression XP */}
            <DropdownMenuLabel className="text-xs">Progression XP</DropdownMenuLabel>
            <div className="px-2 pb-2">
              <XpBars />
            </div>
            <DropdownMenuSeparator />
            
            {/* Mode (si applicable) */}
            {showSwitchButton && (
              <>
                <DropdownMenuLabel className="text-xs">Mode</DropdownMenuLabel>
                <div className="px-2 pb-2">
                  <Select
                    value={activeRole}
                    onValueChange={async (newRole: string) => {
                      if (switchingRole || newRole === activeRole) return;
                      setSwitchingRole(true);
                      try {
                        const res = await fetch('/api/user/active-role', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ activeRole: newRole }),
                        });

                        if (res.ok) {
                          const resUser = await fetch('/api/user/me', { credentials: 'include' });
                          if (resUser.ok) {
                            const userData = await resUser.json();
                            setUser(userData);
                          }
                          router.refresh();
                        }
                      } catch (e) {
                        console.error('Error switching role:', e);
                      } finally {
                        setSwitchingRole(false);
                      }
                    }}
                    disabled={switchingRole}
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {hasPrivileges && (
                        <>
                          <SelectItem value="MISSIONNAIRE">Mode Missionnaire</SelectItem>
                          {user.role === 'ADMIN' && (
                            <SelectItem value="ADMIN">Mode Admin</SelectItem>
                          )}
                          {user.role === 'ANNONCEUR' && (
                            <SelectItem value="ANNONCEUR">Mode Annonceur</SelectItem>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Lien vers le profil annonceur (si applicable) */}
            {user.role === 'ANNONCEUR' && user.id && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/annonceurs/${user.id}`} className="w-full cursor-pointer flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Mon profil annonceur
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Lien vers le profil */}
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer flex items-center gap-2">
                <User className="w-4 h-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            
            {/* Déconnexion */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-3 text-sm">
      <Link href="/missions">Missions</Link>
      <Link href="/admin/roles">Admin</Link>
      <Link href="/login">Login</Link>
    </div>
  );
}
