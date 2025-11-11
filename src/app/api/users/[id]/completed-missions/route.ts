import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const { id } = await params;

    // Récupérer les missions avec soumissions acceptées
    const submissions = await prisma.submission.findMany({
      where: {
        userId: id,
        status: 'ACCEPTED',
      },
      include: {
        mission: {
          include: {
            owner: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isCertifiedAnnonceur: true,
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
        },
      },
      orderBy: {
        decisionAt: 'desc',
      },
      take: 20,
    });

    // Formater les missions
    const missions = submissions.map((sub) => ({
      id: sub.mission.id,
      title: sub.mission.title,
      space: sub.mission.space,
      description: sub.mission.description,
      criteria: sub.mission.criteria,
      slotsTaken: sub.mission.slotsTaken,
      slotsMax: sub.mission.slotsMax,
      slaDecisionH: sub.mission.slaDecisionH,
      ownerId: sub.mission.ownerId,
      imageUrl: sub.mission.imageUrl,
      rewardText: sub.mission.rewardText,
      owner: sub.mission.owner,
      organization: sub.mission.organization,
      completedAt: sub.decisionAt,
    }));

    return NextResponse.json({ missions });
  } catch (e: any) {
    console.error('Error in GET /api/users/[id]/completed-missions:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

