import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

const commentCreateSchema = z.object({
  text: z.string().min(1).max(1000),
});

function maskContacts(text: string): string {
  return text
    .replace(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email masqué]')
    .replace(/\+?\d[\d\s-]{8,}/g, '[téléphone masqué]');
}

/**
 * GET /api/feed/posts/[id]/comments
 * Liste les commentaires d'un post avec pagination cursor
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit') || '20';
    const limitCount = Math.min(parseInt(limitParam, 10), 50);
    
    // Vérifier que le post existe
    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Construire la clause where
    const where: any = {
      postId: id,
    };
    
    // Pagination cursor
    if (cursor) {
      where.createdAt = {
        gt: new Date(cursor),
      };
    }
    
    // Récupérer les commentaires
    const comments = await prisma.feedComment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatar: true,
            xp: true,
            xpPro: true,
            xpSolid: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limitCount + 1, // Prendre un de plus pour savoir s'il y a une page suivante
    });
    
    // Vérifier s'il y a une page suivante
    const hasMore = comments.length > limitCount;
    const actualComments = hasMore ? comments.slice(0, limitCount) : comments;
    
    // Masquer les contacts dans les commentaires
    const formattedComments = actualComments.map((comment) => ({
      ...comment,
      text: maskContacts(comment.text),
    }));
    
    // Calculer le cursor suivant
    const nextCursor = hasMore && actualComments.length > 0
      ? actualComments[actualComments.length - 1].createdAt.toISOString()
      : null;
    
    return NextResponse.json({
      comments: formattedComments,
      nextCursor,
      hasMore,
    });
  } catch (e: any) {
    console.error('Error in GET /api/feed/posts/[id]/comments:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/feed/posts/[id]/comments
 * Créer un commentaire sur un post
 * Rate limit: 10/min
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!limit(`${key}:feed-comment`, 10, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const body = await req.json();
    const parsed = commentCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    
    // Vérifier que le post existe et récupérer les infos nécessaires
    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        mission: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Masquer les contacts dans le texte
    const maskedText = maskContacts(parsed.data.text);
    
    // Créer le commentaire
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.feedComment.create({
        data: {
          postId: id,
          userId: user.id,
          text: maskedText,
        },
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
        },
      });
      
      // Incrémenter le compteur de commentaires
      await tx.feedPost.update({
        where: { id },
        data: { commentCount: { increment: 1 } },
      });
      
      return newComment;
    });
    
    // Notifier l'auteur du post (sauf si c'est l'auteur lui-même qui commente)
    if (post.authorId !== user.id) {
      try {
        const commenterName = user.displayName || 
          (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
          user.email?.split('@')[0] || 
          'Quelqu\'un';
        
        await createNotification(post.authorId, 'FEED_POST_COMMENTED', {
          postId: post.id,
          missionId: post.mission.id,
          missionTitle: post.mission.title,
          commenterId: user.id,
          commenterName: commenterName,
        });
      } catch (notifError) {
        console.error('Error creating notification for feed comment:', notifError);
      }
    }
    
    return NextResponse.json({ comment }, { status: 201 });
  } catch (e: any) {
    console.error('Error in POST /api/feed/posts/[id]/comments:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

