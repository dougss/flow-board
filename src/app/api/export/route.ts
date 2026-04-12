import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const boardId = req.nextUrl.searchParams.get("boardId");
  const format = req.nextUrl.searchParams.get("format") ?? "json";

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              labels: { include: { label: true } },
              subtasks: { select: { id: true, title: true, status: true } },
              comments: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
      project: true,
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const safeName = board.name.replace(/[^\w\s-]/g, "").trim() || "board";

  if (format === "csv") {
    const rows: string[] = [];
    rows.push(
      "Title,Status,Priority,Type,Assignee,Due Date,Story Points,Labels,Subtasks,Description",
    );

    for (const col of board.columns) {
      for (const task of col.tasks) {
        const labels = task.labels.map((tl) => tl.label.name).join("; ");
        const subtaskCount = task.subtasks.length;
        const escape = (s: string | null): string => {
          if (!s) return "";
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        };
        rows.push(
          [
            escape(task.title),
            escape(col.name),
            escape(task.priority),
            escape(task.type),
            escape(task.assignedTo),
            task.dueDate
              ? new Date(task.dueDate).toISOString().split("T")[0]
              : "",
            task.storyPoints?.toString() ?? "",
            escape(labels),
            subtaskCount.toString(),
            escape(task.description),
          ].join(","),
        );
      }
    }

    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}.csv"`,
      },
    });
  }

  // JSON format (default)
  const exportData = {
    board: {
      name: board.name,
      description: board.description,
      project: board.project?.name ?? null,
    },
    columns: board.columns.map((col) => ({
      name: col.name,
      color: col.color,
      tasks: col.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        type: task.type,
        status: col.name,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        storyPoints: task.storyPoints,
        labels: task.labels.map((tl) => tl.label.name),
        subtasks: task.subtasks.map((st) => ({
          title: st.title,
          status: st.status,
        })),
        comments: task.comments.map((c) => ({
          content: c.content,
          createdAt: c.createdAt,
        })),
      })),
    })),
    exportedAt: new Date().toISOString(),
  };

  return NextResponse.json(exportData, {
    headers: {
      "Content-Disposition": `attachment; filename="${safeName}.json"`,
    },
  });
}
