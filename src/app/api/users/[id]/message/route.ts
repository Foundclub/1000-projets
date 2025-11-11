import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { z } from 'zod';

const messageCreateSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':message', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;

    // Vérifier que l'utilisateur ne s'envoie pas un message à lui-même
    if (user.id === id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier si un thread existe déjà
    let thread = await prisma.thread.findFirst({
      where: {
        OR: [
          { aId: user.id, bId: id },
          { aId: id, bId: user.id },
        ],
      },
    });

    // Si aucun thread n'existe, en créer un nouveau
    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          aId: user.id,
          bId: id,
          // Pas de missionId ni applicationId pour un message direct
        },
      });
    }

    // Si un message initial est fourni, le créer
    let initialMessage = null;
    const body = await req.json().catch(() => ({}));
    const parsed = messageCreateSchema.safeParse(body);

    if (parsed.success && parsed.data.content) {
      // Masquer les contacts dans le message
      const maskContacts = (text: string) => {
        return text
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email masqué]')
          .replace(/\+?\d[\d\s-]{8,}/g, '[téléphone masqué]');
      };

      const maskedContent = maskContacts(parsed.data.content);
      initialMessage = await prisma.message.create({
        data: {
          threadId: thread.id,
          authorId: user.id,
          type: 'TEXT',
          content: maskedContent,
        },
      });
    }

    return NextResponse.json({
      threadId: thread.id,
      message: initialMessage,
    });
  } catch (e: any) {
    console.error('Error in POST /api/users/[id]/message:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

