"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TutorialSlide } from './tutorial-slide';
import { 
  Sparkles, 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  User, 
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { shouldShowTutorial, markTutorialShown, markTutorialCompleted } from '@/lib/tutorial';

interface WelcomeTutorialProps {
  open?: boolean;
  onClose?: () => void;
}

interface Slide {
  id: number;
  title: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  image?: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "Bienvenue sur 1000 Projets",
    description: (
      <>
        La plateforme qui connecte les <strong>missionnaires</strong> aux <strong>annonceurs</strong> pour accomplir des missions PRO et SOLIDAIRE.
        <br /><br />
        Gagnez de l'expérience, développez vos compétences et contribuez à des projets qui ont du sens !
      </>
    ),
    icon: <Sparkles className="w-full h-full" />,
  },
  {
    id: 2,
    title: "Deux Espaces, Deux Objectifs",
    description: (
      <>
        <div className="space-y-3 sm:space-y-4 text-left">
          <div className="bg-primary/10 p-3 sm:p-4 rounded-lg border-2 border-primary/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-primary">PRO</span>
              <span className="text-xs sm:text-sm font-semibold">Espace Professionnel</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              Missions rémunérées ou avec récompenses professionnelles. Développez vos compétences métier, 
              travaillez avec des entreprises et construisez votre réseau professionnel.
            </p>
          </div>
          <div className="bg-orange-500/10 p-3 sm:p-4 rounded-lg border-2 border-orange-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-orange-500">SOLIDAIRE</span>
              <span className="text-xs sm:text-sm font-semibold">Espace Bénévolat</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              Missions d'engagement citoyen et d'impact social. Contribuez à des causes qui vous tiennent à cœur, 
              aidez des associations et créez un impact positif dans votre communauté.
            </p>
          </div>
        </div>
      </>
    ),
    icon: <Briefcase className="w-full h-full" />,
  },
  {
    id: 3,
    title: "Explorez les Missions",
    description: (
      <>
        Naviguez entre les missions <strong className="text-primary">PRO</strong> et <strong className="text-orange-500">SOLIDAIRE</strong> selon vos intérêts.
        <br /><br />
        Chaque mission vous permet de gagner de l'<strong>XP</strong> spécifique à son espace, tout en progressant aussi sur votre barre <strong>Global</strong>.
        <br /><br />
        Postulez, accomplissez et partagez vos réussites !
      </>
    ),
    icon: <Briefcase className="w-full h-full" />,
  },
  {
    id: 4,
    title: "Le Feed Social",
    description: (
      <>
        Partagez vos accomplissements dans le feed <strong>"À la une"</strong>.
        <br /><br />
        Likez, commentez et partagez les publications des autres missionnaires pour créer une communauté active !
      </>
    ),
    icon: <Heart className="w-full h-full" />,
  },
  {
    id: 5,
    title: "Système XP & Niveaux",
    description: (
      <>
        <div className="space-y-2.5 sm:space-y-3 text-left">
          <p className="text-center text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Trois barres de progression indépendantes :</p>
          <div className="bg-muted/50 p-2.5 sm:p-3 rounded-lg">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary flex-shrink-0"></div>
              <strong className="text-xs sm:text-sm">XP Global</strong>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-4 sm:ml-5 leading-relaxed">
              Gagnée sur toutes les missions (PRO + SOLIDAIRE) et en suivant des clubs
            </p>
          </div>
          <div className="bg-primary/10 p-2.5 sm:p-3 rounded-lg border border-primary/20">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary flex-shrink-0"></div>
              <strong className="text-xs sm:text-sm text-primary">XP PRO</strong>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-4 sm:ml-5 leading-relaxed">
              Gagnée uniquement en accomplissant des missions professionnelles
            </p>
          </div>
          <div className="bg-orange-500/10 p-2.5 sm:p-3 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500 flex-shrink-0"></div>
              <strong className="text-xs sm:text-sm text-orange-500">XP SOLIDAIRE</strong>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-4 sm:ml-5 leading-relaxed">
              Gagnée uniquement en accomplissant des missions solidaires
            </p>
          </div>
          <p className="text-center text-xs sm:text-sm mt-2 sm:mt-3">
            Débloquez des niveaux et des badges en progressant sur chaque barre !
          </p>
        </div>
      </>
    ),
    icon: <TrendingUp className="w-full h-full" />,
  },
  {
    id: 6,
    title: "Messages & Communication",
    description: (
      <>
        Communiquez directement avec les annonceurs après l'acceptation de votre candidature.
        <br /><br />
        Un fil de discussion est créé automatiquement pour faciliter vos échanges !
      </>
    ),
    icon: <MessageSquare className="w-full h-full" />,
  },
  {
    id: 7,
    title: "Profils & Réseau",
    description: (
      <>
        Consultez les profils des <strong>missionnaires</strong> et des <strong>annonceurs</strong>.
        <br /><br />
        Suivez les utilisateurs qui vous intéressent et découvrez leurs accomplissements dans les deux espaces !
      </>
    ),
    icon: <User className="w-full h-full" />,
  },
  {
    id: 8,
    title: "Suivez vos Candidatures",
    description: (
      <>
        Gérez toutes vos candidatures depuis l'onglet <strong>"Candidatures"</strong>.
        <br /><br />
        Consultez le statut de vos soumissions PRO et SOLIDAIRE et suivez l'avancement de vos missions !
      </>
    ),
    icon: <FileText className="w-full h-full" />,
  },
  {
    id: 9,
    title: "Prêt à commencer ?",
    description: (
      <>
        Vous avez maintenant une vue d'ensemble de <strong>1000 Projets</strong>.
        <br /><br />
        Choisissez votre voie : développez vos compétences en <strong className="text-primary">PRO</strong> ou 
        créez un impact avec le <strong className="text-orange-500">SOLIDAIRE</strong> !
        <br /><br />
        Créez votre compte et commencez à explorer les missions disponibles !
      </>
    ),
    icon: <Home className="w-full h-full" />,
  },
];

