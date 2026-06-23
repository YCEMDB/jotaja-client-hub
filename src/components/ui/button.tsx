import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-background border-2 border-ink shadow-[4px_4px_0_0_oklch(0.69_0.22_38)] hover:shadow-[6px_6px_0_0_oklch(0.69_0.22_38)] hover:-translate-x-0.5 hover:-translate-y-0.5",
        gradient:
          "bg-gradient-sunset text-white border-2 border-ink shadow-[4px_4px_0_0_oklch(0.15_0.02_30)] hover:shadow-[6px_6px_0_0_oklch(0.15_0.02_30)] hover:-translate-x-0.5 hover:-translate-y-0.5 [text-shadow:0_1px_0_rgb(0_0_0_/_25%)]",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-ink shadow-[4px_4px_0_0_oklch(0.15_0.02_30)] hover:shadow-[6px_6px_0_0_oklch(0.15_0.02_30)] hover:-translate-x-0.5 hover:-translate-y-0.5",
        outline:
          "border-2 border-ink bg-background text-ink shadow-[4px_4px_0_0_oklch(0.15_0.02_30)] hover:bg-ink hover:text-background hover:shadow-[6px_6px_0_0_oklch(0.69_0.22_38)] hover:-translate-x-0.5 hover:-translate-y-0.5",
        secondary:
          "bg-gradient-sunset text-white border-2 border-ink shadow-[4px_4px_0_0_oklch(0.15_0.02_30)] hover:shadow-[6px_6px_0_0_oklch(0.15_0.02_30)] hover:-translate-x-0.5 hover:-translate-y-0.5 [text-shadow:0_1px_0_rgb(0_0_0_/_25%)]",
        ghost: "text-ink hover:bg-ink hover:text-background rounded-lg",
        link: "text-ink underline-offset-4 underline decoration-2 decoration-brand-orange hover:decoration-brand-magenta",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
