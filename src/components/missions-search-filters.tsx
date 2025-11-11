"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { InfoButton } from '@/components/info-button';
import { Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function MissionsSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [certified, setCertified] = useState(searchParams.get('certified') === 'true');
  const [available, setAvailable] = useState(searchParams.get('available') === 'true');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche en temps réel avec debounce
  useEffect(() => {
    // Ignorer si la query n'a pas changé depuis l'URL
    const currentQuery = searchParams.get('query') || '';
    if (query === currentQuery) {
      return;
    }

    // Nettoyer le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si la query est vide, mettre à jour immédiatement
    if (!query.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('query');
      params.delete('page'); // Reset à la page 1
      router.push(`/missions?${params.toString()}`);
      return;
    }

    // Sinon, attendre 300ms avant de mettre à jour
    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('query', query.trim());
      params.delete('page'); // Reset à la page 1
      router.push(`/missions?${params.toString()}`);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, router, searchParams]);

  function updateFilters() {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query.trim()) {
      params.set('query', query.trim());
    } else {
      params.delete('query');
    }
    
    if (certified) {
      params.set('certified', 'true');
    } else {
      params.delete('certified');
    }
    
    if (available) {
      params.set('available', 'true');
    } else {
      params.delete('available');
    }
    
    params.delete('page'); // Reset à la page 1
    router.push(`/missions?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Annuler le debounce et mettre à jour immédiatement
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    updateFilters();
  }

  function handleCertifiedToggle(checked: boolean) {
    setCertified(checked);
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set('certified', 'true');
    } else {
      params.delete('certified');
    }
    router.push(`/missions?${params.toString()}`);
  }

  function handleAvailableToggle(checked: boolean) {
    setAvailable(checked);
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set('available', 'true');
    } else {
      params.delete('available');
    }
    router.push(`/missions?${params.toString()}`);
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 rounded-xl border-2 border-border/50 bg-gradient-to-br from-card via-card to-card/95 shadow-xl shadow-black/10 ring-2 ring-black/5 relative overflow-hidden max-w-full">
      {/* Dégradé en vagues en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-12 pointer-events-none">
        <svg viewBox="0 0 1200 50" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="searchWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,50 C300,30 600,20 900,25 C1050,23 1150,27 1200,25 L1200,50 L0,50 Z" fill="url(#searchWaveGradient)" />
        </svg>
      </div>
      <div className="space-y-3 sm:space-y-4 md:space-y-5">
        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 relative min-w-0">
            <Input
              type="text"
              placeholder="Rechercher une mission..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base border-2 border-border/60 bg-gradient-to-br from-background via-background to-muted/30 shadow-xl shadow-black/10 ring-2 ring-border/40 focus:ring-4 focus:ring-primary/40 focus:border-primary/60 focus:shadow-2xl focus:shadow-primary/30 focus:bg-background transition-all duration-300 pl-3 sm:pl-4 pr-10 sm:pr-12 hover:border-primary/30 hover:shadow-lg max-w-full"
            />
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
          </div>
          <Button 
            type="submit" 
            className="h-10 sm:h-11 md:h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base font-bold shadow-2xl shadow-primary/40 hover:shadow-3xl hover:shadow-primary/50 active:shadow-xl active:scale-[0.97] hover:scale-[1.05] transition-all duration-300 border-2 border-primary/30 bg-gradient-to-br from-primary via-primary/95 to-primary ring-4 ring-primary/30 hover:ring-primary/40 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 w-full sm:w-auto"
          >
            <span className="relative z-10">Rechercher</span>
          </Button>
        </form>
        
        {/* Séparateur */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
        
        {/* Filtres intégrés */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-200 group w-full sm:w-auto min-w-0">
            <Switch
              checked={certified}
              onCheckedChange={handleCertifiedToggle}
            />
            <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">Annonceur certifié</span>
            <InfoButton 
              content="Affiche uniquement les missions publiées par des annonceurs certifiés. Les annonceurs certifiés ont été vérifiés par notre équipe et offrent des missions de qualité."
              side="top"
              size="sm"
            />
          </div>
          
          <div className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-200 group w-full sm:w-auto min-w-0">
            <Switch
              checked={available}
              onCheckedChange={handleAvailableToggle}
            />
            <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">Slots disponibles</span>
            <InfoButton 
              content="Affiche uniquement les missions qui ont encore des places disponibles. Les missions complètes (tous les slots remplis) ne seront pas affichées."
              side="top"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

