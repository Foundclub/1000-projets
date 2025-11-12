"use client";
import { useState, useEffect, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isTutorialCompleted } from '@/lib/tutorial';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextualTooltipProps {
  id: string;
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
  className?: string;
}

const DISMISSED_TOOLTIPS_KEY = 'tutorial_tooltips_dismissed';

function getDismissedTooltips(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DISMISSED_TOOLTIPS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function markTooltipDismissed(id: string): void {
  if (typeof window === 'undefined') return;
  const dismissed = getDismissedTooltips();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_TOOLTIPS_KEY, JSON.stringify(dismissed));
  }
}

export function ContextualTooltip({
  id,
  content,
  children,
  side = 'top',
  delayDuration = 500,
  className,
}: ContextualTooltipProps) {
  const [open, setOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Vérifier si le tutoriel a été complété et si ce tooltip n'a pas été dismissé
    const tutorialCompleted = isTutorialCompleted();
    const dismissed = getDismissedTooltips();
    const notDismissed = !dismissed.includes(id);

    if (tutorialCompleted && notDismissed) {
      // Afficher le tooltip après un court délai
      const timer = setTimeout(() => {
        setShouldShow(true);
        setOpen(true);
      }, delayDuration);

      return () => clearTimeout(timer);
    }
  }, [id, delayDuration]);

  const handleDismiss = () => {
    markTooltipDismissed(id);
    setOpen(false);
    setShouldShow(false);
  };

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild className={cn("w-full", className)}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">{content}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


