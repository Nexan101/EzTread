"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

// ── Shared variants ────────────────────────────────────────────────────

const VIEWPORT = { once: true, margin: "-80px" } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.65, ease: EASE } },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.55, ease: "easeOut" } },
};

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -36 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.65, ease: EASE } },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 36 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.65, ease: EASE } },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

export const staggerFastVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

// ── Reusable wrapper components ────────────────────────────────────────

type Div = HTMLMotionProps<"div">;

interface AnimProps extends Omit<Div, "variants" | "initial" | "whileInView" | "viewport"> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/** Fade in + rise from below — triggered when scrolled into view */
export function FadeUp({ children, delay = 0, className, ...rest }: AnimProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ duration: 0.65, ease: EASE, delay } as never}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Simple opacity fade — triggered when scrolled into view */
export function FadeIn({ children, delay = 0, className, ...rest }: AnimProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ duration: 0.55, ease: "easeOut", delay } as never}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Scale-up entrance */
export function ScaleUp({ children, delay = 0, className, ...rest }: AnimProps) {
  return (
    <motion.div
      variants={scaleUpVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ duration: 0.6, ease: EASE, delay } as never}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Slide in from left */
export function SlideLeft({ children, delay = 0, className, ...rest }: AnimProps) {
  return (
    <motion.div
      variants={slideLeftVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ duration: 0.65, ease: EASE, delay } as never}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Slide in from right */
export function SlideRight({ children, delay = 0, className, ...rest }: AnimProps) {
  return (
    <motion.div
      variants={slideRightVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ duration: 0.65, ease: EASE, delay } as never}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children using StaggerItem will stagger automatically */
export function Stagger({
  children,
  className,
  staggerDelay = 0.1,
  ...rest
}: AnimProps & { staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{ hidden: {}, show: { transition: { staggerChildren: staggerDelay } } }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Child element for use inside <Stagger> — fades up automatically */
export function StaggerItem({ children, className, ...rest }: AnimProps) {
  return (
    <motion.div variants={fadeUpVariants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/** Hero entrance — plays immediately on load (not scroll-triggered) */
export function HeroReveal({
  children,
  delay = 0,
  className,
  ...rest
}: AnimProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
