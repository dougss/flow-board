import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";
import type { ViewType } from "@/types";

const VIEW_KEY_MAP: Record<string, ViewType> = {
  "1": "board",
  "2": "list",
  "3": "table",
  "4": "timeline",
  "5": "graph",
};

interface KeyboardShortcutCallbacks {
  onSearch?: () => void;
  onNewTask?: () => void;
  onEscape?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onViewChange?: (view: ViewType) => void;
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function useKeyboardShortcuts(
  callbacks: KeyboardShortcutCallbacks,
): void {
  const { toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "k") {
        e.preventDefault();
        callbacks.onSearch?.();
        return;
      }

      if (isMeta && e.key === "n") {
        e.preventDefault();
        callbacks.onNewTask?.();
        return;
      }

      if (e.key === "Escape") {
        callbacks.onEscape?.();
        return;
      }

      if (isMeta && e.key.toLowerCase() === "z" && !isInputFocused()) {
        e.preventDefault();
        if (e.shiftKey) {
          callbacks.onRedo?.();
        } else {
          callbacks.onUndo?.();
        }
        return;
      }

      if (isMeta && e.shiftKey && e.key === "D") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (!isMeta && !e.shiftKey && !e.altKey && !isInputFocused()) {
        const view = VIEW_KEY_MAP[e.key];
        if (view) {
          callbacks.onViewChange?.(view);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callbacks, toggleTheme]);
}
