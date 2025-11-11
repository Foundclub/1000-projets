import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';

/**
 * DELETE /api/feed/comments/[id]
 * Supprimer un commentaire
 * Autoriser si auteur OU admin
 */
export async function DELETE(
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
    
    // Récupérer le commentaire
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
    
    // Vérifier les permissions
    const isAuthor = comment.userId === user.id;
    const isAdminUser = isAdmin(user);
    
    if (!isAuthor && !isAdminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Supprimer le commentaire
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
    console.error('Error in DELETE /api/feed/comments/[id]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

