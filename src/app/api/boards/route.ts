import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const boards = await db.board.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(boards);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { projectId, name } = body;

  if (!projectId || !name) {
    return NextResponse.json(
      { error: "projectId and name are required" },
      { status: 400 },
    );
  }

  const board = await db.board.create({
    data: { projectId, name },
  });

  return NextResponse.json(board, { status: 201 });
}
