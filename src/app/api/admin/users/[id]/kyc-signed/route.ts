import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';
import { getSignedUrl } from '@/lib/supabase';

/**
 * GET /api/admin/users/[id]/kyc-signed
 * Retourne URLs signées (5 min) pour justificatifUrl
 * RBAC: ADMIN only
 * Rate limit: 30/min
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-kyc-signed`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id: userId } = await params;
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        justificatifUrl: true,
      },
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!targetUser.justificatifUrl) {
      return NextResponse.json({ error: 'No KYC document found' }, { status: 404 });
    }
    
    // Extraire le chemin du bucket depuis l'URL
    // Format attendu: justificatifs/{userId}/{filename}
    // ou URL complète Supabase Storage
    let path = targetUser.justificatifUrl;
    
    // Si c'est une URL complète, extraire le chemin
    const urlMatch = path.match(/justificatifs\/(.+)/);
    if (urlMatch) {
      path = `justificatifs/${urlMatch[1]}`;
    } else if (!path.startsWith('justificatifs/')) {
      // Si ce n'est pas un chemin relatif, essayer de l'extraire de l'URL
      const supabaseUrlMatch = path.match(/\/storage\/v1\/object\/justificatifs\/(.+)/);
      if (supabaseUrlMatch) {
        path = `justificatifs/${supabaseUrlMatch[1]}`;
      }
    }
    
    // Générer URL signée (5 minutes) depuis le bucket justificatifs
    const signedUrl = await getSignedUrl(path, 300, 'justificatifs');
    
    if (!signedUrl) {
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }
    
    return NextResponse.json({ signedUrl });
  } catch (e: any) {
    console.error('[Admin KYC Signed] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


