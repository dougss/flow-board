import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import { TaskDrawer } from "@/components/task/task-drawer";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: { project: { select: { name: true } } },
  });

  if (!board) notFound();

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header
        boardId={boardId}
        title={board.name}
        projectName={board.project.name}
      />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ViewSwitcher boardId={boardId} />
      </div>
      <TaskDrawer boardId={boardId} />
    </div>
  );
}
