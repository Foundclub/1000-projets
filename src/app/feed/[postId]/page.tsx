import { Metadata } from 'next';
import { FeedPostPageContent } from './feed-post-content';
import { prisma } from '@/lib/db';
import { getPublicUrl } from '@/lib/supabase';

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const { postId } = await params;
  
  try {
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        mission: {
          select: {
            title: true,
            description: true,
            imageUrl: true,
          },
        },
      },
    });
    
    if (!post) {
      return {
        title: 'Post - À la une',
        description: 'Découvrez cette mission accomplie',
      };
    }
    
    const title = post.mission?.title || 'Mission accomplie';
    const description = post.text || post.mission?.description || 'Découvrez cette mission accomplie';
    
    // Construire l'URL de l'image
    let image: string | undefined;
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      image = post.mediaUrls[0];
    } else if (post.mission?.imageUrl) {
      image = getPublicUrl(post.mission.imageUrl, 'missions') || undefined;
    }
    
    return {
      title: `${title} - À la une`,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : undefined,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch (e) {
    console.error('[generateMetadata] Error:', e);
    return {
      title: 'Post - À la une',
      description: 'Découvrez cette mission accomplie',
    };
  }
}

export default function FeedPostPage({ params }: { params: Promise<{ postId: string }> }) {
  return <FeedPostPageContent params={params} />;
}

