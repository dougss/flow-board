import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { boardId, name, color, wipLimit } = body;

  if (!boardId || !name) {
    return NextResponse.json(
      { error: "boardId and name are required" },
      { status: 400 },
    );
  }

  const lastColumn = await db.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = lastColumn ? lastColumn.position + 1 : 0;

  const column = await db.column.create({
    data: { boardId, name, color, wipLimit, position },
  });

  return NextResponse.json(column, { status: 201 });
}
