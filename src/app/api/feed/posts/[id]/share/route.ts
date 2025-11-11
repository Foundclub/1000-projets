import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateFeedPostShareUrl } from '@/lib/share';

/**
 * POST /api/feed/posts/[id]/share
 * Incrémente le compteur de partages
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
    
    // Vérifier que le post existe
    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Incrémenter le compteur de partages
    await prisma.feedPost.update({
      where: { id },
      data: { shareCount: { increment: 1 } },
    });
    
    // Générer l'URL de partage
    const shareUrl = generateFeedPostShareUrl(id);
    
    return NextResponse.json({ shareUrl });
  } catch (e: any) {
    console.error('Error in POST /api/feed/posts/[id]/share:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

