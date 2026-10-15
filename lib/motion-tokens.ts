import { Transition } from 'framer-motion';

/**
 * EasyUI-inspired spring and easing physics tokens.
 * Usage:
 * - button press: scale 0.97 with springSnappy
 * - popovers, dropdowns, modals: springSmooth with origin-aware expansion
 * - list and row expansion: springGentle
 * - color and border changes: easeFast
 * - cards: do NOT scale on hover; only border brightens to --border-strong
 */

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 170,
  damping: 26,
  mass: 0.9,
};

export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
  mass: 0.85,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.5,
};

export const springMorph: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 32,
  mass: 1.0,
};

export const springResponsive: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 24,
  mass: 0.7,
};

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 150,
  damping: 22,
  mass: 0.9,
};

export const easeSoft: Transition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
};

export const easeFast: Transition = {
  duration: 0.20,
  ease: [0.2, 0, 0, 1],
};
