import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const club = await prisma.organization.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            isCertifiedAnnonceur: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
        missions: {
          where: {
            status: 'OPEN',
            isHidden: false,
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
            _count: {
              select: {
                submissions: true,
              },
            },
          },
          orderBy: [
            { isFeatured: 'desc' },
            { featuredRank: 'asc' },
            { createdAt: 'desc' },
          ],
          take: 20,
        },
        _count: {
          select: {
            followers: true,
            missions: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: club.id,
      slug: club.slug,
      name: club.name,
      logoUrl: club.logoUrl,
      coverUrl: club.coverUrl,
      bio: club.bio,
      website: club.website,
      isCertified: club.isCertified,
      ratingAvg: club.ratingAvg,
      ratingCount: club.ratingCount,
      owner: club.owner,
      missions: club.missions,
      followersCount: club._count.followers,
      missionsCount: club._count.missions,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    });
  } catch (e: any) {
    console.error('Error in GET /api/clubs/[slug]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


