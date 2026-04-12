"use client";

import { create } from "zustand";

interface UndoAction {
  label: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

interface UndoState {
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  push: (action: UndoAction) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_STACK = 30;

export const useUndoStore = create<UndoState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  push: (action) =>
    set((state) => ({
      undoStack: [...state.undoStack, action].slice(-MAX_STACK),
      redoStack: [],
    })),

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    await action.undo();
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, action].slice(-MAX_STACK),
    }));
  },

  redo: async () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    await action.redo();
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, action].slice(-MAX_STACK),
    }));
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
}));
