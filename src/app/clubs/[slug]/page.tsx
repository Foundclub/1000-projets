import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ClubDetail } from '@/components/club-detail';

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const club = await prisma.organization.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          isCertifiedAnnonceur: true,
          ratingAvg: true,
          ratingCount: true,
        },
      },
      missions: {
        where: {
          status: 'OPEN',
          isHidden: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { featuredRank: 'asc' },
          { createdAt: 'desc' },
        ],
        take: 20,
      },
      _count: {
        select: {
          followers: true,
          missions: true,
        },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Check if user is following this club
  let isFollowing = false;
  if (user) {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: user.id,
        targetType: 'ORGANIZATION',
        organizationId: club.id,
      },
    });
    isFollowing = !!follow;
  }

  return (
    <ClubDetail
      club={{
        id: club.id,
        slug: club.slug,
        name: club.name,
        logoUrl: club.logoUrl,
        coverUrl: club.coverUrl,
        bio: club.bio,
        website: club.website,
        isCertified: club.isCertified,
        ratingAvg: club.ratingAvg,
        ratingCount: club.ratingCount,
        owner: club.owner,
        missions: club.missions.map(m => ({
          id: m.id,
          title: m.title,
          space: m.space,
          description: m.description,
          criteria: m.criteria,
          slotsTaken: m.slotsTaken,
          slotsMax: m.slotsMax,
          imageUrl: m.imageUrl,
          rewardText: m.rewardText,
          isFeatured: m.isFeatured,
          createdAt: m.createdAt,
          owner: m.owner,
          submissionsCount: m._count.submissions,
        })),
        followersCount: club._count.followers,
        missionsCount: club._count.missions,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      }}
      isFollowing={isFollowing}
      isAuthenticated={!!user}
    />
  );
}


