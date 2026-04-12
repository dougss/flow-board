import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
): Promise<NextResponse> {
  const { workspaceId } = await params;

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { _count: { select: { projects: true } } },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
): Promise<NextResponse> {
  const { workspaceId } = await params;
  const body = await request.json();
  const { name, description } = body;

  const existing = await db.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const workspace = await db.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  });

  return NextResponse.json(workspace);
}
