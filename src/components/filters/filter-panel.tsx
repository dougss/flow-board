"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/store/board-store";

interface FilterPanelProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

const PRIORITIES = ["urgent", "high", "medium", "low", "none"] as const;
const TYPES = [
  "task",
  "bug",
  "feature",
  "improvement",
  "chore",
  "epic",
] as const;
interface Label {
  id: string;
  name: string;
  color: string;
}

export function FilterPanel({ boardId, open, onClose }: FilterPanelProps) {
  const { filters, updateFilters, resetFilters } = useBoardStore();
  const [labels, setLabels] = useState<Label[]>([]);

  useEffect(() => {
    fetch("/api/labels")
      .then((r) => r.json())
      .then((d) => setLabels(d.labels ?? []))
      .catch(() => {});
  }, []);

  const toggle = <T extends string>(key: keyof typeof filters, value: T) => {
    const current = (filters[key] as T[]) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilters({ [key]: next });
  };

  const activeCount = Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== "" && v != null,
  ).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden border-b border-zinc-800 bg-zinc-900"
        >
          <div className="px-4 py-3 flex items-start gap-6 flex-wrap">
            {/* Status */}
            <FilterGroup label="Status">
              {["todo", "in_progress", "in_review", "done"].map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={(filters.statuses ?? []).includes(s)}
                  onClick={() => toggle("statuses", s)}
                />
              ))}
            </FilterGroup>

            {/* Priority */}
            <FilterGroup label="Priority">
              {PRIORITIES.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  active={(filters.priorities ?? []).includes(p)}
                  onClick={() => toggle("priorities", p)}
                />
              ))}
            </FilterGroup>

            {/* Type */}
            <FilterGroup label="Type">
              {TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={(filters.types ?? []).includes(t)}
                  onClick={() => toggle("types", t)}
                />
              ))}
            </FilterGroup>

            {/* Labels */}
            <FilterGroup label="Labels">
              {labels.map((l) => (
                <Chip
                  key={l.id}
                  label={l.name}
                  active={(filters.labelIds ?? []).includes(l.id)}
                  onClick={() => toggle("labelIds", l.id)}
                  color={l.color}
                />
              ))}
            </FilterGroup>

            {/* Assignee */}
            <FilterGroup label="Assignee">
              <input
                type="text"
                value={filters.assignees[0] ?? ""}
                onChange={(e) =>
                  updateFilters({
                    assignees: e.target.value ? [e.target.value] : [],
                  })
                }
                placeholder="Name or email…"
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-36"
              />
            </FilterGroup>

            {/* Due Date */}
            <FilterGroup label="Due Date">
              <Chip
                label="Has Due Date"
                active={filters.hasDueDate === true}
                onClick={() =>
                  updateFilters({
                    hasDueDate: filters.hasDueDate === true ? null : true,
                  })
                }
              />
              <Chip
                label="No Date"
                active={filters.hasDueDate === false}
                onClick={() =>
                  updateFilters({
                    hasDueDate: filters.hasDueDate === false ? null : false,
                  })
                }
              />
            </FilterGroup>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-2 self-start pt-5">
              {activeCount > 0 && (
                <span className="text-xs bg-indigo-600 text-white rounded-full px-1.5 py-0.5">
                  {activeCount}
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={onClose}
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-1 flex-wrap">{children}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded-md text-xs transition-colors capitalize",
        active
          ? "bg-indigo-600 text-white"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
      )}
    >
      {color && (
        <span
          className="inline-block w-2 h-2 rounded-full mr-1"
          style={{ background: color }}
        />
      )}
      {label}
    </button>
  );
}
