import { Metadata } from 'next';
import { FeedPostPageContent } from './feed-post-content';

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const { postId } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/feed/${postId}`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      return {
        title: 'Post - À la une',
        description: 'Découvrez cette mission accomplie',
      };
    }
    
    const post = await res.json();
    const title = post.mission?.title || 'Mission accomplie';
    const description = post.text || post.mission?.description || 'Découvrez cette mission accomplie';
    const image = post.mediaUrls?.[0] || post.mission?.imageUrl || undefined;
    
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
    return {
      title: 'Post - À la une',
      description: 'Découvrez cette mission accomplie',
    };
  }
}

export default function FeedPostPage({ params }: { params: Promise<{ postId: string }> }) {
  return <FeedPostPageContent params={params} />;
}

