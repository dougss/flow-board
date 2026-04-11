import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
): Promise<NextResponse> {
  const { commentId } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const comment = await db.comment.update({
    where: { id: commentId },
    data: { content },
  });

  return NextResponse.json(comment);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> },
): Promise<NextResponse> {
  const { commentId } = await params;

  await db.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ success: true });
}
