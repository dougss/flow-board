import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

const LABEL_DEFS = [
  { name: "Frontend", color: "#3b82f6" },
  { name: "Backend", color: "#22c55e" },
  { name: "Bug", color: "#ef4444" },
  { name: "Design", color: "#f59e0b" },
  { name: "Infra", color: "#8b5cf6" },
];

const COLUMN_DEFS = [
  { name: "Backlog", color: "#6b7280", position: 0 },
  { name: "To Do", color: "#3b82f6", position: 1 },
  { name: "In Progress", color: "#f59e0b", position: 2 },
  { name: "In Review", color: "#8b5cf6", position: 3 },
  { name: "Done", color: "#22c55e", position: 4 },
];

export async function POST(): Promise<NextResponse> {
  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const workspace = await tx.workspace.create({
      data: { name: "Leve Saúde" },
    });

    const labels = await Promise.all(
      LABEL_DEFS.map((l) =>
        tx.label.create({ data: { ...l, workspaceId: workspace.id } }),
      ),
    );

    const [frontend, backend, bug, design, infra] = labels;

    const project = await tx.project.create({
      data: {
        workspaceId: workspace.id,
        name: "Engineering",
        color: "#6366f1",
      },
    });

    const board = await tx.board.create({
      data: {
        projectId: project.id,
        name: "Sprint Board",
        columns: { create: COLUMN_DEFS },
      },
      include: { columns: true },
    });

    const colByName = Object.fromEntries(
      board.columns.map((c: { id: string; name: string }) => [c.name, c]),
    );

    // Create 10 tasks distributed across columns
    const taskDefs = [
      {
        title: "Setup CI/CD pipeline",
        columnName: "Done",
        type: "task",
        priority: "high",
        labelIds: [infra.id],
        position: 0,
      },
      {
        title: "Design system tokens",
        columnName: "Done",
        type: "task",
        priority: "medium",
        labelIds: [design.id, frontend.id],
        position: 1,
      },
      {
        title: "Auth service integration",
        columnName: "In Review",
        type: "story",
        priority: "high",
        labelIds: [backend.id],
        position: 0,
      },
      {
        title: "Fix login redirect loop",
        columnName: "In Review",
        type: "bug",
        priority: "critical",
        labelIds: [bug.id, frontend.id],
        position: 1,
      },
      {
        title: "Implement dashboard charts",
        columnName: "In Progress",
        type: "story",
        priority: "medium",
        labelIds: [frontend.id],
        position: 0,
      },
      {
        title: "API rate limiting",
        columnName: "In Progress",
        type: "task",
        priority: "high",
        labelIds: [backend.id, infra.id],
        position: 1,
      },
      {
        title: "Notification service",
        columnName: "To Do",
        type: "story",
        priority: "medium",
        labelIds: [backend.id],
        position: 0,
      },
      {
        title: "Mobile responsive nav",
        columnName: "To Do",
        type: "task",
        priority: "low",
        labelIds: [frontend.id, design.id],
        position: 1,
      },
      {
        title: "Database query optimisation",
        columnName: "Backlog",
        type: "task",
        priority: "medium",
        labelIds: [backend.id, infra.id],
        position: 0,
      },
      {
        title: "E2E test suite",
        columnName: "Backlog",
        type: "task",
        priority: "low",
        labelIds: [frontend.id, backend.id],
        position: 1,
      },
    ];

    const createdTasks = await Promise.all(
      taskDefs.map(({ columnName, labelIds, ...data }) => {
        const col = colByName[columnName];
        return tx.task.create({
          data: {
            boardId: board.id,
            columnId: col.id,
            status: col.name,
            ...data,
            labels: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          },
        });
      }),
    );

    const [, , authTask, , dashTask, , , , dbTask] = createdTasks;

    // A few dependencies
    await tx.taskDependency.createMany({
      data: [
        {
          sourceTaskId: dashTask.id,
          targetTaskId: authTask.id,
          type: "blocks",
        },
        {
          sourceTaskId: dbTask.id,
          targetTaskId: authTask.id,
          type: "relates_to",
        },
      ],
    });

    // A few comments
    await tx.comment.createMany({
      data: [
        {
          taskId: authTask.id,
          content: "Cognito tokens validated. Ready for final review.",
        },
        {
          taskId: dashTask.id,
          content: "Using Recharts — will align with design tokens.",
        },
        {
          taskId: createdTasks[3].id,
          content: "Reproduced on Safari. Root cause: redirect_uri mismatch.",
        },
      ],
    });

    return {
      workspace: workspace.id,
      project: project.id,
      board: board.id,
      tasks: createdTasks.length,
      labels: labels.length,
    };
  });

  return NextResponse.json(result, { status: 201 });
}
