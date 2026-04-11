import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { taskId, content } = body;

  if (!taskId || !content) {
    return NextResponse.json(
      { error: "taskId and content are required" },
      { status: 400 },
    );
  }

  const comment = await db.$transaction(async (tx: any) => {
    const created = await tx.comment.create({
      data: { taskId, content },
    });

    await tx.activity.create({
      data: { taskId, action: "commented" },
    });

    return created;
  });

  return NextResponse.json(comment, { status: 201 });
}
