import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MissionStatus } from '@prisma/client';
import { canCreateMission } from '@/lib/rbac';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { calculateEffectivePrivacy, shouldCreateFeedPost, shouldPublishImmediately, shouldCreateAsDraft } from '@/lib/feed-privacy';
import { createNotification } from '@/lib/notifications';

/**
 * PATCH /api/missions/[id]/close
 * Clôture une mission et crée des FeedPosts pour les submissions acceptées
 * RBAC: ANNONCEUR (owner) or ADMIN only
 * Rate limit: 10/min
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !canCreateMission(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = keyFromReq(req as any, user.id);
    if (!limit(`${key}:close-mission`, 10, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    
    // Vérifier que la mission existe et appartient à l'utilisateur (ou que l'utilisateur est admin)
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            feedPrivacyDefault: true,
          },
        },
      },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    if (mission.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this mission' }, { status: 403 });
    }

    if (mission.status === 'CLOSED') {
      return NextResponse.json({ error: 'Mission already closed' }, { status: 400 });
    }

    // Récupérer toutes les submissions acceptées pour cette mission
    const acceptedSubmissions = await prisma.submission.findMany({
      where: {
        missionId: id,
        status: 'ACCEPTED',
      },
      include: {
        user: {
          select: {
            id: true,
            feedPrivacyDefault: true,
          },
        },
      },
    });

    // Clôturer la mission et créer les FeedPosts si nécessaire
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      // Clôturer la mission
      const updatedMission = await tx.mission.update({
        where: { id },
        data: {
          status: MissionStatus.CLOSED,
        },
      });

      // Créer des FeedPosts pour chaque submission acceptée qui n'en a pas encore
      const feedPostsCreated: string[] = [];
      
      for (const submission of acceptedSubmissions) {
        // Vérifier si un FeedPost existe déjà pour cette submission
        const existingPost = await tx.feedPost.findUnique({
          where: { submissionId: submission.id },
          select: { id: true },
        });

        if (existingPost) {
          continue; // Déjà créé
        }

        // Calculer la privacy effective
        const userDefault = submission.user.feedPrivacyDefault || 'AUTO';
        const override = (submission as any).feedPrivacyOverride || 'INHERIT';
        const effectivePrivacy = calculateEffectivePrivacy(userDefault, override);

        // Créer le FeedPost si nécessaire
        if (shouldCreateFeedPost(effectivePrivacy)) {
          const editableUntil = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes
          const published = shouldPublishImmediately(effectivePrivacy);
          
          const feedPost = await (tx as any).feedPost.create({
            data: {
              missionId: mission.id,
              submissionId: submission.id,
              authorId: submission.userId,
              space: mission.space,
              text: null,
              mediaUrls: [],
              published: published,
              editableUntil: editableUntil,
            },
          });

          feedPostsCreated.push(feedPost.id);

          // Créer une notification si le post est en brouillon
          if (shouldCreateAsDraft(effectivePrivacy)) {
            await createNotification(submission.userId, 'FEED_POST_DRAFT_READY', {
              postId: feedPost.id,
              missionId: mission.id,
              missionTitle: mission.title,
            });
          }
        }
      }

      // Note: On ne crée pas de FeedPost pour l'annonceur ici car submissionId est unique
      // Le FeedPost pour l'annonceur sera créé séparément si nécessaire
      // Pour l'instant, on retourne null et on laisse le frontend gérer la création
      let annonceurFeedPostId: string | null = null;

      return { mission: updatedMission, feedPostsCreated, annonceurFeedPostId };
    });

    return NextResponse.json({
      mission: updated.mission,
      feedPostsCreated: updated.feedPostsCreated,
      annonceurFeedPostId: updated.annonceurFeedPostId,
    });
  } catch (e: any) {
    console.error('Error closing mission:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

