import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-xs border border-[#1877F2]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-xs border border-red-600",
        outline:
          "border border-[#2e446b] bg-[#162136] text-slate-100 hover:bg-[#1f2f4d] hover:text-white",
        secondary:
          "border border-[#283b5c] bg-[#1f2e4a] text-slate-100 hover:bg-[#273a5e]",
        ghost: "hover:bg-[#1f2e4a] hover:text-white text-slate-200 border border-transparent",
        link: "text-blue-400 underline-offset-4 hover:underline border border-transparent",
        navy: "bg-[#1e3a8a] text-white hover:bg-[#1d4ed8] shadow-xs border border-blue-700",
        gold: "bg-amber-600 text-white font-medium hover:bg-amber-700 shadow-xs border border-amber-600",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
