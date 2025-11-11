import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/missions/[id]/applications/[applicationId]/accept
 * Accepte une candidature pour une mission
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, applicationId } = await params;

    // Vérifier que la mission existe et appartient à l'utilisateur (ou que l'utilisateur est admin)
    const mission = await prisma.mission.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        ownerId: true,
      },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    if (mission.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this mission' }, { status: 403 });
    }

    // Récupérer la candidature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const application = await (prisma as any).missionApplication?.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.missionId !== id) {
      return NextResponse.json({ error: 'Application does not belong to this mission' }, { status: 400 });
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application is not pending' }, { status: 400 });
    }

    // Mettre à jour le statut de la candidature
    // @ts-ignore
    const updated = await (prisma as any).missionApplication?.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    });

    // Créer une notification pour le missionnaire
    try {
      await createNotification(application.userId, 'APPLICATION_ACCEPTED', {
        missionId: mission.id,
        missionTitle: mission.title,
        applicationId: application.id,
      });
    } catch (notifError) {
      console.error('Error creating notification for application acceptance:', notifError);
    }

    return NextResponse.json({ application: updated });
  } catch (e: any) {
    console.error('Error in POST /api/missions/[id]/applications/[applicationId]/accept:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

