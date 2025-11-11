import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const thread = await prisma.thread.findUnique({
      where: { id },
      select: {
        id: true,
        aId: true,
        bId: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Vérifier que l'utilisateur fait partie du thread
    if (thread.aId !== user.id && thread.bId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Récupérer les informations de l'autre utilisateur
    const otherUserId = thread.aId === user.id ? thread.bId : thread.aId;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        aId: thread.aId,
        bId: thread.bId,
      },
      otherUser: otherUser ? {
        id: otherUser.id,
        displayName: otherUser.displayName,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        email: otherUser.email,
        avatar: otherUser.avatar,
      } : null,
    });
  } catch (e: any) {
    console.error('Error in GET /api/threads/[id]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

