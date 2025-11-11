import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

const applicationCreateSchema = z.object({
  message: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Seuls les missionnaires peuvent s'inscrire
    if (user.role !== 'MISSIONNAIRE' && (user.activeRole || user.role) !== 'MISSIONNAIRE') {
      return NextResponse.json({ error: 'Only missionnaires can apply to missions' }, { status: 403 });
    }

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':apply-mission', 5, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = applicationCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    // Vérifier que la mission existe et est ouverte
    const mission = await prisma.mission.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        title: true,
        status: true,
        slotsTaken: true,
        slotsMax: true,
        isHidden: true,
      },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    if (mission.status !== 'OPEN') {
      return NextResponse.json({ error: 'Mission is not open' }, { status: 400 });
    }

    if (mission.isHidden) {
      return NextResponse.json({ error: 'Mission is hidden' }, { status: 400 });
    }

    // Vérifier qu'il reste des slots disponibles
    if (mission.slotsTaken >= mission.slotsMax) {
      return NextResponse.json({ error: 'Mission is full' }, { status: 400 });
    }

    // Vérifier que l'utilisateur ne s'est pas déjà inscrit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingApplication = await (prisma as any).missionApplication?.findFirst({
      where: {
        userId: user.id,
        missionId: id,
      },
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied to this mission' }, { status: 400 });
    }

    // Créer la candidature et le thread de chat en transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Créer la candidature
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const application = await (tx as any).missionApplication.create({
          data: {
            missionId: id,
            userId: user.id,
            message: parsed.data.message || null,
            status: 'PENDING',
          },
        });

        // Créer le thread de chat entre l'annonceur et le missionnaire
        const thread = await tx.thread.create({
          data: {
            applicationId: application.id,
            aId: mission.ownerId, // Annonceur
            bId: user.id, // Missionnaire
          },
        });

        // Mettre à jour la candidature avec le thread
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx as any).missionApplication.update({
          where: { id: application.id },
          data: { thread: { connect: { id: thread.id } } },
        });

        // Créer un message initial si un message est fourni
        if (parsed.data.message) {
          await tx.message.create({
            data: {
              threadId: thread.id,
              authorId: user.id,
              type: 'TEXT',
              content: parsed.data.message,
            },
          });
        }

        return { application, thread };
      });

      // Créer une notification pour l'annonceur
      try {
        const applicantName = user.displayName || 
          (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
          user.email?.split('@')[0] || 
          'Un missionnaire';
        
        await createNotification(mission.ownerId, 'NEW_APPLICATION', {
          missionId: mission.id,
          missionTitle: mission.title,
          applicationId: result.application.id,
          applicantId: user.id,
          applicantName: applicantName,
          applicantEmail: user.email,
          message: parsed.data.message || null,
        });
      } catch (notifError) {
        // Ne pas faire échouer la candidature si la notification échoue
        console.error('Error creating notification for application:', notifError);
      }

      return NextResponse.json({ 
        application: result.application,
        threadId: result.thread.id,
      });
    } catch (createError: any) {
      if (createError.code === 'P2002') {
        // Unique constraint violation (already applied)
        return NextResponse.json({ error: 'Already applied to this mission' }, { status: 400 });
      }
      throw createError;
    }
  } catch (e: any) {
    console.error('Error in POST /api/missions/[id]/apply:', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Already applied to this mission' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

