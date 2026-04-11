import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> },
): Promise<NextResponse> {
  const { columnId } = await params;
  const body = await request.json();
  const { name, color, position, wipLimit, isCollapsed } = body;

  const column = await db.column.update({
    where: { id: columnId },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(position !== undefined && { position }),
      ...(wipLimit !== undefined && { wipLimit }),
      ...(isCollapsed !== undefined && { isCollapsed }),
    },
  });

  return NextResponse.json(column);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ columnId: string }> },
): Promise<NextResponse> {
  const { columnId } = await params;

  const column = await db.column.findUnique({
    where: { id: columnId },
    include: {
      tasks: { select: { id: true } },
      board: {
        include: {
          columns: {
            orderBy: { position: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  const otherColumns = column.board.columns.filter(
    (c: { id: string }) => c.id !== columnId,
  );

  if (otherColumns.length === 0) {
    // Last column — delete tasks too
    await db.task.deleteMany({ where: { columnId } });
  } else {
    const firstColumn = otherColumns[0];
    await db.task.updateMany({
      where: { columnId },
      data: { columnId: firstColumn.id },
    });
  }

  await db.column.delete({ where: { id: columnId } });

  return NextResponse.json({ success: true });
}
