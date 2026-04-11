import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> },
): Promise<NextResponse> {
  const { boardId } = await params;

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              labels: {
                include: { label: true },
              },
            },
          },
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json(board);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
): Promise<NextResponse> {
  const { boardId } = await params;
  const body = await request.json();
  const { name, defaultView } = body;

  const board = await db.board.update({
    where: { id: boardId },
    data: {
      ...(name !== undefined && { name }),
      ...(defaultView !== undefined && { defaultView }),
    },
  });

  return NextResponse.json(board);
}
