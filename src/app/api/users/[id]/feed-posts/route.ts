import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Space } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const currentUser = await getCurrentUser(req, res);
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const spaceParam = searchParams.get('space') || 'ALL';
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit') || '20';
    const limit = Math.min(parseInt(limitParam, 10), 50);

    // Construire la clause where
    const where: any = {
      authorId: id,
      published: true,
    };

    // Filtre par espace
    if (spaceParam !== 'ALL') {
      where.space = spaceParam as Space;
    }

    // Pagination cursor
    if (cursor) {
      where.createdAt = {
        lt: new Date(cursor),
      };
    }

    // Récupérer les posts
    const posts = await prisma.feedPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isCertifiedAnnonceur: true,
            xp: true,
            xpPro: true,
            xpSolid: true,
          },
        },
        mission: {
          select: {
            id: true,
            title: true,
            space: true,
            imageUrl: true,
            owner: {
              select: {
                id: true,
                displayName: true,
                isCertifiedAnnonceur: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                isCertified: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
    });

    // Vérifier s'il y a une page suivante
    const hasMore = posts.length > limit;
    const actualPosts = hasMore ? posts.slice(0, limit) : posts;

    // Récupérer les likes de l'utilisateur pour les posts
    let userLikes: Set<string> = new Set();
    if (currentUser) {
      const likes = await prisma.feedLike.findMany({
        where: {
          userId: currentUser.id,
          postId: { in: actualPosts.map((p) => p.id) },
        },
        select: {
          postId: true,
        },
      });
      userLikes = new Set(likes.map((l) => l.postId));
    }

    // Formater les posts avec hasLiked
    const formattedPosts = actualPosts.map((post) => ({
      id: post.id,
      missionId: post.missionId,
      submissionId: post.submissionId,
      authorId: post.authorId,
      space: post.space,
      text: post.text,
      mediaUrls: post.mediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      mission: post.mission,
      hasLiked: userLikes.has(post.id),
    }));

    // Calculer le cursor suivant
    const nextCursor = hasMore && actualPosts.length > 0
      ? actualPosts[actualPosts.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor,
      hasMore,
    });
  } catch (e: any) {
    console.error('Error in GET /api/users/[id]/feed-posts:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

