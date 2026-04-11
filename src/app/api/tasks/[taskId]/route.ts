import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<NextResponse> {
  const { taskId } = await params;

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      labels: { include: { label: true } },
      subtasks: true,
      dependenciesFrom: { include: { targetTask: true } },
      dependenciesTo: { include: { sourceTask: true } },
      comments: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<NextResponse> {
  const { taskId } = await params;
  const body = await request.json();

  const existing = await db.task.findUnique({
    where: { id: taskId },
    include: { column: { select: { name: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const {
    columnId,
    title,
    description,
    type,
    priority,
    storyPoints,
    estimatedEffort,
    dueDate,
    requestedBy,
    assignedTo,
    completedAt,
    labelIds,
  } = body;

  const activityCreates: Array<{
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
  }> = [];

  let newStatus = existing.status;

  if (columnId && columnId !== existing.columnId) {
    const newColumn = await db.column.findUnique({
      where: { id: columnId },
      select: { name: true },
    });
    if (newColumn) {
      newStatus = newColumn.name;
      activityCreates.push({
        action: "moved",
        field: "status",
        oldValue: existing.status,
        newValue: newStatus,
      });
    }
  }

  if (title && title !== existing.title) {
    activityCreates.push({
      action: "updated",
      field: "title",
      oldValue: existing.title,
      newValue: title,
    });
  }

  if (priority && priority !== existing.priority) {
    activityCreates.push({
      action: "updated",
      field: "priority",
      oldValue: existing.priority ?? undefined,
      newValue: priority,
    });
  }

  if (assignedTo !== undefined && assignedTo !== existing.assignedTo) {
    activityCreates.push({
      action: "updated",
      field: "assignedTo",
      oldValue: existing.assignedTo ?? undefined,
      newValue: assignedTo,
    });
  }

  const task = await db.$transaction(async (tx: any) => {
    if (labelIds !== undefined) {
      await tx.taskLabel.deleteMany({ where: { taskId } });
      if (labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: labelIds.map((labelId: string) => ({ taskId, labelId })),
        });
      }
    }

    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(columnId !== undefined && { columnId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(priority !== undefined && { priority }),
        ...(storyPoints !== undefined && { storyPoints }),
        ...(estimatedEffort !== undefined && { estimatedEffort }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(requestedBy !== undefined && { requestedBy }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(completedAt !== undefined && {
          completedAt: completedAt ? new Date(completedAt) : null,
        }),
        status: newStatus,
      },
      include: {
        labels: { include: { label: true } },
      },
    });

    if (activityCreates.length > 0) {
      await tx.activity.createMany({
        data: activityCreates.map((a) => ({ taskId, ...a })),
      });
    }

    return updated;
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<NextResponse> {
  const { taskId } = await params;

  await db.task.delete({ where: { id: taskId } });

  return NextResponse.json({ success: true });
}
