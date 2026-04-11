import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function getWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(
    ((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7,
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [
    allTasks,
    overdueTasks,
    completedLast30,
    createdLast30,
    velocityTasks,
  ] = await Promise.all([
    db.task.findMany({
      where: { boardId },
      select: { status: true, priority: true, type: true },
    }),
    db.task.findMany({
      where: {
        boardId,
        dueDate: { lt: now },
        status: { not: "Done" },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        priority: true,
      },
    }),
    db.task.findMany({
      where: {
        boardId,
        completedAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, completedAt: true },
    }),
    db.task.count({
      where: {
        boardId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    db.task.findMany({
      where: {
        boardId,
        completedAt: { gte: eightWeeksAgo },
      },
      select: { completedAt: true },
    }),
  ]);

  type TaskSummary = {
    status: string;
    priority: string | null;
    type: string | null;
  };
  type VelocityTask = { completedAt: Date | null };

  const tasksByStatus = Object.entries(
    allTasks.reduce<Record<string, number>>(
      (acc: Record<string, number>, t: TaskSummary) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {},
    ),
  ).map(([status, count]) => ({ status, count }));

  const tasksByPriority = Object.entries(
    allTasks.reduce<Record<string, number>>(
      (acc: Record<string, number>, t: TaskSummary) => {
        const key = t.priority ?? "none";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    ),
  ).map(([priority, count]) => ({ priority, count }));

  const tasksByType = Object.entries(
    allTasks.reduce<Record<string, number>>(
      (acc: Record<string, number>, t: TaskSummary) => {
        const key = t.type ?? "none";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    ),
  ).map(([type, count]) => ({ type, count }));

  // Velocity — group completed tasks by ISO week
  const weekMap = velocityTasks.reduce<Record<string, number>>(
    (acc: Record<string, number>, t: VelocityTask) => {
      if (!t.completedAt) return acc;
      const label = getWeekLabel(t.completedAt);
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const velocity = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, completed]) => ({ week, completed }));

  // Avg lead time in days — reuse completedLast30 (already has createdAt + completedAt)
  type LeadTimeTask = { createdAt: Date; completedAt: Date | null };
  const leadTimes = completedLast30
    .filter((t: LeadTimeTask) => t.completedAt !== null)
    .map(
      (t: LeadTimeTask) =>
        (t.completedAt!.getTime() - t.createdAt.getTime()) / 86400000,
    );

  const avgLeadTime =
    leadTimes.length > 0
      ? leadTimes.reduce((a: number, b: number) => a + b, 0) / leadTimes.length
      : 0;

  return NextResponse.json({
    tasksByStatus,
    tasksByPriority,
    tasksByType,
    overdueTasks,
    completedLast30Days: completedLast30.length,
    createdLast30Days: createdLast30,
    velocity,
    avgLeadTime: Math.round(avgLeadTime * 10) / 10,
  });
}
