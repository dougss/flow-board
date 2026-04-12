import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  const activities = await db.activity.findMany({
    where: { task: { boardId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      task: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(activities);
}
