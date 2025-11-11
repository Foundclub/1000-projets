import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canCreateMission } from '@/lib/rbac';
import { keyFromReq, limit } from '@/lib/ratelimit';

/**
 * POST /api/missions/[id]/create-annonceur-post
 * Crée un FeedPost pour l'annonceur après clôture de mission
 * RBAC: ANNONCEUR (owner) or ADMIN only
 * Rate limit: 10/min
 */
export async function POST(
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
    if (!limit(`${key}:create-annonceur-post`, 10, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    
    // Vérifier que la mission existe et appartient à l'utilisateur
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        submissions: {
          where: {
            status: 'ACCEPTED',
          },
          take: 1,
          select: {
            id: true,
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

    if (mission.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Mission must be closed first' }, { status: 400 });
    }

    if (mission.submissions.length === 0) {
      return NextResponse.json({ error: 'No accepted submissions found' }, { status: 400 });
    }

    // Vérifier que la mission a une image (recommandé mais pas obligatoire)
    if (!mission.imageUrl) {
      // On continue quand même, mais on pourrait ajouter un warning
      console.warn(`Mission ${mission.id} has no image, post will be created without image`);
    }

    // Vérifier si un FeedPost existe déjà pour l'annonceur
    const existingPost = await prisma.feedPost.findFirst({
      where: {
        missionId: mission.id,
        authorId: mission.ownerId,
      },
      select: { id: true },
    });

    if (existingPost) {
      return NextResponse.json({ postId: existingPost.id });
    }

    // Créer un FeedPost pour l'annonceur (en brouillon)
    const now = new Date();
    const editableUntil = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes
    const firstSubmission = mission.submissions[0];
    
    const feedPost = await prisma.feedPost.create({
      data: {
        missionId: mission.id,
        submissionId: firstSubmission.id, // Utiliser la première submission comme référence technique
        authorId: mission.ownerId, // L'annonceur est l'auteur
        space: mission.space,
        text: null,
        mediaUrls: [],
        published: false, // En brouillon pour que l'annonceur puisse le modifier
        editableUntil: editableUntil,
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            space: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ postId: feedPost.id, mission: feedPost.mission });
  } catch (e: any) {
    console.error('Error creating annonceur post:', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Post already exists for this mission' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

