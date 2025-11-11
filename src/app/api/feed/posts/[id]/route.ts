import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { validateMediaForSpace } from '@/lib/media-validation';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

const feedPostUpdateSchema = z.object({
  text: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

/**
 * GET /api/feed/posts/[id]
 * Récupère un post par ID (pour le modal de publication)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    const { id } = await params;
    
    const post = await prisma.feedPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
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
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Vérifier les permissions : l'auteur ou un admin peut voir le post
    const isAuthor = post.authorId === user?.id;
    const isAdminUser = user && isAdmin(user);
    const canView = isAuthor || isAdminUser || post.published;
    
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({ post });
  } catch (e: any) {
    console.error('Error in GET /api/feed/posts/[id]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/feed/posts/[id]
 * Édite un post (text, published, mediaUrls)
 * Autoriser si auteur ET editableUntil > now OU admin
 */
export async function PATCH(
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
    const body = await req.json();
    const parsed = feedPostUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    
    // Récupérer le post
    const post = await prisma.feedPost.findUnique({
      where: { id },
      include: {
        mission: {
          select: {
            space: true,
          },
        },
      },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Vérifier les permissions
    const isAuthor = post.authorId === user.id;
    const isAdminUser = isAdmin(user);
    const canEdit = isAdminUser || (isAuthor && post.editableUntil && post.editableUntil > new Date());
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden: Cannot edit this post' }, { status: 403 });
    }
    
    // Valider les médias si fournis
    if (parsed.data.mediaUrls !== undefined) {
      const mediaValidation = validateMediaForSpace(
        parsed.data.mediaUrls,
        post.mission.space
      );
      
      if (!mediaValidation.valid) {
        return NextResponse.json({ error: mediaValidation.error }, { status: 400 });
      }
    }
    
    // Mettre à jour le post
    const updateData: any = {};
    if (parsed.data.text !== undefined) {
      updateData.text = parsed.data.text || null;
    }
    if (parsed.data.mediaUrls !== undefined) {
      updateData.mediaUrls = parsed.data.mediaUrls;
    }
    if (parsed.data.published !== undefined) {
      updateData.published = parsed.data.published;
    }
    
    const updated = await prisma.feedPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
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
    
    // Notifier l'auteur si le post vient d'être publié
    if (parsed.data.published === true && !post.published) {
      try {
        await createNotification(updated.authorId, 'FEED_POST_PUBLISHED', {
          postId: updated.id,
          missionId: updated.mission.id,
          missionTitle: updated.mission.title,
        });
      } catch (notifError) {
        console.error('Error creating notification for feed post published:', notifError);
        // Ne pas faire échouer la publication si la notification échoue
      }
    }
    
    return NextResponse.json({ post: updated });
  } catch (e: any) {
    console.error('Error in PATCH /api/feed/posts/[id]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

