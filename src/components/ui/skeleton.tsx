import { cn } from "@/lib/utils";

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <div
    className={cn("animate-pulse rounded-lg bg-zinc-800", className)}
    {...props}
  />
);

export { Skeleton };
