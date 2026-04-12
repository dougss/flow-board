import { readdir, readFile, realpath } from "fs/promises";
import { NextResponse } from "next/server";
import os from "node:os";
import path from "node:path";
import yaml from "yaml";

interface Frontmatter {
  title?: string;
  status?: string;
  priority?: string;
  type?: string;
  tags?: string[];
  [key: string]: unknown;
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

function parseFrontmatter(content: string): Frontmatter {
  const parts = content.split("---");
  if (parts.length < 3) return {};
  return (yaml.parse(parts[1].trim()) as Frontmatter) ?? {};
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { vaultPath } = body as { vaultPath: string };

  if (!vaultPath) {
    return NextResponse.json(
      { error: "vaultPath is required" },
      { status: 400 },
    );
  }

  const rawPath = path.resolve(vaultPath.replace(/^~/, os.homedir()));
  const homeDir = os.homedir();
  let resolvedPath: string;
  try {
    resolvedPath = await realpath(rawPath);
  } catch {
    resolvedPath = rawPath;
  }
  const homeDirWithSep = homeDir.endsWith("/") ? homeDir : `${homeDir}/`;
  if (resolvedPath !== homeDir && !resolvedPath.startsWith(homeDirWithSep)) {
    return NextResponse.json(
      { error: "Path must be within home directory" },
      { status: 403 },
    );
  }

  const demandsDir = path.join(resolvedPath, "01-Demands");
  const projectsDir = path.join(resolvedPath, "02-Projects");

  const [demandFiles, projectFiles] = await Promise.allSettled([
    readdir(demandsDir),
    readdir(projectsDir),
  ]);

  const demands = demandFiles.status === "fulfilled" ? demandFiles.value : [];
  const projects =
    projectFiles.status === "fulfilled" ? projectFiles.value : [];

  const mdDemands = demands.filter((f) => f.endsWith(".md"));
  const mdProjects = projects.filter((f) => f.endsWith(".md"));

  const items: PreviewItem[] = [];
  const allTags = new Set<string>();

  const [parsedDemands, parsedProjects] = await Promise.allSettled([
    Promise.all(
      mdDemands.map(async (file) => {
        const raw = await readFile(path.join(demandsDir, file), "utf-8");
        const fm = parseFrontmatter(raw);
        for (const tag of fm.tags ?? []) allTags.add(tag);
        items.push({
          filename: file,
          title: fm.title ?? file.replace(".md", ""),
          status: fm.status ?? "unknown",
          priority: fm.priority ?? "none",
          type: fm.type ?? "task",
          tags: fm.tags ?? [],
          source: "demand",
        });
      }),
    ),
    Promise.all(
      mdProjects.map(async (file) => {
        const raw = await readFile(path.join(projectsDir, file), "utf-8");
        const fm = parseFrontmatter(raw);
        items.push({
          filename: file,
          title: fm.title ?? file.replace(".md", ""),
          status: fm.status ?? "active",
          priority: fm.priority ?? "none",
          type: "project",
          tags: fm.tags ?? [],
          source: "project",
        });
      }),
    ),
  ]);

  const errors: string[] = [];
  if (parsedDemands.status === "rejected")
    errors.push(`Failed to read demands: ${parsedDemands.reason}`);
  if (parsedProjects.status === "rejected")
    errors.push(`Failed to read projects: ${parsedProjects.reason}`);

  return NextResponse.json({
    items,
    summary: {
      demands: mdDemands.length,
      projects: mdProjects.length,
      labels: allTags.size,
      tags: [...allTags],
    },
    errors: errors.length > 0 ? errors : undefined,
  });
}
