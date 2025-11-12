"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WelcomeTutorial } from '@/components/tutorial/welcome-tutorial';
import { Briefcase, Sparkles, TrendingUp, Users, MessageSquare, Heart } from 'lucide-react';
import Image from 'next/image';

export function HomePageContent() {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 bg-gradient-to-b from-indigo-100 via-indigo-50 to-zinc-100">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative w-48 h-16 sm:w-64 sm:h-20">
                <Image
                  src="/Logo/logo.png"
                  alt="1000 Projets"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Titre principal */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Missions <span className="text-primary">PRO</span> & <span className="text-orange-500">SOLIDAIRE</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
              La plateforme qui connecte les <strong>missionnaires</strong> aux <strong>annonceurs</strong> pour accomplir des missions qui ont du sens.
            </p>
            
            {/* PRO vs SOLIDAIRE */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-3xl mx-auto mb-8">
              <div className="flex-1 bg-primary/10 border-2 border-primary/30 rounded-lg p-4 sm:p-5 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">PRO</div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Missions professionnelles rémunérées. Développez vos compétences et votre réseau.
                </p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">&</div>
              <div className="flex-1 bg-orange-500/10 border-2 border-orange-500/30 rounded-lg p-4 sm:p-5 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-2">SOLIDAIRE</div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Missions d'engagement citoyen. Créez un impact positif dans votre communauté.
                </p>
              </div>
            </div>
            
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Gagnez de l'expérience, développez vos compétences et contribuez à des projets impactants !
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => setShowTutorial(true)}
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Découvrir l'application
              </Button>
              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="flex-1 sm:flex-initial text-lg px-6 py-6"
                >
                  <Link href="/login">Se connecter</Link>
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  asChild
                  className="flex-1 sm:flex-initial text-lg px-6 py-6"
                >
                  <Link href="/signup">S'inscrire</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-card py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Fonctionnalités principales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Feature 1 - PRO */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  <span className="text-primary">Missions PRO</span>
                </h3>
                <p className="text-muted-foreground text-sm">
                  Missions rémunérées ou avec récompenses professionnelles. Développez vos compétences métier, 
                  travaillez avec des entreprises et construisez votre réseau professionnel.
                </p>
              </div>

              {/* Feature 1b - SOLIDAIRE */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-2 border-orange-500/30">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  <span className="text-orange-500">Missions SOLIDAIRE</span>
                </h3>
                <p className="text-muted-foreground text-sm">
                  Missions d'engagement citoyen et d'impact social. Contribuez à des causes qui vous tiennent à cœur, 
                  aidez des associations et créez un impact positif dans votre communauté.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Feed Social</h3>
                <p className="text-muted-foreground">
                  Partagez vos accomplissements, likez et commentez les publications dans le feed "À la une".
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Système XP & Niveaux</h3>
                <p className="text-muted-foreground">
                  Gagnez de l'XP en accomplissant des missions et progressez sur 3 barres : Global, PRO et SOLIDAIRE.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Messages</h3>
                <p className="text-muted-foreground">
                  Communiquez directement avec les annonceurs après l'acceptation de votre candidature.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Profils & Réseau</h3>
                <p className="text-muted-foreground">
                  Consultez les profils des missionnaires et annonceurs, suivez les utilisateurs qui vous intéressent.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Suivi des Candidatures</h3>
                <p className="text-muted-foreground">
                  Gérez toutes vos candidatures et suivez l'avancement de vos missions depuis un seul endroit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez la communauté 1000 Projets et commencez à accomplir des missions dès aujourd'hui !
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setShowTutorial(true)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Découvrir le tutoriel
              </Button>
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/signup">Créer un compte</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tutoriel Modal */}
      <WelcomeTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}

