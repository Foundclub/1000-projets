import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/feed/[postId]
 * Récupère les détails d'un post avec commentaires
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    const { postId } = await params;
    
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
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
            description: true,
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
        comments: {
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
          take: 20, // Premiers 20 commentaires
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Vérifier si l'utilisateur a liké ce post
    let hasLiked = false;
    if (user) {
      const like = await prisma.feedLike.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: user.id,
          },
        },
      });
      hasLiked = !!like;
    }
    
    return NextResponse.json({
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
      hasLiked,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      mission: post.mission,
      comments: post.comments,
    });
  } catch (e: any) {
    console.error('Error in GET /api/feed/[postId]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

