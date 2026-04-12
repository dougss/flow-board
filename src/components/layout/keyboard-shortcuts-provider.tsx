"use client";

import { useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useBoardStore } from "@/store/board-store";
import { useUndoStore } from "@/store/undo-store";
import { SearchDialog } from "@/components/filters/search-dialog";

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const {
    isSearchOpen,
    isBulkMode,
    openSearch,
    closeSearch,
    clearSelection,
    setActiveView,
    closeTaskDrawer,
  } = useBoardStore();

  const onSearch = useCallback(() => openSearch(), [openSearch]);
  const onEscape = useCallback(() => {
    if (isSearchOpen) {
      closeSearch();
      return;
    }
    if (isBulkMode) {
      clearSelection();
      return;
    }
    closeTaskDrawer();
  }, [closeTaskDrawer, closeSearch, clearSelection, isSearchOpen, isBulkMode]);

  const { undo, redo } = useUndoStore();
  const onUndo = useCallback(() => undo(), [undo]);
  const onRedo = useCallback(() => redo(), [redo]);

  useKeyboardShortcuts({
    onSearch,
    onEscape,
    onUndo,
    onRedo,
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
