"use client";

import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useActivityQuery } from "@/hooks/use-activity";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  boardId: string;
}

const ACTION_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  status: { icon: CheckCircle2, color: "text-green-400" },
  priority: { icon: AlertTriangle, color: "text-yellow-400" },
  move: { icon: ArrowRight, color: "text-blue-400" },
  column: { icon: ArrowRight, color: "text-blue-400" },
};

const DEFAULT_CONFIG = { icon: Clock, color: "text-muted-foreground" };

function formatChange(
  action: string,
  field: string | null,
  oldValue: string | null,
  newValue: string | null,
): string {
  if (field && oldValue && newValue) {
    return `${field} changed from ${oldValue} to ${newValue}`;
  }
  if (field && newValue) {
    return `${field} set to ${newValue}`;
  }
  return action;
}

export function ActivityFeed({ boardId }: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useActivityQuery(boardId);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-muted-foreground text-xs font-medium mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Recent Activity
        </p>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-secondary animate-pulse rounded-lg h-10"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-muted-foreground text-xs font-medium mb-3 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5" />
        Recent Activity
      </p>
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-sm">No recent activity.</p>
      ) : (
        <div className="space-y-1">
          {activities.slice(0, 10).map((activity) => {
            const config =
              ACTION_CONFIG[activity.field ?? activity.action] ??
              DEFAULT_CONFIG;
            const Icon = config.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent/60 transition-colors"
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                    config.color,
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">
                    <span className="font-medium">{activity.task.title}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {formatChange(
                      activity.action,
                      activity.field,
                      activity.oldValue,
                      activity.newValue,
                    )}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 mt-0.5">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
