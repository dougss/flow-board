"use client";

import { Settings, Moon, Sun, Palette } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-zinc-950">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 flex-shrink-0">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h1 className="text-zinc-100 font-semibold text-lg">Settings</h1>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-zinc-400" />
            <p className="text-zinc-300 text-sm font-medium">Appearance</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-200 text-sm">Theme</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Switch between dark and light mode
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
          <p className="text-zinc-300 text-sm font-medium">
            Keyboard Shortcuts
          </p>
          <div className="space-y-2">
            {[
              { keys: "⌘K", desc: "Search tasks" },
              { keys: "⌘N", desc: "New task" },
              { keys: "⌘⇧D", desc: "Toggle theme" },
              { keys: "Esc", desc: "Close dialog / drawer" },
              {
                keys: "1-5",
                desc: "Switch view (board, list, table, timeline, graph)",
              },
            ].map(({ keys, desc }) => (
              <div key={keys} className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs">{desc}</span>
                <kbd className="text-zinc-500 text-[10px] font-mono bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
