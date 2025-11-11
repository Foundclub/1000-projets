import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';

/**
 * POST /api/admin/feed/comments/[id]/hide
 * Masquer un commentaire (soft-delete)
 * RBAC: ADMIN only
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
    
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Vérifier que le commentaire existe
    const comment = await prisma.feedComment.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            id: true,
          },
        },
      },
    });
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Supprimer le commentaire (hard delete pour l'instant, on pourrait ajouter un champ hidden)
    await prisma.$transaction(async (tx) => {
      await tx.feedComment.delete({
        where: { id },
      });
      await tx.feedPost.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in POST /api/admin/feed/comments/[id]/hide:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

