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
    <div className={cn("flex flex-col items-center justify-start sm:justify-center space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 min-h-full sm:min-h-0", className)}>
      {/* Icon or Image */}
      <div className="flex-shrink-0 mt-4 sm:mt-0">
        {image ? (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto rounded-lg overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : icon ? (
          <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto flex items-center justify-center text-primary">
            {icon}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="text-center space-y-3 sm:space-y-4 w-full max-w-md px-2 sm:px-0">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground px-2 sm:px-0">
          {title}
        </h3>
        <div className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed px-2 sm:px-0">
          {description}
        </div>
      </div>
    </div>
  );
}

