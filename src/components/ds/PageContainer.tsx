import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MotionReveal } from "@/components/motion";

export type PageMaxWidth = "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";

const MAX_W: Record<PageMaxWidth, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-none",
};

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: PageMaxWidth;
  className?: string;
  /** vertical padding; set false when the page owns its own vertical rhythm (KDS full-height) */
  padded?: boolean;
}

/**
 * Standard container shared by AdminPageLayout and any full-bleed pages
 * that still need consistent horizontal gutters (e.g. KDS, PDV).
 */
export function PageContainer({
  children,
  maxWidth = "7xl",
  className,
  padded = true,
}: PageContainerProps) {
  return (
    <MotionReveal variant="fade" delay={0.1}>
      <div
        className={cn(
          "mx-auto w-full px-6 sm:px-8 lg:px-12 xl:px-16 transition-all duration-500",
          padded && "pt-10 md:pt-14 pb-16",
          MAX_W[maxWidth],
          className,
        )}
      >
        {children}
      </div>
    </MotionReveal>
  );
}