import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const certified = searchParams.get('certified');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    // Search by name - recherche intelligente avec similarité
    if (q) {
      // Recherche exacte d'abord, puis recherche partielle
      where.name = {
        contains: q,
        mode: 'insensitive',
      };
    }

    // Filter by certified
    if (certified === 'true') {
      where.isCertified = true;
    }

    const [clubs, total] = await Promise.all([
      prisma.organization.findMany({
        where,
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
              followers: true,
              missions: true,
            },
          },
        },
        orderBy: [
          { isCertified: 'desc' },
          { ratingAvg: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.organization.count({ where }),
    ]);

    // Trier les clubs pour mettre les correspondances exactes en premier
    let sortedClubs = clubs;
    if (q) {
      const qLower = q.toLowerCase();
      sortedClubs = [...clubs].sort((a, b) => {
        const aNameLower = a.name.toLowerCase();
        const bNameLower = b.name.toLowerCase();
        
        // Prioriser les noms qui commencent par la query
        const aStartsWith = aNameLower.startsWith(qLower);
        const bStartsWith = bNameLower.startsWith(qLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Ensuite, prioriser les noms qui contiennent la query au début
        const aContainsAtStart = aNameLower.indexOf(qLower) < 3;
        const bContainsAtStart = bNameLower.indexOf(qLower) < 3;
        if (aContainsAtStart && !bContainsAtStart) return -1;
        if (!aContainsAtStart && bContainsAtStart) return 1;
        
        // Ensuite, prioriser les clubs certifiés
        if (a.isCertified && !b.isCertified) return -1;
        if (!a.isCertified && b.isCertified) return 1;
        
        // Ensuite, par note moyenne
        if (a.ratingAvg !== b.ratingAvg) return b.ratingAvg - a.ratingAvg;
        
        // Enfin, par date de création
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return NextResponse.json({
      clubs: sortedClubs.map(club => ({
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
        followersCount: club._count.followers,
        missionsCount: club._count.missions,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      })),
      total,
    });
  } catch (e: any) {
    console.error('Error in GET /api/clubs:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


