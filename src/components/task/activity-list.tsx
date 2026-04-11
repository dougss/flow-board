"use client";

import { formatDistanceToNow } from "date-fns";
import { Plus, ArrowRight, Pencil, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types";

interface ActivityListProps {
  activities: Activity[];
}

const ACTION_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: (a: Activity) => string }
> = {
  created: {
    icon: Plus,
    color: "text-green-500 bg-green-50",
    label: () => "Task created",
  },
  moved: {
    icon: ArrowRight,
    color: "text-blue-500 bg-blue-50",
    label: (a) =>
      a.oldValue && a.newValue
        ? `Moved from ${a.oldValue} to ${a.newValue}`
        : "Task moved",
  },
  updated: {
    icon: Pencil,
    color: "text-yellow-500 bg-yellow-50",
    label: (a) =>
      a.field && a.oldValue && a.newValue
        ? `Updated ${a.field} from ${a.oldValue} to ${a.newValue}`
        : a.field
          ? `Updated ${a.field}`
          : "Task updated",
  },
  commented: {
    icon: MessageSquare,
    color: "text-purple-500 bg-purple-50",
    label: () => "Added a comment",
  },
};

const DEFAULT_CONFIG = {
  icon: Clock,
  color: "text-gray-500 bg-gray-100",
  label: (a: Activity) => a.action ?? "Activity",
};

export function ActivityList({ activities }: ActivityListProps) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (!sorted.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No activity yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {sorted.map((activity, idx) => {
        const config = ACTION_CONFIG[activity.action] ?? DEFAULT_CONFIG;
        const Icon = config.icon;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  config.color,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
            </div>

            <div className={cn("flex flex-col pb-4", isLast && "pb-0")}>
              <span className="text-sm">{config.label(activity)}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
