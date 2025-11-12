"use client";
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TutorialSlideProps {
  title: string;
  description: string | ReactNode;
  icon?: ReactNode;
  image?: string;
  className?: string;
}

export function TutorialSlide({ title, description, icon, image, className }: TutorialSlideProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6 p-6 sm:p-8", className)}>
      {/* Icon or Image */}
      <div className="flex-shrink-0">
        {image ? (
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-lg overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : icon ? (
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto flex items-center justify-center text-primary">
            {icon}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="text-center space-y-4 max-w-md">
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
          {title}
        </h3>
        <div className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
}

