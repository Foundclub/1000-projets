import { NextRequest, NextResponse } from 'next/server';
import { missionCreateSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { canCreateMission } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { notifyOrganizationFollowers } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    const { searchParams } = new URL(req.url);
    const space = searchParams.get('space') === 'SOLIDAIRE' ? 'SOLIDAIRE' : 'PRO';
    const tab = searchParams.get('tab'); // 'mes-annonceurs-favoris' pour missions des annonceurs favoris
    const query = searchParams.get('query') || '';
    const certified = searchParams.get('certified');
    const available = searchParams.get('available');
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const where: any = {
      space,
      status: 'OPEN',
      isHidden: false,
    };

    // Tab "mes-annonceurs-favoris" : missions des annonceurs favoris par l'utilisateur
    if (tab === 'mes-annonceurs-favoris' && user) {
      const favorites = await prisma.favoriteAnnonceur.findMany({
        where: { userId: user.id },
        select: { annonceurId: true },
      });
      
      const annonceurIds = favorites.map(f => f.annonceurId);
      
      if (annonceurIds.length === 0) {
        // Si l'utilisateur n'a aucun annonceur favori, retourner une liste vide
        return NextResponse.json({ missions: [], total: 0, page, limit });
      }
      
      where.ownerId = { in: annonceurIds };
    }

    // Recherche texte (titre/description) - recherche intelligente avec similarité
    if (query) {
      // Recherche avec contains (recherche partielle) pour inclure les résultats similaires
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filtre certifié (club certifié)
    if (certified === 'true') {
      where.organization = {
        isCertified: true,
      };
    }

    // Filtre slots disponibles (on ne peut pas faire de comparaison de champs directement dans Prisma where)
    // On filtrera côté client si nécessaire, ou on utilisera une raw query
    // Pour l'instant, on laisse ce filtre vide et on filtre après

    // Filtre par club
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Pour le filtre slots disponibles, on doit récupérer toutes les missions puis filtrer
    // car Prisma ne supporte pas la comparaison de champs dans where
    const takeLimit = available === 'true' ? limit * 3 : limit; // Récupérer plus pour compenser le filtrage
    
    const [missions, totalBeforeFilter] = await Promise.all([
      prisma.mission.findMany({
        where: where as any,
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
        orderBy: [
          { isFeatured: 'desc' },
          { featuredRank: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: available === 'true' ? 0 : skip, // Si filtre slots, on récupère depuis le début
        take: takeLimit,
      }),
      prisma.mission.count({ where: where as any }),
    ]);

    // Filtrer par slots disponibles si nécessaire (après la requête)
    let filteredMissions = missions;
    if (available === 'true') {
      filteredMissions = missions.filter(m => m.slotsTaken < m.slotsMax);
      // Appliquer la pagination après le filtrage
      const startIndex = (page - 1) * limit;
      filteredMissions = filteredMissions.slice(startIndex, startIndex + limit);
    }

    // Recalculer le total si filtre slots disponibles
    let total = totalBeforeFilter;
    if (available === 'true') {
      // Pour le total avec filtre slots, on doit compter toutes les missions correspondantes
      // On récupère toutes les missions (sans pagination) pour compter
      const allMissions = await prisma.mission.findMany({
        where: where as any,
        select: {
          id: true,
          slotsTaken: true,
          slotsMax: true,
        },
      });
      total = allMissions.filter(m => m.slotsTaken < m.slotsMax).length;
    }

    // Trier les missions pour mettre les correspondances exactes en premier
    let sortedMissions = filteredMissions;
    if (query) {
      const queryLower = query.toLowerCase();
      sortedMissions = [...filteredMissions].sort((a, b) => {
        const aTitleLower = a.title.toLowerCase();
        const bTitleLower = b.title.toLowerCase();
        
        // Prioriser les titres qui commencent par la query
        const aStartsWith = aTitleLower.startsWith(queryLower);
        const bStartsWith = bTitleLower.startsWith(queryLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Ensuite, prioriser les titres qui contiennent la query au début
        const aContainsAtStart = aTitleLower.indexOf(queryLower) < 3;
        const bContainsAtStart = bTitleLower.indexOf(queryLower) < 3;
        if (aContainsAtStart && !bContainsAtStart) return -1;
        if (!aContainsAtStart && bContainsAtStart) return 1;
        
        // Ensuite, prioriser les missions featured
        if ((a as any).isFeatured && !(b as any).isFeatured) return -1;
        if (!(a as any).isFeatured && (b as any).isFeatured) return 1;
        
        // Enfin, par date de création
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return NextResponse.json({
      missions: sortedMissions.map(m => ({
        id: m.id,
        title: m.title,
        space: m.space,
        description: m.description,
        criteria: m.criteria,
        slotsTaken: m.slotsTaken,
        slotsMax: m.slotsMax,
        slaDecisionH: m.slaDecisionH,
        slaRewardH: m.slaRewardH,
        imageUrl: (m as any).imageUrl,
        rewardText: (m as any).rewardText,
        ownerId: m.ownerId,
        organizationId: (m as any).organizationId,
        status: m.status,
        isFeatured: (m as any).isFeatured,
        featuredRank: (m as any).featuredRank,
        createdAt: m.createdAt,
        owner: m.owner,
        organization: (m as any).organization,
      })),
      total,
      page,
      limit,
    });
  } catch (e: any) {
    console.error('Error in GET /api/missions:', e);
    console.error('Error details:', {
      message: e.message,
      code: e.code,
      meta: e.meta,
      stack: e.stack,
    });
    return NextResponse.json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? e.message : undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !canCreateMission(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const key = keyFromReq(req as any, user.id);
    if (!limit(key+':create-mission', 5, 60_000)) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const body = await req.json();
    const parsed = missionCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    const { imageUrl, rewardText, rewardEscrowContent, rewardMediaUrl, organizationId, baseXp, bonusXp, ...missionData } = parsed.data;
    
    // Vérifier que l'organization appartient à l'utilisateur si organizationId est fourni
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { ownerId: true },
      });
      
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      
      if (organization.ownerId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: You do not own this organization' }, { status: 403 });
      }
    }
    
    // Vérifier que seuls les admins peuvent modifier baseXp et bonusXp
    if ((baseXp !== undefined || bonusXp !== undefined) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only admins can set baseXp and bonusXp' }, { status: 403 });
    }
    
    // Toutes les missions sont créées directement avec status=OPEN (pas de validation requise)
    const status = 'OPEN';
    
    const m = await prisma.mission.create({ 
      data: { 
        ...missionData, 
        ownerId: user.id,
        imageUrl: imageUrl || undefined,
        rewardText: rewardText || undefined,
        rewardEscrowContent: rewardEscrowContent || undefined,
        rewardMediaUrl: rewardMediaUrl || undefined,
        organizationId: organizationId || undefined,
        baseXp: baseXp !== undefined ? baseXp : 500, // Défaut 500
        bonusXp: bonusXp !== undefined ? bonusXp : 0, // Défaut 0
        status: status as any,
      } as any
    });
    
    // Créer notifications pour les followers du club si la mission est associée à un club
    if (organizationId) {
      await notifyOrganizationFollowers(organizationId, m.id, m.title);
    }
    
    return NextResponse.json({ mission: m }, { status: 201 });
  } catch (e: any) {
    console.error('Error in POST /api/missions:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


