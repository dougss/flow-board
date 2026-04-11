import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { columnIds } = body as { columnIds: string[] };

  if (!Array.isArray(columnIds) || columnIds.length === 0) {
    return NextResponse.json(
      { error: "columnIds is required" },
      { status: 400 },
    );
  }

  await db.$transaction(
    columnIds.map((id, index) =>
      db.column.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  return NextResponse.json({ success: true });
}
