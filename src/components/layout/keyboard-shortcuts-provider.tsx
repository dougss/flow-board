"use client";

import { useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useBoardStore } from "@/store/board-store";
import { SearchDialog } from "@/components/filters/search-dialog";

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const {
    isSearchOpen,
    openSearch,
    closeSearch,
    setActiveView,
    closeTaskDrawer,
  } = useBoardStore();

  const onSearch = useCallback(() => openSearch(), [openSearch]);
  const onEscape = useCallback(() => {
    if (isSearchOpen) {
      closeSearch();
      return;
    }
    closeTaskDrawer();
  }, [closeTaskDrawer, closeSearch, isSearchOpen]);

  useKeyboardShortcuts({
    onSearch,
    onEscape,
    onViewChange: setActiveView,
  });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) openSearch();
      else closeSearch();
    },
    [openSearch, closeSearch],
  );

  return (
    <>
      {children}
      <SearchDialog open={isSearchOpen} onOpenChange={handleOpenChange} />
    </>
  );
}
