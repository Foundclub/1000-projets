"use client";

type AnnonceurBadgeProps = {
  isCertified: boolean;
  className?: string;
};

export function AnnonceurBadge({ isCertified, className = '' }: AnnonceurBadgeProps) {
  if (!isCertified) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-pro-100 text-pro-700 ${className}`}>
      <span>✓</span>
      <span>Certifié</span>
    </span>
  );
}

