"use client";

import { useEffect, useState } from 'react';

interface ColorBubblesProps {
  color: 'pro' | 'solidaire' | null;
}

export function ColorBubbles({ color }: ColorBubblesProps) {
  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    size: number;
    left: number;
    top: number;
    delay: number;
    duration: number;
  }>>([]);
  const [mounted, setMounted] = useState(false);

  // S'assurer que le composant est monté côté client avant de générer les bulles
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!color || !mounted) {
      setBubbles([]);
      return;
    }

    // Générer 15-20 bulles aléatoires pour couvrir tout l'écran
    // Utiliser un seed basé sur la couleur pour avoir des valeurs cohérentes
    const seed = color === 'pro' ? 12345 : 67890;
    const random = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const bubbleCount = Math.floor(random(1) * 6) + 15;
    const newBubbles = Array.from({ length: bubbleCount }, (_, i) => ({
      id: i,
      size: random(i * 2) * 300 + 200, // Entre 200px et 500px (plus grandes)
      // Distribuer les bulles sur toute la largeur, y compris les bords
      left: random(i * 3) * 120 - 10, // Position de -10% à 110% pour couvrir les bords
      top: random(i * 4) * 120 - 10, // Position de -10% à 110% pour couvrir les bords
      delay: random(i * 5) * 5, // Délai d'animation en secondes
      duration: random(i * 6) * 25 + 25, // Durée d'animation entre 25s et 50s
    }));

    setBubbles(newBubbles);
  }, [color, mounted]);

  if (!color || !mounted) return null;

  const colorClasses = {
    pro: 'bg-pro-300/50',
    solidaire: 'bg-solidaire-300/50',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-visible z-0 w-full h-full">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute rounded-full blur-3xl animate-float ${colorClasses[color]}`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            top: `${bubble.top}%`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

