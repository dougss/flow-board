import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600 text-white shadow hover:bg-indigo-500",
        secondary:
          "border-transparent bg-zinc-700 text-zinc-100 hover:bg-zinc-600",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-500",
        outline: "border-border text-foreground",
        // Priority variants
        urgent:
          "border-transparent bg-red-600/20 text-red-400 border-red-600/30",
        high: "border-transparent bg-orange-600/20 text-orange-400 border-orange-600/30",
        medium:
          "border-transparent bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
        low: "border-transparent bg-blue-600/20 text-blue-400 border-blue-600/30",
        none: "border-transparent bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
        // Task type variants
        bug: "border-transparent bg-red-900/40 text-red-300 border-red-700/30",
        feature:
          "border-transparent bg-indigo-900/40 text-indigo-300 border-indigo-700/30",
        improvement:
          "border-transparent bg-emerald-900/40 text-emerald-300 border-emerald-700/30",
        task: "border-transparent bg-zinc-700/50 text-zinc-300 border-zinc-600/30",
        chore:
          "border-transparent bg-purple-900/40 text-purple-300 border-purple-700/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({
  className,
  variant,
  ...props
}: BadgeProps): React.JSX.Element => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
