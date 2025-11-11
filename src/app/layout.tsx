import './globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserNav } from '@/components/user-nav';
import { BottomNav } from '@/components/bottom-nav';
import { Container } from '@/components/ui/container';
import { PageTransitionWrapper } from '@/components/page-transition-wrapper';
import { LevelBadgeHeaderWrapper } from '@/components/level-badge-header-wrapper';
import { AdminNavWrapper } from '@/components/admin-nav-wrapper';

export const metadata = {
  title: '1000 Projets',
  description: 'Missions PRO & SOLIDAIRE',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '1000 Projets'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased bg-gradient-to-b from-indigo-100 to-zinc-100">
        <header className="border-b-2 border-border/50 relative z-10 bg-gradient-to-r from-card via-card to-card/95 backdrop-blur-sm shadow-xl shadow-black/10 ring-2 ring-black/5 sticky top-0 overflow-visible">
          <div className="container flex items-center justify-between py-2 sm:py-3 gap-3 sm:gap-4 md:gap-6 max-w-full overflow-visible">
            {/* Logo à gauche */}
            <div className="flex items-center justify-start flex-shrink-0">
              <Link href="/missions" className="flex items-center transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.97] rounded-lg p-1.5 sm:p-2 md:p-2.5 hover:bg-primary/10 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 whitespace-nowrap ring-2 ring-primary/10 hover:ring-primary/20">
                <Image
                  src="/Logo/logo.png"
                  alt="1000 Projets"
                  width={150}
                  height={50}
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain drop-shadow-lg max-w-[120px] sm:max-w-[150px]"
                  priority
                />
              </Link>
            </div>
            
            {/* Centre : Widget de niveau + Navigation principale */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-1 justify-center min-w-0 overflow-x-auto">
              {/* Widget de niveau */}
              <div className="flex-shrink-0">
                <LevelBadgeHeaderWrapper />
              </div>
              
              {/* Navigation principale (Admin) */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <AdminNavWrapper />
              </div>
            </div>
            
            {/* Droite : Notifications, Multi-compte, Avatar */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0 overflow-x-auto max-w-full">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="py-3 sm:py-4 md:py-6 overflow-x-hidden overflow-y-visible max-w-full pb-20 sm:pb-24">
          <Container>
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
          </Container>
        </main>
        <BottomNav />
      </body>
    </html>
  );
}


