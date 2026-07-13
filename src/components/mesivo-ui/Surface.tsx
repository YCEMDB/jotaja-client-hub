import type { ElementType, HTMLAttributes, ReactNode } from "react";

/**
 * Componentes de layout tokenizados Mesivo (Onda A).
 *
 * NOTA de reaproveitamento:
 * - EmptyState / ErrorState / LoadingState JÁ EXISTEM em src/components/ds/.
 *   Reutilize-os no lugar de reimplementar. Nesta onda expomos apenas
 *   Surface / Container / Stack / Cluster / PageHeader / SectionHeader /
 *   StatusPill, que não têm equivalente direto tokenizado.
 */

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  level?: 0 | 1 | 2 | 3;
  bordered?: boolean;
  radius?: "none" | "md" | "lg" | "xl";
  children?: ReactNode;
};

const RADIUS = { none: 0, md: 10, lg: 16, xl: 24 } as const;

export function Surface({
  as: As = "div",
  level = 0,
  bordered = false,
  radius = "lg",
  style,
  children,
  ...rest
}: SurfaceProps) {
  const bg =
    level === 0
      ? "var(--surface)"
      : level === 1
        ? "var(--surface-1)"
        : level === 2
          ? "var(--surface-2)"
          : "var(--surface-3)";
  return (
    <As
      {...rest}
      style={{
        backgroundColor: bg,
        borderRadius: RADIUS[radius],
        border: bordered ? "1px solid var(--hairline)" : undefined,
        color: "var(--fg)",
        ...style,
      }}
    >
      {children}
    </As>
  );
}
