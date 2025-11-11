import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { xpForAcceptance, xpForFollowedClubMission } from '@/lib/xp';
import { createNotification } from '@/lib/notifications';
import { calculateEffectivePrivacy, shouldCreateFeedPost, shouldPublishImmediately, shouldCreateAsDraft } from '@/lib/feed-privacy';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const { id } = await params;
  const user = await getCurrentUser(req, res);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Gérer FormData pour l'upload de média de récompense
  let rewardMediaUrl: string | null = null;
  const contentType = req.headers.get('content-type');
  if (contentType?.includes('multipart/form-data')) {
    try {
      const formData = await req.formData();
      const mediaFile = formData.get('rewardMedia') as File | null;
      
      if (mediaFile && mediaFile.size > 0) {
        // Validation du fichier
        const maxSize = 10 * 1024 * 1024; // 10 MB
        if (mediaFile.size > maxSize) {
          return NextResponse.json({ error: 'Le fichier est trop volumineux (max 10Mo)' }, { status: 400 });
        }
        
        const ext = mediaFile.name.split('.').pop()?.toLowerCase() || 'bin';
        if (!['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
          return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez PNG, JPG, JPEG, GIF ou WEBP' }, { status: 400 });
        }
        
        // Upload vers Supabase Storage
        const supabase = supabaseServer();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const objectPath = `rewards/${user.id}/${id}/${filename}`;
        
        const fileBuffer = await mediaFile.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('proofs') // Réutiliser le bucket proofs pour les récompenses
          .upload(objectPath, fileBuffer, { 
            upsert: true, 
            contentType: mediaFile.type,
            cacheControl: '3600' 
          });
        
        if (uploadError) {
          console.error('Error uploading reward media:', uploadError);
          return NextResponse.json({ error: 'Erreur lors de l\'upload du média' }, { status: 500 });
        }
        
        rewardMediaUrl = objectPath;
      }
    } catch (e) {
      console.error('Error processing FormData:', e);
      // Continue sans média si erreur
    }
  }
  const sub = await prisma.submission.findUnique({ 
    where: { id }, 
    include: { 
      mission: true,
      user: {
        select: {
          id: true,
          feedPrivacyDefault: true,
        },
      },
    } 
  });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (sub.mission.ownerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (sub.status !== 'PENDING') return NextResponse.json({ error: 'Déjà tranchée' }, { status: 400 });
  const now = new Date();
  
  // Calculer la privacy effective pour le feed
  const userDefault = sub.user.feedPrivacyDefault || 'AUTO';
  const override = (sub as any).feedPrivacyOverride || 'INHERIT';
  const effectivePrivacy = calculateEffectivePrivacy(userDefault, override);
  
  // Récupérer baseXp et bonusXp de la mission (défaut: 500 et 0)
  const baseXp = (sub.mission as any).baseXp ?? 500;
  const bonusXp = (sub.mission as any).bonusXp ?? 0;
  const totalXp = baseXp + bonusXp;
  
  // Calculer l'XP à attribuer (sans décroissance)
  const xp = xpForAcceptance(baseXp, bonusXp, sub.mission.space);
  
  // Vérifier si la mission provient d'un club suivi par l'utilisateur
  let bonusClubXp = { global: 0, pro: 0, solid: 0 };
  if ((sub.mission as any).organizationId) {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: sub.userId,
        targetType: 'ORGANIZATION',
        organizationId: (sub.mission as any).organizationId,
      },
    });
    
    if (follow) {
      // Bonus +10 XP si la mission provient d'un club suivi
      bonusClubXp = xpForFollowedClubMission();
    }
  }
  
  // Calculer l'XP final pour la notification
  const finalXp = {
    global: xp.global + bonusClubXp.global,
    pro: xp.pro + bonusClubXp.pro,
    solid: xp.solid + bonusClubXp.solid,
  };
  
  const updated = await prisma.$transaction(async (tx) => {
    const updateData: any = { status: 'ACCEPTED', decisionAt: now };
    if (rewardMediaUrl) {
      updateData.rewardMediaUrl = rewardMediaUrl;
    }
    const updSub = await tx.submission.update({ where: { id: sub.id }, data: updateData });
    
    // Grant XP (base + bonus mission + bonus club si suivi)
    await tx.user.update({
      where: { id: sub.userId },
      data: {
        xp: { increment: finalXp.global },
        xpPro: { increment: finalXp.pro },
        xpSolid: { increment: finalXp.solid },
        lastAcceptedAt: now,
      },
    });
    
    // Créer un XpEvent pour l'XP général
    await (tx as any).xpEvent.create({
      data: {
        userId: sub.userId,
        missionId: sub.mission.id,
        kind: 'MISSION_ACCEPTED',
        delta: finalXp.global,
        space: null, // Général
        description: `Mission acceptée: ${sub.mission.title}`,
      },
    });
    
    // Créer un XpEvent pour l'XP de l'espace (Pro ou Solidaire)
    if (sub.mission.space === 'PRO' && finalXp.pro > 0) {
      await (tx as any).xpEvent.create({
        data: {
          userId: sub.userId,
          missionId: sub.mission.id,
          kind: 'MISSION_ACCEPTED',
          delta: finalXp.pro,
          space: 'PRO',
          description: `Mission acceptée: ${sub.mission.title}`,
        },
      });
    } else if (sub.mission.space === 'SOLIDAIRE' && finalXp.solid > 0) {
      await (tx as any).xpEvent.create({
        data: {
          userId: sub.userId,
          missionId: sub.mission.id,
          kind: 'MISSION_ACCEPTED',
          delta: finalXp.solid,
          space: 'SOLIDAIRE',
          description: `Mission acceptée: ${sub.mission.title}`,
        },
      });
    }
    
    // Créer un XpEvent pour le bonus club si applicable
    if (bonusClubXp.global > 0) {
      await (tx as any).xpEvent.create({
        data: {
          userId: sub.userId,
          missionId: sub.mission.id,
          kind: 'BONUS_CLUB_FOLLOWED',
          delta: bonusClubXp.global,
          space: null, // Général
          description: `Bonus club suivi: ${sub.mission.title}`,
        },
      });
    }
    
    await tx.thread.upsert({ where: { submissionId: sub.id }, update: {}, create: { submissionId: sub.id, aId: sub.mission.ownerId, bId: sub.userId } });
    
    // Libérer la récompense en séquestre si elle existe
    const rewardEscrowContent = (sub.mission as any).rewardEscrowContent;
    const missionRewardMediaUrl = (sub.mission as any).rewardMediaUrl;
    // Utiliser le média de la mission si disponible, sinon utiliser le média uploadé lors de l'acceptation
    const finalRewardMediaUrl = missionRewardMediaUrl || rewardMediaUrl;
    
    if (rewardEscrowContent || finalRewardMediaUrl) {
      const thread = await tx.thread.findUnique({
        where: { submissionId: sub.id },
        select: { id: true },
      });
      
      if (thread) {
        let content = 'Félicitations ! Votre récompense a été débloquée';
        if (rewardEscrowContent) {
          content += ` :\n\n${rewardEscrowContent}`;
        }
        if (finalRewardMediaUrl) {
          // Inclure l'URL du média dans le contenu du message (format: REWARD_MEDIA_URL:{url})
          content += `\n\nREWARD_MEDIA_URL:${finalRewardMediaUrl}`;
        }
        
        await tx.message.create({
          data: {
            threadId: thread.id,
            authorId: sub.mission.ownerId, // L'annonceur est l'auteur du message
            type: 'REWARD',
            content,
          },
        });
      }
    }
    
    // Stocker le média de récompense dans la submission si présent
    if (finalRewardMediaUrl && !rewardMediaUrl) {
      // Si on utilise le média de la mission, le stocker dans la submission aussi
      await tx.submission.update({
        where: { id: sub.id },
        data: {
          rewardMediaUrl: finalRewardMediaUrl,
        },
      });
    }
    
    // Incrémenter slotsTaken
    const newSlotsTaken = sub.mission.slotsTaken + 1;
    const missionUpdate: any = { slotsTaken: newSlotsTaken };
    
    // Si slotsTaken === slotsMax, fermer la mission automatiquement
    if (newSlotsTaken >= sub.mission.slotsMax) {
      missionUpdate.status = 'CLOSED';
    }
    
    await tx.mission.update({ where: { id: sub.mission.id }, data: missionUpdate });
    
    // Créer FeedPost si nécessaire selon la privacy effective
    if (shouldCreateFeedPost(effectivePrivacy)) {
      const editableUntil = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes
      const published = shouldPublishImmediately(effectivePrivacy);
      
      await (tx as any).feedPost.create({
        data: {
          missionId: sub.mission.id,
          submissionId: sub.id,
          authorId: sub.userId,
          space: sub.mission.space,
          text: null, // L'utilisateur pourra ajouter du texte plus tard
          mediaUrls: [], // Pas de médias par défaut
          published: published,
          editableUntil: editableUntil,
        },
      });
    }
    
    return updSub;
  });

  // Créer une notification pour le missionnaire
  try {
    await createNotification(sub.userId, 'SUBMISSION_ACCEPTED', {
      missionId: sub.mission.id,
      missionTitle: sub.mission.title,
      submissionId: updated.id,
      xpGained: finalXp.global,
    });
    
    // Si ASK mode, créer une notification pour inviter à publier le post
    if (shouldCreateAsDraft(effectivePrivacy)) {
      const feedPost = await prisma.feedPost.findUnique({
        where: { submissionId: updated.id },
        select: { id: true },
      });
      
      if (feedPost) {
        await createNotification(sub.userId, 'FEED_POST_DRAFT_READY', {
          postId: feedPost.id,
          missionId: sub.mission.id,
          missionTitle: sub.mission.title,
        });
      }
    }
  } catch (notifError) {
    console.error('Error creating notification for submission acceptance:', notifError);
  }

  return NextResponse.json({ submission: updated });
}


