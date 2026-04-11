import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const DEFAULT_COLUMNS = [
  { name: "Inbox", color: "#6b7280", position: 0 },
  { name: "To Do", color: "#3b82f6", position: 1 },
  { name: "In Progress", color: "#f59e0b", position: 2 },
  { name: "In Review", color: "#8b5cf6", position: 3 },
  { name: "Blocked", color: "#ef4444", position: 4 },
  { name: "Delegated", color: "#7c3aed", position: 5 },
  { name: "Done", color: "#22c55e", position: 6 },
];

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const projects = await db.project.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    include: { boards: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { workspaceId, name, description, color } = body;

  if (!workspaceId || !name) {
    return NextResponse.json(
      { error: "workspaceId and name are required" },
      { status: 400 },
    );
  }

  const project = await db.project.create({
    data: {
      workspaceId,
      name,
      description,
      color,
      boards: {
        create: {
          name: "Default Board",
          columns: {
            create: DEFAULT_COLUMNS,
          },
        },
      },
    },
    include: {
      boards: {
        include: { columns: true },
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
