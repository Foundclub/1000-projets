import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar';
import { getPublicUrl } from '@/lib/supabase';
import { ApplicationActions } from '@/components/application-actions';

export default async function MissionApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Vérifier que la mission existe et appartient à l'utilisateur (ou que l'utilisateur est admin)
  const mission = await prisma.mission.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      ownerId: true,
    },
  });

  if (!mission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Mission non trouvée
        </div>
      </div>
    );
  }

  if (mission.ownerId !== user.id && user.role !== 'ADMIN') {
    redirect('/admin/my-missions');
  }

  // Récupérer toutes les candidatures pour cette mission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applications = await (prisma as any).missionApplication?.findMany({
    where: { missionId: id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      thread: {
        select: {
          id: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              authorId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  }) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidatures pour "{mission.title}"</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les candidatures et communiquez avec les missionnaires
          </p>
        </div>
        <Link href="/admin/my-missions">
          <Button variant="outline">Retour aux missions</Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg font-medium mb-2">Aucune candidature</p>
              <p className="text-sm">
                Aucun missionnaire n'a encore postulé pour cette mission.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application: any) => {
            const userName = application.user.displayName ||
              (application.user.firstName && application.user.lastName 
                ? `${application.user.firstName} ${application.user.lastName}` 
                : null) ||
              application.user.email;

            const avatarUrl = getPublicUrl(application.user.avatar, 'avatars');
            const lastMessage = application.thread?.messages[0];
            const threadId = application.thread?.id;

            return (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={avatarUrl}
                      alt={userName || ''}
                      name={userName || undefined}
                      email={application.user.email}
                      size="md"
                      clickable={true}
                      showModal={true}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{userName}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status === 'PENDING' ? '⏳ En attente' :
                           application.status === 'ACCEPTED' ? '✅ Acceptée' :
                           '❌ Refusée'}
                        </span>
                      </div>
                      {application.message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          "{application.message}"
                        </p>
                      )}
                      {lastMessage && (
                        <p className="text-xs text-muted-foreground">
                          Dernier message : {new Date(lastMessage.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {application.status === 'PENDING' && (
                        <ApplicationActions
                          missionId={mission.id}
                          applicationId={application.id}
                          applicationStatus={application.status}
                        />
                      )}
                      {threadId && (
                        <Link href={`/threads/${threadId}`}>
                          <Button size="sm" variant="outline">
                            💬 Chat
                          </Button>
                        </Link>
                      )}
                      <Link href={`/annonceurs/${application.user.id}`}>
                        <Button size="sm" variant="outline">
                          👤 Profil
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

