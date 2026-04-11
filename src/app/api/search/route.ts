import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const boardId = searchParams.get("boardId");

  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const tasks = await db.task.findMany({
    where: {
      ...(boardId && { boardId }),
      OR: [{ title: { contains: q } }, { description: { contains: q } }],
    },
    include: {
      column: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(tasks);
}
