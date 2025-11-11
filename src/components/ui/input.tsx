import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border-2 border-input/50 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring focus-visible:shadow-lg focus-visible:shadow-ring/20 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200 ${className ?? ''}`}
      {...props}
    />
  );
}

