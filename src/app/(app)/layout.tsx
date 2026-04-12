import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { KeyboardShortcutsProvider } from "@/components/layout/keyboard-shortcuts-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = await db.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar
        workspaceId={workspace?.id}
        workspaceName={workspace?.name ?? "My Workspace"}
      />
      <KeyboardShortcutsProvider>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {children}
        </div>
      </KeyboardShortcutsProvider>
    </div>
  );
}
