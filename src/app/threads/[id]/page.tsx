import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ChatThread } from '@/components/ChatThread';
import { MissionHeaderRating } from '@/components/mission-header-rating';
import { RewardJournal } from '@/components/reward-journal';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageType } from '@prisma/client';

type ChatMessage = { id: string; threadId: string; authorId: string; type: 'TEXT'|'CODE'|'REWARD'; content: string; createdAt: string };

function filterChatMessages(messages: Array<{ type: MessageType; createdAt: Date | string; [key: string]: any }>): ChatMessage[] {
  return messages
    .filter(m => m.type === 'TEXT' || m.type === 'CODE' || m.type === 'REWARD')
    .map(m => {
      const createdAt = typeof m.createdAt === 'string' ? m.createdAt : (m.createdAt as Date).toISOString();
      return {
        ...m,
        createdAt,
        type: m.type as 'TEXT'|'CODE'|'REWARD'
      } as ChatMessage;
    });
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const thread = await prisma.thread.findUnique({ 
    where: { id }, 
    include: { 
      messages: { orderBy: { createdAt: 'asc' } }, 
      submission: { 
        include: { 
          mission: true 
        } 
      },
      application: {
        include: {
          mission: true,
          user: {
            select: {
              id: true,
              displayName: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    } 
  });
  
  if (!thread) return notFound();
  
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Vous devez être connecté pour voir ce thread.
        </div>
      </div>
    );
  }

  // Vérifier que l'utilisateur fait partie du thread
  if (thread.aId !== user.id && thread.bId !== user.id && user.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Vous n'avez pas accès à ce thread.
        </div>
      </div>
    );
  }

    // Si c'est un thread lié à une soumission
    if (thread.submission) {
      const submission = thread.submission;
      const mission = submission.mission;
      
      // Déterminer qui est le missionnaire (celui qui n'est pas l'owner)
      const missionnaireId = thread.aId === mission.ownerId ? thread.bId : thread.aId;
      const otherUserId = thread.aId === user.id ? thread.bId : thread.aId;
      const canRate = user && user.id === missionnaireId && submission.status === 'ACCEPTED';
      
      // Vérifier si l'utilisateur peut marquer la récompense comme remise (owner ou admin)
      const canMarkReward = user && (user.id === mission.ownerId || user.role === 'ADMIN') && submission.status === 'ACCEPTED';
      const rewardDeliveredAt = (submission as any).rewardDeliveredAt;
      const rewardNote = (submission as any).rewardNote;
      const rewardMediaUrl = (submission as any).rewardMediaUrl;
      
      return (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Chat - {mission.title}</h1>
            <Link href={`/missions/${mission.id}`}>
              <Button variant="outline" size="sm">
                Voir la mission
              </Button>
            </Link>
          </div>
          {canRate && (
            <div className="border-b pb-4">
              <MissionHeaderRating
                ownerId={mission.ownerId}
                missionId={mission.id}
                userId={user?.id}
                acceptedSubmissionId={submission.id}
              />
            </div>
          )}
          {canMarkReward && (
            <div className="border-b pb-4">
              <RewardJournal
                submissionId={submission.id}
                rewardDeliveredAt={rewardDeliveredAt}
                rewardNote={rewardNote}
                rewardMediaUrl={rewardMediaUrl}
              />
            </div>
          )}
          <ChatThread 
            threadId={thread.id} 
            initialMessages={filterChatMessages(thread.messages)} 
            currentUserId={user.id}
            otherUserId={otherUserId}
          />
        </div>
      );
    }

  // Si c'est un thread lié à une candidature
  if (thread.application) {
    const application = thread.application;
    const mission = application.mission;
    const missionnaire = application.user;
    const missionnaireName = missionnaire.displayName ||
      (missionnaire.firstName && missionnaire.lastName 
        ? `${missionnaire.firstName} ${missionnaire.lastName}` 
        : null) ||
      missionnaire.email;
    const otherUserId = thread.aId === user.id ? thread.bId : thread.aId;

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chat - {mission.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conversation avec {missionnaireName}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/missions/${mission.id}`}>
              <Button variant="outline" size="sm">
                Voir la mission
              </Button>
            </Link>
            {user.role === 'ANNONCEUR' && user.id === mission.ownerId && (
              <Link href={`/admin/missions/${mission.id}/applications`}>
                <Button variant="outline" size="sm">
                  Toutes les candidatures
                </Button>
              </Link>
            )}
          </div>
        </div>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Candidature</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
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
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-1">Message initial :</p>
                  <p className="text-sm">{application.message}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Candidature créée le {new Date(application.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </CardContent>
        </Card>
        <ChatThread 
          threadId={thread.id} 
          initialMessages={filterChatMessages(thread.messages)} 
          currentUserId={user.id}
          otherUserId={otherUserId}
        />
      </div>
    );
  }

  // Thread sans soumission ni candidature (ne devrait pas arriver)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-12 text-muted-foreground">
        Thread invalide
      </div>
    </div>
  );
}
