import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={`rounded-lg border-2 border-border/50 bg-card text-card-foreground shadow-lg shadow-black/5 ring-1 ring-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 ${className ?? ''}`} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={`p-4 border-b-2 border-border/30 rounded-t-lg bg-gradient-to-b from-card to-card/95 ${className ?? ''}`} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={`p-4 ${className ?? ''}`} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className ?? ''}`} {...props} />;
}


