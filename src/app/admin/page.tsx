import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { MissionStatus, SubmissionStatus, ReportStatus, Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect('/login');
  }
  
  // Fetch KPIs
  const [
    usersTotal,
    usersByRole,
    missionsByStatus,
    submissionsByStatus,
    reportsOpen,
    pendingMissions,
    pendingAnnonceurs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.mission.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.submission.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.report.count({
      where: { status: 'OPEN' },
    }),
    prisma.mission.findMany({
      where: { status: MissionStatus.PENDING },
      include: {
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.user.findMany({
      where: { annonceurRequestStatus: 'PENDING' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);
  
  const usersByRoleMap = usersByRole.reduce((acc, item) => {
    acc[item.role] = item._count;
    return acc;
  }, {} as Record<Role, number>);
  
  const missionsByStatusMap = missionsByStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<MissionStatus, number>);
  
  const submissionsByStatusMap = submissionsByStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<SubmissionStatus, number>);
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-muted-foreground">Utilisateurs</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersTotal}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {usersByRoleMap[Role.MISSIONNAIRE] || 0} Missionnaires • {usersByRoleMap[Role.ANNONCEUR] || 0} Annonceurs • {usersByRoleMap[Role.ADMIN] || 0} Admins
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-muted-foreground">Missions</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missionsByStatusMap[MissionStatus.PENDING] || 0} en attente</div>
            <div className="text-xs text-muted-foreground mt-1">
              {missionsByStatusMap[MissionStatus.OPEN] || 0} Ouvertes • {missionsByStatusMap[MissionStatus.CLOSED] || 0} Fermées • {missionsByStatusMap[MissionStatus.ARCHIVED] || 0} Archivées
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-muted-foreground">Soumissions</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissionsByStatusMap[SubmissionStatus.PENDING] || 0} en attente</div>
            <div className="text-xs text-muted-foreground mt-1">
              {submissionsByStatusMap[SubmissionStatus.ACCEPTED] || 0} Acceptées • {submissionsByStatusMap[SubmissionStatus.REFUSED] || 0} Refusées
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-muted-foreground">Litiges</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsOpen}</div>
            <div className="text-xs text-muted-foreground mt-1">Ouverts</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Missions en attente */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Missions en attente d'approbation</h2>
            <Link href="/admin/missions?status=PENDING">
              <Button variant="outline" size="sm">Voir tout</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingMissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune mission en attente</p>
          ) : (
            <div className="space-y-3">
              {pendingMissions.map(mission => (
                <div key={mission.id} className="flex items-start justify-between gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{mission.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Par {mission.owner.firstName} {mission.owner.lastName} ({mission.owner.email})
                      {mission.owner.companyName && ` • ${mission.owner.companyName}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créée le {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/missions/${mission.id}/approve`}>
                      <Button size="sm">Approuver</Button>
                    </Link>
                    <Link href={`/admin/missions/${mission.id}/reject`}>
                      <Button size="sm" variant="outline">Rejeter</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Annonceurs en attente (KYC) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Annonceurs en attente (KYC)</h2>
            <Link href="/admin/requests">
              <Button variant="outline" size="sm">Voir tout</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingAnnonceurs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun annonceur en attente</p>
          ) : (
            <div className="space-y-3">
              {pendingAnnonceurs.map(annonceur => (
                <div key={annonceur.id} className="flex items-start justify-between gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {annonceur.firstName} {annonceur.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{annonceur.email}</p>
                    {annonceur.companyName && (
                      <p className="text-sm font-medium mt-1">🏢 {annonceur.companyName}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Demande créée le {new Date(annonceur.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/requests?userId=${annonceur.id}`}>
                      <Button size="sm" variant="outline">Voir Doc</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


