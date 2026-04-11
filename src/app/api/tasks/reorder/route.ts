import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { taskId, columnId, position } = body as {
    taskId: string;
    columnId: string;
    position: number;
  };

  if (!taskId || !columnId || position === undefined) {
    return NextResponse.json(
      { error: "taskId, columnId and position are required" },
      { status: 400 },
    );
  }

  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: { columnId: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const columnChanged = existing.columnId !== columnId;

  await db.$transaction(async (tx: any) => {
    // Shift tasks in destination column to make room
    await tx.task.updateMany({
      where: {
        columnId,
        id: { not: taskId },
        position: { gte: position },
      },
      data: { position: { increment: 1 } },
    });

    let newStatus = existing.status;
    if (columnChanged) {
      const newColumn = await tx.column.findUnique({
        where: { id: columnId },
        select: { name: true },
      });
      if (newColumn) {
        newStatus = newColumn.name;
      }
    }

    await tx.task.update({
      where: { id: taskId },
      data: { columnId, position, status: newStatus },
    });

    if (columnChanged) {
      await tx.activity.create({
        data: {
          taskId,
          action: "moved",
          field: "status",
          oldValue: existing.status,
          newValue: newStatus,
        },
      });
    }
  });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { labels: { include: { label: true } } },
  });

  return NextResponse.json(task);
}
