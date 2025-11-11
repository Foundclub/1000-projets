import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ratingCreateSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { canRateSubmission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const missionId = searchParams.get('missionId');
    const userId = searchParams.get('userId');
    
    if (!missionId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    
    const rating = await prisma.rating.findUnique({
      where: {
        raterId_missionId: {
          raterId: userId,
          missionId,
        },
      },
    });
    
    return NextResponse.json({ rating });
  } catch (e) {
    console.error('Error fetching rating:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':rating', 5, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const body = await req.json();
    const parsed = ratingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    
    // Vérifier que la submission existe et appartient à ce user, status=ACCEPTED
    const submission = await prisma.submission.findUnique({
      where: { id: parsed.data.submissionId },
      include: { mission: true },
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    if (!canRateSubmission(submission, user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Vérifier que missionId correspond à la submission
    if (submission.missionId !== parsed.data.missionId) {
      return NextResponse.json({ error: 'Mission mismatch' }, { status: 400 });
    }
    
    // Vérifier que annonceurId = mission.ownerId
    const annonceurId = submission.mission.ownerId;
    
    // Interdit si raterId === annonceurId
    if (user.id === annonceurId) {
      return NextResponse.json({ error: 'Cannot rate yourself' }, { status: 400 });
    }
    
    // Transaction : récupérer existingRating et annonceur, puis upsert rating + update annonceur
    let isUpdate = false;
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier si rating existe déjà (dans la transaction)
      const existingRating = await tx.rating.findUnique({
        where: {
          raterId_missionId: {
            raterId: user.id,
            missionId: parsed.data.missionId,
          },
        },
      });
      
      // Récupérer l'annonceur pour calculer les agrégats (dans la transaction)
      const annonceur = await tx.user.findUnique({
        where: { id: annonceurId },
        select: { ratingAvg: true, ratingCount: true },
      });
      
      if (!annonceur) {
        throw new Error('Annonceur not found');
      }
      
      // Calculer les nouveaux agrégats
      let newAvg: number;
      let newCount: number;
      const oldScore = existingRating?.score || 0;
      
      if (existingRating) {
        // Update : newAvg = (oldAvg*count - oldScore + newScore) / count
        isUpdate = true;
        newAvg = (annonceur.ratingAvg * annonceur.ratingCount - oldScore + parsed.data.score) / annonceur.ratingCount;
        newCount = annonceur.ratingCount;
      } else {
        // Création : newAvg = (oldAvg*count + score) / (count+1), count+1
        newAvg = (annonceur.ratingAvg * annonceur.ratingCount + parsed.data.score) / (annonceur.ratingCount + 1);
        newCount = annonceur.ratingCount + 1;
      }
      
      // Upsert rating
      const rating = await tx.rating.upsert({
        where: {
          raterId_missionId: {
            raterId: user.id,
            missionId: parsed.data.missionId,
          },
        },
        update: {
          score: parsed.data.score,
          comment: parsed.data.comment,
          submissionId: parsed.data.submissionId,
        },
        create: {
          annonceurId,
          raterId: user.id,
          missionId: parsed.data.missionId,
          submissionId: parsed.data.submissionId,
          score: parsed.data.score,
          comment: parsed.data.comment,
        },
      });
      
      // Mettre à jour les agrégats de l'annonceur
      await tx.user.update({
        where: { id: annonceurId },
        data: {
          ratingAvg: newAvg,
          ratingCount: newCount,
        },
      });
      
      return rating;
    });
    
    return NextResponse.json({ rating: result }, { status: isUpdate ? 200 : 201 });
  } catch (e: any) {
    console.error('Error creating rating:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

