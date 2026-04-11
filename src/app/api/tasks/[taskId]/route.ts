import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type TxClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const patchTaskSchema = z.object({
  columnId: z.string().min(1).optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  storyPoints: z.number().int().min(0).nullable().optional(),
  estimatedEffort: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  requestedBy: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

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

  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
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
  } = parsed.data;

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
      newValue: assignedTo ?? undefined,
    });
  }

  const task = await db.$transaction(async (tx: TxClient) => {
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

  try {
    await db.task.delete({ where: { id: taskId } });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
