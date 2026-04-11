import { db } from "@/lib/db";
import { readdir, readFile } from "fs/promises";
import { NextResponse } from "next/server";
import os from "node:os";
import path from "node:path";
import yaml from "yaml";

interface Frontmatter {
  title?: string;
  status?: string;
  priority?: string;
  type?: string;
  requested_by?: string;
  assigned_to?: string;
  estimated_effort?: number;
  deadline?: string;
  tags?: string[];
  [key: string]: unknown;
}

function parseFrontmatter(content: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  const parts = content.split("---");
  if (parts.length < 3) {
    return { frontmatter: {}, body: content.trim() };
  }
  const frontmatter = yaml.parse(parts[1].trim()) as Frontmatter;
  const body = parts.slice(2).join("---").trim();
  return { frontmatter, body };
}

const IMPORT_COLUMNS = [
  { name: "Inbox", color: "#6b7280", position: 0 },
  { name: "Analyzing", color: "#3b82f6", position: 1 },
  { name: "Estimated", color: "#f59e0b", position: 2 },
  { name: "In Progress", color: "#8b5cf6", position: 3 },
  { name: "Delegated", color: "#7c3aed", position: 4 },
  { name: "Blocked", color: "#ef4444", position: 5 },
  { name: "Done", color: "#22c55e", position: 6 },
];

function mapStatus(status?: string): string {
  if (!status) return "Inbox";
  const normalized = status.toLowerCase();
  if (normalized.includes("done") || normalized.includes("conclu"))
    return "Done";
  if (normalized.includes("progress") || normalized.includes("andamento"))
    return "In Progress";
  if (normalized.includes("block") || normalized.includes("bloqueado"))
    return "Blocked";
  if (normalized.includes("delegat") || normalized.includes("delegado"))
    return "Delegated";
  if (normalized.includes("analyz") || normalized.includes("analise"))
    return "Analyzing";
  if (normalized.includes("estimat") || normalized.includes("estimado"))
    return "Estimated";
  return "Inbox";
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { vaultPath, workspaceName } = body as {
    vaultPath: string;
    workspaceName: string;
  };

  if (!vaultPath || !workspaceName) {
    return NextResponse.json(
      { error: "vaultPath and workspaceName are required" },
      { status: 400 },
    );
  }

  const resolvedPath = path.resolve(vaultPath.replace(/^~/, os.homedir()));
  const homeDir = os.homedir();
  if (!resolvedPath.startsWith(homeDir)) {
    return NextResponse.json(
      { error: "Path must be within home directory" },
      { status: 403 },
    );
  }

  const demandsDir = path.join(resolvedPath, "01-Demands");
  const projectsDir = path.join(resolvedPath, "02-Projects");

  const [demandFiles, projectFiles] = await Promise.all([
    readdir(demandsDir).catch(() => [] as string[]),
    readdir(projectsDir).catch(() => [] as string[]),
  ]);

  const mdDemands = demandFiles.filter((f) => f.endsWith(".md"));
  const mdProjects = projectFiles.filter((f) => f.endsWith(".md"));

  // Parse all files in parallel
  const [parsedDemands, parsedProjects] = await Promise.all([
    Promise.all(
      mdDemands.map(async (file) => {
        const raw = await readFile(path.join(demandsDir, file), "utf-8");
        return parseFrontmatter(raw);
      }),
    ),
    Promise.all(
      mdProjects.map(async (file) => {
        const raw = await readFile(path.join(projectsDir, file), "utf-8");
        return parseFrontmatter(raw);
      }),
    ),
  ]);

  // Collect all tags to create as labels
  const allTags = new Set<string>();
  for (const { frontmatter } of parsedDemands) {
    for (const tag of frontmatter.tags ?? []) {
      allTags.add(tag);
    }
  }

  const result = await db.$transaction(async (tx: any) => {
    const workspace = await tx.workspace.create({
      data: { name: workspaceName },
    });

    // Create projects from 02-Projects files
    const createdProjects = await Promise.all(
      parsedProjects.map(({ frontmatter, body }) =>
        tx.project.create({
          data: {
            workspaceId: workspace.id,
            name:
              (frontmatter.title as string | undefined) ?? "Untitled Project",
            description: body || undefined,
          },
        }),
      ),
    );

    // Default project for demands
    const defaultProject =
      createdProjects[0] ??
      (await tx.project.create({
        data: {
          workspaceId: workspace.id,
          name: "Demandas",
        },
      }));

    // Create the Demandas board
    const board = await tx.board.create({
      data: {
        projectId: defaultProject.id,
        name: "Demandas",
        columns: { create: IMPORT_COLUMNS },
      },
      include: { columns: true },
    });

    const columnByName = Object.fromEntries(
      board.columns.map((c: { id: string; name: string }) => [c.name, c]),
    );

    // Create labels from tags
    const labelByTag: Record<string, string> = {};
    for (const tag of allTags) {
      const label = await tx.label.create({
        data: {
          workspaceId: workspace.id,
          name: tag,
          color: "#6b7280",
        },
      });
      labelByTag[tag] = label.id;
    }

    // Create tasks from demands
    let taskCount = 0;
    for (const { frontmatter, body } of parsedDemands) {
      const statusName = mapStatus(frontmatter.status);
      const column = columnByName[statusName] ?? columnByName["Inbox"];

      const task = await tx.task.create({
        data: {
          boardId: board.id,
          columnId: column.id,
          title: (frontmatter.title as string | undefined) ?? "Untitled",
          description: body || undefined,
          status: column.name,
          priority: frontmatter.priority as string | undefined,
          type: frontmatter.type as string | undefined,
          requestedBy: frontmatter.requested_by as string | undefined,
          assignedTo: frontmatter.assigned_to as string | undefined,
          estimatedEffort:
            frontmatter.estimated_effort != null
              ? String(frontmatter.estimated_effort)
              : undefined,
          dueDate: frontmatter.deadline
            ? new Date(frontmatter.deadline as string)
            : undefined,
          position: taskCount,
        },
      });

      const tags = frontmatter.tags ?? [];
      if (tags.length > 0) {
        await tx.taskLabel.createMany({
          data: tags.map((tag) => ({
            taskId: task.id,
            labelId: labelByTag[tag],
          })),
        });
      }

      taskCount++;
    }

    return {
      imported: {
        projects: createdProjects.length,
        demands: taskCount,
        labels: allTags.size,
      },
    };
  });

  return NextResponse.json(result, { status: 201 });
}
