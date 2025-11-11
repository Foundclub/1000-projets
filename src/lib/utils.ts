import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convertit une chaîne en slug (ex: "Mon Club" -> "mon-club")
 * Gère les accents, caractères spéciaux, et normalise les espaces
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplace tout ce qui n'est pas alphanumérique par un tiret
    .replace(/^-+|-+$/g, '') // Supprime les tirets en début et fin
    .substring(0, 100); // Limite à 100 caractères
}

