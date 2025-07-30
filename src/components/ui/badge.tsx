// src/components/ui/badge.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Define the variants for the badge, adding new ones for distinct status colors
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Existing variants
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // New variants for order statuses
        // For 'Delivered'
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200 hover:bg-green-100/80 dark:hover:bg-green-800/40",
        // For 'Pending'
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200 hover:bg-yellow-100/80 dark:hover:bg-yellow-800/40",
        // For 'Processing'
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200 hover:bg-blue-100/80 dark:hover:bg-blue-800/40",
        // For 'Shipped' - using a teal/cyan color
        shipped:
          "border-transparent bg-cyan-100 text-cyan-800 dark:bg-cyan-800/30 dark:text-cyan-200 hover:bg-cyan-100/80 dark:hover:bg-cyan-800/40",
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
