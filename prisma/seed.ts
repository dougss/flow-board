import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.resolve(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main(): Promise<void> {
  console.log("Seeding database...");

  const workspace = await prisma.workspace.create({
    data: { name: "Leve Saúde", description: "Engineering workspace" },
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Engineering",
      color: "#6366f1",
    },
  });

  const board = await prisma.board.create({
    data: { name: "Sprint Board", projectId: project.id },
  });

  const columnDefs = [
    { name: "Backlog", color: "#6b7280", position: 0 },
    { name: "To Do", color: "#3b82f6", position: 1 },
    { name: "In Progress", color: "#f59e0b", position: 2 },
    { name: "In Review", color: "#8b5cf6", position: 3 },
    { name: "Done", color: "#22c55e", position: 4 },
  ];

  const columns = await Promise.all(
    columnDefs.map((col) =>
      prisma.column.create({ data: { ...col, boardId: board.id } }),
    ),
  );

  const [backlog, todo, inProgress, inReview, done] = columns;

  const labelDefs = [
    { name: "Frontend", color: "#3b82f6" },
    { name: "Backend", color: "#22c55e" },
    { name: "Bug", color: "#ef4444" },
    { name: "Design", color: "#f59e0b" },
    { name: "Infra", color: "#8b5cf6" },
  ];

  const labels = await Promise.all(
    labelDefs.map((l) =>
      prisma.label.create({ data: { ...l, workspaceId: workspace.id } }),
    ),
  );

  const [labelFE, labelBE, labelBug, labelDesign, labelInfra] = labels;

  const taskDefs = [
    {
      title: "Fix authentication token refresh",
      columnId: inProgress.id,
      status: inProgress.name,
      type: "bug",
      priority: "high",
      storyPoints: 3,
      dueDate: new Date(Date.now() + 3 * 86400000),
      labelIds: [labelBug.id, labelBE.id],
    },
    {
      title: "Implement dashboard charts",
      columnId: inProgress.id,
      status: inProgress.name,
      type: "feature",
      priority: "medium",
      storyPoints: 5,
      labelIds: [labelFE.id],
    },
    {
      title: "Setup CI/CD pipeline",
      columnId: todo.id,
      status: todo.name,
      type: "task",
      priority: "high",
      storyPoints: 8,
      labelIds: [labelInfra.id],
    },
    {
      title: "Design mobile navigation",
      columnId: backlog.id,
      status: backlog.name,
      type: "task",
      priority: "low",
      storyPoints: 3,
      labelIds: [labelDesign.id, labelFE.id],
    },
    {
      title: "Optimize database queries",
      columnId: inReview.id,
      status: inReview.name,
      type: "improvement",
      priority: "high",
      storyPoints: 5,
      labelIds: [labelBE.id],
    },
    {
      title: "Add email notification service",
      columnId: todo.id,
      status: todo.name,
      type: "feature",
      priority: "medium",
      storyPoints: 5,
      dueDate: new Date(Date.now() + 7 * 86400000),
      labelIds: [labelBE.id],
    },
    {
      title: "Refactor payment integration",
      columnId: backlog.id,
      status: backlog.name,
      type: "improvement",
      priority: "medium",
      storyPoints: 8,
      labelIds: [labelBE.id, labelInfra.id],
    },
    {
      title: "Create API documentation",
      columnId: done.id,
      status: done.name,
      type: "task",
      priority: "low",
      storyPoints: 2,
      completedAt: new Date(),
      labelIds: [labelBE.id],
    },
    {
      title: "Fix cart calculation bug",
      columnId: done.id,
      status: done.name,
      type: "bug",
      priority: "urgent",
      storyPoints: 1,
      completedAt: new Date(),
      labelIds: [labelBug.id, labelFE.id],
    },
    {
      title: "Implement search functionality",
      columnId: todo.id,
      status: todo.name,
      type: "feature",
      priority: "medium",
      storyPoints: 8,
      dueDate: new Date(Date.now() + 14 * 86400000),
      labelIds: [labelFE.id, labelBE.id],
    },
  ];

  const tasks = [];
  for (let i = 0; i < taskDefs.length; i++) {
    const { labelIds, ...taskData } = taskDefs[i];
    const task = await prisma.task.create({
      data: {
        ...taskData,
        boardId: board.id,
        position: i,
      },
    });
    for (const labelId of labelIds) {
      await prisma.taskLabel.create({
        data: { taskId: task.id, labelId },
      });
    }
    await prisma.activity.create({
      data: {
        taskId: task.id,
        action: "created",
      },
    });
    tasks.push(task);
  }

  // Dependencies
  await prisma.taskDependency.create({
    data: {
      sourceTaskId: tasks[1].id,
      targetTaskId: tasks[0].id,
      type: "blocked_by",
    },
  });
  await prisma.taskDependency.create({
    data: {
      sourceTaskId: tasks[5].id,
      targetTaskId: tasks[2].id,
      type: "blocked_by",
    },
  });
  await prisma.taskDependency.create({
    data: {
      sourceTaskId: tasks[9].id,
      targetTaskId: tasks[4].id,
      type: "relates_to",
    },
  });

  // Comments
  const commentDefs = [
    {
      taskId: tasks[0].id,
      content:
        "Tracked down the issue — refresh token is not being stored in httpOnly cookie.",
    },
    {
      taskId: tasks[0].id,
      content: "Fix deployed to staging. Needs QA sign-off.",
    },
    {
      taskId: tasks[1].id,
      content: "Using Recharts. Bar + line combo chart confirmed with design.",
    },
    {
      taskId: tasks[4].id,
      content:
        "Added indexes on beneficiary_id and created_at columns. Query time down 80%.",
    },
    {
      taskId: tasks[9].id,
      content: "Backend endpoint ready. FE integration starting tomorrow.",
    },
  ];

  for (const c of commentDefs) {
    await prisma.comment.create({ data: c });
    await prisma.activity.create({
      data: { taskId: c.taskId, action: "commented" },
    });
  }

  console.log("Seed complete!");
  console.log(`  Workspace: ${workspace.name}`);
  console.log(`  Project: ${project.name}`);
  console.log(`  Board: ${board.name} (id: ${board.id})`);
  console.log(`  Columns: ${columns.length}`);
  console.log(`  Labels: ${labels.length}`);
  console.log(`  Tasks: ${tasks.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
