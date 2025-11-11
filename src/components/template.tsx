"use client";

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TemplateProps {
  children: ReactNode;
}

const templateVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function Template({ children }: TemplateProps) {
  return (
    <motion.div
      variants={templateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}



