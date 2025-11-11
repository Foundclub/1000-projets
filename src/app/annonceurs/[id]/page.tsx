import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { AnnonceurProfile } from '@/components/annonceur-profile';
import { NextRequest } from 'next/server';

export default async function AnnonceurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Get annonceur with missions and stats
    const annonceur = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isCertifiedAnnonceur: true,
        ratingAvg: true,
        ratingCount: true,
        bio: true,
        activities: true,
        website: true,
        companyName: true,
        createdAt: true,
        missions: {
          where: {
            status: 'OPEN',
            isHidden: false,
          },
          select: {
            id: true,
            title: true,
            space: true,
            description: true,
            slotsTaken: true,
            slotsMax: true,
            imageUrl: true,
            rewardText: true,
            createdAt: true,
            organization: {
              select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                isCertified: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!annonceur) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12 text-muted-foreground">
            Annonceur non trouvé
          </div>
        </div>
      );
    }

    if (annonceur.role !== 'ANNONCEUR') {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12 text-muted-foreground">
            Cet utilisateur n'est pas un annonceur
          </div>
        </div>
      );
    }

    // Check if current user has favorited this annonceur and if it's the owner
    let isFavorited = false;
    let isOwner = false;
    try {
      // Create a mock request for getCurrentUser
      const mockReq = new NextRequest('http://localhost:3000');
      const mockRes = { next: () => ({}) } as any;
      const currentUser = await getCurrentUser(mockReq, mockRes);
      if (currentUser) {
        isOwner = currentUser.id === id;
        if (!isOwner) {
          const favorite = await prisma.favoriteAnnonceur.findFirst({
            where: {
              userId: currentUser.id,
              annonceurId: id,
            },
          });
          isFavorited = !!favorite;
        }
      }
    } catch {
      // User not authenticated, isFavorited stays false
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <AnnonceurProfile annonceur={{ ...annonceur, isFavorited, isOwner }} />
      </div>
    );
  } catch (e) {
    console.error('Error loading annonceur:', e);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Erreur lors du chargement du profil
        </div>
      </div>
    );
  }
}

