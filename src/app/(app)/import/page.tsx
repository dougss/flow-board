"use client";

import { useState } from "react";
import {
  Upload,
  CheckCircle,
  ArrowRight,
  Loader2,
  FileText,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ImportStatus = "idle" | "previewing" | "importing" | "done" | "error";

interface ImportResult {
  projects: number;
  demands: number;
  labels: number;
  firstBoardId?: string;
}

interface PreviewItem {
  filename: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  tags: string[];
  source: "demand" | "project";
}

interface PreviewData {
  items: PreviewItem[];
  summary: {
    demands: number;
    projects: number;
    labels: number;
    tags: string[];
  };
  errors?: string[];
}

export default function ImportPage() {
  const [vaultPath, setVaultPath] = useState(
    "~/Documents/Obsidian-Mind/20-Areas/career/leve-saude",
  );
  const [workspaceName, setWorkspaceName] = useState("Leve Saúde");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const handlePreview = async () => {
    setStatus("previewing");
    setPreview(null);
    try {
      const r = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vaultPath }),
      });
      if (!r.ok) {
        const err = await r.json();
        setError(err.error ?? "Preview failed");
        setStatus("error");
        return;
      }
      const data: PreviewData = await r.json();
      setPreview(data);
    } catch {
      setError("Failed to connect to preview endpoint");
      setStatus("error");
      return;
    }
    setStatus("idle");
  };

  const handleImport = async () => {
    setStatus("importing");
    setProgress(0);
    setError("");

    // Simulate progress ticks while waiting
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 90));
    }, 400);

    try {
      const r = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vaultPath, workspaceName }),
      });
      clearInterval(interval);
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.message ?? "Import failed");
      }
      const data = await r.json();
      setProgress(100);
      setResult(data);
      setStatus("done");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0">
        <Upload className="w-5 h-5 text-indigo-400" />
        <h1 className="text-foreground font-semibold text-lg">
          Import from Obsidian
        </h1>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Vault Path
            </label>
            <input
              type="text"
              value={vaultPath}
              onChange={(e) => setVaultPath(e.target.value)}
              disabled={status === "importing"}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={status === "importing"}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePreview}
              disabled={status === "importing" || status === "previewing"}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:border-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {status === "previewing" ? "Checking…" : "Preview"}
            </button>

            <button
              onClick={handleImport}
              disabled={status === "importing" || status === "done"}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                "bg-indigo-600 hover:bg-indigo-500 text-white",
              )}
            >
              {status === "importing" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview table */}
        {preview && status !== "done" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-card-foreground text-sm font-medium">
                Preview ({preview.summary.demands} demands,{" "}
                {preview.summary.projects} projects, {preview.summary.labels}{" "}
                labels)
              </p>
              {preview.summary.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-xs">
                  {preview.summary.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                  {preview.summary.tags.length > 5 && (
                    <span className="text-[10px] text-muted-foreground/60">
                      +{preview.summary.tags.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>

            {preview.errors && preview.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400">
                {preview.errors.join("; ")}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-zinc-500 font-medium py-2 pr-3">
                      Source
                    </th>
                    <th className="text-left text-zinc-500 font-medium py-2 pr-3">
                      Title
                    </th>
                    <th className="text-left text-zinc-500 font-medium py-2 pr-3">
                      Status
                    </th>
                    <th className="text-left text-zinc-500 font-medium py-2 pr-3">
                      Priority
                    </th>
                    <th className="text-left text-zinc-500 font-medium py-2">
                      Tags
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item) => (
                    <tr
                      key={item.filename}
                      className="border-b border-border/50 hover:bg-accent/40 transition-colors"
                    >
                      <td className="py-2 pr-3">
                        {item.source === "demand" ? (
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </td>
                      <td className="py-2 pr-3 text-foreground max-w-[200px] truncate">
                        {item.title}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-400">
                        {item.priority}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="bg-secondary text-muted-foreground px-1 py-0.5 rounded text-[10px]"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-muted-foreground/60 text-[10px]">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress */}
        {status === "importing" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Importing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Success */}
        {status === "done" && result && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Import complete</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-foreground">
                  {result.projects}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">Projects</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-foreground">
                  {result.demands}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">Demands</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-foreground">
                  {result.labels}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">Labels</p>
              </div>
            </div>

            {result.firstBoardId && (
              <Link
                href={`/board/${result.firstBoardId}`}
                className="flex items-center gap-2 justify-center w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                Go to Board
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
