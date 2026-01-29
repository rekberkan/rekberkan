import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0A0A0A] text-white [a&]:hover:bg-[#1a1a1a]",
        secondary:
          "border-transparent bg-[#F5F5F5] text-[#0A0A0A] [a&]:hover:bg-[#E8E8E8]",
        destructive:
          "border-transparent bg-red-100 text-red-700 [a&]:hover:bg-red-200",
        success:
          "border-transparent bg-green-100 text-green-700 [a&]:hover:bg-green-200",
        warning:
          "border-transparent bg-yellow-100 text-yellow-700 [a&]:hover:bg-yellow-200",
        info:
          "border-transparent bg-blue-100 text-blue-700 [a&]:hover:bg-blue-200",
        outline:
          "border-[#E8E8E8] bg-white text-[#737373] [a&]:hover:border-[#0A0A0A] [a&]:hover:text-[#0A0A0A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
