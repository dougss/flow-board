import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AppHomePage() {
  const workspace = await db.workspace.findFirst({
    include: {
      projects: {
        include: {
          boards: {
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const firstBoard = workspace?.projects?.[0]?.boards?.[0];

  if (firstBoard) {
    redirect(`/board/${firstBoard.id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Welcome to FlowBoard
        </h1>
        <p className="text-zinc-500 text-sm max-w-sm">
          Create your first project to start organizing tasks and tracking
          progress.
        </p>
      </div>

      <a
        href="/import"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
      >
        Import from Obsidian
      </a>
    </div>
  );
}
