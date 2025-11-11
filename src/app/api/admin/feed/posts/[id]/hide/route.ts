import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';

/**
 * POST /api/admin/feed/posts/[id]/hide
 * Masquer un post (soft-delete)
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
    
    // Vérifier que le post existe
    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Masquer le post (soft-delete)
    const updated = await prisma.feedPost.update({
      where: { id },
      data: { published: false },
    });
    
    return NextResponse.json({ post: updated });
  } catch (e: any) {
    console.error('Error in POST /api/admin/feed/posts/[id]/hide:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

