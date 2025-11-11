import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateMediaForSpace } from '@/lib/media-validation';
import { z } from 'zod';

const feedPostCreateSchema = z.object({
  missionId: z.string(),
  submissionId: z.string(),
  text: z.string().optional(),
  mediaUrls: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(true),
});

/**
 * POST /api/feed/posts
 * Création manuelle d'un post (optionnel, pour override)
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const parsed = feedPostCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    
    // Vérifier que la submission existe et appartient à l'utilisateur
    const submission = await prisma.submission.findUnique({
      where: { id: parsed.data.submissionId },
      include: {
        mission: true,
      },
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    if (submission.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    if (submission.missionId !== parsed.data.missionId) {
      return NextResponse.json({ error: 'Mission mismatch' }, { status: 400 });
    }
    
    // Vérifier qu'un post n'existe pas déjà pour cette submission
    const existingPost = await prisma.feedPost.findUnique({
      where: { submissionId: parsed.data.submissionId },
    });
    
    if (existingPost) {
      return NextResponse.json({ error: 'Post already exists for this submission' }, { status: 400 });
    }
    
    // Valider les médias pour l'espace
    const mediaValidation = validateMediaForSpace(
      parsed.data.mediaUrls || [],
      submission.mission.space
    );
    
    if (!mediaValidation.valid) {
      return NextResponse.json({ error: mediaValidation.error }, { status: 400 });
    }
    
    // Créer le post
    const now = new Date();
    const editableUntil = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes
    
    const post = await prisma.feedPost.create({
      data: {
        missionId: parsed.data.missionId,
        submissionId: parsed.data.submissionId,
        authorId: user.id,
        space: submission.mission.space,
        text: parsed.data.text || null,
        mediaUrls: parsed.data.mediaUrls || [],
        published: parsed.data.published,
        editableUntil,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        mission: {
          select: {
            id: true,
            title: true,
            space: true,
          },
        },
      },
    });
    
    return NextResponse.json({ post }, { status: 201 });
  } catch (e: any) {
    console.error('Error in POST /api/feed/posts:', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Post already exists for this submission' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

