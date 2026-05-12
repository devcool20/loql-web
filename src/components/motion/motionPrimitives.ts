import type { Transition, Variants } from 'framer-motion';

export const iosEase = [0.22, 1, 0.36, 1] as const;
export const iosSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 38,
  mass: 0.9,
};

export const pageTransition: Transition = {
  duration: 0.42,
  ease: iosEase,
};

export const routeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const stackVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.992 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.996 },
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalCardVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 18 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 14 },
};

export const sheetVariants: Variants = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};
