import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const tasks = await db.task.findMany({
    where: { assignedTo: { not: null } },
    select: { assignedTo: true },
    distinct: ["assignedTo"],
    orderBy: { assignedTo: "asc" },
  });

  const assignees = tasks
    .map((t) => t.assignedTo)
    .filter((a): a is string => a !== null);

  return NextResponse.json(assignees);
}
