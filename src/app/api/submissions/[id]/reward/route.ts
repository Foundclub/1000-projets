import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { supabaseServer } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':reward', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    
    // Gérer FormData pour l'upload de média
    let rewardNote: string | undefined;
    let rewardMediaUrl: string | null = null;
    
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      rewardNote = formData.get('rewardNote')?.toString();
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
    } else {
      const body = await req.json().catch(() => ({}));
      rewardNote = body.rewardNote;
    }

    // Récupérer la submission avec la mission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        mission: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire de la mission ou un admin
    if (submission.mission.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Vérifier que la submission est acceptée
    if (submission.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Submission must be accepted' }, { status: 400 });
    }

    // Marquer la récompense comme remise
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        rewardDeliveredAt: new Date(),
        rewardNote: rewardNote || null,
        rewardMediaUrl: rewardMediaUrl || null,
      },
    });

    return NextResponse.json({ submission: updated });
  } catch (e: any) {
    console.error('Error in POST /api/submissions/[id]/reward:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


