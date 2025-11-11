import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canCreateMission } from '@/lib/rbac';

/**
 * GET /api/missions/[id]/applications
 * Récupère toutes les candidatures pour une mission (pour l'annonceur)
 */
export async function GET(
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

    // Vérifier que la mission existe et appartient à l'utilisateur (ou que l'utilisateur est admin)
    const mission = await prisma.mission.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    if (mission.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this mission' }, { status: 403 });
    }

    // Récupérer toutes les candidatures pour cette mission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applications = await (prisma as any).missionApplication?.findMany({
      where: { missionId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        thread: {
          select: {
            id: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                authorId: true,
              },
            },
          },
        },
      },
    orderBy: { createdAt: 'desc' },
  }) || [];

  return NextResponse.json({ applications });
  } catch (e: any) {
    console.error('Error in GET /api/missions/[id]/applications:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

