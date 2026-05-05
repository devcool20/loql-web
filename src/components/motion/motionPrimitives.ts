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
  initial: { opacity: 0, y: 18, scale: 0.985, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, scale: 0.99, filter: 'blur(6px)' },
};

export const stackVariants: Variants = {
  initial: { opacity: 0, y: 36, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 24, scale: 0.99 },
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
