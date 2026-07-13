/**
 * Real SVG icons for dev prototypes — never emoji or unicode glyphs
 * (which can render as tofu/box on Linux/font-fallback contexts).
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size = 18, props: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export const IconSearch = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconMenu = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const IconBell = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
export const IconHelp = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
  </svg>
);
export const IconUser = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 5-6 8-6s7 2 8 6" />
  </svg>
);
export const IconPhone = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 5c0-1 1-2 2-2h2l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v2c0 1-1 2-2 2A16 16 0 0 1 4 5Z" />
  </svg>
);
export const IconMap = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
    <path d="M9 3v16M15 5v16" />
  </svg>
);
export const IconCheck = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);
export const IconAlert = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 3 2 21h20L12 3Z" />
    <path d="M12 10v5" />
    <circle cx="12" cy="18" r="0.5" fill="currentColor" />
  </svg>
);
export const IconPackage = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M3 7 12 3l9 4v10l-9 4-9-4V7Z" />
    <path d="M3 7l9 4 9-4M12 11v10" />
  </svg>
);
export const IconMoney = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 10v0M18 14v0" />
  </svg>
);
export const IconCard = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
export const IconPin = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
export const IconClock = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconImage = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 17-5-5-8 8" />
  </svg>
);
export const IconBurger = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 10a8 4 0 0 1 16 0" />
    <path d="M3 14h18M4 18h16" />
  </svg>
);
export const IconArrow = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
