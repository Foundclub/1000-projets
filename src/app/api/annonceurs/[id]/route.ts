import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get annonceur with missions and stats
    const annonceur = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isCertifiedAnnonceur: true,
        ratingAvg: true,
        ratingCount: true,
        bio: true,
        activities: true,
        website: true,
        companyName: true,
        createdAt: true,
        missions: {
          where: {
            status: 'OPEN',
            isHidden: false,
          },
          select: {
            id: true,
            title: true,
            space: true,
            description: true,
            slotsTaken: true,
            slotsMax: true,
            imageUrl: true,
            rewardText: true,
            createdAt: true,
            organization: {
              select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                isCertified: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!annonceur) {
      return NextResponse.json({ error: 'Annonceur not found' }, { status: 404 });
    }

    if (annonceur.role !== 'ANNONCEUR') {
      return NextResponse.json({ error: 'User is not an annonceur' }, { status: 400 });
    }

    // Check if current user has favorited this annonceur
    let isFavorited = false;
    try {
      const currentUser = await getCurrentUser(req, NextResponse.next());
      if (currentUser) {
        const favorite = await prisma.favoriteAnnonceur.findFirst({
          where: {
            userId: currentUser.id,
            annonceurId: id,
          },
        });
        isFavorited = !!favorite;
      }
    } catch {
      // User not authenticated, isFavorited stays false
    }

    return NextResponse.json({
      ...annonceur,
      isFavorited,
    });
  } catch (e: any) {
    console.error('Error in GET /api/annonceurs/[id]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


