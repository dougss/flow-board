import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const workspaces = await db.workspace.findMany({
    include: {
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workspaces);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const workspace = await db.workspace.create({
    data: { name, description },
  });

  return NextResponse.json(workspace, { status: 201 });
}
