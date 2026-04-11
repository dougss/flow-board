"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  BarChart3,
  Upload,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";

interface Board {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  boards: Board[];
}

interface SidebarProps {
  workspaceId?: string;
  workspaceName?: string;
}

export function Sidebar({
  workspaceId,
  workspaceName = "My Workspace",
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/projects?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        if (data.projects?.length > 0) {
          setExpandedProjects(new Set([data.projects[0].id]));
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const bottomLinks = [
    { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { href: "/import", icon: Upload, label: "Import" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-screen flex-col bg-zinc-950 border-r border-zinc-800 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-white font-semibold text-base whitespace-nowrap"
            >
              FlowBoard
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Workspace */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-zinc-900">
          <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-400 text-xs font-bold">
              {workspaceName.charAt(0).toUpperCase()}
            </span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-zinc-300 text-xs font-medium truncate"
              >
                {workspaceName}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Projects list */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          return (
            <div key={project.id}>
              <button
                onClick={() => toggleProject(project.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <FolderKanban className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs font-medium truncate flex-1 text-left"
                    >
                      {project.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {isExpanded && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-4 mt-0.5 space-y-0.5"
                  >
                    {project.boards.map((board) => {
                      const isActive = pathname === `/board/${board.id}`;
                      return (
                        <Link
                          key={board.id}
                          href={`/board/${board.id}`}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                            isActive
                              ? "bg-indigo-600/20 text-indigo-400 font-medium"
                              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
                          )}
                        >
                          <LayoutGrid className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{board.name}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-zinc-800 py-3 px-2 space-y-1">
        {bottomLinks.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2 py-1.5 rounded-md text-xs transition-colors",
                isActive
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors text-xs"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 flex-shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xs whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
