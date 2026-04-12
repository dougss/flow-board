"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { CreateProjectPopover } from "@/components/layout/create-project-popover";
import { CreateBoardPopover } from "@/components/layout/create-board-popover";
import { WorkspaceSettingsDialog } from "@/components/layout/workspace-settings-dialog";

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
  workspaceDescription?: string | null;
}

async function fetchProjects(workspaceId: string): Promise<Project[]> {
  const res = await fetch(`/api/projects?workspaceId=${workspaceId}`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json() as Promise<Project[]>;
}

export function Sidebar({
  workspaceId,
  workspaceName = "My Workspace",
  workspaceDescription,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => fetchProjects(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && projects.length > 0) {
      setExpandedProjects(new Set([projects[0].id]));
      initialized.current = true;
    }
  }, [projects]);

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

  // Close mobile sidebar on navigation
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      setMobileOpen(false);
      pathnameRef.current = pathname;
    }
  }, [pathname]);

  const sidebarContent = (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-screen flex-col bg-background border-r border-border overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
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
              className="text-foreground font-semibold text-base whitespace-nowrap"
            >
              FlowBoard
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Workspace */}
      <div className="px-3 py-3 border-b border-border">
        <button
          onClick={() => workspaceId && setWsSettingsOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-card hover:bg-accent/60 transition-colors cursor-pointer"
        >
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
                className="text-muted-foreground text-xs font-medium truncate"
              >
                {workspaceName}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {workspaceId && (
          <WorkspaceSettingsDialog
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            workspaceDescription={workspaceDescription}
            open={wsSettingsOpen}
            onOpenChange={setWsSettingsOpen}
          />
        )}
      </div>

      {/* Projects list */}
      <nav
        aria-label="Projects"
        className="flex-1 overflow-y-auto py-3 px-2 space-y-1"
      >
        {!collapsed && workspaceId && (
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide font-medium">
              Projects
            </span>
            <CreateProjectPopover workspaceId={workspaceId} />
          </div>
        )}
        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          return (
            <div key={project.id}>
              <button
                onClick={() => toggleProject(project.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
                {!collapsed && isExpanded && (
                  <CreateBoardPopover projectId={project.id} />
                )}
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
                              : "text-muted-foreground hover:text-foreground hover:bg-accent",
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
      <nav
        aria-label="Utilities"
        className="border-t border-border py-3 px-2 space-y-1"
      >
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
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
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
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs"
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
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent transition-colors"
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
      </nav>
    </motion.aside>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed top-3 left-3 z-50 md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-card border border-border shadow-lg text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 md:hidden"
          >
            <div className="relative">
              {sidebarContent}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebarContent}</div>
    </>
  );
}
