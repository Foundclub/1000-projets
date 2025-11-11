import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Space } from '@prisma/client';

/**
 * GET /api/feed
 * Liste les posts du feed avec pagination cursor et filtres
 * Query params: space (ALL|PRO|SOLIDAIRE), cursor, limit, onlyFollowed (boolean)
 */
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    const { searchParams } = new URL(req.url);
    
    const spaceParam = searchParams.get('space') || 'ALL';
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit') || '20';
    const onlyFollowed = searchParams.get('onlyFollowed') === 'true';
    
    const limit = Math.min(parseInt(limitParam, 10), 50); // Max 50
    
    // Construire la clause where
    const where: any = {
      published: true, // Seulement les posts publiés
    };
    
    // Filtre par espace
    if (spaceParam !== 'ALL') {
      where.space = spaceParam as Space;
    }
    
    // Filtre par cursor (pagination)
    if (cursor) {
      where.createdAt = {
        lt: new Date(cursor),
      };
    }
    
    // Filtre "Abonnements" (onlyFollowed)
    if (onlyFollowed && user) {
      // Récupérer les IDs des utilisateurs et organisations suivis
      const follows = await prisma.follow.findMany({
        where: {
          followerId: user.id,
        },
        select: {
          targetType: true,
          organizationId: true,
          targetUserId: true,
        },
      });
      
      const followedUserIds: string[] = [];
      const followedOrgIds: string[] = [];
      
      follows.forEach((follow) => {
        if (follow.targetType === 'USER' && follow.targetUserId) {
          followedUserIds.push(follow.targetUserId);
        } else if (follow.targetType === 'ORGANIZATION' && follow.organizationId) {
          followedOrgIds.push(follow.organizationId);
        }
      });
      
      // Si l'utilisateur ne suit personne, retourner une liste vide
      if (followedUserIds.length === 0 && followedOrgIds.length === 0) {
        return NextResponse.json({
          posts: [],
          nextCursor: null,
          hasMore: false,
        });
      }
      
      // Filtrer les posts par auteur suivi OU mission d'organisation suivie
      where.OR = [
        { authorId: { in: followedUserIds } },
        {
          mission: {
            organizationId: { in: followedOrgIds },
          },
        },
      ];
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
      take: limit + 1, // Prendre un de plus pour savoir s'il y a une page suivante
    });
    
    // Vérifier s'il y a une page suivante
    const hasMore = posts.length > limit;
    const actualPosts = hasMore ? posts.slice(0, limit) : posts;
    
    // Récupérer les likes de l'utilisateur pour les posts
    let userLikes: Set<string> = new Set();
    if (user) {
      const likes = await prisma.feedLike.findMany({
        where: {
          userId: user.id,
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
    console.error('Error in GET /api/feed:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

