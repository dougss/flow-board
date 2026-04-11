import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ labelId: string }> },
): Promise<NextResponse> {
  const { labelId } = await params;
  const body = await request.json();
  const { name, color } = body;

  const label = await db.label.update({
    where: { id: labelId },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
    },
  });

  return NextResponse.json(label);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ labelId: string }> },
): Promise<NextResponse> {
  const { labelId } = await params;

  await db.label.delete({ where: { id: labelId } });

  return NextResponse.json({ success: true });
}
