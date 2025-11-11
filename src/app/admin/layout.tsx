import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin, canCreateMission } from '@/lib/rbac';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Pour /admin/missions/new et /admin/my-missions, permettre ADMIN et ANNONCEUR
  // Pour les autres routes admin, seulement ADMIN
  // Si l'utilisateur n'est pas ADMIN, on vérifie s'il peut créer des missions
  // Si oui, on laisse passer (pour /admin/missions/new et /admin/my-missions)
  // Sinon, on redirige
  if (!isAdmin(user) && !canCreateMission(user)) {
    redirect('/login');
  }
  
  // Ne pas afficher les tabs admin si l'utilisateur n'est pas admin
  // Les tabs admin sont uniquement pour les admins, pas pour les annonceurs
  const showAdminTabs = isAdmin(user);
  
  return (
    <div className="space-y-6">
      {showAdminTabs && (
        <>
          <div className="border-b pb-4">
            <h1 className="text-3xl font-bold">Administration</h1>
            <p className="text-muted-foreground mt-2">
              Gestion de la plateforme, des utilisateurs et des missions
            </p>
          </div>
          
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList>
              <TabsTrigger value="dashboard">
                <Link href="/admin" className="block">Dashboard</Link>
              </TabsTrigger>
              <TabsTrigger value="users">
                <Link href="/admin/users" className="block">Utilisateurs</Link>
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Link href="/admin/requests" className="block">Revues</Link>
              </TabsTrigger>
              <TabsTrigger value="missions">
                <Link href="/admin/missions" className="block">Missions</Link>
              </TabsTrigger>
              <TabsTrigger value="clubs">
                <Link href="/admin/clubs" className="block">Clubs</Link>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Link href="/admin/settings" className="block">Paramètres</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      )}
      
      <div className={showAdminTabs ? 'mt-6' : ''}>
        {children}
      </div>
    </div>
  );
}

