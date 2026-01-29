import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#0A0A0A] text-white hover:bg-[#1a1a1a] shadow-lg shadow-black/10",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/50",
        outline:
          "border-2 border-[#E8E8E8] bg-white text-[#0A0A0A] hover:border-[#0A0A0A] hover:bg-[#F5F5F5]",
        secondary:
          "bg-[#F5F5F5] text-[#0A0A0A] hover:bg-[#E8E8E8]",
        ghost:
          "text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]",
        link: "text-[#0A0A0A] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
