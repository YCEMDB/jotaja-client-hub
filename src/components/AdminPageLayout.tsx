import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { PageContainer } from "@/components/ds";
import { PageHeader } from "@/components/mesivo-ui";

type Accent = "orange" | "magenta" | "violet" | "amber";

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  accent?: Accent;
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  children: ReactNode;
  className?: string;
}

/**
 * Unified admin/super-admin page shell.
 * Handles container width, horizontal/vertical padding, and header spacing
 * so every page in the app follows the same grid.
 */
export function AdminPageLayout({
  title,
  subtitle,
  kicker,
  icon: Icon,
  actions,
  accent = "orange",
  maxWidth = "7xl",
  children,
  className,
}: AdminPageLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground selection:bg-copper selection:text-white", className)}>
      <PageContainer maxWidth={maxWidth}>
        <PageHeader 
          eyebrow={kicker}
          title={title}
          description={subtitle}
          actions={actions}
        />
        <div className="mt-12 transition-all duration-500 ease-in-out">
          {children}
        </div>
      </PageContainer>
    </div>
  );
}