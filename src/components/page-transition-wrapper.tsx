"use client";

import { PageTransition } from './page-transition';
import { ReactNode } from 'react';

interface PageTransitionWrapperProps {
  children: ReactNode;
}

export function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  return <PageTransition>{children}</PageTransition>;
}



