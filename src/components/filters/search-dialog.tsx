"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  status: string;
  priority: string;
  columnName: string;
  boardId: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
  none: "bg-zinc-600",
};

const RECENT_KEY = "flowboard:recent-searches";

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(query: string): void {
  try {
    const prev = getRecent().filter((q) => q !== query);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify([query, ...prev].slice(0, 8)),
    );
  } catch {
    // ignore
  }
}

export function SearchDialog({
  open,
  onOpenChange,
  boardId,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        if (boardId) params.set("boardId", boardId);
        const r = await fetch(`/api/search?${params}`);
        const data = await r.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, boardId]);

  const navigate = (result: SearchResult) => {
    saveRecent(query);
    setRecent(getRecent());
    onOpenChange(false);
    router.push(`/board/${result.boardId}?task=${result.id}`);
  };

  const runRecent = (q: string) => setQuery(q);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = results;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && list[selectedIndex]) {
      navigate(list[selectedIndex]);
    }
  };

  const showRecent = !query.trim() && recent.length > 0;
  const showEmpty = !loading && query.trim() && results.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 bg-zinc-900 border-zinc-800 max-w-xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks…"
            className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Recent searches */}
        {showRecent && (
          <div className="py-2">
            <p className="px-4 py-1 text-[10px] text-zinc-600 uppercase tracking-wide font-medium">
              Recent
            </p>
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => runRecent(q)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="py-2 max-h-80 overflow-y-auto">
            <p className="px-4 py-1 text-[10px] text-zinc-600 uppercase tracking-wide font-medium">
              Results
            </p>
            {results.map((result, i) => (
              <button
                key={result.id}
                onClick={() => navigate(result)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  i === selectedIndex ? "bg-zinc-800" : "hover:bg-zinc-800/60",
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    PRIORITY_COLORS[result.priority] ?? "bg-zinc-600",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {result.columnName}
                  </p>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 flex-shrink-0">
                  {result.status}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="flex flex-col items-center gap-2 py-10 text-zinc-600">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">No tasks found for &quot;{query}&quot;</p>
          </div>
        )}

        {/* Initial empty state */}
        {!query && !showRecent && (
          <div className="flex flex-col items-center gap-2 py-10 text-zinc-700">
            <Search className="w-8 h-8" />
            <p className="text-sm">Start typing to search tasks</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
