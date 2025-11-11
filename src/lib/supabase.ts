import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

export const supabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) throw new Error('Supabase env missing');
  return createClient(url, anonKey, { auth: { persistSession: false } });
};

export const supabaseBrowser = () => {
  // Client-side only - use @supabase/ssr for cookie management
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) throw new Error('Supabase env missing');
  
  // createBrowserClient handles cookies automatically
  return createBrowserClient(url, anonKey);
};

export async function getSignedUrl(path: string, expiresIn: number = 300, bucket: string = 'proofs') {
  const supabase = supabaseServer();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data?.signedUrl || null;
}

/**
 * Convertit un chemin de fichier Supabase Storage en URL publique
 * Si c'est déjà une URL, la retourne telle quelle
 */
export function getPublicUrl(path: string | null | undefined, bucket: string = 'missions'): string | null {
  if (!path) return null;
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Sinon, construire l'URL publique Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  
  // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}


