"use client";

import { useState, useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useBoardStore } from "@/store/board-store";
import { SearchDialog } from "@/components/filters/search-dialog";

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [searchOpen, setSearchOpen] = useState(false);
  const { setActiveView, closeTaskDrawer } = useBoardStore();

  const onSearch = useCallback(() => setSearchOpen(true), []);
  const onEscape = useCallback(() => {
    if (searchOpen) {
      setSearchOpen(false);
      return;
    }
    closeTaskDrawer();
  }, [closeTaskDrawer, searchOpen]);

  useKeyboardShortcuts({
    onSearch,
    onEscape,
    onViewChange: setActiveView,
  });

  return (
    <>
      {children}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
