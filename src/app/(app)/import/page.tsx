"use client";

import { useState } from "react";
import { Upload, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ImportStatus = "idle" | "previewing" | "importing" | "done" | "error";

interface ImportResult {
  projects: number;
  demands: number;
  labels: number;
  firstBoardId?: string;
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
  const [previewMsg, setPreviewMsg] = useState("");

  const handlePreview = async () => {
    setStatus("previewing");
    setPreviewMsg("");
    try {
      const r = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vaultPath }),
      });
      const data = await r.json();
      setPreviewMsg(
        data.message ?? `Found ${data.files ?? "?"} files at ${vaultPath}`,
      );
    } catch {
      setPreviewMsg(`Path: ${vaultPath}`);
    } finally {
      setStatus("idle");
    }
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
    <div className="flex flex-col h-full overflow-y-auto bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 flex-shrink-0">
        <Upload className="w-5 h-5 text-indigo-400" />
        <h1 className="text-zinc-100 font-semibold text-lg">
          Import from Obsidian
        </h1>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 text-xs font-medium">
              Vault Path
            </label>
            <input
              type="text"
              value={vaultPath}
              onChange={(e) => setVaultPath(e.target.value)}
              disabled={status === "importing"}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono"
            />
            {previewMsg && (
              <p className="text-zinc-500 text-xs mt-1">{previewMsg}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 text-xs font-medium">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={status === "importing"}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePreview}
              disabled={status === "importing" || status === "previewing"}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 hover:text-zinc-100 transition-colors disabled:opacity-50"
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

        {/* Progress */}
        {status === "importing" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Importing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Import complete</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-zinc-100">
                  {result.projects}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Projects</p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-zinc-100">
                  {result.demands}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Demands</p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-zinc-100">
                  {result.labels}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Labels</p>
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
