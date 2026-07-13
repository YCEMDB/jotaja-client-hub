/**
 * Mesivo Design System — internal admin surface only.
 *
 * Regras:
 *  - Toda página administrativa (Admin + Super Admin + Auth) usa estes componentes.
 *  - Nada de wrapper local (`<div className="p-4 md:p-8">`), nada de cores hex inline.
 *  - Tokens semânticos: bg-card, text-ink, border-ink, bg-brand-*, shadow-brutal.
 *  - Ver docs/DESIGN_SYSTEM.md para inventário e exemplos.
 */

export { AdminPageLayout } from "@/components/AdminPageLayout";
export { PageContainer, type PageMaxWidth } from "./PageContainer";
export { Section, SectionHeader, SectionContent } from "./Section";
export { DashboardGrid } from "./DashboardGrid";
export { LoadingState } from "./LoadingState";
export { ErrorState } from "./ErrorState";
export { FilterBar, SearchBar } from "./FilterBar";
export { AuthShell } from "./AuthShell";
export { StatCard } from "@/components/app/StatCard";
export { EmptyState } from "@/components/app/EmptyState";
