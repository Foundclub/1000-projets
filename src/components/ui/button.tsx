import React from 'react';
import Link from 'next/link';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:shadow-md active:scale-[0.98] transition-all duration-200 border-2 border-primary/20',
      outline: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98] transition-all duration-200',
      ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98] transition-all duration-200',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/30 hover:shadow-xl hover:shadow-destructive/40 active:shadow-md active:scale-[0.98] transition-all duration-200 border-2 border-destructive/20',
    };
    
    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`;
    
    if (asChild && 'href' in props) {
      const { href, ...linkProps } = props as { href: string } & typeof props;
      return (
        <Link
          href={href}
          className={classes}
          {...(linkProps as any)}
        />
      );
    }
    
    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

