import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTaskSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.string().default("task"),
  priority: z.string().default("none"),
  storyPoints: z.number().int().min(0).optional(),
  estimatedEffort: z.string().optional(),
  dueDate: z.string().optional(),
  requestedBy: z.string().optional(),
  assignedTo: z.string().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");
  const columnId = searchParams.get("columnId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const type = searchParams.get("type");
  const assignedTo = searchParams.get("assignedTo");
  const search = searchParams.get("search");
  const labelIds = searchParams.getAll("labelIds");

  const tasks = await db.task.findMany({
    where: {
      ...(boardId && { boardId }),
      ...(columnId && { columnId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(type && { type }),
      ...(assignedTo && { assignedTo }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(labelIds.length > 0 && {
        labels: { some: { labelId: { in: labelIds } } },
      }),
    },
    include: {
      labels: { include: { label: true } },
    },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    boardId,
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
  } = parsed.data;

  const column = await db.column.findUnique({
    where: { id: columnId },
    select: { name: true },
  });

  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  const task = await db.task.create({
    data: {
      boardId,
      columnId,
      title,
      description,
      type,
      priority,
      storyPoints,
      estimatedEffort,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      requestedBy,
      assignedTo,
      status: column.name,
      position: 0,
      activities: {
        create: {
          action: "created",
        },
      },
    },
    include: {
      labels: { include: { label: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
