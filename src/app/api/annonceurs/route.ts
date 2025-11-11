import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/annonceurs
 * Recherche les annonceurs par nom
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const certified = searchParams.get('certified');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      role: 'ANNONCEUR',
    };

    // Recherche par nom (displayName, firstName, lastName, email, companyName) - recherche intelligente
    if (q) {
      // Recherche exacte d'abord, puis recherche partielle
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filtre certifié
    if (certified === 'true') {
      where.isCertifiedAnnonceur = true;
    }

    const [annonceurs, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isCertifiedAnnonceur: true,
          ratingAvg: true,
          ratingCount: true,
          bio: true,
          companyName: true,
          website: true,
        },
        orderBy: [
          { isCertifiedAnnonceur: 'desc' },
          { ratingAvg: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    // Compter les missions ouvertes pour chaque annonceur
    const annonceursWithStats = await Promise.all(
      annonceurs.map(async (annonceur) => {
        const missionsCount = await prisma.mission.count({
          where: {
            ownerId: annonceur.id,
            status: 'OPEN',
            isHidden: false,
          },
        });

        return {
          ...annonceur,
          missionsCount,
        };
      })
    );

    // Trier les annonceurs pour mettre les correspondances exactes en premier
    let sortedAnnonceurs = annonceursWithStats;
    if (q) {
      const qLower = q.toLowerCase();
      sortedAnnonceurs = [...annonceursWithStats].sort((a, b) => {
        const aDisplayName = (a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email).toLowerCase();
        const bDisplayName = (b.displayName || `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email).toLowerCase();
        const aCompanyName = (a.companyName || '').toLowerCase();
        const bCompanyName = (b.companyName || '').toLowerCase();
        
        // Prioriser les noms qui commencent par la query
        const aStartsWith = aDisplayName.startsWith(qLower) || aCompanyName.startsWith(qLower);
        const bStartsWith = bDisplayName.startsWith(qLower) || bCompanyName.startsWith(qLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Ensuite, prioriser les noms qui contiennent la query au début
        const aContainsAtStart = aDisplayName.indexOf(qLower) < 3 || aCompanyName.indexOf(qLower) < 3;
        const bContainsAtStart = bDisplayName.indexOf(qLower) < 3 || bCompanyName.indexOf(qLower) < 3;
        if (aContainsAtStart && !bContainsAtStart) return -1;
        if (!aContainsAtStart && bContainsAtStart) return 1;
        
        // Ensuite, prioriser les annonceurs certifiés
        if (a.isCertifiedAnnonceur && !b.isCertifiedAnnonceur) return -1;
        if (!a.isCertifiedAnnonceur && b.isCertifiedAnnonceur) return 1;
        
        // Ensuite, par note moyenne
        if (a.ratingAvg !== b.ratingAvg) return b.ratingAvg - a.ratingAvg;
        
        // Enfin, par nombre de missions
        if (a.missionsCount !== b.missionsCount) return b.missionsCount - a.missionsCount;
        
        return 0;
      });
    }

    return NextResponse.json({
      annonceurs: sortedAnnonceurs,
      total,
    });
  } catch (e: any) {
    console.error('Error in GET /api/annonceurs:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

