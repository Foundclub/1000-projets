import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';

/**
 * POST /api/feed/posts/[id]/like
 * Toggle like (créer si absent, supprimer si présent)
 * Rate limit: 60/min
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
    if (!limit(`${key}:feed-like`, 60, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    // Vérifier que le post existe
    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Vérifier si le like existe déjà
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: user.id,
        },
      },
    });
    
    if (existingLike) {
      // Supprimer le like
      await prisma.$transaction(async (tx) => {
        await tx.feedLike.delete({
          where: { id: existingLike.id },
        });
        await tx.feedPost.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        });
      });
      
      return NextResponse.json({ liked: false });
    } else {
      // Créer le like
      await prisma.$transaction(async (tx) => {
        await tx.feedLike.create({
          data: {
            postId: id,
            userId: user.id,
          },
        });
        await tx.feedPost.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
        });
      });
      
      return NextResponse.json({ liked: true });
    }
  } catch (e: any) {
    console.error('Error in POST /api/feed/posts/[id]/like:', e);
    if (e.code === 'P2002') {
      // Like déjà existant (race condition)
      return NextResponse.json({ error: 'Like already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/feed/posts/[id]/like
 * Supprimer un like
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
    
    // Vérifier que le post existe
    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Vérifier si le like existe
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: user.id,
        },
      },
    });
    
    if (!existingLike) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }
    
    // Supprimer le like
    await prisma.$transaction(async (tx) => {
      await tx.feedLike.delete({
        where: { id: existingLike.id },
      });
      await tx.feedPost.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in DELETE /api/feed/posts/[id]/like:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

