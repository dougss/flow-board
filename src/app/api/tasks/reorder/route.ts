import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type TxClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const reorderSchema = z.object({
  taskId: z.string().min(1),
  columnId: z.string().min(1),
  position: z.number().int().min(0),
});

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { taskId, columnId, position } = parsed.data;

  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: { columnId: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const columnChanged = existing.columnId !== columnId;

  await db.$transaction(async (tx: TxClient) => {
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
