import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: ReactNode;
  /** columns at lg breakpoint; mobile is always 1, sm is 2 */
  cols?: 2 | 3 | 4;
  className?: string;
}

const LG: Record<NonNullable<DashboardGridProps["cols"]>, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * Standard responsive grid for KPI cards / dashboard tiles.
 */
export function DashboardGrid({ children, cols = 4, className }: DashboardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", LG[cols], className)}>
      {children}
    </div>
  );
}
