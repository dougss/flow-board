import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const labels = await db.label.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(labels);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { workspaceId, name, color } = body;

  if (!workspaceId || !name || !color) {
    return NextResponse.json(
      { error: "workspaceId, name and color are required" },
      { status: 400 },
    );
  }

  const label = await db.label.create({
    data: { workspaceId, name, color },
  });

  return NextResponse.json(label, { status: 201 });
}
