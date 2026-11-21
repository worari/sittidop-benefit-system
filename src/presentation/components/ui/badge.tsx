import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1877F2] text-white hover:bg-[#166fe5]",
        secondary:
          "border-[#283b5c] bg-[#1f2e4a] text-slate-200",
        destructive:
          "border-red-900/60 bg-red-950/50 text-red-300",
        outline: "text-slate-200 border-[#283b5c] bg-[#162136]",
        success:
          "border-emerald-800/60 bg-emerald-950/50 text-emerald-300",
        warning:
          "border-amber-800/60 bg-amber-950/50 text-amber-300",
        info:
          "border-blue-700/60 bg-blue-950/60 text-blue-300",
        purple:
          "border-purple-800/60 bg-purple-950/50 text-purple-300",
        gold:
          "border-amber-600/50 bg-amber-950/50 text-amber-300",
        army:
          "border-[#1877F2]/50 bg-[#1877F2]/20 text-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
