/**
 * Motion tokens — Mesivo landing.
 *
 * Linguagem única de movimento (fluxo, entrada de pedidos, continuidade
 * da operação). Consumido pelos componentes em `src/components/motion/*`.
 *
 * Regras:
 * - Priorizar transform + opacity. Nunca animar filter continuamente.
 * - Curvas suaves com pequena sobreposição, sem bounce infantil.
 * - Durações curtas o suficiente para não bloquear a interação.
 */

// Curvas
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeSnap = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

// Durações (segundos)
export const dur = {
  micro: 0.18,
  quick: 0.28,
  base: 0.5,
  section: 0.6,
  hero: 0.75,
  // Fade curto usado quando o usuário pediu reduced motion.
  reduced: 0.12,
} as const;

// Delays escalonados do hero (segundos)
export const heroSequence = {
  background: 0,
  logo: 0.1,
  nav: 0.15,
  badge: 0.3,
  title: 0.4,
  titleLineStep: 0.12,
  subtitle: 0.7,
  buttons: 0.85,
  mockup: 0.95,
  notifications: 1.2,
} as const;

// Deslocamentos padrão (px)
export const shift = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
} as const;

// Stagger entre itens de listas (segundos)
export const stagger = {
  fast: 0.06,
  base: 0.08,
  slow: 0.12,
} as const;
