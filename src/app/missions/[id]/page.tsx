import React from 'react';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SubmissionForm } from '@/components/submission-form';
import { ProofGallery } from '@/components/proof-gallery';
import { MissionHeaderRating } from '@/components/mission-header-rating';
import { ApplyMissionButton } from '@/components/apply-mission-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/avatar';
import { getCurrentUser } from '@/lib/auth';
import { getSignedUrl, getPublicUrl } from '@/lib/supabase';
import { ClickableImage } from '@/components/clickable-image';
import { Gift, Users, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CloseMissionButton } from '@/components/close-mission-button';
import { ReopenMissionButton } from '@/components/reopen-mission-button';

export default async function MissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = await prisma.mission.findUnique({ where: { id } });
  
  if (!mission) {
    notFound();
  }
  
  const user = await getCurrentUser();
  const isOwnerOrAdmin = user && (user.id === mission.ownerId || user.role === 'ADMIN');
  
  // Récupérer la submission acceptée de l'utilisateur pour cette mission
  let acceptedSubmissionId: string | undefined;
  let applicationThreadId: string | undefined;
  let hasApplication = false;
  let hasSubmission = false;
  if (user) {
    const acceptedSubmission = await prisma.submission.findFirst({
      where: {
        missionId: mission.id,
        userId: user.id,
        status: 'ACCEPTED',
      },
      select: { id: true },
    });
    acceptedSubmissionId = acceptedSubmission?.id;

    // Vérifier si l'utilisateur a déjà une soumission (même en attente)
    const anySubmission = await prisma.submission.findFirst({
      where: {
        missionId: mission.id,
        userId: user.id,
      },
      select: { id: true },
    });
    hasSubmission = !!anySubmission;

    // Vérifier si l'utilisateur a déjà postulé pour cette mission
    try {
      const application = await (prisma as any).missionApplication?.findFirst({
        where: {
          missionId: mission.id,
          userId: user.id,
        },
        select: {
          id: true,
          status: true,
          thread: {
            select: { id: true },
          },
        },
      });

      if (application) {
        hasApplication = true;
        applicationThreadId = application.thread?.id;
      }
    } catch (e) {
      console.warn('MissionApplication model not available yet:', e);
    }
  }
  
  let proofs: any[] = [];
  let applications: any[] = [];
  if (isOwnerOrAdmin) {
    const submissions = await prisma.submission.findMany({
      where: { missionId: mission.id },
      orderBy: { createdAt: 'desc' },
    });
    
    proofs = await Promise.all(submissions.map(async (sub) => {
      const shots: string[] = Array.isArray(sub.proofShots) ? (sub.proofShots as any) : [];
      const signed: string[] = [];
      for (const path of shots) {
        try {
          const url = await getSignedUrl(path, 300);
          if (url) signed.push(url);
        } catch (e) {
          console.error('Error signing URL:', e);
        }
      }
      return {
        id: sub.id,
        proofShotsSigned: signed,
        proofUrl: sub.proofUrl,
        status: sub.status,
        createdAt: sub.createdAt.toISOString(),
        comments: sub.comments,
      };
    }));

    try {
      applications = await (prisma as any).missionApplication?.findMany({
        where: { missionId: mission.id },
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
        take: 5,
      }) || [];
    } catch (e) {
      console.warn('Error loading applications:', e);
    }
  }

  const imageUrl = getPublicUrl((mission as any).imageUrl, 'missions');
  
  // Déterminer le bouton d'action principal
  let actionButton: React.ReactNode = null;
  if (isOwnerOrAdmin && mission.status === 'OPEN') {
    // Bouton de clôture pour l'annonceur/admin
    actionButton = (
      <CloseMissionButton
        missionId={mission.id}
        missionTitle={mission.title}
        missionStatus={mission.status}
        space={mission.space}
      />
    );
  } else if (isOwnerOrAdmin && mission.status === 'CLOSED') {
    // Bouton de réouverture pour l'annonceur/admin
    actionButton = (
      <ReopenMissionButton
        missionId={mission.id}
        missionTitle={mission.title}
        missionStatus={mission.status}
        slotsTaken={mission.slotsTaken}
        slotsMax={mission.slotsMax}
      />
    );
  } else if (user && user.id !== mission.ownerId) {
    if (acceptedSubmissionId) {
      // Soumission acceptée - lien vers thread
      const thread = await prisma.thread.findFirst({
        where: { submissionId: acceptedSubmissionId },
        select: { id: true },
      });
      if (thread) {
        actionButton = (
          <Link href={`/threads/${thread.id}`} className="w-full">
            <Button className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Ouvrir le chat
            </Button>
          </Link>
        );
      }
    } else if (hasApplication && !hasSubmission) {
      // Candidature mais pas de soumission
      actionButton = (
        <Link href={applicationThreadId ? `/threads/${applicationThreadId}` : '#'} className="w-full">
          <Button className="w-full" variant="outline">
            Soumettre ma réalisation
          </Button>
        </Link>
      );
    } else if (!hasApplication) {
      // Pas de candidature
      actionButton = (
        <ApplyMissionButton
          missionId={mission.id}
          missionTitle={mission.title}
          slotsTaken={mission.slotsTaken}
          slotsMax={mission.slotsMax}
          missionStatus={mission.status}
        />
      );
    }
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Image */}
        {imageUrl && (
          <ClickableImage
            src={imageUrl}
            alt={mission.title}
            containerClassName="w-full overflow-hidden rounded-lg"
          >
            <div className="w-full aspect-video overflow-hidden rounded-lg relative group bg-muted">
              <img 
                src={imageUrl} 
                alt={mission.title} 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity duration-300">
                  🔍 Cliquer pour agrandir
                </span>
              </div>
            </div>
          </ClickableImage>
        )}

        {/* Titre et type */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{mission.title}</h1>
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
              mission.space === 'PRO' 
                ? 'bg-pro-100 text-pro-700' 
                : 'bg-solidaire-100 text-solidaire-700'
            }`}>
              {mission.space}
            </span>
          </div>
          <MissionHeaderRating
            ownerId={mission.ownerId}
            missionId={mission.id}
            userId={user?.id}
            acceptedSubmissionId={acceptedSubmissionId}
          />
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{mission.description}</p>
          </CardContent>
        </Card>

        {/* Critères d'acceptation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Critères d'acceptation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{mission.criteria}</p>
          </CardContent>
        </Card>

        {/* Note SOLIDAIRE */}
        {mission.space === 'SOLIDAIRE' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-800 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Note importante :</span> Pour les missions SOLIDAIRE, 
                  veuillez ne pas inclure de visages ou de données sensibles dans vos captures.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Candidatures (owner/admin) */}
        {isOwnerOrAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Candidatures ({applications.length})</CardTitle>
                <Link href={`/admin/missions/${mission.id}/applications`}>
                  <Button variant="outline" size="sm">
                    Voir toutes
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">Aucune candidature pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
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
                      <div key={application.id} className="flex items-start gap-4 p-3 border rounded-lg">
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
                            <h3 className="font-semibold">{userName}</h3>
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
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preuves (owner/admin) */}
        {isOwnerOrAdmin && proofs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preuves soumises</CardTitle>
            </CardHeader>
            <CardContent>
              <ProofGallery proofs={proofs} />
            </CardContent>
          </Card>
        )}

        {/* Formulaire de soumission */}
        {user && user.id !== mission.ownerId && (
          <Card>
            <CardHeader>
              <CardTitle>Soumettre votre travail</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionForm 
                missionId={mission.id} 
                missionStatus={mission.status}
                slotsTaken={mission.slotsTaken}
                slotsMax={mission.slotsMax}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Colonne droite (1/3) - Sticky */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-4">
          {/* Récompense */}
          {(mission as any).rewardText && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Gift className="w-5 h-5" />
                  Récompense
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800">{(mission as any).rewardText}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Slots occupés</div>
                  <div className="font-semibold">{mission.slotsTaken}/{mission.slotsMax}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Décision</div>
                  <div className="font-semibold">{mission.slaDecisionH}h</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Remise</div>
                  <div className="font-semibold">{mission.slaRewardH}h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton d'action principal */}
          {actionButton && (
            <Card>
              <CardContent className="pt-6">
                {actionButton}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
