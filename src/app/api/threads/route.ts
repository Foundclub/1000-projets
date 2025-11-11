import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/threads
 * Récupère tous les threads de l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer tous les threads où l'utilisateur est aId ou bId
    const threads = await prisma.thread.findMany({
      where: {
        OR: [
          { aId: user.id },
          { bId: user.id },
        ],
      },
      include: {
        submission: {
          include: {
            mission: {
              select: {
                id: true,
                title: true,
                space: true,
                imageUrl: true,
              },
            },
          },
        },
        application: {
          include: {
            mission: {
              select: {
                id: true,
                title: true,
                space: true,
                imageUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Dernier message
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrichir avec les informations de l'autre utilisateur
    const enrichedThreads = await Promise.all(
      threads.map(async (thread) => {
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
            isCertifiedAnnonceur: true,
          },
        });

        const lastMessage = thread.messages[0] || null;

        return {
          id: thread.id,
          otherUser: otherUser ? {
            id: otherUser.id,
            displayName: otherUser.displayName,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            email: otherUser.email,
            avatar: otherUser.avatar,
            isCertifiedAnnonceur: otherUser.isCertifiedAnnonceur,
          } : null,
          mission: thread.submission?.mission || thread.application?.mission || null,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            type: lastMessage.type,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt.toISOString(),
            authorId: lastMessage.authorId,
          } : null,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: (lastMessage?.createdAt || thread.createdAt).toISOString(),
        };
      })
    );

    // Trier par date de mise à jour (dernier message)
    enrichedThreads.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ threads: enrichedThreads });
  } catch (e: any) {
    console.error('Error in GET /api/threads:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

