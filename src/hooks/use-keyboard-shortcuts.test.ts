import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

vi.mock("@/store/theme-store", () => ({
  useThemeStore: () => ({ toggleTheme: vi.fn() }),
}));

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, ...opts }),
  );
}

describe("useKeyboardShortcuts", () => {
  const callbacks = {
    onSearch: vi.fn(),
    onNewTask: vi.fn(),
    onEscape: vi.fn(),
    onViewChange: vi.fn(),
  };

  let cleanup: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup?.();
  });

  it("calls onSearch on Cmd+K", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(callbacks));
    cleanup = unmount;
    fireKey("k", { metaKey: true });
    expect(callbacks.onSearch).toHaveBeenCalledOnce();
  });

  it("calls onNewTask on Cmd+N", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(callbacks));
    cleanup = unmount;
    fireKey("n", { metaKey: true });
    expect(callbacks.onNewTask).toHaveBeenCalledOnce();
  });

  it("calls onEscape on Escape", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(callbacks));
    cleanup = unmount;
    fireKey("Escape");
    expect(callbacks.onEscape).toHaveBeenCalledOnce();
  });

  it("calls onViewChange with correct view for number keys", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(callbacks));
    cleanup = unmount;
    fireKey("1");
    expect(callbacks.onViewChange).toHaveBeenCalledWith("board");
    fireKey("5");
    expect(callbacks.onViewChange).toHaveBeenCalledWith("graph");
  });

  it("ignores number keys when meta is held", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(callbacks));
    cleanup = unmount;
    fireKey("1", { metaKey: true });
    expect(callbacks.onViewChange).not.toHaveBeenCalled();
  });
});
