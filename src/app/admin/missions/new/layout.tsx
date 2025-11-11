import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canCreateMission } from '@/lib/rbac';

export default async function NewMissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  
  // Permettre ADMIN et ANNONCEUR de créer des missions
  if (!user || !canCreateMission(user)) {
    redirect('/login');
  }
  
  // Ne pas afficher le layout admin (tabs, etc.) pour cette page
  return <>{children}</>;
}


