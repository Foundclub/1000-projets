"use client";

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoButtonProps {
  content: string;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg';
}

export function InfoButton({ 
  content, 
  className,
  side = 'top',
  size = 'sm'
}: InfoButtonProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "shadow-sm hover:shadow-md active:shadow-sm active:scale-[0.95] hover:scale-[1.05]",
              "bg-background/80 hover:bg-accent border border-border/50 hover:border-border",
              sizeClasses[size],
              className
            )}
            aria-label="Information"
          >
            <Info className={cn("w-3 h-3", size === 'md' && "w-4 h-4", size === 'lg' && "w-5 h-5")} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-primary/30 rounded-full blur-md animate-pulse"></div>
            <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-primary/30 rounded-full blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-xl pointer-events-none"></div>
            <p className="text-sm leading-relaxed relative z-10 font-medium">{content}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