export function WelcomeTutorial({ open: controlledOpen, onClose }: WelcomeTutorialProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [internalOpen, setInternalOpen] = useState(false);

  // Gérer l'ouverture automatique pour les non-connectés
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setInternalOpen(controlledOpen);
    } else {
      // Vérifier si on doit afficher le tutoriel automatiquement
      if (shouldShowTutorial()) {
        setInternalOpen(true);
        markTutorialShown();
      }
    }
  }, [controlledOpen]);

  const handleClose = () => {
    setInternalOpen(false);
    markTutorialShown();
    onClose?.();
  };

  const handleComplete = () => {
    markTutorialCompleted();
    handleClose();
    router.push('/signup');
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  return (
    <Dialog open={internalOpen} onOpenChange={setInternalOpen}>
      <DialogContent className="!fixed !inset-0 sm:!inset-auto sm:!left-[50%] sm:!top-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] !translate-x-0 !translate-y-0 w-full max-w-full sm:max-w-2xl h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] m-0 sm:m-4 rounded-none sm:rounded-lg overflow-hidden p-0 flex flex-col">
        <DialogTitle className="sr-only">
          Tutoriel de bienvenue - {slide.title}
        </DialogTitle>
        {/* Header avec indicateur de progression */}
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-3 sm:p-4 md:p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              {currentSlide + 1} / {SLIDES.length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Contenu du slide */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          <TutorialSlide
            key={slide.id}
            title={slide.title}
            description={slide.description}
            icon={slide.icon}
            image={slide.image}
          />
        </div>

        {/* Footer avec navigation */}
        <div className="border-t p-3 sm:p-4 md:p-6 bg-card flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {/* Indicateurs de slides - en haut sur mobile */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 order-2 sm:order-1">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all",
                    index === currentSlide
                      ? "bg-primary w-6 sm:w-8"
                      : "bg-muted hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Aller au slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Boutons de navigation */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSlide === 0}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-initial"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Précédent</span>
                <span className="sm:hidden">Préc.</span>
              </Button>

              {isLastSlide ? (
                <Button
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">Commencer maintenant</span>
                  <span className="sm:hidden">Commencer</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-initial"
                >
                  Suivant
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Bouton Passer */}
          {!isLastSlide && (
            <div className="mt-3 sm:mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-xs sm:text-sm text-muted-foreground h-8 sm:h-9"
              >
                Passer le tutoriel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

