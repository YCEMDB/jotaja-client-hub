import type { ElementType, HTMLAttributes, ReactNode } from "react";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  size?: "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
};

const MAX = { sm: 640, md: 768, lg: 1024, xl: 1200 } as const;

/** Container tokenizado, largura fluida com máximo por breakpoint. */
export function Container({
  as: As = "div",
  size = "lg",
  style,
  children,
  ...rest
}: ContainerProps) {
  return (
    <As
      {...rest}
      style={{
        maxWidth: MAX[size],
        marginInline: "auto",
        paddingInline: "clamp(16px, 4vw, 32px)",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </As>
  );
}

type StackProps = HTMLAttributes<HTMLDivElement> & { gap?: number };
export function Stack({ gap = 16, style, children, ...rest }: StackProps) {
  return (
    <div {...rest} style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}

type ClusterProps = HTMLAttributes<HTMLDivElement> & {
  gap?: number;
  align?: "start" | "center" | "end";
};
export function Cluster({ gap = 12, align = "center", style, children, ...rest }: ClusterProps) {
  return (
    <div
      {...rest}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: align,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
