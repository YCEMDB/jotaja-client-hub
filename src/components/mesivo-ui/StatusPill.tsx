import type { ReactNode } from "react";

type StatusPillProps = {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
  children: ReactNode;
  className?: string;
};

const TONE = {
  neutral: { bg: "var(--surface-2)",     fg: "var(--fg-hi)" },
  success: { bg: "var(--success-soft)",  fg: "var(--mesivo-leaf)" },
  warning: { bg: "var(--warning-soft)",  fg: "#8A5A00" },
  danger:  { bg: "var(--danger-soft)",   fg: "#8A1A1A" },
  info:    { bg: "var(--info-soft)",     fg: "#0F4C81" },
  accent:  { bg: "var(--mesivo-peach)",  fg: "var(--mesivo-tomato)" },
} as const;

/** StatusPill — pill de status usando tokens semânticos. */
export function StatusPill({ tone = "neutral", children, className }: StatusPillProps) {
  const c = TONE[tone];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        backgroundColor: c.bg,
        color: c.fg,
        fontFamily: "var(--font-ui)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );
}
