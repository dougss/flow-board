import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { sourceTaskId, targetTaskId, type } = body;

  if (!sourceTaskId || !targetTaskId || !type) {
    return NextResponse.json(
      { error: "sourceTaskId, targetTaskId and type are required" },
      { status: 400 },
    );
  }

  const dependency = await db.taskDependency.create({
    data: { sourceTaskId, targetTaskId, type },
  });

  return NextResponse.json(dependency, { status: 201 });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db.taskDependency.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
